const mongoose = require('mongoose');

const medicineStockSchema = new mongoose.Schema(
  {
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility',
      required: [true, 'Facility ID is required']
    },
    conditionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Condition',
      required: [true, 'Condition ID is required']
    },
    medicationName: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true
    },
    quantityAvailable: {
      type: Number,
      required: true,
      default: 0
    },
    unit: {
      type: String,
      default: 'tablets'
    },
    reorderThreshold: {
      type: Number,
      default: 100
    },
    isStockout: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

medicineStockSchema.pre('save', function (next) {
  this.isStockout = this.quantityAvailable <= 0;
  next();
});

medicineStockSchema.index({ facilityId: 1, medicationName: 1 });
medicineStockSchema.index({ isStockout: 1 });

module.exports = mongoose.model('MedicineStock', medicineStockSchema);
