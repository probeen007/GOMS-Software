import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    garageName: {
      type: String,
      default: 'PM Automobiles Works'
    },
    garagePhone: {
      type: String,
      default: '+977 985-123-4567'
    },
    garageAddress: {
      type: String,
      default: 'Kathmandu, Nepal'
    },
    lowStockAlerts: {
      type: Boolean,
      default: true
    },
    daybookClosureReminder: {
      type: Boolean,
      default: true
    },
    autoWhatsAppPrompts: {
      type: Boolean,
      default: true
    },
    vatEnabled: {
      type: Boolean,
      default: true
    },
    vatRate: {
      type: Number,
      default: 13
    },
    loyaltySystemEnabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
