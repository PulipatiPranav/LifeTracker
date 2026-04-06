import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Target, Moon, Smartphone, Dumbbell,
  UtensilsCrossed, Droplets, Heart, Scale, Brain, Wallet,
  Flag, Sparkles, Menu, X, ChevronLeft, Download, Upload
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/habits', icon: Target, label: 'Habits' },
  { path: '/sleep', icon: Moon, label: 'Sleep' },
  { path: '/screentime', icon: Smartphone, label: 'Screen Time' },
  { path: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { path: '/nutrition', icon: UtensilsCrossed, label: 'Nutrition' },
  { path: '/hydration', icon: Droplets, label: 'Hydration' },
  { path: '/mood', icon: Heart, label: 'Mood & Energy' },
  { path: '/body', icon: Scale, label: 'Body Metrics' },
  { path: '/focus', icon: Brain, label: 'Deep Work' },
  { path: '/finance', icon: Wallet, label: 'Finance' },
  { path: '/goals', icon: Flag, label: 'Goals' },
  { path: '/patterns', icon: Sparkles, label: 'Patterns' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { exportData, importData } = useStore();

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          if (importData(text)) {
            window.location.reload();
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:relative z-50 h-full flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-300 ease-out`}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--color-border)]">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#818cf8] to-[#6366f1] flex items-center justify-center font-bold text-white text-sm">
                  A
                </div>
                <span className="font-semibold text-lg gradient-text">Axis</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors hidden lg:flex"
          >
            <ChevronLeft
              size={18}
              className={`text-[var(--color-text-tertiary)] transition-transform duration-200 ${
                collapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-accent)]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon size={20} className="shrink-0" />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-[var(--color-border)] space-y-1">
          <button
            onClick={exportData}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <Download size={18} />
            {!collapsed && <span>Export Data</span>}
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <Upload size={18} />
            {!collapsed && <span>Import Data</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 h-14 px-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg)]/80 backdrop-blur-xl z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)]"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#818cf8] to-[#6366f1] flex items-center justify-center font-bold text-white text-xs">
              A
            </div>
            <span className="font-semibold gradient-text">Axis</span>
          </div>
        </div>

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
