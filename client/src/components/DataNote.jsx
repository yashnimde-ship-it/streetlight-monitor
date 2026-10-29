import { fmtNumber } from '../utils/format.js';

/** States plainly which parts of the dataset are real and which are simulated. */
export default function DataNote({ bySource = {} }) {
  const osm = bySource.osm ?? 0;
  const estimated = bySource.estimated ?? 0;
  const official = bySource.official ?? 0;
  return (
    <div className="mb-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <strong>Data:</strong> Western Railway corridor, Churchgate to Virar: 12 BMC western wards, Mira-Bhayandar and
      Vasai-Virar (real boundaries). {fmtNumber(osm, 0)} lamps actually mapped on OpenStreetMap
      {estimated > 0 && <>, {fmtNumber(estimated, 0)} placed at typical pole spacing along real main roads</>}
      {official > 0 && <>, {fmtNumber(official, 0)} from official records</>}. Status, wattage and maintenance history are
      simulated, because no municipal body publishes per-light records.
    </div>
  );
}
