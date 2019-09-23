/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '@angular/core';
import { MonoTypeOperatorFunction } from 'rxjs';
import { Routes } from '../config';
import { NavigationTransition } from '../router';
import { RouterConfigLoader } from '../router_config_loader';
import { UrlSerializer } from '../url_tree';
export declare function applyRedirects(moduleInjector: Injector, configLoader: RouterConfigLoader, urlSerializer: UrlSerializer, config: Routes): MonoTypeOperatorFunction<NavigationTransition>;
