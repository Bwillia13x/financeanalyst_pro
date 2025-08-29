import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../app.js';

const prisma = new PrismaClient();

describe('Auth Routes', () => {
  let server;

  beforeAll(async () => {
    // Clean up database before tests
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up database after tests
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up users before each test
    await prisma.user.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toMatchObject({
        email: userData.email,
        name: userData.name,
        role: 'analyst'
      });
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    test('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should reject registration with short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Test User'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          name: 'Login Test User'
        });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    test('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should work in demo mode', async () => {
      // Set demo mode
      process.env.DEMO_MODE = 'true';

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@financeanalyst.pro',
          password: 'anypassword'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.demoMode).toBe(true);
      expect(response.body.user.email).toBe('demo@financeanalyst.pro');

      // Reset demo mode
      delete process.env.DEMO_MODE;
    });
  });

  describe('POST /api/auth/refresh', () => {
    let validRefreshToken;

    beforeEach(async () => {
      // Create user and get refresh token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'password123',
          name: 'Refresh Test User'
        });
      
      validRefreshToken = registerResponse.body.refreshToken;
    });

    test('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: validRefreshToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.accessToken).not.toBe(validRefreshToken);
    });

    test('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });

    test('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let validRefreshToken;

    beforeEach(async () => {
      // Create user and get refresh token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'password123',
          name: 'Logout Test User'
        });
      
      validRefreshToken = registerResponse.body.refreshToken;
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: validRefreshToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });

    test('should handle logout without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
