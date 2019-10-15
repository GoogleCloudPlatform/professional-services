/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { DateAdapter } from './date-adapter';
/** Adapts the native JS Date for use with cdk-based components that work with dates. */
export declare class NativeDateAdapter extends DateAdapter<Date> {
    /** Whether to clamp the date between 1 and 9999 to avoid IE and Edge errors. */
    private readonly _clampDate;
    /**
     * Whether to use `timeZone: 'utc'` with `Intl.DateTimeFormat` when formatting dates.
     * Without this `Intl.DateTimeFormat` sometimes chooses the wrong timeZone, which can throw off
     * the result. (e.g. in the en-US locale `new Date(1800, 7, 14).toLocaleDateString()`
     * will produce `'8/13/1800'`.
     *
     * TODO(mmalerba): drop this variable. It's not being used in the code right now. We're now
     * getting the string representation of a Date object from it's utc representation. We're keeping
     * it here for sometime, just for precaution, in case we decide to revert some of these changes
     * though.
     */
    useUtcForDisplay: boolean;
    constructor(matDateLocale: string, platform: Platform);
    getYear(date: Date): number;
    getMonth(date: Date): number;
    getDate(date: Date): number;
    getDayOfWeek(date: Date): number;
    getMonthNames(style: 'long' | 'short' | 'narrow'): string[];
    getDateNames(): string[];
    getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[];
    getYearName(date: Date): string;
    getFirstDayOfWeek(): number;
    getNumDaysInMonth(date: Date): number;
    clone(date: Date): Date;
    createDate(year: number, month: number, date: number): Date;
    today(): Date;
    parse(value: any): Date | null;
    format(date: Date, displayFormat: Object): string;
    addCalendarYears(date: Date, years: number): Date;
    addCalendarMonths(date: Date, months: number): Date;
    addCalendarDays(date: Date, days: number): Date;
    toIso8601(date: Date): string;
    /**
     * Returns the given value if given a valid Date or null. Deserializes valid ISO 8601 strings
     * (https://www.ietf.org/rfc/rfc3339.txt) into valid Dates and empty string into null. Returns an
     * invalid date for all other values.
     */
    deserialize(value: any): Date | null;
    isDateInstance(obj: any): boolean;
    isValid(date: Date): boolean;
    invalid(): Date;
    /** Creates a date but allows the month and date to overflow. */
    private _createDateWithOverflow;
    /**
     * Pads a number to make it two digits.
     * @param n The number to pad.
     * @returns The padded number.
     */
    private _2digit;
    /**
     * Strip out unicode LTR and RTL characters. Edge and IE insert these into formatted dates while
     * other browsers do not. We remove them to make output consistent and because they interfere with
     * date parsing.
     * @param str The string to strip direction characters from.
     * @returns The stripped string.
     */
    private _stripDirectionalityCharacters;
    /**
     * When converting Date object to string, javascript built-in functions may return wrong
     * results because it applies its internal DST rules. The DST rules around the world change
     * very frequently, and the current valid rule is not always valid in previous years though.
     * We work around this problem building a new Date object which has its internal UTC
     * representation with the local date and time.
     * @param dtf Intl.DateTimeFormat object, containg the desired string format. It must have
     *    timeZone set to 'utc' to work fine.
     * @param date Date from which we want to get the string representation according to dtf
     * @returns A Date object with its UTC representation based on the passed in date info
     */
    private _format;
}
