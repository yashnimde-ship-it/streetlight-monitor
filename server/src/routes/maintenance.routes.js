import { Router } from 'express';
import { DAY_MS, STATUSES } from '../constants.js';
import { notFound } from '../middleware/errors.js';
import { MaintenanceLog } from '../models/MaintenanceLog.js';
import { Streetlight } from '../models/Streetlight.js';
import { recordMaintenance } from '../services/maintenance.service.js';
import { clampInt, parseDateParam } from '../utils/helpers.js';
import { maintenanceCreateSchema } from '../validation.js';

const router = Router();

router.get('/', async (req, res) => {
  const { from, to, area, status } = req.query;
  const filter = {};

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = parseDateParam(from, 'from');
    if (to) {
      const end = parseDateParam(to, 'to');
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }
  if (status && STATUSES.includes(status)) filter.statusAfter = status;
  if (area) filter.light = { $in: await Streetlight.distinct('_id', { area: String(area) }) };

  const limit = clampInt(req.query.limit, 50, 1, 500);
  const items = await MaintenanceLog.find(filter)
    .sort({ date: -1, _id: -1 })
    .limit(limit)
    .populate('light', 'lightId area')
    .lean();
  res.json({ items });
});

// Lights that are not working, oldest problem first.
router.get('/open', async (req, res) => {
  const filter = { status: { $ne: 'working' } };
  if (req.query.area) filter.area = String(req.query.area);
  const limit = clampInt(req.query.limit, 200, 1, 2000);
  const [lights, total] = await Promise.all([
    Streetlight.find(filter).sort({ statusChangedAt: 1 }).limit(limit).lean(),
    Streetlight.countDocuments(filter),
  ]);
  const now = Date.now();
  res.json({
    total,
    items: lights.map((l) => ({
      ...l,
      daysPending: Math.max(0, Math.floor((now - new Date(l.statusChangedAt ?? l.updatedAt)) / DAY_MS)),
    })),
  });
});

router.post('/', async (req, res) => {
  const { lightId, statusAfter, ...fields } = maintenanceCreateSchema.parse(req.body);
  const light = await Streetlight.findOne({ lightId: lightId.toUpperCase() });
  if (!light) throw notFound(`Streetlight ${lightId}`);
  const result = await recordMaintenance(light, { ...fields, status: statusAfter, date: fields.date ?? undefined });
  res.status(201).json(result);
});

export default router;
