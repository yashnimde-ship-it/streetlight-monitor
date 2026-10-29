import { Router } from 'express';
import { Settings } from '../models/Settings.js';
import { settingsSchema } from '../validation.js';

const router = Router();

router.get('/', async (_req, res) => {
  res.json(await Settings.getSingleton());
});

router.put('/', async (req, res) => {
  const data = settingsSchema.parse(req.body);
  const settings = await Settings.getSingleton();
  settings.set(data);
  await settings.save();
  res.json(settings);
});

export default router;
