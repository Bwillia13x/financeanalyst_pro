import express from 'express';

const router = express.Router();

// Minimal mock auth endpoints for local/dev
router.post('/login', (req, res) => {
  const user = {
    id: 'dev-user-001',
    email: req.body?.email || 'dev@financeanalyst.pro',
    name: 'Development User',
    role: 'analyst'
  };

  const token = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, iat: Date.now() / 1000 })).toString('base64');
  const refreshToken = Buffer.from(JSON.stringify({ type: 'refresh', created: Date.now() })).toString('base64');

  res.json({
    user,
    token: `dev.${token}.mock`,
    refreshToken,
    expiresIn: 3600
  });
});

router.post('/refresh', (req, res) => {
  const token = Buffer.from(JSON.stringify({ sub: 'dev-user-001', email: 'dev@financeanalyst.pro', iat: Date.now() / 1000 })).toString('base64');
  const refreshToken = Buffer.from(JSON.stringify({ type: 'refresh', rotated: Date.now() })).toString('base64');

  res.json({
    token: `dev.${token}.mock`,
    refreshToken,
    expiresIn: 3600
  });
});

router.post('/logout', (req, res) => {
  res.status(200).json({ success: true });
});

export default router;

