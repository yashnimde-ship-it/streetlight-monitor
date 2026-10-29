import { z } from 'zod';
import { LAMP_TYPES, SOURCES, STATUSES } from './constants.js';

const status = z.enum(STATUSES);

// Empty strings and null both mean "no date".
const optionalDate = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.coerce.date().nullable(),
);

const text = (max) => z.string().trim().max(max).optional().default('');

const lightFields = {
  lightId: z.string().trim().min(1, 'Light ID is required').max(32),
  area: z.string().trim().min(1, 'Area is required').max(80),
  wattage: z.coerce.number().positive('Wattage must be positive').max(2000),
  lampType: z.enum(LAMP_TYPES).default('LED'),
  status: status.default('working'),
  installedOn: optionalDate,
  street: z.string().trim().max(120).optional().default(''),
  source: z.enum(SOURCES).default('manual'),
  osmId: z.preprocess((v) => (v === '' || v == null ? null : v), z.coerce.number().int().positive().nullable()).optional(),
};

const lat = z.coerce.number().min(-90).max(90);
const lng = z.coerce.number().min(-180).max(180);

export const lightCreateSchema = z.object({
  ...lightFields,
  location: z.object({ lat, lng }),
});

// Status is changed through PATCH /lights/:id/status so every change is logged.
export const lightUpdateSchema = lightCreateSchema.omit({ status: true }).partial();

// One row of an imported CSV file.
export const lightCsvRowSchema = z.object({ ...lightFields, lat, lng, source: z.enum(SOURCES).default('official') });

export const statusUpdateSchema = z.object({
  status,
  issue: text(200),
  action: text(200),
  performedBy: text(80),
  notes: text(1000),
});

export const maintenanceCreateSchema = z.object({
  lightId: z.string().trim().min(1, 'Light ID is required'),
  date: optionalDate,
  statusAfter: status.optional(),
  issue: text(200),
  action: text(200),
  performedBy: text(80),
  notes: text(1000),
});

export const settingsSchema = z
  .object({
    operatingHoursPerDay: z.coerce.number().min(0).max(24),
    tariffPerKwh: z.coerce.number().min(0).max(1000),
    co2KgPerKwh: z.coerce.number().min(0).max(5),
    ledSavingPercent: z.coerce.number().min(0).max(100),
  })
  .partial();

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
