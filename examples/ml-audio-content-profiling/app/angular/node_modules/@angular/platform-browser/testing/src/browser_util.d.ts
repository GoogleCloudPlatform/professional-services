/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgZone } from '@angular/core';
export declare let browserDetection: BrowserDetection;
export declare class BrowserDetection {
    private _overrideUa;
    private readonly _ua;
    static setup(): void;
    constructor(ua: string | null);
    readonly isFirefox: boolean;
    readonly isAndroid: boolean;
    readonly isEdge: boolean;
    readonly isIE: boolean;
    readonly isWebkit: boolean;
    readonly isIOS7: boolean;
    readonly isSlow: boolean;
    readonly supportsNativeIntlApi: boolean;
    readonly isChromeDesktop: boolean;
    readonly isOldChrome: boolean;
    readonly supportsCustomElements: boolean;
    readonly supportsDeprecatedCustomCustomElementsV0: boolean;
    readonly supportsShadowDom: boolean;
    readonly supportsDeprecatedShadowDomV0: boolean;
}
export declare function dispatchEvent(element: any, eventType: any): void;
export declare function el(html: string): HTMLElement;
export declare function normalizeCSS(css: string): string;
export declare function stringifyElement(el: any /** TODO #9100 */): string;
export declare function createNgZone(): NgZone;
