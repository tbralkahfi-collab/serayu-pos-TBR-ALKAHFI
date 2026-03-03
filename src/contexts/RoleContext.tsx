import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

type AppRole = 'super_admin' | 'admin' | 'user';

interface RoleContextType {
  role: AppRole | null;
  isLoading: boolean;
  isApproved: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isUser: boolean;
  canAccess: (path: string) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const USER_ROUTES = ['/dashboard', '/laporan'];
const ADMIN_ROUTES = [
  '/dashboard', '/kasir', '/produk', '/penjualan', '/pembelian',
  '/proyek', '/proyek-dashboard', '/utang-piutang', '/operasional',
  '/akuntansi', '/laporan', '/pengaturan',
];
const SUPER_ADMIN_ROUTES = [
  ...ADMIN_ROUTES, '/install', '/install-app', '/kelola-pengguna',
];

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setIsApproved(false);
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, approved')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setRole((data?.role as AppRole) || 'user');
        setIsApproved(data?.approved ?? false);
      } catch {
        setRole('user');
        setIsApproved(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const canAccess = (path: string): boolean => {
    if (!role || !isApproved) return false;
    if (role === 'super_admin') return true;
    if (role === 'admin') return ADMIN_ROUTES.includes(path);
    return USER_ROUTES.includes(path);
  };

  return (
    <RoleContext.Provider value={{
      role,
      isLoading,
      isApproved,
      isSuperAdmin: role === 'super_admin',
      isAdmin: role === 'admin' || role === 'super_admin',
      isUser: role === 'user',
      canAccess,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
