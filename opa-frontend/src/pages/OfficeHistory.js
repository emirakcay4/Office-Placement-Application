import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';
import { useParams } from 'react-router-dom';
import client from '../api/client';

const ChevronIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const getInitials = name => name.split(' ').filter(w => w.startsWith('Dr.') || w.startsWith('Prof.') ? false : true).slice(0, 2).map(w => w[0]).join('');

const AVATAR_COLORS = ['#2563EB', '#059669', '#7C3AED', '#B45309', '#0891B2', '#DC2626'];

export default function OfficeHistory() {
  const { darkMode } = useDarkMode();
  const { id } = useParams(); // Office ID if navigated from Offices.js
  
  const [search, setSearch]       = useState('');
  const [fDept, setFDept]         = useState('');
  const [fBuilding, setFBuilding] = useState('');
  const [fStatus, setFStatus]     = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [assignRes, officesRes] = await Promise.all([
          client.get('/assignments/'),
          client.get('/offices/')
        ]);
        
        const assignData = assignRes.data.results || assignRes.data;
        const offData = officesRes.data.results || officesRes.data;
        
        const offMap = {};
        offData.forEach(o => { offMap[o.id] = o; });
        
        let mapped = assignData.map(a => {
          const o = offMap[a.office] || {};
          const s = a.staff || {};
          
          // Calculate roughly duration
          const stDate = new Date(a.start_date);
          const enDate = a.end_date ? new Date(a.end_date) : new Date();
          const diffTime = Math.abs(enDate - stDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const years = Math.floor(diffDays / 365);
          const months = Math.floor((diffDays % 365) / 30);
          const duration = `${years > 0 ? years + 'y ' : ''}${months}m`;

          return {
            id: a.id,
            officeId: a.office,
            officeNo: o.room_number || `Office ${a.office}`,
            building: o.building_name || `Building ${o.building}`,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown Staff',
            dept: s.department ? s.department.name : 'Unknown',
            start: a.start_date,
            end: a.end_date || null,
            duration: duration
          };
        });
        
        if (id) {
          mapped = mapped.filter(m => m.officeId === parseInt(id));
        }
        
        setHistory(mapped);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [id]);

  const t = darkMode ? {
    filterBg:     '#0D2640',
    filterBorder: 'rgba(255,255,255,0.08)',
    inputBg:      '#0A1E36',
    inputBorder:  'rgba(255,255,255,0.1)',
    inputColor:   '#C8DCF0',
    inputPlaceholder: 'rgba(255,255,255,0.28)',
    tableBg:      '#0D2640',
    tableBorder:  'rgba(255,255,255,0.07)',
    tableTopBg:   'rgba(255,255,255,0.03)',
    rowHover:     'rgba(255,255,255,0.03)',
    rowBorder:    'rgba(255,255,255,0.05)',
    title:        '#E8F4FF',
    eyebrow:      '#4A7FAA',
    text:         '#C8DCF0',
    sub:          '#4A7FAA',
    muted:        '#2A4A6A',
    thColor:      'rgba(255,255,255,0.28)',
    officeChipBg: 'rgba(59,130,246,0.15)',
    officeChipColor: '#60A5FA',
    deptBg:       'rgba(255,255,255,0.06)',
    deptColor:    'rgba(255,255,255,0.38)',
    avatarBorder: 'rgba(255,255,255,0.08)',
    kpiCards: [
      { bg: 'linear-gradient(135deg,#4F46E5,#6366F1)', numColor: '#fff',    lblColor: 'rgba(255,255,255,0.65)', border: 'none' },
      { bg: '#0D2640', numColor: '#34D399', lblColor: '#065F46',            border: '1.5px solid rgba(52,211,153,0.2)' },
      { bg: '#0D2640', numColor: '#60A5FA', lblColor: '#1E3A8A',            border: '1.5px solid rgba(96,165,250,0.2)' },
    ],
    footerBg:     'rgba(255,255,255,0.03)',
  } : {
    filterBg:     '#EEF4FB',
    filterBorder: '#C2D8EF',
    inputBg:      '#fff',
    inputBorder:  '#C2D8EF',
    inputColor:   '#0D2D52',
    inputPlaceholder: '#8AAAC8',
    tableBg:      '#fff',
    tableBorder:  '#C2D8EF',
    tableTopBg:   '#F5F9FF',
    rowHover:     '#F5F9FF',
    rowBorder:    '#EEF4FB',
    title:        '#0D2D52',
    eyebrow:      '#5A87B8',
    text:         '#1E4A7A',
    sub:          '#7AAAD0',
    muted:        '#A8C0D8',
    thColor:      '#7AAAD0',
    officeChipBg: '#DBEAFE',
    officeChipColor: '#1D4ED8',
    deptBg:       '#EEF4FB',
    deptColor:    '#5A87B8',
    avatarBorder: '#E2EDF9',
    kpiCards: [
      { bg: 'linear-gradient(135deg,#4F46E5,#6366F1)', numColor: '#fff',    lblColor: 'rgba(255,255,255,0.65)', border: 'none' },
      { bg: '#fff', numColor: '#059669', lblColor: '#6EE7B7',               border: '1.5px solid #C2D8EF' },
      { bg: '#fff', numColor: '#1D4ED8', lblColor: '#93C5FD',               border: '1.5px solid #C2D8EF' },
    ],
    footerBg:     '#F5F9FF',
  };

  const depts     = [...new Set(history.map(h => h.dept))].filter(Boolean);
  const buildings = [...new Set(history.map(h => h.building))].filter(Boolean);
  const stats = {
    total:  history.length,
    active: history.filter(h => !h.end).length,
    past:   history.filter(h => !!h.end).length,
  };

  const filtered = history.filter(h => {
    const q = search.toLowerCase();
    return (
      (h.name.toLowerCase().includes(q) || h.officeNo.toLowerCase().includes(q) || h.dept.toLowerCase().includes(q)) &&
      (!fDept     || h.dept     === fDept)     &&
      (!fBuilding || h.building === fBuilding) &&
      (fStatus === 'active' ? !h.end : fStatus === 'past' ? !!h.end : true)
    );
  });

  const hasFilter = search || fDept || fBuilding || fStatus;
  const clearAll  = () => { setSearch(''); setFDept(''); setFBuilding(''); setFStatus(''); };

  const inputBase = {
    borderRadius: '10px',
    border: `1.5px solid ${t.inputBorder}`,
    backgroundColor: t.inputBg,
    color: t.inputColor,
    fontFamily: "'Nunito', 'Sora', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    outline: 'none',
    transition: 'border-color .2s',
  };

  const kpiData = [
    { label: 'Total Records',      value: stats.total  },
    { label: 'Active Assignments', value: stats.active },
    { label: 'Past Assignments',   value: stats.past   },
  ];

  const kpiIcons = [
    <svg key={0} width="44" height="44" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="10" height="14" rx="1.5" stroke="white" strokeWidth="1.4"/><path d="M5 5h4M5 8h4M5 11h2" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    <svg key={1} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    <svg key={2} width="44" height="44" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#3B82F6" strokeWidth="1.4"/><path d="M8 5v4l2.5 2" stroke="#3B82F6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ];

  return (
    <Layout>
      <div style={{ fontFamily: "'Nunito', 'Sora', sans-serif", display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: t.eyebrow, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '5px' }}>Records</div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: t.title, letterSpacing: '-1px', lineHeight: 1, margin: 0 }}>Office History</h1>
          </div>
          {/* Quick filter chips */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'active', label: `${stats.active} Active`,  dot: '#10B981', color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' },
              { key: 'past',   label: `${stats.past} Past`,      dot: '#3B82F6', color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' },
            ].map(chip => (
              <button
                key={chip.key}
                onClick={() => setFStatus(fStatus === chip.key ? '' : chip.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 13px', borderRadius: '22px',
                  fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  color: chip.color, backgroundColor: chip.bg,
                  border: `1.5px solid ${fStatus === chip.key ? chip.dot : chip.border}`,
                  boxShadow: fStatus === chip.key ? `0 0 0 3px ${chip.bg}` : 'none',
                  transition: 'all .15s',
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: chip.dot, display: 'inline-block', flexShrink: 0 }} />
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
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

        {/* ── Filter bar ── */}
        <div style={{ background: t.filterBg, border: `1.5px solid ${t.filterBorder}`, borderRadius: '14px', padding: '13px 15px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '11px', color: t.inputPlaceholder, display: 'flex', pointerEvents: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, office or department…"
              style={{ ...inputBase, width: '100%', padding: '9px 11px 9px 34px' }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = t.inputBorder}
            />
          </div>

          {[
            { val: fBuilding, set: setFBuilding, opts: buildings, label: 'Building'   },
            { val: fDept,     set: setFDept,     opts: depts,     label: 'Department' },
          ].map((f, i) => (
            <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={f.val}
                onChange={e => f.set(e.target.value)}
                style={{ ...inputBase, padding: '9px 28px 9px 11px', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
                onFocus={e => e.target.style.borderColor = '#3B82F6'}
                onBlur={e => e.target.style.borderColor = t.inputBorder}
              >
                <option value="">All {f.label}s</option>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
              <span style={{ position: 'absolute', right: '9px', color: t.inputPlaceholder, pointerEvents: 'none', display: 'flex' }}><ChevronIcon color={t.inputPlaceholder}/></span>
            </div>
          ))}

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={fStatus}
              onChange={e => setFStatus(e.target.value)}
              style={{ ...inputBase, padding: '9px 28px 9px 11px', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = t.inputBorder}
            >
              <option value="">All Records</option>
              <option value="active">Active Only</option>
              <option value="past">Past Only</option>
            </select>
            <span style={{ position: 'absolute', right: '9px', color: t.inputPlaceholder, pointerEvents: 'none', display: 'flex' }}><ChevronIcon color={t.inputPlaceholder}/></span>
          </div>

          {hasFilter && (
            <button
              onClick={clearAll}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 13px', borderRadius: '10px', border: '1.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#DC2626', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round"/></svg>
              Clear
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div style={{ background: t.tableBg, border: `1.5px solid ${t.tableBorder}`, borderRadius: '16px', overflow: 'hidden', boxShadow: darkMode ? 'none' : '0 2px 12px rgba(15,60,120,0.07)' }}>
          <div style={{ padding: '14px 22px', borderBottom: `1.5px solid ${t.tableBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.tableTopBg }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: t.title }}>
              {filtered.length}{' '}
              <span style={{ fontWeight: 600, color: t.sub }}>of {history.length} records</span>
            </span>
            {hasFilter && (
              <span style={{ fontSize: '11px', color: t.eyebrow, background: darkMode ? 'rgba(255,255,255,0.05)' : '#E8F0FA', border: `1px solid ${t.filterBorder}`, borderRadius: '6px', padding: '3px 9px', fontWeight: 700 }}>
                Filtered
              </span>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: t.tableTopBg }}>
                  {['Office', 'Building', 'Faculty', 'Department', 'Start', 'End', 'Duration'].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', fontSize: '10.5px', fontWeight: 800, color: t.thColor, textTransform: 'uppercase', letterSpacing: '1px', padding: '11px 20px', borderBottom: `1.5px solid ${t.tableBorder}`, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '56px', color: t.sub, fontSize: '14px' }}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '56px', color: t.sub, fontSize: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="16" cy="16" r="10" stroke={t.thColor} strokeWidth="1.5"/><path d="M24 24l8 8" stroke={t.thColor} strokeWidth="1.5" strokeLinecap="round"/></svg>
                        <span>No records found.</span>
                        <button onClick={clearAll} style={{ color: '#2563EB', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Clear filters</button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((row, i) => {
                  const avatarColor = AVATAR_COLORS[row.id % AVATAR_COLORS.length];
                  const initials    = getInitials(row.name);
                  return (
                    <tr
                      key={row.id}
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${t.rowBorder}` : 'none', background: hoveredRow === row.id ? t.rowHover : 'transparent', transition: 'background .12s' }}
                      onMouseEnter={() => setHoveredRow(row.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {/* Office badge */}
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ background: t.officeChipBg, color: t.officeChipColor, fontSize: '12px', fontWeight: 800, padding: '4px 11px', borderRadius: '8px', display: 'inline-block', letterSpacing: '-.2px' }}>
                          {row.officeNo}
                        </span>
                      </td>

                      {/* Building */}
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: t.text, fontWeight: 700 }}>{row.building}</td>

                      {/* Faculty — with avatar */}
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `${avatarColor}20`, border: `1.5px solid ${avatarColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: avatarColor }}>{initials}</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: t.text, whiteSpace: 'nowrap' }}>{row.name}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ background: t.deptBg, color: t.deptColor, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '7px', display: 'inline-block' }}>
                          {row.dept}
                        </span>
                      </td>

                      {/* Start */}
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: t.sub, fontWeight: 600 }}>{row.start}</td>

                      {/* End */}
                      <td style={{ padding: '13px 20px' }}>
                        {row.end
                          ? <span style={{ fontSize: '13px', color: t.sub, fontWeight: 600 }}>{row.end}</span>
                          : <span style={{ background: '#ECFDF5', color: '#059669', border: '1.5px solid #6EE7B7', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '22px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', display: 'inline-block', flexShrink: 0 }} />
                              Active
                            </span>
                        }
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: t.muted, background: darkMode ? 'rgba(255,255,255,0.05)' : '#EEF4FB', padding: '4px 10px', borderRadius: '7px', display: 'inline-block' }}>
                          {row.duration}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 22px', borderTop: `1.5px solid ${t.tableBorder}`, background: t.footerBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: t.sub, fontWeight: 700 }}>
              Showing {filtered.length} of {history.length} records
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: t.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                {stats.active} active
              </span>
              <span style={{ fontSize: '11px', color: t.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} />
                {stats.past} past
              </span>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}