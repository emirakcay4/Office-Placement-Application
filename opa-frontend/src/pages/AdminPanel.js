import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';
import client from '../api/client';

const ChevronIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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
      nextUrl = null;
    }
  }
  return results;
};

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
  const [requests, setRequests] = useState([]);
  const [resolvingRequestId, setResolvingRequestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  // States for unassignment confirmation modal
  const [confirmUnassignData, setConfirmUnassignData] = useState(null);
  const [officeItEquipment, setOfficeItEquipment] = useState([]);
  const [fetchingEquipment, setFetchingEquipment] = useState(false);
  const [assignmentSuccessData, setAssignmentSuccessData] = useState(null);

  const fetchData = async () => {
    try {
      const [offData, staffData, assignData, requestsData] = await Promise.all([
        fetchAllPages('/offices/search/'),
        fetchAllPages('/staff/'),
        fetchAllPages('/assignments/'),
        fetchAllPages('/requests/')
      ]);
      
      setOffices(offData);
      setStaff(staffData);
      setAssignments(assignData);
      setRequests(requestsData);
      
      // Find conflicts
      const flags = offData.filter(o => o.current_occupants_count > o.capacity).map(o => ({
        id: o.id,
        officeNo: o.room_number,
        building: o.building_name || `Building ${o.building}`,
        capacity: o.capacity,
        current: o.current_occupants_count
      }));
      setConflicts(flags);
      return { offData, staffData, assignData, requestsData };
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

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved':
        return darkMode ? { color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' }
                        : { color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' };
      case 'rejected':
        return darkMode ? { color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' }
                        : { color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' };
      default: // pending
        return darkMode ? { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' }
                        : { color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' };
    }
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

  const getActiveOfficeCount = (staffId) => {
    return assignments.filter(a => {
      const sId = typeof a.staff === 'object' && a.staff !== null ? a.staff.id : a.staff;
      return sId === staffId && !a.end_date;
    }).length;
  };

  const isReady = selOffice && selPerson;

  const handleAssign = async () => {
    if (!isReady) return;
    setAssigning(true);
    setErrorMsg('');
    setSuccess('');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const officeIdInt = parseInt(selOffice);
      const personIdInt = parseInt(selPerson);
      
      await client.post('/assignments/', {
        office: officeIdInt,
        staff: personIdInt,
        start_date: today
      });
      
      const pObj = staff.find(s => s.id === personIdInt);
      const oObj = offices.find(o => o.id === officeIdInt);
      
      // Refresh data and retrieve fresh results synchronously
      const fresh = await fetchData();
      
      if (fresh) {
        const freshOffice = fresh.offData.find(o => o.id === officeIdInt) || oObj;
        const freshAssignments = fresh.assignData.filter(a => {
          const oId = typeof a.office === 'object' && a.office !== null ? a.office.id : a.office;
          return oId === officeIdInt && !a.end_date;
        });
        const currentOccupants = freshAssignments.map(a => {
          const sId = typeof a.staff === 'object' && a.staff !== null ? a.staff.id : a.staff;
          const stf = fresh.staffData.find(s => s.id === sId);
          return stf ? `${stf.academic_title || ''} ${stf.first_name} ${stf.last_name}`.trim() : 'Unknown';
        });

        const freshPersonAssignments = fresh.assignData.filter(a => {
          const sId = typeof a.staff === 'object' && a.staff !== null ? a.staff.id : a.staff;
          return sId === personIdInt && !a.end_date;
        });

        setAssignmentSuccessData({
          staffName: `${pObj?.academic_title || ''} ${pObj?.first_name} ${pObj?.last_name}`.trim(),
          officeNo: freshOffice?.room_number || oObj?.room_number,
          building: freshOffice?.building_name || oObj?.building_name,
          floor: freshOffice?.floor || oObj?.floor,
          occupiedSpots: freshOffice?.current_occupants_count ?? 0,
          capacity: freshOffice?.capacity ?? 0,
          occupants: currentOccupants,
          officesHeld: freshPersonAssignments.length
        });
      } else {
        const pName = pObj?.last_name || 'Staff';
        const oName = oObj?.room_number || 'Office';
        setSuccess(`${pName} assigned to ${oName} successfully.`);
        setTimeout(() => setSuccess(''), 4000);
      }
      
      setSelOffice('');
      setSelPerson('');
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.office?.[0] || err.response?.data?.staff?.[0] || err.response?.data?.detail || 'Assignment failed.';
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 6000);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignClick = async (assignment, staffName, officeNo) => {
    const officeId = typeof assignment.office === 'object' ? assignment.office.id : assignment.office;
    setConfirmUnassignData({
      assignmentId: assignment.id,
      staffName,
      officeNo,
      officeId
    });
    setOfficeItEquipment([]);
    setFetchingEquipment(true);
    try {
      const res = await client.get(`/offices/${officeId}/`);
      setOfficeItEquipment(res.data.it_equipment || []);
    } catch (err) {
      console.error("Failed to fetch office details for IT equipment warning:", err);
    } finally {
      setFetchingEquipment(false);
    }
  };

  const handleConfirmUnassign = async () => {
    if (!confirmUnassignData) return;
    const { assignmentId } = confirmUnassignData;
    setResolvingId(assignmentId);
    setConfirmUnassignData(null);
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

  const handleRequestStatus = async (requestId, newStatus) => {
    setResolvingRequestId(requestId);
    setErrorMsg('');
    setSuccess('');
    try {
      await client.patch(`/requests/${requestId}/`, { status: newStatus });
      setSuccess(`Request successfully ${newStatus}.`);
      setTimeout(() => setSuccess(''), 4000);
      fetchData();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.status?.[0] || err.response?.data?.detail || `Failed to mark request as ${newStatus}.`;
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 6000);
    } finally {
      setResolvingRequestId(null);
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
              {success && !resolvingRequestId && (
                <div style={{ background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#059669', marginBottom: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l4 4 6-6" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {success}
                </div>
              )}
              {/* Error banner */}
              {errorMsg && !resolvingRequestId && (
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
                  {offices.map(o => {
                    const occ = o.current_occupants_count ?? 0;
                    const cap = o.capacity ?? 0;
                    const spotsLeft = Math.max(0, cap - occ);
                    const isFull = occ >= cap;
                    const statusText = isFull 
                      ? '[FULL]' 
                      : `(${occ}/${cap} spots, ${spotsLeft} left)`;
                    return (
                      <option key={o.id} value={o.id}>
                        {o.room_number} ({o.building_name}) — {statusText}
                      </option>
                    );
                  })}
                </select>
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', color: t.sub }}>
                  <ChevronIcon color={t.sub}/>
                </span>
              </div>

              {/* Office Info Card */}
              {selOffice && (() => {
                const o = offices.find(x => x.id === parseInt(selOffice));
                if (!o) return null;
                const occ = o.current_occupants_count ?? 0;
                const cap = o.capacity ?? 0;
                const pct = cap > 0 ? Math.min((occ / cap) * 100, 100) : 0;
                const spotsLeft = Math.max(0, cap - occ);
                const isFull = occ >= cap;

                return (
                  <div style={{
                    background: darkMode ? 'rgba(255,255,255,0.02)' : '#F5F9FF',
                    border: `1.5px solid ${t.border}`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Office Details
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        background: isFull ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                        color: isFull ? '#EF4444' : '#10B981',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        textTransform: 'uppercase'
                      }}>
                        {isFull ? 'Full' : `${spotsLeft} Spot${spotsLeft !== 1 ? 's' : ''} Available`}
                      </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: t.sub, fontWeight: 700 }}>Location</div>
                        <div style={{ fontSize: '12.5px', color: t.text, fontWeight: 800 }}>
                          {o.building_name}, Floor {o.floor}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: t.sub, fontWeight: 700 }}>Office Type</div>
                        <div style={{ fontSize: '12.5px', color: t.text, fontWeight: 800, textTransform: 'capitalize' }}>
                          {o.office_type || 'Faculty Office'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: t.text, marginBottom: '4px' }}>
                        <span>Occupancy Ratio</span>
                        <span>{occ} / {cap} ({Math.round(pct)}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isFull ? 'linear-gradient(90deg, #EF4444, #F87171)' : 'linear-gradient(90deg, #3B82F6, #60A5FA)', borderRadius: '3px', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Person select */}
              <label style={{ fontSize: '10.5px', fontWeight: 800, color: t.labelColor, textTransform: 'uppercase', letterSpacing: '1.2px', display: 'block', marginBottom: '7px' }}>Faculty / Staff</label>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <select
                  value={selPerson}
                  onChange={e => setSelPerson(e.target.value)}
                  style={inputBase}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e => e.target.style.borderColor = t.inputBorder}
                >
                  <option value="">Select a person…</option>
                  {staff.map(p => {
                    const holdsCount = getActiveOfficeCount(p.id);
                    const holdsText = holdsCount === 0 
                      ? '(holds no offices)' 
                      : `(holds ${holdsCount} office${holdsCount !== 1 ? 's' : ''})`;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.academic_title} {p.first_name} {p.last_name} — {holdsText}
                      </option>
                    );
                  })}
                </select>
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', color: t.sub }}>
                  <ChevronIcon color={t.sub}/>
                </span>
              </div>

              {/* Person Info Card */}
              {selPerson && (() => {
                const p = staff.find(x => x.id === parseInt(selPerson));
                if (!p) return null;
                const holdsCount = getActiveOfficeCount(p.id);

                return (
                  <div style={{
                    background: darkMode ? 'rgba(255,255,255,0.02)' : '#F5F9FF',
                    border: `1.5px solid ${t.border}`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Staff Member Details
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        background: holdsCount > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                        color: holdsCount > 0 ? '#F59E0B' : '#3B82F6',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        textTransform: 'uppercase'
                      }}>
                        {holdsCount === 0 ? 'No offices held' : holdsCount === 1 ? '1 active office' : `${holdsCount} active offices`}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: t.sub, fontWeight: 700 }}>Department</div>
                        <div style={{ fontSize: '12.5px', color: t.text, fontWeight: 800 }}>
                          {p.department_name || 'General Faculty'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: t.sub, fontWeight: 700 }}>System Role</div>
                        <div style={{ fontSize: '12.5px', color: t.text, fontWeight: 800, textTransform: 'capitalize' }}>
                          {(p.system_role || 'faculty').replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                                    onClick={() => handleUnassignClick(a, name, c.officeNo)}
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

        {/* ── Office Requests Manager ── */}
        <div style={card}>
          <div style={{ padding: '18px 22px', borderBottom: `1.5px solid ${t.border}`, background: t.surface2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M11 2H5a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6h4M6 9h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 800, color: t.title, margin: 0, letterSpacing: '-.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Office Requests Manager
                  {requests.filter(r => r.status === 'pending').length > 0 && (
                    <span style={{ background: darkMode ? 'rgba(245,158,11,0.18)' : '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>
                      {requests.filter(r => r.status === 'pending').length} Pending
                    </span>
                  )}
                </h2>
                <p style={{ fontSize: '12px', color: t.sub, margin: '2px 0 0 0', fontWeight: 600 }}>Review, approve, or reject incoming office requests from faculty members.</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 22px' }}>
            {/* Success and error alerts specific to requests */}
            {success && resolvingRequestId && (
              <div style={{ background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#059669', marginBottom: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '9px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l4 4 6-6" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {success}
              </div>
            )}
            {errorMsg && resolvingRequestId && (
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#DC2626', marginBottom: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '9px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.5"/>
                  <path d="M8 5v3M8 11h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {errorMsg}
              </div>
            )}

            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: t.sub, fontWeight: 600, fontSize: '13px' }}>
                No office requests found in the system.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: `1.5px solid ${t.border}` }}>
                      {['Faculty Member', 'Requested Office', 'Reason', 'Requested On', 'Status', 'Actions'].map((thName, idx) => (
                        <th key={idx} style={{ padding: '10px 12px', fontSize: '10.5px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          {thName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req, reqIdx) => {
                      const isPending = req.status === 'pending';
                      const badgeStyle = getStatusStyle(req.status);
                      const formattedDate = new Date(req.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });

                      return (
                        <tr key={req.id} style={{ borderBottom: reqIdx < requests.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                          {/* Faculty Member */}
                          <td style={{ padding: '14px 12px', fontSize: '13px', color: t.text, fontWeight: 700 }}>
                            {req.staff_name || `Staff ID: ${req.staff}`}
                          </td>

                          {/* Requested Office */}
                          <td style={{ padding: '14px 12px' }}>
                            {(() => {
                              const targetOffice = offices.find(o => o.id === req.office);
                              const occ = targetOffice ? targetOffice.current_occupants_count : 0;
                              const cap = targetOffice ? targetOffice.capacity : 0;
                              const isFull = targetOffice && occ >= cap;
                              const isVacate = req.reason?.startsWith('[VACATE REQUEST]');

                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div>
                                    <span style={{
                                      background: isVacate ? 'rgba(124,58,237,0.12)' : (darkMode ? 'rgba(59,130,246,0.15)' : '#DBEAFE'),
                                      color: isVacate ? '#7C3AED' : (darkMode ? '#60A5FA' : '#1D4ED8'),
                                      border: isVacate ? '1px solid rgba(124,58,237,0.3)' : 'none',
                                      fontSize: '11.5px',
                                      fontWeight: 800,
                                      padding: '3px 8px',
                                      borderRadius: '6px'
                                    }}>
                                      {isVacate ? '🔓 Vacate ' : ''}{req.office_room} ({req.office_building || 'Unknown Building'})
                                    </span>
                                  </div>
                                  {!isVacate && targetOffice && (
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: isFull ? '#EF4444' : t.sub }}>
                                      {isFull ? '🔴 Office Full' : `🟢 Occupied: ${occ}/${cap}`}
                                    </div>
                                  )}
                                  {isVacate && (
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>
                                      🟣 Request to Release Room
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Reason */}
                          <td style={{ padding: '14px 12px', fontSize: '12.5px', color: t.text, fontWeight: 500, maxWidth: '240px', wordBreak: 'break-word' }}>
                            {req.reason?.startsWith('[VACATE REQUEST]') ? req.reason.replace('[VACATE REQUEST]', '').trim() : req.reason}
                          </td>

                          {/* Requested On */}
                          <td style={{ padding: '14px 12px', fontSize: '12.5px', color: t.sub, fontWeight: 600 }}>
                            {formattedDate}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              background: badgeStyle.bg, color: badgeStyle.color, border: `1.5px solid ${badgeStyle.border}`,
                              fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px'
                            }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: badgeStyle.color, display: 'inline-block' }} />
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 12px' }}>
                            {isPending ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleRequestStatus(req.id, 'approved')}
                                  disabled={resolvingRequestId === req.id}
                                  style={{
                                    background: 'linear-gradient(135deg, #10B981, #059669)',
                                    color: '#fff', border: 'none', borderRadius: '6px',
                                    padding: '6px 12px', fontSize: '11.5px', fontWeight: 800,
                                    cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.2)',
                                    transition: 'all 0.15s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
                                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRequestStatus(req.id, 'rejected')}
                                  disabled={resolvingRequestId === req.id}
                                  style={{
                                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                    color: '#fff', border: 'none', borderRadius: '6px',
                                    padding: '6px 12px', fontSize: '11.5px', fontWeight: 800,
                                    cursor: 'pointer', boxShadow: '0 2px 4px rgba(239,68,68,0.2)',
                                    transition: 'all 0.15s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
                                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: t.sub, fontWeight: 700, fontStyle: 'italic' }}>
                                Resolved
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Unassign Confirmation Modal ── */}
      {confirmUnassignData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            backgroundColor: t.surface,
            borderRadius: '16px',
            border: `1.5px solid ${t.border}`,
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            fontFamily: 'inherit'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: t.title, margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
              Confirm Office Unassignment
            </h3>
            
            <p style={{ fontSize: '14px', color: t.text, margin: '0 0 16px 0', fontWeight: 600, lineHeight: 1.4 }}>
              Are you sure you want to unassign **{confirmUnassignData.staffName}** from office **{confirmUnassignData.officeNo}**? This will end their current occupancy assignment immediately.
            </p>

            {/* IT Equipment Warning Box */}
            <div style={{
              background: darkMode ? 'rgba(239,68,68,0.06)' : '#FEF2F2',
              border: `1.5px solid ${darkMode ? 'rgba(239,68,68,0.2)' : '#FCA5A5'}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.5"/>
                  <path d="M8 5v3M8 11h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  IT Equipment Check
                </span>
              </div>
              
              {fetchingEquipment ? (
                <div style={{ fontSize: '12px', color: t.sub, fontStyle: 'italic' }}>Scanning office for IT equipment...</div>
              ) : officeItEquipment.length > 0 ? (
                <div>
                  <p style={{ fontSize: '12px', color: darkMode ? '#F87171' : '#991B1B', margin: '0 0 10px 0', fontWeight: 700 }}>
                    The following assets are registered to this office. Please notify the IT Department if they need to be recovered or reallocated:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {officeItEquipment.map(item => (
                      <li key={item.id} style={{ fontSize: '12px', color: t.text, fontWeight: 600 }}>
                        <strong style={{ textTransform: 'capitalize' }}>{item.asset_type}</strong> (S/N: {item.serial_number}) — <span style={{ textTransform: 'uppercase', fontSize: '10px', background: item.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: item.status === 'active' ? '#10B981' : '#F59E0B', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>{item.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: darkMode ? '#34D399' : '#065F46', fontWeight: 700 }}>
                  ✓ No IT assets are registered to this office.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setConfirmUnassignData(null)}
                style={{
                  background: 'none',
                  border: `1.5px solid ${t.border}`,
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: t.text,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnassign}
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220,38,38,0.2)'
                }}
              >
                Unassign Staff
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Detailed Assignment Success Modal ── */}
      {assignmentSuccessData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            backgroundColor: t.surface,
            borderRadius: '20px',
            border: `2px solid ${darkMode ? 'rgba(52,211,153,0.3)' : '#6EE7B7'}`,
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: darkMode ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(15,60,120,0.15)',
            fontFamily: 'inherit',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top green success accent glow */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
              background: 'linear-gradient(90deg, #10B981, #34D399)'
            }} />

            {/* Icon + Title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '22px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: darkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
                border: `2px solid ${darkMode ? 'rgba(16,185,129,0.3)' : '#6EE7B7'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 4px 10px rgba(16,185,129,0.1)'
              }}>
                <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l4 4 6-6" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: t.title, margin: 0, letterSpacing: '-0.5px' }}>
                Assignment Successful!
              </h3>
              <p style={{ fontSize: '13px', color: t.sub, margin: '4px 0 0 0', fontWeight: 600 }}>
                Faculty member has been successfully linked to the office.
              </p>
            </div>

            {/* Target Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {/* Faculty member stats */}
              <div style={{
                background: t.surface2, border: `1.5px solid ${t.border}`,
                borderRadius: '12px', padding: '14px 16px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  FACULTY MEMBER
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: t.text }}>
                  {assignmentSuccessData.staffName}
                </div>
                <div style={{ fontSize: '12px', color: t.sub, fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>💼 Now holds <strong>{assignmentSuccessData.officesHeld}</strong> active office{assignmentSuccessData.officesHeld !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Office stats & list of occupants */}
              <div style={{
                background: t.surface2, border: `1.5px solid ${t.border}`,
                borderRadius: '12px', padding: '14px 16px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                  OFFICE DETAILS
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: t.text }}>
                    Office {assignmentSuccessData.officeNo}
                  </div>
                  <div style={{ fontSize: '12px', color: t.sub, fontWeight: 700 }}>
                    {assignmentSuccessData.building}, Floor {assignmentSuccessData.floor}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: t.text, marginBottom: '6px' }}>
                    <span>Occupied Spots</span>
                    <span>{assignmentSuccessData.occupiedSpots} / {assignmentSuccessData.capacity}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min((assignmentSuccessData.occupiedSpots / assignmentSuccessData.capacity) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #10B981, #34D399)',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>

                {/* Occupants list */}
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                    Current Room Occupants ({assignmentSuccessData.occupants.length})
                  </div>
                  {assignmentSuccessData.occupants.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {assignmentSuccessData.occupants.map((name, i) => (
                        <div key={i} style={{
                          fontSize: '12px', fontWeight: 700, color: t.text,
                          padding: '6px 10px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#fff',
                          border: `1px solid ${t.border}`, borderRadius: '6px',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                          {name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: t.sub, fontStyle: 'italic' }}>
                      No occupants assigned to this room.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* OK button */}
            <button
              onClick={() => setAssignmentSuccessData(null)}
              style={{
                width: '100%', padding: '12px',
                background: 'linear-gradient(135deg,#10B981,#059669)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '13px', fontFamily: 'inherit', fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              Done
            </button>
          </div>
        </div>
      )}

    </Layout>
  );
}