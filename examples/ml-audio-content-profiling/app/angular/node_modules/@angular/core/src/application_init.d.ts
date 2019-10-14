/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from './di';
/**
 * A function that will be executed when an application is initialized.
 *
 * @publicApi
 */
export declare const APP_INITIALIZER: InjectionToken<(() => void)[]>;
/**
 * A class that reflects the state of running {@link APP_INITIALIZER}s.
 *
 * @publicApi
 */
export declare class ApplicationInitStatus {
    private appInits;
    private resolve;
    private reject;
    private initialized;
    readonly donePromise: Promise<any>;
    readonly done = false;
    constructor(appInits: (() => any)[]);
}
