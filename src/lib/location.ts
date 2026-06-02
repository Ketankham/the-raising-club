const R_MILES = 3958.8;
const R_KM = 6371;
const DEG = Math.PI / 180;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number, R: number): number {
  const dLat = (lat2 - lat1) * DEG;
  const dLng = (lng2 - lng1) * DEG;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversine(lat1, lng1, lat2, lng2, R_MILES);
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversine(lat1, lng1, lat2, lng2, R_KM);
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "< 0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
