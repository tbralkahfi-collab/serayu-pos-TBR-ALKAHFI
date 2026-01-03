import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ShoppingBag,
  Wallet,
  Settings as SettingsIcon,
  FileText,
  BarChart3,
  Building2,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingCart, label: 'Kasir', path: '/kasir' },
  { icon: Package, label: 'Produk', path: '/produk' },
  { icon: ShoppingBag, label: 'Pembelian', path: '/pembelian' },
  { icon: Wallet, label: 'Utang/Piutang', path: '/utang-piutang' },
  { icon: Building2, label: 'Operasional', path: '/operasional' },
  { icon: FileText, label: 'Transaksi', path: '/transaksi' },
  { icon: BarChart3, label: 'Laporan', path: '/laporan' },
  { icon: SettingsIcon, label: 'Pengaturan', path: '/pengaturan' },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { storeInfo } = useStore();
  const location = useLocation();

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {storeInfo.logo ? (
            <img
              src={storeInfo.logo}
              alt="Logo"
              className="w-12 h-12 rounded-xl object-contain"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-lg font-bold text-primary-foreground">SP</span>
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">{storeInfo.name}</h1>
            <p className="text-xs text-sidebar-foreground/60">Point of Sale</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'text-sidebar-primary-foreground')} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-accent-foreground">
              {user?.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.username}</p>
            <p className="text-xs text-sidebar-foreground/60">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </Button>
      </div>
    </aside>
  );
}
