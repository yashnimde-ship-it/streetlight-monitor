import { parse } from 'csv-parse/sync';
import { Streetlight } from '../models/Streetlight.js';
import { lightCsvRowSchema } from '../validation.js';

// Upserts streetlights from CSV text/buffer, keyed by lightId.
export async function importLightsFromCsv(input) {
  const records = parse(input, {
    columns: (header) => header.map((h) => h.trim()),
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  const ops = [];
  const errors = [];

  records.forEach((row, i) => {
    // Drop empty cells so schema defaults apply.
    const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== ''));
    const result = lightCsvRowSchema.safeParse(clean);
    if (!result.success) {
      errors.push({
        row: i + 2, // +1 for header, +1 for 1-based rows
        message: result.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; '),
      });
      return;
    }
    const { lat, lng, ...rest } = result.data;
    rest.lightId = rest.lightId.toUpperCase();
    ops.push({
      updateOne: {
        filter: { lightId: rest.lightId },
        update: { $set: { ...rest, location: { lat, lng } }, $setOnInsert: { statusChangedAt: new Date() } },
        upsert: true,
      },
    });
  });

  let inserted = 0;
  let updated = 0;
  if (ops.length) {
    const result = await Streetlight.bulkWrite(ops, { ordered: false });
    inserted = result.upsertedCount;
    updated = result.modifiedCount;
  }

  return {
    totalRows: records.length,
    inserted,
    updated,
    failed: errors.length,
    errors: errors.slice(0, 20),
  };
}
