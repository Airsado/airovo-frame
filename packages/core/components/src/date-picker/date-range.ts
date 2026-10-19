/** Local dates at the component boundary; serialization/time zones belong to the app. */
export type DateRangeValue = [Date, Date];

export interface DateRangePreset {
  label: string;
  /** Functions are evaluated when clicked, so “last hour” never becomes stale. */
  value: DateRangeValue | (() => DateRangeValue);
}

export interface DateRangePickerProps {
  modelValue?: DateRangeValue;
  showTime?: boolean;
  presets?: DateRangePreset[];
  clearable?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  locale?: string;
  placeholder?: string;
  numberOfMonths?: 1 | 2;
  id?: string;
  name?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean | string;
  class?: string;
}

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

export function cloneDateRange(value: unknown): DateRangeValue | undefined {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(isValidDate))
    return undefined;
  return [new Date(value[0]), new Date(value[1])];
}

export function formatRangeDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function formatRangeTime(value: Date): string {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}:${String(value.getSeconds()).padStart(2, "0")}`;
}

/** Do not let Date.setHours silently roll an invalid input into the next day. */
export function withRangeTime(day: Date, time: string): Date | undefined {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!match || !isValidDate(day)) return undefined;
  const [hours, minutes, seconds] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3] ?? 0),
  ];
  if (hours > 23 || minutes > 59 || seconds > 59) return undefined;
  const result = new Date(day);
  result.setHours(hours, minutes, seconds, 0);
  // A time skipped by the local DST change must not silently become another time.
  if (
    result.getHours() !== hours ||
    result.getMinutes() !== minutes ||
    result.getSeconds() !== seconds
  )
    return undefined;
  return result;
}

export type DateRangeError =
  | "incomplete"
  | "invalidTime"
  | "reversed"
  | "beforeMin"
  | "afterMax";

/** Date-only bounds compare days. Date-time bounds compare exact instants, inclusively. */
export function validateDateRange(
  value: DateRangeValue | undefined,
  options: Pick<DateRangePickerProps, "showTime" | "minDate" | "maxDate"> = {},
): DateRangeError | undefined {
  if (!value || !value.every(isValidDate)) return "incomplete";
  const stamp = (date: Date) =>
    options.showTime
      ? date.getTime()
      : new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (stamp(value[0]) > stamp(value[1])) return "reversed";
  if (isValidDate(options.minDate) && stamp(value[0]) < stamp(options.minDate))
    return "beforeMin";
  if (isValidDate(options.maxDate) && stamp(value[1]) > stamp(options.maxDate))
    return "afterMax";
  return undefined;
}
