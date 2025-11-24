import { useRef, useEffect, useState } from 'react'
import './VideoOverlay.css'

// MediaPipe pose connections for 2D skeleton
const POSE_CONNECTIONS = [
    // Face
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    [9, 10], // Mouth
    // Upper body
    [11, 12], // Shoulders
    [11, 13], [13, 15], // Left arm
    [12, 14], [14, 16], // Right arm
    // Torso
    [11, 23], [12, 24], [23, 24], // Torso
    // Lower body
    [23, 25], [25, 27], [27, 29], [29, 31], // Left leg  
    [24, 26], [26, 28], [28, 30], [30, 32], // Right leg
]

const getBoneColor = (connectionIdx) => {
    const [a, b] = POSE_CONNECTIONS[connectionIdx]

    // Face - cyan
    if (a <= 10 && b <= 10) return '#00ffff'

    // Left arm - yellow
    if ((a === 11 || a === 13 || a === 15) && (b === 11 || b === 13 || b === 15)) return '#ffff00'

    // Right arm - orange
    if ((a === 12 || a === 14 || a === 16) && (b === 12 || b === 14 || b === 16)) return '#ff8800'

    // Torso - green
    if ((a === 11 || a === 12 || a === 23 || a === 24) &&
        (b === 11 || b === 12 || b === 23 || b === 24)) return '#00ff00'

    // Left leg - blue
    if ((a === 23 || a === 25 || a === 27 || a === 29 || a === 31) &&
        (b === 23 || b === 25 || b === 27 || b === 29 || b === 31)) return '#0088ff'

    // Right leg - magenta
    if ((a === 24 || a === 26 || a === 28 || a === 30 || a === 32) &&
        (b === 24 || b === 26 || b === 28 || b === 30 || b === 32)) return '#ff00ff'

    return '#ffffff'
}

