export const constructFromSymbol = Symbol.for("constructDateFrom");
export type DateArg<DateType extends Date> = DateType | number | string;

export interface AddDaysOptions<
  DateType extends Date = Date,
> extends ContextOptions<DateType> {}

export interface ContextOptions<DateType extends Date> {
  /**
   * The context to use in the function. It allows to normalize the arguments
   * to a specific date instance, which is useful for extensions like [`TZDate`](https://github.com/date-fns/tz).
   */
  in?: ContextFn<DateType> | undefined;
}

export type ContextFn<DateType extends Date> = (
  value: DateArg<Date> & {},
) => DateType;

export function toDate<
  DateType extends Date | ConstructableDate,
  ResultDate extends Date = DateType,
>(
  argument: DateArg<DateType>,
  context?: ContextFn<ResultDate> | undefined,
): ResultDate {
  // [TODO] Get rid of `toDate` or `constructFrom`?
  return constructFrom(context || argument, argument);
}

export function constructFrom<
  DateType extends Date | ConstructableDate,
  ResultDate extends Date = DateType,
>(
  date: DateArg<DateType> | ContextFn<ResultDate> | undefined,
  value: DateArg<Date> & {},
): ResultDate {
  if (typeof date === "function") return date(value);

  if (date && typeof date === "object" && constructFromSymbol in date)
    return date[constructFromSymbol](value);

  if (date instanceof Date)
    return new (date.constructor as GenericDateConstructor<ResultDate>)(value);

  return new Date(value) as ResultDate;
}


export function addDays<
  DateType extends Date,
  ResultDate extends Date = DateType,
>(
  date: DateArg<DateType>,
  amount: number,
  options?: AddDaysOptions<ResultDate> | undefined,
): ResultDate {
  const _date = toDate(date, options?.in);
  if (isNaN(amount)) return constructFrom(options?.in || date, NaN);

  // If 0 days, no-op to avoid changing times in the hour before end of DST
  if (!amount) return _date;

  _date.setDate(_date.getDate() + amount);
  return _date;
}
