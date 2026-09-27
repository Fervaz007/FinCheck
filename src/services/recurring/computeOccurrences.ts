import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  getDaysInMonth,
  getYear,
  startOfDay,
  startOfMonth,
} from 'date-fns';

import type { RecurrenceConfig } from './recurrenceTypes';

/**
 * Clamps a configured day-of-month to the last real day of that month.
 * Documented semantics: day 31 in a 30-day month -> last day of that month;
 * day 30 in February -> Feb 28 (or 29 in a leap year).
 */
export function clampDayOfMonth(monthStart: Date, day: number): Date {
  const daysInMonth = getDaysInMonth(monthStart);
  const clampedDay = Math.min(day, daysInMonth);
  return new Date(monthStart.getFullYear(), monthStart.getMonth(), clampedDay);
}

function isWithin(date: Date, from: Date, to: Date): boolean {
  return date.getTime() >= from.getTime() && date.getTime() <= to.getTime();
}

/**
 * Pure, deterministic occurrence calculator. No I/O.
 * Returns every calendar date on which `config` fires within [from, to],
 * never before `anchorDate`.
 */
export function computeOccurrences(
  config: RecurrenceConfig,
  anchorDate: Date,
  from: Date,
  to: Date,
): Date[] {
  const anchor = startOfDay(anchorDate);
  const rangeStart = startOfDay(from) > anchor ? startOfDay(from) : anchor;
  const rangeEnd = startOfDay(to);

  if (rangeEnd.getTime() < rangeStart.getTime()) {
    return [];
  }

  const occurrences: Date[] = [];

  switch (config.type) {
    case 'DAILY_INTERVAL': {
      const daysSinceAnchor = differenceInCalendarDays(rangeStart, anchor);
      const stepsToSkip = Math.max(0, Math.ceil(daysSinceAnchor / config.intervalDays));
      let candidate = addDays(anchor, stepsToSkip * config.intervalDays);
      while (candidate.getTime() <= rangeEnd.getTime()) {
        if (candidate.getTime() >= rangeStart.getTime()) {
          occurrences.push(candidate);
        }
        candidate = addDays(candidate, config.intervalDays);
      }
      break;
    }

    case 'WEEKLY': {
      let candidate = anchor;
      const dayDiff = (config.weekday - candidate.getDay() + 7) % 7;
      candidate = addDays(candidate, dayDiff);
      while (candidate.getTime() <= rangeEnd.getTime()) {
        if (candidate.getTime() >= rangeStart.getTime()) {
          occurrences.push(candidate);
        }
        candidate = addDays(candidate, 7);
      }
      break;
    }

    case 'MONTHLY_DAY':
    case 'MONTHLY_LAST_DAY': {
      const day = config.type === 'MONTHLY_LAST_DAY' ? 31 : config.day;
      let monthCursor = startOfMonth(anchor);
      const lastMonth = startOfMonth(rangeEnd);
      while (monthCursor.getTime() <= lastMonth.getTime()) {
        const candidate = clampDayOfMonth(monthCursor, day);
        if (isWithin(candidate, rangeStart, rangeEnd) && candidate.getTime() >= anchor.getTime()) {
          occurrences.push(candidate);
        }
        monthCursor = addMonths(monthCursor, 1);
      }
      break;
    }

    case 'SEMIMONTHLY_FIXED': {
      let monthCursor = startOfMonth(anchor);
      const lastMonth = startOfMonth(rangeEnd);
      while (monthCursor.getTime() <= lastMonth.getTime()) {
        const dayB = config.dayB === 'last' ? 31 : config.dayB;
        const candidateA = clampDayOfMonth(monthCursor, config.dayA);
        const candidateB = clampDayOfMonth(monthCursor, dayB);
        for (const candidate of [candidateA, candidateB]) {
          if (
            isWithin(candidate, rangeStart, rangeEnd) &&
            candidate.getTime() >= anchor.getTime()
          ) {
            occurrences.push(candidate);
          }
        }
        monthCursor = addMonths(monthCursor, 1);
      }
      occurrences.sort((a, b) => a.getTime() - b.getTime());
      break;
    }

    case 'MONTHLY_INTERVAL': {
      let monthCursor = startOfMonth(anchor);
      const lastMonth = startOfMonth(rangeEnd);
      while (monthCursor.getTime() <= lastMonth.getTime()) {
        const monthsSinceAnchor = differenceInCalendarMonths(monthCursor, startOfMonth(anchor));
        if (monthsSinceAnchor % config.every === 0) {
          const candidate = clampDayOfMonth(monthCursor, config.day);
          if (
            isWithin(candidate, rangeStart, rangeEnd) &&
            candidate.getTime() >= anchor.getTime()
          ) {
            occurrences.push(candidate);
          }
        }
        monthCursor = addMonths(monthCursor, 1);
      }
      break;
    }

    case 'ANNUAL': {
      let year = getYear(anchor);
      const endYear = getYear(rangeEnd);
      while (year <= endYear) {
        const monthStart = new Date(year, config.month - 1, 1);
        const candidate = clampDayOfMonth(monthStart, config.day);
        if (isWithin(candidate, rangeStart, rangeEnd) && candidate.getTime() >= anchor.getTime()) {
          occurrences.push(candidate);
        }
        year += 1;
      }
      break;
    }
  }

  return occurrences;
}
