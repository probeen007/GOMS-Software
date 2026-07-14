import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true
    },
    items: [
      {
        partId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'InventoryStock',
          required: true
        },
        qty: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1']
        },
        unitCost: {
          type: Number,
          required: true,
          min: [0, 'Unit cost cannot be negative']
        }
      }
    ],
    totalCost: {
      type: Number,
      required: true,
      min: [0, 'Total cost cannot be negative']
    },
    purchaseType: {
      type: String,
      enum: ['vat', 'non-vat'],
      default: 'non-vat'
    },
    subtotal: {
      type: Number,
      default: 0
    },
    vat: {
      type: Number,
      default: 0
    },
    billFileUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Purchase = mongoose.model('Purchase', purchaseSchema);

export default Purchase;
