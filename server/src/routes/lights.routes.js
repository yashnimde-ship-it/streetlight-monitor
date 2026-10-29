import { Router } from 'express';
import multer from 'multer';
import { SOURCES, STATUSES } from '../constants.js';
import { HttpError, notFound } from '../middleware/errors.js';
import { MaintenanceLog } from '../models/MaintenanceLog.js';
import { Streetlight } from '../models/Streetlight.js';
import { importLightsFromCsv } from '../services/import.service.js';
import { recordMaintenance } from '../services/maintenance.service.js';
import { clampInt, escapeRegex } from '../utils/helpers.js';
import { lightCreateSchema, lightUpdateSchema, statusUpdateSchema } from '../validation.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const SORTABLE = ['lightId', 'area', 'street', 'wattage', 'status', 'lastInspectedOn', 'statusChangedAt'];

async function findLight(id) {
  const light = await Streetlight.findById(id);
  if (!light) throw notFound('Streetlight');
  return light;
}

router.get('/', async (req, res) => {
  const { area, status, source, search, sort } = req.query;
  const page = clampInt(req.query.page, 1, 1, 100000);
  const limit = clampInt(req.query.limit, 20, 1, 5000);

  const filter = {};
  if (area) filter.area = String(area);
  if (status && STATUSES.includes(status)) filter.status = status;
  if (source && SOURCES.includes(source)) filter.source = source;
  if (search) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ lightId: rx }, { area: rx }, { street: rx }];
  }
  const sortBy = SORTABLE.includes(String(sort ?? '').replace(/^-/, '')) ? String(sort) : 'lightId';

  const [items, total] = await Promise.all([
    Streetlight.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit).lean(),
    Streetlight.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

// Compact rows for the map (tens of thousands of points): [id, lightId, lat, lng, status, source]
router.get('/map', async (req, res) => {
  const { area, status, source } = req.query;
  const filter = {};
  if (area) filter.area = String(area);
  if (status && STATUSES.includes(status)) filter.status = status;
  if (source && SOURCES.includes(source)) filter.source = source;
  const docs = await Streetlight.find(filter, { lightId: 1, location: 1, status: 1, source: 1 }).lean();
  res.json({
    fields: ['id', 'lightId', 'lat', 'lng', 'status', 'source'],
    rows: docs.map((d) => [d._id, d.lightId, d.location.lat, d.location.lng, d.status, d.source]),
  });
});

router.get('/areas', async (_req, res) => {
  // South to north (Churchgate first, Virar last)
  const rows = await Streetlight.aggregate([{ $group: { _id: '$area', lat: { $avg: '$location.lat' } } }, { $sort: { lat: 1 } }]);
  const areas = rows.map((r) => r._id);
  res.json({ areas });
});

router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Attach a CSV file in the "file" field');
  res.json(await importLightsFromCsv(req.file.buffer));
});

router.post('/', async (req, res) => {
  const data = lightCreateSchema.parse(req.body);
  const light = await Streetlight.create({ ...data, statusChangedAt: new Date() });
  res.status(201).json(light);
});

router.get('/:id', async (req, res) => {
  res.json(await findLight(req.params.id));
});

router.put('/:id', async (req, res) => {
  const data = lightUpdateSchema.parse(req.body);
  const light = await findLight(req.params.id);
  light.set(data);
  await light.save();
  res.json(light);
});

router.patch('/:id/status', async (req, res) => {
  const data = statusUpdateSchema.parse(req.body);
  const light = await findLight(req.params.id);
  res.json(await recordMaintenance(light, data));
});

router.delete('/:id', async (req, res) => {
  const light = await Streetlight.findByIdAndDelete(req.params.id);
  if (!light) throw notFound('Streetlight');
  await MaintenanceLog.deleteMany({ light: light._id });
  res.status(204).end();
});

router.get('/:id/maintenance', async (req, res) => {
  const items = await MaintenanceLog.find({ light: req.params.id }).sort({ date: -1, _id: -1 }).lean();
  res.json({ items });
});

export default router;
