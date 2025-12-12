from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import pandas as pd
import numpy as np

from .data_manager import load_data, filter_data, get_unique_values
from .ml_engine import predict_excess_return, get_feature_importance, initialize_model

app = FastAPI(title="CCTI Dashboard API")

# Allow CORS for React Frontend (usually runs on port 5173 for Vite)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Logic on Startup
@app.on_event("startup")
async def startup_event():
    load_data()
    initialize_model()

# --- Schemas ---
class FilterRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    sics: Optional[List[float]] = None # SIC can be float/int in pandas
    forms: Optional[List[str]] = None
    market_conditions: Optional[List[int]] = None

class PredictionRequest(BaseModel):
    CCTI: float
    Vol_30d: float
    Momentum_12_1: float
    BM_w: float
    Size_w: float
    Negative: float
    Positive: float

# --- Routes ---

@app.get("/api/init_filters")
def get_init_filters():
    df = load_data()
    return {
        "min_date": df['FILING_DATE'].min().strftime('%Y-%m-%d'),
        "max_date": df['FILING_DATE'].max().strftime('%Y-%m-%d'),
        "sics": get_unique_values('SIC'),
        "forms": get_unique_values('FORM_TYPE'),
        "market_conditions": [0, 1] if 'MarketCondition' in df.columns else []
    }

@app.post("/api/metrics")
def get_metrics(filters: FilterRequest):
    df_f = filter_data(
        filters.start_date, filters.end_date, 
        filters.sics, filters.forms, filters.market_conditions
    )
    
    return {
        "total_filings": len(df_f),
        "avg_ccti": float(df_f['CCTI'].mean()) if not df_f.empty else 0,
        "avg_excess_ret": float(df_f['ExcessRet'].mean()) if not df_f.empty else 0,
        "avg_vol": float(df_f['Vol_30d'].mean()) if not df_f.empty else 0
    }

@app.post("/api/charts/ccti_distribution")
def get_ccti_hist(filters: FilterRequest, bins: int = 50):
    df_f = filter_data(
        filters.start_date, filters.end_date, 
        filters.sics, filters.forms, filters.market_conditions
    )
    if df_f.empty:
        return []
        
    # Histogram calculation using numpy for speed
    counts, bin_edges = np.histogram(df_f['CCTI'].dropna(), bins=bins)
    
    # Format for Recharts: [{range: "-2.0 to -1.9", count: 50}, ...]
    result = []
    for i in range(len(counts)):
        label = f"{bin_edges[i]:.2f}"
        result.append({
            "bin": label,
            "count": int(counts[i])
        })
    return result

@app.post("/api/charts/heatmap")
def get_heatmap(filters: FilterRequest, sentiment_col: str):
    df_f = filter_data(
        filters.start_date, filters.end_date, 
        filters.sics, filters.forms, filters.market_conditions
    )
    if df_f.empty:
        return []
    
    # 10x10 Grid: CCTI Bins (X) vs Sentiment Quantiles (Y)
    try:
        df_f['CCTI_Bin'] = pd.cut(df_f['CCTI'], bins=10, labels=False)
        df_f['Sent_Bin'] = pd.qcut(df_f[sentiment_col], q=10, labels=False, duplicates='drop')
        
        heatmap_data = df_f.groupby(['Sent_Bin', 'CCTI_Bin'])['ExcessRet'].mean().reset_index()
        
        # Convert to matrix format for Plotly Heatmap
        # Z values (ExcessRet)
        z = np.zeros((10, 10))
        z[:] = np.nan
        
        for _, row in heatmap_data.iterrows():
            r = int(row['Sent_Bin'])
            c = int(row['CCTI_Bin'])
            if 0 <= r < 10 and 0 <= c < 10:
                z[r][c] = row['ExcessRet']
        
        # Replace NaNs
        z = np.nan_to_num(z, nan=0)
        
        return {
            "z": z.tolist(),
            "x": [f"Decile {i+1}" for i in range(10)], # CCTI
            "y": [f"Decile {i+1}" for i in range(10)]  # Sentiment
        }
        
    except Exception as e:
        print(f"Heatmap Error: {e}")
        return {"z": [], "x": [], "y": []}

@app.post("/api/charts/scatter")
def get_scatter(filters: FilterRequest, vol_cutoff: float = 100.0):
    df_f = filter_data(
        filters.start_date, filters.end_date, 
        filters.sics, filters.forms, filters.market_conditions
    )
    
    # Filter by Volatility
    df_f = df_f[df_f['Vol_30d'] <= vol_cutoff]
    
    # Sample down to 2000 points for frontend rendering performance
    if len(df_f) > 2000:
        df_f = df_f.sample(2000, random_state=42)
        
    # Statsmodels Lowess
    import statsmodels.api as sm
    
    lowess = sm.nonparametric.lowess
    # Sort by CCTI for plotting
    df_sorted = df_f.sort_values(by='CCTI')
    
    # Calculate Trendline (using subsample for speed if needed, but 2000 is fine)
    z = lowess(df_sorted['ExcessRet'], df_sorted['CCTI'], frac=0.1)
    
    # Stringify date for JSON safety
    df_sorted['FILING_DATE'] = df_sorted['FILING_DATE'].dt.strftime('%Y-%m-%d')
    
    # Return more details for the "Filing Details Card"
    cols_to_return = [
        'CCTI', 'ExcessRet', 'CoName', 'FILING_DATE', 'ACC_NUM',
        'Vol_30d', 'Momentum_12_1', 'BM_w', 'Size_w', 'Negative', 'Positive',
        'FORM_TYPE'
    ]
    # Ensure they exist (handle missing columns gracefully if dataset changes)
    cols_to_return = [c for c in cols_to_return if c in df_sorted.columns]
    
    data_points = df_sorted[cols_to_return].to_dict(orient='records')
    trend_points = [{"CCTI": x, "Trend": y} for x, y in z]
    
    return {
        "points": data_points,
        "trend": trend_points
    }

@app.get("/api/feature_importance")
def get_features():
    return get_feature_importance()

@app.post("/api/predict")
def predict(request: PredictionRequest):
    return predict_excess_return(request.dict())
