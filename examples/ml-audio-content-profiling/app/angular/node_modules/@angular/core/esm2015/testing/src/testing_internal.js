/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ɵisPromise as isPromise } from '@angular/core';
import { global } from '@angular/core/src/util';
import { AsyncTestCompleter } from './async_test_completer';
import { getTestBed } from './test_bed';
export { AsyncTestCompleter } from './async_test_completer';
export { inject } from './test_bed';
export { Log } from './logger';
export { MockNgZone } from './ng_zone_mock';
/** @type {?} */
export const proxy = (t) => t;
/** @type {?} */
const _global = /** @type {?} */ ((typeof window === 'undefined' ? global : window));
/** @type {?} */
export const afterEach = _global.afterEach;
/** @type {?} */
export const expect = _global.expect;
/** @type {?} */
const jsmBeforeEach = _global.beforeEach;
/** @type {?} */
const jsmDescribe = _global.describe;
/** @type {?} */
const jsmDDescribe = _global.fdescribe;
/** @type {?} */
const jsmXDescribe = _global.xdescribe;
/** @type {?} */
const jsmIt = _global.it;
/** @type {?} */
const jsmFIt = _global.fit;
/** @type {?} */
const jsmXIt = _global.xit;
/** @type {?} */
const runnerStack = [];
jasmine.DEFAULT_TIMEOUT_INTERVAL = 3000;
/** @type {?} */
const globalTimeOut = jasmine.DEFAULT_TIMEOUT_INTERVAL;
/** @type {?} */
const testBed = getTestBed();
/**
 * Mechanism to run `beforeEach()` functions of Angular tests.
 *
 * Note: Jasmine own `beforeEach` is used by this library to handle DI providers.
 */
