import React, { useState } from 'react';
import {
  Bot,
  MessageSquare,
  HelpCircle,
  Ticket as TicketIcon,
  Search,
  Shield,
  Menu,
  X,
  BookOpen,
  User,
  UserPlus,
  LogOut
} from 'lucide-react';
import { CustomerUser } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin?: () => void;
  currentCustomer?: CustomerUser | null;
  onLogoutCustomer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdminLoggedIn,
  onLogoutAdmin,
  currentCustomer,
  onLogoutCustomer,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home', icon: Bot },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'ticket', label: 'New Ticket', icon: TicketIcon },
    { id: 'track', label: 'Track Ticket', icon: Search },
    ...(currentCustomer ? [{ id: 'portal', label: 'My Tickets', icon: User }] : []),
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md py-1"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                OmniSupport Agent
              </span>
              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap -mt-0.5">
                AI Customer Service
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Auth controls */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              title="FastAPI Swagger Documentation"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Swagger API</span>
            </a>

            {/* Customer Auth State */}
            {currentCustomer ? (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 pl-2.5 rounded-xl">
                <button
                  onClick={() => handleNavClick('portal')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-blue-600"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {currentCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[110px]">{currentCustomer.name}</span>
                </button>
                {onLogoutCustomer && (
                  <button
                    onClick={onLogoutCustomer}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('auth')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap border ${
                  activeTab === 'auth'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>Sign Up / Login</span>
              </button>
            )}

            {/* Admin Portal Button */}
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs whitespace-nowrap ${
                    activeTab === 'admin'
                      ? 'bg-blue-600 text-white shadow-blue-200'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
                {onLogoutAdmin && (
                  <button
                    onClick={onLogoutAdmin}
                    className="p-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Logout Staff"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-blue-600 text-white shadow-blue-200'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg text-left ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {link.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {!currentCustomer ? (
              <button
                onClick={() => handleNavClick('auth')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
              >
                <UserPlus className="w-4 h-4" />
                Sign Up / Login (Customer)
              </button>
            ) : (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-xs font-semibold text-slate-700">{currentCustomer.name}</span>
                {onLogoutCustomer && (
                  <button onClick={onLogoutCustomer} className="text-xs text-rose-600 font-medium">
                    Sign Out
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => handleNavClick('admin')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
            >
              <Shield className="w-4 h-4" />
              {isAdminLoggedIn ? 'Admin Console' : 'Admin Login'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
