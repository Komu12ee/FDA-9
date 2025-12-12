import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.neighbors import NearestNeighbors
from datetime import datetime

# --- 1. PAGE CONFIGURATION ---
st.set_page_config(
    page_title="Interactive Dashboard — CCTI & Market Reaction Analysis",
    layout="wide",
    initial_sidebar_state="expanded",
    page_icon="📊"
)

# Custom CSS for professional look
st.markdown("""
<style>
    .reportview-container {
        background: #f0f2f6;
    }
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
    }
    h1, h2, h3 {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #0f172a;
    }
    .stButton>button {
        background-color: #2563eb;
        color: white;
        border-radius: 8px;
    }
    .stMetric {
        background-color: #ffffff;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    /* Force text color to black/dark for visibility on white background */
    .stMetric label {
        color: #333333 !important;
    }
    .stMetric [data-testid="stMetricValue"] {
        color: #0f172a !important;
    }
    .stMetric [data-testid="stMetricDelta"] {
        color: #16a34a !important; /* Green for delta, adjust if needed */
    }
</style>
""", unsafe_allow_html=True)

# --- 2. DATA LOADING & CACHING ---
@st.cache_data
def load_data():
    """Lengths and caches the dataset."""
    try:
        df = pd.read_csv("final_with_CCTI.csv")
        
        # Date Conversion
        df['FILING_DATE'] = pd.to_datetime(df['FILING_DATE'])
        df['ym'] = df['FILING_DATE'].dt.to_period('M')
        
        # Ensure numeric columns are actually numeric
        numeric_cols = [
            'CCTI', 'Return_30D_new', 'ExcessRet', 'Vol_30d', 'Momentum_12_1', 
            'BM_w', 'Size_w', 'Negative', 'Positive', 'Uncertainty', 
            'Litigious', 'StrongModal', 'WeakModal', 'Constraining', 'CCTI_sq'
        ]
        
        # Handle non-numeric coercion errors
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Impute missing values (Median Imputation)
        imputer = SimpleImputer(strategy='median')
        df[numeric_cols] = imputer.fit_transform(df[numeric_cols])
        
        return df
    except FileNotFoundError:
        st.error("Dataset 'final_with_CCTI.csv' not found. Please ensure it is in the same directory.")
        return pd.DataFrame() # Return empty to prevent cascading errors

df_raw = load_data()

if df_raw.empty:
    st.stop()

# --- 3. SIDEBAR FILTERS ---
st.sidebar.header("Global Filters")

# Date Range Filter
min_date = df_raw['FILING_DATE'].min()
max_date = df_raw['FILING_DATE'].max()
date_range = st.sidebar.date_input(
    "Select Date Range",
    value=(min_date, max_date),
    min_value=min_date,
    max_value=max_date
)

# SIC Filter
all_sics = sorted(df_raw['SIC'].dropna().unique().tolist())
# Default to ALL industries to avoid confusion
selected_sics = st.sidebar.multiselect("SIC Industry", all_sics, default=all_sics)
if not selected_sics:
    selected_sics = all_sics # Select all if cleared

# Form Type Filter
all_forms = sorted(df_raw['FORM_TYPE'].dropna().unique().tolist())
selected_forms = st.sidebar.multiselect("Form Type", all_forms, default=all_forms)
if not selected_forms:
    selected_forms = all_forms

# Market Condition Filter
# Assuming 0, 1. Mapping to Readable
conditions = {0: "Expansion (0)", 1: "Recession (1)"}
if 'MarketCondition' in df_raw.columns:
    df_raw['MarketCondition_Label'] = df_raw['MarketCondition'].map(conditions)
    all_conditions = list(conditions.values())
    selected_conditions = st.sidebar.multiselect("Market Condition", all_conditions, default=all_conditions)
else:
    selected_conditions = []

# --- APPLY FILTERS ---
mask = (
    (df_raw['FILING_DATE'] >= pd.to_datetime(date_range[0])) & 
    (df_raw['FILING_DATE'] <= pd.to_datetime(date_range[1])) &
    (df_raw['SIC'].isin(selected_sics)) &
    (df_raw['FORM_TYPE'].isin(selected_forms))
)

if 'MarketCondition' in df_raw.columns:
    mask &= (df_raw['MarketCondition_Label'].isin(selected_conditions))

df = df_raw[mask].copy()

st.title("Interactive Dashboard — CCTI & Market Reaction Analysis")
st.markdown("Explore how **Corporate Communication Text Complexity (CCTI)** and sentiment affect **30-day Excess Stock Returns**. This tool leverages Machine Learning to uncover nonlinear relationships.")

# --- 4. TOP METRICS ---
col1, col2, col3, col4 = st.columns(4)
col1.metric("Total Filings", f"{len(df):,}")
col2.metric("Avg CCTI", f"{df['CCTI'].mean():.2f}")
col3.metric("Avg Excess Return", f"{df['ExcessRet'].mean():.4f}")
col4.metric("Avg Volatility", f"{df['Vol_30d'].mean():.4f}")

st.markdown("---")

