/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare const PLATFORM_BROWSER_ID = "browser";
export declare const PLATFORM_SERVER_ID = "server";
export declare const PLATFORM_WORKER_APP_ID = "browserWorkerApp";
export declare const PLATFORM_WORKER_UI_ID = "browserWorkerUi";
/**
 * Returns whether a platform id represents a browser platform.
 * @publicApi
 */
export declare function isPlatformBrowser(platformId: Object): boolean;
/**
 * Returns whether a platform id represents a server platform.
 * @publicApi
 */
export declare function isPlatformServer(platformId: Object): boolean;
/**
 * Returns whether a platform id represents a web worker app platform.
 * @publicApi
 */
export declare function isPlatformWorkerApp(platformId: Object): boolean;
/**
 * Returns whether a platform id represents a web worker UI platform.
 * @publicApi
 */
export declare function isPlatformWorkerUi(platformId: Object): boolean;
