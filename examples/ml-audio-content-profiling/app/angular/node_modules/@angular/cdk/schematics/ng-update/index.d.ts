/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Rule } from '@angular-devkit/schematics';
/** Entry point for the migration schematics with target of Angular Material 6.0.0 */
export declare function updateToV6(): Rule;
/** Entry point for the migration schematics with target of Angular Material 7.0.0 */
export declare function updateToV7(): Rule;
/** Entry point for the migration schematics with target of Angular Material 8.0.0 */
export declare function updateToV8(): Rule;
/** Post-update schematic to be called when update is finished. */
export declare function postUpdate(): Rule;
