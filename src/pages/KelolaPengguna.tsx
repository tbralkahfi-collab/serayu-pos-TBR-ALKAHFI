import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { UserPlus, Shield, ShieldCheck, User, Eye, EyeOff, KeyRound, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserItem {
  id: string;
  email: string;
  role: string;
  approved: boolean;
  created_at: string;
}

async function callAdminApi(action: string, params: Record<string, any>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No session');

  const res = await supabase.functions.invoke('admin-users', {
    body: { action, ...params },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (res.error) throw res.error;
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

export default function KelolaPengguna() {
  const { user } = useAuth();
  const { isSuperAdmin } = useRole();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create user form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const [isCreating, setIsCreating] = useState(false);

  // Reset password dialog
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await callAdminApi('list_users', {});
      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({ title: 'Gagal', description: 'Gagal memuat daftar pengguna', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchUsers();
  }, [isSuperAdmin]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !storeName) return;
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password minimal 6 karakter', variant: 'destructive' });
      return;
    }
    setIsCreating(true);

    try {
      await callAdminApi('create_user', {
        email,
        password,
        store_name: storeName,
        role: selectedRole,
      });

      toast({ title: 'Berhasil', description: `Akun ${selectedRole} berhasil dibuat untuk ${email}` });
      setEmail('');
      setPassword('');
      setStoreName('');
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Gagal', description: error.message || 'Gagal membuat akun', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password minimal 6 karakter', variant: 'destructive' });
      return;
    }
    setIsResetting(true);
    try {
      await callAdminApi('reset_password', { user_id: resetUserId, new_password: newPassword });
      toast({ title: 'Berhasil', description: `Password untuk ${resetEmail} berhasil direset` });
      setResetUserId(null);
      setNewPassword('');
      setShowNewPassword(false);
    } catch (error: any) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await callAdminApi('update_role', { user_id: userId, new_role: newRole });
      toast({ title: 'Berhasil', description: `Role berhasil diubah ke ${newRole}` });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    }
  };

  const handleApproval = async (userId: string, approved: boolean) => {
    try {
      await callAdminApi('approve_user', { user_id: userId, approved });
      toast({ title: 'Berhasil', description: approved ? 'Pengguna disetujui' : 'Pengguna ditolak' });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-destructive text-destructive-foreground"><ShieldCheck className="w-3 h-3 mr-1" />Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-primary text-primary-foreground"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      default:
        return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />User</Badge>;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Kelola Pengguna</h1>
        <Button variant="outline" size="sm" onClick={() => { setIsLoading(true); fetchUsers(); }}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Buat Akun Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                placeholder="Password (min. 6 karakter)"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input
              placeholder="Nama Toko"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'admin' | 'user')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User (View Only)</SelectItem>
              </SelectContent>
            </Select>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isCreating} className="w-full md:w-auto">
                {isCreating ? 'Membuat...' : 'Buat Akun'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terdaftar</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>
                        {u.role === 'super_admin' ? (
                          getRoleBadge(u.role)
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(newRole) => handleChangeRole(u.id, newRole)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.approved ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" /> Disetujui
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-500/10">
                            Menunggu
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {u.role !== 'super_admin' && !u.approved && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:bg-green-50 h-8"
                              onClick={() => handleApproval(u.id, true)}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Setujui
                            </Button>
                          )}
                          {u.role !== 'super_admin' && u.approved && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600 hover:bg-orange-50 h-8"
                              onClick={() => handleApproval(u.id, false)}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Cabut
                            </Button>
                          )}
                          {u.role !== 'super_admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => {
                                setResetUserId(u.id);
                                setResetEmail(u.email || '');
                                setNewPassword('');
                                setShowNewPassword(false);
                              }}
                            >
                              <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUserId} onOpenChange={(open) => { if (!open) { setResetUserId(null); setNewPassword(''); setShowNewPassword(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" /> Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Reset password untuk: <span className="font-medium text-foreground">{resetEmail}</span>
            </p>
            <div className="relative">
              <Input
                placeholder="Password baru (min. 6 karakter)"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p className="text-xs text-destructive">Password minimal 6 karakter</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleResetPassword} disabled={isResetting || newPassword.length < 6}>
              {isResetting ? 'Mereset...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
