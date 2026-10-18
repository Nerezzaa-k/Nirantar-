require('dotenv').config({ path: __dirname + '/../.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const Patient = require('../src/models/Patient');

let workerToken;
let adminToken;
let patientUserToken;
let rameshPatient;

beforeAll(async () => {
  await connectDB();

  // Login as ASHA Worker
  const workerRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'asha.sunita@nirantar.org',
      password: 'worker123'
    });
  expect(workerRes.status).toBe(200);
  workerToken = workerRes.body.token;

  // Login as Admin
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'admin@nirantar.org',
      password: 'admin123'
    });
  expect(adminRes.status).toBe(200);
  adminToken = adminRes.body.token;

  // Login as Patient Ramesh Kumar
  const patRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'ramesh.kumar@patient.nirantar.org',
      password: 'patient123'
    });
  expect(patRes.status).toBe(200);
  patientUserToken = patRes.body.token;

  rameshPatient = await Patient.findOne({ patientCode: 'PAT-1001' });
  expect(rameshPatient).toBeDefined();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Nirantar v3 Backend Integration & Safety Tests', () => {
  describe('Authentication & Access Control', () => {
    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@nirantar.org',
          password: 'wrongpassword'
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated requests to protected endpoints', async () => {
      const res = await request(app).get('/api/v1/patients');
      expect(res.status).toBe(401);
    });

    it('should return authenticated user profile on /auth/me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${workerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('asha.sunita@nirantar.org');
      expect(res.body.user.role).toBe('healthcare_worker');
    });
  });

  describe('Patient Risk Engine & Workflow', () => {
    it('should fetch patient list and verify Ramesh Kumar is flagged high-risk', async () => {
      const res = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${workerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.patients.length).toBeGreaterThan(0);

      const ramesh = res.body.patients.find(p => p.patientCode === 'PAT-1001');
      expect(ramesh).toBeDefined();
      expect(ramesh.currentRiskScore).toBeGreaterThanOrEqual(60);
      expect(ramesh.currentRiskCategory).toBe('high');
    });

    it('should explain the risk breakdown with factor weights', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${rameshPatient._id}/risk`)
        .set('Authorization', `Bearer ${workerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.riskScore).toBeDefined();
      expect(res.body.riskScore.factorBreakdown.length).toBeGreaterThan(0);
      expect(res.body.riskScore.score).toBe(rameshPatient.currentRiskScore);
    });
  });

  describe('Check-In, Reason-to-Action Mapping & Outcome Recording', () => {
    let createdInterventionId;

    it('should allow patient to submit weekly check-in with reason "I cannot travel"', async () => {
      const res = await request(app)
        .post('/api/v1/checkins')
        .set('Authorization', `Bearer ${patientUserToken}`)
        .send({
          patientId: rameshPatient._id,
          reportedSymptomsOrConcerns: 'I feel fine',
          medicineAvailable: true,
          tabletsRemaining: 4,
          selectedReason: 'I cannot travel to the healthcare facility',
          additionalNotes: 'Road washed out from rain, cannot take bus to PHC.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.intervention).toBeDefined();
      expect(res.body.intervention.interventionType).toBe('doorstep_refill');
      expect(res.body.intervention.recommendedAction).toContain('doorstep refill');

      createdInterventionId = res.body.intervention._id;
    });

    it('should allow healthcare worker to complete the intervention and record outcome', async () => {
      expect(createdInterventionId).toBeDefined();

      const res = await request(app)
        .post(`/api/v1/interventions/${createdInterventionId}/outcome`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          outcomeType: 'treatment_resumed',
          patientReached: true,
          treatmentResumedOrMaintained: true,
          notes: 'ASHA Sunita delivered 30-day blister pack during Wednesday outreach round. Patient resumed adherence.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.outcome.treatmentResumedOrMaintained).toBe(true);
      expect(res.body.intervention.status).toBe('completed');
    });
  });

  describe('Live Database Analytics', () => {
    it('should return aggregated live summary metrics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/summary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.metrics.totalPatients).toBeGreaterThanOrEqual(30);
      expect(res.body.metrics.highRiskCount).toBeGreaterThan(0);
    });

    it('should return dropout reasons distribution', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dropout-reasons')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.reasons)).toBe(true);
    });

    it('should return intervention effectiveness statistics with sample sizes', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/intervention-effectiveness')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.effectiveness)).toBe(true);
    });
  });
});
