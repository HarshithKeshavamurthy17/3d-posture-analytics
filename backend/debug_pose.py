
import cv2
import numpy as np
import json
from app.services.pose_estimator import PoseEstimator

def test_pose_estimation():
    print("Initializing PoseEstimator...")
    estimator = PoseEstimator()
    
    # Create a dummy black image
    # frame = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Better: Try to load a real frame if possible, or just use random noise to see if it crashes
    # But random noise won't detect a pose.
    # Let's trust the logic but check the structure.
    
    # We can't easily get a real frame without a video file.
    # But we can check the METHOD signatures and return types by inspection? 
    # No, runtime is better.
    
    # Let's try to mock a result or just print the structure of the class methods
    # Actually, I'll create a dummy frame with a drawn person? No that's hard.
    
    # Let's just inspect the code I wrote? I already did.
    
    # Let's try to process a simple image if one exists.
    # The user has uploaded images? No, those are screenshots.
    
    # I will create a simple test that mocks the MediaPipe result to verify the normalization logic.
    
    print("Testing normalization logic...")
    
    # Mock landmarks
    class MockPoint:
        def __init__(self, x, y, z):
            self.x = x
            self.y = y
            self.z = z
            self.visibility = 1.0
            
    # Create 33 mock points
    mock_lm = [MockPoint(i*0.1, i*0.1, i*0.1) for i in range(33)]
    
    # Run normalization
    normalized = estimator.normalize_frame(mock_lm)
    
    print(f"Input length: {len(mock_lm)}")
    print(f"Output type: {type(normalized)}")
    print(f"Output length: {len(normalized)}")
    print(f"First point: {normalized[0]}")
    
    # Verify structure
    if isinstance(normalized, list) and isinstance(normalized[0], dict) and 'x' in normalized[0]:
        print("SUCCESS: Structure is List[Dict['x',...]]")
    else:
        print(f"FAILURE: Unexpected structure: {normalized}")

    # Verify process_frames structure
    print("\nTesting process_frames structure...")
    # Mock frames
    frames = [np.zeros((100, 100, 3), dtype=np.uint8)]
    
    # We need to mock the pose.process method to return something, otherwise it returns None
    # But we can't easily mock the internal MP object without a library.
    # However, process_frames handles None.
    
    results = estimator.process_frames(frames)
    print(f"Process_frames output: {json.dumps(results, indent=2)}")
    
    if len(results) == 1 and "landmarks" in results[0]:
        print("SUCCESS: process_frames returns [{'landmarks': ...}]")
    else:
        print("FAILURE: process_frames structure incorrect")

if __name__ == "__main__":
    test_pose_estimation()
