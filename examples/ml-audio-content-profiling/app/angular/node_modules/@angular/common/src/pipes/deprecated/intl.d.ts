/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NumberFormatStyle } from '../../i18n/locale_data_api';
export declare class NumberFormatter {
    static format(num: number, locale: string, style: NumberFormatStyle, opts?: {
        minimumIntegerDigits?: number;
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
        currency?: string | null;
        currencyAsSymbol?: boolean;
    }): string;
}
export declare class DateFormatter {
    static format(date: Date, locale: string, pattern: string): string;
}
