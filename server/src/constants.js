export const STATUSES = ['working', 'faulty', 'under_maintenance'];
export const LAMP_TYPES = ['LED', 'Sodium', 'CFL', 'Metal Halide'];
// Where a light's position came from:
//   osm       - a street lamp actually mapped on OpenStreetMap
//   estimated - placed along a real OpenStreetMap road (no public lamp record exists)
//   official  - imported from an official municipal record (e.g. RTI reply)
//   manual    - added by the administrator
export const SOURCES = ['osm', 'estimated', 'official', 'manual'];

export const DAY_MS = 24 * 60 * 60 * 1000;
export const DAYS_PER_MONTH = 30;
