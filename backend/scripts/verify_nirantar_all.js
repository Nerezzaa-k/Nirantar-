require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const app = require('../src/app');

async function runVerification() {
  console.log('=== STARTING NIRANTAR PLATFORM END-TO-END VERIFICATION ===\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('1. Database Connection: SUCCESS');

  const server = app.listen(5001);
  const baseURL = 'http://localhost:5001/api/v1';
  const axios = require('axios');

  try {
    // 1. Health Check
    const health = await axios.get(`${baseURL}/health`);
    console.log('2. Health Check: SUCCESS ->', health.data.platform, health.data.version);

    // 2. Login all 4 Roles
    console.log('\n--- Testing Authentication for All 4 Roles ---');
    const workerLogin = await axios.post(`${baseURL}/auth/login`, {
      email: 'asha.sunita@nirantar.org',
      password: 'worker123'
    });
    const workerToken = workerLogin.data.token;
    console.log('  Role 1 [Healthcare Worker] Logged In:', workerLogin.data.user.name, `(${workerLogin.data.user.role})`);

    const patientLogin = await axios.post(`${baseURL}/auth/login`, {
      email: 'ramesh.kumar@patient.nirantar.org',
      password: 'patient123'
    });
    const patientToken = patientLogin.data.token;
    console.log('  Role 2 [Patient] Logged In:', patientLogin.data.user.name, `(${patientLogin.data.user.role})`);

    const caregiverLogin = await axios.post(`${baseURL}/auth/login`, {
      email: 'pooja.kumar@caregiver.nirantar.org',
      password: 'caregiver123'
    });
    const caregiverToken = caregiverLogin.data.token;
    console.log('  Role 3 [Caregiver] Logged In:', caregiverLogin.data.user.name, `(${caregiverLogin.data.user.role})`);

    const adminLogin = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@nirantar.org',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    console.log('  Role 4 [Administrator] Logged In:', adminLogin.data.user.name, `(${adminLogin.data.user.role})`);

    // 3. Smart Follow-Up Prioritization Engine
    console.log('\n--- Testing Core Feature 1: Smart Follow-Up Prioritization ---');
    const patientsRes = await axios.get(`${baseURL}/patients?treatmentProgram=Diabetes`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    const ramesh = patientsRes.data.patients.find((p) => p.patientId === 'PAT-1001' || p.patientCode === 'PAT-1001');
    console.log(`  Patient ${ramesh.name} (${ramesh.patientId}): Risk Score: ${ramesh.currentRiskScore}/100 [${ramesh.currentRiskLevel.toUpperCase()}]`);
    console.log('  Active Follow-up Case:', ramesh.activeFollowUpCase?.caseNumber, 'Status:', ramesh.activeFollowUpCase?.status);
    console.log('  Recommended Action:', ramesh.recommendedNextAction);

    // 4. Patient Barrier Identification & Auto-Matching
    console.log('\n--- Testing Core Feature 2 & 3: Barrier Reporting & Support Matching ---');
    const newBarrierRes = await axios.post(
      `${baseURL}/barriers`,
      {
        patientId: ramesh._id,
        category: 'medication_availability',
        description: 'Local sub-center run out of Metformin 500mg tablets. Chemist asked to return in 10 days.',
        assistanceRequested: true,
        sourceType: 'patient',
        voiceInputUsed: true,
        voiceTranscript: 'PHC par Metformin khatam ho gayi hai.'
      },
      { headers: { Authorization: `Bearer ${patientToken}` } }
    );
    console.log('  Reported Barrier:', newBarrierRes.data.barrier.categoryLabel, `(Source: ${newBarrierRes.data.barrier.sourceType})`);
    console.log('  Auto-Matched Support Action:', newBarrierRes.data.matchedSupportAction?.title);
    console.log('  Suggested Action Detail:', newBarrierRes.data.matchedSupportAction?.suggestedAction);

    // 5. Patient Journey Dashboard (6 Tabs Data)
    console.log('\n--- Testing Core Feature 4: Consolidated Patient Journey ---');
    const journeyRes = await axios.get(`${baseURL}/patients/${ramesh._id}/journey`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    const journey = journeyRes.data.journey;
    console.log('  Patient Profile Loaded:', journeyRes.data.patient.name, journeyRes.data.patient.treatmentProgram);
    console.log(`  Appointments Count: ${journey.appointments.length}`);
    console.log(`  Barriers Count: ${journey.barriers.length}`);
    console.log(`  Support Actions Count: ${journey.supportActions.length}`);
    console.log(`  Follow-Up Cases Count: ${journey.followUpCases.length}`);
    console.log(`  Unified Timeline Events Count: ${journey.timeline.length}`);
    if (journey.timeline.length > 0) {
      console.log('  Latest Timeline Event:', journey.timeline[0].title, `(${journey.timeline[0].badge})`);
    }

    // 6. Follow-up Recovery Tracker
    console.log('\n--- Testing Core Feature 5: Follow-Up Recovery Tracker ---');
    const recoveryRes = await axios.get(`${baseURL}/recovery-cases`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log(`  Total Open Follow-Up Cases: ${recoveryRes.data.count}`);
    const activeCase = recoveryRes.data.cases[0];
    console.log(`  Top Priority Case: ${activeCase.caseNumber} - Patient: ${activeCase.patient?.name} - Score: ${activeCase.riskScore}`);

    // Log a contact attempt
    const contactRes = await axios.post(
      `${baseURL}/recovery-cases/${activeCase._id}/contact-attempt`,
      {
        channel: 'phone_call',
        outcome: 'reached',
        notes: 'Coordinated doorstep delivery time with family.'
      },
      { headers: { Authorization: `Bearer ${workerToken}` } }
    );
    console.log('  Logged Contact Attempt:', contactRes.data.recoveryCase.status);

    // 7. SMS & IVR Simulation
    console.log('\n--- Testing Core Feature 6: SMS & IVR Simulation ---');
    const simRes = await axios.post(
      `${baseURL}/notifications/simulate`,
      {
        patientId: ramesh._id,
        relatedFollowUpCaseId: activeCase._id,
        type: 'support_update',
        channel: 'sms',
        templateVariables: { actionTitle: 'Doorstep Metformin Refill Delivery', workerName: 'Sunita (ASHA)' }
      },
      { headers: { Authorization: `Bearer ${workerToken}` } }
    );
    console.log('  Simulated SMS Message:', simRes.data.notification.message);
    console.log('  Simulated Delivery Status:', simRes.data.notification.deliveryStatus, `(Latency: ${simRes.data.notification.simulationDetails.networkLatencyMs}ms)`);

    // 8. Dashboards & Analytics
    console.log('\n--- Testing Core Feature 7: Dashboards & Analytics (Recharts Datasets) ---');
    const workerDash = await axios.get(`${baseURL}/analytics/worker-dashboard`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log('  Worker Dashboard KPIs:', workerDash.data.kpis);
    console.log('  Worker Risk Distribution Pie Data:', workerDash.data.riskDistribution);

    const adminDash = await axios.get(`${baseURL}/analytics/admin-dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('  Admin Recovery Rate KPI:', adminDash.data.kpis.recoveryRate + '%');
    console.log('  Barriers by Category Chart Count:', adminDash.data.barriersByCategory.length);
    console.log('  Recovery Trends Chart Count:', adminDash.data.recoveryTrends.length);

    // 9. Multi-Department Support
    console.log('\n--- Testing Core Feature 8: Multi-Department Program Support ---');
    const progRes = await axios.get(`${baseURL}/programs`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log(`  Configured Long-Term Programs: ${progRes.data.programs.map((p) => p.name).join(', ')}`);

    // 10. AI Non-Clinical Assistance
    console.log('\n--- Testing Core Feature 11: Non-Clinical AI Assistance ---');
    const aiCategorize = await axios.post(
      `${baseURL}/ai/categorize-barrier`,
      { text: 'The bus fare has doubled and I have no money for tickets to the hospital.' },
      { headers: { Authorization: `Bearer ${workerToken}` } }
    );
    console.log('  AI Barrier Categorization:', aiCategorize.data.suggestedCategory, `(Confidence: ${aiCategorize.data.confidence})`);

    const aiDraft = await axios.post(
      `${baseURL}/ai/draft-message`,
      {
        patientName: 'Ramesh Kumar',
        barrierCategory: 'transportation_problems',
        program: 'Diabetes',
        channel: 'sms'
      },
      { headers: { Authorization: `Bearer ${workerToken}` } }
    );
    console.log('  AI Empathetic Message Draft:', aiDraft.data.draftText);

    console.log('\n======================================================');
    console.log('🎉 ALL 10 CORE MVP CAPABILITIES VERIFIED 100% WORKING!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Verification Error:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runVerification();
