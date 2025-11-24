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

# Custom CSS
st.markdown("""
<style>
    .main {
        background-color: #0E1117;
    }
    .stApp {
        background-color: #0E1117;
    }
    h1, h2, h3 {
        color: #FAFAFA;
    }
    .metric-card {
        background-color: #262730;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #41444C;
    }
    .risk-high {
        color: #FF4B4B;
        font-weight: bold;
    }
    .risk-medium {
        color: #FFA500;
        font-weight: bold;
    }
    .risk-low {
        color: #00CC96;
        font-weight: bold;
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
    """Create Plotly 3D scatter plot for skeleton"""
    if not landmarks:
        return go.Figure()

    # MediaPipe Pose connections
    CONNECTIONS = [
        (11, 12), (11, 13), (13, 15), (12, 14), (14, 16), # Arms
        (11, 23), (12, 24), (23, 24), # Torso
        (23, 25), (24, 26), (25, 27), (26, 28), (27, 29), (28, 30), (29, 31), (30, 32) # Legs
    ]

    x = [lm['x'] for lm in landmarks]
    y = [lm['y'] for lm in landmarks] # Invert Y for plotting? MediaPipe Y is down.
    z = [lm['z'] for lm in landmarks]

    # Create scatter plot for joints
    fig = go.Figure(data=[go.Scatter3d(
        x=x, y=z, z=[-val for val in y], # Swap Y and Z for better upright view, invert Y
        mode='markers',
        marker=dict(size=5, color=z, colorscale='Viridis', opacity=0.8)
    )])

    # Add lines for bones
    for start, end in CONNECTIONS:
        if start < len(landmarks) and end < len(landmarks):
            fig.add_trace(go.Scatter3d(
                x=[x[start], x[end]],
                y=[z[start], z[end]],
                z=[-y[start], -y[end]],
                mode='lines',
                line=dict(color='white', width=2)
            ))

    fig.update_layout(
        scene=dict(
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            zaxis=dict(visible=False),
            aspectmode='data'
        ),
        margin=dict(l=0, r=0, b=0, t=0),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    return fig

# Sidebar
st.sidebar.title("🏃 AI Posture Analytics")
st.sidebar.info("Upload a video to analyze biomechanics and injury risk using AI.")

# Main Content
st.title("AI 3D Posture & Motion Analytics")

uploaded_file = st.file_uploader("Upload Video", type=['mp4', 'mov', 'avi'])

if uploaded_file:
    # Save to temp file
    tfile = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.name)[1])
    tfile.write(uploaded_file.read())
    video_path = tfile.name

    col1, col2 = st.columns([1, 1])
    with col1:
        st.subheader("Input Video")
        st.video(uploaded_file)

    if st.button("Analyze Motion", type="primary"):
        with st.spinner("Processing video... This may take a moment."):
            try:
                # Process
                frame_gen = services["video_processor"].stream_frames(video_path)
                pose_data = services["pose_estimator"].process_frames(frame_gen)
                analytics = services["analytics_engine"].compute_analytics(pose_data)
                
                st.success("Analysis Complete!")
                
                # --- Results Dashboard ---
                
                # 1. AI Injury Risk (Top Priority)
                st.markdown("---")
                st.header("🤖 AI Injury Risk Prediction")
                
                ai_preds = analytics.get("ai_injury_prediction", {})
                if ai_preds:
                    # Overall Risk
                    risk_score = ai_preds.get("overall_risk_score", 0)
                    risk_level = ai_preds.get("risk_level", "Unknown")
                    
                    metric_col1, metric_col2, metric_col3 = st.columns(3)
                    with metric_col1:
                        st.metric("Overall Risk Score", f"{risk_score}/100")
                    with metric_col2:
                        color = "red" if risk_level == "High" else "orange" if risk_level == "Medium" else "green"
                        st.markdown(f"### Risk Level: :{color}[{risk_level}]")
                    
                    # Individual Injuries
                    st.subheader("Specific Injury Risks")
                    predictions = ai_preds.get("predictions", [])
                    
                    cols = st.columns(len(predictions) if predictions else 1)
                    for idx, pred in enumerate(predictions):
                        with cols[idx % 3]: # Wrap around 3 columns
                            with st.container(border=True):
                                st.markdown(f"**{pred['injury_type']}**")
                                st.progress(pred['risk_score'] / 100)
                                st.caption(f"Risk: {pred['risk_score']}% ({pred['severity']})")
                                if pred['warning_signs']:
                                    with st.expander("Warning Signs"):
                                        for sign in pred['warning_signs']:
                                            st.write(f"• {sign}")

                # 2. 3D Visualization & Metrics
                st.markdown("---")
                st.header("3D Biomechanics Analysis")
                
                viz_col1, viz_col2 = st.columns([2, 1])
                
                with viz_col1:
                    st.subheader("3D Skeleton Visualization")
                    # Slider to select frame
                    frame_idx = st.slider("Select Frame", 0, len(pose_data)-1, 0)
                    if pose_data:
                        landmarks = pose_data[frame_idx].get("landmarks", [])
                        fig = plot_3d_skeleton(landmarks)
                        st.plotly_chart(fig, use_container_width=True)
                
                with viz_col2:
                    st.subheader("Key Metrics")
                    st.metric("Overall Form Score", f"{analytics.get('overall_score', 0):.1f}/100")
                    st.metric("Movement Quality", f"{analytics.get('movement_quality', 0):.1f}/100")
                    
                    # Symmetry
                    sym = analytics.get("symmetry_analysis", {})
                    st.metric("Body Symmetry", f"{sym.get('overall_symmetry', 0):.1f}%")
                
                # 3. Detailed Charts
                st.markdown("---")
                st.header("Joint Angles Over Time")
                
                # Extract angles for plotting
                angles_data = analytics.get("joint_angles", {})
                # This structure might be complex, let's try to extract time series if available
                # Or just plot current frame angles
                
                if angles_data:
                    # Create a simple bar chart of current frame angles (averaged or max)
                    # For now, let's just show the raw data in an expander
                    with st.expander("View Detailed Joint Angles"):
                        st.json(angles_data)

            except Exception as e:
                st.error(f"An error occurred during analysis: {str(e)}")
            finally:
                # Cleanup
                if os.path.exists(video_path):
                    os.unlink(video_path)

else:
    st.info("Please upload a video file to begin.")
