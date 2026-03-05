import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { User, LogOut, Loader2, Pencil, KeyRound, Trash2, ChevronLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type ProfileSubView = 'overview' | 'edit' | 'password';

const AuthPanel = () => {
  const { isAuthenticated, user, login, signup, logout, isLoading } = useAuth();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-accent">
            <User className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] sm:w-[320px]">
          <SheetHeader>
            <SheetTitle className="text-foreground">Profile</SheetTitle>
          </SheetHeader>
          <ProfileView onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs px-2">
          Login
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className="text-foreground">Account</SheetTitle>
        </SheetHeader>
        <AuthForms onSuccess={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};

/* ─── Login / Signup Forms ─────────────────────────────────────────── */
const AuthForms = ({ onSuccess }: { onSuccess: () => void }) => {
  const { login, signup } = useAuth();
  const [loading, setLoading] = useState(false);

  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const [signupUser, setSignupUser] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPw, setSignupPw] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginId, loginPw);
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({ username: signupUser, email: signupEmail, password: signupPw });
      await login(signupEmail, signupPw);
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Signup failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="login" className="mt-4">
      <TabsList className="w-full">
        <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
        <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <form onSubmit={handleLogin} className="space-y-3 mt-3">
          <div>
            <Label htmlFor="login-id" className="text-xs text-muted-foreground">Email / Username</Label>
            <Input id="login-id" value={loginId} onChange={e => setLoginId(e.target.value)} required className="h-9 text-sm" />
          </div>
          <div>
            <Label htmlFor="login-pw" className="text-xs text-muted-foreground">Password</Label>
            <Input id="login-pw" type="password" value={loginPw} onChange={e => setLoginPw(e.target.value)} required className="h-9 text-sm" />
          </div>
          <Button type="submit" className="w-full gradient-bg text-primary-foreground" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="signup">
        <form onSubmit={handleSignup} className="space-y-3 mt-3">
          <div>
            <Label htmlFor="signup-user" className="text-xs text-muted-foreground">Username (6-20 chars)</Label>
            <Input id="signup-user" value={signupUser} onChange={e => setSignupUser(e.target.value)} required minLength={6} maxLength={20} className="h-9 text-sm" />
          </div>
          <div>
            <Label htmlFor="signup-email" className="text-xs text-muted-foreground">Email</Label>
            <Input id="signup-email" type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required className="h-9 text-sm" />
          </div>
          <div>
            <Label htmlFor="signup-pw" className="text-xs text-muted-foreground">Password</Label>
            <Input id="signup-pw" type="password" value={signupPw} onChange={e => setSignupPw(e.target.value)} required className="h-9 text-sm" />
            <p className="text-[10px] text-muted-foreground mt-1">Must contain uppercase, digit, and special character</p>
          </div>
          <Button type="submit" className="w-full gradient-bg text-primary-foreground" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
};

/* ─── Profile View (with sub-navigation) ───────────────────────────── */
const ProfileView = ({ onClose }: { onClose: () => void }) => {
  const { user, logout, updateProfile, changePassword, deleteAccount } = useAuth();
  const [subView, setSubView] = useState<ProfileSubView>('overview');

  if (!user) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (subView === 'edit') {
    return <EditProfileForm user={user} onBack={() => setSubView('overview')} onSave={updateProfile} />;
  }

  if (subView === 'password') {
    return <ChangePasswordForm onBack={() => setSubView('overview')} onSave={changePassword} />;
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary font-bold text-lg mx-auto">
          {user.username[0]?.toUpperCase()}
        </div>
        <p className="text-center font-medium text-foreground">{user.username}</p>
        <p className="text-center text-xs text-muted-foreground">{user.email}</p>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between py-1.5 border-b border-border">
          <span className="text-muted-foreground">User ID</span>
          <span className="text-foreground font-mono text-[10px]">{user.uid.slice(0, 8)}...</span>
        </div>
        {user.phone_num && (
          <div className="flex justify-between py-1.5 border-b border-border">
            <span className="text-muted-foreground">Phone</span>
            <span className="text-foreground">{user.phone_num}</span>
          </div>
        )}
        <div className="flex justify-between py-1.5 border-b border-border">
          <span className="text-muted-foreground">Status</span>
          <span className={user.disabled ? 'text-destructive' : 'text-accent'}>{user.disabled ? 'Disabled' : 'Active'}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start text-xs h-9" onClick={() => setSubView('edit')}>
          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Profile
        </Button>
        <Button variant="outline" className="w-full justify-start text-xs h-9" onClick={() => setSubView('password')}>
          <KeyRound className="h-3.5 w-3.5 mr-2" /> Change Password
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-xs h-9 text-destructive border-destructive/30 hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is permanent and cannot be undone. All of your data, analyzed clothes, and designs will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  try {
                    await deleteAccount();
                    onClose();
                  } catch (err) {
                    const msg = err instanceof ApiError ? err.message : 'Delete failed';
                    toast({ title: 'Error', description: msg, variant: 'destructive' });
                  }
                }}
              >
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
};

/* ─── Edit Profile Sub-View ────────────────────────────────────────── */
const EditProfileForm = ({
  user,
  onBack,
  onSave,
}: {
  user: { username: string; email: string; phone_num?: string };
  onBack: () => void;
  onSave: (data: { username?: string; email?: string; phone_num?: string }) => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone_num || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ username, email, phone_num: phone || undefined });
      onBack();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Update failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to profile
      </button>
      <h3 className="text-sm font-semibold text-foreground mb-3">Edit Profile</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="edit-username" className="text-xs text-muted-foreground">Username</Label>
          <Input id="edit-username" value={username} onChange={e => setUsername(e.target.value)} required minLength={6} maxLength={20} className="h-9 text-sm" />
        </div>
        <div>
          <Label htmlFor="edit-email" className="text-xs text-muted-foreground">Email</Label>
          <Input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-9 text-sm" />
        </div>
        <div>
          <Label htmlFor="edit-phone" className="text-xs text-muted-foreground">Phone (optional)</Label>
          <Input id="edit-phone" value={phone} onChange={e => setPhone(e.target.value)} className="h-9 text-sm" placeholder="+1234567890" />
        </div>
        <Button type="submit" className="w-full gradient-bg text-primary-foreground h-9 text-xs" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
};

/* ─── Change Password Sub-View ─────────────────────────────────────── */
const ChangePasswordForm = ({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: (password: string) => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await onSave(password);
      onBack();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Password change failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to profile
      </button>
      <h3 className="text-sm font-semibold text-foreground mb-3">Change Password</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="new-pw" className="text-xs text-muted-foreground">New Password</Label>
          <Input id="new-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="h-9 text-sm" />
          <p className="text-[10px] text-muted-foreground mt-1">Must contain uppercase, digit, and special character</p>
        </div>
        <div>
          <Label htmlFor="confirm-pw" className="text-xs text-muted-foreground">Confirm Password</Label>
          <Input id="confirm-pw" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="h-9 text-sm" />
        </div>
        <Button type="submit" className="w-full gradient-bg text-primary-foreground h-9 text-xs" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
        </Button>
      </form>
    </div>
  );
};

export default AuthPanel;
