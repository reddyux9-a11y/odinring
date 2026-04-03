const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Whole days until end, aligned with Python `(end - now).days` / timedelta floor into days.
 */
export function daysRemainingFromEndDate(endInput, now = new Date()) {
  if (endInput == null || endInput === '') return null;
  const end =
    typeof endInput === 'string' || typeof endInput === 'number'
      ? new Date(endInput)
      : endInput;
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / MS_PER_DAY);
}

/**
 * Prefer backend `days_remaining`; otherwise derive from trial or billing period end.
 */
export function getSubscriptionDaysRemaining(sub, now = new Date()) {
  if (!sub || typeof sub !== 'object') return null;
  if (
    sub.days_remaining != null &&
    typeof sub.days_remaining === 'number' &&
    !Number.isNaN(sub.days_remaining)
  ) {
    return Math.max(0, Math.trunc(sub.days_remaining));
  }
  if (sub.trial_end_date) {
    return daysRemainingFromEndDate(sub.trial_end_date, now);
  }
  if (sub.current_period_end) {
    return daysRemainingFromEndDate(sub.current_period_end, now);
  }
  return null;
}
