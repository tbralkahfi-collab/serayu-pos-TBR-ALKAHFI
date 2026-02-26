import React, { useState } from 'react';
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
  FolderKanban,
  Menu,
  X,
  Smartphone,
  Calculator,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingCart, label: 'Kasir', path: '/kasir' },
  { icon: Package, label: 'Produk', path: '/produk' },
  { icon: FileText, label: 'Penjualan', path: '/penjualan' },
  { icon: ShoppingBag, label: 'Pembelian', path: '/pembelian' },
  { icon: FolderKanban, label: 'Proyek', path: '/proyek' },
  { icon: BarChart3, label: 'Dashboard Proyek', path: '/proyek-dashboard' },
  { icon: Wallet, label: 'Utang/Piutang', path: '/utang-piutang' },
  { icon: Building2, label: 'Operasional', path: '/operasional' },
  { 
    icon: Calculator, 
    label: 'Akuntansi', 
    path: '/akuntansi',
    isSubmenu: true,
    subItems: [
      { icon: TrendingUp, label: 'Modal Awal', path: '/akuntansi/modal-awal' },
      { icon: FileSpreadsheet, label: 'Neraca', path: '/akuntansi/neraca' },
      { icon: BarChart3, label: 'Laba Rugi', path: '/akuntansi/laba-rugi' },
      { icon: FileText, label: 'Laporan Lengkap', path: '/laporan' },
    ]
  },
  { icon: Smartphone, label: 'Install App', path: '/install-app' },
  { icon: SettingsIcon, label: 'Pengaturan', path: '/pengaturan' },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { user, logout } = useAuth();
  const { storeInfo } = useStore();
  const location = useLocation();
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>('akuntansi');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-3">
          {storeInfo.logo ? (
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-1 flex items-center justify-center ring-2 ring-primary/20">
              <img
                src={storeInfo.logo}
                alt="Logo"
                className="w-full h-full rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-sm md:text-lg font-bold text-primary-foreground">SP</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-lg font-bold text-foreground truncate">{storeInfo.name}</h1>
            <p className="text-xs text-primary font-medium">SERAYU POS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 md:p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isSubmenuItem = item.isSubmenu;
          const isExpanded = expandedSubmenu === item.path;
          
          if (isSubmenuItem) {
            return (
              <div key={item.path} className="space-y-1">
                {/* Main menu item */}
                <button
                  onClick={() => setExpandedSubmenu(isExpanded ? null : item.path)}
                  className={cn(
                    'w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all duration-200 group',
                    isActive || location.pathname.startsWith(item.path)
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-secondary/10 hover:text-secondary'
                  )}
                >
                  <item.icon className={cn('w-4 h-4 md:w-5 md:h-5 flex-shrink-0', (isActive || location.pathname.startsWith(item.path)) && 'text-primary-foreground')} />
                  <span className="font-medium text-sm md:text-base truncate">{item.label}</span>
                  <ChevronRight className={cn('w-4 h-4 ml-auto flex-shrink-0 transition-transform', isExpanded && 'rotate-90')} />
                </button>
                
                {/* Submenu items */}
                {isExpanded && item.subItems && (
                  <div className="ml-4 md:ml-6 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          onClick={onNavClick}
                          className={cn(
                            'flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 rounded-lg transition-all duration-200 group',
                            isSubActive
                              ? 'bg-primary/20 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-secondary/5 hover:text-secondary'
                          )}
                        >
                          <subItem.icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">{subItem.label}</span>
                          {isSubActive && (
                            <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-secondary/10 hover:text-secondary'
              )}
            >
              <item.icon className={cn('w-4 h-4 md:w-5 md:h-5 flex-shrink-0', isActive && 'text-primary-foreground')} />
              <span className="font-medium text-sm md:text-base truncate">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 md:p-4 border-t border-border bg-muted/30">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 px-1 md:px-2">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary/10 flex items-center justify-center ring-2 ring-secondary/30 flex-shrink-0">
            <span className="text-xs md:text-sm font-semibold text-secondary">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-medium text-foreground truncate">{user?.email}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">User</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-2 md:gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          <span>Keluar</span>
        </Button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button - Fixed at top */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent onNavClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-bold text-foreground">SERAYU POS</span>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen bg-card flex-col border-r border-border shadow-lg sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
