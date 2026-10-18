const SupportAction = require('../models/SupportAction');
const Barrier = require('../models/Barrier');
const AuditLog = require('../models/AuditLog');
const { assessPatientPrioritization } = require('../services/prioritizationService');

// GET /api/v1/support-actions
exports.getSupportActions = async (req, res) => {
  try {
    const { patientId, status, priority, assignedTo, limit = 50 } = req.query;
    const query = {};

    if (patientId) {
      query.$or = [{ patient: patientId }, { patientId }];
    }
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    const actions = await SupportAction.find(query)
      .populate('patient', 'name patientId patientCode treatmentProgram phone contactInfo')
      .populate('relatedBarrier')
      .populate('assignedTo', 'name role email phone')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: actions.length, actions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/support-actions
exports.createSupportAction = async (req, res) => {
  try {
    const {
      patientId,
      relatedBarrierId,
      actionType,
      title,
      suggestedAction,
      recommendationReason,
      assignedTo,
      assignedTeam,
      priority,
      dueDate,
      notes
    } = req.body;

    if (!patientId || !suggestedAction) {
      return res.status(400).json({
        success: false,
        message: 'patientId and suggestedAction are required'
      });
    }

    const action = new SupportAction({
      patient: patientId,
      patientId,
      relatedBarrier: relatedBarrierId,
      actionType: actionType || 'custom_support',
      title: title || 'Patient Support Action',
      suggestedAction,
      recommendationReason: recommendationReason || 'Staff initiated support plan',
      assignedTo: assignedTo || req.user?._id,
      assignedTeam: assignedTeam || 'Primary Care Outreach Team',
      status: 'accepted',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes,
      createdBy: req.user?._id
    });

    await action.save();

    res.status(201).json({ success: true, supportAction: action });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/support-actions/:id/status
exports.updateSupportActionStatus = async (req, res) => {
  try {
    const { status, outcomeNotes, reasonNotCompleted, modifiedAction } = req.body;
    const action = await SupportAction.findById(req.params.id);

    if (!action) {
      return res.status(404).json({ success: false, message: 'Support action not found' });
    }

    if (modifiedAction) {
      action.suggestedAction = modifiedAction;
    }

    if (status) {
      action.status = status;
    }

    if (status === 'completed') {
      action.completedAt = new Date();
      action.outcome = {
        status: 'resolved',
        notes: outcomeNotes || 'Action completed successfully.',
        recordedBy: req.user?._id,
        recordedAt: new Date()
      };

      // Also mark linked barrier resolved
      if (action.relatedBarrier) {
        await Barrier.findByIdAndUpdate(action.relatedBarrier, {
          status: 'resolved',
          resolvedAt: new Date()
        });
      }
    } else if (status === 'unable_to_complete') {
      action.completedAt = new Date();
      action.outcome = {
        status: 'resource_unavailable',
        reasonNotCompleted: reasonNotCompleted || 'Action could not be executed due to constraints.',
        recordedBy: req.user?._id,
        recordedAt: new Date()
      };
    }

    await action.save();

    // Reassess risk score
    await assessPatientPrioritization(action.patient).catch(() => {});

    await AuditLog.create({
      actor: req.user?._id,
      action: `SUPPORT_ACTION_${(status || 'UPDATED').toUpperCase()}`,
      entityType: 'SupportAction',
      entityId: action._id.toString(),
      details: { status, outcomeNotes, reasonNotCompleted }
    }).catch(() => {});

    res.json({ success: true, supportAction: action });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/support-actions/:id/assign
exports.assignSupportAction = async (req, res) => {
  try {
    const { assignedTo, assignedTeam } = req.body;
    const action = await SupportAction.findById(req.params.id);

    if (!action) {
      return res.status(404).json({ success: false, message: 'Support action not found' });
    }

    if (assignedTo) action.assignedTo = assignedTo;
    if (assignedTeam) action.assignedTeam = assignedTeam;
    if (action.status === 'suggested') action.status = 'accepted';

    await action.save();

    res.json({ success: true, supportAction: action });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
