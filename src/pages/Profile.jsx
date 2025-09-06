import React, { useMemo } from 'react';

const Profile = () => {
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const token = useMemo(() => {
    try {
      return localStorage.getItem('accessToken') || null;
    } catch {
      return null;
    }
  }, []);

  const claims = useMemo(() => {
    try {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }, [token]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>

      {!user ? (
        <div className="text-sm text-muted-foreground">No user is signed in.</div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 border border-border rounded-lg bg-background">
            <div className="text-sm text-muted-foreground mb-1">User</div>
            <div className="text-foreground">{user.name || user.email}</div>
            <div className="text-xs text-muted-foreground">Role: {user.role || 'unknown'}</div>
          </div>

          <div className="p-4 border border-border rounded-lg bg-background">
            <div className="text-sm text-muted-foreground mb-1">Token</div>
            {token ? (
              <div className="text-xs break-all text-foreground-secondary">{token}</div>
            ) : (
              <div className="text-xs text-muted-foreground">No access token</div>
            )}
          </div>

          <div className="p-4 border border-border rounded-lg bg-background">
            <div className="text-sm text-muted-foreground mb-1">Claims</div>
            {claims ? (
              <pre className="text-xs whitespace-pre-wrap text-foreground-secondary">{JSON.stringify(claims, null, 2)}</pre>
            ) : (
              <div className="text-xs text-muted-foreground">No claims available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

