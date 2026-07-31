const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

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

  const results: GeocodedPoint[] = [];
  const concurrency = 10;

  for (let i = 0; i < addresses.length; i += concurrency) {
    const batch = addresses.slice(i, i + concurrency);
    const promises = batch.map(async (a) => {
      const q = `${a.street} ${a.city} ${a.state} ${a.zip}`
        .replace(/\s+/g, " ")
        .trim();
      const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
        q
      )}&apiKey=${GEOCODE_API_KEY}`;

      try {
        const data = (await $fetch(url)) as any;
        const item = data?.items?.[0];
        if (!item) {
          return { index: a.index, lat: null, lng: null };
        }
        const point = (item.access && item.access[0]) || item.position;
        if (!point) {
          return { index: a.index, lat: null, lng: null };
        }
        return {
          index: a.index,
          lat: Number.isNaN(Number(point.lat)) ? null : Number(point.lat),
          lng: Number.isNaN(Number(point.lng)) ? null : Number(point.lng),
        };
      } catch (e) {
        return { index: a.index, lat: null, lng: null };
      }
    });

    const chunk = await Promise.all(promises);
    results.push(...chunk);

    if (i + concurrency < addresses.length) {
      await sleep(50);
    }
  }

  return results;
}
