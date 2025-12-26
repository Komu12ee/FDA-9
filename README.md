# Nonlinear Effects of Text Complexity in Corporate Disclosures (FDA-9)
**Evidence from a New CCTI Index and Machine Learning Models**

> **🌐 Live Demo:** [View Deployment](https://vercel.com/sahukomendra721-6848s-projects/fda-9-yiw6)  
> *Note: If the link is not working, the backend service may be in sleep mode. Please contact me to restart it.*

## 📊 Executive Summary
This project investigates the predictive power of textual complexity in corporate disclosures (10-K/10-Q filings) on stock excess returns. Breaking away from traditional sentiment analysis, we introduce the **Corporate Communication Text Complexity Index (CCTI)**. 

Our research demonstrates that while linguistic tone fails to explain short-term market reactions ($R^2 \approx 0$), the structural complexity of filings exhibits a robust **nonlinear** relationship with returns. This repository contains the code for the analysis, a Machine Learning prediction engine, and interactive dashboards to visualize these findings.

---

## 🚀 Key Features
- **CCTI Index**: A novel metric capturing "Noise" (HTML/XBRL artifacts) and "Density" (linguistic depth) in financial documents.
- **Interactive Dashboard (Streamlit)**: Explore the relationship between CCTI and Excess Returns with interactive scatter plots and heatmaps.
- **Prediction Simulator**: A "What-If" analysis tool powered by **Random Forest** to predict stock returns based on simulated filing complexity and market conditions.
- **Modern Frontend (React)**: A secondary Work-In-Progress web application using Vite & TailwindCSS for a premium user experience.

---

## 📂 Project Structure
```
dva-submission1/
├── app.py                # 🟢 PROTOTYPE: Main Streamlit Dashboard (Run this first)
├── frontend/             # 🔵 BETA: Modern React + Vite Frontend Application
├── fda_research_paper.pdf# 📄 Full Research Report
├── project_report.md     # 📄 Markdown Summary of the Report
├── final_with_CCTI.csv   # 💾 Core Dataset (Processed SEC Filings + Market Data)
├── requirements.txt      # 📦 Python Dependencies
├── verify_backend.py     # 🔧 Backend Verification Script
└── figures/              # 🖼️ Generated Static Figures
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: (Optional) For running the React frontend

### 1. 🟢 Running the Streamlit Dashboard (Recommended)
This is the most complete interface for exploring the data and models.

1.  **Clone/Navigate** to the project folder:
    ```bash
    cd path/to/dva-submission1
    ```

2.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the App:**
    ```bash
    streamlit run app.py
    ```
    The dashboard will open in your browser at `http://localhost:8501`.

### 2. 🔵 Running the React Frontend (Beta)
For developers interested in the modern web stack implementation.

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install Node Dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    The app will utilize Vite and open at `http://localhost:5173`.

---

## 📈 Usage Guide

### Dashboard Modules
1.  **Global Filters**: Use the sidebar to filter data by **Date Range**, **SIC Industry**, and **Form Type** (10-K vs 10-Q).
2.  **CCTI Distribution**: Observe the "fat tail" of highly complex documents using the histogram.
3.  **Nonlinear Analysis**: The main scatter plot uses LOESS trendlines to show how returns dip as complexity increases beyond a threshold.
4.  **Prediction Simulator**: 
    -   Scroll to the "Prediction Simulator" section.
    -   Adjust sliders for **Complexity**, **Volatility**, and **Sentiment**.
    -   See the real-time **Predicted Return** and view **Similar Historical Filings**.

---

## 📚 Reference
- **Author**: Komendra Sahu
- **Institution**: IIIT Naya Raipur
- **Research**: See `fda_research_paper.pdf` for the full methodology and econometric comparison (OLS vs Random Forest).
