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
import { APP_INITIALIZER, ApplicationInitStatus } from './application_init';
import { ApplicationRef } from './application_ref';
import { APP_ID_RANDOM_PROVIDER } from './application_tokens';
import { IterableDiffers, KeyValueDiffers, defaultIterableDiffers, defaultKeyValueDiffers } from './change_detection/change_detection';
import { Console } from './console';
import { Injector } from './di';
import { Inject, Optional, SkipSelf } from './di/metadata';
import { ErrorHandler } from './error_handler';
import { LOCALE_ID } from './i18n/tokens';
import { ComponentFactoryResolver } from './linker';
import { Compiler } from './linker/compiler';
import { NgModule } from './metadata';
import { NgZone } from './zone';
/**
 * @return {?}
 */
export function _iterableDiffersFactory() {
    return defaultIterableDiffers;
}
/**
 * @return {?}
 */
export function _keyValueDiffersFactory() {
    return defaultKeyValueDiffers;
}
/**
 * @param {?=} locale
 * @return {?}
 */
export function _localeFactory(locale) {
    return locale || 'en-US';
}
/** *
 * A built-in [dependency injection token](guide/glossary#di-token)
 * that is used to configure the root injector for bootstrapping.
  @type {?} */
export const APPLICATION_MODULE_PROVIDERS = [
    {
        provide: ApplicationRef,
        useClass: ApplicationRef,
        deps: [NgZone, Console, Injector, ErrorHandler, ComponentFactoryResolver, ApplicationInitStatus]
    },
    {
        provide: ApplicationInitStatus,
        useClass: ApplicationInitStatus,
        deps: [[new Optional(), APP_INITIALIZER]]
    },
    { provide: Compiler, useClass: Compiler, deps: [] },
    APP_ID_RANDOM_PROVIDER,
    { provide: IterableDiffers, useFactory: _iterableDiffersFactory, deps: [] },
    { provide: KeyValueDiffers, useFactory: _keyValueDiffersFactory, deps: [] },
    {
        provide: LOCALE_ID,
        useFactory: _localeFactory,
        deps: [[new Inject(LOCALE_ID), new Optional(), new SkipSelf()]]
    },
];
/**
 * Configures the root injector for an app with
 * providers of `\@angular/core` dependencies that `ApplicationRef` needs
 * to bootstrap components.
 *
 * Re-exported by `BrowserModule`, which is included automatically in the root
 * `AppModule` when you create a new app with the CLI `new` command.
 *
 * \@publicApi
 */
