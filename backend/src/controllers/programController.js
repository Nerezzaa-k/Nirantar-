const TreatmentProgram = require('../models/TreatmentProgram');
const Patient = require('../models/Patient');

// GET /api/v1/programs
exports.getPrograms = async (req, res) => {
  try {
    const programs = await TreatmentProgram.find().sort({ name: 1 });
    res.json({ success: true, count: programs.length, programs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/programs/:id
exports.getProgramById = async (req, res) => {
  try {
    const program = await TreatmentProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Treatment program not found' });
    }

    const patientCount = await Patient.countDocuments({
      treatmentProgram: new RegExp(program.name, 'i')
    });

    res.json({ success: true, program, activeEnrolledPatients: patientCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/programs
exports.createProgram = async (req, res) => {
  try {
    const {
      programCode,
      name,
      department,
      description,
      defaultFollowUpIntervalDays,
      appointmentTypes,
      applicableBarrierCategories,
      prioritizationRules,
      supportActionTemplates
    } = req.body;

    if (!programCode || !name || !department) {
      return res.status(400).json({
        success: false,
        message: 'programCode, name, and department are required'
      });
    }

    const program = new TreatmentProgram({
      programCode: programCode.toUpperCase(),
      name,
      department,
      description,
      defaultFollowUpIntervalDays: defaultFollowUpIntervalDays || 30,
      appointmentTypes: appointmentTypes || ['Routine Follow-up', 'Medication Refill'],
      applicableBarrierCategories: applicableBarrierCategories || [],
      prioritizationRules,
      supportActionTemplates
    });

    await program.save();
    res.status(201).json({ success: true, program });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/programs/:id
exports.updateProgram = async (req, res) => {
  try {
    const program = await TreatmentProgram.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!program) {
      return res.status(404).json({ success: false, message: 'Treatment program not found' });
    }

    res.json({ success: true, program });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
