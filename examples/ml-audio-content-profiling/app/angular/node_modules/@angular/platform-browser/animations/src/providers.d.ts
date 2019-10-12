/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationDriver, ɵAnimationEngine as AnimationEngine, ɵAnimationStyleNormalizer as AnimationStyleNormalizer, ɵCssKeyframesDriver as CssKeyframesDriver, ɵWebAnimationsDriver as WebAnimationsDriver, ɵWebAnimationsStyleNormalizer as WebAnimationsStyleNormalizer } from '@angular/animations/browser';
import { InjectionToken, NgZone, Provider } from '@angular/core';
import { ɵDomRendererFactory2 as DomRendererFactory2 } from '@angular/platform-browser';
import { AnimationRendererFactory } from './animation_renderer';
export declare class InjectableAnimationEngine extends AnimationEngine {
    constructor(doc: any, driver: AnimationDriver, normalizer: AnimationStyleNormalizer);
}
export declare function instantiateSupportedAnimationDriver(): WebAnimationsDriver | CssKeyframesDriver;
export declare function instantiateDefaultStyleNormalizer(): WebAnimationsStyleNormalizer;
export declare function instantiateRendererFactory(renderer: DomRendererFactory2, engine: AnimationEngine, zone: NgZone): AnimationRendererFactory;
/**
 * @publicApi
 */
export declare const ANIMATION_MODULE_TYPE: InjectionToken<"NoopAnimations" | "BrowserAnimations">;
/**
 * Separate providers from the actual module so that we can do a local modification in Google3 to
 * include them in the BrowserModule.
 */
export declare const BROWSER_ANIMATIONS_PROVIDERS: Provider[];
/**
 * Separate providers from the actual module so that we can do a local modification in Google3 to
 * include them in the BrowserTestingModule.
 */
export declare const BROWSER_NOOP_ANIMATIONS_PROVIDERS: Provider[];
