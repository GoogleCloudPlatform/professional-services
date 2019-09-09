/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import localeEn from './locale_en';
import { LOCALE_DATA } from './locale_data';
import { CURRENCIES_EN } from './currencies';
/**
 * The different format styles that can be used to represent numbers.
 * Used by the function {@link getLocaleNumberFormat}.
 *
 * @publicApi
 */
export var NumberFormatStyle;
(function (NumberFormatStyle) {
    NumberFormatStyle[NumberFormatStyle["Decimal"] = 0] = "Decimal";
    NumberFormatStyle[NumberFormatStyle["Percent"] = 1] = "Percent";
    NumberFormatStyle[NumberFormatStyle["Currency"] = 2] = "Currency";
    NumberFormatStyle[NumberFormatStyle["Scientific"] = 3] = "Scientific";
})(NumberFormatStyle || (NumberFormatStyle = {}));
/** @publicApi */
export var Plural;
(function (Plural) {
    Plural[Plural["Zero"] = 0] = "Zero";
    Plural[Plural["One"] = 1] = "One";
    Plural[Plural["Two"] = 2] = "Two";
    Plural[Plural["Few"] = 3] = "Few";
    Plural[Plural["Many"] = 4] = "Many";
    Plural[Plural["Other"] = 5] = "Other";
})(Plural || (Plural = {}));
/**
 * Some languages use two different forms of strings (standalone and format) depending on the
 * context.
 * Typically the standalone version is the nominative form of the word, and the format version is in
 * the genitive.
 * See [the CLDR website](http://cldr.unicode.org/translation/date-time) for more information.
 *
 * @publicApi
 */
export var FormStyle;
(function (FormStyle) {
    FormStyle[FormStyle["Format"] = 0] = "Format";
    FormStyle[FormStyle["Standalone"] = 1] = "Standalone";
})(FormStyle || (FormStyle = {}));
/**
 * Multiple widths are available for translations: narrow (1 character), abbreviated (3 characters),
 * wide (full length), and short (2 characters, only for days).
 *
 * For example the day `Sunday` will be:
 * - Narrow: `S`
 * - Short: `Su`
 * - Abbreviated: `Sun`
 * - Wide: `Sunday`
 *
 * @publicApi
 */
export var TranslationWidth;
(function (TranslationWidth) {
    TranslationWidth[TranslationWidth["Narrow"] = 0] = "Narrow";
    TranslationWidth[TranslationWidth["Abbreviated"] = 1] = "Abbreviated";
    TranslationWidth[TranslationWidth["Wide"] = 2] = "Wide";
    TranslationWidth[TranslationWidth["Short"] = 3] = "Short";
})(TranslationWidth || (TranslationWidth = {}));
/**
 * Multiple widths are available for formats: short (minimal amount of data), medium (small amount
 * of data), long (complete amount of data), full (complete amount of data and extra information).
 *
 * For example the date-time formats for the english locale will be:
 *  - `'short'`: `'M/d/yy, h:mm a'` (e.g. `6/15/15, 9:03 AM`)
 *  - `'medium'`: `'MMM d, y, h:mm:ss a'` (e.g. `Jun 15, 2015, 9:03:01 AM`)
 *  - `'long'`: `'MMMM d, y, h:mm:ss a z'` (e.g. `June 15, 2015 at 9:03:01 AM GMT+1`)
 *  - `'full'`: `'EEEE, MMMM d, y, h:mm:ss a zzzz'` (e.g. `Monday, June 15, 2015 at
 * 9:03:01 AM GMT+01:00`)
 *
 * @publicApi
 */
export var FormatWidth;
(function (FormatWidth) {
    FormatWidth[FormatWidth["Short"] = 0] = "Short";
    FormatWidth[FormatWidth["Medium"] = 1] = "Medium";
    FormatWidth[FormatWidth["Long"] = 2] = "Long";
    FormatWidth[FormatWidth["Full"] = 3] = "Full";
})(FormatWidth || (FormatWidth = {}));
/**
 * Number symbol that can be used to replace placeholders in number patterns.
 * The placeholders are based on english values:
 *
 * | Name                   | Example for en-US | Meaning                                     |
 * |------------------------|-------------------|---------------------------------------------|
 * | decimal                | 2,345`.`67        | decimal separator                           |
 * | group                  | 2`,`345.67        | grouping separator, typically for thousands |
 * | plusSign               | `+`23             | the plus sign used with numbers             |
 * | minusSign              | `-`23             | the minus sign used with numbers            |
 * | percentSign            | 23.4`%`           | the percent sign (out of 100)               |
 * | perMille               | 234`‰`            | the permille sign (out of 1000)             |
 * | exponential            | 1.2`E`3           | used in computers for 1.2×10³.              |
 * | superscriptingExponent | 1.2`×`103         | human-readable format of exponential        |
 * | infinity               | `∞`               | used in +∞ and -∞.                          |
 * | nan                    | `NaN`             | "not a number".                             |
 * | timeSeparator          | 10`:`52           | symbol used between time units              |
 * | currencyDecimal        | $2,345`.`67       | decimal separator, fallback to "decimal"    |
 * | currencyGroup          | $2`,`345.67       | grouping separator, fallback to "group"     |
 *
 * @publicApi
 */
export var NumberSymbol;
(function (NumberSymbol) {
    NumberSymbol[NumberSymbol["Decimal"] = 0] = "Decimal";
    NumberSymbol[NumberSymbol["Group"] = 1] = "Group";
    NumberSymbol[NumberSymbol["List"] = 2] = "List";
    NumberSymbol[NumberSymbol["PercentSign"] = 3] = "PercentSign";
    NumberSymbol[NumberSymbol["PlusSign"] = 4] = "PlusSign";
    NumberSymbol[NumberSymbol["MinusSign"] = 5] = "MinusSign";
    NumberSymbol[NumberSymbol["Exponential"] = 6] = "Exponential";
    NumberSymbol[NumberSymbol["SuperscriptingExponent"] = 7] = "SuperscriptingExponent";
    NumberSymbol[NumberSymbol["PerMille"] = 8] = "PerMille";
    NumberSymbol[NumberSymbol["Infinity"] = 9] = "Infinity";
    NumberSymbol[NumberSymbol["NaN"] = 10] = "NaN";
    NumberSymbol[NumberSymbol["TimeSeparator"] = 11] = "TimeSeparator";
    NumberSymbol[NumberSymbol["CurrencyDecimal"] = 12] = "CurrencyDecimal";
    NumberSymbol[NumberSymbol["CurrencyGroup"] = 13] = "CurrencyGroup";
})(NumberSymbol || (NumberSymbol = {}));
/**
 * The value for each day of the week, based on the en-US locale
 *
 * @publicApi
 */
export var WeekDay;
(function (WeekDay) {
    WeekDay[WeekDay["Sunday"] = 0] = "Sunday";
    WeekDay[WeekDay["Monday"] = 1] = "Monday";
    WeekDay[WeekDay["Tuesday"] = 2] = "Tuesday";
    WeekDay[WeekDay["Wednesday"] = 3] = "Wednesday";
    WeekDay[WeekDay["Thursday"] = 4] = "Thursday";
    WeekDay[WeekDay["Friday"] = 5] = "Friday";
    WeekDay[WeekDay["Saturday"] = 6] = "Saturday";
})(WeekDay || (WeekDay = {}));
/**
 * The locale id for the chosen locale (e.g `en-GB`).
 *
 * @publicApi
 */
export function getLocaleId(locale) {
    return findLocaleData(locale)[0 /* LocaleId */];
}
/**
 * Periods of the day (e.g. `[AM, PM]` for en-US).
 *
 * @publicApi
 */
export function getLocaleDayPeriods(locale, formStyle, width) {
    var data = findLocaleData(locale);
    var amPmData = [data[1 /* DayPeriodsFormat */], data[2 /* DayPeriodsStandalone */]];
    var amPm = getLastDefinedValue(amPmData, formStyle);
    return getLastDefinedValue(amPm, width);
}
/**
 * Days of the week for the Gregorian calendar (e.g. `[Sunday, Monday, ... Saturday]` for en-US).
 *
 * @publicApi
 */
export function getLocaleDayNames(locale, formStyle, width) {
    var data = findLocaleData(locale);
    var daysData = [data[3 /* DaysFormat */], data[4 /* DaysStandalone */]];
    var days = getLastDefinedValue(daysData, formStyle);
    return getLastDefinedValue(days, width);
}
/**
 * Months of the year for the Gregorian calendar (e.g. `[January, February, ...]` for en-US).
 *
 * @publicApi
 */
export function getLocaleMonthNames(locale, formStyle, width) {
    var data = findLocaleData(locale);
    var monthsData = [data[5 /* MonthsFormat */], data[6 /* MonthsStandalone */]];
    var months = getLastDefinedValue(monthsData, formStyle);
    return getLastDefinedValue(months, width);
}
/**
 * Eras for the Gregorian calendar (e.g. AD/BC).
 *
 * @publicApi
 */
export function getLocaleEraNames(locale, width) {
    var data = findLocaleData(locale);
    var erasData = data[7 /* Eras */];
    return getLastDefinedValue(erasData, width);
}
/**
 * First day of the week for this locale, based on english days (Sunday = 0, Monday = 1, ...).
 * For example in french the value would be 1 because the first day of the week is Monday.
 *
 * @publicApi
 */
export function getLocaleFirstDayOfWeek(locale) {
    var data = findLocaleData(locale);
    return data[8 /* FirstDayOfWeek */];
}
/**
 * Range of days in the week that represent the week-end for this locale, based on english days
 * (Sunday = 0, Monday = 1, ...).
 * For example in english the value would be [6,0] for Saturday to Sunday.
 *
 * @publicApi
 */
