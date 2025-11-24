import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import './AnalyticsDashboard.css'

export default function AnalyticsDashboard({ analytics }) {
    if (!analytics || Object.keys(analytics).length === 0) {
        return (
            <div className="dashboard-placeholder">
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <svg style={{ width: '64px', height: '64px', margin: '0 auto 1rem', opacity: 0.5 }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#e5e7eb' }}>Analytics Not Available</h3>
                    <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
                        Please upload a video to view detailed analytics.
                    </p>
                </div>
            </div>
        )
    }

    const summary = analytics.summary || {}
    const posture = analytics.posture_metrics || {}
    const motion = analytics.motion_metrics || {}
    const symmetry = analytics.symmetry_analysis || {}
    const bodyRegions = analytics.body_region_analysis || {}
    const temporal = analytics.temporal_analysis || {}
    const stability = analytics.stability_metrics || {}
    const efficiency = analytics.efficiency_metrics || {}
    const anomalies = analytics.anomalies || {}
    const risks = analytics.risk_assessment || {}
    const movement = analytics.movement_quality || {}
    const jointAngles = analytics.joint_angles || {}
    const aiInjury = analytics.ai_injury_prediction || {}

    const overallScore = summary.overall_score || 0
    const grade = summary.grade || 'N/A'
    const duration = summary.duration_seconds || 0
    const totalFrames = summary.total_frames || 0

    // Prepare data for charts
    const jointAngleData = prepareJointAngleData(jointAngles)
    const bodyRegionData = prepareBodyRegionData(bodyRegions.activity_by_region || {})
    const movementQualityData = prepareMovementQualityData(movement)
    const symmetryByPartData = prepareSymmetryData(symmetry.by_body_part || {})

    // Key findings
    const keyFindings = summary.key_findings || []
    const strengths = summary.strengths || []
    const weaknesses = summary.weaknesses || []

    return (
        <div className="analytics-dashboard-v2">
            {/* Hero Section - Overview */}
            <section className="analytics-hero">
                <div className="hero-content">
                    <div className="score-display">
                        <div className="circular-score">
                            <svg viewBox="0 0 200 200" className="score-circle">
                                <circle cx="100" cy="100" r="90" fill="none" stroke="#2a2a2a" strokeWidth="12" />
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="90"
                                    fill="none"
                                    stroke="url(#scoreGradient)"
                                    strokeWidth="12"
                                    strokeDasharray={`${overallScore * 5.65} 565`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 100 100)"
                                />
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#0ea5e9" />
                                        <stop offset="100%" stopColor="#d946ef" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="score-text">
                                <div className="score-number">{overallScore.toFixed(0)}</div>
                                <div className="score-label">Overall Score</div>
                                <div className="score-grade">Grade: {grade}</div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-icon">🎯</span>
                            <div className="stat-details">
                                <div className="stat-value">{posture.overall_posture_score?.toFixed(1) || 0}</div>
                                <div className="stat-label">Posture Score</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <span className="stat-icon">⚖️</span>
                            <div className="stat-details">
                                <div className="stat-value">{symmetry.overall_score?.toFixed(1) || 0}</div>
                                <div className="stat-label">Symmetry</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <span className="stat-icon">✨</span>
                            <div className="stat-details">
                                <div className="stat-value">{movement.smoothness?.toFixed(1) || 0}</div>
                                <div className="stat-label">Smoothness</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <span className="stat-icon">🎬</span>
                            <div className="stat-details">
                                <div className="stat-value">{totalFrames}</div>
                                <div className="stat-label">Frames ({duration.toFixed(1)}s)</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Findings */}
                {keyFindings.length > 0 && (
                    <div className="key-findings">
                        <h3 className="section-title">📊 Key Findings</h3>
                        <div className="findings-grid">
                            {keyFindings.map((finding, idx) => (
                                <div key={idx} className={`finding-card ${finding.type}`}>
                                    <div className="finding-icon">
                                        {finding.type === 'positive' ? '✅' : finding.type === 'warning' ? '⚠️' : 'ℹ️'}
                                    </div>
                                    <div className="finding-content">
                                        <div className="finding-text">{finding.text}</div>
                                        <div className="finding-score">{finding.score.toFixed(1)}/100</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* AI Injury Risk Prediction Section - PROMINENT */}
            {aiInjury && aiInjury.predictions && (
                <section className="analytics-section ai-injury-section">
                    <div className="section-header">
                        <h2 className="section-title">🤖 AI Injury Risk Prediction</h2>
                        <p className="section-subtitle">
                            Machine learning analysis of movement patterns to predict potential injury risks
                        </p>
                    </div>

                    {/* Overall Risk Level */}
                    <div className={`ai-risk-banner risk-${aiInjury.overall_color}`}>
                        <div className="risk-banner-content">
                            <div className="risk-level-display">
                                <div className="risk-icon">
                                    {aiInjury.overall_color === 'safe' && '✅'}
                                    {aiInjury.overall_color === 'caution' && '⚠️'}
                                    {aiInjury.overall_color === 'warning' && '🚨'}
                                    {aiInjury.overall_color === 'danger' && '🔴'}
                                </div>
                                <div>
                                    <div className="risk-level-text">{aiInjury.overall_risk_level} Risk</div>
                                    <div className="risk-confidence">AI Confidence: {aiInjury.ai_confidence}%</div>
                                </div>
                            </div>
                            <div className="risk-summary">
                                {aiInjury.total_risks_detected} potential risk{aiInjury.total_risks_detected !== 1 ? 's' : ''} detected
                            </div>
                        </div>
                    </div>

                    {/* Injury Predictions */}
                    <div className="injury-predictions-grid">
                        {aiInjury.predictions.map((prediction, idx) => (
                            <div key={idx} className={`injury-prediction-card severity-${prediction.severity.toLowerCase()}`}>
                                <div className="injury-header">
                                    <div className="injury-title">
                                        <span className="injury-icon">
                                            {prediction.body_part === 'Knee' && '🦵'}
                                            {prediction.body_part === 'Spine' || prediction.body_part === 'Lower Back' && '🔙'}
                                            {prediction.body_part === 'Shoulder' && '💪'}
                                            {prediction.body_part === 'Hip' && '🏃'}
                                            {prediction.body_part === 'Ankle' && '👟'}
                                            {prediction.body_part === 'Overall' && '✅'}
                                        </span>
                                        <div>
                                            <h4 className="injury-type">{prediction.injury_type}</h4>
                                            <p className="body-part">{prediction.body_part}</p>
                                        </div>
                                    </div>
                                    <div className="risk-score-badge">
                                        <div className="score-circle-mini">
                                            <svg viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="#2a2a2a" strokeWidth="8" />
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    fill="none"
                                                    stroke={
                                                        prediction.risk_score >= 70 ? '#ef4444' :
                                                            prediction.risk_score >= 50 ? '#f59e0b' :
                                                                prediction.risk_score >= 30 ? '#fbbf24' :
                                                                    '#10b981'
                                                    }
                                                    strokeWidth="8"
                                                    strokeDasharray={`${prediction.risk_score * 2.83} 283`}
                                                    strokeLinecap="round"
                                                    transform="rotate(-90 50 50)"
                                                />
                                            </svg>
                                            <div className="score-text-mini">{prediction.risk_score}</div>
                                        </div>
                                        <span className={`severity-label severity-${prediction.severity.toLowerCase()}`}>
                                            {prediction.severity}
                                        </span>
                                    </div>
                                </div>

                                <p className="injury-description">{prediction.description}</p>

                                {prediction.warning_signs && prediction.warning_signs.length > 0 && (
                                    <div className="warning-signs">
                                        <h5 className="subsection-title">⚠️ Warning Signs Detected:</h5>
                                        <ul>
                                            {prediction.warning_signs.map((sign, i) => (
                                                <li key={i}>{sign}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {prediction.prevention_tips && prediction.prevention_tips.length > 0 && (
                                    <div className="prevention-tips">
                                        <h5 className="subsection-title">💡 Prevention Tips:</h5>
                                        <ul>
                                            {prediction.prevention_tips.slice(0, 3).map((tip, i) => (
                                                <li key={i}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="prediction-confidence">
                                    Prediction Confidence: {prediction.confidence}%
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* AI Recommendations */}
                    {aiInjury.recommendations && aiInjury.recommendations.length > 0 && (
                        <div className="glass-card ai-recommendations">
                            <div className="card-header">
                                <span className="card-icon">🎯</span>
                                <h3 className="card-title">AI-Generated Recommendations</h3>
                            </div>
                            <ul className="recommendations-list">
                                {aiInjury.recommendations.map((rec, idx) => (
                                    <li key={idx} className="recommendation-item">
                                        <span className="check-icon">
                                            {rec.startsWith('⚠️') ? '⚠️' : '✓'}
                                        </span>
                                        {rec.replace('⚠️ ', '')}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="ai-disclaimer">
                        <strong>⚕️ Medical Disclaimer:</strong> This AI analysis is for informational purposes only and should not replace professional medical advice.
                        Consult a qualified healthcare provider or sports medicine specialist for personalized assessment and treatment.
                    </div>
                </section>
            )}

            {/* Movement Quality Section */}
            <section className="analytics-section">
                <div className="section-header">
                    <h2 className="section-title">🎯 Movement Quality Analysis</h2>
                    <p className="section-subtitle">How smooth and controlled is the movement?</p>
                </div>

                <div className="grid-2">
                    {/* Movement Quality Radar */}
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Quality Breakdown</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={movementQualityData}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="metric" stroke="#9ca3af" />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                                <Radar name="Score" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                                <Tooltip
                                    contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: '0.5rem' }}
                                    labelStyle={{ color: '#9ca3af' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stability & Efficiency */}
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Performance Metrics</h3>
                        <div className="metrics-list">
                            <div className="metric-row">
                                <span className="metric-name">⚖️ Balance Score</span>
                                <div className="metric-bar">
                                    <div className="metric-fill" style={{ width: `${stability.balance_score || 0}%`, background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)' }}>
                                        <span className="metric-value">{(stability.balance_score || 0).toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="metric-row">
                                <span className="metric-name">💪 Control</span>
                                <div className="metric-bar">
                                    <div className="metric-fill" style={{ width: `${movement.control || 0}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }}>
                                        <span className="metric-value">{(movement.control || 0).toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="metric-row">
                                <span className="metric-name">⚡ Efficiency</span>
                                <div className="metric-bar">
                                    <div className="metric-fill" style={{ width: `${efficiency.movement_economy || 0}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }}>
                                        <span className="metric-value">{(efficiency.movement_economy || 0).toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="metric-row">
                                <span className="metric-name">🎯 Directness</span>
                                <div className="metric-bar">
                                    <div className="metric-fill" style={{ width: `${efficiency.directness_score || 0}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}>
                                        <span className="metric-value">{(efficiency.directness_score || 0).toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Body Analysis Section */}
            <section className="analytics-section">
                <div className="section-header">
                    <h2 className="section-title">🧍 Body Region Analysis</h2>
                    <p className="section-subtitle">Which parts of your body are most active?</p>
                </div>

                <div className="grid-2">
                    {/* Body Region Activity */}
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Activity by Region</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={bodyRegionData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis dataKey="region" type="category" stroke="#9ca3af" width={100} />
                                <Tooltip
                                    contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: '0.5rem' }}
                                    labelStyle={{ color: '#9ca3af' }}
                                />
                                <Bar dataKey="value" fill="url(#regionGradient)" radius={[0, 8, 8, 0]} />
                                <defs>
                                    <linearGradient id="regionGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#ec4899" />
                                        <stop offset="100%" stopColor="#f472b6" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Symmetry by Body Part */}
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Left-Right Symmetry</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={symmetryByPartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="part" stroke="#9ca3af" />
                                <YAxis domain={[0, 100]} stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: '0.5rem' }}
                                    labelStyle={{ color: '#9ca3af' }}
                                />
                                <Bar dataKey="score" fill="url(#symmetryGradient)" radius={[8, 8, 0, 0]} />
                                <defs>
                                    <linearGradient id="symmetryGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#60a5fa" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Joint Angles Section */}
            <section className="analytics-section">
                <div className="section-header">
                    <h2 className="section-title">📐 Joint Angle Analysis</h2>
                    <p className="section-subtitle">Track how your joints move throughout the video</p>
                </div>

                <div className="chart-card glass-card">
                    {jointAngleData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={jointAngleData.slice(0, 100)}>
                                <defs>
                                    <linearGradient id="leftKneeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="rightKneeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="leftElbowGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="rightElbowGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="frame" stroke="#9ca3af" label={{ value: 'Frame', position: 'insideBottom', offset: -5, fill: '#9ca3af' }} />
                                <YAxis stroke="#9ca3af" label={{ value: 'Angle (degrees)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                                <Tooltip
                                    contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: '0.5rem' }}
                                    labelStyle={{ color: '#9ca3af' }}
                                />
                                <Legend wrapperStyle={{ color: '#9ca3af' }} />
                                {jointAngles.left_knee && <Area type="monotone" dataKey="left_knee" stroke="#8b5cf6" fill="url(#leftKneeGrad)" strokeWidth={2} />}
                                {jointAngles.right_knee && <Area type="monotone" dataKey="right_knee" stroke="#ec4899" fill="url(#rightKneeGrad)" strokeWidth={2} />}
                                {jointAngles.left_elbow && <Area type="monotone" dataKey="left_elbow" stroke="#10b981" fill="url(#leftElbowGrad)" strokeWidth={2} />}
                                {jointAngles.right_elbow && <Area type="monotone" dataKey="right_elbow" stroke="#f59e0b" fill="url(#rightElbowGrad)" strokeWidth={2} />}
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                            No joint angle data available
                        </div>
                    )}
                </div>
            </section>

            {/* Insights & Recommendations */}
            <section className="analytics-section">
                <div className="grid-2">
                    {/* Strengths */}
                    <div className="glass-card">
                        <div className="card-header">
                            <span className="card-icon">💪</span>
                            <h3 className="card-title">Strengths</h3>
                        </div>
                        <ul className="strengths-list">
                            {strengths.length > 0 ? (
                                strengths.map((strength, idx) => (
                                    <li key={idx} className="strength-item">
                                        <span className="bullet">✓</span>
                                        {strength}
                                    </li>
                                ))
                            ) : (
                                <li className="strength-item">
                                    <span className="bullet">-</span>
                                    Upload a video to see your strengths
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Areas for Improvement */}
                    <div className="glass-card">
                        <div className="card-header">
                            <span className="card-icon">🎯</span>
                            <h3 className="card-title">Areas for Improvement</h3>
                        </div>
                        <ul className="weaknesses-list">
                            {weaknesses.length > 0 ? (
                                weaknesses.map((weakness, idx) => (
                                    <li key={idx} className="weakness-item">
                                        <span className="bullet">→</span>
                                        {weakness}
                                    </li>
                                ))
                            ) : (
                                <li className="weakness-item">
                                    <span className="bullet">-</span>
                                    No specific areas identified
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Detailed Insights & Recommendations */}
            <section className="analytics-section">
                <div className="grid-2">
                    <div className="glass-card">
                        <div className="card-header">
                            <span className="card-icon">💡</span>
                            <h3 className="card-title">Detailed Insights</h3>
                        </div>
                        <ul className="insights-list">
                            {summary.insights && summary.insights.length > 0 ? (
                                summary.insights.map((insight, idx) => (
                                    <li key={idx} className="insight-item">
                                        <span className="bullet">•</span>
                                        {insight}
                                    </li>
                                ))
                            ) : (
                                <li className="insight-item">
                                    <span className="bullet">•</span>
                                    Upload a video to generate insights
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="glass-card">
                        <div className="card-header">
                            <span className="card-icon">📋</span>
                            <h3 className="card-title">Recommendations</h3>
                        </div>
                        <ul className="recommendations-list">
                            {summary.recommendations && summary.recommendations.length > 0 ? (
                                summary.recommendations.map((rec, idx) => (
                                    <li key={idx} className="recommendation-item">
                                        <span className="check-icon">✓</span>
                                        {rec}
                                    </li>
                                ))
                            ) : (
                                <li className="recommendation-item">
                                    <span className="check-icon">✓</span>
                                    No specific recommendations at this time
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Risk Assessment */}
            {risks.risk_factors && risks.risk_factors.length > 0 && (
                <section className="analytics-section">
                    <div className="section-header">
                        <h2 className="section-title">⚠️ Risk Assessment</h2>
                        <p className="section-subtitle">Potential areas of concern for injury prevention</p>
                    </div>

                    <div className="glass-card">
                        <div className="risk-level">
                            <span className={`risk-badge ${risks.injury_risk_level?.toLowerCase()}`}>
                                {risks.injury_risk_level} Risk
                            </span>
                            <div className="risk-score">Overall Risk Score: {risks.overall_risk_score}/100</div>
                        </div>

                        <div className="risk-factors">
                            {risks.risk_factors.map((factor, idx) => (
                                <div key={idx} className="risk-factor-item">
                                    <div className="factor-name">{factor.factor}</div>
                                    <span className={`severity-badge ${factor.severity.toLowerCase()}`}>
                                        {factor.severity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Export */}
            <div className="export-section">
                <button
                    className="export-btn"
                    onClick={() => {
                        const dataStr = JSON.stringify(analytics, null, 2)
                        const dataBlob = new Blob([dataStr], { type: 'application/json' })
                        const url = URL.createObjectURL(dataBlob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = 'analytics.json'
                        link.click()
                    }}
                >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                    </svg>
                    Export Analytics (JSON)
                </button>
            </div>
        </div>
    )
}

// Helper functions
function prepareJointAngleData(jointAngles) {
    if (!jointAngles || Object.keys(jointAngles).length === 0) return []

    const firstKey = Object.keys(jointAngles)[0]
    const length = jointAngles[firstKey]?.length || 0

    return Array.from({ length }, (_, i) => ({
        frame: i,
        left_knee: jointAngles.left_knee?.[i],
        right_knee: jointAngles.right_knee?.[i],
        left_elbow: jointAngles.left_elbow?.[i],
        right_elbow: jointAngles.right_elbow?.[i]
    }))
}

function prepareBodyRegionData(regions) {
    return Object.entries(regions).map(([region, value]) => ({
        region: region.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: parseFloat((value * 1000).toFixed(2)) // Scale for visibility
    }))
}

function prepareMovementQualityData(movement) {
    return [
        { metric: 'Smoothness', value: movement.smoothness || 0 },
        { metric: 'Consistency', value: movement.consistency || 0 },
        { metric: 'Fluidity', value: movement.fluidity || 0 },
        { metric: 'Control', value: movement.control || 0 }
    ]
}

function prepareSymmetryData(byPart) {
    return Object.entries(byPart).map(([part, score]) => ({
        part: part.charAt(0).toUpperCase() + part.slice(1),
        score: parseFloat(score.toFixed(1))
    }))
}
