import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertCircle, CheckCircle, TrendingUp, Code, Activity, Zap, Shield, Target, Brain, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [formData, setFormData] = useState({
    moduleName: '',
    loc: '',
    complexity: '',
    commitFrequency: '',
    functionPoints: '',
    teamSize: '5'
  });
  const [analyses, setAnalyses] = useState([]);
  // 🔹 Load saved analyses from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("analyses");
    if (saved) {
      try {
        setAnalyses(JSON.parse(saved));
        console.log("Loaded from localStorage:", JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse saved analyses:", err);
      }
    }
  }, []);

  // 🔹 Save analyses to localStorage whenever it changes
  useEffect(() => {
    if (analyses.length > 0) {
      localStorage.setItem("analyses", JSON.stringify(analyses));
      console.log("Saved to localStorage:", analyses);
    }
  }, [analyses]);

  useEffect(() => {
    console.log("Loaded from localStorage:", localStorage.getItem("analyses"));
  }, []);

  useEffect(() => {
    console.log("Saved to localStorage:", analyses);
  }, [analyses]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const COCOMO_CONSTANTS = {
    a: 2.94,
    b: 0.91,
    c: 3.67,
    d: 0.28
  };

  const calculateCOCOMO = (loc, complexity, teamSize) => {
    const kloc = loc / 1000;
    const effortMultiplier = complexity === 'high' ? 1.3 : complexity === 'medium' ? 1.0 : 0.8;
    const effort = COCOMO_CONSTANTS.a * Math.pow(kloc, COCOMO_CONSTANTS.b) * effortMultiplier;
    const time = COCOMO_CONSTANTS.c * Math.pow(effort, COCOMO_CONSTANTS.d);
    const avgStaff = effort / time;
    const cost = effort * 8000;

    return {
      effort: effort.toFixed(2),
      time: time.toFixed(2),
      avgStaff: avgStaff.toFixed(2),
      cost: cost.toFixed(2)
    };
  };

  const calculateRiskScore = (loc, complexity, commitFrequency) => {
    let score = 0;
    if (loc > 5000) score += 40;
    else if (loc > 2000) score += 25;
    else if (loc > 1000) score += 15;
    else score += 5;

    if (complexity === 'high') score += 35;
    else if (complexity === 'medium') score += 20;
    else score += 8;

    if (commitFrequency > 50) score += 25;
    else if (commitFrequency > 20) score += 15;
    else score += 5;

    return score;
  };

  const handleAnalyze = () => {
    if (!formData.moduleName || !formData.loc || !formData.complexity || !formData.commitFrequency) {
      alert('Please fill in all required fields');
      return;
    }

    setIsAnalyzing(true);

    setTimeout(() => {
      const loc = parseInt(formData.loc);
      const commitFreq = parseInt(formData.commitFrequency);
      const teamSize = parseInt(formData.teamSize);

      const riskScore = calculateRiskScore(loc, formData.complexity, commitFreq);
      const prediction = riskScore > 60 ? 'High Risk' : riskScore > 35 ? 'Medium Risk' : 'Low Risk';
      const cocomo = calculateCOCOMO(loc, formData.complexity, teamSize);

      const newAnalysis = {
        id: Date.now(),
        moduleName: formData.moduleName,
        loc,
        complexity: formData.complexity,
        commitFrequency: commitFreq,
        functionPoints: formData.functionPoints || 'N/A',
        teamSize,
        riskScore,
        prediction,
        cocomo,
        analyzedAt: new Date().toLocaleString(),
        maintainabilityIndex: (171 - 5.2 * Math.log(loc) - 0.23 * (formData.complexity === 'high' ? 20 : formData.complexity === 'medium' ? 10 : 5) - 16.2 * Math.log(loc / 1000)).toFixed(2)
      };

      setAnalyses(prev => {
        const updated = [newAnalysis, ...prev];
        console.log("Saving this analysis list:", updated);
        return updated;
      });
      setIsAnalyzing(false);
      setActiveTab('results');
    }, 2000);
  };

  const getPredictionColor = (prediction) => {
    if (prediction === 'High Risk') return { from: '#dc2626', to: '#b91c1c' };
    if (prediction === 'Medium Risk') return { from: '#f59e0b', to: '#d97706' };
    return { from: '#10b981', to: '#059669' };
  };

  const getPredictionIcon = (prediction) => {
    if (prediction === 'High Risk') return <AlertCircle style={{ width: '24px', height: '24px' }} />;
    if (prediction === 'Medium Risk') return <Activity style={{ width: '24px', height: '24px' }} />;
    return <CheckCircle style={{ width: '24px', height: '24px' }} />;
  };

  const chartData = analyses.slice(0, 5).reverse().map(a => ({
    name: a.moduleName.substring(0, 10),
    risk: a.riskScore,
    loc: a.loc / 100,
    effort: parseFloat(a.cocomo.effort)
  }));

  const pieData = [
    { name: 'High Risk', value: analyses.filter(a => a.prediction === 'High Risk').length, color: '#ef4444' },
    { name: 'Medium Risk', value: analyses.filter(a => a.prediction === 'Medium Risk').length, color: '#f59e0b' },
    { name: 'Low Risk', value: analyses.filter(a => a.prediction === 'Low Risk').length, color: '#10b981' }
  ];

  const radarData = analyses.length > 0 ? [
    { metric: 'LOC', value: Math.min(analyses[0].loc / 100, 100) },
    { metric: 'Risk', value: analyses[0].riskScore },
    { metric: 'Complexity', value: analyses[0].complexity === 'high' ? 90 : analyses[0].complexity === 'medium' ? 60 : 30 },
    { metric: 'Commits', value: Math.min(analyses[0].commitFrequency * 2, 100) },
    { metric: 'Maintain', value: parseFloat(analyses[0].maintainabilityIndex) }
  ] : [];

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f8fafc',
      position: 'relative'
    },
    backgroundBlob1: {
      position: 'fixed',
      width: '384px',
      height: '384px',
      background: 'rgba(59, 130, 246, 0.05)',
      borderRadius: '50%',
      filter: 'blur(96px)',
      top: '-192px',
      left: '-192px',
      animation: 'pulse 3s infinite',
      pointerEvents: 'none'
    },
    backgroundBlob2: {
      position: 'fixed',
      width: '384px',
      height: '384px',
      background: 'rgba(99, 102, 241, 0.05)',
      borderRadius: '50%',
      filter: 'blur(96px)',
      top: '33%',
      right: '-192px',
      animation: 'pulse 3s infinite',
      pointerEvents: 'none'
    },
    backgroundBlob3: {
      position: 'fixed',
      width: '384px',
      height: '384px',
      background: 'rgba(14, 165, 233, 0.05)',
      borderRadius: '50%',
      filter: 'blur(96px)',
      bottom: '0',
      left: '33%',
      animation: 'pulse 3s infinite',
      pointerEvents: 'none'
    },
    header: {
      borderBottom: '1px solid #e5e7eb',
      backdropFilter: 'blur(12px)',
      background: 'rgba(255, 255, 255, 0.9)',
      position: 'relative',
      zIndex: 10
    },
    headerContent: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    logoBox: {
      padding: '12px',
      background: '#3b82f6',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)'
    },
    title: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#1e293b',
      letterSpacing: '-0.5px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#64748b',
      marginTop: '4px'
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    badge: {
      padding: '8px 16px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '500'
    },
    badgePurple: {
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      color: '#1e40af'
    },
    badgeGreen: {
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      color: '#15803d'
    },
    mainContent: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '24px',
      position: 'relative',
      zIndex: 10
    },
    tabContainer: {
      display: 'flex',
      gap: '8px',
      padding: '8px',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    tab: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 24px',
      borderRadius: '12px',
      transition: 'all 0.3s',
      cursor: 'pointer',
      border: 'none',
      fontSize: '14px',
      fontWeight: '500'
    },
    tabActive: {
      background: '#3b82f6',
      color: 'white',
      boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)'
    },
    tabInactive: {
      color: '#64748b',
      background: 'transparent'
    },
    contentArea: {
      marginTop: '24px',
      paddingBottom: '48px'
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #e5e7eb',
      transition: 'all 0.3s',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
      marginBottom: '24px'
    },
    statCard: {
      position: 'relative',
      overflow: 'hidden',
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #e5e7eb',
      transition: 'all 0.3s',
      cursor: 'pointer',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    iconBox: {
      display: 'inline-flex',
      padding: '12px',
      borderRadius: '12px',
      marginBottom: '16px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    statLabel: {
      color: '#64748b',
      fontSize: '14px',
      marginBottom: '4px',
      fontWeight: '500'
    },
    statValue: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#1e293b'
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '24px'
    },
    chartCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    chartTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    formContainer: {
      maxWidth: '768px',
      margin: '0 auto'
    },
    formCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '32px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    formHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '32px'
    },
    formTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1e293b'
    },
    formSubtitle: {
      color: '#64748b',
      fontSize: '14px',
      marginTop: '4px'
    },
    formGroup: {
      marginBottom: '24px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      background: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      color: '#1e293b',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.3s',
      boxSizing: 'border-box'
    },
    inputGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px'
    },
    button: {
      width: '100%',
      padding: '16px',
      background: '#3b82f6',
      color: 'white',
      fontWeight: '500',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)'
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 0'
    },
    emptyIcon: {
      display: 'inline-flex',
      padding: '24px',
      background: '#eff6ff',
      borderRadius: '16px',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '8px'
    },
    emptyText: {
      color: '#64748b'
    },
    resultCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '32px',
      border: '1px solid #e5e7eb',
      marginBottom: '24px',
      transition: 'all 0.3s',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    resultHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '24px'
    },
    resultTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '8px'
    },
    resultDate: {
      color: '#64748b',
      fontSize: '14px'
    },
    predictionBadge: {
      padding: '12px 24px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'white',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    metricCard: {
      background: '#f8fafc',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid #e5e7eb'
    },
    metricLabel: {
      color: '#64748b',
      fontSize: '14px',
      marginBottom: '4px',
      fontWeight: '500'
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1e293b',
      textTransform: 'capitalize'
    },
    cocomoCard: {
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      padding: '24px'
    },
    cocomoTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    footer: {
      borderTop: '1px solid #e5e7eb',
      backdropFilter: 'blur(12px)',
      background: 'rgba(255, 255, 255, 0.9)',
      marginTop: '48px',
      position: 'relative',
      zIndex: 10
    },
    footerContent: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: '#64748b',
      fontSize: '14px'
    },
    statusIndicator: {
      width: '8px',
      height: '8px',
      background: '#10b981',
      borderRadius: '50%',
      animation: 'pulse 2s infinite'
    },
    insightsGrid3: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginTop: '24px'
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    listItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      marginBottom: '12px',
      color: '#000000ff'
    },
    bullet: {
      marginTop: '4px',
      fontSize: '20px'
    },
    progressBar: {
      position: 'relative',
      width: '100%',
      height: '8px',
      background: '#f1f5f9',
      borderRadius: '9999px',
      overflow: 'hidden',
      marginTop: '12px',
      marginBottom: '8px'
    },
    progressFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      transition: 'width 0.5s'
    },
    progressLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '12px',
      color: '#64748b'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        button:hover:not(:disabled) {
          transform: scale(1.02);
          background: #2563eb;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .stat-card:hover {
          transform: scale(1.02);
          border-color: #d1d5db;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .tab:hover {
          background: #f8fafc;
        }
      `}</style>

      <div style={styles.backgroundBlob1}></div>
      <div style={styles.backgroundBlob2}></div>
      <div style={styles.backgroundBlob3}></div>

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.logoBox}>
              <Brain style={{ width: '32px', height: '32px', color: 'white' }} />
            </div>
            <div>
              <h1 style={styles.title}>LOC Checker Pro</h1>
              <p style={styles.subtitle}>AI-Powered Software Effort Estimation & Risk Analysis</p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={{ ...styles.badge, ...styles.badgePurple }}>
              <span>COCOMO II</span>
            </div>
            <div style={{ ...styles.badge, ...styles.badgeGreen }}>
              <span>{analyses.length} Analyses</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("analyses");
                setAnalyses([]);
                alert("All saved analyses have been cleared!");
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                transition: '0.3s',
              }}
            >
              Clear Saved Data
            </button>

          </div>
        </div>
      </header>

      <div style={styles.mainContent}>
        <div style={styles.tabContainer}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Target },
            { id: 'analyze', label: 'Analyze Module', icon: Zap },
            { id: 'results', label: 'Results', icon: Activity },
            { id: 'insights', label: 'Insights', icon: Sparkles }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="tab"
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : styles.tabInactive)
              }}
            >
              <tab.icon style={{ width: '20px', height: '20px' }} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.contentArea}>
          {activeTab === 'dashboard' && (
            <div>
              <div style={styles.statsGrid}>
                {[
                  { label: 'Total Modules', value: analyses.length, icon: Code, gradient: '#3b82f6' },
                  { label: 'High Risk', value: analyses.filter(a => a.prediction === 'High Risk').length, icon: AlertCircle, gradient: '#dc2626' },
                  { label: 'Medium Risk', value: analyses.filter(a => a.prediction === 'Medium Risk').length, icon: Activity, gradient: '#f59e0b' },
                  { label: 'Low Risk', value: analyses.filter(a => a.prediction === 'Low Risk').length, icon: CheckCircle, gradient: '#10b981' }
                ].map((stat, idx) => (
                  <div key={idx} className="stat-card" style={styles.statCard}>
                    <div style={{ ...styles.iconBox, background: stat.gradient }}>
                      <stat.icon style={{ width: '24px', height: '24px', color: 'white' }} />
                    </div>
                    <p style={styles.statLabel}>{stat.label}</p>
                    <p style={styles.statValue}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {analyses.length > 0 && (
                <div style={styles.chartsGrid}>
                  <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>
                      <TrendingUp style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                      Risk Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>
                      <Activity style={{ width: '20px', height: '20px', color: '#6366f1' }} />
                      Module Comparison
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                        <Bar dataKey="risk" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="effort" fill="#6366f1" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analyze' && (
            <div style={styles.formContainer}>
              <div style={styles.formCard}>
                <div style={styles.formHeader}>
                  <div style={{ ...styles.iconBox, background: '#3b82f6' }}>
                    <Zap style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div>
                    <h2 style={styles.formTitle}>Analyze New Module</h2>
                    <p style={styles.formSubtitle}>Enter project metrics for AI-powered analysis</p>
                  </div>
                </div>

                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Module Name *</label>
                    <input
                      type="text"
                      value={formData.moduleName}
                      onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                      placeholder="e.g., UserAuthentication"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Lines of Code *</label>
                      <input
                        type="number"
                        value={formData.loc}
                        onChange={(e) => setFormData({ ...formData, loc: e.target.value })}
                        placeholder="1000"
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Commit Frequency *</label>
                      <input
                        type="number"
                        value={formData.commitFrequency}
                        onChange={(e) => setFormData({ ...formData, commitFrequency: e.target.value })}
                        placeholder="25"
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.inputGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Complexity Level *</label>
                      <select
                        value={formData.complexity}
                        onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
                        style={styles.input}
                      >
                        <option value="">Select...</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Team Size</label>
                      <input
                        type="number"
                        value={formData.teamSize}
                        onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                        placeholder="5"
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Function Points (Optional)</label>
                    <input
                      type="number"
                      value={formData.functionPoints}
                      onChange={(e) => setFormData({ ...formData, functionPoints: e.target.value })}
                      placeholder="50"
                      style={styles.input}
                    />
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    style={styles.button}
                  >
                    {isAnalyzing ? (
                      <>
                        <div style={styles.spinner}></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain style={{ width: '20px', height: '20px' }} />
                        Analyze Module
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div>
              {analyses.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>
                    <Activity style={{ width: '64px', height: '64px', color: '#3b82f6' }} />
                  </div>
                  <h3 style={styles.emptyTitle}>No Analyses Yet</h3>
                  <p style={styles.emptyText}>Start by analyzing your first module!</p>
                </div>
              ) : (
                analyses.map((analysis) => {
                  const colors = getPredictionColor(analysis.prediction);
                  return (
                    <div key={analysis.id} style={styles.resultCard}>
                      <div style={styles.resultHeader}>
                        <div>
                          <h3 style={styles.resultTitle}>{analysis.moduleName}</h3>
                          <p style={styles.resultDate}>{analysis.analyzedAt}</p>
                        </div>
                        <div style={{
                          ...styles.predictionBadge,
                          background: `linear-gradient(to right, ${colors.from}, ${colors.to})`
                        }}>
                          {getPredictionIcon(analysis.prediction)}
                          {analysis.prediction}
                        </div>
                      </div>

                      <div style={styles.metricsGrid}>
                        <div style={styles.metricCard}>
                          <p style={styles.metricLabel}>Risk Score</p>
                          <p style={styles.metricValue}>{analysis.riskScore}/100</p>
                        </div>
                        <div style={styles.metricCard}>
                          <p style={styles.metricLabel}>Lines of Code</p>
                          <p style={styles.metricValue}>{analysis.loc.toLocaleString()}</p>
                        </div>
                        <div style={styles.metricCard}>
                          <p style={styles.metricLabel}>Complexity</p>
                          <p style={styles.metricValue}>{analysis.complexity}</p>
                        </div>
                        <div style={styles.metricCard}>
                          <p style={styles.metricLabel}>Commits</p>
                          <p style={styles.metricValue}>{analysis.commitFrequency}</p>
                        </div>
                      </div>

                      <div style={styles.cocomoCard}>
                        <h4 style={styles.cocomoTitle}>
                          <Target style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                          COCOMO II Estimates
                        </h4>
                        <div style={styles.metricsGrid}>
                          <div>
                            <p style={styles.metricLabel}>Effort</p>
                            <p style={{ ...styles.metricValue, fontSize: '20px' }}>{analysis.cocomo.effort} PM</p>
                          </div>
                          <div>
                            <p style={styles.metricLabel}>Duration</p>
                            <p style={{ ...styles.metricValue, fontSize: '20px' }}>{analysis.cocomo.time} months</p>
                          </div>
                          <div>
                            <p style={styles.metricLabel}>Avg Staff</p>
                            <p style={{ ...styles.metricValue, fontSize: '20px' }}>{analysis.cocomo.avgStaff} people</p>
                          </div>
                          <div>
                            <p style={styles.metricLabel}>Est. Cost</p>
                            <p style={{ ...styles.metricValue, fontSize: '20px' }}>${parseFloat(analysis.cocomo.cost).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div>
              {analyses.length > 0 ? (
                <>
                  <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>
                      <Sparkles style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                      Module Health Radar
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="metric" stroke="#9ca3af" />
                        <PolarRadiusAxis stroke="#9ca3af" />
                        <Radar name="Metrics" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ ...styles.chartsGrid, marginTop: '24px' }}>
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      padding: '24px'
                    }}>
                      <h4 style={styles.cocomoTitle}>
                        <CheckCircle style={{ width: '20px', height: '20px', color: '#15803d' }} />
                        Best Practices
                      </h4>
                      <ul style={styles.list}>
                        <li style={styles.listItem}>
                          <span style={{ ...styles.bullet, color: '#15803d' }}>•</span>
                          <span>Keep LOC under 2000 per module for better maintainability</span>
                        </li>
                        <li style={styles.listItem}>
                          <span style={{ ...styles.bullet, color: '#15803d' }}>•</span>
                          <span>Regular commits (20-40) indicate healthy development</span>
                        </li>
                        <li style={styles.listItem}>
                          <span style={{ ...styles.bullet, color: '#15803d' }}>•</span>
                          <span>Low to medium complexity reduces defect probability</span>
                        </li>
                      </ul>
                    </div>

                    <div style={{
                      background: '#fef3c7',
                      border: '1px solid #fcd34d',
                      borderRadius: '12px',
                      padding: '24px'
                    }}>
                      <h4 style={styles.cocomoTitle}>
                        <AlertCircle style={{ width: '20px', height: '20px', color: '#b45309' }} />
                        Risk Indicators
                      </h4>
                      <ul style={styles.list}>
                        <li style={styles.listItem}>
                          <span style={{ ...styles.bullet, color: '#b45309' }}>•</span>
                          <span>LOC &gt; 5000: High risk of defects and maintenance issues</span>
                        </li>
                        <li style={styles.listItem}>
                          <span style={{ ...styles.bullet, color: '#b45309' }}>•</span>
                          <span>High complexity with many commits signals instability</span>
                        </li>
                        <li style={styles.listItem}>
                          <span style={{ ...styles.bullet, color: '#b45309' }}>•</span>
                          <span>Risk score &gt; 60 requires immediate code review</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div style={{ ...styles.chartCard, marginTop: '24px' }}>
                    <h3 style={styles.chartTitle}>
                      <TrendingUp style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                      Effort & Cost Trends
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ background: 'rgba(254, 243, 199, 1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="effort" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
                        <Line type="monotone" dataKey="risk" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={styles.insightsGrid3}>
                    <div style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '12px',
                      padding: '24px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>Avg Effort</h4>
                        <Code style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                      </div>
                      <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#1e293b' }}>
                        {(analyses.reduce((sum, a) => sum + parseFloat(a.cocomo.effort), 0) / analyses.length).toFixed(2)} PM
                      </p>
                      <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Person-Months across all modules</p>
                    </div>

                    <div style={{
                      background: '#f5f3ff',
                      border: '1px solid #ddd6fe',
                      borderRadius: '12px',
                      padding: '24px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>Avg Duration</h4>
                        <Activity style={{ width: '20px', height: '20px', color: '#6366f1' }} />
                      </div>
                      <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#1e293b' }}>
                        {(analyses.reduce((sum, a) => sum + parseFloat(a.cocomo.time), 0) / analyses.length).toFixed(2)} mo
                      </p>
                      <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Average project timeline</p>
                    </div>

                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      padding: '24px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>Total Cost</h4>
                        <Target style={{ width: '20px', height: '20px', color: '#15803d' }} />
                      </div>
                      <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#1e293b' }}>
                        ${(analyses.reduce((sum, a) => sum + parseFloat(a.cocomo.cost), 0)).toLocaleString()}
                      </p>
                      <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Estimated total investment</p>
                    </div>
                  </div>

                  <div style={{ ...styles.chartCard, marginTop: '24px' }}>
                    <h3 style={styles.chartTitle}>
                      <Shield style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                      Quality Metrics Summary
                    </h3>
                    <div>
                      {analyses.slice(0, 3).map((analysis, idx) => {
                        const colors = getPredictionColor(analysis.prediction);
                        return (
                          <div key={idx} style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <span style={{ fontWeight: '600', color: '#1e293b' }}>{analysis.moduleName}</span>
                              <span style={{ fontSize: '14px', color: '#64748b' }}>MI: {analysis.maintainabilityIndex}</span>
                            </div>
                            <div style={styles.progressBar}>
                              <div
                                style={{
                                  ...styles.progressFill,
                                  background: `linear-gradient(to right, ${colors.from}, ${colors.to})`,
                                  width: `${analysis.riskScore}%`
                                }}
                              ></div>
                            </div>
                            <div style={styles.progressLabels}>
                              <span>Risk: {analysis.riskScore}%</span>
                              <span>LOC: {analysis.loc.toLocaleString()}</span>
                              <span>Complexity: {analysis.complexity}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>
                    <Sparkles style={{ width: '64px', height: '64px', color: '#3b82f6' }} />
                  </div>
                  <h3 style={styles.emptyTitle}>No Insights Available</h3>
                  <p style={styles.emptyText}>Analyze modules to generate insights and recommendations</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain style={{ width: '16px', height: '16px' }} />
            <span>Powered by COCOMO II Model</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={styles.statusIndicator}></div>
              <span>System Active</span>
            </div>
            <span>DevOps Project © 2024</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
