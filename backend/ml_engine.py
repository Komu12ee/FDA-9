from sklearn.ensemble import RandomForestRegressor
from sklearn.neighbors import NearestNeighbors
import pandas as pd
import numpy as np
from .data_manager import load_data

_model = None
_knn = None
_training_data = None
_feature_cols = [
    'CCTI', 'CCTI_sq', 'Momentum_12_1', 'Vol_30d', 'BM_w', 'Size_w',
    'Negative', 'Positive'
]

def initialize_model():
    global _model, _knn, _training_data
    if _model is not None:
        return

    print("Training ML Models...")
    df = load_data()
    
    # Drop rows missing target or features
    df_clean = df.dropna(subset=_feature_cols + ['ExcessRet']).copy()
    
    X = df_clean[_feature_cols]
    y = df_clean['ExcessRet']
    
    # Train RF
    rf = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1)
    rf.fit(X, y)
    
    # Train KNN
    knn = NearestNeighbors(n_neighbors=5)
    knn.fit(X)
    
    _model = rf
    _knn = knn
    _training_data = df_clean
    print("ML Models Ready.")

def predict_excess_return(inputs: dict):
    if _model is None:
        initialize_model()
    
    # inputs: {CCTI: val, Vol_30d: val, ...}
    # Ensure order matches internal feature_cols
    # CCTI_sq might need calculation if not provided
    
    ccti = inputs.get('CCTI', 0)
    ccti_sq = inputs.get('CCTI_sq', ccti**2)
    
    row = [
        ccti,
        ccti_sq,
        inputs.get('Momentum_12_1', 0),
        inputs.get('Vol_30d', 0),
        inputs.get('BM_w', 0),
        inputs.get('Size_w', 0),
        inputs.get('Negative', 0),
        inputs.get('Positive', 0)
    ]
    
    
    # Convert to DataFrame with feature names to avoid warnings
    X_in = pd.DataFrame([row], columns=_feature_cols)
    prediction = _model.predict(X_in)[0]
    
    # Neighbors
    distances, indices = _knn.kneighbors(X_in)
    similar_indices = indices[0]
    
    similar_filings = _training_data.iloc[similar_indices].copy()
    
    # Convert dates to string for JSON
    similar_filings['FILING_DATE'] = similar_filings['FILING_DATE'].dt.strftime('%Y-%m-%d')
    
    # Recalculate CCTI_sq just in case we need it? No, just return relevant columns
    result_cols = ['CoName', 'FILING_DATE', 'ACC_NUM', 'ExcessRet', 'CCTI']
    neighbors_list = similar_filings[result_cols].to_dict(orient='records')
    
    return {
        "predicted_excess_return": float(prediction),
        "similar_filings": neighbors_list
    }

def get_feature_importance():
    if _model is None:
        initialize_model()
        
    return [
        {"feature": name, "importance": float(imp)}
        for name, imp in zip(_feature_cols, _model.feature_importances_)
    ]
