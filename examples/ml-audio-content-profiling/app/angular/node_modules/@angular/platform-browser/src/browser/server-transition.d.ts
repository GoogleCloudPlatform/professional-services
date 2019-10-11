/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken, Injector, StaticProvider } from '@angular/core';
/**
 * An id that identifies a particular application being bootstrapped, that should
 * match across the client/server boundary.
 */
export declare const TRANSITION_ID: InjectionToken<{}>;
export declare function appInitializerFactory(transitionId: string, document: any, injector: Injector): () => void;
export declare const SERVER_TRANSITION_PROVIDERS: StaticProvider[];
