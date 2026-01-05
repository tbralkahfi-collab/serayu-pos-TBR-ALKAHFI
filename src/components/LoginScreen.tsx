import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, User, AlertCircle } from 'lucide-react';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const success = login(username, password);
    if (!success) {
      setError('Username atau password salah');
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
      <div className="text-center mb-12 animate-fade-in">
        <p className="text-7xl font-light text-white/90 mb-2">{currentTime}</p>
        <p className="text-xl text-white/70">{currentDate}</p>
      </div>

      {/* Logo and brand */}
      <div className="text-center mb-8 animate-slide-up">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
          <span className="text-3xl font-bold text-primary">SP</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">SERAYU POS</h1>
        <p className="text-white/70">Point of Sale System</p>
      </div>

      {/* Login form */}
      <div className="w-full max-w-sm px-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/20 text-white border border-white/30">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-12 h-14 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white focus:ring-white"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white focus:ring-white"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full h-14 bg-white hover:bg-white/90 text-primary font-semibold text-lg shadow-lg transition-all"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Default: admin / admin123
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-white/40 text-sm">© 2024 SERAYU POS. All rights reserved.</p>
      </div>
    </div>
  );
}