/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Tree } from '@angular-devkit/schematics';
/** Adds a package to the package.json in the given host tree. */
export declare function addPackageToPackageJson(host: Tree, pkg: string, version: string): Tree;
