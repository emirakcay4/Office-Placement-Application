import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';
import client from '../api/client';

const STATUS = {
  active:      { label: 'Active',      color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', dot: '#10B981' },
  maintenance: { label: 'Maintenance', color: '#B45309', bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B' },
  retired:     { label: 'Retired',     color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', dot: '#EF4444' },
};

const TypeIcon = ({ type, color }) => {
  const icons = {
    Computer: <path d="M2 5h12a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1V6a1 1 0 011-1zm2 2h1m2 0h1m2 0h1m-6 2h6" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>,
    Printer:  <><rect x="2" y="5" width="12" height="7" rx="1" stroke={color} strokeWidth="1.4"/><path d="M5 5V3h6v2M5 12v1h6v-1" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    Phone:    <><path d="M3 9V8a5 5 0 0110 0v1" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><rect x="2" y="9" width="2.5" height="4" rx="1" stroke={color} strokeWidth="1.4"/><rect x="11.5" y="9" width="2.5" height="4" rx="1" stroke={color} strokeWidth="1.4"/></>,
    Projector:<><rect x="5" y="2" width="6" height="10" rx="3" stroke={color} strokeWidth="1.4"/><path d="M8 2v4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    Monitor:  <><rect x="1" y="2" width="14" height="10" rx="1.5" stroke={color} strokeWidth="1.4"/><path d="M5 14h6M8 12v2" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    Other:    <><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.4"/><path d="M8 5v4l2 2" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
  };
  // normalize type case for matching
  const iconKey = Object.keys(icons).find(k => k.toLowerCase() === (type || '').toLowerCase());
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      {iconKey ? icons[iconKey] : icons.Other}
    </svg>
  );
};

const ChevronIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Equipment() {
  const { darkMode } = useDarkMode();
  const [search, setSearch]     = useState('');
  const [fType, setFType]       = useState('');
  const [fStatus, setFStatus]   = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const [eqRes, offRes] = await Promise.all([
          client.get('/equipment/'),
          client.get('/offices/')
        ]);
        
        const eqData = eqRes.data.results || eqRes.data;
        const offData = offRes.data.results || offRes.data;
        
        // Map office IDs to room numbers
        const officeMap = {};
        offData.forEach(o => {
          officeMap[o.id] = o.room_number;
        });
        
        const mapped = eqData.map(e => ({
          id: e.id,
          name: e.serial_number, // using serial number as name
          type: e.asset_type,
          officeNo: e.office ? officeMap[e.office] || `Office ${e.office}` : '',
          assignedTo: '', // ITEquipment does not track staff assignment
          status: e.status
        }));
        
        setEquipment(mapped);
      } catch (err) {
        console.error("Failed to fetch equipment:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEquipment();
  }, []);

  const t = darkMode ? {
    pageBg:       '#071E34',
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
    eqNameColor:  '#C8DCF0',
    officeChipBg: 'rgba(59,130,246,0.15)',
    officeChipColor:'#60A5FA',
    typeBg:       'rgba(255,255,255,0.06)',
    typeColor:    'rgba(255,255,255,0.4)',
    kpiCards: [
      { bg: 'linear-gradient(135deg,#4F46E5,#6366F1)', numColor: '#fff',    lblColor: 'rgba(255,255,255,0.65)', border: 'none' },
      { bg: '#0D2640', numColor: '#34D399', lblColor: '#065F46',            border: '1.5px solid rgba(52,211,153,0.2)' },
      { bg: '#0D2640', numColor: '#60A5FA', lblColor: '#1E3A8A',            border: '1.5px solid rgba(96,165,250,0.2)' },
    ],
    reqBtnBg:     '#2563EB',
    reqBtnHover:  '#1D4ED8',
    disabledBg:   'rgba(255,255,255,0.05)',
    disabledColor:'rgba(255,255,255,0.25)',
  } : {
    pageBg:       '#DCE9F5',
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
    eqNameColor:  '#0D2D52',
    officeChipBg: '#DBEAFE',
    officeChipColor:'#1D4ED8',
    typeBg:       '#EEF4FB',
    typeColor:    '#5A87B8',
    kpiCards: [
      { bg: 'linear-gradient(135deg,#4F46E5,#6366F1)', numColor: '#fff',    lblColor: 'rgba(255,255,255,0.65)', border: 'none' },
      { bg: '#fff', numColor: '#059669', lblColor: '#6EE7B7',               border: '1.5px solid #C2D8EF' },
      { bg: '#fff', numColor: '#1D4ED8', lblColor: '#93C5FD',               border: '1.5px solid #C2D8EF' },
    ],
    reqBtnBg:     '#2563EB',
    reqBtnHover:  '#1D4ED8',
    disabledBg:   '#EEF4FB',
    disabledColor:'#A8C0D8',
  };

  const types   = [...new Set(equipment.map(e => e.type))];
  const statCounts = {
    total:       equipment.length,
    active:      equipment.filter(e => e.status === 'active').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
  };

  const filtered = equipment.filter(e => {
    const q = search.toLowerCase();
    return (
      (e.name.toLowerCase().includes(q) || e.officeNo.toLowerCase().includes(q) || e.assignedTo.toLowerCase().includes(q)) &&
      (!fType   || e.type   === fType)   &&
      (!fStatus || e.status === fStatus)
    );
  });

  const hasFilter = search || fType || fStatus;
  const clearAll  = () => { setSearch(''); setFType(''); setFStatus(''); };

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
    { label: 'Total Items', value: statCounts.total,       iconColor: '#fff' },
    { label: 'Active',      value: statCounts.active,      iconColor: '#10B981' },
    { label: 'Maintenance', value: statCounts.maintenance, iconColor: '#3B82F6' },
  ];

  const kpiIcons = [
    <svg key={0} width="44" height="44" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="10" rx="1.5" stroke="white" strokeWidth="1.5"/><path d="M4 12v2M8 12v2M12 12v2M3 14h10" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>,
    <svg key={1} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    <svg key={2} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M8 1a4 4 0 100 8A4 4 0 008 1zM2 14c0-2.5 2.7-4 6-4s6 1.5 6 4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  ];

  return (
    <Layout>
      <div style={{ fontFamily: "'Nunito', 'Sora', sans-serif", display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: t.eyebrow, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '5px' }}>Inventory</div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: t.title, letterSpacing: '-1px', lineHeight: 1, margin: 0 }}>Equipment</h1>
          </div>
          {/* Quick status chips */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'active',      label: `${statCounts.active} Active`,           dot: '#10B981', color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' },
              { key: 'maintenance', label: `${statCounts.maintenance} Maintenance`, dot: '#F59E0B', color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
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
          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '11px', color: t.inputPlaceholder, display: 'flex', pointerEvents: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, office or person…"
              style={{ ...inputBase, width: '100%', padding: '9px 11px 9px 34px' }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = t.inputBorder}
            />
          </div>

          {/* Type dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={fType}
              onChange={e => setFType(e.target.value)}
              style={{ ...inputBase, padding: '9px 28px 9px 11px', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = t.inputBorder}
            >
              <option value="">All Types</option>
              {types.map(tp => <option key={tp}>{tp}</option>)}
            </select>
            <span style={{ position: 'absolute', right: '9px', color: t.inputPlaceholder, pointerEvents: 'none', display: 'flex' }}><ChevronIcon color={t.inputPlaceholder} /></span>
          </div>

          {/* Status dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={fStatus}
              onChange={e => setFStatus(e.target.value)}
              style={{ ...inputBase, padding: '9px 28px 9px 11px', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = t.inputBorder}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
            <span style={{ position: 'absolute', right: '9px', color: t.inputPlaceholder, pointerEvents: 'none', display: 'flex' }}><ChevronIcon color={t.inputPlaceholder} /></span>
          </div>

          {/* Clear */}
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
          {/* Topbar */}
          <div style={{ padding: '14px 22px', borderBottom: `1.5px solid ${t.tableBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.tableTopBg }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: t.title }}>
              {filtered.length}{' '}
              <span style={{ fontWeight: 600, color: t.sub }}>of {equipment.length} items</span>
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
                  {['Equipment', 'Type', 'Office', 'Assigned To', 'Status', 'Action'].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', fontSize: '10.5px', fontWeight: 800, color: t.thColor, textTransform: 'uppercase', letterSpacing: '1px', padding: '11px 20px', borderBottom: `1.5px solid ${t.tableBorder}`, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '56px', color: t.sub, fontSize: '14px' }}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '56px', color: t.sub, fontSize: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="16" cy="16" r="10" stroke={t.thColor} strokeWidth="1.5"/><path d="M24 24l8 8" stroke={t.thColor} strokeWidth="1.5" strokeLinecap="round"/></svg>
                        <span>No equipment found.</span>
                        <button onClick={clearAll} style={{ color: '#2563EB', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Clear filters</button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((e, i) => {
                  const curStatus = e.status;
                  const st = STATUS[curStatus] || STATUS.active;
                  return (
                    <tr
                      key={e.id}
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${t.rowBorder}` : 'none', background: hoveredRow === e.id ? t.rowHover : 'transparent', transition: 'background .12s' }}
                      onMouseEnter={() => setHoveredRow(e.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {/* Name */}
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: darkMode ? 'rgba(255,255,255,0.06)' : '#EEF4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <TypeIcon type={e.type} color={t.sub} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: t.eqNameColor }}>{e.name}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ background: t.typeBg, color: t.typeColor, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '7px', display: 'inline-block' }}>
                          {e.type}
                        </span>
                      </td>

                      {/* Office */}
                      <td style={{ padding: '13px 20px' }}>
                        {e.officeNo
                          ? <span style={{ background: t.officeChipBg, color: t.officeChipColor, fontSize: '12px', fontWeight: 800, padding: '4px 11px', borderRadius: '8px', display: 'inline-block', letterSpacing: '-.2px' }}>{e.officeNo}</span>
                          : <span style={{ color: t.muted, fontSize: '14px', fontWeight: 700 }}>—</span>
                        }
                      </td>

                      {/* Assigned To */}
                      <td style={{ padding: '13px 20px', fontSize: '13px', fontWeight: e.assignedTo ? 600 : 400, color: e.assignedTo ? t.text : t.muted }}>
                        {e.assignedTo || '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ background: st.bg, color: st.color, border: `1.5px solid ${st.border}`, fontSize: '11px', fontWeight: 800, padding: '5px 11px', borderRadius: '22px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: st.dot, display: 'inline-block', flexShrink: 0 }} />
                          {st.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '9px', background: t.disabledBg, color: t.disabledColor, fontSize: '12px', fontWeight: 700 }}>
                          Manage
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}