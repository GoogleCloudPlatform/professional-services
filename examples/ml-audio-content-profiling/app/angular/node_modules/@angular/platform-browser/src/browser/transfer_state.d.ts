/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare function escapeHtml(text: string): string;
export declare function unescapeHtml(text: string): string;
/**
 * A type-safe key to use with `TransferState`.
 *
 * Example:
 *
 * ```
 * const COUNTER_KEY = makeStateKey<number>('counter');
 * let value = 10;
 *
 * transferState.set(COUNTER_KEY, value);
 * ```
 *
 * @publicApi
 */
export declare type StateKey<T> = string & {
    __not_a_string: never;
};
/**
 * Create a `StateKey<T>` that can be used to store value of type T with `TransferState`.
 *
 * Example:
 *
 * ```
 * const COUNTER_KEY = makeStateKey<number>('counter');
 * let value = 10;
 *
 * transferState.set(COUNTER_KEY, value);
 * ```
 *
 * @publicApi
 */
export declare function makeStateKey<T = void>(key: string): StateKey<T>;
/**
 * A key value store that is transferred from the application on the server side to the application
 * on the client side.
 *
 * `TransferState` will be available as an injectable token. To use it import
 * `ServerTransferStateModule` on the server and `BrowserTransferStateModule` on the client.
 *
 * The values in the store are serialized/deserialized using JSON.stringify/JSON.parse. So only
 * boolean, number, string, null and non-class objects will be serialized and deserialzied in a
 * non-lossy manner.
 *
 * @publicApi
 */
export declare class TransferState {
    private store;
    private onSerializeCallbacks;
    /**
     * Get the value corresponding to a key. Return `defaultValue` if key is not found.
     */
    get<T>(key: StateKey<T>, defaultValue: T): T;
    /**
     * Set the value corresponding to a key.
     */
    set<T>(key: StateKey<T>, value: T): void;
    /**
     * Remove a key from the store.
     */
    remove<T>(key: StateKey<T>): void;
    /**
     * Test whether a key exists in the store.
     */
    hasKey<T>(key: StateKey<T>): boolean;
    /**
     * Register a callback to provide the value for a key when `toJson` is called.
     */
    onSerialize<T>(key: StateKey<T>, callback: () => T): void;
    /**
     * Serialize the current state of the store to JSON.
     */
    toJson(): string;
}
export declare function initTransferState(doc: Document, appId: string): TransferState;
/**
 * NgModule to install on the client side while using the `TransferState` to transfer state from
 * server to client.
 *
 * @publicApi
 */
export declare class BrowserTransferStateModule {
}
