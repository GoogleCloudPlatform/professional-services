/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** *
 * \@publicApi
  @type {?} */
export const LOCALE_DATA = {};
/**
 * Register global data to be used internally by Angular. See the
 * ["I18n guide"](guide/i18n#i18n-pipes) to know how to import additional locale data.
 *
 * \@publicApi
 * @param {?} data
 * @param {?=} localeId
 * @param {?=} extraData
 * @return {?}
 */
export function registerLocaleData(data, localeId, extraData) {
    if (typeof localeId !== 'string') {
        extraData = localeId;
        localeId = data[0 /* LocaleId */];
    }
    localeId = localeId.toLowerCase().replace(/_/g, '-');
    LOCALE_DATA[localeId] = data;
    if (extraData) {
        LOCALE_DATA[localeId][19 /* ExtraData */] = extraData;
    }
}
/** @enum {number} */
var LocaleDataIndex = {
    LocaleId: 0,
    DayPeriodsFormat: 1,
    DayPeriodsStandalone: 2,
    DaysFormat: 3,
    DaysStandalone: 4,
    MonthsFormat: 5,
    MonthsStandalone: 6,
    Eras: 7,
    FirstDayOfWeek: 8,
    WeekendRange: 9,
    DateFormat: 10,
    TimeFormat: 11,
    DateTimeFormat: 12,
    NumberSymbols: 13,
    NumberFormats: 14,
    CurrencySymbol: 15,
    CurrencyName: 16,
    Currencies: 17,
    PluralCase: 18,
    ExtraData: 19,
};
export { LocaleDataIndex };
/** @enum {number} */
var ExtraLocaleDataIndex = {
    ExtraDayPeriodFormats: 0,
    ExtraDayPeriodStandalone: 1,
    ExtraDayPeriodsRules: 2,
};
export { ExtraLocaleDataIndex };
/** @enum {number} */
var CurrencyIndex = {
    Symbol: 0, SymbolNarrow: 1, NbOfDigits: 2,
};
export { CurrencyIndex };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxlX2RhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21tb24vc3JjL2kxOG4vbG9jYWxlX2RhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFXQSxhQUFhLFdBQVcsR0FBOEIsRUFBRSxDQUFDOzs7Ozs7Ozs7OztBQVN6RCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsSUFBUyxFQUFFLFFBQXVCLEVBQUUsU0FBZTtJQUNwRixJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtRQUNoQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQ3JCLFFBQVEsR0FBRyxJQUFJLGtCQUEwQixDQUFDO0tBQzNDO0lBRUQsUUFBUSxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBRXJELFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7SUFFN0IsSUFBSSxTQUFTLEVBQUU7UUFDYixXQUFXLENBQUMsUUFBUSxDQUFDLG9CQUEyQixHQUFHLFNBQVMsQ0FBQztLQUM5RDtDQUNGOzs7SUFNQyxXQUFZO0lBQ1osbUJBQWdCO0lBQ2hCLHVCQUFvQjtJQUNwQixhQUFVO0lBQ1YsaUJBQWM7SUFDZCxlQUFZO0lBQ1osbUJBQWdCO0lBQ2hCLE9BQUk7SUFDSixpQkFBYztJQUNkLGVBQVk7SUFDWixjQUFVO0lBQ1YsY0FBVTtJQUNWLGtCQUFjO0lBQ2QsaUJBQWE7SUFDYixpQkFBYTtJQUNiLGtCQUFjO0lBQ2QsZ0JBQVk7SUFDWixjQUFVO0lBQ1YsY0FBVTtJQUNWLGFBQVM7Ozs7O0lBT1Qsd0JBQXlCO0lBQ3pCLDJCQUF3QjtJQUN4Qix1QkFBb0I7Ozs7O0lBTVcsU0FBVSxFQUFFLGVBQVksRUFBRSxhQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IExPQ0FMRV9EQVRBOiB7W2xvY2FsZUlkOiBzdHJpbmddOiBhbnl9ID0ge307XG5cbi8qKlxuICogUmVnaXN0ZXIgZ2xvYmFsIGRhdGEgdG8gYmUgdXNlZCBpbnRlcm5hbGx5IGJ5IEFuZ3VsYXIuIFNlZSB0aGVcbiAqIFtcIkkxOG4gZ3VpZGVcIl0oZ3VpZGUvaTE4biNpMThuLXBpcGVzKSB0byBrbm93IGhvdyB0byBpbXBvcnQgYWRkaXRpb25hbCBsb2NhbGUgZGF0YS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbi8vIFRoZSBzaWduYXR1cmUgcmVnaXN0ZXJMb2NhbGVEYXRhKGRhdGE6IGFueSwgZXh0cmFEYXRhPzogYW55KSBpcyBkZXByZWNhdGVkIHNpbmNlIHY1LjFcbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckxvY2FsZURhdGEoZGF0YTogYW55LCBsb2NhbGVJZD86IHN0cmluZyB8IGFueSwgZXh0cmFEYXRhPzogYW55KTogdm9pZCB7XG4gIGlmICh0eXBlb2YgbG9jYWxlSWQgIT09ICdzdHJpbmcnKSB7XG4gICAgZXh0cmFEYXRhID0gbG9jYWxlSWQ7XG4gICAgbG9jYWxlSWQgPSBkYXRhW0xvY2FsZURhdGFJbmRleC5Mb2NhbGVJZF07XG4gIH1cblxuICBsb2NhbGVJZCA9IGxvY2FsZUlkLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXy9nLCAnLScpO1xuXG4gIExPQ0FMRV9EQVRBW2xvY2FsZUlkXSA9IGRhdGE7XG5cbiAgaWYgKGV4dHJhRGF0YSkge1xuICAgIExPQ0FMRV9EQVRBW2xvY2FsZUlkXVtMb2NhbGVEYXRhSW5kZXguRXh0cmFEYXRhXSA9IGV4dHJhRGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIEluZGV4IG9mIGVhY2ggdHlwZSBvZiBsb2NhbGUgZGF0YSBmcm9tIHRoZSBsb2NhbGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgY29uc3QgZW51bSBMb2NhbGVEYXRhSW5kZXgge1xuICBMb2NhbGVJZCA9IDAsXG4gIERheVBlcmlvZHNGb3JtYXQsXG4gIERheVBlcmlvZHNTdGFuZGFsb25lLFxuICBEYXlzRm9ybWF0LFxuICBEYXlzU3RhbmRhbG9uZSxcbiAgTW9udGhzRm9ybWF0LFxuICBNb250aHNTdGFuZGFsb25lLFxuICBFcmFzLFxuICBGaXJzdERheU9mV2VlayxcbiAgV2Vla2VuZFJhbmdlLFxuICBEYXRlRm9ybWF0LFxuICBUaW1lRm9ybWF0LFxuICBEYXRlVGltZUZvcm1hdCxcbiAgTnVtYmVyU3ltYm9scyxcbiAgTnVtYmVyRm9ybWF0cyxcbiAgQ3VycmVuY3lTeW1ib2wsXG4gIEN1cnJlbmN5TmFtZSxcbiAgQ3VycmVuY2llcyxcbiAgUGx1cmFsQ2FzZSxcbiAgRXh0cmFEYXRhXG59XG5cbi8qKlxuICogSW5kZXggb2YgZWFjaCB0eXBlIG9mIGxvY2FsZSBkYXRhIGZyb20gdGhlIGV4dHJhIGxvY2FsZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEV4dHJhTG9jYWxlRGF0YUluZGV4IHtcbiAgRXh0cmFEYXlQZXJpb2RGb3JtYXRzID0gMCxcbiAgRXh0cmFEYXlQZXJpb2RTdGFuZGFsb25lLFxuICBFeHRyYURheVBlcmlvZHNSdWxlc1xufVxuXG4vKipcbiAqIEluZGV4IG9mIGVhY2ggdmFsdWUgaW4gY3VycmVuY3kgZGF0YSAodXNlZCB0byBkZXNjcmliZSBDVVJSRU5DSUVTX0VOIGluIGN1cnJlbmNpZXMudHMpXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEN1cnJlbmN5SW5kZXgge1N5bWJvbCA9IDAsIFN5bWJvbE5hcnJvdywgTmJPZkRpZ2l0c31cbiJdfQ==