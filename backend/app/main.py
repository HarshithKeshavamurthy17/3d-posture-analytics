from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
from pathlib import Path
import uuid
from datetime import datetime
import gc

from app.services.video_processor import VideoProcessor
from app.services.pose_estimator import PoseEstimator
from app.services.reconstruction import PoseReconstructor
from app.services.analytics_engine import AnalyticsEngine

# Initialize FastAPI app
app = FastAPI(
    title="AI 3D Posture & Motion Analytics API",
    description="Backend API for AI-powered pose estimation and motion analytics",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:5173",  # Local frontend
    "http://localhost:3000",  # Alternative local
    "https://3d-posture-analytics-ai.vercel.app",  # Production frontend
    "https://3d-posture-analytics-ai.vercel.app/",
    "*"  # Fallback (might be ignored by some browsers with credentials)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Initialize services
video_processor = VideoProcessor()
pose_estimator = PoseEstimator()
pose_reconstructor = PoseReconstructor()
analytics_engine = AnalyticsEngine()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI 3D Posture & Motion Analytics API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/upload")
def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file for pose estimation and analytics
    
    Args:
        file: Video file (MP4, MOV, AVI)
    
    Returns:
        JSON with 3D pose data and analytics
    """
    try:
        # Validate file type
        allowed_extensions = {'.mp4', '.mov', '.avi'}
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Save uploaded file
        video_path = UPLOAD_DIR / f"{job_id}{file_ext}"
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"[{job_id}] Video uploaded: {file.filename}")
        
        # Step 1 & 2: Stream frames and run pose estimation
        print(f"[{job_id}] Processing video stream...")
        # Use generator to save memory (resizes to 360p max width for speed)
        frame_generator = video_processor.stream_frames(str(video_path), max_width=360)
        pose_data = pose_estimator.process_frames(frame_generator)
        print(f"[{job_id}] Processed {len(pose_data)} frames")
        
        # Force garbage collection
        gc.collect()
        
        # Step 3: Reconstruct 3D poses - SKIPPED (PoseEstimator now does 3D)
        
        # Step 4: Compute analytics
        print(f"[{job_id}] Computing analytics...")
        try:
            analytics = analytics_engine.compute_analytics(pose_data)
            print(f"[{job_id}] Analytics complete")
        except Exception as analytics_error:
            print(f"[{job_id}] Analytics computation failed: {analytics_error}")
            analytics = {}  # Gracefully degrade if analytics fail 
        
        # Clean up uploaded video
        video_path.unlink()
        
        # Return results EXACTLY as requested
        return JSONResponse(content={
            "job_id": job_id,
            "filename": file.filename,
            "frames_processed": len(pose_data),
            "frames": pose_data, # List of { "landmarks": [...] }
            "analytics": analytics,
            "status": "success"
        })
        
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )


@app.delete("/api/cleanup/{job_id}")
async def cleanup_job(job_id: str):
    """Clean up temporary files for a job"""
    try:
        # Remove any leftover files
        for file in UPLOAD_DIR.glob(f"{job_id}*"):
            file.unlink()
        for file in OUTPUT_DIR.glob(f"{job_id}*"):
            file.unlink()
        
        return {"status": "cleaned", "job_id": job_id}
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cleanup failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
