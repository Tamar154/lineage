import type { DatePrecision } from "../generated/prisma/index.js";

export type PartialDate = {
  value: string;
  precision: DatePrecision;
};

export type PartialDateRange = {
  start: Date;
  end: Date;
};

const daysInMonth = (year: number, month: number) =>
  utcDate(year, month + 1, 0).getUTCDate();

const utcDate = (year: number, month: number, day: number) => {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
};

export function partialDateToRange({
  value,
  precision,
}: PartialDate): PartialDateRange | null {
  const patterns = {
    YEAR: /^(\d{4})$/,
    MONTH: /^(\d{4})-(\d{2})$/,
    DAY: /^(\d{4})-(\d{2})-(\d{2})$/,
  } as const;
  const match = patterns[precision].exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = precision === "YEAR" ? 1 : Number(match[2]);
  const day = precision === "DAY" ? Number(match[3]) : 1;
  if (year < 1 || month < 1 || month > 12) return null;

  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;

  if (precision === "YEAR") {
    return {
      start: utcDate(year, 1, 1),
      end: utcDate(year, 12, 31),
    };
  }
  if (precision === "MONTH") {
    return {
      start: utcDate(year, month, 1),
      end: utcDate(year, month, maxDay),
    };
  }

  const exact = utcDate(year, month, day);
  return { start: exact, end: exact };
}

export const isValidPartialDate = (date: PartialDate): boolean =>
  partialDateToRange(date) !== null;

export const isPartialDateInFuture = (
  date: PartialDate,
  now = new Date(),
): boolean => {
  const range = partialDateToRange(date);
  if (!range) return false;
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  return range.start > today;
};

export const isDeathConclusivelyBeforeBirth = (
  birth: PartialDate,
  death: PartialDate,
): boolean => {
  const birthRange = partialDateToRange(birth);
  const deathRange = partialDateToRange(death);
  return Boolean(birthRange && deathRange && deathRange.end < birthRange.start);
};
