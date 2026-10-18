const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Backwards compatibility
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actorName: String,
    actorRole: String,
    action: {
      type: String,
      required: true
    },
    entityType: {
      type: String
    },
    resourceType: {
      type: String
    },
    entityId: {
      type: String
    },
    resourceId: {
      type: String
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    },
    relevantMetadata: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.pre('save', function (next) {
  if (this.actor && !this.userId) this.userId = this.actor;
  if (this.userId && !this.actor) this.actor = this.userId;
  if (this.entityType && !this.resourceType) this.resourceType = this.entityType;
  if (this.resourceType && !this.entityType) this.entityType = this.resourceType;
  if (this.entityId && !this.resourceId) this.resourceId = this.entityId;
  if (this.resourceId && !this.entityId) this.entityId = this.resourceId;
  if (this.details && !this.relevantMetadata) this.relevantMetadata = this.details;
  if (this.relevantMetadata && !this.details) this.details = this.relevantMetadata;
  next();
});

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