class BeforeEachRunner {
    /**
     * @param {?} _parent
     */
    constructor(_parent) {
        this._parent = _parent;
        this._fns = [];
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    beforeEach(fn) { this._fns.push(fn); }
    /**
     * @return {?}
     */
    run() {
        if (this._parent)
            this._parent.run();
        this._fns.forEach((fn) => { fn(); });
    }
}
if (false) {
    /** @type {?} */
    BeforeEachRunner.prototype._fns;
    /** @type {?} */
    BeforeEachRunner.prototype._parent;
}
// Reset the test providers before each test
jsmBeforeEach(() => { testBed.resetTestingModule(); });
/**
 * @param {?} jsmFn
 * @param {...?} args
 * @return {?}
 */
function _describe(jsmFn, ...args) {
    /** @type {?} */
    const parentRunner = runnerStack.length === 0 ? null : runnerStack[runnerStack.length - 1];
    /** @type {?} */
    const runner = new BeforeEachRunner(/** @type {?} */ ((parentRunner)));
    runnerStack.push(runner);
    /** @type {?} */
    const suite = jsmFn(...args);
    runnerStack.pop();
    return suite;
}
/**
 * @param {...?} args
 * @return {?}
 */
export function describe(...args) {
    return _describe(jsmDescribe, ...args);
}
/**
 * @param {...?} args
 * @return {?}
 */
export function ddescribe(...args) {
    return _describe(jsmDDescribe, ...args);
}
/**
 * @param {...?} args
 * @return {?}
 */
export function xdescribe(...args) {
    return _describe(jsmXDescribe, ...args);
}
/**
 * @param {?} fn
 * @return {?}
 */
export function beforeEach(fn) {
    if (runnerStack.length > 0) {
        // Inside a describe block, beforeEach() uses a BeforeEachRunner
        runnerStack[runnerStack.length - 1].beforeEach(fn);
    }
    else {
        // Top level beforeEach() are delegated to jasmine
        jsmBeforeEach(fn);
    }
}
/**
 * Allows overriding default providers defined in test_injector.js.
 *
 * The given function must return a list of DI providers.
 *
 * Example:
 *
 *   beforeEachProviders(() => [
 *     {provide: Compiler, useClass: MockCompiler},
 *     {provide: SomeToken, useValue: myValue},
 *   ]);
 * @param {?} fn
 * @return {?}
 */
export function beforeEachProviders(fn) {
    jsmBeforeEach(() => {
        /** @type {?} */
        const providers = fn();
        if (!providers)
            return;
        testBed.configureTestingModule({ providers: providers });
    });
}
/**
 * @param {?} jsmFn
 * @param {?} testName
 * @param {?} testFn
 * @param {?=} testTimeout
 * @return {?}
 */
function _it(jsmFn, testName, testFn, testTimeout = 0) {
    if (runnerStack.length == 0) {
        // This left here intentionally, as we should never get here, and it aids debugging.
        // tslint:disable-next-line
        debugger;
        throw new Error('Empty Stack!');
    }
    /** @type {?} */
    const runner = runnerStack[runnerStack.length - 1];
    /** @type {?} */
    const timeout = Math.max(globalTimeOut, testTimeout);
    jsmFn(testName, (done) => {
        /** @type {?} */
        const completerProvider = {
            provide: AsyncTestCompleter,
            useFactory: () => {
                // Mark the test as async when an AsyncTestCompleter is injected in an it()
                return new AsyncTestCompleter();
            }
        };
        testBed.configureTestingModule({ providers: [completerProvider] });
        runner.run();
        if (testFn.length === 0) {
            /** @type {?} */
            const retVal = testFn();
            if (isPromise(retVal)) {
                // Asynchronous test function that returns a Promise - wait for completion.
                retVal.then(done, done.fail);
            }
            else {
                // Synchronous test function - complete immediately.
                done();
            }
        }
        else {
            // Asynchronous test function that takes in 'done' parameter.
            testFn(done);
        }
    }, timeout);
}
/**
 * @param {?} expectation
 * @param {?} assertion
 * @param {?=} timeout
 * @return {?}
 */
export function it(expectation, assertion, timeout) {
    return _it(jsmIt, expectation, assertion, timeout);
}
/**
 * @param {?} expectation
 * @param {?} assertion
 * @param {?=} timeout
 * @return {?}
 */
export function fit(expectation, assertion, timeout) {
    return _it(jsmFIt, expectation, assertion, timeout);
}
/**
 * @param {?} expectation
 * @param {?} assertion
 * @param {?=} timeout
 * @return {?}
 */
export function xit(expectation, assertion, timeout) {
    return _it(jsmXIt, expectation, assertion, timeout);
}
export class SpyObject {
    /**
     * @param {?=} type
     */
    constructor(type) {
        if (type) {
            for (const prop in type.prototype) {
                /** @type {?} */
                let m = null;
                try {
                    m = type.prototype[prop];
                }
                catch (e) {
                    // As we are creating spys for abstract classes,
                    // these classes might have getters that throw when they are accessed.
                    // As we are only auto creating spys for methods, this
                    // should not matter.
                }
                if (typeof m === 'function') {
                    this.spy(prop);
                }
            }
        }
    }
    /**
     * @param {?} name
     * @return {?}
     */
    spy(name) {
        if (!(/** @type {?} */ (this))[name]) {
            (/** @type {?} */ (this))[name] = jasmine.createSpy(name);
        }
        return (/** @type {?} */ (this))[name];
    }
    /**
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    prop(name, value) { (/** @type {?} */ (this))[name] = value; }
    /**
     * @param {?=} object
     * @param {?=} config
     * @param {?=} overrides
     * @return {?}
     */
    static stub(object = null, config = null, overrides = null) {
        if (!(object instanceof SpyObject)) {
            overrides = config;
            config = object;
            object = new SpyObject();
        }
        /** @type {?} */
        const m = Object.assign({}, config, overrides);
        Object.keys(m).forEach(key => { object.spy(key).and.returnValue(m[key]); });
        return object;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ19pbnRlcm5hbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvdGVzdGluZ19pbnRlcm5hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxVQUFVLElBQUksU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3RELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUU5QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsVUFBVSxFQUFTLE1BQU0sWUFBWSxDQUFDO0FBRTlDLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFbEMsb0JBQWMsVUFBVSxDQUFDO0FBQ3pCLDJCQUFjLGdCQUFnQixDQUFDOztBQUUvQixhQUFhLEtBQUssR0FBbUIsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQzs7QUFFbkQsTUFBTSxPQUFPLHFCQUFRLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFDOztBQUV2RSxhQUFhLFNBQVMsR0FBYSxPQUFPLENBQUMsU0FBUyxDQUFDOztBQUNyRCxhQUFhLE1BQU0sR0FBMEMsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7QUFFNUUsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQzs7QUFDekMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQzs7QUFDckMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQzs7QUFDdkMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQzs7QUFDdkMs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LENBQUM7S0FDNUI7Ozs7OztJQUVELElBQUksQ0FBQyxJQUFZLEVBQUUsS0FBVSxJQUFJLG1CQUFDLElBQVcsRUFBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxFQUFFOzs7Ozs7O0lBRS9ELE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBYyxJQUFJLEVBQUUsU0FBYyxJQUFJLEVBQUUsWUFBaUIsSUFBSTtRQUN2RSxJQUFJLENBQUMsQ0FBQyxNQUFNLFlBQVksU0FBUyxDQUFDLEVBQUU7WUFDbEMsU0FBUyxHQUFHLE1BQU0sQ0FBQztZQUNuQixNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ2hCLE1BQU0sR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1NBQzFCOztRQUVELE1BQU0sQ0FBQyxxQkFBTyxNQUFNLEVBQUssU0FBUyxFQUFFO1FBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVFLE9BQU8sTUFBTSxDQUFDO0tBQ2Y7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHvJtWlzUHJvbWlzZSBhcyBpc1Byb21pc2V9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvc3JjL3V0aWwnO1xuXG5pbXBvcnQge0FzeW5jVGVzdENvbXBsZXRlcn0gZnJvbSAnLi9hc3luY190ZXN0X2NvbXBsZXRlcic7XG5pbXBvcnQge2dldFRlc3RCZWQsIGluamVjdH0gZnJvbSAnLi90ZXN0X2JlZCc7XG5cbmV4cG9ydCB7QXN5bmNUZXN0Q29tcGxldGVyfSBmcm9tICcuL2FzeW5jX3Rlc3RfY29tcGxldGVyJztcbmV4cG9ydCB7aW5qZWN0fSBmcm9tICcuL3Rlc3RfYmVkJztcblxuZXhwb3J0ICogZnJvbSAnLi9sb2dnZXInO1xuZXhwb3J0ICogZnJvbSAnLi9uZ196b25lX21vY2snO1xuXG5leHBvcnQgY29uc3QgcHJveHk6IENsYXNzRGVjb3JhdG9yID0gKHQ6IGFueSkgPT4gdDtcblxuY29uc3QgX2dsb2JhbCA9IDxhbnk+KHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogd2luZG93KTtcblxuZXhwb3J0IGNvbnN0IGFmdGVyRWFjaDogRnVuY3Rpb24gPSBfZ2xvYmFsLmFmdGVyRWFjaDtcbmV4cG9ydCBjb25zdCBleHBlY3Q6IDxUPihhY3R1YWw6IFQpID0+IGphc21pbmUuTWF0Y2hlcnM8VD4gPSBfZ2xvYmFsLmV4cGVjdDtcblxuY29uc3QganNtQmVmb3JlRWFjaCA9IF9nbG9iYWwuYmVmb3JlRWFjaDtcbmNvbnN0IGpzbURlc2NyaWJlID0gX2dsb2JhbC5kZXNjcmliZTtcbmNvbnN0IGpzbUREZXNjcmliZSA9IF9nbG9iYWwuZmRlc2NyaWJlO1xuY29uc3QganNtWERlc2NyaWJlID0gX2dsb2JhbC54ZGVzY3JpYmU7XG5jb25zdCBqc21JdCA9IF9nbG9iYWwuaXQ7XG5jb25zdCBqc21GSXQgPSBfZ2xvYmFsLmZpdDtcbmNvbnN0IGpzbVhJdCA9IF9nbG9iYWwueGl0O1xuXG5jb25zdCBydW5uZXJTdGFjazogQmVmb3JlRWFjaFJ1bm5lcltdID0gW107XG5qYXNtaW5lLkRFRkFVTFRfVElNRU9VVF9JTlRFUlZBTCA9IDMwMDA7XG5jb25zdCBnbG9iYWxUaW1lT3V0ID0gamFzbWluZS5ERUZBVUxUX1RJTUVPVVRfSU5URVJWQUw7XG5cbmNvbnN0IHRlc3RCZWQgPSBnZXRUZXN0QmVkKCk7XG5cbi8qKlxuICogTWVjaGFuaXNtIHRvIHJ1biBgYmVmb3JlRWFjaCgpYCBmdW5jdGlvbnMgb2YgQW5ndWxhciB0ZXN0cy5cbiAqXG4gKiBOb3RlOiBKYXNtaW5lIG93biBgYmVmb3JlRWFjaGAgaXMgdXNlZCBieSB0aGlzIGxpYnJhcnkgdG8gaGFuZGxlIERJIHByb3ZpZGVycy5cbiAqL1xuY2xhc3MgQmVmb3JlRWFjaFJ1bm5lciB7XG4gIHByaXZhdGUgX2ZuczogQXJyYXk8RnVuY3Rpb24+ID0gW107XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcGFyZW50OiBCZWZvcmVFYWNoUnVubmVyKSB7fVxuXG4gIGJlZm9yZUVhY2goZm46IEZ1bmN0aW9uKTogdm9pZCB7IHRoaXMuX2Zucy5wdXNoKGZuKTsgfVxuXG4gIHJ1bigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fcGFyZW50KSB0aGlzLl9wYXJlbnQucnVuKCk7XG4gICAgdGhpcy5fZm5zLmZvckVhY2goKGZuKSA9PiB7IGZuKCk7IH0pO1xuICB9XG59XG5cbi8vIFJlc2V0IHRoZSB0ZXN0IHByb3ZpZGVycyBiZWZvcmUgZWFjaCB0ZXN0XG5qc21CZWZvcmVFYWNoKCgpID0+IHsgdGVzdEJlZC5yZXNldFRlc3RpbmdNb2R1bGUoKTsgfSk7XG5cbmZ1bmN0aW9uIF9kZXNjcmliZShqc21GbjogRnVuY3Rpb24sIC4uLmFyZ3M6IGFueVtdKSB7XG4gIGNvbnN0IHBhcmVudFJ1bm5lciA9IHJ1bm5lclN0YWNrLmxlbmd0aCA9PT0gMCA/IG51bGwgOiBydW5uZXJTdGFja1tydW5uZXJTdGFjay5sZW5ndGggLSAxXTtcbiAgY29uc3QgcnVubmVyID0gbmV3IEJlZm9yZUVhY2hSdW5uZXIocGFyZW50UnVubmVyICEpO1xuICBydW5uZXJTdGFjay5wdXNoKHJ1bm5lcik7XG4gIGNvbnN0IHN1aXRlID0ganNtRm4oLi4uYXJncyk7XG4gIHJ1bm5lclN0YWNrLnBvcCgpO1xuICByZXR1cm4gc3VpdGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXNjcmliZSguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xuICByZXR1cm4gX2Rlc2NyaWJlKGpzbURlc2NyaWJlLCAuLi5hcmdzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRkZXNjcmliZSguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xuICByZXR1cm4gX2Rlc2NyaWJlKGpzbUREZXNjcmliZSwgLi4uYXJncyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB4ZGVzY3JpYmUoLi4uYXJnczogYW55W10pOiB2b2lkIHtcbiAgcmV0dXJuIF9kZXNjcmliZShqc21YRGVzY3JpYmUsIC4uLmFyZ3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmVmb3JlRWFjaChmbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgaWYgKHJ1bm5lclN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAvLyBJbnNpZGUgYSBkZXNjcmliZSBibG9jaywgYmVmb3JlRWFjaCgpIHVzZXMgYSBCZWZvcmVFYWNoUnVubmVyXG4gICAgcnVubmVyU3RhY2tbcnVubmVyU3RhY2subGVuZ3RoIC0gMV0uYmVmb3JlRWFjaChmbik7XG4gIH0gZWxzZSB7XG4gICAgLy8gVG9wIGxldmVsIGJlZm9yZUVhY2goKSBhcmUgZGVsZWdhdGVkIHRvIGphc21pbmVcbiAgICBqc21CZWZvcmVFYWNoKGZuKTtcbiAgfVxufVxuXG4vKipcbiAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qcy5cbiAqXG4gKiBUaGUgZ2l2ZW4gZnVuY3Rpb24gbXVzdCByZXR1cm4gYSBsaXN0IG9mIERJIHByb3ZpZGVycy5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqICAgYmVmb3JlRWFjaFByb3ZpZGVycygoKSA9PiBbXG4gKiAgICAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VDbGFzczogTW9ja0NvbXBpbGVyfSxcbiAqICAgICB7cHJvdmlkZTogU29tZVRva2VuLCB1c2VWYWx1ZTogbXlWYWx1ZX0sXG4gKiAgIF0pO1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmVmb3JlRWFjaFByb3ZpZGVycyhmbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAganNtQmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgY29uc3QgcHJvdmlkZXJzID0gZm4oKTtcbiAgICBpZiAoIXByb3ZpZGVycykgcmV0dXJuO1xuICAgIHRlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZSh7cHJvdmlkZXJzOiBwcm92aWRlcnN9KTtcbiAgfSk7XG59XG5cblxuZnVuY3Rpb24gX2l0KFxuICAgIGpzbUZuOiBGdW5jdGlvbiwgdGVzdE5hbWU6IHN0cmluZywgdGVzdEZuOiAoZG9uZT86IERvbmVGbikgPT4gYW55LCB0ZXN0VGltZW91dCA9IDApOiB2b2lkIHtcbiAgaWYgKHJ1bm5lclN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgLy8gVGhpcyBsZWZ0IGhlcmUgaW50ZW50aW9uYWxseSwgYXMgd2Ugc2hvdWxkIG5ldmVyIGdldCBoZXJlLCBhbmQgaXQgYWlkcyBkZWJ1Z2dpbmcuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lXG4gICAgZGVidWdnZXI7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFbXB0eSBTdGFjayEnKTtcbiAgfVxuICBjb25zdCBydW5uZXIgPSBydW5uZXJTdGFja1tydW5uZXJTdGFjay5sZW5ndGggLSAxXTtcbiAgY29uc3QgdGltZW91dCA9IE1hdGgubWF4KGdsb2JhbFRpbWVPdXQsIHRlc3RUaW1lb3V0KTtcblxuICBqc21Gbih0ZXN0TmFtZSwgKGRvbmU6IERvbmVGbikgPT4ge1xuICAgIGNvbnN0IGNvbXBsZXRlclByb3ZpZGVyID0ge1xuICAgICAgcHJvdmlkZTogQXN5bmNUZXN0Q29tcGxldGVyLFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICAvLyBNYXJrIHRoZSB0ZXN0IGFzIGFzeW5jIHdoZW4gYW4gQXN5bmNUZXN0Q29tcGxldGVyIGlzIGluamVjdGVkIGluIGFuIGl0KClcbiAgICAgICAgcmV0dXJuIG5ldyBBc3luY1Rlc3RDb21wbGV0ZXIoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZSh7cHJvdmlkZXJzOiBbY29tcGxldGVyUHJvdmlkZXJdfSk7XG4gICAgcnVubmVyLnJ1bigpO1xuXG4gICAgaWYgKHRlc3RGbi5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnN0IHJldFZhbCA9IHRlc3RGbigpO1xuICAgICAgaWYgKGlzUHJvbWlzZShyZXRWYWwpKSB7XG4gICAgICAgIC8vIEFzeW5jaHJvbm91cyB0ZXN0IGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIFByb21pc2UgLSB3YWl0IGZvciBjb21wbGV0aW9uLlxuICAgICAgICByZXRWYWwudGhlbihkb25lLCBkb25lLmZhaWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3luY2hyb25vdXMgdGVzdCBmdW5jdGlvbiAtIGNvbXBsZXRlIGltbWVkaWF0ZWx5LlxuICAgICAgICBkb25lKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFzeW5jaHJvbm91cyB0ZXN0IGZ1bmN0aW9uIHRoYXQgdGFrZXMgaW4gJ2RvbmUnIHBhcmFtZXRlci5cbiAgICAgIHRlc3RGbihkb25lKTtcbiAgICB9XG4gIH0sIHRpbWVvdXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXQoZXhwZWN0YXRpb246IHN0cmluZywgYXNzZXJ0aW9uOiAoZG9uZTogRG9uZUZuKSA9PiBhbnksIHRpbWVvdXQ/OiBudW1iZXIpOiB2b2lkIHtcbiAgcmV0dXJuIF9pdChqc21JdCwgZXhwZWN0YXRpb24sIGFzc2VydGlvbiwgdGltZW91dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaXQoZXhwZWN0YXRpb246IHN0cmluZywgYXNzZXJ0aW9uOiAoZG9uZTogRG9uZUZuKSA9PiBhbnksIHRpbWVvdXQ/OiBudW1iZXIpOiB2b2lkIHtcbiAgcmV0dXJuIF9pdChqc21GSXQsIGV4cGVjdGF0aW9uLCBhc3NlcnRpb24sIHRpbWVvdXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24geGl0KGV4cGVjdGF0aW9uOiBzdHJpbmcsIGFzc2VydGlvbjogKGRvbmU6IERvbmVGbikgPT4gYW55LCB0aW1lb3V0PzogbnVtYmVyKTogdm9pZCB7XG4gIHJldHVybiBfaXQoanNtWEl0LCBleHBlY3RhdGlvbiwgYXNzZXJ0aW9uLCB0aW1lb3V0KTtcbn1cblxuZXhwb3J0IGNsYXNzIFNweU9iamVjdCB7XG4gIGNvbnN0cnVjdG9yKHR5cGU/OiBhbnkpIHtcbiAgICBpZiAodHlwZSkge1xuICAgICAgZm9yIChjb25zdCBwcm9wIGluIHR5cGUucHJvdG90eXBlKSB7XG4gICAgICAgIGxldCBtOiBhbnkgPSBudWxsO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG0gPSB0eXBlLnByb3RvdHlwZVtwcm9wXTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8vIEFzIHdlIGFyZSBjcmVhdGluZyBzcHlzIGZvciBhYnN0cmFjdCBjbGFzc2VzLFxuICAgICAgICAgIC8vIHRoZXNlIGNsYXNzZXMgbWlnaHQgaGF2ZSBnZXR0ZXJzIHRoYXQgdGhyb3cgd2hlbiB0aGV5IGFyZSBhY2Nlc3NlZC5cbiAgICAgICAgICAvLyBBcyB3ZSBhcmUgb25seSBhdXRvIGNyZWF0aW5nIHNweXMgZm9yIG1ldGhvZHMsIHRoaXNcbiAgICAgICAgICAvLyBzaG91bGQgbm90IG1hdHRlci5cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLnNweShwcm9wKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNweShuYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAoISh0aGlzIGFzIGFueSlbbmFtZV0pIHtcbiAgICAgICh0aGlzIGFzIGFueSlbbmFtZV0gPSBqYXNtaW5lLmNyZWF0ZVNweShuYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuICh0aGlzIGFzIGFueSlbbmFtZV07XG4gIH1cblxuICBwcm9wKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkgeyAodGhpcyBhcyBhbnkpW25hbWVdID0gdmFsdWU7IH1cblxuICBzdGF0aWMgc3R1YihvYmplY3Q6IGFueSA9IG51bGwsIGNvbmZpZzogYW55ID0gbnVsbCwgb3ZlcnJpZGVzOiBhbnkgPSBudWxsKSB7XG4gICAgaWYgKCEob2JqZWN0IGluc3RhbmNlb2YgU3B5T2JqZWN0KSkge1xuICAgICAgb3ZlcnJpZGVzID0gY29uZmlnO1xuICAgICAgY29uZmlnID0gb2JqZWN0O1xuICAgICAgb2JqZWN0ID0gbmV3IFNweU9iamVjdCgpO1xuICAgIH1cblxuICAgIGNvbnN0IG0gPSB7Li4uY29uZmlnLCAuLi5vdmVycmlkZXN9O1xuICAgIE9iamVjdC5rZXlzKG0pLmZvckVhY2goa2V5ID0+IHsgb2JqZWN0LnNweShrZXkpLmFuZC5yZXR1cm5WYWx1ZShtW2tleV0pOyB9KTtcbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG59XG4iXX0=