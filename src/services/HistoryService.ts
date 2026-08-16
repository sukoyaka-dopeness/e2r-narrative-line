import type { Event } from "../models/Event";

export interface HistoryDate {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
}

export type HistoryDateValidationError =
  | "year_must_be_integer"
  | "month_requires_year"
  | "month_must_be_integer"
  | "month_out_of_range"
  | "day_requires_month"
  | "day_must_be_integer"
  | "day_out_of_range"
  | "hour_requires_day"
  | "hour_must_be_integer"
  | "hour_out_of_range"
  | "minute_must_be_integer"
  | "minute_out_of_range"
  | "second_must_be_integer"
  | "second_out_of_range";

function isGregorianLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInGregorianMonth(year: number, month: number): number {
  if (month === 2) {
    return isGregorianLeapYear(year) ? 29 : 28;
  }

  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }

  return 31;
}

export function getEventHistoryDate(event: Event): HistoryDate | undefined {
  const time = event.extensions?.history?.time;

  if (time !== undefined) {
    return {
      ...(time.year === undefined ? {} : { year: time.year }),
      ...(time.month === undefined ? {} : { month: time.month }),
      ...(time.day === undefined ? {} : { day: time.day }),
    };
  }

  return undefined;
}

export function getEventHistoryTime(event: Event): HistoryDate | undefined {
  const time = event.extensions?.history?.time;

  if (time !== undefined) {
    return {
      ...(time.year === undefined ? {} : { year: time.year }),
      ...(time.month === undefined ? {} : { month: time.month }),
      ...(time.day === undefined ? {} : { day: time.day }),
      ...(time.hour === undefined ? {} : { hour: time.hour }),
      ...(time.minute === undefined ? {} : { minute: time.minute }),
      ...(time.second === undefined ? {} : { second: time.second }),
    };
  }

  return undefined;
}

export function validateHistoryDate(
  date: HistoryDate | undefined,
): HistoryDateValidationError | null {
  if (!date) {
    return null;
  }

  const { year, month, day, hour, minute, second } = date;

  if (year !== undefined && !Number.isInteger(year)) {
    return "year_must_be_integer";
  }

  if (month !== undefined) {
    if (year === undefined) {
      return "month_requires_year";
    }

    if (!Number.isInteger(month)) {
      return "month_must_be_integer";
    }

    if (month < 1 || month > 12) {
      return "month_out_of_range";
    }
  }

  if (day !== undefined) {
    if (year === undefined || month === undefined) {
      return "day_requires_month";
    }

    if (!Number.isInteger(day)) {
      return "day_must_be_integer";
    }

    if (day < 1 || day > daysInGregorianMonth(year, month)) {
      return "day_out_of_range";
    }
  }

  if (hour !== undefined) {
    if (year === undefined || month === undefined || day === undefined) {
      return "hour_requires_day";
    }

    if (!Number.isInteger(hour)) {
      return "hour_must_be_integer";
    }

    if (hour < 0 || hour > 23) {
      return "hour_out_of_range";
    }
  }

  if (minute !== undefined) {
    if (hour === undefined) {
      return "hour_must_be_integer";
    }

    if (!Number.isInteger(minute)) {
      return "minute_must_be_integer";
    }

    if (minute < 0 || minute > 59) {
      return "minute_out_of_range";
    }
  }

  if (second !== undefined) {
    if (minute === undefined) {
      return "minute_must_be_integer";
    }

    if (!Number.isInteger(second)) {
      return "second_must_be_integer";
    }

    if (second < 0 || second > 59) {
      return "second_out_of_range";
    }
  }

  return null;
}

export function formatEventHistoryDate(event: Event): string | undefined {
  const date = getEventHistoryDate(event);

  if (
    !date ||
    date.year === undefined ||
    validateHistoryDate(date) !== null
  ) {
    return undefined;
  }

  let formatted = String(date.year);

  if (date.month !== undefined) {
    formatted += `-${String(date.month).padStart(2, "0")}`;
  }

  if (date.day !== undefined) {
    formatted += `-${String(date.day).padStart(2, "0")}`;
  }

  return formatted;
}

export function formatEventHistoryTime(
  event: Event,
  includeSeconds = false,
): string | undefined {
  const time = getEventHistoryTime(event);

  if (!time || time.hour === undefined || validateHistoryDate(time) !== null) {
    return undefined;
  }

  let formatted = String(time.hour).padStart(2, "0");

  if (time.minute !== undefined) {
    formatted += `:${String(time.minute).padStart(2, "0")}`;
  }

  if (includeSeconds && time.second !== undefined) {
    formatted += `:${String(time.second).padStart(2, "0")}`;
  }

  return formatted;
}

function compareOptionalNumber(
  left: number | undefined,
  right: number | undefined,
): number {
  if (left === right) {
    return 0;
  }

  if (left === undefined) {
    return -1;
  }

  if (right === undefined) {
    return 1;
  }

  return left < right ? -1 : 1;
}

function compareIds(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

export function compareEventsByHistoryDate(left: Event, right: Event): number {
  const leftDate = getEventHistoryDate(left);
  const rightDate = getEventHistoryDate(right);
  const leftHasDate =
    leftDate?.year !== undefined && validateHistoryDate(leftDate) === null;
  const rightHasDate =
    rightDate?.year !== undefined && validateHistoryDate(rightDate) === null;

  if (leftHasDate && !rightHasDate) {
    return -1;
  }

  if (!leftHasDate && rightHasDate) {
    return 1;
  }

  if (leftHasDate && rightHasDate) {
    const yearComparison = compareOptionalNumber(leftDate.year, rightDate.year);

    if (yearComparison !== 0) {
      return yearComparison;
    }

    const monthComparison = compareOptionalNumber(
      leftDate.month,
      rightDate.month,
    );

    if (monthComparison !== 0) {
      return monthComparison;
    }

    const dayComparison = compareOptionalNumber(leftDate.day, rightDate.day);

    if (dayComparison !== 0) {
      return dayComparison;
    }

    const leftTime = getEventHistoryTime(left);
    const rightTime = getEventHistoryTime(right);
    for (const field of ["hour", "minute", "second"] as const) {
      const timeComparison = compareOptionalNumber(leftTime?.[field], rightTime?.[field]);
      if (timeComparison !== 0) {
        return timeComparison;
      }
    }
  }

  const leftTemporalOrder = left.extensions?.history?.time?.temporalOrder;
  const rightTemporalOrder = right.extensions?.history?.time?.temporalOrder;

  if (
    Number.isInteger(leftTemporalOrder) &&
    Number.isInteger(rightTemporalOrder) &&
    leftTemporalOrder !== rightTemporalOrder
  ) {
    return leftTemporalOrder! < rightTemporalOrder! ? -1 : 1;
  }

  return compareIds(left.id, right.id);
}
