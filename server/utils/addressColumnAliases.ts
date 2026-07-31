export interface AddressColumns {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export function findAddressColumns(keys: string[]): AddressColumns {
  const lowerToKey: Record<string, string> = {};
  for (const key of keys) {
    lowerToKey[key.trim().toLowerCase()] = key;
  }

  const find = (names: string[]): string | undefined => {
    for (const name of names) {
      if (lowerToKey[name]) return lowerToKey[name];
    }
    return undefined;
  };

  const street = find(["street", "address"]);
  const city = find(["city"]);
  const state = find(["state"]);
  const zip = find(["zip", "zipcode", "postal", "postalcode"]);

  if (!street || !city || !state || !zip) {
    throw new Error(
      `Missing required address columns. Found: ${keys.join(", ")}. Need street/address, city, state, and zip.`
    );
  }

  return { street, city, state, zip };
}
