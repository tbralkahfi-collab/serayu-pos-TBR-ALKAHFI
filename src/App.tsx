import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { DataProvider } from "@/contexts/DataContext";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
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
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
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
