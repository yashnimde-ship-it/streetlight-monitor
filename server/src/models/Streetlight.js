import mongoose from 'mongoose';
import { LAMP_TYPES, SOURCES, STATUSES } from '../constants.js';

const streetlightSchema = new mongoose.Schema(
  {
    lightId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    area: { type: String, required: true, trim: true, index: true },
    location: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lng: { type: Number, required: true, min: -180, max: 180 },
    },
    wattage: { type: Number, required: true, min: 1 },
    lampType: { type: String, enum: LAMP_TYPES, default: 'LED' },
    status: { type: String, enum: STATUSES, default: 'working', index: true },
    // When the status last changed; used for "days pending" on open issues.
    statusChangedAt: { type: Date, default: Date.now },
    installedOn: { type: Date, default: null },
    lastInspectedOn: { type: Date, default: null },
    street: { type: String, trim: true, default: '' },
    source: { type: String, enum: SOURCES, default: 'manual' },
    osmId: { type: Number, default: null }, // OpenStreetMap node (osm) or way (estimated) id
  },
  { timestamps: true },
);

export const Streetlight = mongoose.model('Streetlight', streetlightSchema);
