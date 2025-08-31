import express from 'express';

const router = express.Router();

// Standardized response helpers
const sendSuccess = (res, data, message = null, status = 200) => {
  const response = {
    success: true,
    data: data,
    ...(message && { message })
  };
  return res.status(status).json(response);
};

const sendError = (res, message, status = 500, details = null) => {
  const response = {
    success: false,
    message: message,
    ...(details && { details })
  };
  return res.status(status).json(response);
};

// Minimal mock auth endpoints for local/dev
router.post('/login', (req, res) => {
  const user = {
    id: 'dev-user-001',
    email: req.body?.email || 'dev@financeanalyst.pro',
    name: 'Development User',
    role: 'analyst'
  };

  const token = Buffer.from(
    JSON.stringify({ sub: user.id, email: user.email, iat: Date.now() / 1000 })
  ).toString('base64');
  const refreshToken = Buffer.from(
    JSON.stringify({ type: 'refresh', created: Date.now() })
  ).toString('base64');

  const authData = {
    user,
    accessToken: `dev.${token}.mock`,
    refreshToken,
    expiresIn: 3600
  };

  sendSuccess(res, authData, 'Login successful');
});

router.post('/refresh', (req, res) => {
  const token = Buffer.from(
    JSON.stringify({ sub: 'dev-user-001', email: 'dev@financeanalyst.pro', iat: Date.now() / 1000 })
  ).toString('base64');
  const refreshToken = Buffer.from(
    JSON.stringify({ type: 'refresh', rotated: Date.now() })
  ).toString('base64');

  const authData = {
    accessToken: `dev.${token}.mock`,
    refreshToken,
    expiresIn: 3600
  };

  sendSuccess(res, authData, 'Token refreshed successfully');
});

router.post('/logout', (req, res) => {
  sendSuccess(res, null, 'Logged out successfully');
});

export default router;
