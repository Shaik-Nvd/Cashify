/** Narrow dispatch repair for the six reviewed catalog variants.
 * This scope is independent of capture eligibility: reference/profile/evidence
 * checks still decide whether exact captured pricing applies. Other variants
 * retain main's existing dispatch until their payout impact is reviewed.
 */
const reviewedIdentities = new Set([
  'apple|apple iphone 15|128gb',
  'apple|apple iphone 12 pro max|128gb',
  'apple|apple iphone 12 pro max|256gb',
  'apple|apple iphone 12 pro max|512gb',
  'apple|apple iphone 14|128gb',
  'apple|apple iphone 14|256gb',
  'apple|apple iphone 14|512gb',
  'apple|apple iphone 13|128gb',
  'apple|apple iphone x|64gb',
  'apple|apple iphone x|128gb',
  'apple|apple iphone x|256gb',
  'apple|apple iphone xr|64gb',
  'apple|apple iphone xr|128gb',
  'apple|apple iphone xr|256gb',
  'apple|apple iphone xs|64gb',
  'apple|apple iphone xs|128gb',
  'apple|apple iphone xs|256gb',
  'apple|apple iphone xs|512gb',
  'apple|apple iphone 11|64gb',
  'apple|apple iphone 11|128gb',
  'apple|apple iphone 11|256gb',
  'apple|apple iphone 12|64gb',
  'apple|apple iphone 12|128gb',
  'apple|apple iphone 12|256gb',
  'apple|apple iphone 13|256gb',
  'apple|apple iphone 13|512gb',
]);

export function reviewedAppleDispatchStorage(device: { brand: string; model: string; storage: string }): string | undefined {
  const identity = `${device.brand.trim().toLowerCase()}|${device.model.trim().toLowerCase()}|${device.storage.replace(/\s+/g, '').toLowerCase()}`;
  return reviewedIdentities.has(identity) ? device.storage : undefined;
}
