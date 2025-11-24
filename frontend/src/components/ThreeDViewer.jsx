import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import './ThreeDViewer.css'

// Complete MediaPipe Pose Landmark Connections (33 points)
// Organized by body parts for color coding
const BONES = [
    // Face outline
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    // Mouth
    [9, 10],
    // Upper body - shoulders and arms
    [11, 12], // Shoulders
    [11, 13], [13, 15], // Left arm
    [12, 14], [14, 16], // Right arm
    // Torso
    [11, 23], [12, 24], // Shoulder to hip
    [23, 24], // Hips
    // Lower body - legs
    [23, 25], [25, 27], // Left leg
    [24, 26], [26, 28], // Right leg
    // Feet
    [27, 29], [29, 31], // Left foot
    [28, 30], [30, 32], // Right foot
];

// Body part groups for color coding
const BODY_PARTS = {
    face: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    leftArm: [11, 13, 15],
    rightArm: [12, 14, 16],
    torso: [11, 12, 23, 24],
    leftLeg: [23, 25, 27, 29, 31],
    rightLeg: [24, 26, 28, 30, 32],
};

// Bone colors by body part
const getBoneColor = (boneIndex) => {
    const [a, b] = BONES[boneIndex];
    
    // Face - cyan
    if (a <= 10 && b <= 10) return 0x00ffff;
    
    // Left arm - yellow
    if ((a === 11 || a === 13 || a === 15) && (b === 11 || b === 13 || b === 15)) return 0xffff00;
    
    // Right arm - orange
    if ((a === 12 || a === 14 || a === 16) && (b === 12 || b === 14 || b === 16)) return 0xff8800;
    
    // Torso - green
    if ((a === 11 || a === 12 || a === 23 || a === 24) && 
        (b === 11 || b === 12 || b === 23 || b === 24) &&
        !(a === 11 && b === 13) && !(a === 12 && b === 14)) return 0x00ff00;
    
    // Left leg - blue
    if ((a === 23 || a === 25 || a === 27 || a === 29 || a === 31) && 
        (b === 23 || b === 25 || b === 27 || b === 29 || b === 31)) return 0x0088ff;
    
    // Right leg - magenta
    if ((a === 24 || a === 26 || a === 28 || a === 30 || a === 32) && 
        (b === 24 || b === 26 || b === 28 || b === 30 || b === 32)) return 0xff00ff;
    
    // Default - white
    return 0xffffff;
};

