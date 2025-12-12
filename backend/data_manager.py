import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
import os

# Global dataset cache
_df = None

def load_data(file_path: str = "final_with_CCTI.csv"):
    global _df
    if _df is not None:
        return _df
    
    if not os.path.exists(file_path):
        # Fallback for when running from inside backend dir
        if os.path.exists(f"../{file_path}"):
            file_path = f"../{file_path}"
        else:
            raise FileNotFoundError(f"Dataset {file_path} not found.")

    print("Loading dataset...")
    df = pd.read_csv(file_path)
    
    # Date Conversion
    if 'FILING_DATE' in df.columns:
        df['FILING_DATE'] = pd.to_datetime(df['FILING_DATE'])
        df['ym'] = df['FILING_DATE'].dt.to_period('M').astype(str) # String for JSON serialization
    
    # Numeric Columns to Impute
    numeric_cols = [
        'CCTI', 'Return_30D_new', 'ExcessRet', 'Vol_30d', 'Momentum_12_1', 
        'BM_w', 'Size_w', 'Negative', 'Positive', 'Uncertainty', 
        'Litigious', 'StrongModal', 'WeakModal', 'Constraining', 'CCTI_sq'
    ]
    
    # Ensure numeric
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Median Imputation
    imputer = SimpleImputer(strategy='median')
    # Filter only columns that exist
    valid_cols = [c for c in numeric_cols if c in df.columns]
    if valid_cols:
        df[valid_cols] = imputer.fit_transform(df[valid_cols])
    
    # Pre-calculate binning for heatmaps to save time on request
    # df['CCTI_Bin'] = pd.cut(df['CCTI'], bins=20, labels=False)

    _df = df
    print(f"Dataset loaded: {len(df)} rows.")
    return df

def get_unique_values(col_name: str):
    df = load_data()
    if col_name not in df.columns:
        return []
    return sorted(df[col_name].dropna().unique().tolist())

def filter_data(
    start_date: str = None, 
    end_date: str = None, 
    sics: list = None, 
    forms: list = None,
    market_conditions: list = None
):
    df = load_data()
    mask = pd.Series(True, index=df.index)
    
    if start_date:
        mask &= (df['FILING_DATE'] >= pd.to_datetime(start_date))
    if end_date:
        mask &= (df['FILING_DATE'] <= pd.to_datetime(end_date))
    
    if sics:
        mask &= (df['SIC'].isin(sics))
        
    if forms:
        mask &= (df['FORM_TYPE'].isin(forms))
        
    if market_conditions and 'MarketCondition' in df.columns:
        # 0=Expansion, 1=Recession. Input might be strings or ints.
        # Let's handle generic matching if frontend sends [0, 1]
        mask &= (df['MarketCondition'].isin(market_conditions))

    return df[mask]
