import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function RequestOffice() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Loaded DB data
  const [buildings, setBuildings] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState(null); // stores complete office object

  // Form Submission states
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch all buildings once
  useEffect(() => {
    client.get('/buildings/')
      .then(res => {
        setBuildings(res.data.results || res.data);
      })
      .catch(err => console.error("Error loading buildings", err));
  }, []);

  // Fetch offices dynamically when search/filters change
  useEffect(() => {
    const fetchFilteredOffices = async () => {
      try {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (selectedBuilding) params.building = selectedBuilding;
        if (selectedType) params.office_type = selectedType;

        const res = await client.get('/offices/search/', { params });
        setOffices(res.data.results || res.data);
      } catch (err) {
        console.error("Error loading offices", err);
      }
    };

    const timer = setTimeout(() => {
      fetchFilteredOffices();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedBuilding, selectedType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOffice) {
      setError('Please select an office first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await client.post('/requests/', {
        office: selectedOffice.id,
        reason: reason
      });
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2500);
    } catch (err) {
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const t = darkMode ? {
    title: '#E8F4FF',
    text: '#C8DCF0',
    sub: '#4A7FAA',
    border: 'rgba(255,255,255,0.07)',
    card: '#0D2640',
    cardHover: 'rgba(255, 255, 255, 0.02)',
    surface2: '#0A1E36',
    borderFocus: '#3B82F6',
    occTrack: 'rgba(255, 255, 255, 0.08)',
    activeCardBg: 'rgba(59, 130, 246, 0.12)',
    pillBg: 'rgba(255, 255, 255, 0.05)',
    pillColor: '#C8DCF0',
    pillActiveBg: '#3B82F6',
    pillActiveColor: '#fff',
    badgeTypeBg: 'rgba(255, 255, 255, 0.06)',
    badgeTypeColor: 'rgba(255, 255, 255, 0.38)',
    inputBg: '#0A1E36',
  } : {
    title: '#0D2D52',
    text: '#1E4A7A',
    sub: '#7AAAD0',
    border: '#C2D8EF',
    card: '#fff',
    cardHover: '#F8FAFD',
    surface2: '#F5F9FF',
    borderFocus: '#2563EB',
    occTrack: '#E2EDF9',
    activeCardBg: '#EFF6FF',
    pillBg: '#EEF4FB',
    pillColor: '#1E4A7A',
    pillActiveBg: '#2563EB',
    pillActiveColor: '#fff',
    badgeTypeBg: '#EEF4FB',
    badgeTypeColor: '#5A87B8',
    inputBg: '#fff',
  };

  const officeTypes = [
    { key: 'single', label: 'Single' },
    { key: 'shared', label: 'Shared' },
    { key: 'lab', label: 'Lab' },
    { key: 'conference', label: 'Conference' }
  ];

  return (
    <Layout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'Nunito, Sora, sans-serif' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 800, color: t.sub, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '5px' }}>Workflow</div>
          <h1 style={{ color: t.title, fontSize: '32px', fontWeight: 900, letterSpacing: '-1.5px', margin: 0 }}>Request an Office</h1>
          <p style={{ color: t.sub, fontSize: '14px', marginTop: '6px', marginBottom: 0 }}>
            Select an office from the campus map/directory below and describe your relocation or occupancy needs.
          </p>
        </div>

        {success ? (
          <div style={{ 
            background: t.card, 
            border: `1.5px solid ${t.border}`, 
            borderRadius: '20px', 
            padding: '48px', 
            textAlign: 'center', 
            boxShadow: darkMode ? 'none' : '0 10px 30px rgba(15,60,120,0.06)' 
          }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #10B981, #059669)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              boxShadow: '0 8px 24px rgba(16,185,129,0.3)'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: t.title, marginBottom: '10px' }}>Request Successfully Filed!</h2>
            <p style={{ color: t.text, fontSize: '15px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.5' }}>
              Your placement request for <strong>Office {selectedOffice?.room_number} ({selectedOffice?.building_name})</strong> has been logged in the system. Your department administrator will review it shortly.
            </p>
            <p style={{ color: t.sub, fontSize: '13px', fontWeight: 600 }}>Redirecting to your profile dashboard...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
            
            {/* LEFT COLUMN: Office Directory / Interactive selector */}
            <div style={{ flex: '1.6', minWidth: '350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Interactive filters container */}
              <div style={{ 
                background: t.card, 
                border: `1.5px solid ${t.border}`, 
                borderRadius: '16px', 
                padding: '20px',
                boxShadow: darkMode ? 'none' : '0 4px 20px rgba(15,60,120,0.04)'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: t.title, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 0, marginBottom: '16px' }}>
                  Filter & Search Directory
                </h3>

                {/* Search Bar */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ position: 'absolute', left: '14px', color: t.sub, display: 'flex', pointerEvents: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by room, building name..."
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 42px',
                      borderRadius: '10px',
                      border: `1.5px solid ${t.border}`,
                      backgroundColor: t.inputBg,
                      color: t.text,
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = t.borderFocus}
                    onBlur={e => e.target.style.borderColor = t.border}
                  />
                </div>

                {/* Buildings filter row */}
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', marginBottom: '8px' }}>
                    CAMPUS BUILDINGS
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedBuilding('')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        backgroundColor: selectedBuilding === '' ? t.pillActiveBg : t.pillBg,
                        color: selectedBuilding === '' ? t.pillActiveColor : t.pillColor,
                      }}
                    >
                      All Buildings
                    </button>
                    {buildings.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBuilding(b.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          backgroundColor: selectedBuilding === b.id ? t.pillActiveBg : t.pillBg,
                          color: selectedBuilding === b.id ? t.pillActiveColor : t.pillColor,
                        }}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Office types filter row */}
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', marginBottom: '8px' }}>
                    OFFICE TYPES
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedType('')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        backgroundColor: selectedType === '' ? t.pillActiveBg : t.pillBg,
                        color: selectedType === '' ? t.pillActiveColor : t.pillColor,
                      }}
                    >
                      All Types
                    </button>
                    {officeTypes.map(type => (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setSelectedType(type.key)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          backgroundColor: selectedType === type.key ? t.pillActiveBg : t.pillBg,
                          color: selectedType === type.key ? t.pillActiveColor : t.pillColor,
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Office Grid Display */}
              <div style={{ 
                maxHeight: '520px', 
                overflowY: 'auto', 
                paddingRight: '4px',
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '12px' 
              }}>
                {offices.length === 0 ? (
                  <div style={{ 
                    gridColumn: '1 / -1', 
                    background: t.card, 
                    border: `1.5px dashed ${t.border}`, 
                    borderRadius: '16px', 
                    padding: '48px', 
                    textAlign: 'center', 
                    color: t.sub 
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', opacity: 0.7 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <div style={{ fontSize: '14px', fontWeight: 800 }}>No matching offices found</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Try loosening your active filters or search queries.</div>
                  </div>
                ) : (
                  offices.map(o => {
                    const isSelected = selectedOffice?.id === o.id;
                    const pct = Math.min((o.current_occupants_count / o.capacity) * 100, 100);
                    const spotsLeft = o.capacity - o.current_occupants_count;
                    const isFull = spotsLeft <= 0;

                    return (
                      <div
                        key={o.id}
                        onClick={() => setSelectedOffice(o)}
                        style={{
                          background: isSelected ? t.activeCardBg : t.card,
                          border: `2px solid ${isSelected ? t.borderFocus : t.border}`,
                          borderRadius: '14px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isSelected ? `0 0 16px ${darkMode ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.12)'}` : 'none',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = t.cardHover;
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = t.card;
                        }}
                      >
                        {/* Office Room & Building */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 900, color: t.title, letterSpacing: '-0.5px' }}>
                              Room {o.room_number}
                            </div>
                            <div style={{ fontSize: '11px', color: t.sub, fontWeight: 700 }}>
                              {o.building_name}
                            </div>
                          </div>
                          <span style={{ 
                            fontSize: '9.5px', 
                            fontWeight: 800, 
                            padding: '3px 8px', 
                            borderRadius: '20px', 
                            background: isFull ? 'rgba(220,38,38,0.1)' : 'rgba(16,185,129,0.1)', 
                            color: isFull ? '#DC2626' : '#10B981', 
                            border: `1px solid ${isFull ? 'rgba(220,38,38,0.2)' : 'rgba(16,185,129,0.2)'}`,
                            textTransform: 'uppercase'
                          }}>
                            {isFull ? 'Full' : `${spotsLeft} Free`}
                          </span>
                        </div>

                        {/* Middle info */}
                        <div style={{ fontSize: '11px', color: t.text, fontWeight: 600, marginBottom: '12px' }}>
                          Floor {o.floor} · {o.office_type.charAt(0).toUpperCase() + o.office_type.slice(1)}
                        </div>

                        {/* Capacity meter */}
                        <div style={{ marginBottom: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: t.sub, fontWeight: 800, marginBottom: '4px' }}>
                            <span>OCCUPANCY</span>
                            <span>{o.current_occupants_count}/{o.capacity}</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: t.occTrack, borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${pct}%`, 
                              background: isFull ? '#EF4444' : '#3B82F6', 
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Submission details */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div style={{ 
                background: t.card, 
                border: `1.5px solid ${t.border}`, 
                borderRadius: '16px', 
                padding: '24px',
                position: 'sticky',
                top: '24px',
                boxShadow: darkMode ? 'none' : '0 10px 30px rgba(15,60,120,0.06)'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: t.title, letterSpacing: '-0.3px', marginTop: 0, marginBottom: '18px' }}>
                  Placement Proposal
                </h3>

                <form onSubmit={handleSubmit}>
                  {/* Selected Office Summary Card */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', marginBottom: '8px' }}>
                      SELECTED OFFICE
                    </label>

                    {selectedOffice ? (
                      <div style={{ 
                        background: t.surface2, 
                        border: `1.5px solid ${t.border}`, 
                        borderRadius: '12px', 
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: t.title }}>
                            Room {selectedOffice.room_number}
                          </div>
                          <div style={{ fontSize: '12px', color: t.sub, fontWeight: 700 }}>
                            {selectedOffice.building_name} (Floor {selectedOffice.floor})
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedOffice(null)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            opacity: 0.8
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div style={{ 
                        background: t.surface2, 
                        border: `1.5px dashed ${t.border}`, 
                        borderRadius: '12px', 
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: t.sub,
                        fontSize: '13px',
                        fontWeight: 700
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', opacity: 0.6 }}>
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        Please click an office card on the left to begin.
                      </div>
                    )}
                  </div>

                  {/* Reason for Request text area */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', marginBottom: '8px' }}>
                      REASON FOR REQUEST
                    </label>
                    <textarea 
                      required
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="e.g. Relocating closer to teaching labs, requiring more desk space, or new faculty orientation placement..."
                      style={{ 
                        width: '100%', 
                        padding: '12px', 
                        borderRadius: '10px', 
                        border: `1.5px solid ${t.border}`, 
                        background: t.inputBg, 
                        color: t.text, 
                        minHeight: '120px', 
                        resize: 'none',
                        fontFamily: 'inherit',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        lineHeight: '1.4'
                      }}
                      onFocus={e => e.target.style.borderColor = t.borderFocus}
                      onBlur={e => e.target.style.borderColor = t.border}
                    />
                  </div>

                  {error && (
                    <div style={{ 
                      color: '#EF4444', 
                      fontSize: '12px', 
                      fontWeight: 800, 
                      marginBottom: '16px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading || !selectedOffice}
                    style={{ 
                      width: '100%', 
                      padding: '14px', 
                      borderRadius: '10px', 
                      border: 'none', 
                      background: selectedOffice ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : (darkMode ? 'rgba(255,255,255,0.03)' : '#EFF3F8'), 
                      color: selectedOffice ? '#fff' : t.sub, 
                      fontSize: '14px', 
                      fontWeight: 800, 
                      cursor: selectedOffice ? 'pointer' : 'not-allowed',
                      boxShadow: selectedOffice ? '0 4px 18px rgba(37,99,235,0.3)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit Proposal'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
}
