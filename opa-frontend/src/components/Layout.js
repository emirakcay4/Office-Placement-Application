import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useDarkMode } from '../context/DarkModeContext';

export default function Layout({ children }) {
  const { darkMode } = useDarkMode();
  return (
    <div style={{ minHeight: '100vh', backgroundColor: darkMode ? '#071525' : '#F0F5FB', fontFamily: 'Sora, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{
          flex: 1, padding: '32px 36px',
          minHeight: 'calc(100vh - 60px)',
          backgroundColor: darkMode ? '#071525' : '#F0F5FB',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}