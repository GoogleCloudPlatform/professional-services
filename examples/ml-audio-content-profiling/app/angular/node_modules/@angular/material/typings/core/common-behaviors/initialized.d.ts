/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Observable } from 'rxjs';
import { Constructor } from './constructor';
/**
 * Mixin that adds an initialized property to a directive which, when subscribed to, will emit a
 * value once markInitialized has been called, which should be done during the ngOnInit function.
 * If the subscription is made after it has already been marked as initialized, then it will trigger
 * an emit immediately.
 * @docs-private
 */
export interface HasInitialized {
    /** Stream that emits once during the directive/component's ngOnInit. */
    initialized: Observable<void>;
    /**
     * Sets the state as initialized and must be called during ngOnInit to notify subscribers that
     * the directive has been initialized.
     * @docs-private
     */
    _markInitialized: () => void;
}
/** @docs-private */
export declare type HasInitializedCtor = Constructor<HasInitialized>;
/** Mixin to augment a directive with an initialized property that will emits when ngOnInit ends. */
export declare function mixinInitialized<T extends Constructor<{}>>(base: T): HasInitializedCtor & T;
