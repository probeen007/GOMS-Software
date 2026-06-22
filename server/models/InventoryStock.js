import mongoose from 'mongoose';

const inventoryStockSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    supplierName: {
      type: String,
      trim: true,
      default: ''
    },
    qty: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity cannot be negative']
    },
    minQty: {
      type: Number,
      required: true,
      default: 5,
      min: [0, 'Minimum quantity cannot be negative']
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit selling price is required'],
      min: [0, 'Unit price cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Index Name for quick text search lookup
inventoryStockSchema.index({ name: 'text' });

const InventoryStock = mongoose.model('InventoryStock', inventoryStockSchema);

export default InventoryStock;
