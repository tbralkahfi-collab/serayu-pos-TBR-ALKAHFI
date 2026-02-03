import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Mail, Store, AlertCircle, CheckCircle } from 'lucide-react';

export function LoginScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (isSignup) {
      if (!storeName.trim()) {
        setError('Nama toko harus diisi');
        setIsLoading(false);
        return;
      }
      const result = await signup(email, password, storeName);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi.');
        setEmail('');
        setPassword('');
        setStoreName('');
      }
    } else {
      const result = await login(email, password);
      if (result.error) {
        setError(result.error);
      }
    }
    setIsLoading(false);
  };

  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-secondary flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, hsl(var(--secondary)) 0%, transparent 50%)`,
        }} />
      </div>

      {/* Time display */}
      <div className="text-center mb-8 animate-fade-in">
        <p className="text-6xl font-light text-white/90 mb-2">{currentTime}</p>
        <p className="text-lg text-white/70">{currentDate}</p>
      </div>

      {/* Logo and brand */}
      <div className="text-center mb-6 animate-slide-up">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
          <span className="text-2xl font-bold text-primary">SP</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">SERAYU POS</h1>
        <p className="text-white/70 text-sm">Point of Sale System</p>
      </div>

      {/* Login/Signup form */}
      <div className="w-full max-w-sm px-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          {/* Toggle */}
          <div className="flex mb-6 bg-white/10 rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setIsSignup(false); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isSignup ? 'bg-white text-primary' : 'text-white/70 hover:text-white'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setIsSignup(true); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isSignup ? 'bg-white text-primary' : 'text-white/70 hover:text-white'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/20 text-white border border-destructive/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/20 text-white border border-secondary/30">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {isSignup && (
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <Input
                  type="text"
                  placeholder="Nama Toko"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="pl-12 h-12 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white focus:ring-white"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-12 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white focus:ring-white"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-12 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white focus:ring-white"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password || (isSignup && !storeName)}
              className="w-full h-12 bg-white hover:bg-white/90 text-primary font-semibold text-base shadow-lg transition-all"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                isSignup ? 'Daftar Sekarang' : 'Masuk'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-white/50 text-xs">
              {isSignup 
                ? 'Sudah punya akun? Klik "Masuk" di atas'
                : 'Belum punya akun? Klik "Daftar" di atas'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center">
        <p className="text-white/40 text-xs">© 2024 SERAYU POS. All rights reserved.</p>
      </div>
    </div>
  );
}
