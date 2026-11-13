import { describe, expect, it } from 'vitest';
import {
  BeforeInstallPromptEvent,
  detectPlatform,
  manualInstallSteps,
  runInstall,
} from './pwaInstall';

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  ipadDesktopMode: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
  desktop: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
};

/** Minimal stand-in for the browser's BeforeInstallPromptEvent. */
const fakePrompt = (outcome: 'accepted' | 'dismissed' | 'throw'): BeforeInstallPromptEvent =>
  ({
    prompt: async () => {
      if (outcome === 'throw') throw new Error('prompt already used');
    },
    userChoice: Promise.resolve({ outcome: outcome === 'accepted' ? 'accepted' : 'dismissed', platform: 'web' }),
  }) as unknown as BeforeInstallPromptEvent;

describe('detectPlatform', () => {
  it('detects iPhone, iPad in desktop mode, Android and desktop browsers', () => {
    expect(detectPlatform(UA.iphone)).toBe('ios');
    expect(detectPlatform(UA.ipadDesktopMode, 5)).toBe('ios');
    expect(detectPlatform(UA.ipadDesktopMode, 0)).toBe('desktop');
    expect(detectPlatform(UA.android)).toBe('android');
    expect(detectPlatform(UA.desktop)).toBe('desktop');
  });
});

describe('manualInstallSteps', () => {
  it('gives browser-specific steps for every platform', () => {
    expect(manualInstallSteps('ios')).toContain('Add to Home Screen');
    expect(manualInstallSteps('android')).toContain('Install app');
    expect(manualInstallSteps('desktop')).toContain('install icon');
  });
});

describe('runInstall', () => {
  it('reports installed when the user accepts the native dialog', async () => {
    expect(await runInstall(fakePrompt('accepted'))).toBe('installed');
  });

  it('reports dismissed when the user cancels', async () => {
    expect(await runInstall(fakePrompt('dismissed'))).toBe('dismissed');
  });

  it('falls back to manual steps when there is no native prompt or it fails', async () => {
    expect(await runInstall(null)).toBe('manual');
    expect(await runInstall(fakePrompt('throw'))).toBe('manual');
  });
});
