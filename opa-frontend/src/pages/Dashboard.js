import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

// Pagination resolver to fetch all pages for any paginated endpoint
const fetchAllPages = async (endpoint) => {
  let results = [];
  let nextUrl = endpoint;
  while (nextUrl) {
    let relativeUrl = nextUrl;
    if (nextUrl.includes('/api/')) {
      relativeUrl = nextUrl.split('/api')[1];
    }
    const res = await client.get(relativeUrl);
    const data = res.data;
    if (data && data.results && Array.isArray(data.results)) {
      results = [...results, ...data.results];
      nextUrl = data.next;
    } else if (Array.isArray(data)) {
      results = [...results, ...data];
      nextUrl = null;
    } else {
      results = data ? [data] : [];
      nextUrl = null;
    }
  }
  return results;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({ totalOffices: 0, occupied: 0, available: 0, conflicts: 0 });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [flaggedOffices, setFlaggedOffices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract user profile information
  const profile = user?.staff_profile;
  const username = user?.username || '';
  const first_name = profile?.first_name || '';
  const last_name = profile?.last_name || '';
  const academic_title = profile?.academic_title || '';
  const role = profile?.system_role || '';
  const department = profile?.department_name || '';

  const getRoleLabel = (role) => {
    switch (role) {
      case 'system_admin': return 'System Administrator';
      case 'department_admin': return 'Department Administrator';
      case 'resource_manager': return 'Resource Manager';
      case 'it_department': return 'IT Specialist';
      case 'faculty': return 'Faculty Member';
      default: return 'User';
    }
  };

  const getInitials = (name) => {
    if (!name || name.includes('Unknown')) return '??';
    
    let cleanName = name;
    const prefixes = ['Prof. ', 'Dr. ', 'Mr. ', 'Ms. ', 'Mrs. ', 'Assoc. Prof. ', 'Asst. Prof. '];
    for (const prefix of prefixes) {
      if (cleanName.startsWith(prefix)) {
        cleanName = cleanName.substring(prefix.length);
        break;
      }
    }
    
    const parts = cleanName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return cleanName[0] ? cleanName[0].toUpperCase() : '?';
  };

  const getDeptGradient = (dept) => {
    if (!dept) return 'linear-gradient(135deg, #6B7280, #374151)'; // Slate
    const d = dept.toLowerCase();
    if (d.includes('computer') || d.includes('engineering')) {
      return 'linear-gradient(135deg, #3B82F6, #1D4ED8)'; // Blue
    } else if (d.includes('data') || d.includes('science') || d.includes('analytics')) {
      return 'linear-gradient(135deg, #8B5CF6, #6D28D9)'; // Purple
    } else if (d.includes('it') || d.includes('support') || d.includes('information')) {
      return 'linear-gradient(135deg, #10B981, #047857)'; // Emerald
    } else if (d.includes('math')) {
      return 'linear-gradient(135deg, #EC4899, #BE185D)'; // Pink
    } else if (d.includes('physics')) {
      return 'linear-gradient(135deg, #06B6D4, #0891B2)'; // Cyan
    }
    return 'linear-gradient(135deg, #4B5563, #1F2937)'; // Slate dark
  };

  const fetchDashboardData = async () => {
    try {
      const [offices, assignments, staffList] = await Promise.all([
        fetchAllPages('/offices/search/'),
        fetchAllPages('/assignments/'),
        fetchAllPages('/staff/')
      ]);
      
      const staffMap = {};
      staffList.forEach(s => { staffMap[s.id] = s; });
      const offMap = {};
      offices.forEach(o => { offMap[o.id] = o; });
      
      let occupied = 0;
      let available = 0;
      const flagged = [];
      
      offices.forEach(o => {
        if (o.current_occupants_count > 0) occupied++;
        if (o.available_capacity > 0) available++;
        if (o.current_occupants_count > o.capacity) {
          flagged.push({
            id: o.id,
            officeNo: o.room_number,
            building: o.building_name || (typeof o.building === 'object' ? o.building.name : `Building ${o.building}`),
            capacity: o.capacity,
            current: o.current_occupants_count
          });
        }
      });
      
      setStats({
        totalOffices: offices.length,
        occupied,
        available,
        conflicts: flagged.length
      });
      
      setFlaggedOffices(flagged);
      
      // Map recent assignments
      const sortedAssignments = [...assignments].sort((a, b) => b.id - a.id);
      const recent = sortedAssignments.slice(0, 5).map(a => {
        const off = offMap[a.office] || {};
        const stf = staffMap[a.staff] || {};
        
        let buildingName = 'Unknown Building';
        if (off.building_name) {
          buildingName = off.building_name;
        } else if (off.building) {
          buildingName = typeof off.building === 'object' ? off.building.name : `Building ${off.building}`;
        }

        return {
          id: a.id,
          officeNo: off.room_number ? `${off.room_number}` : 'Unknown',
          building: buildingName,
          occupant: stf.first_name ? `${stf.academic_title || ''} ${stf.first_name} ${stf.last_name}`.trim() : 'Unknown Faculty',
          department: stf.department_name || 'General Faculty',
          date: a.start_date || 'Recently'
        };
      });
      
      setRecentAssignments(recent);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  const getQuickActions = () => {
    const actions = [];
    
    actions.push({
      label: 'Request Office',
      desc: 'Submit a new office placement request',
      path: '/request-office',
      color: '#3B82F6',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 14V5l6-3 6 3v9"/>
          <path d="M2 14h12"/>
          <path d="M6 9h4v5H6z"/>
        </svg>
      )
    });

    actions.push({
      label: 'Request Equipment',
      desc: 'Order hardware or tech for classrooms',
      path: '/equipment',
      color: '#8B5CF6',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="12" height="8" rx="2" ry="2"/>
          <line x1="8" y1="11" x2="8" y2="14"/>
          <line x1="5" y1="14" x2="11" y2="14"/>
        </svg>
      )
    });

    if (role === 'system_admin' || role === 'department_admin') {
      actions.push({
        label: 'Assign Occupant',
        desc: 'Place faculty into active office slots',
        path: '/admin',
        color: '#10B981',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="7.5" cy="7" r="4"/>
          </svg>
        )
      });
    }

    actions.push({
      label: 'Track History',
      desc: 'View comprehensive placement logs',
      path: '/history',
      color: '#EC4899',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="7"/>
          <polyline points="8 4 8 8 10 10"/>
        </svg>
      )
    });

    return actions;
  };

  const t = darkMode ? {
    pageBg:     '#071E34',
    surface:    '#0D2640',
    surface2:   'rgba(255,255,255,0.03)',
    border:     'rgba(255,255,255,0.07)',
    title:      '#E8F4FF',
    text:       '#C8DCF0',
    sub:        '#4A7FAA',
    muted:      '#2A4A6A',
    eyebrow:    '#4A7FAA',
    dateBg:     '#0A1E36',
    rowHover:   'rgba(255,255,255,0.03)',
    officeChipBg: 'rgba(59,130,246,0.15)',
    officeChipColor: '#60A5FA',
    deptBg:     'rgba(255,255,255,0.06)',
    deptColor:  'rgba(255,255,255,0.4)',
    accentColor: '#3B82F6',
    accentBg:   'rgba(59,130,246,0.12)',
    welcomeBg:  'linear-gradient(135deg, rgba(13,38,64,0.85), rgba(7,30,52,0.6))',
    welcomeBorder: 'rgba(59,130,246,0.15)',
    kpiCards: [
      { bg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)', numColor: '#FFFFFF', lblColor: 'rgba(255,255,255,0.8)', border: 'none', shadow: '0 8px 20px rgba(59,130,246,0.15)' },
      { bg: '#0D2640', numColor: '#10B981', lblColor: '#6EE7B7', border: '1.5px solid rgba(16,185,129,0.15)', shadow: 'none' },
      { bg: '#0D2640', numColor: '#8B5CF6', lblColor: '#C084FC', border: '1.5px solid rgba(139,92,246,0.15)', shadow: 'none' },
      { bg: '#0D2640', numColor: '#F59E0B', lblColor: '#FBBF24', border: '1.5px solid rgba(245,158,11,0.15)', shadow: 'none' }
    ],
    flagBg:     'rgba(239,68,68,0.05)',
    flagBorder: 'rgba(239,68,68,0.15)',
    flagTitle:  '#EF4444',
    flagSub:    '#FCA5A5',
    flagTrack:  'rgba(239,68,68,0.15)',
  } : {
    pageBg:     '#DCE9F5',
    surface:    '#fff',
    surface2:   '#F5F9FF',
    border:     '#C2D8EF',
    title:      '#0D2D52',
    text:       '#1E4A7A',
    sub:        '#7AAAD0',
    muted:      '#A8C0D8',
    eyebrow:    '#5A87B8',
    dateBg:     '#EEF4FB',
    rowHover:   '#F5F9FF',
    officeChipBg: '#DBEAFE',
    officeChipColor: '#1D4ED8',
    deptBg:     '#EEF4FB',
    deptColor:  '#5A87B8',
    accentColor: '#2563EB',
    accentBg:   '#EFF6FF',
    welcomeBg:  'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
    welcomeBorder: 'rgba(59,130,246,0.2)',
    kpiCards: [
      { bg: 'linear-gradient(135deg, #2563EB, #1D4ED8)', numColor: '#FFFFFF', lblColor: 'rgba(255,255,255,0.85)', border: 'none', shadow: '0 8px 20px rgba(37,99,235,0.15)' },
      { bg: '#FFFFFF', numColor: '#059669', lblColor: '#047857', border: '1.5px solid #E2EAF4', shadow: '0 4px 12px rgba(16,185,129,0.04)' },
      { bg: '#FFFFFF', numColor: '#7C3AED', lblColor: '#6D28D9', border: '1.5px solid #E2EAF4', shadow: '0 4px 12px rgba(124,58,237,0.04)' },
      { bg: '#FFFFFF', numColor: '#D97706', lblColor: '#B45309', border: '1.5px solid #E2EAF4', shadow: '0 4px 12px rgba(217,119,6,0.04)' }
    ],
    flagBg:     '#FEF2F2',
    flagBorder: '#FEE2E2',
    flagTitle:  '#991B1B',
    flagSub:    '#B91C1C',
    flagTrack:  '#FEE2E2',
  };

  const card = {
    backgroundColor: t.surface,
    borderRadius: '16px',
    border: `1.5px solid ${t.border}`,
    boxShadow: darkMode ? 'none' : '0 4px 20px rgba(15,60,120,0.05)',
    transition: 'transform 0.2s ease',
  };

  const isAdmin = role === 'system_admin' || role === 'department_admin';

  const kpiData = [
    { 
      label: 'Total Offices', 
      value: stats.totalOffices, 
      cardStyle: t.kpiCards[0], 
      icon: <svg width="44" height="44" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="white" strokeWidth="1.5"/><path d="M1 6h14" stroke="white" strokeWidth="1.5"/></svg> 
    },
    { 
      label: 'Occupied Offices', 
      value: stats.occupied, 
      cardStyle: t.kpiCards[1], 
      icon: <svg width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M8 1a4 4 0 100 8A4 4 0 008 1zM2 14c0-2.5 2.7-4 6-4s6 1.5 6 4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/></svg> 
    },
    { 
      label: 'Available Offices', 
      value: stats.available, 
      cardStyle: t.kpiCards[2], 
      icon: <svg width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> 
    },
    ...(isAdmin ? [{ 
      label: 'Pending Conflicts', 
      value: stats.conflicts, 
      cardStyle: t.kpiCards[3], 
      icon: <svg width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M8 2v6m0 3v1" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"/><circle cx="8" cy="8" r="6.5" stroke="#EF4444" strokeWidth="1.4"/></svg> 
    }] : []),
  ];

  const SkeletonRow = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 22px', borderBottom: `1px solid ${t.border}` }}>
      <div className="skeleton-pulse" style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div className="skeleton-pulse" style={{ width: '40%', height: '12px', borderRadius: '4px', backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
        <div className="skeleton-pulse" style={{ width: '60%', height: '9px', borderRadius: '3px', backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
      </div>
      <div className="skeleton-pulse" style={{ width: '60px', height: '12px', borderRadius: '4px', backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
    </div>
  );

  return (
    <Layout>
      {/* Dynamic Keyframe Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.9; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        .skeleton-pulse {
          animation: skeleton-glow 1.5s ease-in-out infinite;
        }
        @keyframes skeleton-glow {
          0% { opacity: 0.8; }
          50% { opacity: 0.4; }
          100% { opacity: 0.8; }
        }
        .kpi-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .kpi-card:hover {
          transform: translateY(-4px);
        }
        .recent-row {
          transition: background-color 0.15s ease;
        }
        .flagged-card {
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .flagged-card:hover {
          transform: translateX(2px);
          border-color: #EF4444 !important;
        }
      `}} />

      <div style={{ fontFamily: "'Nunito', 'Sora', sans-serif", display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: t.eyebrow, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '5px' }}>Overview</div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: t.title, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>Dashboard</h1>
            </div>
            {/* Circular Refresh Button with micro-animations */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh Dashboard Data"
              style={{
                background: 'none',
                border: `1.5px solid ${t.border}`,
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: t.sub,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '15px',
                backgroundColor: t.surface2,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = t.accentColor;
                e.currentTarget.style.color = t.accentColor;
                e.currentTarget.style.backgroundColor = t.accentBg;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = t.border;
                e.currentTarget.style.color = t.sub;
                e.currentTarget.style.backgroundColor = t.surface2;
              }}
            >
              <svg
                style={{
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                }}
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 2v4h4" />
                <path d="M13.5 14v-4h-4" />
                <path d="M14 6A6 6 0 0 0 3.5 3.5L2.5 6" />
                <path d="M2 10a6 6 0 0 0 10.5 2.5l1-2.5" />
              </svg>
            </button>
          </div>
          <div style={{ fontSize: '12px', color: t.sub, backgroundColor: t.dateBg, border: `1.5px solid ${t.border}`, borderRadius: '10px', padding: '8px 14px', fontWeight: 700 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Premium Welcome Banner */}
        <div style={{
          background: t.welcomeBg,
          border: `1.5px solid ${t.welcomeBorder}`,
          borderRadius: '16px',
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: darkMode ? 'none' : '0 4px 20px rgba(59,130,246,0.08)'
        }}>
          <div style={{
            position: 'absolute',
            right: '-50px',
            top: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', zIndex: 1 }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: darkMode ? 'linear-gradient(135deg, #1E40AF, #3B82F6)' : 'linear-gradient(135deg, #DBEAFE, #93C5FD)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              flexShrink: 0
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#E0F2FE" : "#1E3A8A"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: 900, color: t.title, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
                Welcome back, {academic_title ? `${academic_title} ` : ''}{first_name || last_name ? `${first_name} ${last_name}` : username || 'Academic Colleague'}!
              </h2>
              <p style={{ fontSize: '13px', color: t.text, margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Role: <strong style={{ color: darkMode ? '#93C5FD' : '#2563EB' }}>{getRoleLabel(role)}</strong></span>
                {department && (
                  <>
                    <span style={{ opacity: 0.4 }}>•</span>
                    <span>Department: <strong style={{ color: darkMode ? '#93C5FD' : '#2563EB' }}>{department}</strong></span>
                  </>
                )}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 1, flexShrink: 0 }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: t.sub, letterSpacing: '1px', textTransform: 'uppercase' }}>Academic Session</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: t.title, marginTop: '2px' }}>Fall 2026</span>
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpiData.length}, 1fr)`, gap: '14px' }}>
          {kpiData.map((k, i) => {
            const c = k.cardStyle;
            return (
              <div
                key={i}
                className="kpi-card"
                style={{
                  background: c.bg,
                  border: c.border || 'none',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: c.shadow || (darkMode ? 'none' : '0 2px 10px rgba(15,60,120,0.06)')
                }}
              >
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: .12, display: 'flex' }}>
                  {k.icon}
                </div>
                <div style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '4px', color: c.numColor }}>
                  {loading ? '...' : k.value}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: c.lblColor }}>{k.label}</div>
              </div>
            );
          })}
        </div>

        {/* Content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>

          {/* Recent Assignments */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1.5px solid ${t.border}` }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: t.title, margin: 0, letterSpacing: '-.3px' }}>Recent Assignments</h2>
              <button
                onClick={() => navigate('/offices')}
                style={{ background: 'none', border: 'none', color: t.accentColor, fontSize: '12px', fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                View all
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : recentAssignments.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: t.sub, fontSize: '13px', fontWeight: 600 }}>No recent assignments.</div>
              ) : (
                recentAssignments.map((row, i) => (
                  <div
                    key={row.id}
                    className="recent-row"
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 22px', borderBottom: i < recentAssignments.length - 1 ? `1px solid ${t.border}` : 'none', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Initials Avatar with custom gradient */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: getDeptGradient(row.department),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '13px',
                      letterSpacing: '-0.3px',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      {getInitials(row.occupant)}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: t.title, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.occupant}
                      </div>
                      
                      {/* Department label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', color: t.sub, fontWeight: 700 }}>{row.department}</span>
                        <span style={{ opacity: 0.3, color: t.sub }}>•</span>
                        <span style={{ fontSize: '11px', color: t.sub, fontWeight: 600 }}>{row.building}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                      {/* Room Chip */}
                      <div style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: t.officeChipBg,
                        color: t.officeChipColor,
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '-0.2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 14V5l6-3 6 3v9M2 14h12"/></svg>
                        Room {row.officeNo}
                      </div>
                      <span style={{ fontSize: '10px', color: t.muted, fontWeight: 700 }}>{row.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column Stack: Flagged Offices & Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Flagged Offices (Only for Admins who can resolve conflicts) */}
            {(role === 'system_admin' || role === 'department_admin') && (
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1.5px solid ${t.border}` }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 800, color: t.title, margin: 0, letterSpacing: '-.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Capacity Conflicts
                    <span style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.15)' : '#FEE2E2', color: '#EF4444', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>
                      {loading ? '...' : flaggedOffices.length}
                    </span>
                  </h2>
                  <button
                    onClick={() => navigate('/admin')}
                    style={{ background: 'none', border: 'none', color: t.accentColor, fontSize: '12px', fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Resolve
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: t.sub }}>
                      <div className="skeleton-pulse" style={{ width: '80%', height: '14px', borderRadius: '4px', backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '0 auto 8px' }} />
                      <div className="skeleton-pulse" style={{ width: '60%', height: '10px', borderRadius: '3px', backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '0 auto' }} />
                    </div>
                  ) : flaggedOffices.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: t.sub, fontSize: '12px', fontWeight: 600 }}>No capacity conflicts found. All logical rules validated.</div>
                  ) : (
                    flaggedOffices.map(o => {
                      const pct = Math.min((o.current / o.capacity) * 100, 100);
                      return (
                        <div
                          key={o.id}
                          className="flagged-card"
                          style={{
                            padding: '14px 16px',
                            backgroundColor: t.flagBg,
                            border: `1.5px solid ${t.flagBorder}`,
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ position: 'absolute', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse-glow 2s cubic-bezier(0.45, 0, 0.55, 1) infinite' }} />
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', zIndex: 1 }} />
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: t.flagTitle }}>Room {o.officeNo}</div>
                                <div style={{ fontSize: '11px', color: t.flagSub, fontWeight: 600 }}>{o.building}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '15px', fontWeight: 900, color: '#EF4444', letterSpacing: '-0.5px', lineHeight: 1 }}>
                                {o.current}<span style={{ fontSize: '11px', fontWeight: 600, color: t.sub }}>/{o.capacity}</span>
                              </div>
                              <div style={{ fontSize: '9px', color: t.sub, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>Seats / Cap</div>
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: t.sub, marginBottom: '4px', fontWeight: 700 }}>
                              <span>Capacity Usage</span>
                              <span style={{ color: '#EF4444' }}>Over Capacity ({Math.round(pct)}%)</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: t.flagTrack, borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#EF4444', borderRadius: '3px' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions Panel */}
            <div style={card}>
              <div style={{ padding: '18px 22px', borderBottom: `1.5px solid ${t.border}` }}>
                <h2 style={{ fontSize: '14px', fontWeight: 800, color: t.title, margin: 0, letterSpacing: '-.3px' }}>Quick Actions</h2>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {getQuickActions().map((act, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(act.path)}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        border: `1.5px solid ${t.border}`,
                        backgroundColor: t.surface2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                      className="quick-action-btn"
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = act.color;
                        e.currentTarget.style.boxShadow = `0 4px 12px ${act.color}15`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = t.border;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          backgroundColor: `${act.color}15`,
                          color: act.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {act.icon}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: t.title }}>{act.label}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: t.sub, lineHeight: '1.3', fontWeight: 500 }}>{act.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}