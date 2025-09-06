import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import secureApiClient from 'src/services/secureApiClient';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@financeanalyst.pro');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await secureApiClient.post('/auth/admin-login', { email, password });
      if (res.data?.success) {
        const { accessToken, refreshToken, user } = res.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/ai-log', { replace: true });
      } else {
        setError('Login failed');
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border border-border rounded-lg bg-background shadow-elevation-1">
      <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full px-3 py-2 border border-border rounded-md bg-background"
                 value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="w-full px-3 py-2 border border-border rounded-md bg-background"
                 value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="text-xs text-muted-foreground mt-3">For demo: admin@financeanalyst.pro / admin123</p>
    </div>
  );
};

export default AdminLogin;

