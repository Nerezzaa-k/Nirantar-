const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['PHC', 'CHC', 'SubCenter', 'District Hospital'],
      default: 'PHC'
    },
    address: {
      type: String
    },
    contactPhone: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

facilitySchema.index({ district: 1, name: 1 });

module.exports = mongoose.model('Facility', facilitySchema);
