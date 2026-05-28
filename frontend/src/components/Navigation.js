import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaCaretDown, FaSignOutAlt, FaWallet, FaUserShield, FaUser } from 'react-icons/fa';
import '../pages/Home.css'; // Import the custom navbar styles

const Navigation = ({ account, connectWallet, loginDemo, loginAdminDemo, loginGuideDemo, logout, isAdmin, isGuide }) => {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  // ─── Navbar scroll effect ────────────────────────────────────
  useEffect(() => {
    // If not on home page, always show as scrolled (solid background)
    if (!isHomePage) {
      setNavScrolled(true);
      return;
    }

    // If on home page, handle scroll transparency
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    // Initial check
    onScroll();
    
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomePage]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    if (isHomePage) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  };

  return (
    <nav className={`jh-navbar${navScrolled ? ' jh-scrolled' : ''}${!isHomePage ? ' jh-minimized' : ''}`}>
      <div className="jh-nav-container">
        <Link to="/" className="jh-logo" style={{ textDecoration: 'none' }}>Jharkhand Tourism</Link>
        <ul className={`jh-nav-menu${mobileMenuOpen ? ' jh-active' : ''}`}>
          <li><button className="jh-nav-link" onClick={() => scrollTo('jh-home')}>Home</button></li>
          <li><button className="jh-nav-link" onClick={() => scrollTo('jh-destinations')}>Destinations</button></li>
          <li><button className="jh-nav-link" onClick={() => scrollTo('jh-gallery')}>Gallery</button></li>
          <li><button className="jh-nav-link" onClick={() => scrollTo('jh-plan-trip')}>Plan Your Trip</button></li>
          <li><Link to="/guides" className="jh-nav-link" onClick={() => setMobileMenuOpen(false)}>Guides</Link></li>
          <li><Link to="/map" className="jh-nav-link" onClick={() => setMobileMenuOpen(false)}>Map</Link></li>
          <li><Link to="/jharkhand360" className="jh-nav-link" onClick={() => setMobileMenuOpen(false)}>360° View</Link></li>
          <li><Link to="/ai-assistant" className="jh-nav-link" onClick={() => setMobileMenuOpen(false)}>AI Assistant</Link></li>
          
          {isAdmin && (
            <li><Link to="/admin" className="jh-nav-link jh-admin-link" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link></li>
          )}
          {isGuide && (
            <li><Link to="/guide-dashboard" className="jh-nav-link jh-admin-link" onClick={() => setMobileMenuOpen(false)}>Guide Panel</Link></li>
          )}
          
          <li className="jh-nav-item-dropdown" ref={dropdownRef}>
            {!account ? (
              <div className="jh-dropdown-container">
                <button 
                  className="jh-nav-link jh-login-btn" 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <FaUserCircle className="me-2" size={18} /> Connect / Login <FaCaretDown className="ms-1" />
                </button>
                {dropdownOpen && (
                  <div className="jh-dropdown-menu">
                    <button className="jh-dropdown-item" onClick={() => { connectWallet(); setDropdownOpen(false); setMobileMenuOpen(false); }}>
                      <FaWallet className="me-2" style={{ color: '#8b5f4a' }} /> MetaMask Wallet
                    </button>
                    <div className="jh-dropdown-divider"></div>
                    <button className="jh-dropdown-item" onClick={() => { loginDemo(); setDropdownOpen(false); setMobileMenuOpen(false); }}>
                      <FaUser className="me-2" style={{ color: '#1f2937' }} /> Demo Tourist
                    </button>
                    <button className="jh-dropdown-item" onClick={() => { loginAdminDemo(); setDropdownOpen(false); setMobileMenuOpen(false); }}>
                      <FaUserShield className="me-2" style={{ color: '#1f2937' }} /> Demo Admin
                    </button>
                    <button className="jh-dropdown-item" onClick={() => { loginGuideDemo(); setDropdownOpen(false); setMobileMenuOpen(false); }}>
                      <FaUserShield className="me-2" style={{ color: '#1f2937' }} /> Demo Guide
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="jh-dropdown-container">
                <button 
                  className="jh-nav-link jh-profile-btn" 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="jh-avatar">
                    {isAdmin ? '🛡️' : '👤'}
                  </div>
                  <span className="jh-profile-text">
                    {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </span>
                  <FaCaretDown className="ms-1" />
                </button>
                {dropdownOpen && (
                  <div className="jh-dropdown-menu">
                    <div className="jh-dropdown-header">
                      <strong>{isAdmin ? 'Admin Portal' : 'Tourist Portal'}</strong>
                      <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>{account}</small>
                    </div>
                    <div className="jh-dropdown-divider"></div>
                    <Link to={isAdmin ? "/admin" : "/tourist"} className="jh-dropdown-item" onClick={() => { setDropdownOpen(false); setMobileMenuOpen(false); }}>
                      Dashboard
                    </Link>
                    <button className="jh-dropdown-item text-danger" onClick={() => { logout(); setDropdownOpen(false); setMobileMenuOpen(false); }}>
                      <FaSignOutAlt className="me-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        </ul>
        <div
          className={`jh-hamburger${mobileMenuOpen ? ' jh-open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span><span></span><span></span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;