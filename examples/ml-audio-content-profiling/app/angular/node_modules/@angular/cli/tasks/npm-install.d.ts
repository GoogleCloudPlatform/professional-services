/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { logging } from '@angular-devkit/core';
export declare type NpmInstall = (packageName: string, logger: logging.Logger, packageManager: string, projectRoot: string, save?: boolean) => Promise<void>;
export default function (packageName: string, logger: logging.Logger, packageManager: string, projectRoot: string, save?: boolean): Promise<void>;
