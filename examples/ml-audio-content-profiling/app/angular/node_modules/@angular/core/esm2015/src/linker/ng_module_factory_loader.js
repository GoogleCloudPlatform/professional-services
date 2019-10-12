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
/**
 * Used to load ng module factories.
 *
 * \@publicApi
 * @abstract
 */
export class NgModuleFactoryLoader {
}
if (false) {
    /**
     * @abstract
     * @param {?} path
     * @return {?}
     */
    NgModuleFactoryLoader.prototype.load = function (path) { };
}
/** @type {?} */
let moduleFactories = new Map();
/**
 * Registers a loaded module. Should only be called from generated NgModuleFactory code.
 * \@publicApi
 * @param {?} id
 * @param {?} factory
 * @return {?}
 */
export function registerModuleFactory(id, factory) {
    /** @type {?} */
    const existing = moduleFactories.get(id);
    if (existing) {
        throw new Error(`Duplicate module registered for ${id} - ${existing.moduleType.name} vs ${factory.moduleType.name}`);
    }
    moduleFactories.set(id, factory);
}
/**
 * @return {?}
 */
export function clearModulesForTest() {
    moduleFactories = new Map();
}
/**
 * Returns the NgModuleFactory with the given id, if it exists and has been loaded.
 * Factories for modules that do not specify an `id` cannot be retrieved. Throws if the module
 * cannot be found.
 * \@publicApi
 * @param {?} id
 * @return {?}
 */
export function getModuleFactory(id) {
    /** @type {?} */
    const factory = moduleFactories.get(id);
    if (!factory)
        throw new Error(`No module with ID ${id} loaded`);
    return factory;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX2ZhY3RvcnlfbG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL25nX21vZHVsZV9mYWN0b3J5X2xvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQWVBLE1BQU0sT0FBZ0IscUJBQXFCO0NBRTFDOzs7Ozs7Ozs7O0FBRUQsSUFBSSxlQUFlLEdBQUcsSUFBSSxHQUFHLEVBQWdDLENBQUM7Ozs7Ozs7O0FBTTlELE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxFQUFVLEVBQUUsT0FBNkI7O0lBQzdFLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDekMsSUFBSSxRQUFRLEVBQUU7UUFDWixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxFQUNuQyxNQUFNLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxPQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUNqRjtJQUNELGVBQWUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0NBQ2xDOzs7O0FBRUQsTUFBTSxVQUFVLG1CQUFtQjtJQUNqQyxlQUFlLEdBQUcsSUFBSSxHQUFHLEVBQWdDLENBQUM7Q0FDM0Q7Ozs7Ozs7OztBQVFELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxFQUFVOztJQUN6QyxNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLElBQUksQ0FBQyxPQUFPO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNoRSxPQUFPLE9BQU8sQ0FBQztDQUNoQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtOZ01vZHVsZUZhY3Rvcnl9IGZyb20gJy4vbmdfbW9kdWxlX2ZhY3RvcnknO1xuXG4vKipcbiAqIFVzZWQgdG8gbG9hZCBuZyBtb2R1bGUgZmFjdG9yaWVzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5nTW9kdWxlRmFjdG9yeUxvYWRlciB7XG4gIGFic3RyYWN0IGxvYWQocGF0aDogc3RyaW5nKTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8YW55Pj47XG59XG5cbmxldCBtb2R1bGVGYWN0b3JpZXMgPSBuZXcgTWFwPHN0cmluZywgTmdNb2R1bGVGYWN0b3J5PGFueT4+KCk7XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgbG9hZGVkIG1vZHVsZS4gU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGZyb20gZ2VuZXJhdGVkIE5nTW9kdWxlRmFjdG9yeSBjb2RlLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJNb2R1bGVGYWN0b3J5KGlkOiBzdHJpbmcsIGZhY3Rvcnk6IE5nTW9kdWxlRmFjdG9yeTxhbnk+KSB7XG4gIGNvbnN0IGV4aXN0aW5nID0gbW9kdWxlRmFjdG9yaWVzLmdldChpZCk7XG4gIGlmIChleGlzdGluZykge1xuICAgIHRocm93IG5ldyBFcnJvcihgRHVwbGljYXRlIG1vZHVsZSByZWdpc3RlcmVkIGZvciAke2lkXG4gICAgICAgICAgICAgICAgICAgIH0gLSAke2V4aXN0aW5nLm1vZHVsZVR5cGUubmFtZX0gdnMgJHtmYWN0b3J5Lm1vZHVsZVR5cGUubmFtZX1gKTtcbiAgfVxuICBtb2R1bGVGYWN0b3JpZXMuc2V0KGlkLCBmYWN0b3J5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyTW9kdWxlc0ZvclRlc3QoKSB7XG4gIG1vZHVsZUZhY3RvcmllcyA9IG5ldyBNYXA8c3RyaW5nLCBOZ01vZHVsZUZhY3Rvcnk8YW55Pj4oKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBOZ01vZHVsZUZhY3Rvcnkgd2l0aCB0aGUgZ2l2ZW4gaWQsIGlmIGl0IGV4aXN0cyBhbmQgaGFzIGJlZW4gbG9hZGVkLlxuICogRmFjdG9yaWVzIGZvciBtb2R1bGVzIHRoYXQgZG8gbm90IHNwZWNpZnkgYW4gYGlkYCBjYW5ub3QgYmUgcmV0cmlldmVkLiBUaHJvd3MgaWYgdGhlIG1vZHVsZVxuICogY2Fubm90IGJlIGZvdW5kLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kdWxlRmFjdG9yeShpZDogc3RyaW5nKTogTmdNb2R1bGVGYWN0b3J5PGFueT4ge1xuICBjb25zdCBmYWN0b3J5ID0gbW9kdWxlRmFjdG9yaWVzLmdldChpZCk7XG4gIGlmICghZmFjdG9yeSkgdGhyb3cgbmV3IEVycm9yKGBObyBtb2R1bGUgd2l0aCBJRCAke2lkfSBsb2FkZWRgKTtcbiAgcmV0dXJuIGZhY3Rvcnk7XG59XG4iXX0=