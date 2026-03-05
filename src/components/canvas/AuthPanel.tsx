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
import { User, LogOut, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

const AuthForms = ({ onSuccess }: { onSuccess: () => void }) => {
  const { login, signup } = useAuth();
  const [loading, setLoading] = useState(false);

  // Login
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // Signup
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
      // Auto-login after signup
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

const ProfileView = ({ onClose }: { onClose: () => void }) => {
  const { user, logout, token } = useAuth();
  if (!user) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

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
          <span className="text-foreground font-mono text-[10px]">{user.uid.slice(0, 8)}…</span>
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

      <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
};

export default AuthPanel;
