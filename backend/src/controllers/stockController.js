const MedicineStock = require('../models/MedicineStock');
const { logAudit } = require('../middleware/audit');

// @desc    Get medicine stock across facilities
// @route   GET /api/v1/stock
// @access  Private
const getStock = async (req, res, next) => {
  try {
    const { facilityId, conditionId } = req.query;
    const filter = {};
    if (facilityId) filter.facilityId = facilityId;
    if (conditionId) filter.conditionId = conditionId;

    const stock = await MedicineStock.find(filter)
      .populate('facilityId', 'name district type')
      .populate('conditionId', 'name code')
      .sort({ quantityAvailable: 1 });

    res.json({
      success: true,
      count: stock.length,
      stock
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update medicine stock record
// @route   POST /api/v1/stock
// @access  Private (Admin / Pharmacist)
const createStock = async (req, res, next) => {
  try {
    const { facilityId, conditionId, medicationName, quantityAvailable, unit, reorderThreshold } = req.body;

    const stock = await MedicineStock.create({
      facilityId,
      conditionId,
      medicationName,
      quantityAvailable,
      unit: unit || 'tablets',
      reorderThreshold: reorderThreshold || 100,
      isStockout: Number(quantityAvailable) <= 0
    });

    await logAudit(req.user._id, 'STOCK_CREATE', 'MedicineStock', stock._id);

    res.status(201).json({
      success: true,
      stock
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stock quantity
// @route   PATCH /api/v1/stock/:id
// @access  Private (Admin / Pharmacist)
const updateStock = async (req, res, next) => {
  try {
    const { quantityAvailable } = req.body;

    const stock = await MedicineStock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock record not found' });
    }

    if (quantityAvailable !== undefined) {
      stock.quantityAvailable = quantityAvailable;
      stock.isStockout = Number(quantityAvailable) <= 0;
      stock.updatedAt = new Date();
    }

    await stock.save();
    await logAudit(req.user._id, 'STOCK_UPDATE', 'MedicineStock', stock._id, { quantityAvailable });

    res.json({
      success: true,
      stock
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStock,
  createStock,
  updateStock
};
