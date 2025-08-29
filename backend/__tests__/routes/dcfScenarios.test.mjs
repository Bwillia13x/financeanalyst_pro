import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../app.js';

const prisma = new PrismaClient();

describe('DCF Scenarios Routes', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Clean up database before tests
    await prisma.dCFScenario.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dcf@example.com',
        password: 'password123',
        name: 'DCF Test User'
      });
    
    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await prisma.dCFScenario.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up scenarios before each test
    await prisma.dCFScenario.deleteMany({});
  });

  describe('POST /api/dcf-scenarios', () => {
    test('should create new DCF scenario', async () => {
      const scenarioData = {
        name: 'AAPL Test Scenario',
        symbol: 'AAPL',
        assumptions: {
          currentRevenue: 100000000,
          projectionYears: 5,
          terminalGrowthRate: 0.025,
          discountRate: 0.12
        }
      };

      const response = await request(app)
        .post('/api/dcf-scenarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scenarioData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.scenario).toMatchObject({
        name: scenarioData.name,
        symbol: scenarioData.symbol,
        userId: userId
      });
      expect(response.body.scenario.assumptions).toEqual(scenarioData.assumptions);
    });

    test('should reject creation without auth', async () => {
      const scenarioData = {
        name: 'Test Scenario',
        symbol: 'AAPL',
        assumptions: {}
      };

      const response = await request(app)
        .post('/api/dcf-scenarios')
        .send(scenarioData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/dcf-scenarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/dcf-scenarios', () => {
    beforeEach(async () => {
      // Create test scenarios
      await prisma.dCFScenario.createMany({
        data: [
          {
            name: 'Scenario 1',
            symbol: 'AAPL',
            userId: userId,
            assumptions: { currentRevenue: 100000000 }
          },
          {
            name: 'Scenario 2', 
            symbol: 'GOOGL',
            userId: userId,
            assumptions: { currentRevenue: 200000000 }
          }
        ]
      });
    });

    test('should get user scenarios', async () => {
      const response = await request(app)
        .get('/api/dcf-scenarios')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.scenarios).toHaveLength(2);
      expect(response.body.scenarios[0]).toHaveProperty('name');
      expect(response.body.scenarios[0]).toHaveProperty('symbol');
      expect(response.body.scenarios[0]).toHaveProperty('createdAt');
    });

    test('should filter by symbol', async () => {
      const response = await request(app)
        .get('/api/dcf-scenarios?symbol=AAPL')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.scenarios).toHaveLength(1);
      expect(response.body.scenarios[0].symbol).toBe('AAPL');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/dcf-scenarios')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/dcf-scenarios/:id', () => {
    let scenarioId;

    beforeEach(async () => {
      const scenario = await prisma.dCFScenario.create({
        data: {
          name: 'Test Scenario',
          symbol: 'AAPL',
          userId: userId,
          assumptions: { currentRevenue: 100000000 },
          results: { fairValue: 150.00 }
        }
      });
      scenarioId = scenario.id;
    });

    test('should get specific scenario', async () => {
      const response = await request(app)
        .get(`/api/dcf-scenarios/${scenarioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.scenario).toMatchObject({
        name: 'Test Scenario',
        symbol: 'AAPL'
      });
      expect(response.body.scenario.assumptions).toBeDefined();
      expect(response.body.scenario.results).toBeDefined();
    });

    test('should return 404 for non-existent scenario', async () => {
      const response = await request(app)
        .get('/api/dcf-scenarios/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/dcf-scenarios/:id/compute', () => {
    let scenarioId;

    beforeEach(async () => {
      const scenario = await prisma.dCFScenario.create({
        data: {
          name: 'Test Scenario',
          symbol: 'AAPL',
          userId: userId,
          assumptions: {
            currentRevenue: 100000000,
            projectionYears: 5,
            terminalGrowthRate: 0.025,
            discountRate: 0.12,
            netIncomeMargin: 0.15,
            capexAsPercentRevenue: 0.03,
            deprecationAsPercentRevenue: 0.02,
            workingCapitalAsPercentRevenue: 0.05,
            sharesOutstanding: 1000000,
            cashAndEquivalents: 10000000,
            totalDebt: 50000000
          }
        }
      });
      scenarioId = scenario.id;
    });

    test('should compute DCF results', async () => {
      const response = await request(app)
        .post(`/api/dcf-scenarios/${scenarioId}/compute`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeDefined();
      expect(response.body.results.fairValue).toBeGreaterThan(0);
      expect(response.body.results.projections).toHaveLength(5);
      expect(response.body.results.presentValue).toBeGreaterThan(0);
      expect(response.body.results.terminalValue).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/dcf-scenarios/:id', () => {
    let scenarioId;

    beforeEach(async () => {
      const scenario = await prisma.dCFScenario.create({
        data: {
          name: 'Original Name',
          symbol: 'AAPL',
          userId: userId,
          assumptions: { currentRevenue: 100000000 }
        }
      });
      scenarioId = scenario.id;
    });

    test('should update scenario', async () => {
      const updateData = {
        name: 'Updated Name',
        assumptions: {
          currentRevenue: 200000000,
          projectionYears: 7
        }
      };

      const response = await request(app)
        .put(`/api/dcf-scenarios/${scenarioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.scenario.name).toBe('Updated Name');
      expect(response.body.scenario.assumptions.currentRevenue).toBe(200000000);
    });
  });

  describe('DELETE /api/dcf-scenarios/:id', () => {
    let scenarioId;

    beforeEach(async () => {
      const scenario = await prisma.dCFScenario.create({
        data: {
          name: 'To Delete',
          symbol: 'AAPL',
          userId: userId,
          assumptions: { currentRevenue: 100000000 }
        }
      });
      scenarioId = scenario.id;
    });

    test('should delete scenario', async () => {
      const response = await request(app)
        .delete(`/api/dcf-scenarios/${scenarioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const checkResponse = await request(app)
        .get(`/api/dcf-scenarios/${scenarioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
