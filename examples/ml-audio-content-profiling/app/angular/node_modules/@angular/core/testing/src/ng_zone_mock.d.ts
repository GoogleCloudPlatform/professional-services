/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, NgZone } from '@angular/core';
/**
 * A mock implementation of {@link NgZone}.
 */
export declare class MockNgZone extends NgZone {
    onStable: EventEmitter<any>;
    constructor();
    run(fn: Function): any;
    runOutsideAngular(fn: Function): any;
    simulateZoneExit(): void;
}
