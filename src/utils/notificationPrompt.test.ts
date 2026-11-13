import { describe, expect, it } from 'vitest';
import { PROMPT_SNOOZE_MS, shouldAskForNotifications } from './notifications';

const base = { enabled: false, permission: 'default' as const, native: false, dismissedAt: null, now: 1_000_000_000 };

describe('shouldAskForNotifications', () => {
  it('asks on the web when the browser has not decided yet', () => {
    expect(shouldAskForNotifications(base)).toBe(true);
  });

  it('does not ask when notifications are already on', () => {
    expect(shouldAskForNotifications({ ...base, enabled: true })).toBe(false);
  });

  it('does not ask again after the user chose a decision in the browser', () => {
    expect(shouldAskForNotifications({ ...base, permission: 'granted' })).toBe(false);
    expect(shouldAskForNotifications({ ...base, permission: 'denied' })).toBe(false);
  });

  it('does not ask where notifications are unsupported', () => {
    expect(shouldAskForNotifications({ ...base, permission: 'unsupported' })).toBe(false);
  });

  it('asks on Android regardless of the browser permission state', () => {
    expect(shouldAskForNotifications({ ...base, native: true, permission: 'unsupported' })).toBe(true);
  });

  it('stays quiet for seven days after "Not now"', () => {
    const dismissedAt = base.now - (PROMPT_SNOOZE_MS - 1000);
    expect(shouldAskForNotifications({ ...base, dismissedAt })).toBe(false);
    expect(shouldAskForNotifications({ ...base, dismissedAt: base.now - PROMPT_SNOOZE_MS })).toBe(true);
  });
});