export function getLocaleWeekEndRange(locale) {
    var data = findLocaleData(locale);
    return data[9 /* WeekendRange */];
}
/**
 * Date format that depends on the locale.
 *
 * There are four basic date formats:
 * - `full` should contain long-weekday (EEEE), year (y), long-month (MMMM), day (d).
 *
 *  For example, English uses `EEEE, MMMM d, y`, corresponding to a date like
 *  "Tuesday, September 14, 1999".
 *
 * - `long` should contain year, long-month, day.
 *
 *  For example, `MMMM d, y`, corresponding to a date like "September 14, 1999".
 *
 * - `medium` should contain year, abbreviated-month (MMM), day.
 *
 *  For example, `MMM d, y`, corresponding to a date like "Sep 14, 1999".
 *  For languages that do not use abbreviated months, use the numeric month (MM/M). For example,
 *  `y/MM/dd`, corresponding to a date like "1999/09/14".
 *
 * - `short` should contain year, numeric-month (MM/M), and day.
 *
 *  For example, `M/d/yy`, corresponding to a date like "9/14/99".
 *
 * @publicApi
 */
export function getLocaleDateFormat(locale, width) {
    var data = findLocaleData(locale);
    return getLastDefinedValue(data[10 /* DateFormat */], width);
}
/**
 * Time format that depends on the locale.
 *
 * The standard formats include four basic time formats:
 * - `full` should contain hour (h/H), minute (mm), second (ss), and zone (zzzz).
 * - `long` should contain hour, minute, second, and zone (z)
 * - `medium` should contain hour, minute, second.
 * - `short` should contain hour, minute.
 *
 * Note: The patterns depend on whether the main country using your language uses 12-hour time or
 * not:
 * - For 12-hour time, use a pattern like `hh:mm a` using h to mean a 12-hour clock cycle running
 * 1 through 12 (midnight plus 1 minute is 12:01), or using K to mean a 12-hour clock cycle
 * running 0 through 11 (midnight plus 1 minute is 0:01).
 * - For 24-hour time, use a pattern like `HH:mm` using H to mean a 24-hour clock cycle running 0
 * through 23 (midnight plus 1 minute is 0:01), or using k to mean a 24-hour clock cycle running
 * 1 through 24 (midnight plus 1 minute is 24:01).
 *
 * @publicApi
 */
export function getLocaleTimeFormat(locale, width) {
    var data = findLocaleData(locale);
    return getLastDefinedValue(data[11 /* TimeFormat */], width);
}
/**
 * Date-time format that depends on the locale.
 *
 * The date-time pattern shows how to combine separate patterns for date (represented by {1})
 * and time (represented by {0}) into a single pattern. It usually doesn't need to be changed.
 * What you want to pay attention to are:
 * - possibly removing a space for languages that don't use it, such as many East Asian languages
 * - possibly adding a comma, other punctuation, or a combining word
 *
 * For example:
 * - English uses `{1} 'at' {0}` or `{1}, {0}` (depending on date style), while Japanese uses
 *  `{1}{0}`.
 * - An English formatted date-time using the combining pattern `{1}, {0}` could be
 *  `Dec 10, 2010, 3:59:49 PM`. Notice the comma and space between the date portion and the time
 *  portion.
 *
 * There are four formats (`full`, `long`, `medium`, `short`); the determination of which to use
 * is normally based on the date style. For example, if the date has a full month and weekday
 * name, the full combining pattern will be used to combine that with a time. If the date has
 * numeric month, the short version of the combining pattern will be used to combine that with a
 * time. English uses `{1} 'at' {0}` for full and long styles, and `{1}, {0}` for medium and short
 * styles.
 *
 * @publicApi
 */
export function getLocaleDateTimeFormat(locale, width) {
    var data = findLocaleData(locale);
    var dateTimeFormatData = data[12 /* DateTimeFormat */];
    return getLastDefinedValue(dateTimeFormatData, width);
}
/**
 * Number symbol that can be used to replace placeholders in number formats.
 * See {@link NumberSymbol} for more information.
 *
 * @publicApi
 */
export function getLocaleNumberSymbol(locale, symbol) {
    var data = findLocaleData(locale);
    var res = data[13 /* NumberSymbols */][symbol];
    if (typeof res === 'undefined') {
        if (symbol === NumberSymbol.CurrencyDecimal) {
            return data[13 /* NumberSymbols */][NumberSymbol.Decimal];
        }
        else if (symbol === NumberSymbol.CurrencyGroup) {
            return data[13 /* NumberSymbols */][NumberSymbol.Group];
        }
    }
    return res;
}
/**
 * Number format that depends on the locale.
 *
 * Numbers are formatted using patterns, like `#,###.00`. For example, the pattern `#,###.00`
 * when used to format the number 12345.678 could result in "12'345,67". That would happen if the
 * grouping separator for your language is an apostrophe, and the decimal separator is a comma.
 *
 * <b>Important:</b> The characters `.` `,` `0` `#` (and others below) are special placeholders;
 * they stand for the decimal separator, and so on, and are NOT real characters.
 * You must NOT "translate" the placeholders; for example, don't change `.` to `,` even though in
 * your language the decimal point is written with a comma. The symbols should be replaced by the
 * local equivalents, using the Number Symbols for your language.
 *
 * Here are the special characters used in number patterns:
 *
 * | Symbol | Meaning |
 * |--------|---------|
 * | . | Replaced automatically by the character used for the decimal point. |
 * | , | Replaced by the "grouping" (thousands) separator. |
 * | 0 | Replaced by a digit (or zero if there aren't enough digits). |
 * | # | Replaced by a digit (or nothing if there aren't enough). |
 * | ¤ | This will be replaced by a currency symbol, such as $ or USD. |
 * | % | This marks a percent format. The % symbol may change position, but must be retained. |
 * | E | This marks a scientific format. The E symbol may change position, but must be retained. |
 * | ' | Special characters used as literal characters are quoted with ASCII single quotes. |
 *
 * You can find more information
 * [on the CLDR website](http://cldr.unicode.org/translation/number-patterns)
 *
 * @publicApi
 */
export function getLocaleNumberFormat(locale, type) {
    var data = findLocaleData(locale);
    return data[14 /* NumberFormats */][type];
}
/**
 * The symbol used to represent the currency for the main country using this locale (e.g. $ for
 * the locale en-US).
 * The symbol will be `null` if the main country cannot be determined.
 *
 * @publicApi
 */
export function getLocaleCurrencySymbol(locale) {
    var data = findLocaleData(locale);
    return data[15 /* CurrencySymbol */] || null;
}
/**
 * The name of the currency for the main country using this locale (e.g. USD for the locale
 * en-US).
 * The name will be `null` if the main country cannot be determined.
 *
 * @publicApi
 */
export function getLocaleCurrencyName(locale) {
    var data = findLocaleData(locale);
    return data[16 /* CurrencyName */] || null;
}
/**
 * Returns the currency values for the locale
 */
function getLocaleCurrencies(locale) {
    var data = findLocaleData(locale);
    return data[17 /* Currencies */];
}
/**
 * The locale plural function used by ICU expressions to determine the plural case to use.
 * See {@link NgPlural} for more information.
 *
 * @publicApi
 */
export function getLocalePluralCase(locale) {
    var data = findLocaleData(locale);
    return data[18 /* PluralCase */];
}
function checkFullData(data) {
    if (!data[19 /* ExtraData */]) {
        throw new Error("Missing extra locale data for the locale \"" + data[0 /* LocaleId */] + "\". Use \"registerLocaleData\" to load new data. See the \"I18n guide\" on angular.io to know more.");
    }
}
/**
 * Rules used to determine which day period to use (See `dayPeriods` below).
 * The rules can either be an array or a single value. If it's an array, consider it as "from"
 * and "to". If it's a single value then it means that the period is only valid at this exact
 * value.
 * There is always the same number of rules as the number of day periods, which means that the
 * first rule is applied to the first day period and so on.
 * You should fallback to AM/PM when there are no rules available.
 *
 * Note: this is only available if you load the full locale data.
 * See the ["I18n guide"](guide/i18n#i18n-pipes) to know how to import additional locale
 * data.
 *
 * @publicApi
 */
export function getLocaleExtraDayPeriodRules(locale) {
    var data = findLocaleData(locale);
    checkFullData(data);
    var rules = data[19 /* ExtraData */][2 /* ExtraDayPeriodsRules */] || [];
    return rules.map(function (rule) {
        if (typeof rule === 'string') {
            return extractTime(rule);
        }
        return [extractTime(rule[0]), extractTime(rule[1])];
    });
}
/**
 * Day Periods indicate roughly how the day is broken up in different languages (e.g. morning,
 * noon, afternoon, midnight, ...).
 * You should use the function {@link getLocaleExtraDayPeriodRules} to determine which period to
 * use.
 * You should fallback to AM/PM when there are no day periods available.
 *
 * Note: this is only available if you load the full locale data.
 * See the ["I18n guide"](guide/i18n#i18n-pipes) to know how to import additional locale
 * data.
 *
 * @publicApi
 */
export function getLocaleExtraDayPeriods(locale, formStyle, width) {
    var data = findLocaleData(locale);
    checkFullData(data);
    var dayPeriodsData = [
        data[19 /* ExtraData */][0 /* ExtraDayPeriodFormats */],
        data[19 /* ExtraData */][1 /* ExtraDayPeriodStandalone */]
    ];
    var dayPeriods = getLastDefinedValue(dayPeriodsData, formStyle) || [];
    return getLastDefinedValue(dayPeriods, width) || [];
}
/**
 * Returns the first value that is defined in an array, going backwards.
 *
 * To avoid repeating the same data (e.g. when "format" and "standalone" are the same) we only
 * add the first one to the locale data arrays, the other ones are only defined when different.
 * We use this function to retrieve the first defined value.
 *
 * @publicApi
 */
function getLastDefinedValue(data, index) {
    for (var i = index; i > -1; i--) {
        if (typeof data[i] !== 'undefined') {
            return data[i];
        }
    }
    throw new Error('Locale data API: locale data undefined');
}
/**
 * Extract the hours and minutes from a string like "15:45"
 */
