/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgZone } from '@angular/core';
import { EventManagerPlugin } from './event_manager';
export declare class DomEventsPlugin extends EventManagerPlugin {
    private ngZone;
    constructor(doc: any, ngZone: NgZone, platformId: {} | null);
    private patchEvent;
    supports(eventName: string): boolean;
    addEventListener(element: HTMLElement, eventName: string, handler: Function): Function;
    removeEventListener(target: any, eventName: string, callback: Function): void;
}
