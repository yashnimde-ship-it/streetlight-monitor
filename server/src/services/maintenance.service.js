import { MaintenanceLog } from '../models/MaintenanceLog.js';

// Applies an inspection/repair to a light and writes the matching log entry.
export async function recordMaintenance(light, { status, date, issue = '', action = '', performedBy = '', notes = '' }) {
  const when = date ?? new Date();
  const statusBefore = light.status;
  const statusAfter = status ?? light.status;

  if (statusAfter !== statusBefore) light.statusChangedAt = when;
  light.status = statusAfter;
  light.lastInspectedOn = when;
  await light.save();

  const log = await MaintenanceLog.create({
    light: light._id,
    date: when,
    issue,
    action,
    statusBefore,
    statusAfter,
    performedBy,
    notes,
  });

  return { light, log };
}
