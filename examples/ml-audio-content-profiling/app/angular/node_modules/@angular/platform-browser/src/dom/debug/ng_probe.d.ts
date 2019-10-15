/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as core from '@angular/core';
/**
 * Returns a {@link DebugElement} for the given native DOM element, or
 * null if the given native element does not have an Angular view associated
 * with it.
 */
export declare function inspectNativeElement(element: any): core.DebugNode | null;
export declare function _createNgProbe(coreTokens: core.NgProbeToken[]): any;
/**
 * Providers which support debugging Angular applications (e.g. via `ng.probe`).
 */
export declare const ELEMENT_PROBE_PROVIDERS: core.Provider[];
