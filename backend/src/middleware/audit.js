const AuditLog = require('../models/AuditLog');

const logAudit = async (userId, action, resourceType, resourceId, relevantMetadata = {}) => {
  try {
    // Sanitize metadata to avoid leaking passwords, tokens or excessive PHI
    const sanitized = { ...relevantMetadata };
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.token;
    delete sanitized.authorization;

    await AuditLog.create({
      userId,
      action,
      resourceType,
      resourceId: resourceId ? resourceId.toString() : undefined,
      timestamp: new Date(),
      relevantMetadata: sanitized
    });
  } catch (error) {
    console.error('[AuditLog Error]', error.message);
  }
};

module.exports = { logAudit };
