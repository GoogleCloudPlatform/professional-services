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
import { from, of } from 'rxjs';
import { concatMap, every, first, map, mergeMap } from 'rxjs/operators';
import { ActivationStart, ChildActivationStart } from '../events';
import { andObservables, wrapIntoObservable } from '../utils/collection';
import { getCanActivateChild, getToken } from '../utils/preactivation';
/**
 * @param {?} moduleInjector
 * @param {?=} forwardEvent
 * @return {?}
 */
export function checkGuards(moduleInjector, forwardEvent) {
    return function (source) {
        return source.pipe(mergeMap(t => {
            const { targetSnapshot, currentSnapshot, guards: { canActivateChecks, canDeactivateChecks } } = t;
            if (canDeactivateChecks.length === 0 && canActivateChecks.length === 0) {
                return of(Object.assign({}, t, { guardsResult: true }));
            }
            return runCanDeactivateChecks(canDeactivateChecks, /** @type {?} */ ((targetSnapshot)), currentSnapshot, moduleInjector)
                .pipe(mergeMap((canDeactivate) => {
                return canDeactivate ?
                    runCanActivateChecks(/** @type {?} */ ((targetSnapshot)), canActivateChecks, moduleInjector, forwardEvent) :
                    of(false);
            }), map(guardsResult => (Object.assign({}, t, { guardsResult }))));
        }));
    };
}
/**
 * @param {?} checks
 * @param {?} futureRSS
 * @param {?} currRSS
 * @param {?} moduleInjector
 * @return {?}
 */
function runCanDeactivateChecks(checks, futureRSS, currRSS, moduleInjector) {
    return from(checks).pipe(mergeMap((check) => runCanDeactivate(check.component, check.route, currRSS, futureRSS, moduleInjector)), every((result) => result === true));
}
/**
 * @param {?} futureSnapshot
 * @param {?} checks
 * @param {?} moduleInjector
 * @param {?=} forwardEvent
 * @return {?}
 */
function runCanActivateChecks(futureSnapshot, checks, moduleInjector, forwardEvent) {
    return from(checks).pipe(concatMap((check) => andObservables(from([
        fireChildActivationStart(check.route.parent, forwardEvent),
        fireActivationStart(check.route, forwardEvent),
        runCanActivateChild(futureSnapshot, check.path, moduleInjector),
        runCanActivate(futureSnapshot, check.route, moduleInjector)
    ]))), every((result) => result === true));
}
/**
 * This should fire off `ActivationStart` events for each route being activated at this
 * level.
 * In other words, if you're activating `a` and `b` below, `path` will contain the
 * `ActivatedRouteSnapshot`s for both and we will fire `ActivationStart` for both. Always
 * return
 * `true` so checks continue to run.
 * @param {?} snapshot
 * @param {?=} forwardEvent
 * @return {?}
 */
function fireActivationStart(snapshot, forwardEvent) {
    if (snapshot !== null && forwardEvent) {
        forwardEvent(new ActivationStart(snapshot));
    }
    return of(true);
}
/**
 * This should fire off `ChildActivationStart` events for each route being activated at this
 * level.
 * In other words, if you're activating `a` and `b` below, `path` will contain the
 * `ActivatedRouteSnapshot`s for both and we will fire `ChildActivationStart` for both. Always
 * return
 * `true` so checks continue to run.
 * @param {?} snapshot
 * @param {?=} forwardEvent
 * @return {?}
 */
function fireChildActivationStart(snapshot, forwardEvent) {
    if (snapshot !== null && forwardEvent) {
        forwardEvent(new ChildActivationStart(snapshot));
    }
    return of(true);
}
/**
 * @param {?} futureRSS
 * @param {?} futureARS
 * @param {?} moduleInjector
 * @return {?}
 */
function runCanActivate(futureRSS, futureARS, moduleInjector) {
    /** @type {?} */
    const canActivate = futureARS.routeConfig ? futureARS.routeConfig.canActivate : null;
    if (!canActivate || canActivate.length === 0)
        return of(true);
    /** @type {?} */
    const obs = from(canActivate).pipe(map((c) => {
        /** @type {?} */
        const guard = getToken(c, futureARS, moduleInjector);
        /** @type {?} */
        let observable;
        if (guard.canActivate) {
            observable = wrapIntoObservable(guard.canActivate(futureARS, futureRSS));
        }
        else {
            observable = wrapIntoObservable(guard(futureARS, futureRSS));
        }
        return observable.pipe(first());
    }));
    return andObservables(obs);
}
/**
 * @param {?} futureRSS
 * @param {?} path
 * @param {?} moduleInjector
 * @return {?}
 */
