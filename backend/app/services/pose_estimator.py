import mediapipe as mp
import cv2
import numpy as np
from typing import List, Dict, Any


class PoseEstimator:
    def __init__(self, model_complexity=2):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def normalize_frame(self, lm):
        """
        Normalize landmarks: center at hips and scale by torso size
        """
        pts = [(p.x, p.y, p.z) for p in lm]

        # center at mid-hip so body stays around origin
        L_HIP, R_HIP = 23, 24
        cx = (pts[L_HIP][0] + pts[R_HIP][0]) / 2
        cy = (pts[L_HIP][1] + pts[R_HIP][1]) / 2
        cz = (pts[L_HIP][2] + pts[R_HIP][2]) / 2
        pts = [(x-cx, y-cy, z-cz) for (x,y,z) in pts]

        # scale by torso to make visible
        L_SHO, R_SHO = 11, 12
        torso = ((pts[L_SHO][0]-pts[R_SHO][0])**2 + (pts[L_SHO][1]-pts[R_SHO][1])**2 + (pts[L_SHO][2]-pts[R_SHO][2])**2) ** 0.5
        s = 1.0 / (torso + 1e-6)
        pts = [(x*s, y*s, z*s) for (x,y,z) in pts]

        return [{"x":x, "y":y, "z":z} for (x,y,z) in pts]

    def extract_keypoints(self, frame_rgb):
        results = self.pose.process(frame_rgb)
        
        # Check if pose was detected
        if not results.pose_world_landmarks or not results.pose_landmarks:
            return None, None
            
        # Get 3D world landmarks (for 3D viewer)
        lm_3d = results.pose_world_landmarks.landmark
        landmarks_3d = self.normalize_frame(lm_3d)
        
        # Get 2D screen landmarks (for video overlay)
        lm_2d = results.pose_landmarks.landmark
        landmarks_2d = [{"x": p.x, "y": p.y, "z": p.z} for p in lm_2d]
        
        return landmarks_3d, landmarks_2d
    
    def process_frames(self, frames: List[np.ndarray]) -> List[Dict[str, Any]]:
        """
        Process video frames and extract pose landmarks
        Returns both 3D (for viewer) and 2D (for video overlay) landmarks
        """
        all_pose_data = []
        
        for frame in frames:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            landmarks_3d, landmarks_2d = self.extract_keypoints(rgb_frame)
            
            # Structure: { "landmarks": [...], "landmarks_2d": [...] }
            if landmarks_3d and landmarks_2d:
                all_pose_data.append({
                    "landmarks": landmarks_3d,  # 3D normalized for viewer
                    "landmarks_2d": landmarks_2d  # 2D screen coords for video overlay
                })
            else:
                # Keep frame sync with empty landmarks
                all_pose_data.append({
                    "landmarks": [],
                    "landmarks_2d": []
                })
        
        return all_pose_data

    def close(self):
        """Clean up MediaPipe resources"""
        self.pose.close()
