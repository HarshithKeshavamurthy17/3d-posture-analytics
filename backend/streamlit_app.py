import streamlit as st
import tempfile
import os
import sys
import cv2
import numpy as np
import plotly.graph_objects as go
import pandas as pd

# Ensure we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.video_processor import VideoProcessor
from app.services.pose_estimator import PoseEstimator
from app.services.analytics_engine import AnalyticsEngine

# Page Config
st.set_page_config(
    page_title="AI 3D Posture Analytics",
    page_icon="🏃",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- CUSTOM CSS INJECTION ---
st.markdown("""
<style>
    /* Global Theme */
    .stApp {
        background-color: #000000;
        color: #e5e7eb;
        font-family: 'Inter', sans-serif;
    }
    
    /* Hide Streamlit Elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    
    /* Hero Section */
    .hero-container {
        background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
        border: 1px solid #333;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .hero-title {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #0ea5e9, #d946ef);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    
    .hero-subtitle {
        color: #9ca3af;
        font-size: 1.1rem;
        margin-bottom: 2rem;
    }
    
    /* Glass Cards */
    .glass-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        padding: 1.5rem;
        backdrop-filter: blur(10px);
        margin-bottom: 1rem;
        height: 100%;
    }
    
    .card-title {
        font-size: 1.2rem;
        font-weight: 600;
        color: #e5e7eb;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    /* Metrics */
    .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: #fff;
    }
    
    .metric-label {
        color: #9ca3af;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    /* AI Risk Section */
    .ai-risk-section {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
    }
    
    .risk-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.75rem;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .risk-high { border-left: 4px solid #ef4444; }
    .risk-medium { border-left: 4px solid #f59e0b; }
    .risk-low { border-left: 4px solid #10b981; }
    
    /* Custom Buttons */
    .stButton > button {
        background: linear-gradient(135deg, #0ea5e9, #d946ef);
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem 1rem;
        font-weight: 600;
        width: 100%;
    }
    
    /* Progress Bars */
    .stProgress > div > div > div > div {
        background-image: linear-gradient(135deg, #0ea5e9, #d946ef);
    }
</style>
""", unsafe_allow_html=True)

# Initialize Services
@st.cache_resource
def get_services():
    return {
        "video_processor": VideoProcessor(),
        "pose_estimator": PoseEstimator(),
        "analytics_engine": AnalyticsEngine()
    }

services = get_services()

def plot_3d_skeleton(landmarks):
    """Create Plotly 3D scatter plot for skeleton with premium styling"""
    if not landmarks:
        return go.Figure()

    # MediaPipe Pose connections
    CONNECTIONS = [
        (11, 12), (11, 13), (13, 15), (12, 14), (14, 16), # Arms
        (11, 23), (12, 24), (23, 24), # Torso
        (23, 25), (24, 26), (25, 27), (26, 28), (27, 29), (28, 30), (29, 31), (30, 32) # Legs
    ]

    x = [lm['x'] for lm in landmarks]
    y = [lm['y'] for lm in landmarks]
    z = [lm['z'] for lm in landmarks]

    # Create scatter plot for joints
    fig = go.Figure(data=[go.Scatter3d(
        x=x, y=z, z=[-val for val in y], # Swap Y and Z, invert Y
        mode='markers',
        marker=dict(size=6, color=z, colorscale='Viridis', opacity=1, line=dict(color='white', width=1)),
        name='Joints',
        showlegend=False
    )])

    # Add lines for bones
    for start, end in CONNECTIONS:
        if start < len(landmarks) and end < len(landmarks):
            fig.add_trace(go.Scatter3d(
                x=[x[start], x[end]],
                y=[z[start], z[end]],
                z=[-y[start], -y[end]],
                mode='lines',
                line=dict(color='rgba(255, 255, 255, 0.6)', width=4),
                showlegend=False
            ))

    fig.update_layout(
        scene=dict(
            xaxis=dict(visible=False, showgrid=False, showbackground=False),
            yaxis=dict(visible=False, showgrid=False, showbackground=False),
            zaxis=dict(visible=False, showgrid=False, showbackground=False),
            aspectmode='data',
            bgcolor='rgba(0,0,0,0)'
        ),
        margin=dict(l=0, r=0, b=0, t=0),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=500
    )
    return fig

# --- SIDEBAR ---
with st.sidebar:
    st.markdown("""
    <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="background: linear-gradient(135deg, #0ea5e9, #d946ef); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;">HK.</h1>
    </div>
    """, unsafe_allow_html=True)
    
    st.header("Upload Video")
    uploaded_file = st.file_uploader("Choose a video file", type=['mp4', 'mov', 'avi'])
    
    st.markdown("---")
    st.markdown("""
    <div style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 0.5rem;">
        <h4 style="margin:0; color: #e5e7eb;">Instructions</h4>
        <ul style="font-size: 0.8rem; color: #9ca3af; padding-left: 1rem; margin-top: 0.5rem;">
            <li>Ensure full body visibility</li>
            <li>Good lighting conditions</li>
            <li>Wear fitted clothing</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

# --- MAIN CONTENT ---

# Hero Section
st.markdown("""
<div class="hero-container">
    <div class="hero-title">AI 3D Posture & Motion Analytics</div>
    <div class="hero-subtitle">Advanced biomechanics analysis powered by computer vision and AI.</div>
</div>
""", unsafe_allow_html=True)

if uploaded_file:
    # Save to temp file
    tfile = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.name)[1])
    tfile.write(uploaded_file.read())
    video_path = tfile.name

    if st.button("Analyze Motion", type="primary"):
        with st.spinner("Processing video... Extracting 3D pose data..."):
            try:
                # Process
                frame_gen = services["video_processor"].stream_frames(video_path)
                pose_data = services["pose_estimator"].process_frames(frame_gen)
                analytics = services["analytics_engine"].compute_analytics(pose_data)
                
                # --- DASHBOARD LAYOUT ---
                
                # 1. AI Injury Risk (Prominent)
                ai_preds = analytics.get("ai_injury_prediction", {})
                if ai_preds:
                    risk_score = ai_preds.get("overall_risk_score", 0)
                    risk_level = ai_preds.get("risk_level", "Unknown")
                    
                    st.markdown(f"""
                    <div class="ai-risk-section">
                        <h2 style="margin-top:0; color:#fff;">🤖 AI Injury Risk Prediction</h2>
                        <div style="display:flex; align-items:center; gap:2rem; margin-bottom:2rem;">
                            <div>
                                <div style="font-size:3rem; font-weight:800; color:#ef4444;">{risk_score}</div>
                                <div style="color:#9ca3af;">Risk Score</div>
                            </div>
                            <div style="flex:1; padding:1rem; background:rgba(255,255,255,0.05); border-radius:0.5rem;">
                                <div style="font-size:1.5rem; font-weight:700; color:#fff;">{risk_level} Risk Detected</div>
                                <div style="color:#9ca3af;">Based on joint angles, symmetry, and movement patterns.</div>
                            </div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Injury Cards
                    predictions = ai_preds.get("predictions", [])
                    cols = st.columns(3)
                    for idx, pred in enumerate(predictions):
                        severity_class = f"risk-{pred['severity'].lower()}" if pred['severity'] in ['High', 'Medium', 'Low'] else "risk-low"
                        with cols[idx % 3]:
                            st.markdown(f"""
                            <div class="risk-card {severity_class}">
                                <h4 style="margin:0; color:#fff;">{pred['injury_type']}</h4>
                                <div style="display:flex; justify-content:space-between; margin:0.5rem 0;">
                                    <span style="color:#9ca3af;">Risk: {pred['risk_score']}%</span>
                                    <span style="font-weight:bold; color:#fff;">{pred['severity']}</span>
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                            with st.expander("Warning Signs & Tips"):
                                for sign in pred['warning_signs']:
                                    st.markdown(f"- ⚠ {sign}")
                                for tip in pred['prevention_tips']:
                                    st.markdown(f"- ✓ {tip}")

                # 2. Main Grid (3D Viewer + Stats)
                col_3d, col_stats = st.columns([2, 1])
                
                with col_3d:
                    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
                    st.markdown('<div class="card-title">🏃 3D Biomechanics Visualization</div>', unsafe_allow_html=True)
                    
                    # Slider for frame selection
                    frame_idx = st.slider("Timeline", 0, len(pose_data)-1, 0, label_visibility="collapsed")
                    
                    if pose_data:
                        landmarks = pose_data[frame_idx].get("landmarks", [])
                        fig = plot_3d_skeleton(landmarks)
                        st.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False})
                    st.markdown('</div>', unsafe_allow_html=True)
                
                with col_stats:
                    # Overall Score
                    st.markdown(f"""
                    <div class="glass-card">
                        <div class="card-title">📊 Performance</div>
                        <div style="text-align:center; margin:1rem 0;">
                            <div style="font-size:3.5rem; font-weight:800; background: linear-gradient(135deg, #0ea5e9, #d946ef); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">{analytics.get('overall_score', 0):.0f}</div>
                            <div class="metric-label">Overall Form Score</div>
                        </div>
                        <div style="margin-top:1.5rem;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                                <span style="color:#e5e7eb;">Movement Quality</span>
                                <span style="color:#fff;">{analytics.get('movement_quality', 0):.0f}%</span>
                            </div>
                            <div style="height:6px; background:#333; border-radius:3px; overflow:hidden;">
                                <div style="width:{analytics.get('movement_quality', 0)}%; height:100%; background:linear-gradient(90deg, #0ea5e9, #d946ef);"></div>
                            </div>
                        </div>
                        <div style="margin-top:1rem;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                                <span style="color:#e5e7eb;">Symmetry</span>
                                <span style="color:#fff;">{analytics.get('symmetry_analysis', {}).get('overall_symmetry', 0):.0f}%</span>
                            </div>
                            <div style="height:6px; background:#333; border-radius:3px; overflow:hidden;">
                                <div style="width:{analytics.get('symmetry_analysis', {}).get('overall_symmetry', 0)}%; height:100%; background:linear-gradient(90deg, #10b981, #3b82f6);"></div>
                            </div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Key Insights
                    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
                    st.markdown('<div class="card-title">💡 Key Insights</div>', unsafe_allow_html=True)
                    
                    # Mock insights based on score (since we don't have text generation here without LLM)
                    score = analytics.get('overall_score', 0)
                    if score > 80:
                        st.success("Excellent form! Maintain current posture.")
                    elif score > 60:
                        st.warning("Good form, but room for improvement in stability.")
                    else:
                        st.error("Form needs attention. Focus on symmetry.")
                    
                    st.markdown('</div>', unsafe_allow_html=True)

            except Exception as e:
                st.error(f"An error occurred: {str(e)}")
            finally:
                if os.path.exists(video_path):
                    os.unlink(video_path)

else:
    # Empty State
    st.markdown("""
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; border:2px dashed #333; border-radius:1rem; margin-top:2rem;">
        <div style="font-size:4rem; margin-bottom:1rem;">📤</div>
        <div style="font-size:1.5rem; color:#e5e7eb; font-weight:600;">Upload a video to begin</div>
        <div style="color:#9ca3af;">Supports MP4, MOV, AVI</div>
    </div>
    """, unsafe_allow_html=True)