function runCanActivateChild(futureRSS, path, moduleInjector) {
    /** @type {?} */
    const futureARS = path[path.length - 1];
    /** @type {?} */
    const canActivateChildGuards = path.slice(0, path.length - 1)
        .reverse()
        .map(p => getCanActivateChild(p))
        .filter(_ => _ !== null);
    return andObservables(from(canActivateChildGuards).pipe(map((d) => {
        /** @type {?} */
        const obs = from(d.guards).pipe(map((c) => {
            /** @type {?} */
            const guard = getToken(c, d.node, moduleInjector);
            /** @type {?} */
            let observable;
            if (guard.canActivateChild) {
                observable = wrapIntoObservable(guard.canActivateChild(futureARS, futureRSS));
            }
            else {
                observable = wrapIntoObservable(guard(futureARS, futureRSS));
            }
            return observable.pipe(first());
        }));
        return andObservables(obs);
    })));
}
/**
 * @param {?} component
 * @param {?} currARS
 * @param {?} currRSS
 * @param {?} futureRSS
 * @param {?} moduleInjector
 * @return {?}
 */
function runCanDeactivate(component, currARS, currRSS, futureRSS, moduleInjector) {
    /** @type {?} */
    const canDeactivate = currARS && currARS.routeConfig ? currARS.routeConfig.canDeactivate : null;
    if (!canDeactivate || canDeactivate.length === 0)
        return of(true);
    /** @type {?} */
    const canDeactivate$ = from(canDeactivate).pipe(mergeMap((c) => {
        /** @type {?} */
        const guard = getToken(c, currARS, moduleInjector);
        /** @type {?} */
        let observable;
        if (guard.canDeactivate) {
            observable = wrapIntoObservable(guard.canDeactivate(component, currARS, currRSS, futureRSS));
        }
        else {
            observable = wrapIntoObservable(guard(component, currARS, currRSS, futureRSS));
        }
        return observable.pipe(first());
    }));
    return canDeactivate$.pipe(every((result) => result === true));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tfZ3VhcmRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3NyYy9vcGVyYXRvcnMvY2hlY2tfZ3VhcmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUF1QyxJQUFJLEVBQUUsRUFBRSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFdEUsT0FBTyxFQUFDLGVBQWUsRUFBRSxvQkFBb0IsRUFBUSxNQUFNLFdBQVcsQ0FBQztBQUd2RSxPQUFPLEVBQUMsY0FBYyxFQUFFLGtCQUFrQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdkUsT0FBTyxFQUE2QixtQkFBbUIsRUFBRSxRQUFRLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQzs7Ozs7O0FBRWpHLE1BQU0sVUFBVSxXQUFXLENBQUMsY0FBd0IsRUFBRSxZQUFtQztJQUV2RixPQUFPLFVBQVMsTUFBd0M7UUFFdEQsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUM5QixNQUFNLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsRUFBQyxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBQyxFQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlGLElBQUksbUJBQW1CLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUN0RSxPQUFPLEVBQUUsbUJBQU0sQ0FBQyxJQUFFLFlBQVksRUFBRSxJQUFJLElBQUUsQ0FBQzthQUN4QztZQUVELE9BQU8sc0JBQXNCLENBQ2xCLG1CQUFtQixxQkFBRSxjQUFjLElBQUksZUFBZSxFQUFFLGNBQWMsQ0FBQztpQkFDN0Us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QUUsY0FBYyxDQUFDLENBQUM7O1FBQ25ELElBQUksVUFBVSxDQUFzQjtRQUNwQyxJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUU7WUFDdkIsVUFBVSxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztTQUM5RjthQUFNO1lBQ0wsVUFBVSxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1NBQ2hGO1FBQ0QsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7S0FDakMsQ0FBQyxDQUFDLENBQUM7SUFDSixPQUFPLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBVyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztDQUNyRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge01vbm9UeXBlT3BlcmF0b3JGdW5jdGlvbiwgT2JzZXJ2YWJsZSwgZnJvbSwgb2YgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7Y29uY2F0TWFwLCBldmVyeSwgZmlyc3QsIG1hcCwgbWVyZ2VNYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtBY3RpdmF0aW9uU3RhcnQsIENoaWxkQWN0aXZhdGlvblN0YXJ0LCBFdmVudH0gZnJvbSAnLi4vZXZlbnRzJztcbmltcG9ydCB7TmF2aWdhdGlvblRyYW5zaXRpb259IGZyb20gJy4uL3JvdXRlcic7XG5pbXBvcnQge0FjdGl2YXRlZFJvdXRlU25hcHNob3QsIFJvdXRlclN0YXRlU25hcHNob3R9IGZyb20gJy4uL3JvdXRlcl9zdGF0ZSc7XG5pbXBvcnQge2FuZE9ic2VydmFibGVzLCB3cmFwSW50b09ic2VydmFibGV9IGZyb20gJy4uL3V0aWxzL2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtDYW5BY3RpdmF0ZSwgQ2FuRGVhY3RpdmF0ZSwgZ2V0Q2FuQWN0aXZhdGVDaGlsZCwgZ2V0VG9rZW59IGZyb20gJy4uL3V0aWxzL3ByZWFjdGl2YXRpb24nO1xuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tHdWFyZHMobW9kdWxlSW5qZWN0b3I6IEluamVjdG9yLCBmb3J3YXJkRXZlbnQ/OiAoZXZ0OiBFdmVudCkgPT4gdm9pZCk6XG4gICAgTW9ub1R5cGVPcGVyYXRvckZ1bmN0aW9uPE5hdmlnYXRpb25UcmFuc2l0aW9uPiB7XG4gIHJldHVybiBmdW5jdGlvbihzb3VyY2U6IE9ic2VydmFibGU8TmF2aWdhdGlvblRyYW5zaXRpb24+KSB7XG5cbiAgICByZXR1cm4gc291cmNlLnBpcGUobWVyZ2VNYXAodCA9PiB7XG4gICAgICBjb25zdCB7dGFyZ2V0U25hcHNob3QsIGN1cnJlbnRTbmFwc2hvdCwgZ3VhcmRzOiB7Y2FuQWN0aXZhdGVDaGVja3MsIGNhbkRlYWN0aXZhdGVDaGVja3N9fSA9IHQ7XG4gICAgICBpZiAoY2FuRGVhY3RpdmF0ZUNoZWNrcy5sZW5ndGggPT09IDAgJiYgY2FuQWN0aXZhdGVDaGVja3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBvZiAoey4uLnQsIGd1YXJkc1Jlc3VsdDogdHJ1ZX0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcnVuQ2FuRGVhY3RpdmF0ZUNoZWNrcyhcbiAgICAgICAgICAgICAgICAgY2FuRGVhY3RpdmF0ZUNoZWNrcywgdGFyZ2V0U25hcHNob3QgISwgY3VycmVudFNuYXBzaG90LCBtb2R1bGVJbmplY3RvcilcbiAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgICAgbWVyZ2VNYXAoKGNhbkRlYWN0aXZhdGU6IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FuRGVhY3RpdmF0ZSA/XG4gICAgICAgICAgICAgICAgICAgIHJ1bkNhbkFjdGl2YXRlQ2hlY2tzKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0U25hcHNob3QgISwgY2FuQWN0aXZhdGVDaGVja3MsIG1vZHVsZUluamVjdG9yLCBmb3J3YXJkRXZlbnQpIDpcbiAgICAgICAgICAgICAgICAgICAgb2YgKGZhbHNlKTtcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIG1hcChndWFyZHNSZXN1bHQgPT4gKHsuLi50LCBndWFyZHNSZXN1bHR9KSkpO1xuICAgIH0pKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuQ2FuRGVhY3RpdmF0ZUNoZWNrcyhcbiAgICBjaGVja3M6IENhbkRlYWN0aXZhdGVbXSwgZnV0dXJlUlNTOiBSb3V0ZXJTdGF0ZVNuYXBzaG90LCBjdXJyUlNTOiBSb3V0ZXJTdGF0ZVNuYXBzaG90LFxuICAgIG1vZHVsZUluamVjdG9yOiBJbmplY3Rvcik6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICByZXR1cm4gZnJvbShjaGVja3MpLnBpcGUoXG4gICAgICBtZXJnZU1hcChcbiAgICAgICAgICAoY2hlY2s6IENhbkRlYWN0aXZhdGUpID0+XG4gICAgICAgICAgICAgIHJ1bkNhbkRlYWN0aXZhdGUoY2hlY2suY29tcG9uZW50LCBjaGVjay5yb3V0ZSwgY3VyclJTUywgZnV0dXJlUlNTLCBtb2R1bGVJbmplY3RvcikpLFxuICAgICAgZXZlcnkoKHJlc3VsdDogYm9vbGVhbikgPT4gcmVzdWx0ID09PSB0cnVlKSk7XG59XG5cbmZ1bmN0aW9uIHJ1bkNhbkFjdGl2YXRlQ2hlY2tzKFxuICAgIGZ1dHVyZVNuYXBzaG90OiBSb3V0ZXJTdGF0ZVNuYXBzaG90LCBjaGVja3M6IENhbkFjdGl2YXRlW10sIG1vZHVsZUluamVjdG9yOiBJbmplY3RvcixcbiAgICBmb3J3YXJkRXZlbnQ/OiAoZXZ0OiBFdmVudCkgPT4gdm9pZCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICByZXR1cm4gZnJvbShjaGVja3MpLnBpcGUoXG4gICAgICBjb25jYXRNYXAoKGNoZWNrOiBDYW5BY3RpdmF0ZSkgPT4gYW5kT2JzZXJ2YWJsZXMoZnJvbShbXG4gICAgICAgICAgICAgICAgICBmaXJlQ2hpbGRBY3RpdmF0aW9uU3RhcnQoY2hlY2sucm91dGUucGFyZW50LCBmb3J3YXJkRXZlbnQpLFxuICAgICAgICAgICAgICAgICAgZmlyZUFjdGl2YXRpb25TdGFydChjaGVjay5yb3V0ZSwgZm9yd2FyZEV2ZW50KSxcbiAgICAgICAgICAgICAgICAgIHJ1bkNhbkFjdGl2YXRlQ2hpbGQoZnV0dXJlU25hcHNob3QsIGNoZWNrLnBhdGgsIG1vZHVsZUluamVjdG9yKSxcbiAgICAgICAgICAgICAgICAgIHJ1bkNhbkFjdGl2YXRlKGZ1dHVyZVNuYXBzaG90LCBjaGVjay5yb3V0ZSwgbW9kdWxlSW5qZWN0b3IpXG4gICAgICAgICAgICAgICAgXSkpKSxcbiAgICAgIGV2ZXJ5KChyZXN1bHQ6IGJvb2xlYW4pID0+IHJlc3VsdCA9PT0gdHJ1ZSkpO1xufVxuXG4vKipcbiAgICogVGhpcyBzaG91bGQgZmlyZSBvZmYgYEFjdGl2YXRpb25TdGFydGAgZXZlbnRzIGZvciBlYWNoIHJvdXRlIGJlaW5nIGFjdGl2YXRlZCBhdCB0aGlzXG4gICAqIGxldmVsLlxuICAgKiBJbiBvdGhlciB3b3JkcywgaWYgeW91J3JlIGFjdGl2YXRpbmcgYGFgIGFuZCBgYmAgYmVsb3csIGBwYXRoYCB3aWxsIGNvbnRhaW4gdGhlXG4gICAqIGBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90YHMgZm9yIGJvdGggYW5kIHdlIHdpbGwgZmlyZSBgQWN0aXZhdGlvblN0YXJ0YCBmb3IgYm90aC4gQWx3YXlzXG4gICAqIHJldHVyblxuICAgKiBgdHJ1ZWAgc28gY2hlY2tzIGNvbnRpbnVlIHRvIHJ1bi5cbiAgICovXG5mdW5jdGlvbiBmaXJlQWN0aXZhdGlvblN0YXJ0KFxuICAgIHNuYXBzaG90OiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90IHwgbnVsbCxcbiAgICBmb3J3YXJkRXZlbnQ/OiAoZXZ0OiBFdmVudCkgPT4gdm9pZCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICBpZiAoc25hcHNob3QgIT09IG51bGwgJiYgZm9yd2FyZEV2ZW50KSB7XG4gICAgZm9yd2FyZEV2ZW50KG5ldyBBY3RpdmF0aW9uU3RhcnQoc25hcHNob3QpKTtcbiAgfVxuICByZXR1cm4gb2YgKHRydWUpO1xufVxuXG4vKipcbiAgICogVGhpcyBzaG91bGQgZmlyZSBvZmYgYENoaWxkQWN0aXZhdGlvblN0YXJ0YCBldmVudHMgZm9yIGVhY2ggcm91dGUgYmVpbmcgYWN0aXZhdGVkIGF0IHRoaXNcbiAgICogbGV2ZWwuXG4gICAqIEluIG90aGVyIHdvcmRzLCBpZiB5b3UncmUgYWN0aXZhdGluZyBgYWAgYW5kIGBiYCBiZWxvdywgYHBhdGhgIHdpbGwgY29udGFpbiB0aGVcbiAgICogYEFjdGl2YXRlZFJvdXRlU25hcHNob3RgcyBmb3IgYm90aCBhbmQgd2Ugd2lsbCBmaXJlIGBDaGlsZEFjdGl2YXRpb25TdGFydGAgZm9yIGJvdGguIEFsd2F5c1xuICAgKiByZXR1cm5cbiAgICogYHRydWVgIHNvIGNoZWNrcyBjb250aW51ZSB0byBydW4uXG4gICAqL1xuZnVuY3Rpb24gZmlyZUNoaWxkQWN0aXZhdGlvblN0YXJ0KFxuICAgIHNuYXBzaG90OiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90IHwgbnVsbCxcbiAgICBmb3J3YXJkRXZlbnQ/OiAoZXZ0OiBFdmVudCkgPT4gdm9pZCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICBpZiAoc25hcHNob3QgIT09IG51bGwgJiYgZm9yd2FyZEV2ZW50KSB7XG4gICAgZm9yd2FyZEV2ZW50KG5ldyBDaGlsZEFjdGl2YXRpb25TdGFydChzbmFwc2hvdCkpO1xuICB9XG4gIHJldHVybiBvZiAodHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHJ1bkNhbkFjdGl2YXRlKFxuICAgIGZ1dHVyZVJTUzogUm91dGVyU3RhdGVTbmFwc2hvdCwgZnV0dXJlQVJTOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LFxuICAgIG1vZHVsZUluamVjdG9yOiBJbmplY3Rvcik6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICBjb25zdCBjYW5BY3RpdmF0ZSA9IGZ1dHVyZUFSUy5yb3V0ZUNvbmZpZyA/IGZ1dHVyZUFSUy5yb3V0ZUNvbmZpZy5jYW5BY3RpdmF0ZSA6IG51bGw7XG4gIGlmICghY2FuQWN0aXZhdGUgfHwgY2FuQWN0aXZhdGUubGVuZ3RoID09PSAwKSByZXR1cm4gb2YgKHRydWUpO1xuICBjb25zdCBvYnMgPSBmcm9tKGNhbkFjdGl2YXRlKS5waXBlKG1hcCgoYzogYW55KSA9PiB7XG4gICAgY29uc3QgZ3VhcmQgPSBnZXRUb2tlbihjLCBmdXR1cmVBUlMsIG1vZHVsZUluamVjdG9yKTtcbiAgICBsZXQgb2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxib29sZWFuPjtcbiAgICBpZiAoZ3VhcmQuY2FuQWN0aXZhdGUpIHtcbiAgICAgIG9ic2VydmFibGUgPSB3cmFwSW50b09ic2VydmFibGUoZ3VhcmQuY2FuQWN0aXZhdGUoZnV0dXJlQVJTLCBmdXR1cmVSU1MpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JzZXJ2YWJsZSA9IHdyYXBJbnRvT2JzZXJ2YWJsZShndWFyZChmdXR1cmVBUlMsIGZ1dHVyZVJTUykpO1xuICAgIH1cbiAgICByZXR1cm4gb2JzZXJ2YWJsZS5waXBlKGZpcnN0KCkpO1xuICB9KSk7XG4gIHJldHVybiBhbmRPYnNlcnZhYmxlcyhvYnMpO1xufVxuXG5mdW5jdGlvbiBydW5DYW5BY3RpdmF0ZUNoaWxkKFxuICAgIGZ1dHVyZVJTUzogUm91dGVyU3RhdGVTbmFwc2hvdCwgcGF0aDogQWN0aXZhdGVkUm91dGVTbmFwc2hvdFtdLFxuICAgIG1vZHVsZUluamVjdG9yOiBJbmplY3Rvcik6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICBjb25zdCBmdXR1cmVBUlMgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07XG5cbiAgY29uc3QgY2FuQWN0aXZhdGVDaGlsZEd1YXJkcyA9IHBhdGguc2xpY2UoMCwgcGF0aC5sZW5ndGggLSAxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXZlcnNlKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKHAgPT4gZ2V0Q2FuQWN0aXZhdGVDaGlsZChwKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKF8gPT4gXyAhPT0gbnVsbCk7XG5cbiAgcmV0dXJuIGFuZE9ic2VydmFibGVzKGZyb20oY2FuQWN0aXZhdGVDaGlsZEd1YXJkcykucGlwZShtYXAoKGQ6IGFueSkgPT4ge1xuICAgIGNvbnN0IG9icyA9IGZyb20oZC5ndWFyZHMpLnBpcGUobWFwKChjOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IGd1YXJkID0gZ2V0VG9rZW4oYywgZC5ub2RlLCBtb2R1bGVJbmplY3Rvcik7XG4gICAgICBsZXQgb2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxib29sZWFuPjtcbiAgICAgIGlmIChndWFyZC5jYW5BY3RpdmF0ZUNoaWxkKSB7XG4gICAgICAgIG9ic2VydmFibGUgPSB3cmFwSW50b09ic2VydmFibGUoZ3VhcmQuY2FuQWN0aXZhdGVDaGlsZChmdXR1cmVBUlMsIGZ1dHVyZVJTUykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2JzZXJ2YWJsZSA9IHdyYXBJbnRvT2JzZXJ2YWJsZShndWFyZChmdXR1cmVBUlMsIGZ1dHVyZVJTUykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9ic2VydmFibGUucGlwZShmaXJzdCgpKTtcbiAgICB9KSk7XG4gICAgcmV0dXJuIGFuZE9ic2VydmFibGVzKG9icyk7XG4gIH0pKSk7XG59XG5cbmZ1bmN0aW9uIHJ1bkNhbkRlYWN0aXZhdGUoXG4gICAgY29tcG9uZW50OiBPYmplY3QgfCBudWxsLCBjdXJyQVJTOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LCBjdXJyUlNTOiBSb3V0ZXJTdGF0ZVNuYXBzaG90LFxuICAgIGZ1dHVyZVJTUzogUm91dGVyU3RhdGVTbmFwc2hvdCwgbW9kdWxlSW5qZWN0b3I6IEluamVjdG9yKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gIGNvbnN0IGNhbkRlYWN0aXZhdGUgPSBjdXJyQVJTICYmIGN1cnJBUlMucm91dGVDb25maWcgPyBjdXJyQVJTLnJvdXRlQ29uZmlnLmNhbkRlYWN0aXZhdGUgOiBudWxsO1xuICBpZiAoIWNhbkRlYWN0aXZhdGUgfHwgY2FuRGVhY3RpdmF0ZS5sZW5ndGggPT09IDApIHJldHVybiBvZiAodHJ1ZSk7XG4gIGNvbnN0IGNhbkRlYWN0aXZhdGUkID0gZnJvbShjYW5EZWFjdGl2YXRlKS5waXBlKG1lcmdlTWFwKChjOiBhbnkpID0+IHtcbiAgICBjb25zdCBndWFyZCA9IGdldFRva2VuKGMsIGN1cnJBUlMsIG1vZHVsZUluamVjdG9yKTtcbiAgICBsZXQgb2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxib29sZWFuPjtcbiAgICBpZiAoZ3VhcmQuY2FuRGVhY3RpdmF0ZSkge1xuICAgICAgb2JzZXJ2YWJsZSA9IHdyYXBJbnRvT2JzZXJ2YWJsZShndWFyZC5jYW5EZWFjdGl2YXRlKGNvbXBvbmVudCwgY3VyckFSUywgY3VyclJTUywgZnV0dXJlUlNTKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9ic2VydmFibGUgPSB3cmFwSW50b09ic2VydmFibGUoZ3VhcmQoY29tcG9uZW50LCBjdXJyQVJTLCBjdXJyUlNTLCBmdXR1cmVSU1MpKTtcbiAgICB9XG4gICAgcmV0dXJuIG9ic2VydmFibGUucGlwZShmaXJzdCgpKTtcbiAgfSkpO1xuICByZXR1cm4gY2FuRGVhY3RpdmF0ZSQucGlwZShldmVyeSgocmVzdWx0OiBhbnkpID0+IHJlc3VsdCA9PT0gdHJ1ZSkpO1xufVxuIl19