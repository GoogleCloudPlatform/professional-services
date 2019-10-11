/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '@angular/core';
import { MonoTypeOperatorFunction } from 'rxjs';
import { Event } from '../events';
import { NavigationTransition } from '../router';
export declare function checkGuards(moduleInjector: Injector, forwardEvent?: (evt: Event) => void): MonoTypeOperatorFunction<NavigationTransition>;
