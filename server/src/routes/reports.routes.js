import { Router } from 'express';
import { DAY_MS } from '../constants.js';
import { MaintenanceLog } from '../models/MaintenanceLog.js';
import { Settings } from '../models/Settings.js';
import { getEnergy, getSummary } from '../services/stats.service.js';
import { toCsv } from '../utils/helpers.js';

const router = Router();

function reportToCsv({ generatedAt, summary, energy }) {
  const energyByArea = new Map(energy.byArea.map((e) => [e.area, e]));
  const header = [
    'Area',
    'Total lights',
    'Working',
    'Faulty',
    'Under maintenance',
    'Working %',
    'Monthly kWh',
    'Monthly cost (INR)',
    'Monthly CO2 (kg)',
    'LED upgrade saving (kWh/month)',
  ];
  const row = (label, s, e) => [
    label,
    s.total,
    s.working,
    s.faulty,
    s.under_maintenance,
    s.workingPct,
    e?.monthlyKWh ?? 0,
    e?.monthlyCost ?? 0,
    e?.monthlyCO2Kg ?? 0,
    e?.ledSavingKWh ?? 0,
  ];
  const s = energy.settings;
  return toCsv([
    ['StreetLight Monitor - Sustainability Report'],
    ['Generated', generatedAt.toISOString()],
    ['Assumptions', `${s.operatingHoursPerDay} h/day; INR ${s.tariffPerKwh}/kWh; ${s.co2KgPerKwh} kg CO2/kWh; LED saving ${s.ledSavingPercent}%`],
    [],
    header,
    ...summary.byArea.map((a) => row(a.area, a, energyByArea.get(a.area))),
    row('TOTAL', summary, energy.total),
  ]);
}

router.get('/sustainability', async (req, res) => {
  const settings = (await Settings.getSingleton()).toObject();
  const since = new Date(Date.now() - 30 * DAY_MS);

  const [summary, energy, logsLast30Days, repairsLast30Days] = await Promise.all([
    getSummary(),
    getEnergy(settings),
    MaintenanceLog.countDocuments({ date: { $gte: since } }),
    MaintenanceLog.countDocuments({ date: { $gte: since }, statusAfter: 'working', statusBefore: { $ne: 'working' } }),
  ]);

  const report = {
    generatedAt: new Date(),
    summary,
    energy,
    maintenance: { logsLast30Days, repairsLast30Days },
  };

  if (req.query.format === 'csv') {
    const date = report.generatedAt.toISOString().slice(0, 10);
    res.attachment(`sustainability-report-${date}.csv`).type('text/csv').send(reportToCsv(report));
    return;
  }
  res.json(report);
});

export default router;
