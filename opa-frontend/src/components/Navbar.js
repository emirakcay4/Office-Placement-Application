import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { darkMode, toggleDark } = useDarkMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const firstName = user?.staff_profile?.first_name || user?.username || 'User';
  const role = user?.staff_profile?.system_role || 'Faculty';
  const initials = firstName.substring(0, 2).toUpperCase();
  
  const roleLabels = {
    faculty:          'Faculty',
    department_admin: 'Dept. Admin',
    resource_manager: 'Resource Manager',
    system_admin:     'System Admin',
    it_department:    'IT Dept.',
  };
  const roleLabel = roleLabels[role] || role;

  return (
    <header style={{
      height: '60px',
      backgroundColor: '#0F2744',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 200,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(12px)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9"/>
            <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
            <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9"/>
          </svg>
        </div>
        <div>
          <div style={{ color: '#fff', fontFamily: 'Sora, sans-serif', fontWeight: '700', fontSize: '14px', letterSpacing: '-0.3px', lineHeight: '1' }}>OPA</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Sora, sans-serif', fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: '1', marginTop: '2px' }}>Office Placement</div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={toggleDark} style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '15px', transition: 'background 0.2s',
        }}>
          {darkMode ? '☀️' : '🌙'}
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        <div style={{ position: 'relative' }} onClick={() => setShowDropdown(!showDropdown)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', background: showDropdown ? 'rgba(255,255,255,0.08)' : 'transparent', transition: 'background 0.2s' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: 'Sora, sans-serif', fontWeight: '700', fontSize: '12px',
            }}>{initials}</div>
            <div>
              <div style={{ color: '#fff', fontFamily: 'Sora, sans-serif', fontWeight: '600', fontSize: '13px', lineHeight: '1' }}>{firstName}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Sora, sans-serif', fontSize: '10px', lineHeight: '1', marginTop: '3px' }}>{roleLabel}</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.4 }}>
              <path d="M2 4l4 4 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {showDropdown && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              backgroundColor: darkMode ? '#1A2F4A' : '#fff',
              borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2EAF4',
              minWidth: '160px', overflow: 'hidden',
            }}>
              {['Profile', 'Settings'].map(item => (
                <div key={item} 
                  onClick={() => {
                    setShowDropdown(false);
                    if (item === 'Profile') navigate('/profile');
                  }}
                  style={{ padding: '10px 16px', fontSize: '13px', fontFamily: 'Sora, sans-serif', color: darkMode ? '#C8DCF0' : '#1E3A5F', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.05)' : '#F0F6FF'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {item}
                </div>
              ))}
              <div style={{ height: '1px', backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : '#E2EAF4' }} />
              <div onClick={logout} style={{ padding: '10px 16px', fontSize: '13px', fontFamily: 'Sora, sans-serif', color: '#EF4444', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                Sign out
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}