function extractTime(time) {
    var _a = tslib_1.__read(time.split(':'), 2), h = _a[0], m = _a[1];
    return { hours: +h, minutes: +m };
}
/**
 * Finds the locale data for a locale id
 *
 * @publicApi
 */
export function findLocaleData(locale) {
    var normalizedLocale = locale.toLowerCase().replace(/_/g, '-');
    var match = LOCALE_DATA[normalizedLocale];
    if (match) {
        return match;
    }
    // let's try to find a parent locale
    var parentLocale = normalizedLocale.split('-')[0];
    match = LOCALE_DATA[parentLocale];
    if (match) {
        return match;
    }
    if (parentLocale === 'en') {
        return localeEn;
    }
    throw new Error("Missing locale data for the locale \"" + locale + "\".");
}
/**
 * Returns the currency symbol for a given currency code, or the code if no symbol available
 * (e.g.: format narrow = $, format wide = US$, code = USD)
 * If no locale is provided, it uses the locale "en" by default
 *
 * @publicApi
 */
export function getCurrencySymbol(code, format, locale) {
    if (locale === void 0) { locale = 'en'; }
    var currency = getLocaleCurrencies(locale)[code] || CURRENCIES_EN[code] || [];
    var symbolNarrow = currency[1 /* SymbolNarrow */];
    if (format === 'narrow' && typeof symbolNarrow === 'string') {
        return symbolNarrow;
    }
    return currency[0 /* Symbol */] || code;
}
// Most currencies have cents, that's why the default is 2
var DEFAULT_NB_OF_CURRENCY_DIGITS = 2;
/**
 * Returns the number of decimal digits for the given currency.
 * Its value depends upon the presence of cents in that particular currency.
 *
 * @publicApi
 */
