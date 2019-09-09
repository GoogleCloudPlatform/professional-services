/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgZone } from '../zone/ng_zone';
/**
 * Testability API.
 * `declare` keyword causes tsickle to generate externs, so these methods are
 * not renamed by Closure Compiler.
 * @publicApi
 */
export declare interface PublicTestability {
    isStable(): boolean;
    whenStable(callback: Function, timeout?: number, updateCallback?: Function): void;
    findProviders(using: any, provider: string, exactMatch: boolean): any[];
}
export interface PendingMacrotask {
    source: string;
    creationLocation: Error;
    runCount?: number;
    data: TaskData;
}
export interface TaskData {
    target?: XMLHttpRequest;
    delay?: number;
    isPeriodic?: boolean;
}
export declare type DoneCallback = (didWork: boolean, tasks?: PendingMacrotask[]) => void;
export declare type UpdateCallback = (tasks: PendingMacrotask[]) => boolean;
/**
 * The Testability service provides testing hooks that can be accessed from
 * the browser and by services such as Protractor. Each bootstrapped Angular
 * application on the page will have an instance of Testability.
 * @publicApi
 */
export declare class Testability implements PublicTestability {
    private _ngZone;
    private _pendingCount;
    private _isZoneStable;
    private _callbacks;
    private taskTrackingZone;
    constructor(_ngZone: NgZone);
    private _watchAngularEvents;
    /**
     * Increases the number of pending request
     * @deprecated pending requests are now tracked with zones.
     */
    increasePendingRequestCount(): number;
    /**
     * Decreases the number of pending request
     * @deprecated pending requests are now tracked with zones
     */
    decreasePendingRequestCount(): number;
    /**
     * Whether an associated application is stable
     */
    isStable(): boolean;
    private _runCallbacksIfReady;
    private getPendingTasks;
    private addCallback;
    /**
     * Wait for the application to be stable with a timeout. If the timeout is reached before that
     * happens, the callback receives a list of the macro tasks that were pending, otherwise null.
     *
     * @param doneCb The callback to invoke when Angular is stable or the timeout expires
     *    whichever comes first.
     * @param timeout Optional. The maximum time to wait for Angular to become stable. If not
     *    specified, whenStable() will wait forever.
     * @param updateCb Optional. If specified, this callback will be invoked whenever the set of
     *    pending macrotasks changes. If this callback returns true doneCb will not be invoked
     *    and no further updates will be issued.
     */
    whenStable(doneCb: Function, timeout?: number, updateCb?: Function): void;
    /**
     * Get the number of pending requests
     * @deprecated pending requests are now tracked with zones
     */
    getPendingRequestCount(): number;
    /**
     * Find providers by name
     * @param using The root element to search from
     * @param provider The name of binding variable
     * @param exactMatch Whether using exactMatch
     */
    findProviders(using: any, provider: string, exactMatch: boolean): any[];
}
/**
 * A global registry of {@link Testability} instances for specific elements.
 * @publicApi
 */
export declare class TestabilityRegistry {
    constructor();
    /**
     * Registers an application with a testability hook so that it can be tracked
     * @param token token of application, root element
     * @param testability Testability hook
     */
    registerApplication(token: any, testability: Testability): void;
    /**
     * Unregisters an application.
     * @param token token of application, root element
     */
    unregisterApplication(token: any): void;
    /**
     * Unregisters all applications
     */
    unregisterAllApplications(): void;
    /**
     * Get a testability hook associated with the application
     * @param elem root element
     */
    getTestability(elem: any): Testability | null;
    /**
     * Get all registered testabilities
     */
    getAllTestabilities(): Testability[];
    /**
     * Get all registered applications(root elements)
     */
    getAllRootElements(): any[];
    /**
     * Find testability of a node in the Tree
     * @param elem node
     * @param findInAncestors whether finding testability in ancestors if testability was not found in
     * current node
     */
    findTestabilityInTree(elem: Node, findInAncestors?: boolean): Testability | null;
}
/**
 * Adapter interface for retrieving the `Testability` service associated for a
 * particular context.
 *
 * @publicApi
 */
export interface GetTestability {
    addToWindow(registry: TestabilityRegistry): void;
    findTestabilityInTree(registry: TestabilityRegistry, elem: any, findInAncestors: boolean): Testability | null;
}
/**
 * Set the {@link GetTestability} implementation used by the Angular testing framework.
 * @publicApi
 */
export declare function setTestabilityGetter(getter: GetTestability): void;
