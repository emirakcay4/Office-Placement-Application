import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  
  const [stats, setStats] = useState({ totalOffices: 0, occupied: 0, available: 0, conflicts: 0 });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [flaggedOffices, setFlaggedOffices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [officesRes, assignmentsRes, staffRes] = await Promise.all([
          client.get('/offices/search/'),
          client.get('/assignments/'),
          client.get('/staff/')
        ]);
        
        const offices = officesRes.data.results || officesRes.data;
        const assignments = assignmentsRes.data.results || assignmentsRes.data;
        const staffList = staffRes.data.results || staffRes.data;
        
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
              building: typeof o.building === 'object' ? o.building.name : `Building ${o.building}`, // Handle if nested
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
        // Sort by id descending as a proxy for recent, or date if available
        const recent = assignments.slice(-5).reverse().map(a => {
          const off = offMap[a.office] || {};
          const stf = staffMap[a.staff] || {};
          return {
            id: a.id,
            officeNo: off.room_number || 'Unknown',
            occupant: `${stf.first_name || ''} ${stf.last_name || ''}`.trim() || 'Unknown',
            department: stf.department_name || 'Unknown',
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
    
    fetchDashboardData();
  }, []);

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
    kpiCards: [
      { bg: 'linear-gradient(135deg,#1D4ED8,#2563EB)', numColor: '#fff',    lblColor: 'rgba(255,255,255,0.65)', border: 'none' },
      { bg: '#0D2640', numColor: '#34D399', lblColor: '#065F46',            border: '1.5px solid rgba(52,211,153,0.2)' },
      { bg: '#0D2640', numColor: '#818CF8', lblColor: '#3730A3',            border: '1.5px solid rgba(129,140,248,0.2)' },
      { bg: '#0D2640', numColor: '#FBBF24', lblColor: '#78350F',            border: '1.5px solid rgba(251,191,36,0.2)' },
    ],
    flagBg:     'rgba(245,158,11,0.07)',
    flagBorder: 'rgba(245,158,11,0.2)',
    flagTitle:  '#FCD34D',
    flagSub:    '#A78B3A',
    flagTrack:  'rgba(245,158,11,0.15)',
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
    kpiCards: [
      { bg: 'linear-gradient(135deg,#1D4ED8,#2563EB)', numColor: '#fff',    lblColor: 'rgba(255,255,255,0.65)', border: 'none' },
      { bg: '#fff', numColor: '#059669', lblColor: '#6EE7B7',               border: '1.5px solid #C2D8EF' },
      { bg: '#fff', numColor: '#4F46E5', lblColor: '#A5B4FC',               border: '1.5px solid #C2D8EF' },
      { bg: '#fff', numColor: '#D97706', lblColor: '#FCD34D',               border: '1.5px solid #C2D8EF' },
    ],
    flagBg:     '#FFFBEB',
    flagBorder: '#FDE68A',
    flagTitle:  '#92400E',
    flagSub:    '#B45309',
    flagTrack:  '#FDE68A',
  };

  const card = {
    backgroundColor: t.surface,
    borderRadius: '16px',
    border: `1.5px solid ${t.border}`,
    boxShadow: darkMode ? 'none' : '0 2px 12px rgba(15,60,120,0.07)',
  };

  const kpiData = [
    { label: 'Total Offices',     value: stats.totalOffices },
    { label: 'Occupied',          value: stats.occupied     },
    { label: 'Available',         value: stats.available    },
    { label: 'Pending Conflicts', value: stats.conflicts    },
  ];

  const kpiIcons = [
    <svg key={0} width="44" height="44" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="white" strokeWidth="1.5"/><path d="M1 6h14" stroke="white" strokeWidth="1.5"/></svg>,
    <svg key={1} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M8 1a4 4 0 100 8A4 4 0 008 1zM2 14c0-2.5 2.7-4 6-4s6 1.5 6 4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    <svg key={2} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    <svg key={3} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M8 2v6m0 3v1" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"/><circle cx="8" cy="8" r="6.5" stroke="#F59E0B" strokeWidth="1.4"/></svg>,
  ];

  return (
    <Layout>
      <div style={{ fontFamily: "'Nunito', 'Sora', sans-serif", display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: t.eyebrow, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '5px' }}>Overview</div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: t.title, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>Dashboard</h1>
          </div>
          <div style={{ fontSize: '12px', color: t.sub, backgroundColor: t.dateBg, border: `1.5px solid ${t.border}`, borderRadius: '10px', padding: '8px 14px', fontWeight: 700 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
          {kpiData.map((k, i) => {
            const c = t.kpiCards[i];
            return (
              <div key={i} style={{ background: c.bg, border: c.border || 'none', borderRadius: '16px', padding: '20px 22px', position: 'relative', overflow: 'hidden', boxShadow: darkMode ? 'none' : '0 2px 10px rgba(15,60,120,0.06)' }}>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: .14, display: 'flex' }}>{kpiIcons[i]}</div>
                <div style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '4px', color: c.numColor }}>{k.value}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: c.lblColor }}>{k.label}</div>
              </div>
            );
          })}
        </div>

        {/* Content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px' }}>

          {/* Recent Assignments */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1.5px solid ${t.border}` }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: t.title, margin: 0, letterSpacing: '-.3px' }}>Recent Assignments</h2>
              <button
                onClick={() => navigate('/offices')}
                style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12px', fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                View all
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7m-3-3l3 3-3 3" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div>
              {loading ? <div style={{padding:'20px', textAlign:'center', color:t.sub}}>Loading...</div> : 
               recentAssignments.length === 0 ? <div style={{padding:'20px', textAlign:'center', color:t.sub}}>No recent assignments.</div> :
               recentAssignments.map((row, i) => (
                <div
                  key={row.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 22px', borderBottom: i < recentAssignments.length - 1 ? `1px solid ${t.border}` : 'none', transition: 'background .12s', cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = t.rowHover}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: t.officeChipBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: t.officeChipColor, letterSpacing: '-.3px' }}>{row.officeNo}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.occupant}</div>
                    <div style={{ fontSize: '11px', color: t.sub, marginTop: '1px', fontWeight: 600 }}>{row.department}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: t.muted, flexShrink: 0, fontWeight: 700 }}>{row.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Flagged Offices */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1.5px solid ${t.border}` }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: t.title, margin: 0, letterSpacing: '-.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Flagged
                <span style={{ backgroundColor: darkMode ? 'rgba(245,158,11,0.15)' : '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>
                  {flaggedOffices.length}
                </span>
              </h2>
              <button
                onClick={() => navigate('/admin')}
                style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12px', fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Resolve
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7m-3-3l3 3-3 3" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loading ? <div style={{padding:'20px', textAlign:'center', color:t.sub}}>Loading...</div> : 
               flaggedOffices.length === 0 ? <div style={{padding:'20px', textAlign:'center', color:t.sub}}>No flagged offices.</div> :
               flaggedOffices.map(o => {
                const pct = Math.min((o.current / o.capacity) * 100, 100);
                return (
                  <div key={o.id} style={{ padding: '13px 14px', backgroundColor: t.flagBg, border: `1.5px solid ${t.flagBorder}`, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#F59E0B', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: t.flagTitle, fontFamily: 'inherit' }}>{o.officeNo}</div>
                        <div style={{ fontSize: '11px', color: t.flagSub, marginTop: '1px', fontWeight: 600 }}>{o.building}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#F59E0B', letterSpacing: '-.5px', lineHeight: 1 }}>
                        {o.current}<span style={{ fontSize: '11px', fontWeight: 600, color: t.sub }}>/{o.capacity}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: t.sub, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>capacity</div>
                      <div style={{ width: '56px', height: '4px', backgroundColor: t.flagTrack, borderRadius: '2px', marginTop: '6px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#F59E0B', borderRadius: '2px' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}