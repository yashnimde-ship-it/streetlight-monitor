import { DAYS_PER_MONTH, STATUSES } from '../constants.js';
import { Streetlight } from '../models/Streetlight.js';
import { round } from '../utils/helpers.js';

const emptyCounts = () => ({ total: 0, ...Object.fromEntries(STATUSES.map((s) => [s, 0])) });
const pct = (part, total) => (total ? round((part / total) * 100, 1) : 0);

// Areas ordered south to north (by average latitude), i.e. Churchgate first, Virar last.
async function areaRank() {
  const rows = await Streetlight.aggregate([{ $group: { _id: '$area', lat: { $avg: '$location.lat' } } }, { $sort: { lat: 1 } }]);
  return new Map(rows.map((r, i) => [r._id, i]));
}
const byRank = (rank) => (a, b) => (rank.get(a.area) ?? 0) - (rank.get(b.area) ?? 0);

export async function getSummary() {
  const [rows, sources, rank] = await Promise.all([
    Streetlight.aggregate([{ $group: { _id: { area: '$area', status: '$status' }, count: { $sum: 1 } } }]),
    Streetlight.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
    areaRank(),
  ]);

  const overall = emptyCounts();
  const areas = new Map();

  for (const { _id, count } of rows) {
    if (!areas.has(_id.area)) areas.set(_id.area, { area: _id.area, ...emptyCounts() });
    const area = areas.get(_id.area);
    area[_id.status] += count;
    area.total += count;
    overall[_id.status] += count;
    overall.total += count;
  }

  const byArea = [...areas.values()]
    .map((a) => ({ ...a, workingPct: pct(a.working, a.total) }))
    .sort(byRank(rank));

  const bySource = Object.fromEntries(sources.map((s) => [s._id, s.count]));
  return { ...overall, workingPct: pct(overall.working, overall.total), byArea, bySource };
}

// Energy is estimated only for working lights; faulty ones draw no power.
export async function getEnergy(settings) {
  const { operatingHoursPerDay: hours, tariffPerKwh, co2KgPerKwh, ledSavingPercent } = settings;

  const rank = await areaRank();
  const rows = await Streetlight.aggregate([
    { $match: { status: 'working' } },
    {
      $group: {
        _id: { area: '$area', lampType: '$lampType' },
        lights: { $sum: 1 },
        watts: { $sum: '$wattage' },
      },
    },
  ]);

  const calc = ({ lights, watts, nonLedWatts }) => {
    const dailyKWh = (watts * hours) / 1000;
    const monthlyKWh = dailyKWh * DAYS_PER_MONTH;
    const ledSavingKWh = ((nonLedWatts * hours) / 1000) * DAYS_PER_MONTH * (ledSavingPercent / 100);
    return {
      lights,
      connectedLoadKW: round(watts / 1000),
      dailyKWh: round(dailyKWh),
      monthlyKWh: round(monthlyKWh),
      monthlyCost: round(monthlyKWh * tariffPerKwh),
      monthlyCO2Kg: round(monthlyKWh * co2KgPerKwh),
      ledSavingKWh: round(ledSavingKWh),
      ledSavingCost: round(ledSavingKWh * tariffPerKwh),
      ledSavingCO2Kg: round(ledSavingKWh * co2KgPerKwh),
    };
  };

  const blank = () => ({ lights: 0, watts: 0, nonLedWatts: 0, nonLedLights: 0 });
  const total = blank();
  const areas = new Map();
  const lampTypes = new Map();

  for (const { _id, lights, watts } of rows) {
    const isLed = _id.lampType === 'LED';
    if (!areas.has(_id.area)) areas.set(_id.area, blank());
    for (const acc of [total, areas.get(_id.area)]) {
      acc.lights += lights;
      acc.watts += watts;
      if (!isLed) {
        acc.nonLedWatts += watts;
        acc.nonLedLights += lights;
      }
    }
    const lt = lampTypes.get(_id.lampType) ?? { lampType: _id.lampType, lights: 0, watts: 0 };
    lt.lights += lights;
    lt.watts += watts;
    lampTypes.set(_id.lampType, lt);
  }

  return {
    settings: { operatingHoursPerDay: hours, tariffPerKwh, co2KgPerKwh, ledSavingPercent },
    total: { ...calc(total), nonLedLights: total.nonLedLights },
    byArea: [...areas.entries()]
      .map(([area, acc]) => ({ area, ...calc(acc), nonLedLights: acc.nonLedLights }))
      .sort(byRank(rank)),
    byLampType: [...lampTypes.values()]
      .map((lt) => ({
        ...lt,
        monthlyKWh: round(((lt.watts * hours) / 1000) * DAYS_PER_MONTH),
      }))
      .sort((a, b) => b.lights - a.lights),
  };
}
