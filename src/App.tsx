import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { DataProvider } from "@/contexts/DataContext";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Kasir from "./pages/Kasir";
import Produk from "./pages/Produk";
import Pembelian from "./pages/Pembelian";
import Proyek from "./pages/Proyek";
import ProyekDashboard from "./pages/ProyekDashboard";
import UtangPiutang from "./pages/UtangPiutang";
import Operasional from "./pages/Operasional";
import Penjualan from "./pages/Penjualan";
import Laporan from "./pages/Laporan";
import Akuntansi from "./pages/Akuntansi";
import Pengaturan from "./pages/Pengaturan";
import InstallApp from "./pages/InstallApp";
import KelolaPengguna from "./pages/KelolaPengguna";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { isApproved, isLoading: roleLoading, role } = useRole();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isApproved && role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Menunggu Persetujuan</h2>
          <p className="text-muted-foreground">Akun Anda sedang menunggu persetujuan dari Super Admin. Silakan hubungi administrator untuk informasi lebih lanjut.</p>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>Keluar</Button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

function RoleRoute({ children, path }: { children: React.ReactNode; path: string }) {
  const { canAccess, isLoading } = useRole();
  
  if (isLoading) return null;
  
  if (!canAccess(path)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/install" element={<InstallApp />} />
      <Route path="/install-app" element={<InstallApp />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/kasir" element={<RoleRoute path="/kasir"><Kasir /></RoleRoute>} />
        <Route path="/produk" element={<RoleRoute path="/produk"><Produk /></RoleRoute>} />
        <Route path="/pembelian" element={<RoleRoute path="/pembelian"><Pembelian /></RoleRoute>} />
        <Route path="/proyek" element={<RoleRoute path="/proyek"><Proyek /></RoleRoute>} />
        <Route path="/proyek-dashboard" element={<RoleRoute path="/proyek-dashboard"><ProyekDashboard /></RoleRoute>} />
        <Route path="/utang-piutang" element={<RoleRoute path="/utang-piutang"><UtangPiutang /></RoleRoute>} />
        <Route path="/operasional" element={<RoleRoute path="/operasional"><Operasional /></RoleRoute>} />
        <Route path="/penjualan" element={<RoleRoute path="/penjualan"><Penjualan /></RoleRoute>} />
        <Route path="/akuntansi" element={<RoleRoute path="/akuntansi"><Akuntansi /></RoleRoute>} />
        <Route path="/laporan" element={<Laporan />} />
        <Route path="/pengaturan" element={<RoleRoute path="/pengaturan"><Pengaturan /></RoleRoute>} />
        <Route path="/kelola-pengguna" element={<RoleRoute path="/kelola-pengguna"><KelolaPengguna /></RoleRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RoleProvider>
          <StoreProvider>
            <DataProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </DataProvider>
          </StoreProvider>
        </RoleProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
