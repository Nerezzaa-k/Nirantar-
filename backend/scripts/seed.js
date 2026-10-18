require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Facility = require('../src/models/Facility');
const Village = require('../src/models/Village');
const Condition = require('../src/models/Condition');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const Barrier = require('../src/models/Barrier');
const SupportAction = require('../src/models/SupportAction');
const FollowUpCase = require('../src/models/FollowUpCase');
const Notification = require('../src/models/Notification');
const TreatmentProgram = require('../src/models/TreatmentProgram');
const Visit = require('../src/models/Visit');
const MedicationRefill = require('../src/models/MedicationRefill');
const MedicineStock = require('../src/models/MedicineStock');
const CheckIn = require('../src/models/CheckIn');
const RiskScore = require('../src/models/RiskScore');
const Intervention = require('../src/models/Intervention');
const Outcome = require('../src/models/Outcome');
const AuditLog = require('../src/models/AuditLog');
const { assessPatientPrioritization } = require('../src/services/prioritizationService');

const seedData = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI missing');

    console.log('[Seed] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('[Seed] Connected successfully.');

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Facility.deleteMany({}),
      Village.deleteMany({}),
      Condition.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      Barrier.deleteMany({}),
      SupportAction.deleteMany({}),
      FollowUpCase.deleteMany({}),
      Notification.deleteMany({}),
      TreatmentProgram.deleteMany({}),
      Visit.deleteMany({}),
      MedicationRefill.deleteMany({}),
      MedicineStock.deleteMany({}),
      CheckIn.deleteMany({}),
      RiskScore.deleteMany({}),
      Intervention.deleteMany({}),
      Outcome.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // 1. Seed Treatment Programs (Multi-Department Support)
    console.log('[Seed] Seeding Treatment Programs...');
    const programs = await TreatmentProgram.insertMany([
      {
        programCode: 'DIABETES',
        name: 'Type 2 Diabetes Continuity Program',
        department: 'Endocrinology & General Medicine',
        description: 'Comprehensive glycemic control, medication adherence monitoring, and complication prevention for rural and peri-urban patients.',
        defaultFollowUpIntervalDays: 30,
        appointmentTypes: [
          'Routine Review & Vitals',
          'HbA1c & Fasting Lab',
          'Medication Refill',
          'Dietary & Lifestyle Counseling',
          'Diabetic Foot & Retinal Screening'
        ],
        applicableBarrierCategories: [
          'financial_difficulties',
          'transportation_problems',
          'medication_availability',
          'reported_side_effects',
          'forgotten_appointments',
          'scheduling_conflicts',
          'lack_of_awareness'
        ],
        prioritizationRules: {
          missedAppointmentWeight: 30,
          daysSinceFollowUpWeight: 20,
          overdueDaysWeight: 20,
          unsuccessfulContactWeight: 15,
          unresolvedBarrierWeight: 15
        },
        supportActionTemplates: [
          {
            barrierCategory: 'transportation_problems',
            suggestedAction: 'Enroll in village doorstep oral hypoglycemic delivery batch.',
            defaultAssigneeRole: 'healthcare_worker',
            urgency: 'high'
          },
          {
            barrierCategory: 'financial_difficulties',
            suggestedAction: 'Link to state Jan Aushadhi generic dispensary fee waiver.',
            defaultAssigneeRole: 'healthcare_worker',
            urgency: 'medium'
          }
        ]
      },
      {
        programCode: 'HYPERTENSION',
        name: 'Hypertension Management Program',
        department: 'Cardiovascular Care',
        description: 'Lifelong blood pressure control, sodium reduction support, and cardiovascular risk minimization.',
        defaultFollowUpIntervalDays: 30,
        appointmentTypes: [
          'Blood Pressure Checkup',
          'Antihypertensive Refill',
          'Electrolytes & Renal Panel',
          'Cardiology Consult'
        ],
        applicableBarrierCategories: [
          'financial_difficulties',
          'lack_of_awareness',
          'forgotten_appointments',
          'medication_availability'
        ],
        prioritizationRules: {
          missedAppointmentWeight: 25,
          daysSinceFollowUpWeight: 25,
          overdueDaysWeight: 20,
          unsuccessfulContactWeight: 15,
          unresolvedBarrierWeight: 15
        }
      },
      {
        programCode: 'TUBERCULOSIS',
        name: 'Tuberculosis (NTEP DOTS) Continuity',
        department: 'Pulmonology & Infectious Diseases',
        description: 'High-intensity adherence tracking to prevent multidrug-resistant tuberculosis (MDR-TB) emergence.',
        defaultFollowUpIntervalDays: 14,
        appointmentTypes: [
          'DOTS Medication Refill',
          'Sputum Smear Microscopy',
          'Chest X-Ray Review',
          'Nutritional Assessment (Nikshay)'
        ],
        applicableBarrierCategories: [
          'reported_side_effects',
          'medication_availability',
          'financial_difficulties',
          'family_personal_circumstances'
        ],
        prioritizationRules: {
          missedAppointmentWeight: 35,
          daysSinceFollowUpWeight: 20,
          overdueDaysWeight: 25,
          unsuccessfulContactWeight: 10,
          unresolvedBarrierWeight: 10
        }
      },
      {
        programCode: 'ONCOLOGY',
        name: 'Oncology Maintenance & Palliative Continuity',
        department: 'Medical Oncology',
        description: 'Chemotherapy cycle follow-up, hormonal therapy continuity, pain management, and palliative support.',
        defaultFollowUpIntervalDays: 21,
        appointmentTypes: [
          'Chemotherapy Cycle Assessment',
          'CBC & Liver Profile',
          'Hormonal Therapy Refill',
          'Pain & Symptom Management Review'
        ],
        applicableBarrierCategories: [
          'reported_side_effects',
          'transportation_problems',
          'financial_difficulties',
          'difficulty_accessing_services'
        ],
        prioritizationRules: {
          missedAppointmentWeight: 30,
          daysSinceFollowUpWeight: 20,
          overdueDaysWeight: 25,
          unsuccessfulContactWeight: 15,
          unresolvedBarrierWeight: 10
        }
      },
      {
        programCode: 'CARDIOLOGY',
        name: 'Heart Failure & Post-Infarction Care',
        department: 'Cardiology',
        description: 'Post-discharge recovery, cardiac rehabilitation, and guideline-directed medical therapy continuity.',
        defaultFollowUpIntervalDays: 30,
        appointmentTypes: [
          'Echocardiogram Review',
          'Cardiology Clinic Visit',
          'Beta-blocker/ACEi Titration',
          'Cardiac Rehab Check-in'
        ],
        applicableBarrierCategories: [
          'financial_difficulties',
          'transportation_problems',
          'reported_side_effects',
          'scheduling_conflicts'
        ],
        prioritizationRules: {
          missedAppointmentWeight: 30,
          daysSinceFollowUpWeight: 20,
          overdueDaysWeight: 20,
          unsuccessfulContactWeight: 15,
          unresolvedBarrierWeight: 15
        }
      }
    ]);

    // Also seed Condition collection for backward compatibility
    const conditions = await Condition.insertMany([
      { name: 'Type 2 Diabetes', code: 'DIABETES', refillGracePeriodDays: 5, followUpIntervalDays: 30 },
      { name: 'Hypertension', code: 'HYPERTENSION', refillGracePeriodDays: 5, followUpIntervalDays: 30 },
      { name: 'Tuberculosis (DOTS)', code: 'TUBERCULOSIS', refillGracePeriodDays: 3, followUpIntervalDays: 14 }
    ]);
    const dbCondition = conditions[0];
    const htCondition = conditions[1];
    const tbCondition = conditions[2];

    // 2. Facilities & Villages
    console.log('[Seed] Seeding Facilities & Villages...');
    const phc = await Facility.create({
      name: 'Primary Health Center Rampur',
      code: 'PHC-RAMPUR-01',
      type: 'PHC',
      district: 'Lucknow',
      latitude: 26.8520,
      longitude: 80.9490
    });

    const villages = await Village.insertMany([
      { name: 'Rampur Kalan', code: 'VIL-01', district: 'Lucknow', facilityId: phc._id, latitude: 26.8467, longitude: 80.9462, season: 'monsoon' },
      { name: 'Belhari', code: 'VIL-02', district: 'Lucknow', facilityId: phc._id, latitude: 26.8650, longitude: 80.9320, season: 'normal' },
      { name: 'Kalyanpur', code: 'VIL-03', district: 'Lucknow', facilityId: phc._id, latitude: 26.8390, longitude: 80.9650, season: 'harvest' }
    ]);

    // 3. Seed Users across all 4 Roles
    console.log('[Seed] Seeding Users for 4 Primary Roles...');
    const salt = await bcrypt.genSalt(10);
    const workerPasswordHash = await bcrypt.hash('worker123', salt);
    const patientPasswordHash = await bcrypt.hash('patient123', salt);
    const caregiverPasswordHash = await bcrypt.hash('caregiver123', salt);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);

    // Healthcare Worker
    const workerUser = await User.create({
      name: 'Sunita Verma (ASHA)',
      email: 'asha.sunita@nirantar.org',
      phone: '+91 98765 00001',
      passwordHash: workerPasswordHash,
      role: 'healthcare_worker',
      assignedFacility: 'Primary Health Center Rampur',
      assignedDepartment: 'Chronic Care & Community Health',
      assignedFacilityId: phc._id,
      assignedVillageIds: [villages[0]._id, villages[1]._id]
    });

    // Healthcare Administrator
    const adminUser = await User.create({
      name: 'Dr. Rajesh Mehta',
      email: 'admin@nirantar.org',
      phone: '+91 98765 00002',
      passwordHash: adminPasswordHash,
      role: 'admin',
      assignedFacility: 'District Health Administration Lucknow',
      assignedDepartment: 'Directorate of Non-Communicable Diseases',
      assignedFacilityId: phc._id
    });

    // Patient User (Ramesh Kumar)
    const patientUser = await User.create({
      name: 'Ramesh Kumar',
      email: 'ramesh.kumar@patient.nirantar.org',
      phone: '+91 98765 43210',
      passwordHash: patientPasswordHash,
      role: 'patient',
      assignedFacility: 'Primary Health Center Rampur',
      assignedDepartment: 'Endocrinology'
    });

    // Caregiver User (Pooja Kumar, daughter)
    const caregiverUser = await User.create({
      name: 'Pooja Kumar (Daughter)',
      email: 'pooja.kumar@caregiver.nirantar.org',
      phone: '+91 98765 43211',
      passwordHash: caregiverPasswordHash,
      role: 'caregiver',
      assignedFacility: 'Primary Health Center Rampur'
    });

    // 4. Seed Patients
    console.log('[Seed] Seeding Patients with Rich Clinical Profiles...');
    const now = new Date();

    // Patient 1: Ramesh Kumar (High Risk - Washed-out road & Transport Barrier)
    const patient1 = await Patient.create({
      patientId: 'PAT-1001',
      patientCode: 'PAT-1001',
      name: 'Ramesh Kumar',
      age: 56,
      dateOfBirth: new Date('1970-04-12'),
      gender: 'Male',
      phone: '+91 98765 43210',
      contactInfo: {
        phone: '+91 98765 43210',
        address: 'House 42, Village Rampur Kalan',
        villageOrSector: 'Rampur Kalan',
        preferredContactMethod: 'phone_call',
        preferredContactTime: 'morning'
      },
      treatmentProgram: 'Diabetes',
      healthcareFacility: {
        name: 'Primary Health Center Rampur',
        code: 'PHC-01',
        distanceKm: 8.5,
        location: { lat: 26.8520, lng: 80.9490 }
      },
      assignedWorker: workerUser._id,
      assignedWorkerId: workerUser._id,
      authorizedCaregivers: [caregiverUser._id],
      linkedCaregiverIds: [caregiverUser._id],
      villageId: villages[0]._id,
      primaryCondition: dbCondition._id,
      treatmentStartDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      lastVisitDate: new Date(Date.now() - 52 * 24 * 60 * 60 * 1000),
      nextAppointmentDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // Overdue by 16 days
      location: { lat: 26.8467, lng: 80.9462, address: 'Rampur Kalan Sector 2' },
      currentRiskScore: 78,
      currentRiskLevel: 'high',
      currentRiskCategory: 'high',
      lastAssessmentDate: now,
      consentPreferences: {
        shareWithFamily: true,
        allowSmsReminders: true,
        allowIvrCalls: true,
        allowDoorstepRefill: true,
        allowLocationSharing: true
      }
    });

    // Link user accounts
    patientUser.patientId = patient1._id;
    await patientUser.save();

    caregiverUser.linkedPatientIds = [patient1._id];
    await caregiverUser.save();

    // Patient 2: Meena Devi (Medium Risk - Financial & Scheduling Conflict)
    const patient2 = await Patient.create({
      patientId: 'PAT-1002',
      patientCode: 'PAT-1002',
      name: 'Meena Devi',
      age: 48,
      dateOfBirth: new Date('1978-08-20'),
      gender: 'Female',
      phone: '+91 98765 43212',
      contactInfo: {
        phone: '+91 98765 43212',
        address: 'Near Old Well, Village Belhari',
        villageOrSector: 'Belhari',
        preferredContactMethod: 'sms',
        preferredContactTime: 'evening'
      },
      treatmentProgram: 'Hypertension',
      healthcareFacility: {
        name: 'Primary Health Center Rampur',
        code: 'PHC-01',
        distanceKm: 4.2,
        location: { lat: 26.8520, lng: 80.9490 }
      },
      assignedWorker: workerUser._id,
      assignedWorkerId: workerUser._id,
      villageId: villages[1]._id,
      primaryCondition: htCondition._id,
      treatmentStartDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      lastVisitDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000),
      nextAppointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      location: { lat: 26.8650, lng: 80.9320, address: 'Belhari Main Road' },
      currentRiskScore: 48,
      currentRiskLevel: 'medium',
      currentRiskCategory: 'medium',
      lastAssessmentDate: now,
      consentPreferences: {
        shareWithFamily: true,
        allowSmsReminders: true,
        allowIvrCalls: true,
        allowDoorstepRefill: true,
        allowLocationSharing: true
      }
    });

    // Patient 3: Suresh Chandra (High Risk - Tuberculosis side effects & stigma)
    const patient3 = await Patient.create({
      patientId: 'PAT-1003',
      patientCode: 'PAT-1003',
      name: 'Suresh Chandra',
      age: 39,
      dateOfBirth: new Date('1987-02-15'),
      gender: 'Male',
      phone: '+91 98765 43213',
      contactInfo: {
        phone: '+91 98765 43213',
        address: 'Plot 18, Kalyanpur',
        villageOrSector: 'Kalyanpur',
        preferredContactMethod: 'home_visit',
        preferredContactTime: 'morning'
      },
      treatmentProgram: 'Tuberculosis',
      healthcareFacility: {
        name: 'Primary Health Center Rampur',
        code: 'PHC-01',
        distanceKm: 9.8,
        location: { lat: 26.8520, lng: 80.9490 }
      },
      assignedWorker: workerUser._id,
      assignedWorkerId: workerUser._id,
      villageId: villages[2]._id,
      primaryCondition: tbCondition._id,
      treatmentStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      lastVisitDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      nextAppointmentDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      location: { lat: 26.8390, lng: 80.9650, address: 'Kalyanpur East' },
      currentRiskScore: 84,
      currentRiskLevel: 'high',
      currentRiskCategory: 'high',
      lastAssessmentDate: now,
      consentPreferences: {
        shareWithFamily: false,
        allowSmsReminders: true,
        allowIvrCalls: false,
        allowDoorstepRefill: true,
        allowLocationSharing: true
      }
    });

    // Patient 4: Ananya Sen (Low Risk - Stable Oncology Maintenance)
    const patient4 = await Patient.create({
      patientId: 'PAT-1004',
      patientCode: 'PAT-1004',
      name: 'Ananya Sen',
      age: 62,
      dateOfBirth: new Date('1964-11-05'),
      gender: 'Female',
      phone: '+91 98765 43214',
      contactInfo: {
        phone: '+91 98765 43214',
        address: 'Flat 302, Civil Lines, Lucknow',
        villageOrSector: 'Civil Lines',
        preferredContactMethod: 'phone_call',
        preferredContactTime: 'afternoon'
      },
      treatmentProgram: 'Oncology',
      healthcareFacility: {
        name: 'Primary Health Center Rampur',
        code: 'PHC-01',
        distanceKm: 3.1,
        location: { lat: 26.8520, lng: 80.9490 }
      },
      assignedWorker: workerUser._id,
      assignedWorkerId: workerUser._id,
      treatmentStartDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
      lastVisitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      nextAppointmentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      location: { lat: 26.8550, lng: 80.9420, address: 'Civil Lines' },
      currentRiskScore: 18,
      currentRiskLevel: 'low',
      currentRiskCategory: 'low',
      lastAssessmentDate: now,
      consentPreferences: {
        shareWithFamily: true,
        allowSmsReminders: true,
        allowIvrCalls: true,
        allowDoorstepRefill: false,
        allowLocationSharing: true
      }
    });

    // Patient 5: Harish Patel (Low/Medium - Cardiology)
    const patient5 = await Patient.create({
      patientId: 'PAT-1005',
      patientCode: 'PAT-1005',
      name: 'Harish Patel',
      age: 65,
      dateOfBirth: new Date('1961-07-29'),
      gender: 'Male',
      phone: '+91 98765 43215',
      contactInfo: {
        phone: '+91 98765 43215',
        address: 'Sector 5, Rampur',
        villageOrSector: 'Rampur Kalan',
        preferredContactMethod: 'phone_call',
        preferredContactTime: 'morning'
      },
      treatmentProgram: 'Cardiology',
      healthcareFacility: {
        name: 'Primary Health Center Rampur',
        code: 'PHC-01',
        distanceKm: 4.8,
        location: { lat: 26.8520, lng: 80.9490 }
      },
      assignedWorker: workerUser._id,
      assignedWorkerId: workerUser._id,
      treatmentStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      lastVisitDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      nextAppointmentDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      location: { lat: 26.8480, lng: 80.9470, address: 'Sector 5' },
      currentRiskScore: 24,
      currentRiskLevel: 'low',
      currentRiskCategory: 'low',
      lastAssessmentDate: now
    });

    // 5. Seed Appointments
    console.log('[Seed] Seeding Longitudinal Appointments...');
    const apptPastCompleted = await Appointment.create({
      patient: patient1._id,
      patientId: patient1._id,
      appointmentType: 'Routine Review & Vitals',
      scheduledAt: new Date(Date.now() - 52 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 52 * 24 * 60 * 60 * 1000),
      status: 'completed',
      facility: 'Primary Health Center Rampur',
      createdBy: workerUser._id,
      notes: 'Blood glucose fasting 168 mg/dL. Prescribed Metformin 500mg. Patient attended on time.'
    });

    const apptPastMissed = await Appointment.create({
      patient: patient1._id,
      patientId: patient1._id,
      appointmentType: 'HbA1c & Fasting Lab',
      scheduledAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
      status: 'missed',
      facility: 'Primary Health Center Rampur',
      missedReason: 'Heavy monsoon rains flooded connecting culvert; no public transport available.',
      createdBy: workerUser._id,
      notes: 'Patient did not arrive. Daughter reported via check-in that bridge was underwater.'
    });

    const apptUpcoming1 = await Appointment.create({
      patient: patient2._id,
      patientId: patient2._id,
      appointmentType: 'Blood Pressure Checkup',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'scheduled',
      facility: 'Primary Health Center Rampur',
      createdBy: workerUser._id,
      notes: 'Routine monthly BP monitoring and Telmisartan refill check.'
    });

    const apptUpcoming2 = await Appointment.create({
      patient: patient4._id,
      patientId: patient4._id,
      appointmentType: 'Hormonal Therapy Refill',
      scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'scheduled',
      facility: 'Primary Health Center Rampur',
      createdBy: workerUser._id
    });

    // 6. Seed Barriers with Voice Transcripts & 10 Categories
    console.log('[Seed] Seeding Reported Patient & Caregiver Barriers...');
    const barrier1 = await Barrier.create({
      patient: patient1._id,
      patientId: patient1._id,
      relatedAppointment: apptPastMissed._id,
      category: 'transportation_problems',
      categoryLabel: 'Transportation Problems',
      description: 'The mud road connecting Rampur Kalan to the main highway was completely washed out by monsoon rains. Buses have stopped running and I cannot afford a private auto rickshaw.',
      reportedBy: caregiverUser._id,
      reporterName: 'Pooja Kumar (Daughter)',
      sourceType: 'caregiver',
      reportedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      difficultyDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
      preferredMethodOfContact: 'phone_call',
      assistanceRequested: true,
      assistanceDetails: 'Please arrange doorstep medicine delivery or let us know if an outreach van can bring Father’s diabetes tablets.',
      voiceInputUsed: true,
      voiceTranscript: 'Rasta pura toot gaya hai barish se. Papa PHC nahi ja sakte. Kripya dawai ghar bhejwa dijiye.',
      status: 'support_matched'
    });

    const barrier2 = await Barrier.create({
      patient: patient2._id,
      patientId: patient2._id,
      category: 'financial_difficulties',
      categoryLabel: 'Financial Difficulties',
      description: 'Lost 3 days of daily agricultural wages last week. Facing difficulty paying for blood pressure medicines and transport fare.',
      reportedBy: patient2._id,
      reporterName: 'Meena Devi',
      sourceType: 'patient',
      reportedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      difficultyDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      preferredMethodOfContact: 'sms',
      assistanceRequested: true,
      assistanceDetails: 'Inquire about free BPL generic medicines scheme.',
      status: 'support_matched'
    });

    const barrier3 = await Barrier.create({
      patient: patient3._id,
      patientId: patient3._id,
      category: 'reported_side_effects',
      categoryLabel: 'Reported Medication Side Effects',
      description: 'Experiencing severe morning nausea, orange urine discoloration, and joint ache after taking the 4-FDC tablets. Very scared to take the pills.',
      reportedBy: workerUser._id,
      reporterName: 'Sunita Verma (ASHA)',
      sourceType: 'healthcare_worker',
      reportedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      difficultyDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      preferredMethodOfContact: 'home_visit',
      assistanceRequested: true,
      assistanceDetails: 'Requires immediate Medical Officer clinical review and antiemetic supportive prescription.',
      status: 'support_matched'
    });

    // 7. Seed Matched Support Actions
    console.log('[Seed] Seeding Matched Support Actions...');
    const action1 = await SupportAction.create({
      patient: patient1._id,
      patientId: patient1._id,
      relatedBarrier: barrier1._id,
      actionType: 'transportation_assistance',
      title: 'Village Doorstep Refill & Outreach Delivery',
      suggestedAction: 'Dispatch ASHA Sunita with a 30-day Metformin buffer supply during the weekly Tuesday village health round.',
      recommendationReason: 'Road washed out; severe distance and lack of transport prevents clinic attendance.',
      assignedTo: workerUser._id,
      assignedTeam: 'Primary Care Outreach Team',
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdBy: workerUser._id,
      notes: 'Stock verified at PHC pharmacy; packaged for Tuesday delivery.'
    });
    barrier1.matchedSupportAction = action1._id;
    await barrier1.save();

    const action2 = await SupportAction.create({
      patient: patient2._id,
      patientId: patient2._id,
      relatedBarrier: barrier2._id,
      actionType: 'financial_assistance_review',
      title: 'State BPL Generic Subsidy Verification',
      suggestedAction: 'Review patient Ayushman Bharat / BPL card details and enroll in the 100% subsidized Jan Aushadhi generic dispensary supply.',
      recommendationReason: 'Patient reported lost agricultural wages and financial strain.',
      assignedTo: workerUser._id,
      assignedTeam: 'Patient Welfare & Social Work Team',
      status: 'accepted',
      priority: 'medium',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      createdBy: workerUser._id
    });
    barrier2.matchedSupportAction = action2._id;
    await barrier2.save();

    const action3 = await SupportAction.create({
      patient: patient3._id,
      patientId: patient3._id,
      relatedBarrier: barrier3._id,
      actionType: 'clinical_doctor_referral',
      title: 'Clinical Medical Officer Review for Adverse Effects',
      suggestedAction: 'Coordinate urgent doctor consultation with Dr. Rajesh Mehta at PHC Rampur to assess Rifampicin side-effect tolerance and provide supportive counseling.',
      recommendationReason: 'Adverse side effects reported for TB regimen; clinical evaluation required before continuing.',
      assignedTo: workerUser._id,
      assignedTeam: 'Clinical Medical Officers',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      createdBy: workerUser._id
    });
    barrier3.matchedSupportAction = action3._id;
    await barrier3.save();

    // 8. Seed Follow-up Recovery Cases
    console.log('[Seed] Seeding Follow-Up Recovery Tracker Cases...');
    const case1 = await FollowUpCase.create({
      caseNumber: 'FC-1001',
      patient: patient1._id,
      patientId: patient1._id,
      relatedAppointment: apptPastMissed._id,
      relatedBarrier: barrier1._id,
      riskScore: 78,
      riskLevel: 'high',
      contributingFactors: [
        { factor: 'Missed Appointments', points: 15, maxPoints: 30, description: '1 missed HbA1c appointment on record.' },
        { factor: 'Follow-up Interval Elapsed', points: 20, maxPoints: 20, description: '52 days since last clinic visit (Standard interval: 30 days).' },
        { factor: 'Overdue Scheduled Visit', points: 20, maxPoints: 20, description: 'Follow-up appointment overdue by 16 days.' },
        { factor: 'Reported Barriers & Assistance', points: 15, maxPoints: 15, description: 'Active transportation barrier; unresolved doorstep assistance request.' },
        { factor: 'Unsuccessful Contact Attempts', points: 8, maxPoints: 15, description: '1 previous phone call went unanswered due to tower congestion.' }
      ],
      recommendedNextAction: 'Contact patient and review transportation assistance options and doorstep refill dispatch.',
      status: 'support_assigned',
      assignedTo: workerUser._id,
      nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      isOverdue: true,
      overdueDays: 16,
      supportActions: [action1._id],
      contactAttempts: [
        {
          attemptNumber: 1,
          channel: 'phone_call',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          outcome: 'no_answer',
          notes: 'Called mobile +91 98765 43210. Rung 4 times, no answer.',
          recordedBy: workerUser._id,
          recordedByName: 'Sunita Verma (ASHA)'
        },
        {
          attemptNumber: 2,
          channel: 'phone_call',
          date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
          outcome: 'reached',
          notes: 'Spoke with daughter Pooja. She confirmed road washed out and requested doorstep medicine delivery.',
          recordedBy: workerUser._id,
          recordedByName: 'Sunita Verma (ASHA)'
        }
      ]
    });

    const case2 = await FollowUpCase.create({
      caseNumber: 'FC-1002',
      patient: patient3._id,
      patientId: patient3._id,
      relatedBarrier: barrier3._id,
      riskScore: 84,
      riskLevel: 'high',
      contributingFactors: [
        { factor: 'Missed Appointments', points: 25, maxPoints: 35, description: 'Missed DOTS medicine refill collection.' },
        { factor: 'Overdue Scheduled Visit', points: 20, maxPoints: 25, description: '8 days overdue for TB sputum monitoring.' },
        { factor: 'Reported Barriers & Assistance', points: 15, maxPoints: 15, description: 'Severe adverse side-effects reported; patient scared to swallow tablets.' },
        { factor: 'Distance to Facility', points: 14, maxPoints: 15, description: '9.8 km distance from primary center.' }
      ],
      recommendedNextAction: 'Immediate medical officer review and supportive clinical re-assurance.',
      status: 'in_progress',
      assignedTo: workerUser._id,
      nextFollowUpAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      isOverdue: true,
      overdueDays: 8,
      supportActions: [action3._id],
      contactAttempts: [
        {
          attemptNumber: 1,
          channel: 'home_visit',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          outcome: 'reached',
          notes: 'Visited patient at home. Confirmed nausea and orange urine panic. Reassured patient that orange urine is harmless Rifampicin metabolite, scheduled doctor consult.',
          recordedBy: workerUser._id,
          recordedByName: 'Sunita Verma (ASHA)'
        }
      ]
    });

    const case3 = await FollowUpCase.create({
      caseNumber: 'FC-1003',
      patient: patient5._id,
      patientId: patient5._id,
      riskScore: 24,
      riskLevel: 'low',
      contributingFactors: [
        { factor: 'Appointment Attendance', points: 0, maxPoints: 30, description: 'Attendance regular.' },
        { factor: 'Follow-up Interval', points: 10, maxPoints: 20, description: '28 of 30 days elapsed.' }
      ],
      recommendedNextAction: 'Maintain scheduled routine visits and check-in timeline.',
      status: 'follow_up_completed',
      assignedTo: workerUser._id,
      outcome: {
        status: 'recovered_to_care',
        recoveryReason: 'Patient attended routine cardiology titration clinic and collected 30-day refill.',
        recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        recordedBy: workerUser._id
      }
    });

    // 9. Seed Simulated SMS & IVR Communications
    console.log('[Seed] Seeding Simulated Communications...');
    await Notification.insertMany([
      {
        patient: patient1._id,
        patientId: patient1._id,
        relatedAppointment: apptPastMissed._id,
        relatedFollowUpCase: case1._id,
        type: 'follow_up',
        channel: 'sms',
        recipientPhone: '+91 98765 43210',
        recipientName: 'Ramesh Kumar',
        message: '[DEMO MOCK SMS] Namaste Ramesh ji. We noticed you could not attend your scheduled diabetes follow-up at PHC Rampur. If you are having transport difficulty due to monsoon roads, reply here so your ASHA worker Sunita can arrange doorstep delivery.',
        deliveryStatus: 'delivered',
        simulated: true,
        simulationDetails: { provider: 'Nirantar Simulated Telecom Gateway v3', networkLatencyMs: 180 },
        createdBy: workerUser._id,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        patient: patient1._id,
        patientId: patient1._id,
        relatedFollowUpCase: case1._id,
        type: 'support_update',
        channel: 'sms',
        recipientPhone: '+91 98765 43210',
        recipientName: 'Ramesh Kumar',
        message: '[DEMO MOCK SMS] Hello Ramesh Kumar ji, good news: Your doorstep medication delivery has been approved and scheduled for Tuesday morning with health worker Sunita Verma. Please keep your health booklet handy.',
        deliveryStatus: 'delivered',
        simulated: true,
        simulationDetails: { provider: 'Nirantar Simulated Telecom Gateway v3', networkLatencyMs: 140 },
        createdBy: workerUser._id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        patient: patient2._id,
        patientId: patient2._id,
        relatedAppointment: apptUpcoming1._id,
        type: 'appointment_reminder',
        channel: 'ivr',
        recipientPhone: '+91 98765 43212',
        recipientName: 'Meena Devi',
        message: '[DEMO MOCK IVR CALL] "Namaste Meena ji. This is an automated reminder from PHC Rampur. Your hypertension blood pressure checkup is scheduled in 3 days. Press 1 to confirm, or press 2 if you need worker assistance."',
        deliveryStatus: 'delivered',
        simulated: true,
        simulationDetails: {
          provider: 'Nirantar Mock IVR Voice Engine',
          ivrSpeechAudioUrl: '/demo-assets/mock-ivr-audio.mp3',
          networkLatencyMs: 220
        },
        createdBy: workerUser._id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ]);

    // 10. Audit Logs
    console.log('[Seed] Seeding Initial Audit Trail...');
    await AuditLog.insertMany([
      {
        actor: adminUser._id,
        actorName: 'Dr. Rajesh Mehta',
        actorRole: 'admin',
        action: 'SYSTEM_INITIALIZED',
        entityType: 'System',
        entityId: 'NIRANTAR-PROD',
        details: { message: 'Database schema initialized with 5 clinical treatment programs.' },
        ipAddress: '127.0.0.1'
      },
      {
        actor: workerUser._id,
        actorName: 'Sunita Verma (ASHA)',
        actorRole: 'healthcare_worker',
        action: 'PATIENT_ENROLLED',
        entityType: 'Patient',
        entityId: patient1._id.toString(),
        details: { patientId: 'PAT-1001', program: 'Diabetes' },
        ipAddress: '127.0.0.1'
      }
    ]);

    console.log('\n======================================================');
    console.log('🎉 NIRANTAR SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('DEMO ACCOUNTS READY TO TEST ALL 4 ROLES:');
    console.log('1. Healthcare Worker: asha.sunita@nirantar.org     / worker123');
    console.log('2. Patient:           ramesh.kumar@patient.nirantar.org / patient123');
    console.log('3. Caregiver:         pooja.kumar@caregiver.nirantar.org / caregiver123');
    console.log('4. Administrator:     admin@nirantar.org          / admin123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
