/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '@angular/core';
import { Plural } from './locale_data_api';
/**
 * @deprecated from v5
 */
export declare const DEPRECATED_PLURAL_FN: InjectionToken<boolean>;
/**
 * @publicApi
 */
export declare abstract class NgLocalization {
    abstract getPluralCategory(value: any, locale?: string): string;
}
/**
 * Returns the plural category for a given value.
 * - "=value" when the case exists,
 * - the plural category otherwise
 */
export declare function getPluralCategory(value: number, cases: string[], ngLocalization: NgLocalization, locale?: string): string;
/**
 * Returns the plural case based on the locale
 *
 * @publicApi
 */
export declare class NgLocaleLocalization extends NgLocalization {
    protected locale: string;
    /** @deprecated from v5 */
    protected deprecatedPluralFn?: ((locale: string, value: string | number) => Plural) | null | undefined;
    constructor(locale: string, 
    /** @deprecated from v5 */
    deprecatedPluralFn?: ((locale: string, value: string | number) => Plural) | null | undefined);
    getPluralCategory(value: any, locale?: string): string;
}
/**
 * Returns the plural case based on the locale
 *
 * @deprecated from v5 the plural case function is in locale data files common/locales/*.ts
 * @publicApi
 */
export declare function getPluralCase(locale: string, nLike: number | string): Plural;
