/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { logging } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { BuildEvent, TargetSpecifier } from '../src';
import { TestProjectHost } from './test-project-host';
export declare const DefaultTimeout = 45000;
export declare function runTargetSpec(host: TestProjectHost, targetSpec: TargetSpecifier, overrides?: {}, timeout?: number, logger?: logging.Logger): Observable<BuildEvent>;
