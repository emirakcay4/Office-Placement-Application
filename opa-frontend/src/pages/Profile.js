import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const ROLE_LABELS = {
  faculty:          'Faculty',
  department_admin: 'Department Admin',
  resource_manager: 'Resource Manager',
  system_admin:     'System Admin',
  it_department:    'IT Department',
};

const REQUEST_STATUS = {
  approved: { label: 'Approved', color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', dot: '#10B981' },
  pending:  { label: 'Pending',  color: '#B45309', bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B' },
  rejected: { label: 'Rejected', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', dot: '#EF4444' },
};

const AVATAR_COLORS = ['#2563EB', '#059669', '#7C3AED', '#B45309', '#0891B2'];

function Avatar({ name, size = 72 }) {
  const initials = name.split(' ').filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0]).join('');
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 900, color: '#fff',
      fontFamily: 'inherit', letterSpacing: '-1px', flexShrink: 0,
      boxShadow: '0 4px 18px rgba(37,99,235,0.35)',
    }}>
      {initials}
    </div>
  );
}

export default function Profile() {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const [activeTab, setActiveTab]   = useState('history');
  const [hoveredRow, setHoveredRow] = useState(null);
  
  const [officeHistory, setOfficeHistory] = useState([]);
  const [equipmentRequests, setEquipmentRequests] = useState([]); // Placeholder
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.staff_profile?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const [assignRes, officesRes] = await Promise.all([
          client.get('/assignments/'),
          client.get('/offices/search/')
        ]);
        
        const assignments = assignRes.data.results || assignRes.data;
        const offices = officesRes.data.results || officesRes.data;
        
        const offMap = {};
        offices.forEach(o => { offMap[o.id] = o; });
        
        // Filter assignments for the current user
        const userAssignments = assignments.filter(a => a.staff && a.staff.id === user.staff_profile.id);
        
        const mapped = userAssignments.map(a => {
          const o = offMap[a.office] || {};
          
          const stDate = new Date(a.start_date);
          const enDate = a.end_date ? new Date(a.end_date) : new Date();
          const diffDays = Math.ceil(Math.abs(enDate - stDate) / (1000 * 60 * 60 * 24));
          const years = Math.floor(diffDays / 365);
          const months = Math.floor((diffDays % 365) / 30);
          
          return {
            id: a.id,
            officeNo: o.room_number || `Office ${a.office}`,
            building: o.building_name || 'Unknown',
            floor: o.floor || '-',
            start: a.start_date,
            end: a.end_date || null,
            duration: `${years > 0 ? years + 'y ' : ''}${months}m`,
            capacity: o.capacity || 0,
            occupants: o.current_occupants_count || 0,
          };
        });
        
        setOfficeHistory(mapped);
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);

  if (!user) return <Layout><div style={{padding:'40px'}}>Loading profile...</div></Layout>;

  const profileData = {
    fullName: `${user.staff_profile?.academic_title || ''} ${user.staff_profile?.first_name || ''} ${user.staff_profile?.last_name || ''}`.trim() || user.username,
    email: user.email || user.staff_profile?.email || 'No email',
    systemRole: user.staff_profile?.system_role || 'faculty',
    department: user.staff_profile?.department_name || 'No department',
    phone: 'Not provided',
    joinedDate: 'Recently'
  };

  const t = darkMode ? {
    surface:    '#0D2640',
    surface2:   '#0A1E36',
    border:     'rgba(255,255,255,0.07)',
    title:      '#E8F4FF',
    text:       '#C8DCF0',
    sub:        '#4A7FAA',
    eyebrow:    '#4A7FAA',
    muted:      '#2A4A6A',
    chipBg:     'rgba(255,255,255,0.06)',
    chipColor:  '#C8DCF0',
    thColor:    'rgba(255,255,255,0.28)',
    rowHover:   'rgba(255,255,255,0.03)',
    rowBorder:  'rgba(255,255,255,0.05)',
    officeChipBg:'rgba(59,130,246,0.15)',
    officeChipColor:'#60A5FA',
    typeBg:     'rgba(255,255,255,0.06)',
    typeColor:  'rgba(255,255,255,0.38)',
    occTrack:   'rgba(255,255,255,0.08)',
    statCards: [
      { bg: 'linear-gradient(135deg,#4F46E5,#6366F1)', numColor: '#fff',    lblColor: 'rgba(255,255,255,0.65)', border: 'none' },
      { bg: '#0D2640', numColor: '#60A5FA', lblColor: '#1E3A8A',            border: '1.5px solid rgba(96,165,250,0.2)' },
      { bg: '#0D2640', numColor: '#34D399', lblColor: '#065F46',            border: '1.5px solid rgba(52,211,153,0.2)' },
    ],
    currentOfficeBg:     'rgba(59,130,246,0.1)',
    currentOfficeBorder: 'rgba(59,130,246,0.25)',
    tabActiveBorder:     '#3B82F6',
    tabActiveColor:      '#60A5FA',
    tabCountActiveBg:    'rgba(59,130,246,0.18)',
  } : {
    surface:    '#fff',
    surface2:   '#F5F9FF',
    border:     '#C2D8EF',
    title:      '#0D2D52',
    text:       '#1E4A7A',
    sub:        '#7AAAD0',
    eyebrow:    '#5A87B8',
    muted:      '#A8C0D8',
    chipBg:     '#EEF4FB',
    chipColor:  '#1E4A7A',
    thColor:    '#7AAAD0',
    rowHover:   '#F5F9FF',
    rowBorder:  '#EEF4FB',
    officeChipBg:'#DBEAFE',
    officeChipColor:'#1D4ED8',
    typeBg:     '#EEF4FB',
    typeColor:  '#5A87B8',
    occTrack:   '#E2EDF9',
    statCards: [
      { bg: 'linear-gradient(135deg,#4F46E5,#6366F1)', numColor: '#fff',    lblColor: 'rgba(255,255,255,0.65)', border: 'none' },
      { bg: '#fff', numColor: '#1D4ED8', lblColor: '#93C5FD',               border: '1.5px solid #C2D8EF' },
      { bg: '#fff', numColor: '#059669', lblColor: '#6EE7B7',               border: '1.5px solid #C2D8EF' },
    ],
    currentOfficeBg:     '#EFF6FF',
    currentOfficeBorder: '#BFDBFE',
    tabActiveBorder:     '#2563EB',
    tabActiveColor:      '#2563EB',
    tabCountActiveBg:    'rgba(37,99,235,0.1)',
  };

  const card = {
    backgroundColor: t.surface,
    borderRadius: '16px',
    border: `1.5px solid ${t.border}`,
    boxShadow: darkMode ? 'none' : '0 2px 12px rgba(15,60,120,0.07)',
  };

  const currentOffice = officeHistory.find(h => !h.end);

  const statData = [
    { label: 'Offices Held',       value: officeHistory.length },
    { label: 'Equipment Requests', value: equipmentRequests.length },
    { label: 'Approved Requests',  value: equipmentRequests.filter(r => r.status === 'approved').length },
  ];

  const statIcons = [
    <svg key={0} width="44" height="44" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="white" strokeWidth="1.5"/><path d="M1 6h14" stroke="white" strokeWidth="1.5"/></svg>,
    <svg key={1} width="44" height="44" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="#3B82F6" strokeWidth="1.4"/><path d="M5 8h6M5 5h3M5 11h4" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    <svg key={2} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ];

  const tabs = [
    { id: 'history',   label: 'Office History',     count: officeHistory.length     },
    { id: 'equipment', label: 'Equipment Requests', count: equipmentRequests.length },
  ];

  const infoChips = [
    { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4l6 5 6-5M2 4h12v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>, value: profileData.email },
    { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 3a1 1 0 011-1h2l1 3-1.5 1.5a9 9 0 004 4L11 9l3 1v2a1 1 0 01-1 1A12 12 0 013 3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>, value: profileData.phone },
    currentOffice && { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 4V3a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>, value: `${currentOffice.officeNo}, ${currentOffice.building}` },
  ].filter(Boolean);

  return (
    <Layout>
      <div style={{ fontFamily: "'Nunito', 'Sora', sans-serif", display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* ── Header ── */}
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: 800, color: t.eyebrow, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '5px' }}>Account</div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: t.title, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>Profile</h1>
        </div>

        {/* ── Profile card ── */}
        <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
          {/* Gradient accent bar */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #2563EB, #6366F1, #7C3AED)' }} />

          <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
            <Avatar name={profileData.fullName} size={72} />

            <div style={{ flex: 1, minWidth: '200px' }}>
              {/* Name + role */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '5px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: t.title, margin: 0, letterSpacing: '-.7px' }}>
                  {profileData.fullName}
                </h2>
                <span style={{ background: darkMode ? 'rgba(59,130,246,0.15)' : '#EFF6FF', color: darkMode ? '#60A5FA' : '#1D4ED8', border: `1.5px solid ${darkMode ? 'rgba(96,165,250,0.25)' : '#BFDBFE'}`, fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '22px' }}>
                  {ROLE_LABELS[profileData.systemRole] || profileData.systemRole}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: t.sub, marginBottom: '16px', fontWeight: 600 }}>
                {profileData.department} · Joined {profileData.joinedDate}
              </div>

              {/* Info chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {infoChips.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: t.chipBg, border: `1.5px solid ${t.border}`, borderRadius: '9px', padding: '7px 12px', fontSize: '12px', color: t.chipColor, fontWeight: 600 }}>
                    <span style={{ color: t.sub, display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                    {item.value}
                  </div>
                ))}
              </div>
            </div>

            {/* Current office quick stat */}
            {currentOffice && (
              <div style={{ background: t.currentOfficeBg, border: `1.5px solid ${t.currentOfficeBorder}`, borderRadius: '14px', padding: '18px 22px', textAlign: 'center', minWidth: '130px' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: darkMode ? '#60A5FA' : '#1D4ED8', letterSpacing: '-1px', lineHeight: 1, marginBottom: '4px' }}>
                  {currentOffice.officeNo}
                </div>
                <div style={{ fontSize: '11px', color: t.sub, fontWeight: 700, marginBottom: '2px' }}>Current Office</div>
                <div style={{ fontSize: '11px', color: t.muted, fontWeight: 600 }}>{currentOffice.building}, Floor {currentOffice.floor}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
          {statData.map((s, i) => {
            const c = t.statCards[i];
            return (
              <div key={i} style={{ background: c.bg, border: c.border || 'none', borderRadius: '16px', padding: '20px 22px', position: 'relative', overflow: 'hidden', boxShadow: darkMode ? 'none' : '0 2px 10px rgba(15,60,120,0.06)' }}>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: .13, display: 'flex' }}>{statIcons[i]}</div>
                <div style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '4px', color: c.numColor }}>{s.value}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: c.lblColor }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* ── Tabs ── */}
        <div style={{ ...card, overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: `1.5px solid ${t.border}`, padding: '0 8px', background: t.surface2 }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '15px 16px 13px',
                    fontSize: '13px', fontFamily: 'inherit', fontWeight: 800,
                    color: isActive ? t.tabActiveColor : t.sub,
                    borderBottom: isActive ? `2.5px solid ${t.tabActiveBorder}` : '2.5px solid transparent',
                    marginBottom: '-1.5px',
                    transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: '7px',
                  }}
                >
                  {tab.label}
                  <span style={{
                    fontSize: '10.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '22px',
                    background: isActive ? t.tabCountActiveBg : (darkMode ? 'rgba(255,255,255,0.06)' : '#EEF4FB'),
                    color: isActive ? t.tabActiveColor : t.sub,
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Office History tab ── */}
          {activeTab === 'history' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: t.surface2 }}>
                    {['Office', 'Building', 'Floor', 'Start', 'End', 'Duration', 'Occupancy'].map((h, i) => (
                      <th key={i} style={{ textAlign: 'left', fontSize: '10.5px', fontWeight: 800, color: t.thColor, textTransform: 'uppercase', letterSpacing: '1px', padding: '11px 20px', borderBottom: `1.5px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: t.sub, fontSize: '14px' }}>Loading...</td></tr>
                  ) : officeHistory.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: t.sub, fontSize: '14px' }}>No office history found.</td></tr>
                  ) : officeHistory.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: i < officeHistory.length - 1 ? `1px solid ${t.rowBorder}` : 'none', background: hoveredRow === `h-${row.id}` ? t.rowHover : 'transparent', transition: 'background .12s' }}
                      onMouseEnter={() => setHoveredRow(`h-${row.id}`)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ background: t.officeChipBg, color: t.officeChipColor, fontSize: '12px', fontWeight: 800, padding: '4px 11px', borderRadius: '8px', display: 'inline-block', letterSpacing: '-.2px' }}>{row.officeNo}</span>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: t.text, fontWeight: 700 }}>{row.building}</td>
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: t.sub, fontWeight: 600 }}>Floor {row.floor}</td>
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: t.sub, fontWeight: 600 }}>{row.start}</td>
                      <td style={{ padding: '13px 20px' }}>
                        {row.end
                          ? <span style={{ fontSize: '13px', color: t.sub, fontWeight: 600 }}>{row.end}</span>
                          : <span style={{ background: '#ECFDF5', color: '#059669', border: '1.5px solid #6EE7B7', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '22px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', display: 'inline-block', flexShrink: 0 }}/>Active
                            </span>
                        }
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: t.muted, background: darkMode ? 'rgba(255,255,255,0.05)' : '#EEF4FB', padding: '4px 10px', borderRadius: '7px', display: 'inline-block' }}>{row.duration}</span>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{ width: '52px', height: '5px', background: t.occTrack, borderRadius: '3px', overflow: 'hidden', flexShrink: 0 }}>
                            <div style={{ height: '100%', width: `${Math.min((row.occupants / row.capacity) * 100, 100)}%`, background: '#3B82F6', borderRadius: '3px' }}/>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: t.sub, whiteSpace: 'nowrap' }}>{row.occupants}/{row.capacity}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Equipment Requests tab ── */}
          {activeTab === 'equipment' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: t.surface2 }}>
                    {['Equipment', 'Type', 'Office', 'Requested On', 'Status'].map((h, i) => (
                      <th key={i} style={{ textAlign: 'left', fontSize: '10.5px', fontWeight: 800, color: t.thColor, textTransform: 'uppercase', letterSpacing: '1px', padding: '11px 20px', borderBottom: `1.5px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: t.sub, fontSize: '14px' }}>Loading...</td></tr>
                  ) : equipmentRequests.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: t.sub, fontSize: '14px' }}>No equipment requests found.</td></tr>
                  ) : equipmentRequests.map((req, i) => {
                    const st = REQUEST_STATUS[req.status];
                    return (
                      <tr
                        key={req.id}
                        style={{ borderBottom: i < equipmentRequests.length - 1 ? `1px solid ${t.rowBorder}` : 'none', background: hoveredRow === `e-${req.id}` ? t.rowHover : 'transparent', transition: 'background .12s' }}
                        onMouseEnter={() => setHoveredRow(`e-${req.id}`)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td style={{ padding: '13px 20px', fontSize: '13px', fontWeight: 700, color: t.text }}>{req.name}</td>
                        <td style={{ padding: '13px 20px' }}>
                          <span style={{ background: t.typeBg, color: t.typeColor, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '7px', display: 'inline-block' }}>{req.type}</span>
                        </td>
                        <td style={{ padding: '13px 20px' }}>
                          <span style={{ background: t.officeChipBg, color: t.officeChipColor, fontSize: '12px', fontWeight: 800, padding: '4px 11px', borderRadius: '8px', display: 'inline-block', letterSpacing: '-.2px' }}>{req.officeNo}</span>
                        </td>
                        <td style={{ padding: '13px 20px', fontSize: '13px', color: t.sub, fontWeight: 600 }}>{req.requestedOn}</td>
                        <td style={{ padding: '13px 20px' }}>
                          <span style={{ background: st.bg, color: st.color, border: `1.5px solid ${st.border}`, fontSize: '11px', fontWeight: 800, padding: '5px 11px', borderRadius: '22px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: st.dot, display: 'inline-block', flexShrink: 0 }}/>
                            {st.label}
                          </span>
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
    </Layout>
  );
}