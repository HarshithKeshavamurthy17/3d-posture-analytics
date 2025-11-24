import numpy as np
from typing import List, Dict, Any
from scipy.signal import savgol_filter


class PoseReconstructor:
    def __init__(self):
        """Initialize the pose reconstructor"""
        self.scale_factor = 100  # Scale factor for better visualization
    
    def lift_to_3d(self, keypoints_2d_dict):
        """
        keypoints_2d_dict: {idx: {"x":..., "y":..., "z":..., "vis":...}, ...}
        returns: {idx: [X, Y, Z], ...}
        """
        if keypoints_2d_dict is None:
            return None

        keypoints_3d = {}
        for idx, p in keypoints_2d_dict.items():
            x, y, z = p["x"], p["y"], p["z"]

            # MediaPipe z is relative; scale to see depth
            keypoints_3d[int(idx)] = [
                x * self.scale_factor,
                -y * self.scale_factor,   # invert y for Three.js coordinate feel
                z * self.scale_factor
            ]

        return keypoints_3d

    def reconstruct_3d(self, pose_data_2d: List[Dict[int, Dict[str, float]]]) -> List[Dict[int, List[float]]]:
        """
        Convert 2D pose landmarks to 3D coordinates using the new lift_to_3d method
        """
        pose_data_3d = []
        
        for frame_data in pose_data_2d:
            if frame_data is None:
                pose_data_3d.append(None)
                continue
                
            frame_3d = self.lift_to_3d(frame_data)
            pose_data_3d.append(frame_3d)
        
        return pose_data_3d
