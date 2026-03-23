import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const goBack = () => {
    navigate(-1);
  };

  const goHome = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-primary">404</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Halaman Tidak Ditemukan</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Oops! Halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
          <div className="text-sm text-muted-foreground">
            Route: <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={goBack} variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <Button onClick={goHome} className="w-full sm:w-auto">
            <Home className="w-4 h-4 mr-2" />
            Beranda
          </Button>
        </div>
        
        <div className="mt-6 text-xs text-muted-foreground">
          Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator.
        </div>
      </div>
    </div>
  );
};

export default NotFound;
