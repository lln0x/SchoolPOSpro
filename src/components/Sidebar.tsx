import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  History as HistoryIcon, 
  Settings, 
  X, 
  Menu,
  Wallet,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  userRole: UserRole;
  businessName: string;
  logo?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  userRole,
  businessName,
  logo
}) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Panel Control', roles: ['Admin'] },
    { id: 'pos', icon: ShoppingCart, label: 'Punto de Venta', roles: ['Admin', 'Seller'] },
    { id: 'inventory', icon: Package, label: 'Inventario', roles: ['Admin', 'Warehouse'] },
    { id: 'clients', icon: Users, label: 'Clientes', roles: ['Admin', 'Seller'] },
    { id: 'expenses', icon: Wallet, label: 'Egresos', roles: ['Admin'] },
    { id: 'partners', icon: UserPlus, label: 'Socios', roles: ['Admin'] },
    { id: 'history', icon: HistoryIcon, label: 'Historial', roles: ['Admin', 'Seller'] },
    { id: 'settings', icon: Settings, label: 'Configuración', roles: ['Admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 80,
          x: isMobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0)
        }}
        className={cn(
          "bg-app-card border-r border-app flex flex-col fixed lg:sticky top-0 h-screen z-[60] overflow-hidden transition-all duration-300",
          !isMobileMenuOpen && "pointer-events-none lg:pointer-events-auto"
        )}
      >
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-app-primary rounded-xl flex items-center justify-center text-white shrink-0 overflow-hidden">
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <LayoutDashboard size={24} />
              )}
            </div>
            {isSidebarOpen && (
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-black text-xl tracking-tight text-app-main truncate"
              >
                {businessName.split(' ')[0]}<span className="text-app-primary">{businessName.split(' ').slice(1).join(' ')}</span>
              </motion.h1>
            )}
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-app-muted hover:bg-app-main rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto scrollbar-hide">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all group",
                activeTab === item.id 
                  ? "bg-app-primary-light text-app-primary" 
                  : "text-app-muted hover:bg-app-main hover:text-app-main"
              )}
            >
              <item.icon size={22} className={cn(activeTab === item.id ? "text-app-primary" : "group-hover:text-app-main")} />
              {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && <span className="font-bold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-app hidden lg:block">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-4 p-3 rounded-xl text-app-muted hover:bg-app-main transition-all"
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            {isSidebarOpen && <span className="font-bold text-sm">Contraer</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
};
