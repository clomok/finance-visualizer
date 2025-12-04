import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, startOfYear, endOfYear, subYears, isWithinInterval, parseISO } from 'date-fns';
import { TimeFrame } from '../types';

export const getDateRange = (timeFrame: TimeFrame, customStart?: Date, customEnd?: Date): { start: Date, end: Date } => {
  const now = new Date();
  let start: Date, end: Date;

  switch (timeFrame) {
    case 'This Week':
      start = startOfWeek(now);
      end = now;
      break;
    case 'Last Week':
      start = startOfWeek(subWeeks(now, 1));
      end = endOfWeek(subWeeks(now, 1));
      break;
    case 'This Month':
      start = startOfMonth(now);
      end = now;
      break;
    case 'Last Month':
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
      break;
    case 'This Quarter':
      start = startOfQuarter(now);
      end = now;
      break;
    case 'Last Quarter':
      start = startOfQuarter(subQuarters(now, 1));
      end = endOfQuarter(subQuarters(now, 1));
      break;
    case 'This Year':
      start = startOfYear(now);
      end = now;
      break;
    case 'Last Year':
      start = startOfYear(subYears(now, 1));
      end = endOfYear(subYears(now, 1));
      break;
    case 'Custom':
      start = customStart || new Date(0);
      end = customEnd || new Date();
      break;
    default:
      start = new Date(0);
      end = new Date();
  }
  return { start, end };
};

export const filterByDate = (dates: string[], timeFrame: TimeFrame, customStart?: Date, customEnd?: Date): string[] => {
  const { start, end } = getDateRange(timeFrame, customStart, customEnd);
  return dates.filter(dateStr => {
    return isWithinInterval(parseISO(dateStr), { start, end });
  });
};