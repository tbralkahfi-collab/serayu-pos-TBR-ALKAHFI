import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { DataProvider } from "@/contexts/DataContext";
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
import Pengaturan from "./pages/Pengaturan";
import InstallApp from "./pages/InstallApp";
import ModalAwal from "./pages/akuntansi/ModalAwal";
import Neraca from "./pages/akuntansi/Neraca";
import LabaRugi from "./pages/akuntansi/LabaRugi";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
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
        <Route path="/kasir" element={<Kasir />} />
        <Route path="/produk" element={<Produk />} />
        <Route path="/pembelian" element={<Pembelian />} />
        <Route path="/proyek" element={<Proyek />} />
        <Route path="/proyek-dashboard" element={<ProyekDashboard />} />
        <Route path="/utang-piutang" element={<UtangPiutang />} />
        <Route path="/operasional" element={<Operasional />} />
        <Route path="/penjualan" element={<Penjualan />} />
        <Route path="/laporan" element={<Laporan />} />
        <Route path="/pengaturan" element={<Pengaturan />} />
        
        {/* Accounting Routes */}
        <Route path="/akuntansi/modal-awal" element={<ModalAwal />} />
        <Route path="/akuntansi/neraca" element={<Neraca />} />
        <Route path="/akuntansi/laba-rugi" element={<LabaRugi />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <StoreProvider>
          <DataProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </DataProvider>
        </StoreProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
