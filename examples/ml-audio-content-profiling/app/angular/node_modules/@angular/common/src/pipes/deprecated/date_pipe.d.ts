/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
  */
import { PipeTransform } from '@angular/core';
/**
 * @ngModule CommonModule
 * @description
 *
 * Formats a date according to locale rules.
 *
 * Where:
 * - `expression` is a date object or a number (milliseconds since UTC epoch) or an ISO string
 * (https://www.w3.org/TR/NOTE-datetime).
 * - `format` indicates which date/time components to include. The format can be predefined as
 *   shown below or custom as shown in the table.
 *   - `'medium'`: equivalent to `'yMMMdjms'` (e.g. `Sep 3, 2010, 12:05:08 PM` for `en-US`)
 *   - `'short'`: equivalent to `'yMdjm'` (e.g. `9/3/2010, 12:05 PM` for `en-US`)
 *   - `'fullDate'`: equivalent to `'yMMMMEEEEd'` (e.g. `Friday, September 3, 2010` for `en-US`)
 *   - `'longDate'`: equivalent to `'yMMMMd'` (e.g. `September 3, 2010` for `en-US`)
 *   - `'mediumDate'`: equivalent to `'yMMMd'` (e.g. `Sep 3, 2010` for `en-US`)
 *   - `'shortDate'`: equivalent to `'yMd'` (e.g. `9/3/2010` for `en-US`)
 *   - `'mediumTime'`: equivalent to `'jms'` (e.g. `12:05:08 PM` for `en-US`)
 *   - `'shortTime'`: equivalent to `'jm'` (e.g. `12:05 PM` for `en-US`)
 *
 *
 *  | Component | Symbol | Narrow | Short Form   | Long Form         | Numeric   | 2-digit   |
 *  |-----------|:------:|--------|--------------|-------------------|-----------|-----------|
 *  | era       |   G    | G (A)  | GGG (AD)     | GGGG (Anno Domini)| -         | -         |
 *  | year      |   y    | -      | -            | -                 | y (2015)  | yy (15)   |
 *  | month     |   M    | L (S)  | MMM (Sep)    | MMMM (September)  | M (9)     | MM (09)   |
 *  | day       |   d    | -      | -            | -                 | d (3)     | dd (03)   |
 *  | weekday   |   E    | E (S)  | EEE (Sun)    | EEEE (Sunday)     | -         | -         |
 *  | hour      |   j    | -      | -            | -                 | j (13)    | jj (13)   |
 *  | hour12    |   h    | -      | -            | -                 | h (1 PM)  | hh (01 PM)|
 *  | hour24    |   H    | -      | -            | -                 | H (13)    | HH (13)   |
 *  | minute    |   m    | -      | -            | -                 | m (5)     | mm (05)   |
 *  | second    |   s    | -      | -            | -                 | s (9)     | ss (09)   |
 *  | timezone  |   z    | -      | -            | z (Pacific Standard Time)| -  | -         |
 *  | timezone  |   Z    | -      | Z (GMT-8:00) | -                 | -         | -         |
 *  | timezone  |   a    | -      | a (PM)       | -                 | -         | -         |
 *
 * In javascript, only the components specified will be respected (not the ordering,
 * punctuations, ...) and details of the formatting will be dependent on the locale.
 *
 * Timezone of the formatted text will be the local system timezone of the end-user's machine.
 *
 * When the expression is a ISO string without time (e.g. 2016-09-19) the time zone offset is not
 * applied and the formatted text will have the same day, month and year of the expression.
 *
 * WARNINGS:
 * - this pipe is marked as pure hence it will not be re-evaluated when the input is mutated.
 *   Instead users should treat the date as an immutable object and change the reference when the
 *   pipe needs to re-run (this is to avoid reformatting the date on every change detection run
 *   which would be an expensive operation).
 * - this pipe uses the Internationalization API. Therefore it is only reliable in Chrome and Opera
 *   browsers.
 *
 * @usageNotes
 *
 * ### Examples
 *
 * Assuming `dateObj` is (year: 2010, month: 9, day: 3, hour: 12 PM, minute: 05, second: 08)
 * in the _local_ time and locale is 'en-US':
 *
 * {@example common/pipes/ts/date_pipe.ts region='DeprecatedDatePipe'}
 *
 * @publicApi
 */
export declare class DeprecatedDatePipe implements PipeTransform {
    private _locale;
    constructor(_locale: string);
    transform(value: any, pattern?: string): string | null;
}