export default function ThreeDViewer({ poseData }) {
    const containerRef = useRef(null)
    const rendererRef = useRef(null)
    const sceneRef = useRef(null)
    const cameraRef = useRef(null)
    const controlsRef = useRef(null)
    const frameIdRef = useRef(null)

    const skeletonRef = useRef(null)
    const skeletonLinesRef = useRef([]) // Array of Line objects for color coding
    const jointsRef = useRef(null) // Joint spheres

    const [isPlaying, setIsPlaying] = useState(true)
    const [currentFrame, setCurrentFrame] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0)

    // MANUAL CONTROLS
    const [manualScale, setManualScale] = useState(3.0) // Better default scale
    const [manualX, setManualX] = useState(0)
    const [manualY, setManualY] = useState(0)

    // Initialize Three.js
    useEffect(() => {
        if (!containerRef.current) return

        console.log("ThreeDViewer: Initializing...")

        // Ensure container has dimensions
        const getDimensions = () => {
            const rect = containerRef.current.getBoundingClientRect()
            return {
                width: rect.width || 800,
                height: rect.height || 600
            }
        }

        let renderer = null
        let resizeHandler = null
        let timeoutId = null

        const initializeThreeJS = (w, h) => {
            // Scene - Transparent background for clear view
            const scene = new THREE.Scene()
            scene.background = null // Transparent background
            sceneRef.current = scene

            // Camera
            const camera = new THREE.PerspectiveCamera(60, w / h, 0.01, 1000)
            camera.position.set(0, 0, 5)
            cameraRef.current = camera

            // Renderer - Transparent background
            renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true, // Enable transparency
                powerPreference: "high-performance"
            })
            renderer.setSize(w, h)
            renderer.setPixelRatio(window.devicePixelRatio)
            renderer.setClearColor(0x000000, 0) // Transparent clear color
            renderer.domElement.style.display = 'block'
            renderer.domElement.style.width = '100%'
            renderer.domElement.style.height = '100%'
            renderer.domElement.style.background = 'transparent'
            renderer.domElement.style.position = 'absolute'
            renderer.domElement.style.top = '0'
            renderer.domElement.style.left = '0'
            renderer.domElement.style.zIndex = '1'
            containerRef.current.appendChild(renderer.domElement)
            rendererRef.current = renderer

            // Controls
            const controls = new OrbitControls(camera, renderer.domElement)
            controls.enableDamping = true
            controls.dampingFactor = 0.05
            controlsRef.current = controls

            // Enhanced Helpers - Lighter and more subtle
            const gridHelper = new THREE.GridHelper(20, 20, 0x666666, 0x333333)
            gridHelper.material.opacity = 0.2
            gridHelper.material.transparent = true
            scene.add(gridHelper)
            
            // Optional axes helper (can be removed if not needed)
            // const axesHelper = new THREE.AxesHelper(2)
            // scene.add(axesHelper)
            
            // Add ambient light for better visibility
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
            scene.add(ambientLight)
            
            // Add directional light for depth
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
            directionalLight.position.set(5, 10, 5)
            scene.add(directionalLight)

            // Optional: Reference cube (can be toggled for debugging)
            // const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5)
            // const cubeMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
            // const cube = new THREE.Mesh(cubeGeo, cubeMat)
            // cube.position.set(2, 0, 0)
            // scene.add(cube)

            // Create individual colored lines for each bone (better visualization)
            const skeletonLines = [];
            for (let i = 0; i < BONES.length; i++) {
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array(2 * 3); // 2 points, 3 coords each
                geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
                const color = getBoneColor(i);
                
                // Vary line width by body part importance
                let lineWidth = 3;
                const [a, b] = BONES[i];
                if ((a >= 11 && a <= 16) || (b >= 11 && b <= 16)) lineWidth = 4; // Arms thicker
                if ((a >= 23 && a <= 32) || (b >= 23 && b <= 32)) lineWidth = 4; // Legs thicker
                
                const material = new THREE.LineBasicMaterial({ 
                    color: color, 
                    linewidth: lineWidth,
                    transparent: true,
                    opacity: 0.95
                });
                const line = new THREE.Line(geometry, material);
                scene.add(line);
                skeletonLines.push(line);
            }
            skeletonLinesRef.current = skeletonLines

            // Create joint spheres for better visualization with varying sizes
            const jointGroup = new THREE.Group();
            const joints = [];
            
            // Different sizes for different joint types
            const getJointSize = (i) => {
                if (BODY_PARTS.face.includes(i)) return 0.025; // Smaller for face
                if (i === 11 || i === 12) return 0.05; // Larger for shoulders
                if (i === 23 || i === 24) return 0.05; // Larger for hips
                return 0.04; // Default size
            };
            
            for (let i = 0; i < 33; i++) {
                let color = 0xffffff;
                // Color code joints by body part
                if (BODY_PARTS.face.includes(i)) color = 0x00ffff; // Cyan
                else if (BODY_PARTS.leftArm.includes(i)) color = 0xffff00; // Yellow
                else if (BODY_PARTS.rightArm.includes(i)) color = 0xff8800; // Orange
                else if (BODY_PARTS.torso.includes(i)) color = 0x00ff00; // Green
                else if (BODY_PARTS.leftLeg.includes(i)) color = 0x0088ff; // Blue
                else if (BODY_PARTS.rightLeg.includes(i)) color = 0xff00ff; // Magenta
                
                const jointGeometry = new THREE.SphereGeometry(getJointSize(i), 16, 16);
                const material = new THREE.MeshPhongMaterial({ 
                    color: color,
                    transparent: true,
                    opacity: 0.9,
                    shininess: 100
                });
                const sphere = new THREE.Mesh(jointGeometry, material);
                sphere.position.set(0, 0, 0);
                sphere.castShadow = true;
                sphere.receiveShadow = true;
                jointGroup.add(sphere);
                joints.push(sphere);
            }
            scene.add(jointGroup);
            jointsRef.current = joints

            // Loop
            const animate = () => {
                frameIdRef.current = requestAnimationFrame(animate)
                controls.update()
                renderer.render(scene, camera)
            }
            animate()

            // Resize handler
            resizeHandler = () => {
                if (!containerRef.current) return
                const { width: nw, height: nh } = getDimensions()
                if (nw > 0 && nh > 0) {
                    camera.aspect = nw / nh
                    camera.updateProjectionMatrix()
                    renderer.setSize(nw, nh)
                }
            }
            window.addEventListener('resize', resizeHandler)
        }

        const { width: w, height: h } = getDimensions()

        if (w === 0 || h === 0) {
            console.warn("ThreeDViewer: Container has zero dimensions, retrying...")
            timeoutId = setTimeout(() => {
                if (containerRef.current) {
                    const { width: nw, height: nh } = getDimensions()
                    if (nw > 0 && nh > 0) {
                        initializeThreeJS(nw, nh)
                    }
                }
            }, 100)
        } else {
            initializeThreeJS(w, h)
        }

        // Cleanup function
        return () => {
            if (timeoutId) clearTimeout(timeoutId)
            if (resizeHandler) window.removeEventListener('resize', resizeHandler)
            cancelAnimationFrame(frameIdRef.current)
            if (renderer) {
                renderer.dispose()
                if (containerRef.current && renderer.domElement.parentNode) {
                    renderer.domElement.parentNode.removeChild(renderer.domElement)
                }
            }
            // Clean up skeleton lines
            if (skeletonLinesRef.current) {
                skeletonLinesRef.current.forEach(line => {
                    if (line.geometry) line.geometry.dispose();
                    if (line.material) line.material.dispose();
                    if (line.parent) line.parent.remove(line);
                });
                skeletonLinesRef.current = [];
            }
            
            // Clean up joints
            if (jointsRef.current) {
                jointsRef.current.forEach(joint => {
                    if (joint.geometry) joint.geometry.dispose();
                    if (joint.material) joint.material.dispose();
                });
                jointsRef.current = [];
            }
        }
    }, [])

    // Auto Center Function
    const handleAutoCenter = () => {
        if (!poseData || !poseData[currentFrame] || !cameraRef.current || !controlsRef.current) return
        const landmarks = poseData[currentFrame].landmarks

        if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
            console.warn("ThreeDViewer: Cannot auto-center - no valid landmarks")
            return
        }

        const box = new THREE.Box3()
        landmarks.forEach(lm => {
            if (lm && typeof lm.x === 'number' && typeof lm.y === 'number') {
                const x = (lm.x + manualX) * manualScale
                const y = -(lm.y + manualY) * manualScale
                const z = (lm.z || 0) * manualScale
                box.expandByPoint(new THREE.Vector3(x, y, z))
            }
        })

        if (box.isEmpty()) {
            console.warn("ThreeDViewer: Cannot auto-center - bounding box is empty")
            return
        }

        const center = new THREE.Vector3()
        box.getCenter(center)
        const size = new THREE.Vector3()
        box.getSize(size)

        console.log("ThreeDViewer: Auto-Center", { center, size })

        controlsRef.current.target.copy(center)
        // Move camera back enough to see the whole height
        const maxDim = Math.max(size.x, size.y, size.z)
        const dist = maxDim * 2 || 20 // Default to 20 if size is 0
        cameraRef.current.position.set(center.x, center.y, center.z + dist)
        controlsRef.current.update()
    }

    // Render Loop
    useEffect(() => {
        if (!poseData || !skeletonLinesRef.current || skeletonLinesRef.current.length === 0) return

        const frame = poseData[currentFrame]
        if (!frame || !frame.landmarks) return

        const landmarks = frame.landmarks // List of {x,y,z}

        if (!landmarks || landmarks.length !== 33) {
            console.warn(`ThreeDViewer: Invalid landmarks length: ${landmarks?.length || 0}`)
            return
        }

        // Auto-center on first valid frame if not already done
        // We use a ref to track if we've centered
        if (currentFrame === 0 && !window.hasCentered && cameraRef.current && controlsRef.current) {
            setTimeout(() => {
                handleAutoCenter()
                window.hasCentered = true
            }, 100) // Small delay to ensure scene is ready
        }

        // Update Skeleton Lines with color coding
        if (skeletonLinesRef.current && skeletonLinesRef.current.length === BONES.length) {
            for (let i = 0; i < BONES.length; i++) {
                const [a, b] = BONES[i];
                const A = landmarks[a];
                const B = landmarks[b];
                const line = skeletonLinesRef.current[i];

                if (A && B && typeof A.x === 'number' && typeof B.x === 'number' && line) {
                    // Apply Manual Transforms + Scale
                    const ax = (A.x + manualX) * manualScale
                    const ay = -(A.y + manualY) * manualScale // Invert Y for Three.js
                    const az = (A.z || 0) * manualScale

                    const bx = (B.x + manualX) * manualScale
                    const by = -(B.y + manualY) * manualScale
                    const bz = (B.z || 0) * manualScale

                    // Update line geometry
                    const posAttr = line.geometry.attributes.position
                    if (posAttr && posAttr.array.length >= 6) {
                        posAttr.array[0] = ax;
                        posAttr.array[1] = ay;
                        posAttr.array[2] = az;
                        posAttr.array[3] = bx;
                        posAttr.array[4] = by;
                        posAttr.array[5] = bz;
                        posAttr.needsUpdate = true;
                    }
                    
                    // Make line visible
                    line.visible = true;
                } else if (line) {
                    // Hide line if data is invalid
                    line.visible = false;
                }
            }
        }

        // Update Joint Spheres
        if (jointsRef.current && jointsRef.current.length === 33) {
            for (let i = 0; i < 33; i++) {
                const lm = landmarks[i];
                const sphere = jointsRef.current[i];
                
                if (lm && typeof lm.x === 'number' && sphere) {
                    const x = (lm.x + manualX) * manualScale
                    const y = -(lm.y + manualY) * manualScale
                    const z = (lm.z || 0) * manualScale
                    
                    sphere.position.set(x, y, z);
                    sphere.visible = true;
                } else if (sphere) {
                    sphere.visible = false;
                }
            }
        }

    }, [currentFrame, poseData, manualScale, manualX, manualY])

    // Playback with smoother frame rate
    useEffect(() => {
        if (!isPlaying || !poseData || poseData.length === 0) return
        
        // Use requestAnimationFrame for smoother playback
        let lastTime = performance.now()
        let rafId = null
        const frameTime = 33.33 / playbackSpeed // ~30fps base, adjusted by speed
        
        const animate = (currentTime) => {
            const delta = currentTime - lastTime
            if (delta >= frameTime) {
                setCurrentFrame(c => (c + 1) % poseData.length)
                lastTime = currentTime - (delta % frameTime)
            }
            rafId = requestAnimationFrame(animate)
        }
        
        rafId = requestAnimationFrame(animate)
        return () => {
            if (rafId) cancelAnimationFrame(rafId)
        }
    }, [isPlaying, playbackSpeed, poseData])



    // Debug Data
    const firstLM = poseData?.[currentFrame]?.landmarks?.[0]

    if (!poseData || poseData.length === 0) {
        return (
            <div className="viewer-container">
                <div className="viewer-placeholder">No Data Available</div>
            </div>
        )
    }

    return (
        <div className="viewer-container">
            <div className="viewer-canvas" ref={containerRef} style={{ zIndex: 1 }} />

            {/* MANUAL CONTROLS OVERLAY */}
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 8, color: 'white', width: 250, zIndex: 10, pointerEvents: 'auto' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Adjust View</h4>

                <div style={{ marginBottom: 5 }}>
                    <label>Scale: {manualScale.toFixed(1)}</label>
                    <input type="range" min="0.1" max="20" step="0.1" value={manualScale} onChange={e => setManualScale(parseFloat(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ marginBottom: 5 }}>
                    <label>X Offset: {manualX}</label>
                    <input type="range" min="-5" max="5" step="0.1" value={manualX} onChange={e => setManualX(parseFloat(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label>Y Offset: {manualY}</label>
                    <input type="range" min="-5" max="5" step="0.1" value={manualY} onChange={e => setManualY(parseFloat(e.target.value))} style={{ width: '100%' }} />
                </div>

                <button onClick={handleAutoCenter} style={{ width: '100%', padding: 5, background: '#0ea5e9', border: 'none', borderRadius: 4, color: 'white', cursor: 'pointer', marginBottom: 10 }}>
                    Auto-Center Camera
                </button>

                <div style={{ borderTop: '1px solid #444', paddingTop: 5, fontSize: 11, fontFamily: 'monospace' }}>
                    <strong>Frame {currentFrame + 1} / {poseData.length}</strong><br />
                    <strong>Raw Data (Nose):</strong><br />
                    X: {firstLM?.x?.toFixed(2) ?? 'N/A'}<br />
                    Y: {firstLM?.y?.toFixed(2) ?? 'N/A'}<br />
                    Z: {firstLM?.z?.toFixed(2) ?? 'N/A'}
                </div>
            </div>

            <div className="viewer-controls glass-card" style={{ zIndex: 10, pointerEvents: 'auto' }}>
                <div className="control-row">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="control-btn">{isPlaying ? '||' : '▶'}</button>
                    <button onClick={() => setCurrentFrame(0)} className="control-btn">↺</button>
                    <div className="speed-controls">
                        {[0.5, 1, 2].map(s => <button key={s} onClick={() => setPlaybackSpeed(s)} className={`speed-btn ${playbackSpeed === s ? 'active' : ''}`}>{s}x</button>)}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', minWidth: '60px' }}>
                        {currentFrame + 1} / {poseData.length}
                    </span>
                    <input 
                        type="range" 
                        min="0" 
                        max={poseData.length - 1} 
                        value={currentFrame} 
                        onChange={e => setCurrentFrame(parseInt(e.target.value))} 
                        className="frame-scrubber" 
                        style={{ flex: 1 }} 
                    />
                </div>
            </div>
        </div>
    )
}
