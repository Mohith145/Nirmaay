"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";

export function AppShell({
  children,
  role = null,
  showSidebar = false,
  showFooter = true,
  className = "",
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 text-ink-900 font-sans">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={
          showSidebar && role ? () => setMobileDrawerOpen(!mobileDrawerOpen) : null
        }
      />

      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        {showSidebar && role && (
          <div className="hidden lg:block flex-shrink-0">
            <Sidebar role={role} />
          </div>
        )}

        {/* Mobile Sidebar Drawer Overlay */}
        {showSidebar && role && mobileDrawerOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-xs flex"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div
              className="w-64 bg-surface-0 h-full shadow-2xl animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar role={role} onClose={() => setMobileDrawerOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main
          className={clsx(
            "flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mb-16 lg:mb-0",
            className
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {showSidebar && role && <MobileNav role={role} />}

      {/* Global Footer */}
      {showFooter && <Footer />}
    </div>
  );
}
