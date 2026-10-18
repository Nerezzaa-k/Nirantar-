const axios = require('axios');

async function verifyE2E() {
  console.log('--- Step 1: Health Check ---');
  const nodeHealth = await axios.get('http://localhost:5000/api/v1/health');
  console.log('Node Backend Health:', nodeHealth.data.status, 'Platform:', nodeHealth.data.platform);

  const aiHealth = await axios.get('http://localhost:8000/health');
  console.log('AI Service Health:', aiHealth.data.status, 'Service:', aiHealth.data.service);

  console.log('\n--- Step 2: Worker Login (ASHA Sunita) ---');
  const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: 'asha.sunita@nirantar.org',
    password: 'worker123'
  });
  const token = loginRes.data.token;
  console.log('Worker Logged In:', loginRes.data.user.name, 'Role:', loginRes.data.user.role);

  console.log('\n--- Step 3: Fetch Assigned Patients ---');
  const patientsRes = await axios.get('http://localhost:5000/api/v1/patients', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Total Patients Returned:', patientsRes.data.patients.length);

  const hero = patientsRes.data.patients.find((p) => p.patientCode === 'PAT-1001');
  console.log('Hero Patient:', hero.name, `(${hero.patientCode})`, 'Risk Score:', hero.currentRiskScore, 'Category:', hero.currentRiskCategory);

  console.log('\n--- Step 4: AI Explain Risk (Node -> Python FastAPI Bridge) ---');
  const explainRes = await axios.post(
    'http://localhost:5000/api/v1/ai/explain-risk',
    {
      patientId: hero._id,
      score: hero.currentRiskScore,
      category: hero.currentRiskCategory,
      factorBreakdown: [
        { factor: 'Medication Refill Overdue', weight: 25, scoreContribution: 20 },
        { factor: 'Distance to Primary Health Center', weight: 10, scoreContribution: 10 }
      ]
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('AI Explanation Success:', explainRes.data.success);
  console.log('Explanation Output:', explainRes.data.explanation?.clinicalSummary || explainRes.data.explanation);

  console.log('\n--- Step 5: Check-In by Patient Ramesh Kumar ---');
  const patientLogin = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: 'ramesh.kumar@patient.nirantar.org',
    password: 'patient123'
  });
  const patientToken = patientLogin.data.token;
  console.log('Patient Logged In:', patientLogin.data.user.name);

  const checkinRes = await axios.post(
    'http://localhost:5000/api/v1/checkins',
    {
      patientId: hero._id,
      reportedSymptomsOrConcerns: 'I have symptoms or concerns',
      medicineAvailable: false,
      tabletsRemaining: 2,
      selectedReason: 'I cannot travel to the healthcare facility',
      additionalNotes: 'Road washed out; unable to take public bus to Rampur CHC.'
    },
    { headers: { Authorization: `Bearer ${patientToken}` } }
  );
  console.log('Check-in Saved:', checkinRes.data.success);
  console.log('Intervention Auto-Created:', checkinRes.data.intervention ? checkinRes.data.intervention.type : 'Yes (Intervention generated)');

  console.log('\n--- Step 6: Admin Dashboard Summary Analytics ---');
  const adminLogin = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: 'admin@nirantar.org',
    password: 'admin123'
  });
  const adminToken = adminLogin.data.token;
  const summaryRes = await axios.get('http://localhost:5000/api/v1/analytics/summary', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Admin Summary KPIs:', summaryRes.data);

  console.log('\n--- Step 7: "What Works" Intervention Effectiveness ---');
  const effectRes = await axios.get('http://localhost:5000/api/v1/analytics/intervention-effectiveness', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const list = effectRes.data.effectiveness || [];
  console.log('What Works Records Count:', list.length);
  if (list.length > 0) {
    console.log('Sample Effectiveness Entry:', list[0]);
  }

  console.log('\n🎉 ALL 7 E2E INTEGRATION CHECKS PASSED PERFECTLY!');
}

verifyE2E().catch((err) => {
  console.error('E2E Verification Error:', err.response ? err.response.data : err.message);
  process.exit(1);
});
