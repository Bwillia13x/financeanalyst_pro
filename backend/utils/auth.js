import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-key';

/**
 * Generate JWT access token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      sub: user.id, 
      type: 'refresh' 
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Extract token from Authorization header
 */
export const extractToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};
