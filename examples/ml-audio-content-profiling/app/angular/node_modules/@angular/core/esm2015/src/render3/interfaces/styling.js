/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * The styling context acts as a styling manifest (shaped as an array) for determining which
 * styling properties have been assigned via the provided `updateStylingMap`, `updateStyleProp`
 * and `updateClassProp` functions. There are also two initialization functions
 * `allocStylingContext` and `createStylingContextTemplate` which are used to initialize
 * and/or clone the context.
 *
 * The context is an array where the first two cells are used for static data (initial styling)
 * and dirty flags / index offsets). The remaining set of cells is used for multi (map) and single
 * (prop) style values.
 *
 * each value from here onwards is mapped as so:
 * [i] = mutation/type flag for the style/class value
 * [i + 1] = prop string (or null incase it has been removed)
 * [i + 2] = value string (or null incase it has been removed)
 *
 * There are three types of styling types stored in this context:
 *   initial: any styles that are passed in once the context is created
 *            (these are stored in the first cell of the array and the first
 *             value of this array is always `null` even if no initial styling exists.
 *             the `null` value is there so that any new styles have a parent to point
 *             to. This way we can always assume that there is a parent.)
 *
 *   single: any styles that are updated using `updateStyleProp` or `updateClassProp` (fixed set)
 *
 *   multi: any styles that are updated using `updateStylingMap` (dynamic set)
 *
 * Note that context is only used to collect style information. Only when `renderStyling`
 * is called is when the styling payload will be rendered (or built as a key/value map).
 *
 * When the context is created, depending on what initial styling values are passed in, the
 * context itself will be pre-filled with slots based on the initial style properties. Say
 * for example we have a series of initial styles that look like so:
 *
 *   style="width:100px; height:200px;"
 *   class="foo"
 *
 * Then the initial state of the context (once initialized) will look like so:
 *
 * ```
 * context = [
 *   element,
 *   playerContext | null,
 *   styleSanitizer | null,
 *   [null, '100px', '200px', true],  // property names are not needed since they have already been
 * written to DOM.
 *
 *   configMasterVal,
 *   1, // this instructs how many `style` values there are so that class index values can be
 * offsetted
 *   { classOne: true, classTwo: false } | 'classOne classTwo' | null // last class value provided
 * into updateStylingMap
 *   { styleOne: '100px', styleTwo: 0 } | null // last style value provided into updateStylingMap
 *
 *   // 8
 *   'width',
 *   pointers(1, 15);  // Point to static `width`: `100px` and multi `width`.
 *   null,
 *
 *   // 11
 *   'height',
 *   pointers(2, 18); // Point to static `height`: `200px` and multi `height`.
 *   null,
 *
 *   // 14
 *   'foo',
 *   pointers(1, 21);  // Point to static `foo`: `true` and multi `foo`.
 *   null,
 *
 *   // 17
 *   'width',
 *   pointers(1, 6);  // Point to static `width`: `100px` and single `width`.
 *   null,
 *
 *   // 21
 *   'height',
 *   pointers(2, 9);  // Point to static `height`: `200px` and single `height`.
 *   null,
 *
 *   // 24
 *   'foo',
 *   pointers(3, 12);  // Point to static `foo`: `true` and single `foo`.
 *   null,
 * ]
 *
 * function pointers(staticIndex: number, dynamicIndex: number) {
 *   // combine the two indices into a single word.
 *   return (staticIndex << StylingFlags.BitCountSize) |
 *     (dynamicIndex << (StylingIndex.BitCountSize + StylingFlags.BitCountSize));
 * }
 * ```
 *
 * The values are duplicated so that space is set aside for both multi ([style] and [class])
 * and single ([style.prop] or [class.named]) values. The respective config values
 * (configValA, configValB, etc...) are a combination of the StylingFlags with two index
 * values: the `initialIndex` (which points to the index location of the style value in
 * the initial styles array in slot 0) and the `dynamicIndex` (which points to the
 * matching single/multi index position in the context array for the same prop).
 *
 * This means that every time `updateStyleProp` or `updateClassProp` are called then they
 * must be called using an index value (not a property string) which references the index
 * value of the initial style prop/class when the context was created. This also means that
 * `updateStyleProp` or `updateClassProp` cannot be called with a new property (only
 * `updateStylingMap` can include new CSS properties that will be added to the context).
 * @record
 */
