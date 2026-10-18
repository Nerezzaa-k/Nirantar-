const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Village name is required'],
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility',
      required: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    season: {
      type: String,
      enum: ['monsoon', 'harvest', 'winter', 'normal'],
      default: 'normal'
    },
    population: {
      type: Number,
      default: 1200
    }
  },
  {
    timestamps: true
  }
);

villageSchema.index({ district: 1, name: 1 });
villageSchema.index({ facilityId: 1 });

module.exports = mongoose.model('Village', villageSchema);
