import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_REPORT_CONFIG,
  EmailReportConfig,
  isReportDue,
  loadReportConfig,
  saveReportConfig,
} from '../utils/reportConfig';

export function useEmailReport() {
  const [config, setConfig] = useState<EmailReportConfig>(DEFAULT_REPORT_CONFIG);
  const [hour, setHour] = useState<number>(() => new Date().getHours());

  useEffect(() => {
    setConfig(loadReportConfig());
  }, []);

  const update = useCallback((next: EmailReportConfig) => {
    setConfig(next);
    saveReportConfig(next);
  }, []);

  const markSent = useCallback((dateISO: string) => {
    setConfig((prev) => {
      const next = { ...prev, lastSentDate: dateISO };
      saveReportConfig(next);
      return next;
    });
  }, []);

  // Recompute "due" every minute so the reminder appears without a reload.
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setHour((prev) => (prev === now.getHours() ? prev : now.getHours()));
    };
    const id = window.setInterval(tick, 60_000);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', tick);
    };
  }, []);

  const due = useMemo(() => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
    return isReportDue(config, iso, hour);
  }, [config, hour]);

  return { config, update, markSent, due };
}
