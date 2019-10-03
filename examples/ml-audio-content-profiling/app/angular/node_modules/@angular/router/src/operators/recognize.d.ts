/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type } from '@angular/core';
import { MonoTypeOperatorFunction } from 'rxjs';
import { Route } from '../config';
import { NavigationTransition } from '../router';
import { UrlTree } from '../url_tree';
export declare function recognize(rootComponentType: Type<any> | null, config: Route[], serializer: (url: UrlTree) => string, paramsInheritanceStrategy: 'emptyOnly' | 'always', relativeLinkResolution: 'legacy' | 'corrected'): MonoTypeOperatorFunction<NavigationTransition>;
