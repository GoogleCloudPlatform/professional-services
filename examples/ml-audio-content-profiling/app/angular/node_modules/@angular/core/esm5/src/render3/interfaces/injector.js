/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export var TNODE = 8;
export var PARENT_INJECTOR = 8;
export var INJECTOR_SIZE = 9;
/**
 * Each injector is saved in 9 contiguous slots in `LViewData` and 9 contiguous slots in
 * `TView.data`. This allows us to store information about the current node's tokens (which
 * can be shared in `TView`) as well as the tokens of its ancestor nodes (which cannot be
 * shared, so they live in `LViewData`).
 *
 * Each of these slots (aside from the last slot) contains a bloom filter. This bloom filter
 * determines whether a directive is available on the associated node or not. This prevents us
 * from searching the directives array at this level unless it's probable the directive is in it.
 *
 * See: https://en.wikipedia.org/wiki/Bloom_filter for more about bloom filters.
 *
 * Because all injectors have been flattened into `LViewData` and `TViewData`, they cannot typed
 * using interfaces as they were previously. The start index of each `LInjector` and `TInjector`
 * will differ based on where it is flattened into the main array, so it's not possible to know
 * the indices ahead of time and save their types here. The interfaces are still included here
 * for documentation purposes.
 *
 * export interface LInjector extends Array<any> {
 *
 *    // Cumulative bloom for directive IDs 0-31  (IDs are % BLOOM_SIZE)
 *    [0]: number;
 *
 *    // Cumulative bloom for directive IDs 32-63
 *    [1]: number;
 *
 *    // Cumulative bloom for directive IDs 64-95
 *    [2]: number;
 *
 *    // Cumulative bloom for directive IDs 96-127
 *    [3]: number;
 *
 *    // Cumulative bloom for directive IDs 128-159
 *    [4]: number;
 *
 *    // Cumulative bloom for directive IDs 160 - 191
 *    [5]: number;
 *
 *    // Cumulative bloom for directive IDs 192 - 223
 *    [6]: number;
 *
 *    // Cumulative bloom for directive IDs 224 - 255
 *    [7]: number;
 *
 *    // We need to store a reference to the injector's parent so DI can keep looking up
 *    // the injector tree until it finds the dependency it's looking for.
 *    [PARENT_INJECTOR]: number;
 * }
 *
 * export interface TInjector extends Array<any> {
 *
 *    // Shared node bloom for directive IDs 0-31  (IDs are % BLOOM_SIZE)
 *    [0]: number;
 *
 *    // Shared node bloom for directive IDs 32-63
 *    [1]: number;
 *
 *    // Shared node bloom for directive IDs 64-95
 *    [2]: number;
 *
 *    // Shared node bloom for directive IDs 96-127
 *    [3]: number;
 *
 *    // Shared node bloom for directive IDs 128-159
 *    [4]: number;
 *
 *    // Shared node bloom for directive IDs 160 - 191
 *    [5]: number;
 *
 *    // Shared node bloom for directive IDs 192 - 223
 *    [6]: number;
 *
 *    // Shared node bloom for directive IDs 224 - 255
 *    [7]: number;
 *
 *    // Necessary to find directive indices for a particular node.
 *    [TNODE]: TElementNode|TElementContainerNode|TContainerNode;
 *  }
 */
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
export var unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBS0gsTUFBTSxDQUFDLElBQU0sS0FBSyxHQUFHLENBQUMsQ0FBQztBQUN2QixNQUFNLENBQUMsSUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDO0FBQ2pDLE1BQU0sQ0FBQyxJQUFNLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFPL0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQThFRztBQUVILGlGQUFpRjtBQUNqRiwwQkFBMEI7QUFDMUIsTUFBTSxDQUFDLElBQU0sNkJBQTZCLEdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLH0gZnJvbSAnLi9ub2RlJztcblxuZXhwb3J0IGNvbnN0IFROT0RFID0gODtcbmV4cG9ydCBjb25zdCBQQVJFTlRfSU5KRUNUT1IgPSA4O1xuZXhwb3J0IGNvbnN0IElOSkVDVE9SX1NJWkUgPSA5O1xuXG5leHBvcnQgY29uc3QgZW51bSBJbmplY3RvckxvY2F0aW9uRmxhZ3Mge1xuICBJbmplY3RvckluZGV4TWFzayA9IDBiMTExMTExMTExMTExMTExLFxuICBWaWV3T2Zmc2V0U2hpZnQgPSAxNVxufVxuXG4vKipcbiAqIEVhY2ggaW5qZWN0b3IgaXMgc2F2ZWQgaW4gOSBjb250aWd1b3VzIHNsb3RzIGluIGBMVmlld0RhdGFgIGFuZCA5IGNvbnRpZ3VvdXMgc2xvdHMgaW5cbiAqIGBUVmlldy5kYXRhYC4gVGhpcyBhbGxvd3MgdXMgdG8gc3RvcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgbm9kZSdzIHRva2VucyAod2hpY2hcbiAqIGNhbiBiZSBzaGFyZWQgaW4gYFRWaWV3YCkgYXMgd2VsbCBhcyB0aGUgdG9rZW5zIG9mIGl0cyBhbmNlc3RvciBub2RlcyAod2hpY2ggY2Fubm90IGJlXG4gKiBzaGFyZWQsIHNvIHRoZXkgbGl2ZSBpbiBgTFZpZXdEYXRhYCkuXG4gKlxuICogRWFjaCBvZiB0aGVzZSBzbG90cyAoYXNpZGUgZnJvbSB0aGUgbGFzdCBzbG90KSBjb250YWlucyBhIGJsb29tIGZpbHRlci4gVGhpcyBibG9vbSBmaWx0ZXJcbiAqIGRldGVybWluZXMgd2hldGhlciBhIGRpcmVjdGl2ZSBpcyBhdmFpbGFibGUgb24gdGhlIGFzc29jaWF0ZWQgbm9kZSBvciBub3QuIFRoaXMgcHJldmVudHMgdXNcbiAqIGZyb20gc2VhcmNoaW5nIHRoZSBkaXJlY3RpdmVzIGFycmF5IGF0IHRoaXMgbGV2ZWwgdW5sZXNzIGl0J3MgcHJvYmFibGUgdGhlIGRpcmVjdGl2ZSBpcyBpbiBpdC5cbiAqXG4gKiBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jsb29tX2ZpbHRlciBmb3IgbW9yZSBhYm91dCBibG9vbSBmaWx0ZXJzLlxuICpcbiAqIEJlY2F1c2UgYWxsIGluamVjdG9ycyBoYXZlIGJlZW4gZmxhdHRlbmVkIGludG8gYExWaWV3RGF0YWAgYW5kIGBUVmlld0RhdGFgLCB0aGV5IGNhbm5vdCB0eXBlZFxuICogdXNpbmcgaW50ZXJmYWNlcyBhcyB0aGV5IHdlcmUgcHJldmlvdXNseS4gVGhlIHN0YXJ0IGluZGV4IG9mIGVhY2ggYExJbmplY3RvcmAgYW5kIGBUSW5qZWN0b3JgXG4gKiB3aWxsIGRpZmZlciBiYXNlZCBvbiB3aGVyZSBpdCBpcyBmbGF0dGVuZWQgaW50byB0aGUgbWFpbiBhcnJheSwgc28gaXQncyBub3QgcG9zc2libGUgdG8ga25vd1xuICogdGhlIGluZGljZXMgYWhlYWQgb2YgdGltZSBhbmQgc2F2ZSB0aGVpciB0eXBlcyBoZXJlLiBUaGUgaW50ZXJmYWNlcyBhcmUgc3RpbGwgaW5jbHVkZWQgaGVyZVxuICogZm9yIGRvY3VtZW50YXRpb24gcHVycG9zZXMuXG4gKlxuICogZXhwb3J0IGludGVyZmFjZSBMSW5qZWN0b3IgZXh0ZW5kcyBBcnJheTxhbnk+IHtcbiAqXG4gKiAgICAvLyBDdW11bGF0aXZlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDAtMzEgIChJRHMgYXJlICUgQkxPT01fU0laRSlcbiAqICAgIFswXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMzItNjNcbiAqICAgIFsxXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgNjQtOTVcbiAqICAgIFsyXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgOTYtMTI3XG4gKiAgICBbM106IG51bWJlcjtcbiAqXG4gKiAgICAvLyBDdW11bGF0aXZlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDEyOC0xNTlcbiAqICAgIFs0XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTYwIC0gMTkxXG4gKiAgICBbNV06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBDdW11bGF0aXZlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDE5MiAtIDIyM1xuICogICAgWzZdOiBudW1iZXI7XG4gKlxuICogICAgLy8gQ3VtdWxhdGl2ZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAyMjQgLSAyNTVcbiAqICAgIFs3XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFdlIG5lZWQgdG8gc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGluamVjdG9yJ3MgcGFyZW50IHNvIERJIGNhbiBrZWVwIGxvb2tpbmcgdXBcbiAqICAgIC8vIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIGl0IGZpbmRzIHRoZSBkZXBlbmRlbmN5IGl0J3MgbG9va2luZyBmb3IuXG4gKiAgICBbUEFSRU5UX0lOSkVDVE9SXTogbnVtYmVyO1xuICogfVxuICpcbiAqIGV4cG9ydCBpbnRlcmZhY2UgVEluamVjdG9yIGV4dGVuZHMgQXJyYXk8YW55PiB7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMC0zMSAgKElEcyBhcmUgJSBCTE9PTV9TSVpFKVxuICogICAgWzBdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMzItNjNcbiAqICAgIFsxXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDY0LTk1XG4gKiAgICBbMl06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyA5Ni0xMjdcbiAqICAgIFszXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDEyOC0xNTlcbiAqICAgIFs0XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDE2MCAtIDE5MVxuICogICAgWzVdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTkyIC0gMjIzXG4gKiAgICBbNl06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAyMjQgLSAyNTVcbiAqICAgIFs3XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIE5lY2Vzc2FyeSB0byBmaW5kIGRpcmVjdGl2ZSBpbmRpY2VzIGZvciBhIHBhcnRpY3VsYXIgbm9kZS5cbiAqICAgIFtUTk9ERV06IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VENvbnRhaW5lck5vZGU7XG4gKiAgfVxuICovXG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG4iXX0=