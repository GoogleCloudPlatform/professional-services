/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngcc/src/packages/build_marker" />
import { EntryPoint, EntryPointFormat } from './entry_point';
export declare const NGCC_VERSION = "7.0.4";
/**
 * Check whether there is a build marker for the given entry point and format.
 * @param entryPoint the entry point to check for a marker.
 * @param format the format for which we are checking for a marker.
 */
export declare function checkMarkerFile(entryPoint: EntryPoint, format: EntryPointFormat): boolean;
export declare function writeMarkerFile(entryPoint: EntryPoint, format: EntryPointFormat): void;
