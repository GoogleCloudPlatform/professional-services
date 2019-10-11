/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '@angular/core';
import { HammerLoader } from '@angular/platform-browser';
/** Injection token that configures whether the Material sanity checks are enabled. */
export declare const MATERIAL_SANITY_CHECKS: InjectionToken<boolean>;
/** @docs-private */
export declare function MATERIAL_SANITY_CHECKS_FACTORY(): boolean;
/**
 * Module that captures anything that should be loaded and/or run for *all* Angular Material
 * components. This includes Bidi, etc.
 *
 * This module should be imported to each top-level component module (e.g., MatTabsModule).
 */
export declare class MatCommonModule {
    private _sanityChecksEnabled;
    private _hammerLoader?;
    /** Whether we've done the global sanity checks (e.g. a theme is loaded, there is a doctype). */
    private _hasDoneGlobalChecks;
    /** Whether we've already checked for HammerJs availability. */
    private _hasCheckedHammer;
    /** Reference to the global `document` object. */
    private _document;
    /** Reference to the global 'window' object. */
    private _window;
    constructor(_sanityChecksEnabled: boolean, _hammerLoader?: HammerLoader | undefined);
    /** Whether any sanity checks are enabled */
    private _areChecksEnabled;
    /** Whether the code is running in tests. */
    private _isTestEnv;
    private _checkDoctypeIsDefined;
    private _checkThemeIsPresent;
    /** Checks whether HammerJS is available. */
    _checkHammerIsAvailable(): void;
}
