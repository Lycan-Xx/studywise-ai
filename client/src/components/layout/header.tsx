import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { FaUserCircle, FaArrowLeft } from "react-icons/fa";

export function Header(): JSX.Element {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Ref to focus the first mobile nav link when panel opens
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null);

  const toggleMenu = () => setIsMenuOpen((s) => !s);
  const closeMenu = () => setIsMenuOpen(false);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus first link in mobile panel when opened
  useEffect(() => {
    if (isMenuOpen) {
      // small delay to allow panel animation
      const id = window.setTimeout(() => firstMobileLinkRef.current?.focus(), 220);
      return () => window.clearTimeout(id);
    }
  }, [isMenuOpen]);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Library", to: "/library" },
    { label: "Scores", to: "/results" },
  ];

  return (
    <header className="px-4 md:px-8 py-3">
      {/* DESKTOP */}
      <div className="hidden md:block">
        <div className="rounded-xl border border-gray-400 bg-white shadow-sm">
          <nav className="grid grid-cols-3 items-center max-w-[1200px] mx-auto h-16">
            {/* LEFT */}
            <div className="flex items-center gap-6 pl-4">
              <Link
                href="/dashboard"
                className="inline-flex flex-col items-start justify-center focus:outline-none"
                aria-current={isActive("/dashboard") ? "page" : undefined}
              >
                <span className={`text-lg font-medium ${isActive("/dashboard") ? "text-studywise-gray-900" : "text-studywise-gray-600"}`}>
                  Dashboard
                </span>
                <div className={`nav-pill mt-2 ${isActive("/dashboard") ? "nav-pill--active" : ""}`} aria-hidden />
              </Link>
            </div>

            {/* CENTER LOGO */}
            <div className="flex items-center justify-center">
              <Link href="/" className="nav-logo text-2xl font-extrabold tracking-tight">
                StudyWise AI
              </Link>
            </div>

            {/* RIGHT */}
            <div className="flex items-center justify-end gap-6 pr-4">
              {navItems.slice(1).map((item) => (
                <Link
                  href={item.to}
                  key={item.to}
                  className="inline-flex flex-col items-center focus:outline-none"
                  aria-current={isActive(item.to) ? "page" : undefined}
                >
                  <span className={`text-base font-medium ${isActive(item.to) ? "text-studywise-gray-900" : "text-studywise-gray-600"}`}>
                    {item.label}
                  </span>
                  <div className={`nav-pill mt-2 ${isActive(item.to) ? "nav-pill--active" : ""}`} aria-hidden />
                </Link>
              ))}

              {/* Avatar */}
              <Link href="/settings" className="ml-4" aria-label="Settings">
                <div className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-white">
                  <FaUserCircle size={28} className="text-studywise-gray-800" />
                </div>
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* MOBILE */}
      <div className="md:hidden">
        <div className="relative">
          <div className="rounded-xl border border-gray-200 bg-white h-14 flex items-center justify-center">
            {/* Centered Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Link href="/" className="text-lg font-semibold">
                StudyWise AI
              </Link>
            </div>

            {/* Top-right left-facing arrow (opens menu from the right) */}
            <button
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-panel"
              className="absolute right-3 top-3 w-9 h-9 rounded-md flex items-center justify-center border border-gray-200 bg-white"
              title="Open menu"
            >
              <FaArrowLeft />
            </button>
          </div>

          {/* Overlay */}
          <div
            onClick={closeMenu}
            className={`fixed inset-0 bg-black/30 z-[60] transition-opacity duration-300 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            aria-hidden={!isMenuOpen}
          />

          {/* Slide-in panel from the right */}
          <aside
            id="mobile-nav-panel"
            className={`fixed right-0 top-0 h-full w-72 z-[60] transform transition-transform duration-300 bg-white shadow-xl flex flex-col rounded-xl border border-gray-400 ${isMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
            role="dialog"
            aria-modal="true"
          >
            {/* Navigation Links */}
            <div className="p-6 flex flex-col gap-2">
              {navItems.map((it, idx) => (
                <Link
                  href={it.to}
                  key={it.to}
                  ref={idx === 0 ? firstMobileLinkRef : undefined}
                  className={`py-4 px-4 rounded-lg text-lg font-medium focus:outline-none transition-all duration-200 ${
                    isActive(it.to) 
                      ? "border-2 border-primary" 
                      : "text-studywise-gray-600 hover:bg-gray-50 hover:text-studywise-gray-900"
                  }`}
                  onClick={closeMenu}
                  aria-current={isActive(it.to) ? "page" : undefined}
                >
                  {it.label}
                </Link>
              ))}
            </div>

            {/* Bottom profile */}
            <div className="mt-auto p-6 border-t border-gray-100">
              <Link 
                href="/settings" 
                className={`flex items-center gap-3 p-4 rounded-lg transition-all duration-200 ${
                  isActive("/settings") 
                    ? "bg-primary text-white" 
                    : "text-studywise-gray-600 hover:bg-gray-50 hover:text-studywise-gray-900"
                }`}
                onClick={closeMenu}
              >
                <div className={`w-10 h-10 rounded-md border flex items-center justify-center ${
                  isActive("/settings") 
                    ? "border-white/20 bg-white/10" 
                    : "border-gray-200 bg-white"
                }`}>
                  <FaUserCircle 
                    size={22} 
                    className={isActive("/settings") ? "text-white" : "text-studywise-gray-800"} 
                  />
                </div>
                <span className="font-medium">Settings</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </header>
  );
}