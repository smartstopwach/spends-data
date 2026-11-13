import { describe, expect, it } from 'vitest';
import { APK_FILE, apkAvailabilityFromResponse } from './downloads';

describe('apkAvailabilityFromResponse', () => {
  it('reports missing when the release does not exist yet', () => {
    expect(apkAvailabilityFromResponse(404)).toBe('missing');
  });

  it('is ready only when the APK asset is attached to the release', () => {
    expect(apkAvailabilityFromResponse(200, { assets: [{ name: APK_FILE }] })).toBe('ready');
    expect(apkAvailabilityFromResponse(200, { assets: [{ name: 'other.aab' }] })).toBe('missing');
    expect(apkAvailabilityFromResponse(200, { assets: [] })).toBe('missing');
  });

  it('does not claim the build is missing when the API is unreachable or rate limited', () => {
    expect(apkAvailabilityFromResponse(403)).toBe('unknown');
    expect(apkAvailabilityFromResponse(500)).toBe('unknown');
  });
});
