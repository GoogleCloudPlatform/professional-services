/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { PlatformRef, StaticProvider } from '@angular/core';
export * from './private_export_testing';
/**
 * @publicApi
 */
export declare const platformBrowserDynamicTesting: (extraProviders?: StaticProvider[] | undefined) => PlatformRef;
/**
 * NgModule for testing.
 *
 * @publicApi
 */
export declare class BrowserDynamicTestingModule {
}