export function getNumberOfCurrencyDigits(code) {
    var digits;
    var currency = CURRENCIES_EN[code];
    if (currency) {
        digits = currency[2 /* NbOfDigits */];
    }
    return typeof digits === 'number' ? digits : DEFAULT_NB_OF_CURRENCY_DIGITS;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxlX2RhdGFfYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tbW9uL3NyYy9pMThuL2xvY2FsZV9kYXRhX2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxRQUFRLE1BQU0sYUFBYSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxXQUFXLEVBQXVELE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFBQyxhQUFhLEVBQW9CLE1BQU0sY0FBYyxDQUFDO0FBRTlEOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFOLElBQVksaUJBS1g7QUFMRCxXQUFZLGlCQUFpQjtJQUMzQiwrREFBTyxDQUFBO0lBQ1AsK0RBQU8sQ0FBQTtJQUNQLGlFQUFRLENBQUE7SUFDUixxRUFBVSxDQUFBO0FBQ1osQ0FBQyxFQUxXLGlCQUFpQixLQUFqQixpQkFBaUIsUUFLNUI7QUFFRCxpQkFBaUI7QUFDakIsTUFBTSxDQUFOLElBQVksTUFPWDtBQVBELFdBQVksTUFBTTtJQUNoQixtQ0FBUSxDQUFBO0lBQ1IsaUNBQU8sQ0FBQTtJQUNQLGlDQUFPLENBQUE7SUFDUCxpQ0FBTyxDQUFBO0lBQ1AsbUNBQVEsQ0FBQTtJQUNSLHFDQUFTLENBQUE7QUFDWCxDQUFDLEVBUFcsTUFBTSxLQUFOLE1BQU0sUUFPakI7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sQ0FBTixJQUFZLFNBR1g7QUFIRCxXQUFZLFNBQVM7SUFDbkIsNkNBQU0sQ0FBQTtJQUNOLHFEQUFVLENBQUE7QUFDWixDQUFDLEVBSFcsU0FBUyxLQUFULFNBQVMsUUFHcEI7QUFFRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILE1BQU0sQ0FBTixJQUFZLGdCQUtYO0FBTEQsV0FBWSxnQkFBZ0I7SUFDMUIsMkRBQU0sQ0FBQTtJQUNOLHFFQUFXLENBQUE7SUFDWCx1REFBSSxDQUFBO0lBQ0oseURBQUssQ0FB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QUM7SUFDWCxJQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsSUFBSSxRQUFRLEVBQUU7UUFDWixNQUFNLEdBQUcsUUFBUSxvQkFBMEIsQ0FBQztLQUM3QztJQUNELE9BQU8sT0FBTyxNQUFNLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDO0FBQzdFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCBsb2NhbGVFbiBmcm9tICcuL2xvY2FsZV9lbic7XG5pbXBvcnQge0xPQ0FMRV9EQVRBLCBMb2NhbGVEYXRhSW5kZXgsIEV4dHJhTG9jYWxlRGF0YUluZGV4LCBDdXJyZW5jeUluZGV4fSBmcm9tICcuL2xvY2FsZV9kYXRhJztcbmltcG9ydCB7Q1VSUkVOQ0lFU19FTiwgQ3VycmVuY2llc1N5bWJvbHN9IGZyb20gJy4vY3VycmVuY2llcyc7XG5cbi8qKlxuICogVGhlIGRpZmZlcmVudCBmb3JtYXQgc3R5bGVzIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVwcmVzZW50IG51bWJlcnMuXG4gKiBVc2VkIGJ5IHRoZSBmdW5jdGlvbiB7QGxpbmsgZ2V0TG9jYWxlTnVtYmVyRm9ybWF0fS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBlbnVtIE51bWJlckZvcm1hdFN0eWxlIHtcbiAgRGVjaW1hbCxcbiAgUGVyY2VudCxcbiAgQ3VycmVuY3ksXG4gIFNjaWVudGlmaWNcbn1cblxuLyoqIEBwdWJsaWNBcGkgKi9cbmV4cG9ydCBlbnVtIFBsdXJhbCB7XG4gIFplcm8gPSAwLFxuICBPbmUgPSAxLFxuICBUd28gPSAyLFxuICBGZXcgPSAzLFxuICBNYW55ID0gNCxcbiAgT3RoZXIgPSA1LFxufVxuXG4vKipcbiAqIFNvbWUgbGFuZ3VhZ2VzIHVzZSB0d28gZGlmZmVyZW50IGZvcm1zIG9mIHN0cmluZ3MgKHN0YW5kYWxvbmUgYW5kIGZvcm1hdCkgZGVwZW5kaW5nIG9uIHRoZVxuICogY29udGV4dC5cbiAqIFR5cGljYWxseSB0aGUgc3RhbmRhbG9uZSB2ZXJzaW9uIGlzIHRoZSBub21pbmF0aXZlIGZvcm0gb2YgdGhlIHdvcmQsIGFuZCB0aGUgZm9ybWF0IHZlcnNpb24gaXMgaW5cbiAqIHRoZSBnZW5pdGl2ZS5cbiAqIFNlZSBbdGhlIENMRFIgd2Vic2l0ZV0oaHR0cDovL2NsZHIudW5pY29kZS5vcmcvdHJhbnNsYXRpb24vZGF0ZS10aW1lKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBlbnVtIEZvcm1TdHlsZSB7XG4gIEZvcm1hdCxcbiAgU3RhbmRhbG9uZVxufVxuXG4vKipcbiAqIE11bHRpcGxlIHdpZHRocyBhcmUgYXZhaWxhYmxlIGZvciB0cmFuc2xhdGlvbnM6IG5hcnJvdyAoMSBjaGFyYWN0ZXIpLCBhYmJyZXZpYXRlZCAoMyBjaGFyYWN0ZXJzKSxcbiAqIHdpZGUgKGZ1bGwgbGVuZ3RoKSwgYW5kIHNob3J0ICgyIGNoYXJhY3RlcnMsIG9ubHkgZm9yIGRheXMpLlxuICpcbiAqIEZvciBleGFtcGxlIHRoZSBkYXkgYFN1bmRheWAgd2lsbCBiZTpcbiAqIC0gTmFycm93OiBgU2BcbiAqIC0gU2hvcnQ6IGBTdWBcbiAqIC0gQWJicmV2aWF0ZWQ6IGBTdW5gXG4gKiAtIFdpZGU6IGBTdW5kYXlgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZW51bSBUcmFuc2xhdGlvbldpZHRoIHtcbiAgTmFycm93LFxuICBBYmJyZXZpYXRlZCxcbiAgV2lkZSxcbiAgU2hvcnRcbn1cblxuLyoqXG4gKiBNdWx0aXBsZSB3aWR0aHMgYXJlIGF2YWlsYWJsZSBmb3IgZm9ybWF0czogc2hvcnQgKG1pbmltYWwgYW1vdW50IG9mIGRhdGEpLCBtZWRpdW0gKHNtYWxsIGFtb3VudFxuICogb2YgZGF0YSksIGxvbmcgKGNvbXBsZXRlIGFtb3VudCBvZiBkYXRhKSwgZnVsbCAoY29tcGxldGUgYW1vdW50IG9mIGRhdGEgYW5kIGV4dHJhIGluZm9ybWF0aW9uKS5cbiAqXG4gKiBGb3IgZXhhbXBsZSB0aGUgZGF0ZS10aW1lIGZvcm1hdHMgZm9yIHRoZSBlbmdsaXNoIGxvY2FsZSB3aWxsIGJlOlxuICogIC0gYCdzaG9ydCdgOiBgJ00vZC95eSwgaDptbSBhJ2AgKGUuZy4gYDYvMTUvMTUsIDk6MDMgQU1gKVxuICogIC0gYCdtZWRpdW0nYDogYCdNTU0gZCwgeSwgaDptbTpzcyBhJ2AgKGUuZy4gYEp1biAxNSwgMjAxNSwgOTowMzowMSBBTWApXG4gKiAgLSBgJ2xvbmcnYDogYCdNTU1NIGQsIHksIGg6bW06c3MgYSB6J2AgKGUuZy4gYEp1bmUgMTUsIDIwMTUgYXQgOTowMzowMSBBTSBHTVQrMWApXG4gKiAgLSBgJ2Z1bGwnYDogYCdFRUVFLCBNTU1NIGQsIHksIGg6bW06c3MgYSB6enp6J2AgKGUuZy4gYE1vbmRheSwgSnVuZSAxNSwgMjAxNSBhdFxuICogOTowMzowMSBBTSBHTVQrMDE6MDBgKVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGVudW0gRm9ybWF0V2lkdGgge1xuICBTaG9ydCxcbiAgTWVkaXVtLFxuICBMb25nLFxuICBGdWxsXG59XG5cbi8qKlxuICogTnVtYmVyIHN5bWJvbCB0aGF0IGNhbiBiZSB1c2VkIHRvIHJlcGxhY2UgcGxhY2Vob2xkZXJzIGluIG51bWJlciBwYXR0ZXJucy5cbiAqIFRoZSBwbGFjZWhvbGRlcnMgYXJlIGJhc2VkIG9uIGVuZ2xpc2ggdmFsdWVzOlxuICpcbiAqIHwgTmFtZSAgICAgICAgICAgICAgICAgICB8IEV4YW1wbGUgZm9yIGVuLVVTIHwgTWVhbmluZyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tfFxuICogfCBkZWNpbWFsICAgICAgICAgICAgICAgIHwgMiwzNDVgLmA2NyAgICAgICAgfCBkZWNpbWFsIHNlcGFyYXRvciAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqIHwgZ3JvdXAgICAgICAgICAgICAgICAgICB8IDJgLGAzNDUuNjcgICAgICAgIHwgZ3JvdXBpbmcgc2VwYXJhdG9yLCB0eXBpY2FsbHkgZm9yIHRob3VzYW5kcyB8XG4gKiB8IHBsdXNTaWduICAgICAgICAgICAgICAgfCBgK2AyMyAgICAgICAgICAgICB8IHRoZSBwbHVzIHNpZ24gdXNlZCB3aXRoIG51bWJlcnMgICAgICAgICAgICAgfFxuICogfCBtaW51c1NpZ24gICAgICAgICAgICAgIHwgYC1gMjMgICAgICAgICAgICAgfCB0aGUgbWludXMgc2lnbiB1c2VkIHdpdGggbnVtYmVycyAgICAgICAgICAgIHxcbiAqIHwgcGVyY2VudFNpZ24gICAgICAgICAgICB8IDIzLjRgJWAgICAgICAgICAgIHwgdGhlIHBlcmNlbnQgc2lnbiAob3V0IG9mIDEwMCkgICAgICAgICAgICAgICB8XG4gKiB8IHBlck1pbGxlICAgICAgICAgICAgICAgfCAyMzRg4oCwYCAgICAgICAgICAgIHwgdGhlIHBlcm1pbGxlIHNpZ24gKG91dCBvZiAxMDAwKSAgICAgICAgICAgICB8XG4gKiB8IGV4cG9uZW50aWFsICAgICAgICAgICAgfCAxLjJgRWAzICAgICAgICAgICB8IHVzZWQgaW4gY29tcHV0ZXJzIGZvciAxLjLDlzEwwrMuICAgICAgICAgICAgICB8XG4gKiB8IHN1cGVyc2NyaXB0aW5nRXhwb25lbnQgfCAxLjJgw5dgMTAzICAgICAgICAgfCBodW1hbi1yZWFkYWJsZSBmb3JtYXQgb2YgZXhwb25lbnRpYWwgICAgICAgIHxcbiAqIHwgaW5maW5pdHkgICAgICAgICAgICAgICB8IGDiiJ5gICAgICAgICAgICAgICAgfCB1c2VkIGluICviiJ4gYW5kIC3iiJ4uICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiB8IG5hbiAgICAgICAgICAgICAgICAgICAgfCBgTmFOYCAgICAgICAgICAgICB8IFwibm90IGEgbnVtYmVyXCIuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiB8IHRpbWVTZXBhcmF0b3IgICAgICAgICAgfCAxMGA6YDUyICAgICAgICAgICB8IHN5bWJvbCB1c2VkIGJldHdlZW4gdGltZSB1bml0cyAgICAgICAgICAgICAgfFxuICogfCBjdXJyZW5jeURlY2ltYWwgICAgICAgIHwgJDIsMzQ1YC5gNjcgICAgICAgfCBkZWNpbWFsIHNlcGFyYXRvciwgZmFsbGJhY2sgdG8gXCJkZWNpbWFsXCIgICAgfFxuICogfCBjdXJyZW5jeUdyb3VwICAgICAgICAgIHwgJDJgLGAzNDUuNjcgICAgICAgfCBncm91cGluZyBzZXBhcmF0b3IsIGZhbGxiYWNrIHRvIFwiZ3JvdXBcIiAgICAgfFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGVudW0gTnVtYmVyU3ltYm9sIHtcbiAgRGVjaW1hbCxcbiAgR3JvdXAsXG4gIExpc3QsXG4gIFBlcmNlbnRTaWduLFxuICBQbHVzU2lnbixcbiAgTWludXNTaWduLFxuICBFeHBvbmVudGlhbCxcbiAgU3VwZXJzY3JpcHRpbmdFeHBvbmVudCxcbiAgUGVyTWlsbGUsXG4gIEluZmluaXR5LFxuICBOYU4sXG4gIFRpbWVTZXBhcmF0b3IsXG4gIEN1cnJlbmN5RGVjaW1hbCxcbiAgQ3VycmVuY3lHcm91cFxufVxuXG4vKipcbiAqIFRoZSB2YWx1ZSBmb3IgZWFjaCBkYXkgb2YgdGhlIHdlZWssIGJhc2VkIG9uIHRoZSBlbi1VUyBsb2NhbGVcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBlbnVtIFdlZWtEYXkge1xuICBTdW5kYXkgPSAwLFxuICBNb25kYXksXG4gIFR1ZXNkYXksXG4gIFdlZG5lc2RheSxcbiAgVGh1cnNkYXksXG4gIEZyaWRheSxcbiAgU2F0dXJkYXlcbn1cblxuLyoqXG4gKiBUaGUgbG9jYWxlIGlkIGZvciB0aGUgY2hvc2VuIGxvY2FsZSAoZS5nIGBlbi1HQmApLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUlkKGxvY2FsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGZpbmRMb2NhbGVEYXRhKGxvY2FsZSlbTG9jYWxlRGF0YUluZGV4LkxvY2FsZUlkXTtcbn1cblxuLyoqXG4gKiBQZXJpb2RzIG9mIHRoZSBkYXkgKGUuZy4gYFtBTSwgUE1dYCBmb3IgZW4tVVMpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZURheVBlcmlvZHMoXG4gICAgbG9jYWxlOiBzdHJpbmcsIGZvcm1TdHlsZTogRm9ybVN0eWxlLCB3aWR0aDogVHJhbnNsYXRpb25XaWR0aCk6IFtzdHJpbmcsIHN0cmluZ10ge1xuICBjb25zdCBkYXRhID0gZmluZExvY2FsZURhdGEobG9jYWxlKTtcbiAgY29uc3QgYW1QbURhdGEgPSA8W1xuICAgIHN0cmluZywgc3RyaW5nXG4gIF1bXVtdPltkYXRhW0xvY2FsZURhdGFJbmRleC5EYXlQZXJpb2RzRm9ybWF0XSwgZGF0YVtMb2NhbGVEYXRhSW5kZXguRGF5UGVyaW9kc1N0YW5kYWxvbmVdXTtcbiAgY29uc3QgYW1QbSA9IGdldExhc3REZWZpbmVkVmFsdWUoYW1QbURhdGEsIGZvcm1TdHlsZSk7XG4gIHJldHVybiBnZXRMYXN0RGVmaW5lZFZhbHVlKGFtUG0sIHdpZHRoKTtcbn1cblxuLyoqXG4gKiBEYXlzIG9mIHRoZSB3ZWVrIGZvciB0aGUgR3JlZ29yaWFuIGNhbGVuZGFyIChlLmcuIGBbU3VuZGF5LCBNb25kYXksIC4uLiBTYXR1cmRheV1gIGZvciBlbi1VUykuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlRGF5TmFtZXMoXG4gICAgbG9jYWxlOiBzdHJpbmcsIGZvcm1TdHlsZTogRm9ybVN0eWxlLCB3aWR0aDogVHJhbnNsYXRpb25XaWR0aCk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIGNvbnN0IGRheXNEYXRhID1cbiAgICAgIDxzdHJpbmdbXVtdW10+W2RhdGFbTG9jYWxlRGF0YUluZGV4LkRheXNGb3JtYXRdLCBkYXRhW0xvY2FsZURhdGFJbmRleC5EYXlzU3RhbmRhbG9uZV1dO1xuICBjb25zdCBkYXlzID0gZ2V0TGFzdERlZmluZWRWYWx1ZShkYXlzRGF0YSwgZm9ybVN0eWxlKTtcbiAgcmV0dXJuIGdldExhc3REZWZpbmVkVmFsdWUoZGF5cywgd2lkdGgpO1xufVxuXG4vKipcbiAqIE1vbnRocyBvZiB0aGUgeWVhciBmb3IgdGhlIEdyZWdvcmlhbiBjYWxlbmRhciAoZS5nLiBgW0phbnVhcnksIEZlYnJ1YXJ5LCAuLi5dYCBmb3IgZW4tVVMpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZU1vbnRoTmFtZXMoXG4gICAgbG9jYWxlOiBzdHJpbmcsIGZvcm1TdHlsZTogRm9ybVN0eWxlLCB3aWR0aDogVHJhbnNsYXRpb25XaWR0aCk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIGNvbnN0IG1vbnRoc0RhdGEgPVxuICAgICAgPHN0cmluZ1tdW11bXT5bZGF0YVtMb2NhbGVEYXRhSW5kZXguTW9udGhzRm9ybWF0XSwgZGF0YVtMb2NhbGVEYXRhSW5kZXguTW9udGhzU3RhbmRhbG9uZV1dO1xuICBjb25zdCBtb250aHMgPSBnZXRMYXN0RGVmaW5lZFZhbHVlKG1vbnRoc0RhdGEsIGZvcm1TdHlsZSk7XG4gIHJldHVybiBnZXRMYXN0RGVmaW5lZFZhbHVlKG1vbnRocywgd2lkdGgpO1xufVxuXG4vKipcbiAqIEVyYXMgZm9yIHRoZSBHcmVnb3JpYW4gY2FsZW5kYXIgKGUuZy4gQUQvQkMpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUVyYU5hbWVzKGxvY2FsZTogc3RyaW5nLCB3aWR0aDogVHJhbnNsYXRpb25XaWR0aCk6IFtzdHJpbmcsIHN0cmluZ10ge1xuICBjb25zdCBkYXRhID0gZmluZExvY2FsZURhdGEobG9jYWxlKTtcbiAgY29uc3QgZXJhc0RhdGEgPSA8W3N0cmluZywgc3RyaW5nXVtdPmRhdGFbTG9jYWxlRGF0YUluZGV4LkVyYXNdO1xuICByZXR1cm4gZ2V0TGFzdERlZmluZWRWYWx1ZShlcmFzRGF0YSwgd2lkdGgpO1xufVxuXG4vKipcbiAqIEZpcnN0IGRheSBvZiB0aGUgd2VlayBmb3IgdGhpcyBsb2NhbGUsIGJhc2VkIG9uIGVuZ2xpc2ggZGF5cyAoU3VuZGF5ID0gMCwgTW9uZGF5ID0gMSwgLi4uKS5cbiAqIEZvciBleGFtcGxlIGluIGZyZW5jaCB0aGUgdmFsdWUgd291bGQgYmUgMSBiZWNhdXNlIHRoZSBmaXJzdCBkYXkgb2YgdGhlIHdlZWsgaXMgTW9uZGF5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUZpcnN0RGF5T2ZXZWVrKGxvY2FsZTogc3RyaW5nKTogV2Vla0RheSB7XG4gIGNvbnN0IGRhdGEgPSBmaW5kTG9jYWxlRGF0YShsb2NhbGUpO1xuICByZXR1cm4gZGF0YVtMb2NhbGVEYXRhSW5kZXguRmlyc3REYXlPZldlZWtdO1xufVxuXG4vKipcbiAqIFJhbmdlIG9mIGRheXMgaW4gdGhlIHdlZWsgdGhhdCByZXByZXNlbnQgdGhlIHdlZWstZW5kIGZvciB0aGlzIGxvY2FsZSwgYmFzZWQgb24gZW5nbGlzaCBkYXlzXG4gKiAoU3VuZGF5ID0gMCwgTW9uZGF5ID0gMSwgLi4uKS5cbiAqIEZvciBleGFtcGxlIGluIGVuZ2xpc2ggdGhlIHZhbHVlIHdvdWxkIGJlIFs2LDBdIGZvciBTYXR1cmRheSB0byBTdW5kYXkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlV2Vla0VuZFJhbmdlKGxvY2FsZTogc3RyaW5nKTogW1dlZWtEYXksIFdlZWtEYXldIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIHJldHVybiBkYXRhW0xvY2FsZURhdGFJbmRleC5XZWVrZW5kUmFuZ2VdO1xufVxuXG4vKipcbiAqIERhdGUgZm9ybWF0IHRoYXQgZGVwZW5kcyBvbiB0aGUgbG9jYWxlLlxuICpcbiAqIFRoZXJlIGFyZSBmb3VyIGJhc2ljIGRhdGUgZm9ybWF0czpcbiAqIC0gYGZ1bGxgIHNob3VsZCBjb250YWluIGxvbmctd2Vla2RheSAoRUVFRSksIHllYXIgKHkpLCBsb25nLW1vbnRoIChNTU1NKSwgZGF5IChkKS5cbiAqXG4gKiAgRm9yIGV4YW1wbGUsIEVuZ2xpc2ggdXNlcyBgRUVFRSwgTU1NTSBkLCB5YCwgY29ycmVzcG9uZGluZyB0byBhIGRhdGUgbGlrZVxuICogIFwiVHVlc2RheSwgU2VwdGVtYmVyIDE0LCAxOTk5XCIuXG4gKlxuICogLSBgbG9uZ2Agc2hvdWxkIGNvbnRhaW4geWVhciwgbG9uZy1tb250aCwgZGF5LlxuICpcbiAqICBGb3IgZXhhbXBsZSwgYE1NTU0gZCwgeWAsIGNvcnJlc3BvbmRpbmcgdG8gYSBkYXRlIGxpa2UgXCJTZXB0ZW1iZXIgMTQsIDE5OTlcIi5cbiAqXG4gKiAtIGBtZWRpdW1gIHNob3VsZCBjb250YWluIHllYXIsIGFiYnJldmlhdGVkLW1vbnRoIChNTU0pLCBkYXkuXG4gKlxuICogIEZvciBleGFtcGxlLCBgTU1NIGQsIHlgLCBjb3JyZXNwb25kaW5nIHRvIGEgZGF0ZSBsaWtlIFwiU2VwIDE0LCAxOTk5XCIuXG4gKiAgRm9yIGxhbmd1YWdlcyB0aGF0IGRvIG5vdCB1c2UgYWJicmV2aWF0ZWQgbW9udGhzLCB1c2UgdGhlIG51bWVyaWMgbW9udGggKE1NL00pLiBGb3IgZXhhbXBsZSxcbiAqICBgeS9NTS9kZGAsIGNvcnJlc3BvbmRpbmcgdG8gYSBkYXRlIGxpa2UgXCIxOTk5LzA5LzE0XCIuXG4gKlxuICogLSBgc2hvcnRgIHNob3VsZCBjb250YWluIHllYXIsIG51bWVyaWMtbW9udGggKE1NL00pLCBhbmQgZGF5LlxuICpcbiAqICBGb3IgZXhhbXBsZSwgYE0vZC95eWAsIGNvcnJlc3BvbmRpbmcgdG8gYSBkYXRlIGxpa2UgXCI5LzE0Lzk5XCIuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlRGF0ZUZvcm1hdChsb2NhbGU6IHN0cmluZywgd2lkdGg6IEZvcm1hdFdpZHRoKTogc3RyaW5nIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIHJldHVybiBnZXRMYXN0RGVmaW5lZFZhbHVlKGRhdGFbTG9jYWxlRGF0YUluZGV4LkRhdGVGb3JtYXRdLCB3aWR0aCk7XG59XG5cbi8qKlxuICogVGltZSBmb3JtYXQgdGhhdCBkZXBlbmRzIG9uIHRoZSBsb2NhbGUuXG4gKlxuICogVGhlIHN0YW5kYXJkIGZvcm1hdHMgaW5jbHVkZSBmb3VyIGJhc2ljIHRpbWUgZm9ybWF0czpcbiAqIC0gYGZ1bGxgIHNob3VsZCBjb250YWluIGhvdXIgKGgvSCksIG1pbnV0ZSAobW0pLCBzZWNvbmQgKHNzKSwgYW5kIHpvbmUgKHp6enopLlxuICogLSBgbG9uZ2Agc2hvdWxkIGNvbnRhaW4gaG91ciwgbWludXRlLCBzZWNvbmQsIGFuZCB6b25lICh6KVxuICogLSBgbWVkaXVtYCBzaG91bGQgY29udGFpbiBob3VyLCBtaW51dGUsIHNlY29uZC5cbiAqIC0gYHNob3J0YCBzaG91bGQgY29udGFpbiBob3VyLCBtaW51dGUuXG4gKlxuICogTm90ZTogVGhlIHBhdHRlcm5zIGRlcGVuZCBvbiB3aGV0aGVyIHRoZSBtYWluIGNvdW50cnkgdXNpbmcgeW91ciBsYW5ndWFnZSB1c2VzIDEyLWhvdXIgdGltZSBvclxuICogbm90OlxuICogLSBGb3IgMTItaG91ciB0aW1lLCB1c2UgYSBwYXR0ZXJuIGxpa2UgYGhoOm1tIGFgIHVzaW5nIGggdG8gbWVhbiBhIDEyLWhvdXIgY2xvY2sgY3ljbGUgcnVubmluZ1xuICogMSB0aHJvdWdoIDEyIChtaWRuaWdodCBwbHVzIDEgbWludXRlIGlzIDEyOjAxKSwgb3IgdXNpbmcgSyB0byBtZWFuIGEgMTItaG91ciBjbG9jayBjeWNsZVxuICogcnVubmluZyAwIHRocm91Z2ggMTEgKG1pZG5pZ2h0IHBsdXMgMSBtaW51dGUgaXMgMDowMSkuXG4gKiAtIEZvciAyNC1ob3VyIHRpbWUsIHVzZSBhIHBhdHRlcm4gbGlrZSBgSEg6bW1gIHVzaW5nIEggdG8gbWVhbiBhIDI0LWhvdXIgY2xvY2sgY3ljbGUgcnVubmluZyAwXG4gKiB0aHJvdWdoIDIzIChtaWRuaWdodCBwbHVzIDEgbWludXRlIGlzIDA6MDEpLCBvciB1c2luZyBrIHRvIG1lYW4gYSAyNC1ob3VyIGNsb2NrIGN5Y2xlIHJ1bm5pbmdcbiAqIDEgdGhyb3VnaCAyNCAobWlkbmlnaHQgcGx1cyAxIG1pbnV0ZSBpcyAyNDowMSkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlVGltZUZvcm1hdChsb2NhbGU6IHN0cmluZywgd2lkdGg6IEZvcm1hdFdpZHRoKTogc3RyaW5nIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIHJldHVybiBnZXRMYXN0RGVmaW5lZFZhbHVlKGRhdGFbTG9jYWxlRGF0YUluZGV4LlRpbWVGb3JtYXRdLCB3aWR0aCk7XG59XG5cbi8qKlxuICogRGF0ZS10aW1lIGZvcm1hdCB0aGF0IGRlcGVuZHMgb24gdGhlIGxvY2FsZS5cbiAqXG4gKiBUaGUgZGF0ZS10aW1lIHBhdHRlcm4gc2hvd3MgaG93IHRvIGNvbWJpbmUgc2VwYXJhdGUgcGF0dGVybnMgZm9yIGRhdGUgKHJlcHJlc2VudGVkIGJ5IHsxfSlcbiAqIGFuZCB0aW1lIChyZXByZXNlbnRlZCBieSB7MH0pIGludG8gYSBzaW5nbGUgcGF0dGVybi4gSXQgdXN1YWxseSBkb2Vzbid0IG5lZWQgdG8gYmUgY2hhbmdlZC5cbiAqIFdoYXQgeW91IHdhbnQgdG8gcGF5IGF0dGVudGlvbiB0byBhcmU6XG4gKiAtIHBvc3NpYmx5IHJlbW92aW5nIGEgc3BhY2UgZm9yIGxhbmd1YWdlcyB0aGF0IGRvbid0IHVzZSBpdCwgc3VjaCBhcyBtYW55IEVhc3QgQXNpYW4gbGFuZ3VhZ2VzXG4gKiAtIHBvc3NpYmx5IGFkZGluZyBhIGNvbW1hLCBvdGhlciBwdW5jdHVhdGlvbiwgb3IgYSBjb21iaW5pbmcgd29yZFxuICpcbiAqIEZvciBleGFtcGxlOlxuICogLSBFbmdsaXNoIHVzZXMgYHsxfSAnYXQnIHswfWAgb3IgYHsxfSwgezB9YCAoZGVwZW5kaW5nIG9uIGRhdGUgc3R5bGUpLCB3aGlsZSBKYXBhbmVzZSB1c2VzXG4gKiAgYHsxfXswfWAuXG4gKiAtIEFuIEVuZ2xpc2ggZm9ybWF0dGVkIGRhdGUtdGltZSB1c2luZyB0aGUgY29tYmluaW5nIHBhdHRlcm4gYHsxfSwgezB9YCBjb3VsZCBiZVxuICogIGBEZWMgMTAsIDIwMTAsIDM6NTk6NDkgUE1gLiBOb3RpY2UgdGhlIGNvbW1hIGFuZCBzcGFjZSBiZXR3ZWVuIHRoZSBkYXRlIHBvcnRpb24gYW5kIHRoZSB0aW1lXG4gKiAgcG9ydGlvbi5cbiAqXG4gKiBUaGVyZSBhcmUgZm91ciBmb3JtYXRzIChgZnVsbGAsIGBsb25nYCwgYG1lZGl1bWAsIGBzaG9ydGApOyB0aGUgZGV0ZXJtaW5hdGlvbiBvZiB3aGljaCB0byB1c2VcbiAqIGlzIG5vcm1hbGx5IGJhc2VkIG9uIHRoZSBkYXRlIHN0eWxlLiBGb3IgZXhhbXBsZSwgaWYgdGhlIGRhdGUgaGFzIGEgZnVsbCBtb250aCBhbmQgd2Vla2RheVxuICogbmFtZSwgdGhlIGZ1bGwgY29tYmluaW5nIHBhdHRlcm4gd2lsbCBiZSB1c2VkIHRvIGNvbWJpbmUgdGhhdCB3aXRoIGEgdGltZS4gSWYgdGhlIGRhdGUgaGFzXG4gKiBudW1lcmljIG1vbnRoLCB0aGUgc2hvcnQgdmVyc2lvbiBvZiB0aGUgY29tYmluaW5nIHBhdHRlcm4gd2lsbCBiZSB1c2VkIHRvIGNvbWJpbmUgdGhhdCB3aXRoIGFcbiAqIHRpbWUuIEVuZ2xpc2ggdXNlcyBgezF9ICdhdCcgezB9YCBmb3IgZnVsbCBhbmQgbG9uZyBzdHlsZXMsIGFuZCBgezF9LCB7MH1gIGZvciBtZWRpdW0gYW5kIHNob3J0XG4gKiBzdHlsZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlRGF0ZVRpbWVGb3JtYXQobG9jYWxlOiBzdHJpbmcsIHdpZHRoOiBGb3JtYXRXaWR0aCk6IHN0cmluZyB7XG4gIGNvbnN0IGRhdGEgPSBmaW5kTG9jYWxlRGF0YShsb2NhbGUpO1xuICBjb25zdCBkYXRlVGltZUZvcm1hdERhdGEgPSA8c3RyaW5nW10+ZGF0YVtMb2NhbGVEYXRhSW5kZXguRGF0ZVRpbWVGb3JtYXRdO1xuICByZXR1cm4gZ2V0TGFzdERlZmluZWRWYWx1ZShkYXRlVGltZUZvcm1hdERhdGEsIHdpZHRoKTtcbn1cblxuLyoqXG4gKiBOdW1iZXIgc3ltYm9sIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVwbGFjZSBwbGFjZWhvbGRlcnMgaW4gbnVtYmVyIGZvcm1hdHMuXG4gKiBTZWUge0BsaW5rIE51bWJlclN5bWJvbH0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlTnVtYmVyU3ltYm9sKGxvY2FsZTogc3RyaW5nLCBzeW1ib2w6IE51bWJlclN5bWJvbCk6IHN0cmluZyB7XG4gIGNvbnN0IGRhdGEgPSBmaW5kTG9jYWxlRGF0YShsb2NhbGUpO1xuICBjb25zdCByZXMgPSBkYXRhW0xvY2FsZURhdGFJbmRleC5OdW1iZXJTeW1ib2xzXVtzeW1ib2xdO1xuICBpZiAodHlwZW9mIHJlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoc3ltYm9sID09PSBOdW1iZXJTeW1ib2wuQ3VycmVuY3lEZWNpbWFsKSB7XG4gICAgICByZXR1cm4gZGF0YVtMb2NhbGVEYXRhSW5kZXguTnVtYmVyU3ltYm9sc11bTnVtYmVyU3ltYm9sLkRlY2ltYWxdO1xuICAgIH0gZWxzZSBpZiAoc3ltYm9sID09PSBOdW1iZXJTeW1ib2wuQ3VycmVuY3lHcm91cCkge1xuICAgICAgcmV0dXJuIGRhdGFbTG9jYWxlRGF0YUluZGV4Lk51bWJlclN5bWJvbHNdW051bWJlclN5bWJvbC5Hcm91cF07XG4gICAgfVxuICB9XG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogTnVtYmVyIGZvcm1hdCB0aGF0IGRlcGVuZHMgb24gdGhlIGxvY2FsZS5cbiAqXG4gKiBOdW1iZXJzIGFyZSBmb3JtYXR0ZWQgdXNpbmcgcGF0dGVybnMsIGxpa2UgYCMsIyMjLjAwYC4gRm9yIGV4YW1wbGUsIHRoZSBwYXR0ZXJuIGAjLCMjIy4wMGBcbiAqIHdoZW4gdXNlZCB0byBmb3JtYXQgdGhlIG51bWJlciAxMjM0NS42NzggY291bGQgcmVzdWx0IGluIFwiMTInMzQ1LDY3XCIuIFRoYXQgd291bGQgaGFwcGVuIGlmIHRoZVxuICogZ3JvdXBpbmcgc2VwYXJhdG9yIGZvciB5b3VyIGxhbmd1YWdlIGlzIGFuIGFwb3N0cm9waGUsIGFuZCB0aGUgZGVjaW1hbCBzZXBhcmF0b3IgaXMgYSBjb21tYS5cbiAqXG4gKiA8Yj5JbXBvcnRhbnQ6PC9iPiBUaGUgY2hhcmFjdGVycyBgLmAgYCxgIGAwYCBgI2AgKGFuZCBvdGhlcnMgYmVsb3cpIGFyZSBzcGVjaWFsIHBsYWNlaG9sZGVycztcbiAqIHRoZXkgc3RhbmQgZm9yIHRoZSBkZWNpbWFsIHNlcGFyYXRvciwgYW5kIHNvIG9uLCBhbmQgYXJlIE5PVCByZWFsIGNoYXJhY3RlcnMuXG4gKiBZb3UgbXVzdCBOT1QgXCJ0cmFuc2xhdGVcIiB0aGUgcGxhY2Vob2xkZXJzOyBmb3IgZXhhbXBsZSwgZG9uJ3QgY2hhbmdlIGAuYCB0byBgLGAgZXZlbiB0aG91Z2ggaW5cbiAqIHlvdXIgbGFuZ3VhZ2UgdGhlIGRlY2ltYWwgcG9pbnQgaXMgd3JpdHRlbiB3aXRoIGEgY29tbWEuIFRoZSBzeW1ib2xzIHNob3VsZCBiZSByZXBsYWNlZCBieSB0aGVcbiAqIGxvY2FsIGVxdWl2YWxlbnRzLCB1c2luZyB0aGUgTnVtYmVyIFN5bWJvbHMgZm9yIHlvdXIgbGFuZ3VhZ2UuXG4gKlxuICogSGVyZSBhcmUgdGhlIHNwZWNpYWwgY2hhcmFjdGVycyB1c2VkIGluIG51bWJlciBwYXR0ZXJuczpcbiAqXG4gKiB8IFN5bWJvbCB8IE1lYW5pbmcgfFxuICogfC0tLS0tLS0tfC0tLS0tLS0tLXxcbiAqIHwgLiB8IFJlcGxhY2VkIGF1dG9tYXRpY2FsbHkgYnkgdGhlIGNoYXJhY3RlciB1c2VkIGZvciB0aGUgZGVjaW1hbCBwb2ludC4gfFxuICogfCAsIHwgUmVwbGFjZWQgYnkgdGhlIFwiZ3JvdXBpbmdcIiAodGhvdXNhbmRzKSBzZXBhcmF0b3IuIHxcbiAqIHwgMCB8IFJlcGxhY2VkIGJ5IGEgZGlnaXQgKG9yIHplcm8gaWYgdGhlcmUgYXJlbid0IGVub3VnaCBkaWdpdHMpLiB8XG4gKiB8ICMgfCBSZXBsYWNlZCBieSBhIGRpZ2l0IChvciBub3RoaW5nIGlmIHRoZXJlIGFyZW4ndCBlbm91Z2gpLiB8XG4gKiB8IMKkIHwgVGhpcyB3aWxsIGJlIHJlcGxhY2VkIGJ5IGEgY3VycmVuY3kgc3ltYm9sLCBzdWNoIGFzICQgb3IgVVNELiB8XG4gKiB8ICUgfCBUaGlzIG1hcmtzIGEgcGVyY2VudCBmb3JtYXQuIFRoZSAlIHN5bWJvbCBtYXkgY2hhbmdlIHBvc2l0aW9uLCBidXQgbXVzdCBiZSByZXRhaW5lZC4gfFxuICogfCBFIHwgVGhpcyBtYXJrcyBhIHNjaWVudGlmaWMgZm9ybWF0LiBUaGUgRSBzeW1ib2wgbWF5IGNoYW5nZSBwb3NpdGlvbiwgYnV0IG11c3QgYmUgcmV0YWluZWQuIHxcbiAqIHwgJyB8IFNwZWNpYWwgY2hhcmFjdGVycyB1c2VkIGFzIGxpdGVyYWwgY2hhcmFjdGVycyBhcmUgcXVvdGVkIHdpdGggQVNDSUkgc2luZ2xlIHF1b3Rlcy4gfFxuICpcbiAqIFlvdSBjYW4gZmluZCBtb3JlIGluZm9ybWF0aW9uXG4gKiBbb24gdGhlIENMRFIgd2Vic2l0ZV0oaHR0cDovL2NsZHIudW5pY29kZS5vcmcvdHJhbnNsYXRpb24vbnVtYmVyLXBhdHRlcm5zKVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZU51bWJlckZvcm1hdChsb2NhbGU6IHN0cmluZywgdHlwZTogTnVtYmVyRm9ybWF0U3R5bGUpOiBzdHJpbmcge1xuICBjb25zdCBkYXRhID0gZmluZExvY2FsZURhdGEobG9jYWxlKTtcbiAgcmV0dXJuIGRhdGFbTG9jYWxlRGF0YUluZGV4Lk51bWJlckZvcm1hdHNdW3R5cGVdO1xufVxuXG4vKipcbiAqIFRoZSBzeW1ib2wgdXNlZCB0byByZXByZXNlbnQgdGhlIGN1cnJlbmN5IGZvciB0aGUgbWFpbiBjb3VudHJ5IHVzaW5nIHRoaXMgbG9jYWxlIChlLmcuICQgZm9yXG4gKiB0aGUgbG9jYWxlIGVuLVVTKS5cbiAqIFRoZSBzeW1ib2wgd2lsbCBiZSBgbnVsbGAgaWYgdGhlIG1haW4gY291bnRyeSBjYW5ub3QgYmUgZGV0ZXJtaW5lZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVDdXJyZW5jeVN5bWJvbChsb2NhbGU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIHJldHVybiBkYXRhW0xvY2FsZURhdGFJbmRleC5DdXJyZW5jeVN5bWJvbF0gfHwgbnVsbDtcbn1cblxuLyoqXG4gKiBUaGUgbmFtZSBvZiB0aGUgY3VycmVuY3kgZm9yIHRoZSBtYWluIGNvdW50cnkgdXNpbmcgdGhpcyBsb2NhbGUgKGUuZy4gVVNEIGZvciB0aGUgbG9jYWxlXG4gKiBlbi1VUykuXG4gKiBUaGUgbmFtZSB3aWxsIGJlIGBudWxsYCBpZiB0aGUgbWFpbiBjb3VudHJ5IGNhbm5vdCBiZSBkZXRlcm1pbmVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUN1cnJlbmN5TmFtZShsb2NhbGU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIHJldHVybiBkYXRhW0xvY2FsZURhdGFJbmRleC5DdXJyZW5jeU5hbWVdIHx8IG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVuY3kgdmFsdWVzIGZvciB0aGUgbG9jYWxlXG4gKi9cbmZ1bmN0aW9uIGdldExvY2FsZUN1cnJlbmNpZXMobG9jYWxlOiBzdHJpbmcpOiB7W2NvZGU6IHN0cmluZ106IEN1cnJlbmNpZXNTeW1ib2xzfSB7XG4gIGNvbnN0IGRhdGEgPSBmaW5kTG9jYWxlRGF0YShsb2NhbGUpO1xuICByZXR1cm4gZGF0YVtMb2NhbGVEYXRhSW5kZXguQ3VycmVuY2llc107XG59XG5cbi8qKlxuICogVGhlIGxvY2FsZSBwbHVyYWwgZnVuY3Rpb24gdXNlZCBieSBJQ1UgZXhwcmVzc2lvbnMgdG8gZGV0ZXJtaW5lIHRoZSBwbHVyYWwgY2FzZSB0byB1c2UuXG4gKiBTZWUge0BsaW5rIE5nUGx1cmFsfSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVQbHVyYWxDYXNlKGxvY2FsZTogc3RyaW5nKTogKHZhbHVlOiBudW1iZXIpID0+IFBsdXJhbCB7XG4gIGNvbnN0IGRhdGEgPSBmaW5kTG9jYWxlRGF0YShsb2NhbGUpO1xuICByZXR1cm4gZGF0YVtMb2NhbGVEYXRhSW5kZXguUGx1cmFsQ2FzZV07XG59XG5cbmZ1bmN0aW9uIGNoZWNrRnVsbERhdGEoZGF0YTogYW55KSB7XG4gIGlmICghZGF0YVtMb2NhbGVEYXRhSW5kZXguRXh0cmFEYXRhXSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYE1pc3NpbmcgZXh0cmEgbG9jYWxlIGRhdGEgZm9yIHRoZSBsb2NhbGUgXCIke2RhdGFbTG9jYWxlRGF0YUluZGV4LkxvY2FsZUlkXX1cIi4gVXNlIFwicmVnaXN0ZXJMb2NhbGVEYXRhXCIgdG8gbG9hZCBuZXcgZGF0YS4gU2VlIHRoZSBcIkkxOG4gZ3VpZGVcIiBvbiBhbmd1bGFyLmlvIHRvIGtub3cgbW9yZS5gKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bGVzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoaWNoIGRheSBwZXJpb2QgdG8gdXNlIChTZWUgYGRheVBlcmlvZHNgIGJlbG93KS5cbiAqIFRoZSBydWxlcyBjYW4gZWl0aGVyIGJlIGFuIGFycmF5IG9yIGEgc2luZ2xlIHZhbHVlLiBJZiBpdCdzIGFuIGFycmF5LCBjb25zaWRlciBpdCBhcyBcImZyb21cIlxuICogYW5kIFwidG9cIi4gSWYgaXQncyBhIHNpbmdsZSB2YWx1ZSB0aGVuIGl0IG1lYW5zIHRoYXQgdGhlIHBlcmlvZCBpcyBvbmx5IHZhbGlkIGF0IHRoaXMgZXhhY3RcbiAqIHZhbHVlLlxuICogVGhlcmUgaXMgYWx3YXlzIHRoZSBzYW1lIG51bWJlciBvZiBydWxlcyBhcyB0aGUgbnVtYmVyIG9mIGRheSBwZXJpb2RzLCB3aGljaCBtZWFucyB0aGF0IHRoZVxuICogZmlyc3QgcnVsZSBpcyBhcHBsaWVkIHRvIHRoZSBmaXJzdCBkYXkgcGVyaW9kIGFuZCBzbyBvbi5cbiAqIFlvdSBzaG91bGQgZmFsbGJhY2sgdG8gQU0vUE0gd2hlbiB0aGVyZSBhcmUgbm8gcnVsZXMgYXZhaWxhYmxlLlxuICpcbiAqIE5vdGU6IHRoaXMgaXMgb25seSBhdmFpbGFibGUgaWYgeW91IGxvYWQgdGhlIGZ1bGwgbG9jYWxlIGRhdGEuXG4gKiBTZWUgdGhlIFtcIkkxOG4gZ3VpZGVcIl0oZ3VpZGUvaTE4biNpMThuLXBpcGVzKSB0byBrbm93IGhvdyB0byBpbXBvcnQgYWRkaXRpb25hbCBsb2NhbGVcbiAqIGRhdGEuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlRXh0cmFEYXlQZXJpb2RSdWxlcyhsb2NhbGU6IHN0cmluZyk6IChUaW1lIHwgW1RpbWUsIFRpbWVdKVtdIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIGNoZWNrRnVsbERhdGEoZGF0YSk7XG4gIGNvbnN0IHJ1bGVzID0gZGF0YVtMb2NhbGVEYXRhSW5kZXguRXh0cmFEYXRhXVtFeHRyYUxvY2FsZURhdGFJbmRleC5FeHRyYURheVBlcmlvZHNSdWxlc10gfHwgW107XG4gIHJldHVybiBydWxlcy5tYXAoKHJ1bGU6IHN0cmluZyB8IFtzdHJpbmcsIHN0cmluZ10pID0+IHtcbiAgICBpZiAodHlwZW9mIHJ1bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZXh0cmFjdFRpbWUocnVsZSk7XG4gICAgfVxuICAgIHJldHVybiBbZXh0cmFjdFRpbWUocnVsZVswXSksIGV4dHJhY3RUaW1lKHJ1bGVbMV0pXTtcbiAgfSk7XG59XG5cbi8qKlxuICogRGF5IFBlcmlvZHMgaW5kaWNhdGUgcm91Z2hseSBob3cgdGhlIGRheSBpcyBicm9rZW4gdXAgaW4gZGlmZmVyZW50IGxhbmd1YWdlcyAoZS5nLiBtb3JuaW5nLFxuICogbm9vbiwgYWZ0ZXJub29uLCBtaWRuaWdodCwgLi4uKS5cbiAqIFlvdSBzaG91bGQgdXNlIHRoZSBmdW5jdGlvbiB7QGxpbmsgZ2V0TG9jYWxlRXh0cmFEYXlQZXJpb2RSdWxlc30gdG8gZGV0ZXJtaW5lIHdoaWNoIHBlcmlvZCB0b1xuICogdXNlLlxuICogWW91IHNob3VsZCBmYWxsYmFjayB0byBBTS9QTSB3aGVuIHRoZXJlIGFyZSBubyBkYXkgcGVyaW9kcyBhdmFpbGFibGUuXG4gKlxuICogTm90ZTogdGhpcyBpcyBvbmx5IGF2YWlsYWJsZSBpZiB5b3UgbG9hZCB0aGUgZnVsbCBsb2NhbGUgZGF0YS5cbiAqIFNlZSB0aGUgW1wiSTE4biBndWlkZVwiXShndWlkZS9pMThuI2kxOG4tcGlwZXMpIHRvIGtub3cgaG93IHRvIGltcG9ydCBhZGRpdGlvbmFsIGxvY2FsZVxuICogZGF0YS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVFeHRyYURheVBlcmlvZHMoXG4gICAgbG9jYWxlOiBzdHJpbmcsIGZvcm1TdHlsZTogRm9ybVN0eWxlLCB3aWR0aDogVHJhbnNsYXRpb25XaWR0aCk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIGNoZWNrRnVsbERhdGEoZGF0YSk7XG4gIGNvbnN0IGRheVBlcmlvZHNEYXRhID0gPHN0cmluZ1tdW11bXT5bXG4gICAgZGF0YVtMb2NhbGVEYXRhSW5kZXguRXh0cmFEYXRhXVtFeHRyYUxvY2FsZURhdGFJbmRleC5FeHRyYURheVBlcmlvZEZvcm1hdHNdLFxuICAgIGRhdGFbTG9jYWxlRGF0YUluZGV4LkV4dHJhRGF0YV1bRXh0cmFMb2NhbGVEYXRhSW5kZXguRXh0cmFEYXlQZXJpb2RTdGFuZGFsb25lXVxuICBdO1xuICBjb25zdCBkYXlQZXJpb2RzID0gZ2V0TGFzdERlZmluZWRWYWx1ZShkYXlQZXJpb2RzRGF0YSwgZm9ybVN0eWxlKSB8fCBbXTtcbiAgcmV0dXJuIGdldExhc3REZWZpbmVkVmFsdWUoZGF5UGVyaW9kcywgd2lkdGgpIHx8IFtdO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IHZhbHVlIHRoYXQgaXMgZGVmaW5lZCBpbiBhbiBhcnJheSwgZ29pbmcgYmFja3dhcmRzLlxuICpcbiAqIFRvIGF2b2lkIHJlcGVhdGluZyB0aGUgc2FtZSBkYXRhIChlLmcuIHdoZW4gXCJmb3JtYXRcIiBhbmQgXCJzdGFuZGFsb25lXCIgYXJlIHRoZSBzYW1lKSB3ZSBvbmx5XG4gKiBhZGQgdGhlIGZpcnN0IG9uZSB0byB0aGUgbG9jYWxlIGRhdGEgYXJyYXlzLCB0aGUgb3RoZXIgb25lcyBhcmUgb25seSBkZWZpbmVkIHdoZW4gZGlmZmVyZW50LlxuICogV2UgdXNlIHRoaXMgZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIGZpcnN0IGRlZmluZWQgdmFsdWUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5mdW5jdGlvbiBnZXRMYXN0RGVmaW5lZFZhbHVlPFQ+KGRhdGE6IFRbXSwgaW5kZXg6IG51bWJlcik6IFQge1xuICBmb3IgKGxldCBpID0gaW5kZXg7IGkgPiAtMTsgaS0tKSB7XG4gICAgaWYgKHR5cGVvZiBkYXRhW2ldICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIGRhdGFbaV07XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcignTG9jYWxlIGRhdGEgQVBJOiBsb2NhbGUgZGF0YSB1bmRlZmluZWQnKTtcbn1cblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0aW1lIHdpdGggaG91cnMgYW5kIG1pbnV0ZXNcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIFRpbWUgPSB7XG4gIGhvdXJzOiBudW1iZXIsXG4gIG1pbnV0ZXM6IG51bWJlclxufTtcblxuLyoqXG4gKiBFeHRyYWN0IHRoZSBob3VycyBhbmQgbWludXRlcyBmcm9tIGEgc3RyaW5nIGxpa2UgXCIxNTo0NVwiXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RUaW1lKHRpbWU6IHN0cmluZyk6IFRpbWUge1xuICBjb25zdCBbaCwgbV0gPSB0aW1lLnNwbGl0KCc6Jyk7XG4gIHJldHVybiB7aG91cnM6ICtoLCBtaW51dGVzOiArbX07XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGxvY2FsZSBkYXRhIGZvciBhIGxvY2FsZSBpZFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRMb2NhbGVEYXRhKGxvY2FsZTogc3RyaW5nKTogYW55IHtcbiAgY29uc3Qgbm9ybWFsaXplZExvY2FsZSA9IGxvY2FsZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL18vZywgJy0nKTtcblxuICBsZXQgbWF0Y2ggPSBMT0NBTEVfREFUQVtub3JtYWxpemVkTG9jYWxlXTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIG1hdGNoO1xuICB9XG5cbiAgLy8gbGV0J3MgdHJ5IHRvIGZpbmQgYSBwYXJlbnQgbG9jYWxlXG4gIGNvbnN0IHBhcmVudExvY2FsZSA9IG5vcm1hbGl6ZWRMb2NhbGUuc3BsaXQoJy0nKVswXTtcbiAgbWF0Y2ggPSBMT0NBTEVfREFUQVtwYXJlbnRMb2NhbGVdO1xuXG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiBtYXRjaDtcbiAgfVxuXG4gIGlmIChwYXJlbnRMb2NhbGUgPT09ICdlbicpIHtcbiAgICByZXR1cm4gbG9jYWxlRW47XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgbG9jYWxlIGRhdGEgZm9yIHRoZSBsb2NhbGUgXCIke2xvY2FsZX1cIi5gKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW5jeSBzeW1ib2wgZm9yIGEgZ2l2ZW4gY3VycmVuY3kgY29kZSwgb3IgdGhlIGNvZGUgaWYgbm8gc3ltYm9sIGF2YWlsYWJsZVxuICogKGUuZy46IGZvcm1hdCBuYXJyb3cgPSAkLCBmb3JtYXQgd2lkZSA9IFVTJCwgY29kZSA9IFVTRClcbiAqIElmIG5vIGxvY2FsZSBpcyBwcm92aWRlZCwgaXQgdXNlcyB0aGUgbG9jYWxlIFwiZW5cIiBieSBkZWZhdWx0XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVuY3lTeW1ib2woY29kZTogc3RyaW5nLCBmb3JtYXQ6ICd3aWRlJyB8ICduYXJyb3cnLCBsb2NhbGUgPSAnZW4nKTogc3RyaW5nIHtcbiAgY29uc3QgY3VycmVuY3kgPSBnZXRMb2NhbGVDdXJyZW5jaWVzKGxvY2FsZSlbY29kZV0gfHwgQ1VSUkVOQ0lFU19FTltjb2RlXSB8fCBbXTtcbiAgY29uc3Qgc3ltYm9sTmFycm93ID0gY3VycmVuY3lbQ3VycmVuY3lJbmRleC5TeW1ib2xOYXJyb3ddO1xuXG4gIGlmIChmb3JtYXQgPT09ICduYXJyb3cnICYmIHR5cGVvZiBzeW1ib2xOYXJyb3cgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHN5bWJvbE5hcnJvdztcbiAgfVxuXG4gIHJldHVybiBjdXJyZW5jeVtDdXJyZW5jeUluZGV4LlN5bWJvbF0gfHwgY29kZTtcbn1cblxuLy8gTW9zdCBjdXJyZW5jaWVzIGhhdmUgY2VudHMsIHRoYXQncyB3aHkgdGhlIGRlZmF1bHQgaXMgMlxuY29uc3QgREVGQVVMVF9OQl9PRl9DVVJSRU5DWV9ESUdJVFMgPSAyO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG51bWJlciBvZiBkZWNpbWFsIGRpZ2l0cyBmb3IgdGhlIGdpdmVuIGN1cnJlbmN5LlxuICogSXRzIHZhbHVlIGRlcGVuZHMgdXBvbiB0aGUgcHJlc2VuY2Ugb2YgY2VudHMgaW4gdGhhdCBwYXJ0aWN1bGFyIGN1cnJlbmN5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE51bWJlck9mQ3VycmVuY3lEaWdpdHMoY29kZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgbGV0IGRpZ2l0cztcbiAgY29uc3QgY3VycmVuY3kgPSBDVVJSRU5DSUVTX0VOW2NvZGVdO1xuICBpZiAoY3VycmVuY3kpIHtcbiAgICBkaWdpdHMgPSBjdXJyZW5jeVtDdXJyZW5jeUluZGV4Lk5iT2ZEaWdpdHNdO1xuICB9XG4gIHJldHVybiB0eXBlb2YgZGlnaXRzID09PSAnbnVtYmVyJyA/IGRpZ2l0cyA6IERFRkFVTFRfTkJfT0ZfQ1VSUkVOQ1lfRElHSVRTO1xufVxuIl19