# --- 5. VISUALIZATIONS ---

# Layout Grid
col_left, col_right = st.columns(2)

# A) Chart 1 — CCTI Distribution Explorer
with col_left:
    st.subheader("📊 CCTI Distribution Explorer")
    bins = st.slider("Number of Bins", 10, 100, 50, key='bins')
    
    fig_hist = px.histogram(
        df, 
        x="CCTI", 
        nbins=bins,
        marginal="box", # Adds KDE-like boxplot
        title="Distribution of Corporate Communication Text Complexity (CCTI)",
        color_discrete_sequence=['#2563eb'],
        opacity=0.8
    )
    fig_hist.update_layout(xaxis_title="CCTI Score", yaxis_title="Count", plot_bgcolor="white")
    st.plotly_chart(fig_hist, use_container_width=True)
    st.caption("Distribution shows the spread of document complexity. The 'long tail' indicates highly complex outlier filings.")

# B) Chart 2 — Nonlinear Relationship: CCTI vs Excess Return
with col_right:
    st.subheader("📉 CCTI vs. Excess Return (Nonlinear)")
    
    # Volatility Filter for this chart specifically
    max_vol = df['Vol_30d'].max()
    vol_cutoff = st.slider("Filter: Max Volatility (30d)", 0.0, float(max_vol), float(max_vol), key='vol_cutoff')
    
    df_chart2 = df[df['Vol_30d'] <= vol_cutoff]
    
    # Subsample for Scatterplot performance if data > 5000
    if len(df_chart2) > 5000:
        df_scatter = df_chart2.sample(5000, random_state=42)
        st.caption(f"Showing random 5,000 points (filtered from {len(df_chart2)}) for performance.")
    else:
        df_scatter = df_chart2

    fig_scatter = px.scatter(
        df_scatter, 
        x="CCTI", 
        y="ExcessRet", 
        hover_data=['CoName', 'FILING_DATE', 'ACC_NUM'],
        opacity=0.5,
        trendline="lowess",
        trendline_color_override="red",
        title="CCTI vs Excess Returns (with lowess trend)",
        color_discrete_sequence=['#475569']
    )
    fig_scatter.update_layout(xaxis_title="CCTI (Complexity)", yaxis_title="30-Day Excess Return", plot_bgcolor="white")
    st.plotly_chart(fig_scatter, use_container_width=True)
    st.caption("The red trendline (LOESS) highlights the nonlinear relationship involving complexity and returns.")

st.markdown("---")

col_left_2, col_right_2 = st.columns(2)

# C) Chart 3 — Sentiment vs Complexity Heatmap
with col_left_2:
    st.subheader("🔥 Sentiment vs. Complexity Landscape")
    
    sentiment_vars = ['Negative', 'Positive', 'Uncertainty', 'Litigious', 'StrongModal', 'WeakModal', 'Constraining']
    selected_sentiment = st.selectbox("Select Sentiment Variable", sentiment_vars, index=0)
    
    # Create bins for CCTI
    df['CCTI_Bin'] = pd.cut(df['CCTI'], bins=20, labels=False)
    
    # Group by Bin and calculate mean sentiment/ExcessRet
    heatmap_data = df.groupby('CCTI_Bin')[[selected_sentiment, 'ExcessRet']].mean().reset_index()
    
    # We want a 2D representation. Let's bin Sentiment too for a proper heatmap matrix?
    # Or just a bar chart of Sentiment across CCTI bins? The prompt asks for heatmap.
    # Approach: X=CCTI Bins, Y=Quantiles of Sentiment, Color=Mean ExcessRet
    
    try:
        df['Sentiment_Bin'] = pd.qcut(df[selected_sentiment], q=10, labels=False, duplicates='drop')
        pivot_table = df.pivot_table(
            index='Sentiment_Bin', 
            columns='CCTI_Bin', 
            values='ExcessRet', 
            aggfunc='mean'
        )
        
        fig_heat = px.imshow(
            pivot_table,
            labels=dict(x="CCTI Bins (Low -> High)", y=f"{selected_sentiment} Deciles (Low -> High)", color="Avg ExcessRet"),
            color_continuous_scale="RdBu",
            title=f"Interaction: {selected_sentiment} x Complexity -> Excess Return"
        )
        fig_heat.update_layout(height=400)
        st.plotly_chart(fig_heat, use_container_width=True)
        st.caption("Color represents average Excess Return. Blue = Positive Return, Red = Negative Return.")
        
    except Exception as e:
        st.warning(f"Not enough data variations to generate heatmap for {selected_sentiment}. Try a different variable or larger date range.")

