import numpy as np
from typing import List, Dict, Any, Tuple


class InjuryPredictor:
    """
    AI-based injury risk prediction system
    Analyzes movement patterns to predict potential injury risks
    """
    
    def __init__(self):
        """Initialize injury predictor with biomechanical rules"""
        # Risk thresholds based on biomechanical research
        self.thresholds = {
            "knee_valgus_angle": 170,  # Knee collapsing inward (degrees)
            "spine_flexion": 30,  # Excessive forward lean (degrees)
            "asymmetry_threshold": 15,  # Left-right difference (percentage)
            "rapid_acceleration": 2.5,  # Sudden movement multiplier
            "joint_range_extreme": 0.9,  # 90% of max range
        }
        
        # Injury types and their indicators
        self.injury_patterns = {
            "ACL_Tear": {
                "joints": ["knee"],
                "indicators": ["knee_valgus", "asymmetric_landing", "rapid_deceleration"],
                "severity_multiplier": 1.5
            },
            "Lower_Back_Strain": {
                "joints": ["spine", "hip"],
                "indicators": ["excessive_flexion", "rotational_stress", "poor_posture"],
                "severity_multiplier": 1.2
            },
            "Shoulder_Impingement": {
                "joints": ["shoulder"],
                "indicators": ["overhead_angle", "rotator_asymmetry", "repetitive_motion"],
                "severity_multiplier": 1.1
            },
            "Ankle_Sprain": {
                "joints": ["ankle"],
                "indicators": ["instability", "rapid_direction_change", "landing_impact"],
                "severity_multiplier": 1.0
            },
            "Hip_Flexor_Strain": {
                "joints": ["hip"],
                "indicators": ["overextension", "asymmetric_movement", "fatigue"],
                "severity_multiplier": 1.1
            }
        }
    
    def predict_injury_risks(self, analytics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main prediction function - analyzes all metrics to predict injury risks
        
        Args:
            analytics: Complete analytics dictionary with all computed metrics
            
        Returns:
            Dictionary containing injury predictions, risk scores, and recommendations
        """
        predictions = []
        risk_factors = []
        preventive_actions = []
        
        # Extract relevant metrics
        joint_angles = analytics.get("joint_angles", {})
        symmetry = analytics.get("symmetry_analysis", {})
        posture = analytics.get("posture_metrics", {})
        motion = analytics.get("motion_metrics", {})
        anomalies = analytics.get("anomalies", {})
        
        # 1. Analyze Knee Risk (ACL, Meniscus)
        knee_risk = self._analyze_knee_risk(joint_angles, symmetry, motion)
        if knee_risk["risk_score"] > 30:
            predictions.append(knee_risk)
        
        # 2. Analyze Spine/Back Risk
        back_risk = self._analyze_back_risk(joint_angles, posture)
        if back_risk["risk_score"] > 30:
            predictions.append(back_risk)
        
        # 3. Analyze Shoulder Risk
        shoulder_risk = self._analyze_shoulder_risk(joint_angles, symmetry)
        if shoulder_risk["risk_score"] > 30:
            predictions.append(shoulder_risk)
        
        # 4. Analyze Hip Risk
        hip_risk = self._analyze_hip_risk(joint_angles, symmetry, motion)
        if hip_risk["risk_score"] > 30:
            predictions.append(hip_risk)
        
        # 5. Analyze Ankle/Foot Risk
        ankle_risk = self._analyze_ankle_risk(motion, anomalies)
        if ankle_risk["risk_score"] > 30:
            predictions.append(ankle_risk)
        
        # Sort by risk score
        predictions.sort(key=lambda x: x["risk_score"], reverse=True)
        
        # Generate overall risk level
        if predictions:
            max_risk = predictions[0]["risk_score"]
            if max_risk >= 70:
                overall_level = "High"
                overall_color = "danger"
            elif max_risk >= 50:
                overall_level = "Moderate"
                overall_color = "warning"
            else:
                overall_level = "Low"
                overall_color = "caution"
        else:
            overall_level = "Minimal"
            overall_color = "safe"
            predictions.append({
                "injury_type": "No Significant Risks Detected",
                "body_part": "Overall",
                "risk_score": 10,
                "severity": "Low",
                "confidence": 85,
                "description": "Movement patterns appear biomechanically sound",
                "warning_signs": [],
                "prevention_tips": ["Maintain current form", "Continue regular stretching"]
            })
        
        # Generate comprehensive recommendations
        recommendations = self._generate_recommendations(predictions)
        
        return {
            "overall_risk_level": overall_level,
            "overall_color": overall_color,
            "predictions": predictions[:5],  # Top 5 risks
            "total_risks_detected": len(predictions),
            "recommendations": recommendations,
            "ai_confidence": self._calculate_confidence(analytics)
        }
    
    def _analyze_knee_risk(self, joint_angles: Dict, symmetry: Dict, motion: Dict) -> Dict:
        """Analyze ACL and knee injury risk"""
        risk_score = 0
        warning_signs = []
        
        # Check knee angles
        left_knee = joint_angles.get("left_knee", [])
        right_knee = joint_angles.get("right_knee", [])
        
        if left_knee or right_knee:
            # Check for valgus collapse (knee caving in - angle < 170°)
            for angles in [left_knee, right_knee]:
                if angles:
                    min_angle = min([a for a in angles if a is not None], default=180)
                    if min_angle < 160:
                        risk_score += 35
                        warning_signs.append("Severe knee valgus (inward collapse) detected")
                    elif min_angle < 170:
                        risk_score += 20
                        warning_signs.append("Moderate knee valgus observed")
        
        # Check symmetry
        knee_symmetry = symmetry.get("by_body_part", {}).get("knees", 100)
        if knee_symmetry < 70:
            risk_score += 25
            warning_signs.append("Significant left-right knee asymmetry")
        elif knee_symmetry < 85:
            risk_score += 10
            warning_signs.append("Mild knee asymmetry")
        
        # Check for rapid movements (ACL risk factor)
        max_velocity = motion.get("max_velocity", 0)
        if max_velocity > 0.4:
            risk_score += 15
            warning_signs.append("Rapid acceleration/deceleration detected")
        
        return {
            "injury_type": "ACL Tear / Knee Injury",
            "body_part": "Knee",
            "risk_score": min(risk_score, 100),
            "severity": "High" if risk_score >= 60 else "Moderate" if risk_score >= 40 else "Low",
            "confidence": 88,
            "description": "Analysis of knee alignment, symmetry, and dynamic loading patterns",
            "warning_signs": warning_signs,
            "prevention_tips": [
                "Strengthen quadriceps and hamstrings",
                "Practice proper landing mechanics",
                "Focus on controlled deceleration",
                "Ensure knees track over toes during movements"
            ]
        }
    
    def _analyze_back_risk(self, joint_angles: Dict, posture: Dict) -> Dict:
        """Analyze lower back and spine injury risk"""
        risk_score = 0
        warning_signs = []
        
        # Check spine angle
        spine_angles = joint_angles.get("spine", [])
        if spine_angles:
            avg_spine = np.mean([a for a in spine_angles if a is not None])
            if avg_spine < 150:
                risk_score += 30
                warning_signs.append("Excessive spinal flexion detected")
            elif avg_spine < 165:
                risk_score += 15
                warning_signs.append("Moderate forward lean observed")
        
        # Check posture score
        posture_score = posture.get("overall_posture_score", 100)
        if posture_score < 60:
            risk_score += 35
            warning_signs.append("Poor overall posture alignment")
        elif posture_score < 75:
            risk_score += 20
            warning_signs.append("Suboptimal posture detected")
        
        # Check spine alignment
        spine_alignment = posture.get("spine_alignment_score", 100)
        if spine_alignment < 70:
            risk_score += 25
            warning_signs.append("Spine misalignment detected")
        
        return {
            "injury_type": "Lower Back Strain / Disc Injury",
            "body_part": "Spine / Lower Back",
            "risk_score": min(risk_score, 100),
            "severity": "High" if risk_score >= 60 else "Moderate" if risk_score >= 40 else "Low",
            "confidence": 92,
            "description": "Evaluation of spinal alignment, flexion patterns, and postural control",
            "warning_signs": warning_signs,
            "prevention_tips": [
                "Strengthen core musculature",
                "Maintain neutral spine during movements",
                "Avoid excessive forward bending",
                "Practice proper lifting technique",
                "Incorporate spine mobility exercises"
            ]
        }
    
    def _analyze_shoulder_risk(self, joint_angles: Dict, symmetry: Dict) -> Dict:
        """Analyze rotator cuff and shoulder injury risk"""
        risk_score = 0
        warning_signs = []
        
        # Check shoulder angles
        left_shoulder = joint_angles.get("left_shoulder", [])
        right_shoulder = joint_angles.get("right_shoulder", [])
        
        # Check for extreme ranges
        for side, angles in [("left", left_shoulder), ("right", right_shoulder)]:
            if angles:
                max_angle = max([a for a in angles if a is not None], default=0)
                if max_angle > 170:
                    risk_score += 20
                    warning_signs.append(f"Extreme {side} shoulder extension detected")
        
        # Check symmetry
        shoulder_symmetry = symmetry.get("by_body_part", {}).get("shoulders", 100)
        if shoulder_symmetry < 75:
            risk_score += 25
            warning_signs.append("Shoulder imbalance detected")
        
        return {
            "injury_type": "Rotator Cuff Strain / Shoulder Impingement",
            "body_part": "Shoulder",
            "risk_score": min(risk_score, 100),
            "severity": "Moderate" if risk_score >= 40 else "Low",
            "confidence": 85,
            "description": "Assessment of shoulder range, symmetry, and rotational patterns",
            "warning_signs": warning_signs,
            "prevention_tips": [
                "Strengthen rotator cuff muscles",
                "Avoid overhead movements if painful",
                "Maintain shoulder blade stability",
                "Balance pushing and pulling exercises"
            ]
        }
    
    def _analyze_hip_risk(self, joint_angles: Dict, symmetry: Dict, motion: Dict) -> Dict:
        """Analyze hip flexor and joint injury risk"""
        risk_score = 0
        warning_signs = []
        
        # Check hip angles
        left_hip = joint_angles.get("left_hip", [])
        right_hip = joint_angles.get("right_hip", [])
        
        for side, angles in [("left", left_hip), ("right", right_hip)]:
            if angles:
                range_angles = [a for a in angles if a is not None]
                if range_angles:
                    hip_range = max(range_angles) - min(range_angles)
                    if hip_range > 80:
                        risk_score += 15
                        warning_signs.append(f"Excessive {side} hip range of motion")
        
        # Check hip symmetry
        hip_symmetry = symmetry.get("by_body_part", {}).get("hips", 100)
        if hip_symmetry < 80:
            risk_score += 20
            warning_signs.append("Hip asymmetry detected")
        
        return {
            "injury_type": "Hip Flexor Strain / FAI",
            "body_part": "Hip",
            "risk_score": min(risk_score, 100),
            "severity": "Moderate" if risk_score >= 40 else "Low",
            "confidence": 82,
            "description": "Analysis of hip mobility, symmetry, and loading patterns",
            "warning_signs": warning_signs,
            "prevention_tips": [
                "Stretch hip flexors regularly",
                "Strengthen glutes and hip stabilizers",
                "Improve hip mobility",
                "Avoid excessive hip flexion under load"
            ]
        }
    
    def _analyze_ankle_risk(self, motion: Dict, anomalies: Dict) -> Dict:
        """Analyze ankle sprain and stability risk"""
        risk_score = 0
        warning_signs = []
        
        # Check for instability (rapid movements)
        anomaly_count = anomalies.get("anomaly_count", 0)
        if anomaly_count > 20:
            risk_score += 30
            warning_signs.append("Frequent unstable movements detected")
        elif anomaly_count > 10:
            risk_score += 15
            warning_signs.append("Some movement instability observed")
        
        # Check ankle ROM
        ankle_rom = motion.get("range_of_motion", {})
        left_ankle_rom = ankle_rom.get(27, 0)  # Left ankle
        right_ankle_rom = ankle_rom.get(28, 0)  # Right ankle
        
        if abs(left_ankle_rom - right_ankle_rom) > 0.05:
            risk_score += 15
            warning_signs.append("Ankle mobility asymmetry")
        
        return {
            "injury_type": "Ankle Sprain / Instability",
            "body_part": "Ankle",
            "risk_score": min(risk_score, 100),
            "severity": "Moderate" if risk_score >= 40 else "Low",
            "confidence": 78,
            "description": "Evaluation of ankle stability, landing patterns, and balance control",
            "warning_signs": warning_signs,
            "prevention_tips": [
                "Strengthen ankle stabilizers",
                "Practice balance exercises",
                "Ensure proper footwear",
                "Warm up ankles before activity"
            ]
        }
    
    def _generate_recommendations(self, predictions: List[Dict]) -> List[str]:
        """Generate comprehensive prevention recommendations"""
        recommendations = []
        
        if not predictions or predictions[0]["injury_type"] == "No Significant Risks Detected":
            return [
                "Continue current movement patterns",
                "Maintain regular strength and flexibility training",
                "Monitor for any changes in form or discomfort"
            ]
        
        # High-risk warnings
        high_risks = [p for p in predictions if p["risk_score"] >= 60]
        if high_risks:
            recommendations.append("⚠️ URGENT: Consult a healthcare professional before continuing high-intensity activities")
            recommendations.append("Consider temporary activity modification until risk factors are addressed")
        
        # Body-part specific
        body_parts = set([p["body_part"] for p in predictions[:3]])
        
        if "Knee" in body_parts:
            recommendations.append("Implement neuromuscular training for knee stability")
        
        if "Spine" in body_parts or "Lower Back" in body_parts:
            recommendations.append("Focus on core strengthening and spine mobility exercises")
        
        if "Shoulder" in body_parts:
            recommendations.append("Address shoulder imbalances with targeted rotator cuff work")
        
        # General recommendations
        recommendations.extend([
            "Work with a qualified movement specialist or physical therapist",
            "Gradually increase training intensity (10% rule)",
            "Ensure adequate rest and recovery between sessions",
            "Address movement compensations before they become habits"
        ])
        
        return recommendations[:6]  # Top 6 recommendations
    
    def _calculate_confidence(self, analytics: Dict) -> int:
        """Calculate AI prediction confidence based on data quality"""
        confidence = 75  # Base confidence
        
        # More frames = higher confidence
        total_frames = analytics.get("summary", {}).get("total_frames", 0)
        if total_frames > 200:
            confidence += 15
        elif total_frames > 100:
            confidence += 10
        elif total_frames > 50:
            confidence += 5
        
        # Good symmetry data = higher confidence
        symmetry_score = analytics.get("symmetry_analysis", {}).get("overall_score", 0)
        if symmetry_score > 0:
            confidence += 5
        
        return min(confidence, 95)  # Cap at 95% (never 100% certain)