export function StylingContext() { }
/**
 * The initial styles is populated whether or not there are any initial styles passed into
 * the context during allocation. The 0th value must be null so that index values of `0` within
 * the context flags can always point to a null value safely when nothing is set.
 *
 * All other entries in this array are of `string` value and correspond to the values that
 * were extracted from the `style=""` attribute in the HTML code for the provided template.
 * @record
 */
export function InitialStyles() { }
/** @enum {number} */
var StylingFlags = {
    // Implies no configurations
    None: 0,
    // Whether or not the entry or context itself is dirty
    Dirty: 1,
    // Whether or not this is a class-based assignment
    Class: 2,
    // Whether or not a sanitizer was applied to this property
    Sanitize: 4,
    // Whether or not any player builders within need to produce new players
    PlayerBuildersDirty: 8,
    // The max amount of bits used to represent these configuration values
    BitCountSize: 4,
    // There are only three bits here
    BitMask: 15,
};
export { StylingFlags };
/** @enum {number} */
var StylingIndex = {
    // Position of where the initial styles are stored in the styling context
    PlayerContext: 0,
    // Position of where the style sanitizer is stored within the styling context
    StyleSanitizerPosition: 1,
    // Position of where the initial styles are stored in the styling context
    InitialStylesPosition: 2,
    // Index of location where the start of single properties are stored. (`updateStyleProp`)
    MasterFlagPosition: 3,
    // Index of location where the class index offset value is located
    ClassOffsetPosition: 4,
    // Position of where the initial styles are stored in the styling context
    // This index must align with HOST, see interfaces/view.ts
    ElementPosition: 5,
    // Position of where the last string-based CSS class value was stored
    PreviousMultiClassValue: 6,
    // Position of where the last string-based CSS class value was stored
    PreviousMultiStyleValue: 7,
    // Location of single (prop) value entries are stored within the context
    SingleStylesStartPosition: 8,
    // Multi and single entries are stored in `StylingContext` as: Flag; PropertyName;  PropertyValue
    FlagsOffset: 0,
    PropertyOffset: 1,
    ValueOffset: 2,
    PlayerBuilderIndexOffset: 3,
    // Size of each multi or single entry (flag + prop + value + playerBuilderIndex)
    Size: 4,
    // Each flag has a binary digit length of this value
    BitCountSize: 14,
    // (32 - 4) / 2 = ~14
    // The binary digit value as a mask
    BitMask: 16383,
};
export { StylingIndex };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF1TEUsT0FBYTs7SUFFYixRQUFjOztJQUVkLFFBQWM7O0lBRWQsV0FBaUI7O0lBRWpCLHNCQUE0Qjs7SUFFNUIsZUFBZ0I7O0lBRWhCLFdBQWdCOzs7Ozs7SUFNaEIsZ0JBQWlCOztJQUVqQix5QkFBMEI7O0lBRTFCLHdCQUF5Qjs7SUFFekIscUJBQXNCOztJQUV0QixzQkFBdUI7OztJQUd2QixrQkFBbUI7O0lBRW5CLDBCQUEyQjs7SUFFM0IsMEJBQTJCOztJQUUzQiw0QkFBNkI7O0lBRTdCLGNBQWU7SUFDZixpQkFBa0I7SUFDbEIsY0FBZTtJQUNmLDJCQUE0Qjs7SUFFNUIsT0FBUTs7SUFFUixnQkFBaUI7OztJQUVqQixjQUEwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtQbGF5ZXJDb250ZXh0fSBmcm9tICcuL3BsYXllcic7XG5cblxuLyoqXG4gKiBUaGUgc3R5bGluZyBjb250ZXh0IGFjdHMgYXMgYSBzdHlsaW5nIG1hbmlmZXN0IChzaGFwZWQgYXMgYW4gYXJyYXkpIGZvciBkZXRlcm1pbmluZyB3aGljaFxuICogc3R5bGluZyBwcm9wZXJ0aWVzIGhhdmUgYmVlbiBhc3NpZ25lZCB2aWEgdGhlIHByb3ZpZGVkIGB1cGRhdGVTdHlsaW5nTWFwYCwgYHVwZGF0ZVN0eWxlUHJvcGBcbiAqIGFuZCBgdXBkYXRlQ2xhc3NQcm9wYCBmdW5jdGlvbnMuIFRoZXJlIGFyZSBhbHNvIHR3byBpbml0aWFsaXphdGlvbiBmdW5jdGlvbnNcbiAqIGBhbGxvY1N0eWxpbmdDb250ZXh0YCBhbmQgYGNyZWF0ZVN0eWxpbmdDb250ZXh0VGVtcGxhdGVgIHdoaWNoIGFyZSB1c2VkIHRvIGluaXRpYWxpemVcbiAqIGFuZC9vciBjbG9uZSB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGUgY29udGV4dCBpcyBhbiBhcnJheSB3aGVyZSB0aGUgZmlyc3QgdHdvIGNlbGxzIGFyZSB1c2VkIGZvciBzdGF0aWMgZGF0YSAoaW5pdGlhbCBzdHlsaW5nKVxuICogYW5kIGRpcnR5IGZsYWdzIC8gaW5kZXggb2Zmc2V0cykuIFRoZSByZW1haW5pbmcgc2V0IG9mIGNlbGxzIGlzIHVzZWQgZm9yIG11bHRpIChtYXApIGFuZCBzaW5nbGVcbiAqIChwcm9wKSBzdHlsZSB2YWx1ZXMuXG4gKlxuICogZWFjaCB2YWx1ZSBmcm9tIGhlcmUgb253YXJkcyBpcyBtYXBwZWQgYXMgc286XG4gKiBbaV0gPSBtdXRhdGlvbi90eXBlIGZsYWcgZm9yIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZVxuICogW2kgKyAxXSA9IHByb3Agc3RyaW5nIChvciBudWxsIGluY2FzZSBpdCBoYXMgYmVlbiByZW1vdmVkKVxuICogW2kgKyAyXSA9IHZhbHVlIHN0cmluZyAob3IgbnVsbCBpbmNhc2UgaXQgaGFzIGJlZW4gcmVtb3ZlZClcbiAqXG4gKiBUaGVyZSBhcmUgdGhyZWUgdHlwZXMgb2Ygc3R5bGluZyB0eXBlcyBzdG9yZWQgaW4gdGhpcyBjb250ZXh0OlxuICogICBpbml0aWFsOiBhbnkgc3R5bGVzIHRoYXQgYXJlIHBhc3NlZCBpbiBvbmNlIHRoZSBjb250ZXh0IGlzIGNyZWF0ZWRcbiAqICAgICAgICAgICAgKHRoZXNlIGFyZSBzdG9yZWQgaW4gdGhlIGZpcnN0IGNlbGwgb2YgdGhlIGFycmF5IGFuZCB0aGUgZmlyc3RcbiAqICAgICAgICAgICAgIHZhbHVlIG9mIHRoaXMgYXJyYXkgaXMgYWx3YXlzIGBudWxsYCBldmVuIGlmIG5vIGluaXRpYWwgc3R5bGluZyBleGlzdHMuXG4gKiAgICAgICAgICAgICB0aGUgYG51bGxgIHZhbHVlIGlzIHRoZXJlIHNvIHRoYXQgYW55IG5ldyBzdHlsZXMgaGF2ZSBhIHBhcmVudCB0byBwb2ludFxuICogICAgICAgICAgICAgdG8uIFRoaXMgd2F5IHdlIGNhbiBhbHdheXMgYXNzdW1lIHRoYXQgdGhlcmUgaXMgYSBwYXJlbnQuKVxuICpcbiAqICAgc2luZ2xlOiBhbnkgc3R5bGVzIHRoYXQgYXJlIHVwZGF0ZWQgdXNpbmcgYHVwZGF0ZVN0eWxlUHJvcGAgb3IgYHVwZGF0ZUNsYXNzUHJvcGAgKGZpeGVkIHNldClcbiAqXG4gKiAgIG11bHRpOiBhbnkgc3R5bGVzIHRoYXQgYXJlIHVwZGF0ZWQgdXNpbmcgYHVwZGF0ZVN0eWxpbmdNYXBgIChkeW5hbWljIHNldClcbiAqXG4gKiBOb3RlIHRoYXQgY29udGV4dCBpcyBvbmx5IHVzZWQgdG8gY29sbGVjdCBzdHlsZSBpbmZvcm1hdGlvbi4gT25seSB3aGVuIGByZW5kZXJTdHlsaW5nYFxuICogaXMgY2FsbGVkIGlzIHdoZW4gdGhlIHN0eWxpbmcgcGF5bG9hZCB3aWxsIGJlIHJlbmRlcmVkIChvciBidWlsdCBhcyBhIGtleS92YWx1ZSBtYXApLlxuICpcbiAqIFdoZW4gdGhlIGNvbnRleHQgaXMgY3JlYXRlZCwgZGVwZW5kaW5nIG9uIHdoYXQgaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBhcmUgcGFzc2VkIGluLCB0aGVcbiAqIGNvbnRleHQgaXRzZWxmIHdpbGwgYmUgcHJlLWZpbGxlZCB3aXRoIHNsb3RzIGJhc2VkIG9uIHRoZSBpbml0aWFsIHN0eWxlIHByb3BlcnRpZXMuIFNheVxuICogZm9yIGV4YW1wbGUgd2UgaGF2ZSBhIHNlcmllcyBvZiBpbml0aWFsIHN0eWxlcyB0aGF0IGxvb2sgbGlrZSBzbzpcbiAqXG4gKiAgIHN0eWxlPVwid2lkdGg6MTAwcHg7IGhlaWdodDoyMDBweDtcIlxuICogICBjbGFzcz1cImZvb1wiXG4gKlxuICogVGhlbiB0aGUgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgY29udGV4dCAob25jZSBpbml0aWFsaXplZCkgd2lsbCBsb29rIGxpa2Ugc286XG4gKlxuICogYGBgXG4gKiBjb250ZXh0ID0gW1xuICogICBlbGVtZW50LFxuICogICBwbGF5ZXJDb250ZXh0IHwgbnVsbCxcbiAqICAgc3R5bGVTYW5pdGl6ZXIgfCBudWxsLFxuICogICBbbnVsbCwgJzEwMHB4JywgJzIwMHB4JywgdHJ1ZV0sICAvLyBwcm9wZXJ0eSBuYW1lcyBhcmUgbm90IG5lZWRlZCBzaW5jZSB0aGV5IGhhdmUgYWxyZWFkeSBiZWVuXG4gKiB3cml0dGVuIHRvIERPTS5cbiAqXG4gKiAgIGNvbmZpZ01hc3RlclZhbCxcbiAqICAgMSwgLy8gdGhpcyBpbnN0cnVjdHMgaG93IG1hbnkgYHN0eWxlYCB2YWx1ZXMgdGhlcmUgYXJlIHNvIHRoYXQgY2xhc3MgaW5kZXggdmFsdWVzIGNhbiBiZVxuICogb2Zmc2V0dGVkXG4gKiAgIHsgY2xhc3NPbmU6IHRydWUsIGNsYXNzVHdvOiBmYWxzZSB9IHwgJ2NsYXNzT25lIGNsYXNzVHdvJyB8IG51bGwgLy8gbGFzdCBjbGFzcyB2YWx1ZSBwcm92aWRlZFxuICogaW50byB1cGRhdGVTdHlsaW5nTWFwXG4gKiAgIHsgc3R5bGVPbmU6ICcxMDBweCcsIHN0eWxlVHdvOiAwIH0gfCBudWxsIC8vIGxhc3Qgc3R5bGUgdmFsdWUgcHJvdmlkZWQgaW50byB1cGRhdGVTdHlsaW5nTWFwXG4gKlxuICogICAvLyA4XG4gKiAgICd3aWR0aCcsXG4gKiAgIHBvaW50ZXJzKDEsIDE1KTsgIC8vIFBvaW50IHRvIHN0YXRpYyBgd2lkdGhgOiBgMTAwcHhgIGFuZCBtdWx0aSBgd2lkdGhgLlxuICogICBudWxsLFxuICpcbiAqICAgLy8gMTFcbiAqICAgJ2hlaWdodCcsXG4gKiAgIHBvaW50ZXJzKDIsIDE4KTsgLy8gUG9pbnQgdG8gc3RhdGljIGBoZWlnaHRgOiBgMjAwcHhgIGFuZCBtdWx0aSBgaGVpZ2h0YC5cbiAqICAgbnVsbCxcbiAqXG4gKiAgIC8vIDE0XG4gKiAgICdmb28nLFxuICogICBwb2ludGVycygxLCAyMSk7ICAvLyBQb2ludCB0byBzdGF0aWMgYGZvb2A6IGB0cnVlYCBhbmQgbXVsdGkgYGZvb2AuXG4gKiAgIG51bGwsXG4gKlxuICogICAvLyAxN1xuICogICAnd2lkdGgnLFxuICogICBwb2ludGVycygxLCA2KTsgIC8vIFBvaW50IHRvIHN0YXRpYyBgd2lkdGhgOiBgMTAwcHhgIGFuZCBzaW5nbGUgYHdpZHRoYC5cbiAqICAgbnVsbCxcbiAqXG4gKiAgIC8vIDIxXG4gKiAgICdoZWlnaHQnLFxuICogICBwb2ludGVycygyLCA5KTsgIC8vIFBvaW50IHRvIHN0YXRpYyBgaGVpZ2h0YDogYDIwMHB4YCBhbmQgc2luZ2xlIGBoZWlnaHRgLlxuICogICBudWxsLFxuICpcbiAqICAgLy8gMjRcbiAqICAgJ2ZvbycsXG4gKiAgIHBvaW50ZXJzKDMsIDEyKTsgIC8vIFBvaW50IHRvIHN0YXRpYyBgZm9vYDogYHRydWVgIGFuZCBzaW5nbGUgYGZvb2AuXG4gKiAgIG51bGwsXG4gKiBdXG4gKlxuICogZnVuY3Rpb24gcG9pbnRlcnMoc3RhdGljSW5kZXg6IG51bWJlciwgZHluYW1pY0luZGV4OiBudW1iZXIpIHtcbiAqICAgLy8gY29tYmluZSB0aGUgdHdvIGluZGljZXMgaW50byBhIHNpbmdsZSB3b3JkLlxuICogICByZXR1cm4gKHN0YXRpY0luZGV4IDw8IFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpIHxcbiAqICAgICAoZHluYW1pY0luZGV4IDw8IChTdHlsaW5nSW5kZXguQml0Q291bnRTaXplICsgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkpO1xuICogfVxuICogYGBgXG4gKlxuICogVGhlIHZhbHVlcyBhcmUgZHVwbGljYXRlZCBzbyB0aGF0IHNwYWNlIGlzIHNldCBhc2lkZSBmb3IgYm90aCBtdWx0aSAoW3N0eWxlXSBhbmQgW2NsYXNzXSlcbiAqIGFuZCBzaW5nbGUgKFtzdHlsZS5wcm9wXSBvciBbY2xhc3MubmFtZWRdKSB2YWx1ZXMuIFRoZSByZXNwZWN0aXZlIGNvbmZpZyB2YWx1ZXNcbiAqIChjb25maWdWYWxBLCBjb25maWdWYWxCLCBldGMuLi4pIGFyZSBhIGNvbWJpbmF0aW9uIG9mIHRoZSBTdHlsaW5nRmxhZ3Mgd2l0aCB0d28gaW5kZXhcbiAqIHZhbHVlczogdGhlIGBpbml0aWFsSW5kZXhgICh3aGljaCBwb2ludHMgdG8gdGhlIGluZGV4IGxvY2F0aW9uIG9mIHRoZSBzdHlsZSB2YWx1ZSBpblxuICogdGhlIGluaXRpYWwgc3R5bGVzIGFycmF5IGluIHNsb3QgMCkgYW5kIHRoZSBgZHluYW1pY0luZGV4YCAod2hpY2ggcG9pbnRzIHRvIHRoZVxuICogbWF0Y2hpbmcgc2luZ2xlL211bHRpIGluZGV4IHBvc2l0aW9uIGluIHRoZSBjb250ZXh0IGFycmF5IGZvciB0aGUgc2FtZSBwcm9wKS5cbiAqXG4gKiBUaGlzIG1lYW5zIHRoYXQgZXZlcnkgdGltZSBgdXBkYXRlU3R5bGVQcm9wYCBvciBgdXBkYXRlQ2xhc3NQcm9wYCBhcmUgY2FsbGVkIHRoZW4gdGhleVxuICogbXVzdCBiZSBjYWxsZWQgdXNpbmcgYW4gaW5kZXggdmFsdWUgKG5vdCBhIHByb3BlcnR5IHN0cmluZykgd2hpY2ggcmVmZXJlbmNlcyB0aGUgaW5kZXhcbiAqIHZhbHVlIG9mIHRoZSBpbml0aWFsIHN0eWxlIHByb3AvY2xhc3Mgd2hlbiB0aGUgY29udGV4dCB3YXMgY3JlYXRlZC4gVGhpcyBhbHNvIG1lYW5zIHRoYXRcbiAqIGB1cGRhdGVTdHlsZVByb3BgIG9yIGB1cGRhdGVDbGFzc1Byb3BgIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBhIG5ldyBwcm9wZXJ0eSAob25seVxuICogYHVwZGF0ZVN0eWxpbmdNYXBgIGNhbiBpbmNsdWRlIG5ldyBDU1MgcHJvcGVydGllcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGNvbnRleHQpLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0eWxpbmdDb250ZXh0IGV4dGVuZHMgQXJyYXk8SW5pdGlhbFN0eWxlc3x7W2tleTogc3RyaW5nXTogYW55fXxudW1iZXJ8c3RyaW5nfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvb2xlYW58UkVsZW1lbnR8U3R5bGVTYW5pdGl6ZUZufFBsYXllckNvbnRleHR8bnVsbD4ge1xuICAvKipcbiAgICogTG9jYXRpb24gb2YgYW5pbWF0aW9uIGNvbnRleHQgKHdoaWNoIGNvbnRhaW5zIHRoZSBhY3RpdmUgcGxheWVycykgZm9yIHRoaXMgZWxlbWVudCBzdHlsaW5nXG4gICAqIGNvbnRleHQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdOiBQbGF5ZXJDb250ZXh0fG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBzdHlsZSBzYW5pdGl6ZXIgdGhhdCBpcyB1c2VkIHdpdGhpbiB0aGlzIGNvbnRleHRcbiAgICovXG4gIFtTdHlsaW5nSW5kZXguU3R5bGVTYW5pdGl6ZXJQb3NpdGlvbl06IFN0eWxlU2FuaXRpemVGbnxudWxsO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBpbml0aWFsIGRhdGEgc2hhcmVkIGJ5IGFsbCBpbnN0YW5jZXMgb2YgdGhpcyBzdHlsZS5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlc1Bvc2l0aW9uXTogSW5pdGlhbFN0eWxlcztcblxuICAvKipcbiAgICogQSBudW1lcmljIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgY29uZmlndXJhdGlvbiBzdGF0dXMgKHdoZXRoZXIgdGhlIGNvbnRleHQgaXMgZGlydHkgb3Igbm90KVxuICAgKiBtaXhlZCB0b2dldGhlciAodXNpbmcgYml0IHNoaWZ0aW5nKSB3aXRoIGEgaW5kZXggdmFsdWUgd2hpY2ggdGVsbHMgdGhlIHN0YXJ0aW5nIGluZGV4IHZhbHVlXG4gICAqIG9mIHdoZXJlIHRoZSBtdWx0aSBzdHlsZSBlbnRyaWVzIGJlZ2luLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEEgbnVtZXJpYyB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIGNsYXNzIGluZGV4IG9mZnNldCB2YWx1ZS4gV2hlbmV2ZXIgYSBzaW5nbGUgY2xhc3MgaXNcbiAgICogYXBwbGllZCAodXNpbmcgYGVsZW1lbnRDbGFzc1Byb3BgKSBpdCBzaG91bGQgaGF2ZSBhbiBzdHlsaW5nIGluZGV4IHZhbHVlIHRoYXQgZG9lc24ndFxuICAgKiBuZWVkIHRvIHRha2UgaW50byBhY2NvdW50IGFueSBzdHlsZSB2YWx1ZXMgdGhhdCBleGlzdCBpbiB0aGUgY29udGV4dC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguQ2xhc3NPZmZzZXRQb3NpdGlvbl06IG51bWJlcjtcblxuICAvKipcbiAgICogTG9jYXRpb24gb2YgZWxlbWVudCB0aGF0IGlzIHVzZWQgYXMgYSB0YXJnZXQgZm9yIHRoaXMgY29udGV4dC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXTogUkVsZW1lbnR8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGxhc3QgY2xhc3MgdmFsdWUgdGhhdCB3YXMgaW50ZXJwcmV0ZWQgYnkgZWxlbWVudFN0eWxpbmdNYXAuIFRoaXMgaXMgY2FjaGVkXG4gICAqIFNvIHRoYXQgdGhlIGFsZ29yaXRobSBjYW4gZXhpdCBlYXJseSBpbmNhc2UgdGhlIHZhbHVlIGhhcyBub3QgY2hhbmdlZC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguUHJldmlvdXNNdWx0aUNsYXNzVmFsdWVdOiB7W2tleTogc3RyaW5nXTogYW55fXxzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGxhc3Qgc3R5bGUgdmFsdWUgdGhhdCB3YXMgaW50ZXJwcmV0ZWQgYnkgZWxlbWVudFN0eWxpbmdNYXAuIFRoaXMgaXMgY2FjaGVkXG4gICAqIFNvIHRoYXQgdGhlIGFsZ29yaXRobSBjYW4gZXhpdCBlYXJseSBpbmNhc2UgdGhlIHZhbHVlIGhhcyBub3QgY2hhbmdlZC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguUHJldmlvdXNNdWx0aVN0eWxlVmFsdWVdOiB7W2tleTogc3RyaW5nXTogYW55fXxudWxsO1xufVxuXG4vKipcbiAqIFRoZSBpbml0aWFsIHN0eWxlcyBpcyBwb3B1bGF0ZWQgd2hldGhlciBvciBub3QgdGhlcmUgYXJlIGFueSBpbml0aWFsIHN0eWxlcyBwYXNzZWQgaW50b1xuICogdGhlIGNvbnRleHQgZHVyaW5nIGFsbG9jYXRpb24uIFRoZSAwdGggdmFsdWUgbXVzdCBiZSBudWxsIHNvIHRoYXQgaW5kZXggdmFsdWVzIG9mIGAwYCB3aXRoaW5cbiAqIHRoZSBjb250ZXh0IGZsYWdzIGNhbiBhbHdheXMgcG9pbnQgdG8gYSBudWxsIHZhbHVlIHNhZmVseSB3aGVuIG5vdGhpbmcgaXMgc2V0LlxuICpcbiAqIEFsbCBvdGhlciBlbnRyaWVzIGluIHRoaXMgYXJyYXkgYXJlIG9mIGBzdHJpbmdgIHZhbHVlIGFuZCBjb3JyZXNwb25kIHRvIHRoZSB2YWx1ZXMgdGhhdFxuICogd2VyZSBleHRyYWN0ZWQgZnJvbSB0aGUgYHN0eWxlPVwiXCJgIGF0dHJpYnV0ZSBpbiB0aGUgSFRNTCBjb2RlIGZvciB0aGUgcHJvdmlkZWQgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5pdGlhbFN0eWxlcyBleHRlbmRzIEFycmF5PHN0cmluZ3xudWxsfGJvb2xlYW4+IHsgWzBdOiBudWxsOyB9XG5cbi8qKlxuICogVXNlZCB0byBzZXQgdGhlIGNvbnRleHQgdG8gYmUgZGlydHkgb3Igbm90IGJvdGggb24gdGhlIG1hc3RlciBmbGFnIChwb3NpdGlvbiAxKVxuICogb3IgZm9yIGVhY2ggc2luZ2xlL211bHRpIHByb3BlcnR5IHRoYXQgZXhpc3RzIGluIHRoZSBjb250ZXh0LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nRmxhZ3Mge1xuICAvLyBJbXBsaWVzIG5vIGNvbmZpZ3VyYXRpb25zXG4gIE5vbmUgPSAwYjAwMDAsXG4gIC8vIFdoZXRoZXIgb3Igbm90IHRoZSBlbnRyeSBvciBjb250ZXh0IGl0c2VsZiBpcyBkaXJ0eVxuICBEaXJ0eSA9IDBiMDAwMSxcbiAgLy8gV2hldGhlciBvciBub3QgdGhpcyBpcyBhIGNsYXNzLWJhc2VkIGFzc2lnbm1lbnRcbiAgQ2xhc3MgPSAwYjAwMTAsXG4gIC8vIFdoZXRoZXIgb3Igbm90IGEgc2FuaXRpemVyIHdhcyBhcHBsaWVkIHRvIHRoaXMgcHJvcGVydHlcbiAgU2FuaXRpemUgPSAwYjAxMDAsXG4gIC8vIFdoZXRoZXIgb3Igbm90IGFueSBwbGF5ZXIgYnVpbGRlcnMgd2l0aGluIG5lZWQgdG8gcHJvZHVjZSBuZXcgcGxheWVyc1xuICBQbGF5ZXJCdWlsZGVyc0RpcnR5ID0gMGIxMDAwLFxuICAvLyBUaGUgbWF4IGFtb3VudCBvZiBiaXRzIHVzZWQgdG8gcmVwcmVzZW50IHRoZXNlIGNvbmZpZ3VyYXRpb24gdmFsdWVzXG4gIEJpdENvdW50U2l6ZSA9IDQsXG4gIC8vIFRoZXJlIGFyZSBvbmx5IHRocmVlIGJpdHMgaGVyZVxuICBCaXRNYXNrID0gMGIxMTExXG59XG5cbi8qKiBVc2VkIGFzIG51bWVyaWMgcG9pbnRlciB2YWx1ZXMgdG8gZGV0ZXJtaW5lIHdoYXQgY2VsbHMgdG8gdXBkYXRlIGluIHRoZSBgU3R5bGluZ0NvbnRleHRgICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nSW5kZXgge1xuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgaW5pdGlhbCBzdHlsZXMgYXJlIHN0b3JlZCBpbiB0aGUgc3R5bGluZyBjb250ZXh0XG4gIFBsYXllckNvbnRleHQgPSAwLFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgc3R5bGUgc2FuaXRpemVyIGlzIHN0b3JlZCB3aXRoaW4gdGhlIHN0eWxpbmcgY29udGV4dFxuICBTdHlsZVNhbml0aXplclBvc2l0aW9uID0gMSxcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGluaXRpYWwgc3R5bGVzIGFyZSBzdG9yZWQgaW4gdGhlIHN0eWxpbmcgY29udGV4dFxuICBJbml0aWFsU3R5bGVzUG9zaXRpb24gPSAyLFxuICAvLyBJbmRleCBvZiBsb2NhdGlvbiB3aGVyZSB0aGUgc3RhcnQgb2Ygc2luZ2xlIHByb3BlcnRpZXMgYXJlIHN0b3JlZC4gKGB1cGRhdGVTdHlsZVByb3BgKVxuICBNYXN0ZXJGbGFnUG9zaXRpb24gPSAzLFxuICAvLyBJbmRleCBvZiBsb2NhdGlvbiB3aGVyZSB0aGUgY2xhc3MgaW5kZXggb2Zmc2V0IHZhbHVlIGlzIGxvY2F0ZWRcbiAgQ2xhc3NPZmZzZXRQb3NpdGlvbiA9IDQsXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBpbml0aWFsIHN0eWxlcyBhcmUgc3RvcmVkIGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgLy8gVGhpcyBpbmRleCBtdXN0IGFsaWduIHdpdGggSE9TVCwgc2VlIGludGVyZmFjZXMvdmlldy50c1xuICBFbGVtZW50UG9zaXRpb24gPSA1LFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgbGFzdCBzdHJpbmctYmFzZWQgQ1NTIGNsYXNzIHZhbHVlIHdhcyBzdG9yZWRcbiAgUHJldmlvdXNNdWx0aUNsYXNzVmFsdWUgPSA2LFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgbGFzdCBzdHJpbmctYmFzZWQgQ1NTIGNsYXNzIHZhbHVlIHdhcyBzdG9yZWRcbiAgUHJldmlvdXNNdWx0aVN0eWxlVmFsdWUgPSA3LFxuICAvLyBMb2NhdGlvbiBvZiBzaW5nbGUgKHByb3ApIHZhbHVlIGVudHJpZXMgYXJlIHN0b3JlZCB3aXRoaW4gdGhlIGNvbnRleHRcbiAgU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA9IDgsXG4gIC8vIE11bHRpIGFuZCBzaW5nbGUgZW50cmllcyBhcmUgc3RvcmVkIGluIGBTdHlsaW5nQ29udGV4dGAgYXM6IEZsYWc7IFByb3BlcnR5TmFtZTsgIFByb3BlcnR5VmFsdWVcbiAgRmxhZ3NPZmZzZXQgPSAwLFxuICBQcm9wZXJ0eU9mZnNldCA9IDEsXG4gIFZhbHVlT2Zmc2V0ID0gMixcbiAgUGxheWVyQnVpbGRlckluZGV4T2Zmc2V0ID0gMyxcbiAgLy8gU2l6ZSBvZiBlYWNoIG11bHRpIG9yIHNpbmdsZSBlbnRyeSAoZmxhZyArIHByb3AgKyB2YWx1ZSArIHBsYXllckJ1aWxkZXJJbmRleClcbiAgU2l6ZSA9IDQsXG4gIC8vIEVhY2ggZmxhZyBoYXMgYSBiaW5hcnkgZGlnaXQgbGVuZ3RoIG9mIHRoaXMgdmFsdWVcbiAgQml0Q291bnRTaXplID0gMTQsICAvLyAoMzIgLSA0KSAvIDIgPSB+MTRcbiAgLy8gVGhlIGJpbmFyeSBkaWdpdCB2YWx1ZSBhcyBhIG1hc2tcbiAgQml0TWFzayA9IDBiMTExMTExMTExMTExMTEsICAvLyAxNCBiaXRzXG59XG4iXX0=