export class ApplicationModule {
    /**
     * @param {?} appRef
     */
    constructor(appRef) { }
}
ApplicationModule.decorators = [
    { type: NgModule, args: [{ providers: APPLICATION_MODULE_PROVIDERS },] }
];
/** @nocollapse */
ApplicationModule.ctorParameters = () => [
    { type: ApplicationRef }
];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGVBQWUsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxzQkFBc0IsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQ3JJLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxFQUFpQixRQUFRLEVBQWlCLE1BQU0sTUFBTSxDQUFDO0FBQzlELE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN6RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4QyxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzNDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDcEMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFFBQVEsQ0FBQzs7OztBQUU5QixNQUFNLFVBQVUsdUJBQXVCO0lBQ3JDLE9BQU8sc0JBQXNCLENBQUM7Q0FDL0I7Ozs7QUFFRCxNQUFNLFVBQVUsdUJBQXVCO0lBQ3JDLE9BQU8sc0JBQXNCLENBQUM7Q0FDL0I7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxNQUFlO0lBQzVDLE9BQU8sTUFBTSxJQUFJLE9BQU8sQ0FBQztDQUMxQjs7Ozs7QUFNRCxhQUFhLDRCQUE0QixHQUFxQjtJQUM1RDtRQUNFLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFFBQVEsRUFBRSxjQUFjO1FBQ3hCLElBQUksRUFDQSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSx3QkFBd0IsRUFBRSxxQkFBcUIsQ0FBQztLQUMvRjtJQUNEO1FBQ0UsT0FBTyxFQUFFLHFCQUFxQjtRQUM5QixRQUFRLEVBQUUscUJBQXFCO1FBQy9CLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxRQUFRLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQztLQUMxQztJQUNELEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7SUFDakQsc0JBQXNCO0lBQ3RCLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztJQUN6RSxFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLHVCQUF1QixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7SUFDekU7UUFDRSxPQUFPLEVBQUUsU0FBUztRQUNsQixVQUFVLEVBQUUsY0FBYztRQUMxQixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksUUFBUSxFQUFFLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0tBQ2hFO0NBQ0YsQ0FBQzs7Ozs7Ozs7Ozs7QUFhRixNQUFNLE9BQU8saUJBQWlCOzs7O0lBRTVCLFlBQVksTUFBc0IsS0FBSTs7O1lBSHZDLFFBQVEsU0FBQyxFQUFDLFNBQVMsRUFBRSw0QkFBNEIsRUFBQzs7OztZQTlEM0MsY0FBYyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBUFBfSU5JVElBTElaRVIsIEFwcGxpY2F0aW9uSW5pdFN0YXR1c30gZnJvbSAnLi9hcHBsaWNhdGlvbl9pbml0JztcbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7QVBQX0lEX1JBTkRPTV9QUk9WSURFUn0gZnJvbSAnLi9hcHBsaWNhdGlvbl90b2tlbnMnO1xuaW1wb3J0IHtJdGVyYWJsZURpZmZlcnMsIEtleVZhbHVlRGlmZmVycywgZGVmYXVsdEl0ZXJhYmxlRGlmZmVycywgZGVmYXVsdEtleVZhbHVlRGlmZmVyc30gZnJvbSAnLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHtDb25zb2xlfSBmcm9tICcuL2NvbnNvbGUnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbiwgSW5qZWN0b3IsIFN0YXRpY1Byb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2tpcFNlbGZ9IGZyb20gJy4vZGkvbWV0YWRhdGEnO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge0xPQ0FMRV9JRH0gZnJvbSAnLi9pMThuL3Rva2Vucyc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9saW5rZXInO1xuaW1wb3J0IHtDb21waWxlcn0gZnJvbSAnLi9saW5rZXIvY29tcGlsZXInO1xuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi96b25lJztcblxuZXhwb3J0IGZ1bmN0aW9uIF9pdGVyYWJsZURpZmZlcnNGYWN0b3J5KCkge1xuICByZXR1cm4gZGVmYXVsdEl0ZXJhYmxlRGlmZmVycztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9rZXlWYWx1ZURpZmZlcnNGYWN0b3J5KCkge1xuICByZXR1cm4gZGVmYXVsdEtleVZhbHVlRGlmZmVycztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9sb2NhbGVGYWN0b3J5KGxvY2FsZT86IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBsb2NhbGUgfHwgJ2VuLVVTJztcbn1cblxuLyoqXG4gKiBBIGJ1aWx0LWluIFtkZXBlbmRlbmN5IGluamVjdGlvbiB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4pXG4gKiB0aGF0IGlzIHVzZWQgdG8gY29uZmlndXJlIHRoZSByb290IGluamVjdG9yIGZvciBib290c3RyYXBwaW5nLlxuICovXG5leHBvcnQgY29uc3QgQVBQTElDQVRJT05fTU9EVUxFX1BST1ZJREVSUzogU3RhdGljUHJvdmlkZXJbXSA9IFtcbiAge1xuICAgIHByb3ZpZGU6IEFwcGxpY2F0aW9uUmVmLFxuICAgIHVzZUNsYXNzOiBBcHBsaWNhdGlvblJlZixcbiAgICBkZXBzOlxuICAgICAgICBbTmdab25lLCBDb25zb2xlLCBJbmplY3RvciwgRXJyb3JIYW5kbGVyLCBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIEFwcGxpY2F0aW9uSW5pdFN0YXR1c11cbiAgfSxcbiAge1xuICAgIHByb3ZpZGU6IEFwcGxpY2F0aW9uSW5pdFN0YXR1cyxcbiAgICB1c2VDbGFzczogQXBwbGljYXRpb25Jbml0U3RhdHVzLFxuICAgIGRlcHM6IFtbbmV3IE9wdGlvbmFsKCksIEFQUF9JTklUSUFMSVpFUl1dXG4gIH0sXG4gIHtwcm92aWRlOiBDb21waWxlciwgdXNlQ2xhc3M6IENvbXBpbGVyLCBkZXBzOiBbXX0sXG4gIEFQUF9JRF9SQU5ET01fUFJPVklERVIsXG4gIHtwcm92aWRlOiBJdGVyYWJsZURpZmZlcnMsIHVzZUZhY3Rvcnk6IF9pdGVyYWJsZURpZmZlcnNGYWN0b3J5LCBkZXBzOiBbXX0sXG4gIHtwcm92aWRlOiBLZXlWYWx1ZURpZmZlcnMsIHVzZUZhY3Rvcnk6IF9rZXlWYWx1ZURpZmZlcnNGYWN0b3J5LCBkZXBzOiBbXX0sXG4gIHtcbiAgICBwcm92aWRlOiBMT0NBTEVfSUQsXG4gICAgdXNlRmFjdG9yeTogX2xvY2FsZUZhY3RvcnksXG4gICAgZGVwczogW1tuZXcgSW5qZWN0KExPQ0FMRV9JRCksIG5ldyBPcHRpb25hbCgpLCBuZXcgU2tpcFNlbGYoKV1dXG4gIH0sXG5dO1xuXG4vKipcbiAqIENvbmZpZ3VyZXMgdGhlIHJvb3QgaW5qZWN0b3IgZm9yIGFuIGFwcCB3aXRoXG4gKiBwcm92aWRlcnMgb2YgYEBhbmd1bGFyL2NvcmVgIGRlcGVuZGVuY2llcyB0aGF0IGBBcHBsaWNhdGlvblJlZmAgbmVlZHNcbiAqIHRvIGJvb3RzdHJhcCBjb21wb25lbnRzLlxuICpcbiAqIFJlLWV4cG9ydGVkIGJ5IGBCcm93c2VyTW9kdWxlYCwgd2hpY2ggaXMgaW5jbHVkZWQgYXV0b21hdGljYWxseSBpbiB0aGUgcm9vdFxuICogYEFwcE1vZHVsZWAgd2hlbiB5b3UgY3JlYXRlIGEgbmV3IGFwcCB3aXRoIHRoZSBDTEkgYG5ld2AgY29tbWFuZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBOZ01vZHVsZSh7cHJvdmlkZXJzOiBBUFBMSUNBVElPTl9NT0RVTEVfUFJPVklERVJTfSlcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbk1vZHVsZSB7XG4gIC8vIEluamVjdCBBcHBsaWNhdGlvblJlZiB0byBtYWtlIGl0IGVhZ2VyLi4uXG4gIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHt9XG59XG4iXX0=