function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface AddressForBatch {
  index: number;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface GeocodedPoint {
  index: number;
  lat: number | null;
  lng: number | null;
}

export default async function geocodeBatch(
  addresses: AddressForBatch[]
): Promise<GeocodedPoint[]> {
  const { GEOCODE_API_KEY } = useRuntimeConfig();
  if (!GEOCODE_API_KEY) {
    throw new Error("GEOCODE_API_KEY is not configured");
  }

  const serviceHrn = "hrn:here:service::olp-here:search-geocode-7";
  const inputDelimiter = "|";
  const outputDelimiter = "|";
  const outputColumns = "recId|positionLat|positionLng";
  const startJob = "true";
  const outputType = "csv";

  const url = `https://batch.search.hereapi.com/v7/batch/jobs?apiKey=${encodeURIComponent(
    GEOCODE_API_KEY
  )}&serviceHrn=${encodeURIComponent(serviceHrn)}&inputDelimiter=${encodeURIComponent(
    inputDelimiter
  )}&outputDelimiter=${encodeURIComponent(outputDelimiter)}&outputColumns=${encodeURIComponent(
    outputColumns
  )}&startJob=${startJob}&outputType=${outputType}`;

  const lines = ["recId|q|country"];
  for (const a of addresses) {
    const q = `${a.street} ${a.city} ${a.state} ${a.zip}`
      .replace(/\|/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    lines.push(`${a.index}|${q}|USA`);
  }
  const body = lines.join("\n");

  const submit = (await $fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
    responseType: "json",
  })) as any;

  const jobId = submit?.id;
  if (!jobId) {
    throw new Error("Batch geocoding job was not created");
  }

  const statusUrl = `https://batch.search.hereapi.com/v7/batch/jobs/${jobId}?apiKey=${encodeURIComponent(
    GEOCODE_API_KEY
  )}`;
  let status = submit.status;
  let attempts = 0;

  while (
    status !== "completed" &&
    status !== "failure" &&
    status !== "deleted" &&
    attempts < 15
  ) {
    await sleep(400);
    const resp = (await $fetch(statusUrl, { responseType: "json" })) as any;
    status = resp?.status;
    attempts++;
  }

  if (status !== "completed") {
    throw new Error("Batch geocoding job did not complete in time");
  }

  const resultsUrl = `https://batch.search.hereapi.com/v7/batch/jobs/${jobId}/results?apiKey=${encodeURIComponent(
    GEOCODE_API_KEY
  )}`;
  const resultText = (await $fetch(resultsUrl, {
    responseType: "text",
  })) as string;

  const map: Record<number, { lat: number | null; lng: number | null }> = {};
  const resultLines = resultText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (resultLines.length > 0) {
    const header = resultLines[0].split("|");
    const recIdx = header.indexOf("recId");
    const latIdx = header.indexOf("positionLat");
    const lngIdx = header.indexOf("positionLng");

    for (let i = 1; i < resultLines.length; i++) {
      const parts = resultLines[i].split("|");
      if (recIdx < 0 || parts.length <= Math.max(recIdx, latIdx, lngIdx)) {
        continue;
      }
      const recId = Number(parts[recIdx]);
      const rawLat = latIdx >= 0 ? Number(parts[latIdx]) : NaN;
      const rawLng = lngIdx >= 0 ? Number(parts[lngIdx]) : NaN;
      map[recId] = {
        lat: Number.isNaN(rawLat) ? null : rawLat,
        lng: Number.isNaN(rawLng) ? null : rawLng,
      };
    }
  }

  return addresses.map((a) => ({
    index: a.index,
    lat: map[a.index]?.lat ?? null,
    lng: map[a.index]?.lng ?? null,
  }));
}
