import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';
import client from '../api/client';

const ChevronIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function AdminPanel() {
  const { darkMode } = useDarkMode();
  const [selOffice,  setSelOffice]  = useState('');
  const [selPerson,  setSelPerson]  = useState('');
  const [success,    setSuccess]    = useState('');
  const [errorMsg,   setErrorMsg]   = useState('');
  const [conflicts,  setConflicts]  = useState([]);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [expandedConflict, setExpandedConflict] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

  const [offices, setOffices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    try {
      const [officesRes, staffRes, assignRes] = await Promise.all([
        client.get('/offices/search/'),
        client.get('/staff/'),
        client.get('/assignments/')
      ]);
      
      const offData = officesRes.data.results || officesRes.data;
      const staffData = staffRes.data.results || staffRes.data;
      const assignData = assignRes.data.results || assignRes.data;
      
      setOffices(offData);
      setStaff(staffData);
      setAssignments(assignData);
      
      // Find conflicts
      const flags = offData.filter(o => o.current_occupants_count > o.capacity).map(o => ({
        id: o.id,
        officeNo: o.room_number,
        building: o.building_name || `Building ${o.building}`,
        capacity: o.capacity,
        current: o.current_occupants_count
      }));
      setConflicts(flags);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const t = darkMode ? {
    surface:    '#0D2640',
    surface2:   '#0A1E36',
    border:     'rgba(255,255,255,0.07)',
    title:      '#E8F4FF',
    text:       '#C8DCF0',
    sub:        '#4A7FAA',
    eyebrow:    '#4A7FAA',
    inputBg:    '#0A1E36',
    inputBorder:'rgba(255,255,255,0.1)',
    inputColor: '#C8DCF0',
    inputPlaceholder: 'rgba(255,255,255,0.28)',
    labelColor: 'rgba(255,255,255,0.28)',
    disabledBg: 'rgba(255,255,255,0.05)',
    disabledColor: 'rgba(255,255,255,0.2)',
    flagBg:     'rgba(245,158,11,0.07)',
    flagBorder: 'rgba(245,158,11,0.2)',
    flagTitle:  '#FCD34D',
    flagSub:    '#A78B3A',
    flagIconBg: 'rgba(245,158,11,0.15)',
  } : {
    surface:    '#fff',
    surface2:   '#F5F9FF',
    border:     '#C2D8EF',
    title:      '#0D2D52',
    text:       '#1E4A7A',
    sub:        '#7AAAD0',
    eyebrow:    '#5A87B8',
    inputBg:    '#fff',
    inputBorder:'#C2D8EF',
    inputColor: '#0D2D52',
    inputPlaceholder: '#8AAAC8',
    labelColor: '#7AAAD0',
    disabledBg: '#EEF4FB',
    disabledColor: '#A8C0D8',
    flagBg:     '#FFFBEB',
    flagBorder: '#FDE68A',
    flagTitle:  '#92400E',
    flagSub:    '#B45309',
    flagIconBg: 'rgba(245,158,11,0.12)',
  };

  const card = {
    backgroundColor: t.surface,
    borderRadius: '16px',
    border: `1.5px solid ${t.border}`,
    boxShadow: darkMode ? 'none' : '0 2px 12px rgba(15,60,120,0.07)',
    overflow: 'hidden',
  };

  const inputBase = {
    width: '100%',
    padding: '10px 30px 10px 12px',
    borderRadius: '10px',
    border: `1.5px solid ${t.inputBorder}`,
    backgroundColor: t.inputBg,
    color: t.inputColor,
    fontFamily: "'Nunito', 'Sora', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    outline: 'none',
    boxSizing: 'border-box',
    appearance: 'none',
    WebkitAppearance: 'none',
    transition: 'border-color .2s',
    cursor: 'pointer',
  };

  const isReady = selOffice && selPerson;

  const handleAssign = async () => {
    if (!isReady) return;
    setAssigning(true);
    setErrorMsg('');
    setSuccess('');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      await client.post('/assignments/', {
        office: parseInt(selOffice),
        staff: parseInt(selPerson),
        start_date: today
      });
      
      const pName = staff.find(s => s.id === parseInt(selPerson))?.last_name || 'Staff';
      const oName = offices.find(o => o.id === parseInt(selOffice))?.room_number || 'Office';
      
      setSuccess(`${pName} assigned to ${oName} successfully.`);
      setSelOffice(''); setSelPerson('');
      setTimeout(() => setSuccess(''), 4000);
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.office?.[0] || err.response?.data?.staff?.[0] || err.response?.data?.detail || 'Assignment failed.';
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 6000);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (assignmentId) => {
    setResolvingId(assignmentId);
    setErrorMsg('');
    try {
      const today = new Date().toISOString().split('T')[0];
      await client.patch(`/assignments/${assignmentId}/`, { end_date: today });
      setSuccess('Staff unassigned successfully.');
      setTimeout(() => setSuccess(''), 4000);
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to unassign staff member.');
      setTimeout(() => setErrorMsg(''), 6000);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Layout>
      <div style={{ fontFamily: "'Nunito', 'Sora', sans-serif", display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* ── Header ── */}
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: 800, color: t.eyebrow, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '5px' }}>Administration</div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: t.title, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>Admin Panel</h1>
        </div>

        {/* ── KPI strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
          {[
            { label: 'Total Offices',    value: offices.length,  bg: 'linear-gradient(135deg,#1D4ED8,#2563EB)', numColor: '#fff', lblColor: 'rgba(255,255,255,0.65)', border: 'none',
              icon: <svg width="44" height="44" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="white" strokeWidth="1.5"/><path d="M1 6h14" stroke="white" strokeWidth="1.5"/></svg> },
            { label: 'Faculty Members',  value: staff.length,
              bg: darkMode ? '#0D2640' : '#fff',
              numColor: darkMode ? '#818CF8' : '#4F46E5',
              lblColor: darkMode ? '#3730A3' : '#A5B4FC',
              border: darkMode ? '1.5px solid rgba(129,140,248,0.2)' : '1.5px solid #C2D8EF',
              icon: <svg width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M8 1a4 4 0 100 8A4 4 0 008 1zM2 14c0-2.5 2.7-4 6-4s6 1.5 6 4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"/></svg> },
            { label: 'Active Conflicts', value: conflicts.length,
              bg: darkMode ? '#0D2640' : '#fff',
              numColor: darkMode ? '#FBBF24' : '#D97706',
              lblColor: darkMode ? '#78350F' : '#FCD34D',
              border: darkMode ? '1.5px solid rgba(251,191,36,0.2)' : '1.5px solid #C2D8EF',
              icon: <svg width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M8 2v6m0 3v1" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"/><circle cx="8" cy="8" r="6.5" stroke="#F59E0B" strokeWidth="1.4"/></svg> },
          ].map((k, i) => (
            <div key={i} style={{ background: k.bg, border: k.border || 'none', borderRadius: '16px', padding: '20px 22px', position: 'relative', overflow: 'hidden', boxShadow: darkMode ? 'none' : '0 2px 10px rgba(15,60,120,0.06)' }}>
              <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: .14, display: 'flex' }}>{k.icon}</div>
              <div style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '4px', color: k.numColor }}>{k.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: k.lblColor }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

          {/* ── Assign Occupant ── */}
          <div style={card}>
            {/* Card header */}
            <div style={{ padding: '18px 22px', borderBottom: `1.5px solid ${t.border}`, background: t.surface2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1a4 4 0 100 8A4 4 0 008 1zM2 13.5c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 800, color: t.title, margin: 0, letterSpacing: '-.3px' }}>Assign Occupant</h2>
                  <p style={{ fontSize: '12px', color: t.sub, margin: '2px 0 0 0', fontWeight: 600 }}>Link a faculty member to an office.</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '22px' }}>
              {/* Success banner */}
              {success && (
                <div style={{ background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#059669', marginBottom: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l4 4 6-6" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {success}
                </div>
              )}
              {/* Error banner */}
              {errorMsg && (
                <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#DC2626', marginBottom: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.5"/>
                    <path d="M8 5v3M8 11h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {errorMsg}
                </div>
              )}

              {/* Office select */}
              <label style={{ fontSize: '10.5px', fontWeight: 800, color: t.labelColor, textTransform: 'uppercase', letterSpacing: '1.2px', display: 'block', marginBottom: '7px' }}>Office</label>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <select
                  value={selOffice}
                  onChange={e => setSelOffice(e.target.value)}
                  style={inputBase}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e => e.target.style.borderColor = t.inputBorder}
                >
                  <option value="">Select an office…</option>
                  {offices.map(o => <option key={o.id} value={o.id}>{o.room_number} ({o.building_name})</option>)}
                </select>
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', color: t.sub }}>
                  <ChevronIcon color={t.sub}/>
                </span>
              </div>

              {/* Person select */}
              <label style={{ fontSize: '10.5px', fontWeight: 800, color: t.labelColor, textTransform: 'uppercase', letterSpacing: '1.2px', display: 'block', marginBottom: '7px' }}>Faculty / Staff</label>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <select
                  value={selPerson}
                  onChange={e => setSelPerson(e.target.value)}
                  style={inputBase}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e => e.target.style.borderColor = t.inputBorder}
                >
                  <option value="">Select a person…</option>
                  {staff.map(p => <option key={p.id} value={p.id}>{p.academic_title} {p.first_name} {p.last_name}</option>)}
                </select>
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', color: t.sub }}>
                  <ChevronIcon color={t.sub}/>
                </span>
              </div>

              {/* Preview chip (when both selected) */}
              {isReady && (
                <div style={{ background: darkMode ? 'rgba(59,130,246,0.1)' : '#EFF6FF', border: `1.5px solid ${darkMode ? 'rgba(59,130,246,0.2)' : '#BFDBFE'}`, borderRadius: '10px', padding: '11px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1a4 4 0 100 8A4 4 0 008 1zM2 13.5c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" stroke={darkMode ? '#60A5FA' : '#2563EB'} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#60A5FA' : '#1D4ED8' }}>
                    {staff.find(s => s.id === parseInt(selPerson))?.last_name || 'Staff'} → <span style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : '#DBEAFE', padding: '1px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800 }}>{offices.find(o => o.id === parseInt(selOffice))?.room_number || 'Office'}</span>
                  </span>
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleAssign}
                disabled={!isReady || assigning}
                onMouseEnter={() => isReady && setHoveredBtn('assign')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  width: '100%', padding: '13px',
                  background: !isReady ? t.disabledBg : hoveredBtn === 'assign' ? 'linear-gradient(135deg,#1D4ED8,#1E40AF)' : 'linear-gradient(135deg,#2563EB,#1D4ED8)',
                  color: !isReady ? t.disabledColor : '#fff',
                  border: 'none', borderRadius: '11px',
                  fontSize: '13px', fontFamily: 'inherit', fontWeight: 800,
                  cursor: !isReady ? 'not-allowed' : 'pointer',
                  boxShadow: !isReady ? 'none' : hoveredBtn === 'assign' ? '0 6px 20px rgba(37,99,235,0.4)' : '0 4px 14px rgba(37,99,235,0.3)',
                  transition: 'all .15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {isReady && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l4 4 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>

          {/* ── Flagged Offices ── */}
          <div style={card}>
            <div style={{ padding: '18px 22px', borderBottom: `1.5px solid ${t.border}`, background: t.surface2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: darkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB', border: `1.5px solid ${darkMode ? 'rgba(245,158,11,0.25)' : '#FDE68A'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v6m0 3v1" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="8" cy="8" r="6.5" stroke="#F59E0B" strokeWidth="1.4"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 800, color: t.title, margin: 0, letterSpacing: '-.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Flagged Offices
                    {conflicts.length > 0 && (
                      <span style={{ background: darkMode ? 'rgba(245,158,11,0.18)' : '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>
                        {conflicts.length}
                      </span>
                    )}
                  </h2>
                  <p style={{ fontSize: '12px', color: t.sub, margin: '2px 0 0 0', fontWeight: 600 }}>Offices exceeding assigned capacity.</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 16px' }}>
              {conflicts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#ECFDF5', border: '1.5px solid #6EE7B7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 4.5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: t.title, marginBottom: '4px' }}>All Clear</div>
                  <div style={{ fontSize: '13px', color: t.sub, fontWeight: 600 }}>No capacity conflicts detected.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {conflicts.map(c => {
                    const pct = Math.min((c.current / c.capacity) * 100, 100);
                    const isExpanded = expandedConflict === c.id;
                    const activeAssigns = assignments.filter(a => a.office === c.id && !a.end_date);
                    return (
                      <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ padding: '14px 16px', borderRadius: '12px', background: t.flagBg, border: `1.5px solid ${t.flagBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: t.flagIconBg, border: `1.5px solid ${darkMode ? 'rgba(245,158,11,0.2)' : '#FDE68A'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                                <path d="M8 2v5m0 2.5v1" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"/>
                                <path d="M8 1L1 14h14L8 1z" stroke="#F59E0B" strokeWidth="1.4" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 900, color: t.flagTitle, letterSpacing: '-.3px', marginBottom: '2px' }}>{c.officeNo}</div>
                              <div style={{ fontSize: '11px', color: t.flagSub, fontWeight: 600, marginBottom: '6px' }}>{c.building} — {c.current}/{c.capacity} occupants</div>
                              <div style={{ width: '80px', height: '4px', background: darkMode ? 'rgba(245,158,11,0.15)' : '#FDE68A', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: '#F59E0B', borderRadius: '2px' }}/>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedConflict(isExpanded ? null : c.id)}
                            onMouseEnter={() => setHoveredBtn(`resolve-${c.id}`)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              background: hoveredBtn === `resolve-${c.id}` || isExpanded ? '#F59E0B' : 'transparent',
                              color: hoveredBtn === `resolve-${c.id}` || isExpanded ? '#fff' : '#D97706',
                              border: `1.5px solid ${hoveredBtn === `resolve-${c.id}` || isExpanded ? '#F59E0B' : '#FCD34D'}`,
                              borderRadius: '9px', padding: '7px 14px',
                              fontSize: '12px', fontFamily: 'inherit', fontWeight: 800,
                              cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
                              display: 'flex', alignItems: 'center', gap: '5px',
                            }}
                          >
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {isExpanded ? 'Close' : 'Resolve'}
                          </button>
                        </div>
                        
                        {/* Expanded Occupants List */}
                        {isExpanded && (
                          <div style={{ padding: '12px', borderRadius: '12px', border: `1.5px dashed ${t.flagBorder}`, background: t.surface2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '.5px' }}>Current Occupants</div>
                            {activeAssigns.length > 0 ? activeAssigns.map(a => {
                              const stf = staff.find(s => s.id === a.staff) || {};
                              const name = `${stf.academic_title || ''} ${stf.first_name || ''} ${stf.last_name || ''}`.trim() || 'Unknown Staff';
                              return (
                                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#fff', border: `1.5px solid ${t.border}`, borderRadius: '8px' }}>
                                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: t.text }}>{name}</div>
                                  <button
                                    onClick={() => handleUnassign(a.id)}
                                    disabled={resolvingId === a.id}
                                    style={{
                                      background: 'rgba(239,68,68,0.1)', color: '#DC2626', border: '1.5px solid rgba(239,68,68,0.3)',
                                      borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 800, cursor: resolvingId === a.id ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    {resolvingId === a.id ? 'Removing...' : 'Unassign'}
                                  </button>
                                </div>
                              );
                            }) : (
                              <div style={{ fontSize: '12px', color: t.sub, fontStyle: 'italic' }}>No active assignments found.</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}