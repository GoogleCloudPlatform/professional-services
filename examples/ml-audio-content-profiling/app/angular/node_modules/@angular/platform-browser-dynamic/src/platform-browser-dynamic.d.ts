/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { PlatformRef, Provider, StaticProvider } from '@angular/core';
export * from './private_export';
export { VERSION } from './version';
export { JitCompilerFactory } from './compiler_factory';
/**
 * @publicApi
 */
export declare const RESOURCE_CACHE_PROVIDER: Provider[];
/**
 * @publicApi
 */
export declare const platformBrowserDynamic: (extraProviders?: StaticProvider[] | undefined) => PlatformRef;