# D) Chart 4 — Feature Importance (Random Forest)
with col_right_2:
    st.subheader("🌐 ML Feature Importance (Random Forest)")
    
    features = [
        'CCTI', 'CCTI_sq', 'Momentum_12_1', 'Vol_30d', 'BM_w', 'Size_w',
        'Negative', 'Positive', 'Uncertainty', 'Litigious', 'StrongModal', 'WeakModal', 'Constraining'
    ]
    target = 'ExcessRet'
    
    if st.button("Train Feature Importance Model"):
        with st.spinner("Training Random Forest..."):
            X = df[features]
            y = df[target]
            
            rf = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42)
            rf.fit(X, y)
            
            importances = pd.DataFrame({
                'Feature': features,
                'Importance': rf.feature_importances_
            }).sort_values(by='Importance', ascending=True)
            
            fig_imp = px.bar(
                importances, 
                x='Importance', 
                y='Feature', 
                orientation='h',
                title="What drives Excess Returns?",
                color='Importance',
                color_continuous_scale='Viridis'
            )
            fig_imp.update_layout(height=400)
            st.plotly_chart(fig_imp, use_container_width=True)
    else:
        st.info("Click the button to train the model and view feature importances.")

st.markdown("---")

# --- 6. PREDICTION SIMULATOR ---
st.header("🤖 Prediction Simulator & 'What-If' Analysis")

with st.expander("Usage Guide", expanded=False):
    st.write("Adjust the sliders below to simulate a theoretical company filing profile. The model will predict the expected stock return and find similar historical filings.")

# Prepare Model for Simulator (Train on ALL data for best results)
@st.cache_resource
def train_simulation_model(df_in):
    feats = [
        'CCTI', 'CCTI_sq', 'Momentum_12_1', 'Vol_30d', 'BM_w', 'Size_w',
        'Negative', 'Positive'
    ]
    # Simple imputation just in case
    df_clean = df_in.dropna(subset=feats + ['ExcessRet'])
    
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(df_clean[feats], df_clean['ExcessRet'])
    
    knn = NearestNeighbors(n_neighbors=5)
    knn.fit(df_clean[feats])
    
    return model, knn, df_clean

sim_model, sim_knn, df_sim_data = train_simulation_model(df_raw) # Use raw data for broader simulator context

# Simulator UI
col_sim_1, col_sim_2, col_sim_3 = st.columns([1, 1, 2])

with col_sim_1:
    st.markdown("### 1. Complexity")
    s_ccti = st.slider("CCTI Score", float(df_sim_data['CCTI'].min()), float(df_sim_data['CCTI'].max()), float(df_sim_data['CCTI'].median()))
    s_ccti_sq = s_ccti ** 2 # Auto-calculate
    
    st.markdown("### 2. Market")
    s_vol = st.slider("Volatility (Vol_30d)", float(df_sim_data['Vol_30d'].min()), float(df_sim_data['Vol_30d'].max()), float(df_sim_data['Vol_30d'].median()))
    s_mom = st.slider("Momentum_12_1", float(df_sim_data['Momentum_12_1'].min()), float(df_sim_data['Momentum_12_1'].max()), float(df_sim_data['Momentum_12_1'].median()))

with col_sim_2:
    st.markdown("### 3. Financials")
    s_bm = st.slider("Book-to-Market (BM_w)", float(df_sim_data['BM_w'].min()), float(df_sim_data['BM_w'].max()), float(df_sim_data['BM_w'].median()))
    s_size = st.slider("Size (Size_w)", float(df_sim_data['Size_w'].min()), float(df_sim_data['Size_w'].max()), float(df_sim_data['Size_w'].median()))
    
    st.markdown("### 4. Sentiment")
    s_neg = st.slider("Negative Words", float(df_sim_data['Negative'].min()), float(df_sim_data['Negative'].max()), float(df_sim_data['Negative'].median()))
    s_pos = st.slider("Positive Words", float(df_sim_data['Positive'].min()), float(df_sim_data['Positive'].max()), float(df_sim_data['Positive'].median()))

# Running Prediction
input_vector = np.array([[s_ccti, s_ccti_sq, s_mom, s_vol, s_bm, s_size, s_neg, s_pos]])

predicted_ret = sim_model.predict(input_vector)[0]

# Finding Neighbors
distances, indices = sim_knn.kneighbors(input_vector)
similar_filings = df_sim_data.iloc[indices[0]]

with col_sim_3:
    st.markdown("### 🔮 Prediction Result")
    
    delta_color = "normal"
    if predicted_ret > 0: delta_color = "normal" # Green handled by metric? No default is green for positive
    st.metric(
        label="Predicted 30-Day Excess Return", 
        value=f"{predicted_ret:.4f}",
        delta=f"{predicted_ret*100:.2f}%"
    )
    
    st.markdown("### 🕰️ Most Similar Historical Filings")
    st.dataframe(
        similar_filings[['CoName', 'FILING_DATE', 'CCTI', 'ExcessRet', 'Vol_30d']].style.format({
            'CCTI': '{:.2f}',
            'ExcessRet': '{:.4f}',
            'Vol_30d': '{:.4f}'
        }),
        use_container_width=True
    )

# --- 7. EXPORT DATA ---
st.markdown("---")
st.header("📥 Export Analysis")

csv = df.to_csv(index=False).encode('utf-8')
st.download_button(
    "Download Filtered Dataset (CSV)",
    csv,
    "filtered_ccti_data.csv",
    "text/csv",
    key='download-csv'
)
