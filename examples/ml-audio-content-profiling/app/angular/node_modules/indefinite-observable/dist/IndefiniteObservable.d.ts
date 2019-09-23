import { Connect, Observable, ObserverOrNext, Subscription } from './types';
/**
 * Observable is a standard interface that's useful for modeling multiple,
 * asynchronous events.
 *
 * IndefiniteObservable is a minimalist implementation of a subset of the TC39
 * Observable proposal.  It is indefinite because it will never call `complete`
 * or `error` on the provided observer.
 */
export default class IndefiniteObservable<T> implements Observable<T> {
    private _connect;
    /**
     * The provided function should receive an observer and connect that
     * observer's `next` method to an event source (for instance,
     * `element.addEventListener('click', observer.next)`).
     *
     * It must return a function that will disconnect the observer from the event
     * source.
     */
    constructor(connect: Connect<T>);
    /**
     * `subscribe` uses the function supplied to the constructor to connect an
     * observer to an event source.  Each observer is connected independently:
     * each call to `subscribe` calls `connect` with the new observer.
     *
     * To disconnect the observer from the event source, call `unsubscribe` on the
     * returned subscription.
     *
     * Note: `subscribe` accepts either a function or an object with a
     * next method.
     */
    subscribe(observerOrNext: ObserverOrNext<T>): Subscription;
}
