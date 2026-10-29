import mongoose from 'mongoose';
import { STATUSES } from '../constants.js';

const maintenanceLogSchema = new mongoose.Schema(
  {
    light: { type: mongoose.Schema.Types.ObjectId, ref: 'Streetlight', required: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    issue: { type: String, trim: true, default: '' },
    action: { type: String, trim: true, default: '' },
    statusBefore: { type: String, enum: STATUSES, required: true },
    statusAfter: { type: String, enum: STATUSES, required: true },
    performedBy: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

export const MaintenanceLog = mongoose.model('MaintenanceLog', maintenanceLogSchema);
