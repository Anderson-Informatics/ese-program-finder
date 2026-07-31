const LATITUDE_ALIASES = new Set(["lat", "latitude", "y"]);
const LONGITUDE_ALIASES = new Set(["lng", "lon", "long", "longitude", "x"]);
const GRADE_ALIASES = new Set(["grade", "gradelevel", "grade_level"]);

export function findCanonicalColumns(
  keys: string[]
): { lat: string; lng: string; grade: string } {
  let latKey: string | undefined;
  let lngKey: string | undefined;
  let gradeKey: string | undefined;

  for (const key of keys) {
    const normalized = key.trim().toLowerCase().replace(/[-_]/g, "");
    if (LATITUDE_ALIASES.has(normalized)) latKey = key;
    if (LONGITUDE_ALIASES.has(normalized)) lngKey = key;
    if (GRADE_ALIASES.has(normalized)) gradeKey = key;
  }

  if (!latKey || !lngKey || !gradeKey) {
    throw new Error(
      `Missing required columns. Found: ${keys.join(", ")}. Need latitude, longitude, and grade.`
    );
  }

  return { lat: latKey, lng: lngKey, grade: gradeKey };
}
