import React, { useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';
import { 
  Building, 
  Layers, 
  Bed, 
  Sparkles, 
  Percent, 
  Calendar, 
  Menu, 
  X, 
  LogOut,
  ChevronDown,
  Shield,
  Key,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  UserCog,
  Grid,
  Settings,
  Tag,
  Megaphone,
  Sliders
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const textTitle = 'HOTEL SYSTEM';
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'US';

  // Navigation items mapping
  const navItems: NavItem[] = [
    { name: 'Hotel', path: '/admin/hotels', icon: Building },
    { name: 'Room Types', path: '/admin/room-types', icon: Layers },
    { name: 'Room Beds', path: '/admin/room-beds', icon: Bed },
    { name: 'Room Features', path: '/admin/room-features', icon: Sparkles },
    { name: 'Room Instances', path: '/admin/room-instances', icon: Grid },
    { name: 'Hotel Room Types', path: '/admin/hotel-room-types', icon: Settings },
    { name: 'Catalog Items', path: '/admin/catalog-items', icon: PackageIcon },
    { name: 'VAT Rules', path: '/admin/vat-rules', icon: Percent },
    { name: 'Tax Categories', path: '/admin/tax-categories', icon: Layers },
    { name: 'Age Policies', path: '/admin/age-policies', icon: Users },
    { name: 'Holiday Calendars', path: '/admin/holiday-calendars', icon: Calendar },
    { name: 'Pricing Rules', path: '/admin/pricing-rules', icon: Tag },
    { name: 'Campaigns', path: '/admin/campaigns', icon: Megaphone },
    { name: 'Discount Rules', path: '/admin/discount-rules', icon: Percent },
    { name: 'Surcharge Rules', path: '/admin/surcharge-rules', icon: Tag },
    { name: 'Pricing Rule Types', path: '/admin/pricing-rule-types', icon: Sliders },
    { name: 'Discount Rule Types', path: '/admin/discount-rule-types', icon: Sliders },
    { name: 'Roles', path: '/admin/roles', icon: Shield },
    { name: 'Permissions', path: '/admin/permissions', icon: Key },
    { name: 'Staff', path: '/admin/staffs', icon: UserCog },
    { name: 'Guests', path: '/admin/guests', icon: Users },
  ];

  // Custom package wrapper for Lucide react matching package layout
  function PackageIcon(props: { className?: string }) {
    return <Building {...props} />;
  }

  // Helper to determine active page title
  const getPageTitle = (): string => {
    const currentPath = location.pathname;
    const matchedItem = navItems.find(item => currentPath.startsWith(item.path));
    return matchedItem ? matchedItem.name : 'Dashboard';
  };

  const toggleSidebar = (): void => setIsSidebarOpen(!isSidebarOpen);
  const toggleProfile = (): void => setIsProfileOpen(!isProfileOpen);

  return (
    <div className="min-h-screen bg-neutral-50 flex text-neutral-900 font-sans">
      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-65 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      {/* Mobile Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="overflow-y-auto flex-1">
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 bg-white sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white font-bold text-lg">
                H
              </div>
              <span className="font-extrabold text-lg text-black tracking-wider uppercase">{textTitle}</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-md text-neutral-600 hover:text-black hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-red-600
                    ${isActive 
                      ? 'text-red-600 bg-red-50/55 border-l-4 border-red-600 font-bold' 
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer in Sidebar */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
          <p>© 2026 Hotel System</p>
          <p className="mt-1 font-semibold text-neutral-700">Admin Control Panel</p>
        </div>
      </aside>

      {/* Desktop Sidebar (Always Visible on lg:) */}
      <aside className={`
        hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 bg-white border-r border-neutral-200 justify-between
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
        <div className="overflow-y-auto flex-1">
          {/* Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-neutral-200 bg-white sticky top-0 z-10 overflow-hidden">
            <div className="flex items-center space-x-3 whitespace-nowrap">
              <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                H
              </div>
              <span className={`font-extrabold text-lg text-black tracking-wider uppercase transition-opacity duration-200
                ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
              `}>
                Hotel System
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center px-4 py-3 rounded-md text-sm font-medium transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-red-600
                    ${isSidebarCollapsed ? 'justify-center space-x-0' : 'space-x-3'}
                    ${isActive 
                      ? 'text-red-600 bg-red-50/50 border-l-4 border-red-600 font-bold' 
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                    }
                  `}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`transition-opacity duration-200 whitespace-nowrap
                    ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
                  `}>
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer in Sidebar */}
        <div className={`p-4 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-500 overflow-hidden transition-all duration-300
          ${isSidebarCollapsed ? 'text-center' : ''}
        `}>
          {isSidebarCollapsed ? (
            <span className="font-extrabold text-red-600">CP</span>
          ) : (
            <>
              <p className="whitespace-nowrap">© 2026 Hotel System</p>
              <p className="mt-1 font-semibold text-neutral-700 whitespace-nowrap">Admin Control Panel</p>
            </>
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className={`
        flex-grow flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
      `}>
        {/* HEADER */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-neutral-600 hover:text-black hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-600"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex border border-red-600 text-red-600 bg-white rounded-lg p-2 hover:bg-red-50 hover:text-red-700 transition-all focus:outline-none"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
            <h1 className="text-xl font-bold text-black tracking-tight flex items-center space-x-2">
              <span className="text-neutral-400 font-normal">Admin /</span>
              <span>{getPageTitle()}</span>
            </h1>
          </div>

          {/* Right: User Profile Menu */}
          <div className="relative">
            <button
              onClick={toggleProfile}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {userInitials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-neutral-900 leading-tight">{user?.fullName || 'User Session'}</p>
                <p className="text-[10px] text-neutral-500 leading-none">@{user?.username || 'user'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </button>

            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-md shadow-lg z-20 py-1 text-sm">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="font-semibold text-black leading-snug">{user?.fullName || 'User Session'}</p>
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider">{user?.role || 'STAFF'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-red-600 flex items-center space-x-2 focus:outline-none focus:bg-neutral-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
