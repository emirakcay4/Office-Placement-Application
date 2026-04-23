import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const STATUS = {
  available:    { label: 'Available',     color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', dot: '#10B981', barColor: '#10B981' },
  occupied:     { label: 'Occupied',      color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD', dot: '#3B82F6', barColor: '#6366F1' },
  overcapacity: { label: 'Over Capacity', color: '#B45309', bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B', barColor: '#F59E0B' },
};

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6h7m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Offices() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [search, setSearch]       = useState('');
  const [fBuilding, setFBuilding] = useState('');
  const [fFloor, setFFloor]       = useState('');
  const [fType, setFType]         = useState('');
  const [fStatus, setFStatus]     = useState('');
  const [hoveredRow, setHoveredRow]   = useState(null);
  const [hoveredBtn, setHoveredBtn]   = useState(null);
  
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOffices = async () => {
    setLoading(true);
    try {
      // Build query string based on backend support
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      // Wait, we can fetch all and filter in frontend to get dynamic options for dropdowns, 
      // or we can fetch filtered data. Since it's a dashboard, fetching all and filtering locally 
      // is similar to what was done with mock data. Let's do that for the dropdowns.
      const res = await client.get('/offices/search/');
      const data = res.data.results || res.data;
      
      const mapped = data.map(o => {
        let st = 'available';
        if (o.current_occupants_count > o.capacity) st = 'overcapacity';
        else if (o.current_occupants_count === o.capacity) st = 'occupied';
        return {
          id: o.id,
          officeNo: o.room_number,
          building: o.building_name,
          floor: o.floor.toString(),
          occupants: o.current_occupants_count,
          capacity: o.capacity,
          type: o.office_type || 'single',
          status: st
        };
      });
      setOffices(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  // ── dark / light tokens ──────────────────────────────────────────────────
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
    tableRowHover:'rgba(255,255,255,0.03)',
    rowBorder:    'rgba(255,255,255,0.05)',
    title:        '#E8F4FF',
    eyebrow:      '#4A7FAA',
    countMain:    '#C8DCF0',
    countSub:     'rgba(255,255,255,0.3)',
    building:     '#C8DCF0',
    floor:        'rgba(255,255,255,0.35)',
    thColor:      'rgba(255,255,255,0.28)',
    badgeNoBg:    'rgba(59,130,246,0.15)',
    badgeNoColor: '#60A5FA',
    badgeDeptBg:  'rgba(255,255,255,0.06)',
    badgeDeptColor:'rgba(255,255,255,0.4)',
    occTrack:     'rgba(255,255,255,0.08)',
    occNum:       'rgba(255,255,255,0.3)',
    kpiCards: [
      { bg: 'linear-gradient(135deg,#1D4ED8,#2563EB)', numColor: '#fff',     lblColor: 'rgba(255,255,255,0.6)', border: 'none' },
      { bg: '#0D2640', numColor: '#34D399', lblColor: '#065F46',             border: '1.5px solid rgba(52,211,153,0.2)' },
      { bg: '#0D2640', numColor: '#818CF8', lblColor: '#3730A3',             border: '1.5px solid rgba(129,140,248,0.2)' },
      { bg: '#0D2640', numColor: '#FBBF24', lblColor: '#78350F',             border: '1.5px solid rgba(251,191,36,0.2)' },
    ],
    viewBtnBg:    'rgba(59,130,246,0.12)',
    viewBtnColor: '#60A5FA',
    viewBtnBorder:'rgba(59,130,246,0.25)',
    viewBtnHoverBg:'#3B82F6',
    chipGreen:  { color:'#34D399', bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.25)' },
    chipBlue:   { color:'#60A5FA', bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.25)' },
    chipAmber:  { color:'#FBBF24', bg:'rgba(251,191,36,0.1)', border:'rgba(251,191,36,0.25)' },
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
    tableRowHover:'#F5F9FF',
    rowBorder:    '#EEF4FB',
    title:        '#0D2D52',
    eyebrow:      '#5A87B8',
    countMain:    '#0D2D52',
    countSub:     '#8AAAC8',
    building:     '#0D2D52',
    floor:        '#8AAAC8',
    thColor:      '#7AAAD0',
    badgeNoBg:    '#DBEAFE',
    badgeNoColor: '#1D4ED8',
    badgeDeptBg:  '#EEF4FB',
    badgeDeptColor:'#5A87B8',
    occTrack:     '#E2EDF9',
    occNum:       '#8AAAC8',
    kpiCards: [
      { bg: 'linear-gradient(135deg,#1D4ED8,#2563EB)', numColor: '#fff',    lblColor: 'rgba(255,255,255,0.65)', border: 'none' },
      { bg: '#fff', numColor: '#059669', lblColor: '#6EE7B7',               border: '1.5px solid #C2D8EF' },
      { bg: '#fff', numColor: '#4F46E5', lblColor: '#A5B4FC',               border: '1.5px solid #C2D8EF' },
      { bg: '#fff', numColor: '#D97706', lblColor: '#FCD34D',               border: '1.5px solid #C2D8EF' },
    ],
    viewBtnBg:    '#EFF6FF',
    viewBtnColor: '#2563EB',
    viewBtnBorder:'#BFDBFE',
    viewBtnHoverBg:'#2563EB',
    chipGreen:  { color:'#059669', bg:'#ECFDF5', border:'#6EE7B7' },
    chipBlue:   { color:'#1D4ED8', bg:'#EFF6FF', border:'#93C5FD' },
    chipAmber:  { color:'#B45309', bg:'#FFFBEB', border:'#FCD34D' },
  };

  // ── derived data ──────────────────────────────────────────────────────────
  const filtered = offices.filter(o => {
    const q = search.toLowerCase();
    return (
      (o.officeNo.toLowerCase().includes(q) || o.type.toLowerCase().includes(q) || o.building.toLowerCase().includes(q)) &&
      (!fBuilding || o.building === fBuilding) &&
      (!fFloor    || o.floor    === fFloor)    &&
      (!fType     || o.type     === fType)     &&
      (!fStatus   || o.status   === fStatus)
    );
  });

  const buildings = [...new Set(offices.map(o => o.building))].filter(Boolean);
  const floors    = [...new Set(offices.map(o => o.floor))].filter(Boolean);
  const types     = [...new Set(offices.map(o => o.type))].filter(Boolean);
  const hasFilter = search || fBuilding || fFloor || fType || fStatus;
  const clearAll  = () => { setSearch(''); setFBuilding(''); setFFloor(''); setFType(''); setFStatus(''); };

  const counts = {
    available:    offices.filter(o => o.status === 'available').length,
    occupied:     offices.filter(o => o.status === 'occupied').length,
    overcapacity: offices.filter(o => o.status === 'overcapacity').length,
  };

  const kpiData = [
    { label: 'Total Offices', value: offices.length },
    { label: 'Available',     value: counts.available   },
    { label: 'Occupied',      value: counts.occupied    },
    { label: 'Over Capacity', value: counts.overcapacity},
  ];

  // ── shared style helpers ──────────────────────────────────────────────────
  const inputBase = {
    borderRadius: '10px',
    border: `1.5px solid ${t.inputBorder}`,
    backgroundColor: t.inputBg,
    color: t.inputColor,
    fontFamily: "'Nunito', 'Sora', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    outline: 'none',
  };

  return (
    <Layout>
      <div style={{
        fontFamily: "'Nunito', 'Sora', sans-serif",
        display: 'flex', flexDirection: 'column', gap: '22px',
      }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: t.eyebrow, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '5px' }}>
              Management
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: t.title, letterSpacing: '-1px', lineHeight: 1, margin: 0 }}>
              Offices
            </h1>
          </div>

          {/* Status chips */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'available',    dot: '#10B981', ...t.chipGreen, label: `${counts.available} Available`    },
              { key: 'occupied',     dot: '#3B82F6', ...t.chipBlue,  label: `${counts.occupied} Occupied`      },
              { key: 'overcapacity', dot: '#F59E0B', ...t.chipAmber, label: `${counts.overcapacity} Over Capacity` },
            ].map(chip => (
              <button
                key={chip.key}
                onClick={() => setFStatus(fStatus === chip.key ? '' : chip.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 13px', borderRadius: '22px',
                  fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  color: chip.color,
                  backgroundColor: fStatus === chip.key ? chip.bg : chip.bg,
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
          {kpiData.map((k, i) => {
            const c = t.kpiCards[i];
            const icons = [
              <svg key={0} width="44" height="44" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="white" strokeWidth="1.5"/><path d="M1 6h14" stroke="white" strokeWidth="1.5"/></svg>,
              <svg key={1} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
              <svg key={2} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M8 1a4 4 0 100 8A4 4 0 008 1zM2 14c0-2.5 2.7-4 6-4s6 1.5 6 4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"/></svg>,
              <svg key={3} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M8 2v6m0 3v1" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"/><circle cx="8" cy="8" r="6.5" stroke="#F59E0B" strokeWidth="1.4"/></svg>,
            ];
            return (
              <div key={i} style={{ background: c.bg, border: c.border || 'none', borderRadius: '16px', padding: '20px 22px', position: 'relative', overflow: 'hidden', boxShadow: darkMode ? 'none' : '0 2px 10px rgba(15,60,120,0.06)' }}>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: .15, display: 'flex' }}>{icons[i]}</div>
                <div style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '4px', color: c.numColor }}>{k.value}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: c.lblColor }}>{k.label}</div>
              </div>
            );
          })}
        </div>

        {/* ── Filter bar ── */}
        <div style={{ background: t.filterBg, border: `1.5px solid ${t.filterBorder}`, borderRadius: '14px', padding: '13px 15px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '180px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '11px', color: t.inputPlaceholder, display: 'flex', pointerEvents: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search office or type…"
              style={{ ...inputBase, width: '100%', padding: '9px 11px 9px 34px' }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = t.inputBorder}
            />
          </div>

          {/* Dropdowns */}
          {[
            { val: fBuilding, set: setFBuilding, opts: buildings, label: 'Building' },
            { val: fFloor,    set: setFFloor,    opts: floors,    label: 'Floor'    },
            { val: fType,     set: setFType,     opts: types,     label: 'Type'     },
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
              <span style={{ position: 'absolute', right: '9px', color: t.inputPlaceholder, pointerEvents: 'none', display: 'flex' }}><ChevronIcon /></span>
            </div>
          ))}

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
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="overcapacity">Over Capacity</option>
            </select>
            <span style={{ position: 'absolute', right: '9px', color: t.inputPlaceholder, pointerEvents: 'none', display: 'flex' }}><ChevronIcon /></span>
          </div>

          {/* Clear */}
          {hasFilter && (
            <button
              onClick={clearAll}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '9px 13px', borderRadius: '10px',
                border: '1.5px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.07)',
                color: '#DC2626', fontFamily: 'inherit',
                fontSize: '12px', fontWeight: 800, cursor: 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round"/></svg>
              Clear
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div style={{ background: t.tableBg, border: `1.5px solid ${t.tableBorder}`, borderRadius: '16px', overflow: 'hidden', boxShadow: darkMode ? 'none' : '0 2px 12px rgba(15,60,120,0.07)' }}>
          {/* Table topbar */}
          <div style={{ padding: '14px 22px', borderBottom: `1.5px solid ${t.tableBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.tableTopBg }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: t.countMain }}>
              {filtered.length}{' '}
              <span style={{ fontWeight: 600, color: t.countSub }}>of {offices.length} offices</span>
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
                  {['Office', 'Building', 'Floor', 'Type', 'Occupancy', 'Status', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', fontSize: '10.5px', fontWeight: 800, color: t.thColor, textTransform: 'uppercase', letterSpacing: '1px', padding: '11px 20px', borderBottom: `1.5px solid ${t.tableBorder}`, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '56px', color: t.countSub, fontSize: '14px' }}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '56px', color: t.countSub, fontSize: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="16" cy="16" r="10" stroke={t.thColor} strokeWidth="1.5"/><path d="M24 24l8 8" stroke={t.thColor} strokeWidth="1.5" strokeLinecap="round"/></svg>
                        <span>No offices match your filters.</span>
                        <button onClick={clearAll} style={{ color: '#3B82F6', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Clear filters</button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((o, i) => {
                  const st  = STATUS[o.status];
                  const pct = Math.min((o.occupants / o.capacity) * 100, 100);
                  return (
                    <tr
                      key={o.id}
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${t.rowBorder}` : 'none', background: hoveredRow === o.id ? t.tableRowHover : 'transparent', transition: 'background .12s' }}
                      onMouseEnter={() => setHoveredRow(o.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ background: t.badgeNoBg, color: t.badgeNoColor, fontSize: '12px', fontWeight: 800, padding: '4px 11px', borderRadius: '8px', display: 'inline-block', letterSpacing: '-.2px' }}>
                          {o.officeNo}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: t.building, fontWeight: 700 }}>{o.building}</td>
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: t.floor, fontWeight: 600 }}>Floor {o.floor}</td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ background: t.badgeDeptBg, color: t.badgeDeptColor, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '7px', display: 'inline-block' }}>
                          {o.type}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{ width: '60px', height: '5px', background: t.occTrack, borderRadius: '3px', overflow: 'hidden', flexShrink: 0 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: st.barColor, borderRadius: '3px', transition: 'width .3s' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: t.occNum, whiteSpace: 'nowrap' }}>{o.occupants}/{o.capacity}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ background: st.bg, color: st.color, border: `1.5px solid ${st.border}`, fontSize: '11px', fontWeight: 800, padding: '5px 11px', borderRadius: '22px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: st.dot, display: 'inline-block', flexShrink: 0 }} />
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <button
                          onClick={() => navigate(`/history/${o.id}`)}
                          onMouseEnter={() => setHoveredBtn(o.id)}
                          onMouseLeave={() => setHoveredBtn(null)}
                          style={{
                            background: hoveredBtn === o.id ? t.viewBtnHoverBg : t.viewBtnBg,
                            color: hoveredBtn === o.id ? '#fff' : t.viewBtnColor,
                            border: `1.5px solid ${hoveredBtn === o.id ? t.viewBtnHoverBg : t.viewBtnBorder}`,
                            borderRadius: '9px', padding: '6px 14px',
                            fontSize: '12px', fontFamily: 'inherit', fontWeight: 800,
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
                            transition: 'all .15s',
                          }}
                        >
                          View <ArrowIcon />
                        </button>
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