export default function VideoOverlay({ videoUrl, frames, anomalyFrames = [], injuryPredictions = [] }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const [currentFrame, setCurrentFrame] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
    const [showSkeleton, setShowSkeleton] = useState(true)
    const [showRiskAreas, setShowRiskAreas] = useState(true)
    const [videoDuration, setVideoDuration] = useState(0)

    const fps = 30 // Assuming 30 FPS

    // Initialize video and canvas
    useEffect(() => {
        const video = videoRef.current
        const canvas = canvasRef.current

        if (!video || !canvas) return

        const handleLoadedMetadata = () => {
            setVideoDuration(video.duration)
            // Match canvas size to video
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
        }

        const handleTimeUpdate = () => {
            const frame = Math.floor(video.currentTime * fps)
            setCurrentFrame(Math.min(frame, frames.length - 1))
        }

        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)

        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('timeupdate', handleTimeUpdate)
        video.addEventListener('play', handlePlay)
        video.addEventListener('pause', handlePause)

        // Set playback rate
        video.playbackRate = playbackSpeed

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            video.removeEventListener('timeupdate', handleTimeUpdate)
            video.removeEventListener('play', handlePlay)
            video.removeEventListener('pause', handlePause)
        }
    }, [frames, fps, playbackSpeed])

    // Draw skeleton overlay
    useEffect(() => {
        const canvas = canvasRef.current
        const video = videoRef.current

        if (!canvas || !video || currentFrame >= frames.length || !showSkeleton) {
            if (canvas) {
                const ctx = canvas.getContext('2d')
                ctx.clearRect(0, 0, canvas.width, canvas.height)
            }
            return
        }

        const ctx = canvas.getContext('2d')
        const frameData = frames[currentFrame]

        if (!frameData || !frameData.landmarks) return

        const landmarks = frameData.landmarks
        const width = canvas.width
        const height = canvas.height

        // Clear canvas
        ctx.clearRect(0, 0, width, height)

        // Convert normalized coordinates (0-1) to pixel coordinates
        const landmarkPixels = landmarks.map(lm => ({
            x: lm.x * width,
            y: lm.y * height
        }))

        // Draw bones
        POSE_CONNECTIONS.forEach((connection, idx) => {
            const [aIdx, bIdx] = connection
            const a = landmarkPixels[aIdx]
            const b = landmarkPixels[bIdx]

            if (a && b) {
                ctx.strokeStyle = getBoneColor(idx)
                ctx.lineWidth = 3
                ctx.lineCap = 'round'
                ctx.beginPath()
                ctx.moveTo(a.x, a.y)
                ctx.lineTo(b.x, b.y)
                ctx.stroke()
            }
        })

        // Draw joints
        landmarkPixels.forEach((lm, idx) => {
            if (lm) {
                ctx.fillStyle = '#ffffff'
                ctx.beginPath()
                ctx.arc(lm.x, lm.y, 4, 0, 2 * Math.PI)
                ctx.fill()
            }
        })

        // Highlight risk areas
        if (showRiskAreas && anomalyFrames.includes(currentFrame)) {
            // Draw pulsing red overlay
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'
            ctx.lineWidth = 8
            ctx.setLineDash([10, 5])
            ctx.strokeRect(10, 10, width - 20, height - 20)
            ctx.setLineDash([])

            // Add warning text
            ctx.font = 'bold 24px Arial'
            ctx.fillStyle = '#ff0000'
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 2
            const text = '⚠️ ANOMALY DETECTED'
            const textWidth = ctx.measureText(text).width
            ctx.strokeText(text, (width - textWidth) / 2, 40)
            ctx.fillText(text, (width - textWidth) / 2, 40)
        }

        // Highlight specific injury risk joints
        if (showRiskAreas && injuryPredictions.length > 0) {
            injuryPredictions.forEach(prediction => {
                if (prediction.detected_frames && prediction.detected_frames.includes(currentFrame)) {
                    // Highlight specific joints based on injury type
                    let highlightJoints = []

                    if (prediction.body_part.includes('Knee')) {
                        if (prediction.body_part.includes('Left')) {
                            highlightJoints = [23, 25, 27] // Left hip, knee, ankle
                        } else {
                            highlightJoints = [24, 26, 28] // Right hip, knee, ankle
                        }
                    } else if (prediction.body_part.includes('Back')) {
                        highlightJoints = [11, 12, 23, 24] // Shoulders and hips
                    } else if (prediction.body_part.includes('Shoulder')) {
                        highlightJoints = [11, 12, 13, 14, 15, 16] // All shoulder/arm joints
                    }

                    highlightJoints.forEach(jointIdx => {
                        const joint = landmarkPixels[jointIdx]
                        if (joint) {
                            ctx.strokeStyle = '#ff0000'
                            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
                            ctx.lineWidth = 3
                            ctx.beginPath()
                            ctx.arc(joint.x, joint.y, 20, 0, 2 * Math.PI)
                            ctx.fill()
                            ctx.stroke()
                        }
                    })
                }
            })
        }

    }, [currentFrame, frames, showSkeleton, showRiskAreas, anomalyFrames, injuryPredictions])

    const handlePlayPause = () => {
        const video = videoRef.current
        if (isPlaying) {
            video.pause()
        } else {
            video.play()
        }
    }

    const handleSeek = (e) => {
        const video = videoRef.current
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        video.currentTime = percentage * video.duration
    }

    const handleSpeedChange = (speed) => {
        setPlaybackSpeed(speed)
        if (videoRef.current) {
            videoRef.current.playbackRate = speed
        }
    }

    const progress = videoDuration > 0 ? (currentFrame / fps) / videoDuration * 100 : 0

    return (
        <div className="video-overlay-container" ref={containerRef}>
            <div className="video-wrapper">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="video-player"
                    preload="auto"
                />
                <canvas
                    ref={canvasRef}
                    className="overlay-canvas"
                />

                {/* Frame info overlay */}
                <div className="frame-info">
                    <span>Frame: {currentFrame} / {frames.length}</span>
                    {anomalyFrames.includes(currentFrame) && (
                        <span className="anomaly-badge">⚠️ Anomaly</span>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="video-controls">
                <button className="control-btn" onClick={handlePlayPause}>
                    {isPlaying ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                <div className="progress-bar" onClick={handleSeek}>
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                    {/* Mark anomaly frames */}
                    {anomalyFrames.map((frameNum, idx) => {
                        const frameProgress = (frameNum / fps) / videoDuration * 100
                        return (
                            <div
                                key={idx}
                                className="anomaly-marker"
                                style={{ left: `${frameProgress}%` }}
                                title={`Anomaly at frame ${frameNum}`}
                            />
                        )
                    })}
                </div>

                <span className="time-display">
                    {(currentFrame / fps).toFixed(1)}s / {videoDuration.toFixed(1)}s
                </span>

                {/* Speed controls */}
                <div className="speed-controls">
                    <span className="speed-label">Speed:</span>
                    {[0.5, 1, 1.5, 2].map(speed => (
                        <button
                            key={speed}
                            className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                            onClick={() => handleSpeedChange(speed)}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            </div>

            {/* Toggle controls */}
            <div className="toggle-controls">
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={showSkeleton}
                        onChange={(e) => setShowSkeleton(e.target.checked)}
                    />
                    <span>Show Skeleton</span>
                </label>
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={showRiskAreas}
                        onChange={(e) => setShowRiskAreas(e.target.checked)}
                    />
                    <span>Highlight Risk Areas</span>
                </label>
            </div>

            {/* Injury warnings for current frame */}
            {injuryPredictions.length > 0 && showRiskAreas && (
                <div className="current-warnings">
                    {injuryPredictions
                        .filter(pred => pred.detected_frames && pred.detected_frames.includes(currentFrame))
                        .map((pred, idx) => (
                            <div key={idx} className="warning-badge">
                                <span className="warning-icon">⚠️</span>
                                <span className="warning-text">{pred.injury_type}</span>
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    )
}
