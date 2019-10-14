/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken, ɵConsole as Console } from '@angular/core';
import { EventManagerPlugin } from './event_manager';
/**
 * DI token for providing [HammerJS](http://hammerjs.github.io/) support to Angular.
 * @see `HammerGestureConfig`
 *
 * @publicApi
 */
export declare const HAMMER_GESTURE_CONFIG: InjectionToken<HammerGestureConfig>;
/**
 * Function that loads HammerJS, returning a promise that is resolved once HammerJs is loaded.
 *
 * @publicApi
 */
export declare type HammerLoader = () => Promise<void>;
/**
 * Injection token used to provide a {@link HammerLoader} to Angular.
 *
 * @publicApi
 */
export declare const HAMMER_LOADER: InjectionToken<HammerLoader>;
export interface HammerInstance {
    on(eventName: string, callback?: Function): void;
    off(eventName: string, callback?: Function): void;
    destroy?(): void;
}
/**
 * An injectable [HammerJS Manager](http://hammerjs.github.io/api/#hammer.manager)
 * for gesture recognition. Configures specific event recognition.
 * @publicApi
 */
export declare class HammerGestureConfig {
    /**
     * A set of supported event names for gestures to be used in Angular.
     * Angular supports all built-in recognizers, as listed in
     * [HammerJS documentation](http://hammerjs.github.io/).
     */
    events: string[];
    /**
    * Maps gesture event names to a set of configuration options
    * that specify overrides to the default values for specific properties.
    *
    * The key is a supported event name to be configured,
    * and the options object contains a set of properties, with override values
    * to be applied to the named recognizer event.
    * For example, to disable recognition of the rotate event, specify
    *  `{"rotate": {"enable": false}}`.
    *
    * Properties that are not present take the HammerJS default values.
    * For information about which properties are supported for which events,
    * and their allowed and default values, see
    * [HammerJS documentation](http://hammerjs.github.io/).
    *
    */
    overrides: {
        [key: string]: Object;
    };
    /**
     * Properties whose default values can be overridden for a given event.
     * Different sets of properties apply to different events.
     * For information about which properties are supported for which events,
     * and their allowed and default values, see
     * [HammerJS documentation](http://hammerjs.github.io/).
     */
    options?: {
        cssProps?: any;
        domEvents?: boolean;
        enable?: boolean | ((manager: any) => boolean);
        preset?: any[];
        touchAction?: string;
        recognizers?: any[];
        inputClass?: any;
        inputTarget?: EventTarget;
    };
    /**
     * Creates a [HammerJS Manager](http://hammerjs.github.io/api/#hammer.manager)
     * and attaches it to a given HTML element.
     * @param element The element that will recognize gestures.
     * @returns A HammerJS event-manager object.
     */
    buildHammer(element: HTMLElement): HammerInstance;
}
export declare class HammerGesturesPlugin extends EventManagerPlugin {
    private _config;
    private console;
    private loader?;
    constructor(doc: any, _config: HammerGestureConfig, console: Console, loader?: HammerLoader | null | undefined);
    supports(eventName: string): boolean;
    addEventListener(element: HTMLElement, eventName: string, handler: Function): Function;
    isCustomEvent(eventName: string): boolean;
}
