import { useState } from 'react';
import { useCompany } from '@/lib/company';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { getAuthPassword } from '@/lib/storage';
import { Logo } from '@/components/Logo';

const Login = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { company: companyDetails } = useCompany();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const storedPassword = getAuthPassword();
    if (password === storedPassword) {
      localStorage.setItem('isAuthenticated', 'true');
      toast.success('Login successful!');
      navigate('/');
    } else {
      toast.error('Incorrect password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto">
            <Logo size="md" className="mx-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl">{companyDetails.companyName || 'Hard Disk Data Recovery'}</CardTitle>
            <CardDescription className="text-base">Management System</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Default password: admin123
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
