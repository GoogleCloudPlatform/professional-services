/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { PlatformRef, StaticProvider } from '@angular/core';
/**
 * A platform that included corePlatform and the compiler.
 *
 * @publicApi
 */
export declare const platformCoreDynamic: (extraProviders?: StaticProvider[] | undefined) => PlatformRef;
