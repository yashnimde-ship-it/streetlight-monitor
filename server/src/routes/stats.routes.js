import { Router } from 'express';
import { Settings } from '../models/Settings.js';
import { getEnergy, getSummary } from '../services/stats.service.js';

const router = Router();

router.get('/summary', async (_req, res) => {
  res.json(await getSummary());
});

router.get('/energy', async (_req, res) => {
  const settings = await Settings.getSingleton();
  res.json(await getEnergy(settings.toObject()));
});

export default router;
