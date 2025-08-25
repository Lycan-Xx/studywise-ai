import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';

export function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path: string) => {
    if (path === location) return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="navbar-header">
      <nav className="navbar">
        {/* Mobile Menu Icon (Hamburger) */}
        <div className="menu-icon" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* Navigation Links */}
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link
            href="/dashboard"
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={toggleMenu}
          >
            Dashboard
          </Link>
        </div>

        {/* Logo in the Center */}
        <div className="nav-logo">
          <Link href="/">StudyWise AI</Link>
        </div>

        {/* Right-side Navigation and Profile */}
        <div className={`nav-right ${isMenuOpen ? 'active' : ''}`}>
          <Link
            href="/library"
            className={`nav-item ${isActive('/library') ? 'active' : ''}`}
            onClick={toggleMenu}
          >
            Library
          </Link>
          <Link
            href="/results"
            className={`nav-item ${isActive('/results') ? 'active' : ''}`}
            onClick={toggleMenu}
          >
            Score
          </Link>
          <Link
            href="/settings"
            className="nav-profile"
            aria-label="User Profile"
            onClick={toggleMenu}
          >
            <FaUserCircle size={28} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
