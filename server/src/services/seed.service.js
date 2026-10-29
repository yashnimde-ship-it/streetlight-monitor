import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { DAY_MS } from '../constants.js';
import { MaintenanceLog } from '../models/MaintenanceLog.js';
import { Settings } from '../models/Settings.js';
import { Streetlight } from '../models/Streetlight.js';
import { User } from '../models/User.js';
import { createRandom } from '../utils/helpers.js';
import { importLightsFromCsv } from './import.service.js';

export const SEED_CSV = fileURLToPath(new URL('../../../data/streetlights.csv', import.meta.url));

const ISSUES = [
  'Lamp not glowing',
  'Flickering light',
  'Damaged fixture',
  'Loose wiring',
  'Burnt-out lamp',
  'Light stays on during daytime',
  'Broken lamp cover',
  'Pole damaged during monsoon',
];
const REPAIRS = [
  'Replaced lamp',
  'Replaced LED driver',
  'Rewired connection',
  'Replaced fixture',
  'Replaced photocell sensor',
  'Straightened pole and secured fixture',
];
const TECHNICIANS = ['S. Patil', 'R. Jadhav', 'A. Shaikh', 'M. Pawar', 'V. Kulkarni'];

/** Creates the admin, default settings and sample data. Safe to call on every start. */
export async function seedDatabase({ reset = false } = {}) {
  if (reset) {
    await Promise.all([
      Streetlight.deleteMany({}),
      MaintenanceLog.deleteMany({}),
      User.deleteMany({}),
      Settings.deleteMany({}),
    ]);
  }

  if (!(await User.exists({}))) {
    await User.create({
      name: 'Administrator',
      email: env.adminEmail,
      passwordHash: await User.hashPassword(env.adminPassword),
    });
    console.log(`[seed] admin created: ${env.adminEmail}`);
  }

  await Settings.getSingleton();

  if (await Streetlight.exists({})) return;

  const result = await importLightsFromCsv(await readFile(SEED_CSV));
  console.log(`[seed] imported ${result.inserted} streetlights (${result.failed} failed)`);
  await simulateHistory();
}

// Gives the sample lights realistic inspection dates and maintenance history relative to today.
async function simulateHistory() {
  const rnd = createRandom(7);
  const now = Date.now();
  const daysAgo = (d) => new Date(now - d * DAY_MS - rnd.int(0, 8) * 60 * 60 * 1000);

  const lights = await Streetlight.find({}, { status: 1, installedOn: 1 }).sort('lightId').lean();
  const logs = [];
  const updates = [];

  for (const light of lights) {
    const update = { lastInspectedOn: daysAgo(rnd.int(1, 60)) };
    const log = (date, fields) =>
      logs.push({ light: light._id, date, performedBy: rnd.pick(TECHNICIANS), ...fields });

    if (light.status === 'working') {
      update.statusChangedAt = light.installedOn ?? daysAgo(120);
      if (rnd.next() < 0.15) {
        // A past fault that has since been repaired.
        const faultDay = rnd.int(8, 60);
        const fixed = daysAgo(faultDay - rnd.int(1, 5));
        const issue = rnd.pick(ISSUES);
        log(daysAgo(faultDay), { issue, action: 'Fault reported during inspection', statusBefore: 'working', statusAfter: 'faulty' });
        log(fixed, { issue, action: rnd.pick(REPAIRS), statusBefore: 'faulty', statusAfter: 'working' });
        update.statusChangedAt = fixed;
        update.lastInspectedOn = fixed;
      }
    } else {
      const faultDay = rnd.int(2, 25);
      const issue = rnd.pick(ISSUES);
      log(daysAgo(faultDay), { issue, action: 'Fault reported during inspection', statusBefore: 'working', statusAfter: 'faulty' });
      update.statusChangedAt = daysAgo(faultDay);
      update.lastInspectedOn = update.statusChangedAt;
      if (light.status === 'under_maintenance') {
        const started = daysAgo(Math.max(0, faultDay - rnd.int(1, 2)));
        log(started, { issue, action: 'Repair work started', statusBefore: 'faulty', statusAfter: 'under_maintenance' });
        update.statusChangedAt = started;
        update.lastInspectedOn = started;
      }
    }

    updates.push({ updateOne: { filter: { _id: light._id }, update: { $set: update } } });
  }

  if (updates.length) await Streetlight.bulkWrite(updates);
  if (logs.length) await MaintenanceLog.insertMany(logs);
  console.log(`[seed] created ${logs.length} maintenance log entries`);
}
