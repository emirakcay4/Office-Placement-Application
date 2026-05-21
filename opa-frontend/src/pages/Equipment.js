import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
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
      nextUrl = null;
    }
  }
  return results;
};

const STATUS_CONFIG = {
  active:      { label: 'Active',      color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', dot: '#10B981' },
  maintenance: { label: 'Maintenance', color: '#B45309', bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B' },
  retired:     { label: 'Retired',     color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', dot: '#EF4444' },
};

const getStatusStyles = (status, isDark) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  if (isDark) {
    if (status === 'approved' || status === 'active') {
      return { label: cfg.label, color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', dot: '#34D399' };
    } else if (status === 'rejected' || status === 'retired') {
      return { label: cfg.label, color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', dot: '#F87171' };
    } else { // pending or maintenance
      return { label: cfg.label, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', dot: '#FBBF24' };
    }
  }
  return cfg;
};

const getRequestStatusStyles = (status, isDark) => {
  if (status === 'approved') {
    return isDark 
      ? { label: 'Approved', color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', dot: '#34D399' }
      : { label: 'Approved', color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', dot: '#10B981' };
  } else if (status === 'rejected') {
    return isDark
      ? { label: 'Rejected', color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', dot: '#F87171' }
      : { label: 'Rejected', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', dot: '#EF4444' };
  } else {
    return isDark
      ? { label: 'Pending', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', dot: '#FBBF24' }
      : { label: 'Pending', color: '#B45309', bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B' };
  }
};

const TypeIcon = ({ type, color }) => {
  const icons = {
    computer: <path d="M2 5h12a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1V6a1 1 0 011-1zm2 2h1m2 0h1m2 0h1m-6 2h6" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>,
    printer:  <><rect x="2" y="5" width="12" height="7" rx="1" stroke={color} strokeWidth="1.4"/><path d="M5 5V3h6v2M5 12v1h6v-1" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    phone:    <><path d="M3 9V8a5 5 0 0110 0v1" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><rect x="2" y="9" width="2.5" height="4" rx="1" stroke={color} strokeWidth="1.4"/><rect x="11.5" y="9" width="2.5" height="4" rx="1" stroke={color} strokeWidth="1.4"/></>,
    projector:<><rect x="5" y="2" width="6" height="10" rx="3" stroke={color} strokeWidth="1.4"/><path d="M8 2v4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    monitor:  <><rect x="1" y="2" width="14" height="10" rx="1.5" stroke={color} strokeWidth="1.4"/><path d="M5 14h6M8 12v2" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    smartboard:<><rect x="1.5" y="2" width="13" height="9" rx="1" stroke={color} strokeWidth="1.4"/><path d="M4 14h8M6 11v3M10 11v3" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    chair:    <><path d="M4 3h8v6H4zM4 9v5M12 9v5M4 11h8" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    desk:     <><path d="M2 5h12v3H2zM3 8v6M13 8v6M6 8v3M10 8v3" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    other:    <><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.4"/><path d="M8 5v4l2 2" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
  };
  const iconKey = (type || '').toLowerCase();
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      {icons[iconKey] || icons.other}
    </svg>
  );
};

const ChevronIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 2.5v7M2.5 6h7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const MinusIcon = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6h7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CloseIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Equipment() {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();

  const role = user?.staff_profile?.system_role || 'faculty';
  const staffId = user?.staff_profile?.id;
  const isFaculty = role === 'faculty';
  const isDeptAdmin = role === 'department_admin';
  const isIT = role === 'it_department';
  const isRM = role === 'resource_manager';
  const isSysAdmin = role === 'system_admin';
  const isAdminOrStaff = isIT || isRM || isSysAdmin || isDeptAdmin;

  // Active Tab
  const [activeTab, setActiveTab] = useState(isAdminOrStaff ? 'console' : 'my-workspace');
  // Console Sub Tab
  const [consoleSubTab, setConsoleSubTab] = useState('requests');

  // Filters & State
  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  
  // Data States
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);
  const [offices, setOffices] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqOffice, setReqOffice] = useState('');
  const [reqAssetType, setReqAssetType] = useState('computer');
  const [reqQty, setReqQty] = useState(1);
  const [reqReason, setReqReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState('');

  // Admin Actions States
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Equipment Item Status Update
  const [selectedEquipItem, setSelectedEquipItem] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newEquipStatus, setNewEquipStatus] = useState('active');

  const fetchData = async () => {
    try {
      const [eqData, reqData, offData, assignData] = await Promise.all([
        fetchAllPages('/equipment/'),
        fetchAllPages('/equipment-requests/'),
        fetchAllPages('/offices/search/'),
        fetchAllPages('/assignments/')
      ]);
      setEquipment(eqData || []);
      setRequests(reqData || []);
      setOffices(offData || []);
      setAssignments(assignData || []);
    } catch (err) {
      console.error("Failed to fetch equipment data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Theme Config
  const t = darkMode ? {
    pageBg:       '#071E34',
    surface:      '#0D2640',
    border:       'rgba(255,255,255,0.07)',
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
      { bg: '#0D2640', numColor: '#34D399', lblColor: 'rgba(52,211,153,0.5)', border: '1.5px solid rgba(52,211,153,0.2)' },
      { bg: '#0D2640', numColor: '#60A5FA', lblColor: 'rgba(96,165,250,0.5)', border: '1.5px solid rgba(96,165,250,0.2)' },
    ],
    reqBtnBg:     '#2563EB',
    reqBtnHover:  '#1D4ED8',
    disabledBg:   'rgba(255,255,255,0.05)',
    disabledColor:'rgba(255,255,255,0.25)',
  } : {
    pageBg:       '#DCE9F5',
    surface:      '#fff',
    border:       '#C2D8EF',
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
      { bg: '#fff', numColor: '#059669', lblColor: '#047857',               border: '1.5px solid #C2D8EF' },
      { bg: '#fff', numColor: '#1D4ED8', lblColor: '#1e40af',               border: '1.5px solid #C2D8EF' },
    ],
    reqBtnBg:     '#2563EB',
    reqBtnHover:  '#1D4ED8',
    disabledBg:   '#EEF4FB',
    disabledColor:'#A8C0D8',
  };

  // Helper mappings
  const officeMap = {};
  offices.forEach(o => {
    officeMap[o.id] = o.room_number;
  });

  const getOfficeName = (id) => officeMap[id] || `Office ${id}`;

  // Filter Active Assignments for current faculty
  const myActiveAssignments = assignments.filter(a => {
    const sId = typeof a.staff === 'object' ? a.staff.id : a.staff;
    return sId === staffId && !a.end_date;
  });
  const myOfficeIds = myActiveAssignments.map(a => typeof a.office === 'object' ? a.office.id : a.office);

  // Faculty Active Equipment items
  const myOfficeEquipment = equipment.filter(e => myOfficeIds.includes(e.office));

  // Global Pending Queue (reviewable requests)
  // requests are already filtered by the Django queryset based on the user's role!
  const pendingRequests = requests.filter(r => r.status === 'pending');

  // KPI Calculations
  const kpis = isFaculty ? [
    { label: 'Active Equipment in My Office', value: myOfficeEquipment.filter(e => e.status === 'active').length, iconIndex: 0 },
    { label: 'My Requests Submitted', value: requests.length, iconIndex: 1 },
    { label: 'Requests Waiting Approval', value: requests.filter(r => r.status === 'pending').length, iconIndex: 2 },
  ] : [
    { label: 'Total Global Assets', value: equipment.length, iconIndex: 0 },
    { label: 'Pending Requests Queue', value: pendingRequests.length, iconIndex: 1 },
    { label: 'Assets in Maintenance', value: equipment.filter(e => e.status === 'maintenance').length, iconIndex: 2 },
  ];

  const kpiIcons = [
    <svg key={0} width="44" height="44" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="10" rx="1.5" stroke="white" strokeWidth="1.5"/><path d="M4 12v2M8 12v2M12 12v2M3 14h10" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>,
    <svg key={1} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke={darkMode ? "#10B981" : "#059669"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    <svg key={2} width="44" height="44" viewBox="0 0 16 16" fill="none"><path d="M8 1a4 4 0 100 8A4 4 0 008 1zM2 14c0-2.5 2.7-4 6-4s6 1.5 6 4" stroke={darkMode ? "#3B82F6" : "#2563EB"} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  ];

  // Filters for Global Inventory Tab
  const uniqueTypes = [...new Set(equipment.map(e => e.asset_type))];
  const filteredEquipment = equipment.filter(e => {
    const q = search.toLowerCase();
    const officeNo = getOfficeName(e.office).toLowerCase();
    const serial = (e.serial_number || '').toLowerCase();

    return (
      (serial.includes(q) || officeNo.includes(q) || (e.asset_type || '').toLowerCase().includes(q)) &&
      (!fType || e.asset_type === fType) &&
      (!fStatus || e.status === fStatus)
    );
  });

  const clearAllFilters = () => {
    setSearch('');
    setFType('');
    setFStatus('');
  };

  const hasFiltersActive = search || fType || fStatus;

  // Request Submissions
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqOffice) {
      setRequestError("Please select one of your assigned offices.");
      return;
    }
    if (reqQty <= 0) {
      setRequestError("Quantity must be greater than zero.");
      return;
    }
    if (!reqReason.trim()) {
      setRequestError("Please provide a justification / reason for this equipment.");
      return;
    }

    setSubmittingRequest(true);
    setRequestError("");
    try {
      await client.post('/equipment-requests/', {
        office: parseInt(reqOffice),
        asset_type: reqAssetType,
        quantity: parseInt(reqQty),
        reason: reqReason,
        status: 'pending'
      });
      // Reset state & refresh
      setReqOffice('');
      setReqAssetType('computer');
      setReqQty(1);
      setReqReason('');
      setShowRequestModal(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to submit request:", err);
      setRequestError(err.response?.data?.detail || err.response?.data?.office?.[0] || "Failed to submit request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Review Operations
  const triggerApproveFlow = (req) => {
    setSelectedRequest(req);
    setSerialNumber('');
    setActionError('');
    setShowApproveModal(true);
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    setIsActionLoading(true);
    setActionError('');
    try {
      await client.patch(`/equipment-requests/${selectedRequest.id}/`, {
        status: 'approved',
        serial_number_assigned: serialNumber
      });
      setShowApproveModal(false);
      setSelectedRequest(null);
      setSerialNumber('');
      await fetchData();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.detail || err.response?.data?.serial_number_assigned?.[0] || "Failed to approve request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const triggerRejectFlow = (req) => {
    setSelectedRequest(req);
    setRejectionReason('');
    setActionError('');
    setShowRejectModal(true);
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      setActionError("Rejection reason is mandatory.");
      return;
    }
    setIsActionLoading(true);
    setActionError('');
    try {
      await client.patch(`/equipment-requests/${selectedRequest.id}/`, {
        status: 'rejected',
        rejection_reason: rejectionReason
      });
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      await fetchData();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.rejection_reason?.[0] || err.response?.data?.detail || "Failed to reject request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Equipment Item Status Update
  const triggerEquipStatusFlow = (item) => {
    if (!['system_admin', 'it_department', 'resource_manager'].includes(role)) return;
    setSelectedEquipItem(item);
    setNewEquipStatus(item.status);
    setActionError('');
    setShowStatusModal(true);
  };

  const handleEquipStatusUpdate = async () => {
    if (!selectedEquipItem) return;
    setIsActionLoading(true);
    setActionError('');
    try {
      await client.patch(`/equipment/${selectedEquipItem.id}/`, {
        status: newEquipStatus
      });
      setShowStatusModal(false);
      setSelectedEquipItem(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.detail || "Failed to update item status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const inputStyle = {
    padding: '10px 12px',
    borderRadius: '10px',
    border: `1.5px solid ${t.inputBorder}`,
    backgroundColor: t.inputBg,
    color: t.inputColor,
    fontFamily: "'Nunito', 'Sora', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    outline: 'none',
    transition: 'all 0.2s',
  };

  return (
    <Layout>
      <div style={{ fontFamily: "'Nunito', 'Sora', sans-serif", display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: t.eyebrow, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '5px' }}>OPA Services</div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: t.title, letterSpacing: '-1px', lineHeight: 1, margin: 0 }}>Equipment & Assets</h1>
          </div>
          
          {/* Action trigger for faculty */}
          {isFaculty && (
            <button
              onClick={() => {
                if (myOfficeIds.length === 0) {
                  alert("You must be actively assigned to an office before submitting equipment requests.");
                } else {
                  setReqOffice(myOfficeIds[0].toString());
                  setShowRequestModal(true);
                }
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '12px', border: 'none',
                backgroundColor: t.reqBtnBg, color: '#fff', fontSize: '13px', fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: '0 4px 10px rgba(37,99,235,0.2)'
              }}
              onMouseEnter={e => e.target.style.backgroundColor = t.reqBtnHover}
              onMouseLeave={e => e.target.style.backgroundColor = t.reqBtnBg}
            >
              <PlusIcon color="#fff" />
              Request Equipment
            </button>
          )}
        </div>

        {/* ── Tabs (Only for Admins/IT to switch between their Faculty profile view and Admin console) ── */}
        {isAdminOrStaff && (
          <div style={{ display: 'flex', gap: '8px', borderBottom: `1.5px solid ${t.tableBorder}`, paddingBottom: '2px' }}>
            <button
              onClick={() => setActiveTab('console')}
              style={{
                background: 'none', border: 'none',
                fontSize: '14px', fontWeight: 800, fontFamily: 'inherit',
                padding: '10px 18px', borderBottom: activeTab === 'console' ? `3px solid ${t.officeChipColor}` : '3px solid transparent',
                color: activeTab === 'console' ? t.title : t.sub,
                cursor: 'pointer', transition: 'all 0.2s', borderRadius: '4px 4px 0 0'
              }}
            >
              Management Console
            </button>
            <button
              onClick={() => setActiveTab('my-workspace')}
              style={{
                background: 'none', border: 'none',
                fontSize: '14px', fontWeight: 800, fontFamily: 'inherit',
                padding: '10px 18px', borderBottom: activeTab === 'my-workspace' ? `3px solid ${t.officeChipColor}` : '3px solid transparent',
                color: activeTab === 'my-workspace' ? t.title : t.sub,
                cursor: 'pointer', transition: 'all 0.2s', borderRadius: '4px 4px 0 0'
              }}
            >
              My Workspace & Requests
            </button>
          </div>
        )}

        {/* ── KPI Ribbon ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {kpis.map((k, i) => {
            const cardStyle = t.kpiCards[i];
            return (
              <div key={i} style={{
                background: cardStyle.bg, border: cardStyle.border || 'none',
                borderRadius: '16px', padding: '20px 22px', position: 'relative', overflow: 'hidden',
                boxShadow: darkMode ? 'none' : '0 2px 10px rgba(15,60,120,0.06)'
              }}>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: .14, display: 'flex' }}>
                  {kpiIcons[k.iconIndex]}
                </div>
                <div style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '4px', color: cardStyle.numColor }}>
                  {k.value}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: cardStyle.lblColor }}>
                  {k.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Loading Overlay ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', color: t.sub, fontSize: '15px', fontWeight: 700 }}>
            Loading Equipment & requests desk...
          </div>
        ) : (
          <>
            {/* ──────────────────────────────────────────────────────── */}
            {/* FACULTY WORKSPACE VIEW                                   */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'my-workspace' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Section A: Active Room Assets */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: t.title, marginBottom: '12px', letterSpacing: '-0.3px' }}>
                    Active Office Inventory
                  </h3>
                  
                  {myOfficeEquipment.length === 0 ? (
                    <div style={{
                      background: t.surface, border: `1.5px dashed ${t.border}`, borderRadius: '16px',
                      padding: '40px 20px', textAlign: 'center', color: t.sub
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <svg width="40" height="40" viewBox="0 0 16 16" fill="none">
                          <rect x="2" y="3" width="12" height="10" rx="1.5" stroke={t.sub} strokeWidth="1.5"/>
                          <path d="M5 8h6M5 10h3" stroke={t.sub} strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>No assets currently assigned to your office workspace.</span>
                        {isFaculty && (
                          <button
                            onClick={() => setShowRequestModal(true)}
                            style={{
                              background: 'none', border: 'none', color: t.officeChipColor,
                              fontSize: '13px', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline'
                            }}
                          >
                            Submit a request for new equipment
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                      {myOfficeEquipment.map(item => {
                        const st = getStatusStyles(item.status, darkMode);
                        return (
                          <div key={item.id} style={{
                            backgroundColor: t.surface, border: `1.5px solid ${t.border}`, borderRadius: '14px',
                            padding: '16px', position: 'relative', display: 'flex', gap: '14px', alignItems: 'center',
                            boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
                          }}>
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '10px',
                              backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : '#EEF4FB',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              <TypeIcon type={item.asset_type} color={t.officeChipColor} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: t.title, textTransform: 'capitalize' }}>
                                {item.asset_type}
                              </span>
                              <span style={{ fontSize: '11px', color: t.sub, fontFamily: 'monospace', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                SN: {item.serial_number}
                              </span>
                              <span style={{ fontSize: '11px', color: t.officeChipColor, fontWeight: 700, marginTop: '2px' }}>
                                Office {getOfficeName(item.office)}
                              </span>
                            </div>
                            <span style={{
                              position: 'absolute', top: '10px', right: '10px',
                              background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                              fontSize: '9.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: st.dot }} />
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section B: My Request Log */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: t.title, margin: 0, letterSpacing: '-0.3px' }}>
                      My Requests History
                    </h3>
                    {!isFaculty && (
                      <button
                        onClick={() => setShowRequestModal(true)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '6px 12px', borderRadius: '8px', border: `1.5px solid ${t.officeChipColor}`,
                          background: t.officeChipBg, color: t.officeChipColor, fontSize: '12px', fontWeight: 800,
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        <PlusIcon color={t.officeChipColor} />
                        Request Equipment
                      </button>
                    )}
                  </div>

                  <div style={{ background: t.tableBg, border: `1.5px solid ${t.tableBorder}`, borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: t.tableTopBg }}>
                            {['Office', 'Asset Type', 'Qty', 'Reason', 'Requested At', 'Status / Detail'].map((h, i) => (
                              <th key={i} style={{ textAlign: 'left', fontSize: '10.5px', fontWeight: 800, color: t.thColor, textTransform: 'uppercase', letterSpacing: '1px', padding: '12px 20px', borderBottom: `1.5px solid ${t.tableBorder}` }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {requests.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: t.sub, fontSize: '13px', fontWeight: 600 }}>
                                You have not submitted any equipment requests yet.
                              </td>
                            </tr>
                          ) : (
                            requests.map((r, i) => {
                              const st = getRequestStatusStyles(r.status, darkMode);
                              return (
                                <tr key={r.id} style={{ borderBottom: i < requests.length - 1 ? `1px solid ${t.rowBorder}` : 'none' }}>
                                  <td style={{ padding: '14px 20px' }}>
                                    <span style={{ background: t.officeChipBg, color: t.officeChipColor, fontSize: '11px', fontWeight: 800, padding: '4px 9px', borderRadius: '6px' }}>
                                      {r.office_room || getOfficeName(r.office)}
                                    </span>
                                  </td>
                                  <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: t.title, textTransform: 'capitalize' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <TypeIcon type={r.asset_type} color={t.sub} />
                                      {r.asset_type}
                                    </div>
                                  </td>
                                  <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 800, color: t.text }}>
                                    {r.quantity}x
                                  </td>
                                  <td style={{ padding: '14px 20px', fontSize: '12.5px', color: t.sub, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reason}>
                                    {r.reason}
                                  </td>
                                  <td style={{ padding: '14px 20px', fontSize: '12px', color: t.sub }}>
                                    {new Date(r.created_at).toLocaleDateString()}
                                  </td>
                                  <td style={{ padding: '14px 20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                      <span style={{
                                        background: st.bg, color: st.color, border: `1.5px solid ${st.border}`,
                                        fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px',
                                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                                      }}>
                                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: st.dot }} />
                                        {st.label}
                                      </span>
                                      
                                      {r.status === 'approved' && r.serial_number_assigned && (
                                        <span style={{ fontSize: '10.5px', color: t.officeChipColor, fontWeight: 700, fontFamily: 'monospace', marginLeft: '4px' }}>
                                          Asset SN: {r.serial_number_assigned}
                                        </span>
                                      )}
                                      
                                      {r.status === 'rejected' && r.rejection_reason && (
                                        <span style={{
                                          fontSize: '11px', color: '#DC2626', background: darkMode ? 'rgba(220,38,38,0.1)' : '#FEF2F2',
                                          padding: '4px 8px', borderRadius: '6px', marginTop: '2px', fontWeight: 600, border: '1px solid rgba(220,38,38,0.15)'
                                        }}>
                                          Reason: {r.rejection_reason}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ──────────────────────────────────────────────────────── */}
            {/* ADMIN CONSOLE VIEW                                       */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'console' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Console Sub-navigation Tabs */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: `1.5px solid ${t.tableBorder}`, paddingBottom: '1px' }}>
                  <button
                    onClick={() => setConsoleSubTab('requests')}
                    style={{
                      background: 'none', border: 'none', fontSize: '13px', fontWeight: 800, fontFamily: 'inherit',
                      padding: '8px 14px', borderBottom: consoleSubTab === 'requests' ? `2px solid ${t.officeChipColor}` : '2px solid transparent',
                      color: consoleSubTab === 'requests' ? t.title : t.sub, cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    Requests Queue ({pendingRequests.length} Pending)
                  </button>
                  <button
                    onClick={() => setConsoleSubTab('inventory')}
                    style={{
                      background: 'none', border: 'none', fontSize: '13px', fontWeight: 800, fontFamily: 'inherit',
                      padding: '8px 14px', borderBottom: consoleSubTab === 'inventory' ? `2px solid ${t.officeChipColor}` : '2px solid transparent',
                      color: consoleSubTab === 'inventory' ? t.title : t.sub, cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    Global Assets Inventory ({equipment.length})
                  </button>
                </div>

                {/* Sub Tab: Requests Queue */}
                {consoleSubTab === 'requests' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: t.title, margin: 0 }}>
                        Pending Allocation Requests
                      </h3>
                      <span style={{ fontSize: '12px', color: t.sub, fontWeight: 600 }}>
                        Role-based Filter Active: {role.replace('_', ' ').toUpperCase()} View
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {pendingRequests.length === 0 ? (
                        <div style={{
                          background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: '16px',
                          padding: '50px 20px', textAlign: 'center', color: t.sub
                        }}>
                          <svg width="36" height="36" viewBox="0 0 16 16" fill="none" style={{ marginBottom: '10px' }}>
                            <path d="M3 8l3.5 3.5L13 4.5" stroke={t.sub} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <div style={{ fontSize: '14px', fontWeight: 700 }}>All equipment requests handled! Queue is clear.</div>
                        </div>
                      ) : (
                        pendingRequests.map(req => {
                          const isTech = req.category === 'it';
                          const categoryColor = isTech ? '#3B82F6' : '#F59E0B';
                          return (
                            <div key={req.id} style={{
                              background: t.surface, border: `1.5px solid ${t.border}`,
                              borderLeft: `5px solid ${categoryColor}`, borderRadius: '14px',
                              padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px',
                              boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ background: t.officeChipBg, color: t.officeChipColor, fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                                    Room {req.office_room || getOfficeName(req.office)}
                                  </span>
                                  <span style={{
                                    background: isTech ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                                    color: categoryColor, fontSize: '10.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                                    border: `1px solid ${isTech ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)'}`
                                  }}>
                                    {isTech ? 'IT Asset' : 'Furniture'}
                                  </span>
                                  <span style={{ fontSize: '12px', color: t.sub }}>
                                    Requested by: <strong style={{ color: t.title }}>{req.staff_name}</strong>
                                  </span>
                                  <span style={{ fontSize: '11px', color: t.sub }}>
                                    ({new Date(req.created_at).toLocaleDateString()})
                                  </span>
                                </div>

                                <div style={{ fontSize: '14px', fontWeight: 800, color: t.title, textTransform: 'capitalize' }}>
                                  {req.quantity}x {req.asset_type}
                                </div>

                                <div style={{ fontSize: '12.5px', color: t.text, fontStyle: 'italic', background: darkMode ? 'rgba(255,255,255,0.02)' : '#F9FAFB', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}` }}>
                                  &ldquo;{req.reason}&rdquo;
                                </div>
                              </div>

                              {/* Review Action Buttons */}
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button
                                  onClick={() => triggerRejectFlow(req)}
                                  style={{
                                    padding: '8px 14px', borderRadius: '8px', border: '1.5px solid rgba(220,38,38,0.25)',
                                    background: darkMode ? 'rgba(220,38,38,0.06)' : '#FEF2F2', color: '#DC2626',
                                    fontSize: '12.5px', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s'
                                  }}
                                  onMouseEnter={e => e.target.style.background = 'rgba(220,38,38,0.1)'}
                                  onMouseLeave={e => e.target.style.background = darkMode ? 'rgba(220,38,38,0.06)' : '#FEF2F2'}
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => triggerApproveFlow(req)}
                                  style={{
                                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                                    background: '#059669', color: '#fff',
                                    fontSize: '12.5px', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
                                    boxShadow: '0 3px 8px rgba(5,150,105,0.2)'
                                  }}
                                  onMouseEnter={e => e.target.style.backgroundColor = '#047857'}
                                  onMouseLeave={e => e.target.style.backgroundColor = '#059669'}
                                >
                                  Approve
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Sub Tab: Global Inventory */}
                {consoleSubTab === 'inventory' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    {/* Search & Filter Bar */}
                    <div style={{ background: t.filterBg, border: `1.5px solid ${t.filterBorder}`, borderRadius: '14px', padding: '12px 14px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: '11px', color: t.inputPlaceholder, display: 'flex', pointerEvents: 'none' }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                        </span>
                        <input
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Search assets by serial, office, or type…"
                          style={{ ...inputStyle, width: '100%', padding: '8px 11px 8px 34px' }}
                          onFocus={e => e.target.style.borderColor = '#3B82F6'}
                          onBlur={e => e.target.style.borderColor = t.inputBorder}
                        />
                      </div>

                      {/* Filter Asset Type */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <select
                          value={fType}
                          onChange={e => setFType(e.target.value)}
                          style={{ ...inputStyle, padding: '8px 28px 8px 11px', cursor: 'pointer', appearance: 'none' }}
                        >
                          <option value="">All Types</option>
                          {uniqueTypes.map(tp => <option key={tp} value={tp}>{tp.toUpperCase()}</option>)}
                        </select>
                        <span style={{ position: 'absolute', right: '9px', color: t.inputPlaceholder, pointerEvents: 'none', display: 'flex' }}><ChevronIcon color={t.inputPlaceholder} /></span>
                      </div>

                      {/* Filter Status */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <select
                          value={fStatus}
                          onChange={e => setFStatus(e.target.value)}
                          style={{ ...inputStyle, padding: '8px 28px 8px 11px', cursor: 'pointer', appearance: 'none' }}
                        >
                          <option value="">All Statuses</option>
                          <option value="active">Active</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="retired">Retired</option>
                        </select>
                        <span style={{ position: 'absolute', right: '9px', color: t.inputPlaceholder, pointerEvents: 'none', display: 'flex' }}><ChevronIcon color={t.inputPlaceholder} /></span>
                      </div>

                      {/* Clear Filters */}
                      {hasFiltersActive && (
                        <button
                          onClick={clearAllFilters}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#DC2626', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>

                    {/* Inventory Table */}
                    <div style={{ background: t.tableBg, border: `1.5px solid ${t.tableBorder}`, borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: t.tableTopBg }}>
                              {['Asset Category / Serial', 'Type', 'Office Location', 'Status', 'Lifecycle Control'].map((h, i) => (
                                <th key={i} style={{ textAlign: 'left', fontSize: '10.5px', fontWeight: 800, color: t.thColor, textTransform: 'uppercase', letterSpacing: '1px', padding: '12px 20px', borderBottom: `1.5px solid ${t.tableBorder}` }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEquipment.length === 0 ? (
                              <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: t.sub, fontSize: '13px' }}>
                                  No assets found matching the filter criteria.
                                </td>
                              </tr>
                            ) : (
                              filteredEquipment.map((item, i) => {
                                const st = getStatusStyles(item.status, darkMode);
                                const canManage = ['system_admin', 'it_department', 'resource_manager'].includes(role);
                                return (
                                  <tr
                                    key={item.id}
                                    style={{
                                      borderBottom: i < filteredEquipment.length - 1 ? `1px solid ${t.rowBorder}` : 'none',
                                      background: hoveredRow === item.id ? t.rowHover : 'transparent', transition: 'background .12s'
                                    }}
                                    onMouseEnter={() => setHoveredRow(item.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                  >
                                    <td style={{ padding: '13px 20px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: darkMode ? 'rgba(255,255,255,0.06)' : '#EEF4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                          <TypeIcon type={item.asset_type} color={t.sub} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontSize: '13px', fontWeight: 700, color: t.eqNameColor }}>{item.serial_number}</span>
                                          <span style={{ fontSize: '10px', color: t.sub, textTransform: 'uppercase', letterSpacing: '0.3px', fontWeight: 700 }}>
                                            {item.asset_type === 'chair' || item.asset_type === 'desk' ? 'Furniture' : 'Tech Asset'}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '13px 20px' }}>
                                      <span style={{ background: t.typeBg, color: t.typeColor, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '7px', display: 'inline-block', textTransform: 'capitalize' }}>
                                        {item.asset_type}
                                      </span>
                                    </td>
                                    <td style={{ padding: '13px 20px' }}>
                                      <span style={{ background: t.officeChipBg, color: t.officeChipColor, fontSize: '12px', fontWeight: 800, padding: '4px 11px', borderRadius: '8px' }}>
                                        Room {getOfficeName(item.office)}
                                      </span>
                                    </td>
                                    <td style={{ padding: '13px 20px' }}>
                                      <span style={{
                                        background: st.bg, color: st.color, border: `1.5px solid ${st.border}`,
                                        fontSize: '11px', fontWeight: 800, padding: '5px 11px', borderRadius: '22px',
                                        display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap'
                                      }}>
                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: st.dot, display: 'inline-block', flexShrink: 0 }} />
                                        {st.label}
                                      </span>
                                    </td>
                                    <td style={{ padding: '13px 20px' }}>
                                      {canManage ? (
                                        <button
                                          onClick={() => triggerEquipStatusFlow(item)}
                                          style={{
                                            padding: '6px 12px', borderRadius: '8px', border: `1.5px solid ${t.officeChipColor}`,
                                            background: 'none', color: t.officeChipColor, fontSize: '12px', fontWeight: 800,
                                            cursor: 'pointer', transition: 'all 0.15s'
                                          }}
                                          onMouseEnter={e => { e.target.style.background = t.officeChipBg; }}
                                          onMouseLeave={e => { e.target.style.background = 'none'; }}
                                        >
                                          Lifecycle Status
                                        </button>
                                      ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: t.disabledBg, color: t.disabledColor, fontSize: '12px', fontWeight: 700 }}>
                                          ReadOnly
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* MODAL 1: REQUEST NEW EQUIPMENT (FACULTY GLASSMORPHIC)   */}
        {/* ──────────────────────────────────────────────────────── */}
        {showRequestModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
          }}>
            <div style={{
              backgroundColor: t.surface, borderRadius: '16px', border: `1.5px solid ${t.border}`,
              width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              fontFamily: 'inherit', position: 'relative'
            }}>
              
              <button
                onClick={() => setShowRequestModal(false)}
                style={{
                  position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex', opacity: 0.7
                }}
              >
                <CloseIcon color={t.title} />
              </button>

              <h3 style={{ fontSize: '20px', fontWeight: 900, color: t.title, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
                Request Classroom/Office Equipment
              </h3>
              <p style={{ fontSize: '12.5px', color: t.sub, margin: '0 0 20px 0', fontWeight: 600 }}>
                Select an office assignment and item to submit a formal request.
              </p>

              {requestError && (
                <div style={{
                  background: darkMode ? 'rgba(239,68,68,0.08)' : '#FEF2F2',
                  border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: '10px',
                  padding: '12px', marginBottom: '16px', color: '#DC2626', fontSize: '13px', fontWeight: 700
                }}>
                  {requestError}
                </div>
              )}

              <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Office Select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Select Target Office Room
                  </label>
                  <select
                    value={reqOffice}
                    onChange={e => setReqOffice(e.target.value)}
                    style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                    required
                  >
                    <option value="" disabled>-- Select Assigned Room --</option>
                    {myOfficeIds.map(id => (
                      <option key={id} value={id}>Room {getOfficeName(id)}</option>
                    ))}
                  </select>
                </div>

                {/* Asset Select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Equipment/Furniture Type
                  </label>
                  <select
                    value={reqAssetType}
                    onChange={e => setReqAssetType(e.target.value)}
                    style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                    required
                  >
                    <option value="computer">Computer (Desktop/Laptop)</option>
                    <option value="monitor">Dual/Single Monitor</option>
                    <option value="printer">Laser/Label Printer</option>
                    <option value="phone">IP Desk Phone</option>
                    <option value="projector">Ceiling Projector</option>
                    <option value="smartboard">Interactive Smart Board</option>
                    <option value="chair">Ergonomic Desk Chair</option>
                    <option value="desk">Standing/L-shaped Desk</option>
                  </select>
                </div>

                {/* Quantity incrementor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Requested Quantity
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setReqQty(Math.max(1, reqQty - 1))}
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        border: `1.5px solid ${t.inputBorder}`, backgroundColor: t.inputBg,
                        color: t.title, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <MinusIcon color={t.title} />
                    </button>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: t.title, minWidth: '24px', textAlign: 'center' }}>
                      {reqQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReqQty(Math.min(10, reqQty + 1))}
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        border: `1.5px solid ${t.inputBorder}`, backgroundColor: t.inputBg,
                        color: t.title, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <PlusIcon color={t.title} />
                    </button>
                  </div>
                </div>

                {/* Justification Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Written Justification / Reason
                  </label>
                  <textarea
                    value={reqReason}
                    onChange={e => setReqReason(e.target.value)}
                    placeholder="Describe why this equipment is needed for your academic or research duties…"
                    style={{ ...inputStyle, width: '100%', minHeight: '80px', resize: 'vertical' }}
                    required
                  />
                </div>

                {/* Submit Actions */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    style={{
                      padding: '10px 18px', borderRadius: '10px', border: `1.5px solid ${t.inputBorder}`,
                      background: 'none', color: t.sub, fontSize: '13px', fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    style={{
                      padding: '10px 18px', borderRadius: '10px', border: 'none',
                      backgroundColor: t.reqBtnBg, color: '#fff', fontSize: '13px', fontWeight: 800,
                      cursor: submittingRequest ? 'not-allowed' : 'pointer', opacity: submittingRequest ? 0.7 : 1
                    }}
                  >
                    {submittingRequest ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* MODAL 2: APPROVE PENDING REQUEST (ADMIN)                 */}
        {/* ──────────────────────────────────────────────────────── */}
        {showApproveModal && selectedRequest && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
          }}>
            <div style={{
              backgroundColor: t.surface, borderRadius: '16px', border: `1.5px solid ${t.border}`,
              width: '100%', maxWidth: '460px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              fontFamily: 'inherit'
            }}>
              
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: t.title, margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                Approve Allocation & Deploy Asset
              </h3>
              
              <p style={{ fontSize: '13.5px', color: t.text, margin: '0 0 16px 0', fontWeight: 600, lineHeight: 1.4 }}>
                Approving the request of **{selectedRequest.staff_name}** will automatically create and deploy **{selectedRequest.quantity}x {selectedRequest.asset_type}** inside Office room **{selectedRequest.office_room || getOfficeName(selectedRequest.office)}**.
              </p>

              {actionError && (
                <div style={{
                  background: darkMode ? 'rgba(239,68,68,0.08)' : '#FEF2F2',
                  border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: '10px',
                  padding: '12px', marginBottom: '16px', color: '#DC2626', fontSize: '13px', fontWeight: 700
                }}>
                  {actionError}
                </div>
              )}

              {/* Conditional input: Serial number for IT technology assets */}
              {selectedRequest.category === 'it' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Assign Hardware Serial Number (Recommended)
                  </label>
                  <input
                    value={serialNumber}
                    onChange={e => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-UNIT-9824X"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                  <small style={{ fontSize: '11px', color: t.sub, fontWeight: 600, fontStyle: 'italic' }}>
                    * Leaves blank to let the system auto-generate a registration sequence.
                  </small>
                </div>
              ) : (
                <div style={{
                  background: darkMode ? 'rgba(255,255,255,0.03)' : '#EEF4FB',
                  border: `1.5px solid ${t.border}`, borderRadius: '12px',
                  padding: '12px', marginBottom: '20px', fontSize: '12.5px', color: t.sub, fontWeight: 600
                }}>
                  Category: **Furniture / Fixture** — Serial number is optional and auto-generated by the database.
                </div>
              )}

              {/* Submit Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRequest(null);
                  }}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: `1.5px solid ${t.inputBorder}`,
                    background: 'none', color: t.sub, fontSize: '13px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveRequest}
                  disabled={isActionLoading}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#059669', color: '#fff', fontSize: '13px', fontWeight: 800,
                    cursor: isActionLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isActionLoading ? 'Deploying...' : 'Approve & Deploy'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* MODAL 3: REJECT PENDING REQUEST (ADMIN)                 */}
        {/* ──────────────────────────────────────────────────────── */}
        {showRejectModal && selectedRequest && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
          }}>
            <div style={{
              backgroundColor: t.surface, borderRadius: '16px', border: `1.5px solid ${t.border}`,
              width: '100%', maxWidth: '460px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              fontFamily: 'inherit'
            }}>
              
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: t.title, margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                Reject Allocation Request
              </h3>
              
              <p style={{ fontSize: '13.5px', color: t.text, margin: '0 0 16px 0', fontWeight: 600, lineHeight: 1.4 }}>
                Are you sure you want to reject this request for **{selectedRequest.quantity}x {selectedRequest.asset_type}**? A written rejection reason is mandatory and will be visible to the faculty member.
              </p>

              {actionError && (
                <div style={{
                  background: darkMode ? 'rgba(239,68,68,0.08)' : '#FEF2F2',
                  border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: '10px',
                  padding: '12px', marginBottom: '16px', color: '#DC2626', fontSize: '13px', fontWeight: 700
                }}>
                  {actionError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mandatory Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Budget limitations, item currently out of stock, or alternative rooms already fully furnished."
                  style={{ ...inputStyle, width: '100%', minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>

              {/* Submit Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRequest(null);
                  }}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: `1.5px solid ${t.inputBorder}`,
                    background: 'none', color: t.sub, fontSize: '13px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectRequest}
                  disabled={isActionLoading}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#DC2626', color: '#fff', fontSize: '13px', fontWeight: 800,
                    cursor: isActionLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isActionLoading ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* MODAL 4: LIFECYCLE STATUS CONTROL (LIFECYCLE MANAGEMENT) */}
        {/* ──────────────────────────────────────────────────────── */}
        {showStatusModal && selectedEquipItem && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
          }}>
            <div style={{
              backgroundColor: t.surface, borderRadius: '16px', border: `1.5px solid ${t.border}`,
              width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              fontFamily: 'inherit'
            }}>
              
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: t.title, margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                Asset Lifecycle Control
              </h3>
              
              <p style={{ fontSize: '13.5px', color: t.text, margin: '0 0 16px 0', fontWeight: 600, lineHeight: 1.4 }}>
                Change lifecycle status for hardware **{selectedEquipItem.serial_number}** ({selectedEquipItem.asset_type.toUpperCase()}) assigned to room **{getOfficeName(selectedEquipItem.office)}**.
              </p>

              {actionError && (
                <div style={{
                  background: darkMode ? 'rgba(239,68,68,0.08)' : '#FEF2F2',
                  border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: '10px',
                  padding: '12px', marginBottom: '16px', color: '#DC2626', fontSize: '13px', fontWeight: 700
                }}>
                  {actionError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Select Lifecycle State
                </label>
                <select
                  value={newEquipStatus}
                  onChange={e => setNewEquipStatus(e.target.value)}
                  style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                >
                  <option value="active">Active (Deployed & Operational)</option>
                  <option value="maintenance">Maintenance (Offline for Repairs)</option>
                  <option value="retired">Retired (Decommissioned & Disposed)</option>
                </select>
              </div>

              {/* Submit Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedEquipItem(null);
                  }}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: `1.5px solid ${t.inputBorder}`,
                    background: 'none', color: t.sub, fontSize: '13px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEquipStatusUpdate}
                  disabled={isActionLoading}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    backgroundColor: t.reqBtnBg, color: '#fff', fontSize: '13px', fontWeight: 800,
                    cursor: isActionLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isActionLoading ? 'Updating...' : 'Update Lifecycle'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}