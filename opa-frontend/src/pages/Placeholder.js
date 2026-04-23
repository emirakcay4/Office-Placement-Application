import React from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';

export default function Placeholder({ title }) {
  const { darkMode } = useDarkMode();
  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 128px)' }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: darkMode ? '#152638' : '#ffffff',
          border: darkMode ? '1px solid #1E3A5F' : '1px solid #E8EEF5',
          borderRadius: '16px', padding: '48px 56px',
          boxShadow: '0 1px 4px rgba(30,58,95,0.06)',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚧</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#A8C8E8' : '#1E3A5F', margin: '0 0 8px 0' }}>{title}</h2>
          <p style={{ fontSize: '13px', color: darkMode ? '#7A9EC0' : '#6B8CAE', margin: 0 }}>This page is under development and will be available in Sprint 2.</p>
        </div>
      </div>
    </Layout>
  );
}