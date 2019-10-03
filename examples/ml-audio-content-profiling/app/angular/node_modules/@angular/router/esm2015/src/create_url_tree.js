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
import { PRIMARY_OUTLET } from './shared';
import { UrlSegment, UrlSegmentGroup, UrlTree } from './url_tree';
import { forEach, last, shallowEqual } from './utils/collection';
/**
 * @param {?} route
 * @param {?} urlTree
 * @param {?} commands
 * @param {?} queryParams
 * @param {?} fragment
 * @return {?}
 */
export function createUrlTree(route, urlTree, commands, queryParams, fragment) {
    if (commands.length === 0) {
        return tree(urlTree.root, urlTree.root, urlTree, queryParams, fragment);
    }
    /** @type {?} */
    const nav = computeNavigation(commands);
    if (nav.toRoot()) {
        return tree(urlTree.root, new UrlSegmentGroup([], {}), urlTree, queryParams, fragment);
    }
    /** @type {?} */
    const startingPosition = findStartingPosition(nav, urlTree, route);
    /** @type {?} */
    const segmentGroup = startingPosition.processChildren ?
        updateSegmentGroupChildren(startingPosition.segmentGroup, startingPosition.index, nav.commands) :
        updateSegmentGroup(startingPosition.segmentGroup, startingPosition.index, nav.commands);
    return tree(startingPosition.segmentGroup, segmentGroup, urlTree, queryParams, fragment);
}
/**
 * @param {?} command
 * @return {?}
 */
function isMatrixParams(command) {
    return typeof command === 'object' && command != null && !command.outlets && !command.segmentPath;
}
/**
 * @param {?} oldSegmentGroup
 * @param {?} newSegmentGroup
 * @param {?} urlTree
 * @param {?} queryParams
 * @param {?} fragment
 * @return {?}
 */
function tree(oldSegmentGroup, newSegmentGroup, urlTree, queryParams, fragment) {
    /** @type {?} */
    let qp = {};
    if (queryParams) {
        forEach(queryParams, (value, name) => {
            qp[name] = Array.isArray(value) ? value.map((v) => `${v}`) : `${value}`;
        });
    }
    if (urlTree.root === oldSegmentGroup) {
        return new UrlTree(newSegmentGroup, qp, fragment);
    }
    return new UrlTree(replaceSegment(urlTree.root, oldSegmentGroup, newSegmentGroup), qp, fragment);
}
/**
 * @param {?} current
 * @param {?} oldSegment
 * @param {?} newSegment
 * @return {?}
 */
function replaceSegment(current, oldSegment, newSegment) {
    /** @type {?} */
    const children = {};
    forEach(current.children, (c, outletName) => {
        if (c === oldSegment) {
            children[outletName] = newSegment;
        }
        else {
            children[outletName] = replaceSegment(c, oldSegment, newSegment);
        }
    });
    return new UrlSegmentGroup(current.segments, children);
}
class Navigation {
    /**
     * @param {?} isAbsolute
     * @param {?} numberOfDoubleDots
     * @param {?} commands
     */
    constructor(isAbsolute, numberOfDoubleDots, commands) {
        this.isAbsolute = isAbsolute;
        this.numberOfDoubleDots = numberOfDoubleDots;
        this.commands = commands;
        if (isAbsolute && commands.length > 0 && isMatrixParams(commands[0])) {
            throw new Error('Root segment cannot have matrix parameters');
        }
        /** @type {?} */
        const cmdWithOutlet = commands.find(c => typeof c === 'object' && c != null && c.outlets);
        if (cmdWithOutlet && cmdWithOutlet !== last(commands)) {
            throw new Error('{outlets:{}} has to be the last command');
        }
    }
    /**
     * @return {?}
     */
    toRoot() {
        return this.isAbsolute && this.commands.length === 1 && this.commands[0] == '/';
    }
}
if (false) {
    /** @type {?} */
    Navigation.prototype.isAbsolute;
    /** @type {?} */
    Navigation.prototype.numberOfDoubleDots;
    /** @type {?} */
    Navigation.prototype.commands;
}
/**
 * Transforms commands to a normalized `Navigation`
 * @param {?} commands
 * @return {?}
 */
function computeNavigation(commands) {
    if ((typeof commands[0] === 'string') && commands.length === 1 && commands[0] === '/') {
        return new Navigation(true, 0, commands);
    }
    /** @type {?} */
    let numberOfDoubleDots = 0;
    /** @type {?} */
    let isAbsolute = false;
    /** @type {?} */
    const res = commands.reduce((res, cmd, cmdIdx) => {
        if (typeof cmd === 'object' && cmd != null) {
            if (cmd.outlets) {
                /** @type {?} */
                const outlets = {};
                forEach(cmd.outlets, (commands, name) => {
                    outlets[name] = typeof commands === 'string' ? commands.split('/') : commands;
                });
                return [...res, { outlets }];
            }
            if (cmd.segmentPath) {
                return [...res, cmd.segmentPath];
            }
        }
        if (!(typeof cmd === 'string')) {
            return [...res, cmd];
        }
        if (cmdIdx === 0) {
            cmd.split('/').forEach((urlPart, partIndex) => {
                if (partIndex == 0 && urlPart === '.') {
                    // skip './a'
                }
                else if (partIndex == 0 && urlPart === '') { //  '/a'
                    //  '/a'
                    isAbsolute = true;
                }
                else if (urlPart === '..') { //  '../a'
                    //  '../a'
                    numberOfDoubleDots++;
                }
                else if (urlPart != '') {
                    res.push(urlPart);
                }
            });
            return res;
        }
        return [...res, cmd];
    }, []);
    return new Navigation(isAbsolute, numberOfDoubleDots, res);
}
class Position {
    /**
     * @param {?} segmentGroup
     * @param {?} processChildren
     * @param {?} index
     */
    constructor(segmentGroup, processChildren, index) {
        this.segmentGroup = segmentGroup;
        this.processChildren = processChildren;
        this.index = index;
    }
}
if (false) {
    /** @type {?} */
    Position.prototype.segmentGroup;
    /** @type {?} */
    Position.prototype.processChildren;
    /** @type {?} */
    Position.prototype.index;
}
/**
 * @param {?} nav
 * @param {?} tree
 * @param {?} route
 * @return {?}
 */
function findStartingPosition(nav, tree, route) {
    if (nav.isAbsolute) {
        return new Position(tree.root, true, 0);
    }
    if (route.snapshot._lastPathIndex === -1) {
        return new Position(route.snapshot._urlSegment, true, 0);
    }
    /** @type {?} */
    const modifier = isMatrixParams(nav.commands[0]) ? 0 : 1;
    /** @type {?} */
    const index = route.snapshot._lastPathIndex + modifier;
    return createPositionApplyingDoubleDots(route.snapshot._urlSegment, index, nav.numberOfDoubleDots);
}
/**
 * @param {?} group
 * @param {?} index
 * @param {?} numberOfDoubleDots
 * @return {?}
 */
function createPositionApplyingDoubleDots(group, index, numberOfDoubleDots) {
    /** @type {?} */
    let g = group;
    /** @type {?} */
    let ci = index;
    /** @type {?} */
    let dd = numberOfDoubleDots;
    while (dd > ci) {
        dd -= ci;
        g = /** @type {?} */ ((g.parent));
        if (!g) {
            throw new Error('Invalid number of \'../\'');
        }
        ci = g.segments.length;
    }
    return new Position(g, false, ci - dd);
}
/**
 * @param {?} command
 * @return {?}
 */
function getPath(command) {
    if (typeof command === 'object' && command != null && command.outlets) {
        return command.outlets[PRIMARY_OUTLET];
    }
    return `${command}`;
}
/**
 * @param {?} commands
 * @return {?}
 */
function getOutlets(commands) {
    if (!(typeof commands[0] === 'object'))
        return { [PRIMARY_OUTLET]: commands };
    if (commands[0].outlets === undefined)
        return { [PRIMARY_OUTLET]: commands };
    return commands[0].outlets;
}
/**
 * @param {?} segmentGroup
 * @param {?} startIndex
 * @param {?} commands
 * @return {?}
 */
function updateSegmentGroup(segmentGroup, startIndex, commands) {
    if (!segmentGroup) {
        segmentGroup = new UrlSegmentGroup([], {});
    }
    if (segmentGroup.segments.length === 0 && segmentGroup.hasChildren()) {
        return updateSegmentGroupChildren(segmentGroup, startIndex, commands);
    }
    /** @type {?} */
    const m = prefixedWith(segmentGroup, startIndex, commands);
    /** @type {?} */
    const slicedCommands = commands.slice(m.commandIndex);
    if (m.match && m.pathIndex < segmentGroup.segments.length) {
        /** @type {?} */
        const g = new UrlSegmentGroup(segmentGroup.segments.slice(0, m.pathIndex), {});
        g.children[PRIMARY_OUTLET] =
            new UrlSegmentGroup(segmentGroup.segments.slice(m.pathIndex), segmentGroup.children);
        return updateSegmentGroupChildren(g, 0, slicedCommands);
    }
    else if (m.match && slicedCommands.length === 0) {
        return new UrlSegmentGroup(segmentGroup.segments, {});
    }
    else if (m.match && !segmentGroup.hasChildren()) {
        return createNewSegmentGroup(segmentGroup, startIndex, commands);
    }
    else if (m.match) {
        return updateSegmentGroupChildren(segmentGroup, 0, slicedCommands);
    }
    else {
        return createNewSegmentGroup(segmentGroup, startIndex, commands);
    }
}
/**
 * @param {?} segmentGroup
 * @param {?} startIndex
 * @param {?} commands
 * @return {?}
 */
function updateSegmentGroupChildren(segmentGroup, startIndex, commands) {
    if (commands.length === 0) {
        return new UrlSegmentGroup(segmentGroup.segments, {});
    }
    else {
        /** @type {?} */
        const outlets = getOutlets(commands);
        /** @type {?} */
        const children = {};
        forEach(outlets, (commands, outlet) => {
            if (commands !== null) {
                children[outlet] = updateSegmentGroup(segmentGroup.children[outlet], startIndex, commands);
            }
        });
        forEach(segmentGroup.children, (child, childOutlet) => {
            if (outlets[childOutlet] === undefined) {
                children[childOutlet] = child;
            }
        });
        return new UrlSegmentGroup(segmentGroup.segments, children);
    }
}
/**
 * @param {?} segmentGroup
 * @param {?} startIndex
 * @param {?} commands
 * @return {?}
 */
function prefixedWith(segmentGroup, startIndex, commands) {
    /** @type {?} */
    let currentCommandIndex = 0;
    /** @type {?} */
    let currentPathIndex = startIndex;
    /** @type {?} */
    const noMatch = { match: false, pathIndex: 0, commandIndex: 0 };
    while (currentPathIndex < segmentGroup.segments.length) {
        if (currentCommandIndex >= commands.length)
            return noMatch;
        /** @type {?} */
        const path = segmentGroup.segments[currentPathIndex];
        /** @type {?} */
        const curr = getPath(commands[currentCommandIndex]);
        /** @type {?} */
        const next = currentCommandIndex < commands.length - 1 ? commands[currentCommandIndex + 1] : null;
        if (currentPathIndex > 0 && curr === undefined)
            break;
        if (curr && next && (typeof next === 'object') && next.outlets === undefined) {
            if (!compare(curr, next, path))
                return noMatch;
            currentCommandIndex += 2;
        }
        else {
            if (!compare(curr, {}, path))
                return noMatch;
            currentCommandIndex++;
        }
        currentPathIndex++;
    }
    return { match: true, pathIndex: currentPathIndex, commandIndex: currentCommandIndex };
}
/**
 * @param {?} segmentGroup
 * @param {?} startIndex
 * @param {?} commands
 * @return {?}
 */
function createNewSegmentGroup(segmentGroup, startIndex, commands) {
    /** @type {?} */
    const paths = segmentGroup.segments.slice(0, startIndex);
    /** @type {?} */
    let i = 0;
    while (i < commands.length) {
        if (typeof commands[i] === 'object' && commands[i].outlets !== undefined) {
            /** @type {?} */
            const children = createNewSegmentChildren(commands[i].outlets);
            return new UrlSegmentGroup(paths, children);
        }
        // if we start with an object literal, we need to reuse the path part from the segment
        if (i === 0 && isMatrixParams(commands[0])) {
            /** @type {?} */
            const p = segmentGroup.segments[startIndex];
            paths.push(new UrlSegment(p.path, commands[0]));
            i++;
            continue;
        }
        /** @type {?} */
        const curr = getPath(commands[i]);
        /** @type {?} */
        const next = (i < commands.length - 1) ? commands[i + 1] : null;
        if (curr && next && isMatrixParams(next)) {
            paths.push(new UrlSegment(curr, stringify(next)));
            i += 2;
        }
        else {
            paths.push(new UrlSegment(curr, {}));
            i++;
        }
    }
    return new UrlSegmentGroup(paths, {});
}
/**
 * @param {?} outlets
 * @return {?}
 */
function createNewSegmentChildren(outlets) {
    /** @type {?} */
    const children = {};
    forEach(outlets, (commands, outlet) => {
        if (commands !== null) {
            children[outlet] = createNewSegmentGroup(new UrlSegmentGroup([], {}), 0, commands);
        }
    });
    return children;
}
/**
 * @param {?} params
 * @return {?}
 */
function stringify(params) {
    /** @type {?} */
    const res = {};
    forEach(params, (v, k) => res[k] = `${v}`);
    return res;
}
/**
 * @param {?} path
 * @param {?} params
 * @param {?} segment
 * @return {?}
 */
function compare(path, params, segment) {
    return path == segment.path && shallowEqual(params, segment.parameters);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlX3VybF90cmVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3NyYy9jcmVhdGVfdXJsX3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsY0FBYyxFQUFTLE1BQU0sVUFBVSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxVQUFVLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNoRSxPQUFPLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQzs7Ozs7Ozs7O0FBRS9ELE1BQU0sVUFBVSxhQUFhLENBQ3pCLEtBQXFCLEVBQUUsT0FBZ0IsRUFBRSxRQUFlLEVBQUUsV0FBbUIsRUFDN0UsUUFBZ0I7SUFDbEIsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN6QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUN6RTs7SUFFRCxNQUFNLEdBQUcsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV4QyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRTtRQUNoQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksZUFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ3hGOztJQUVELE1BQU0sZ0JBQWdCLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQzs7SUFFbkUsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbkQsMEJBQTBCLENBQ3RCLGdC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QUMsQ0FBTSxFQUFFLENBQVMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN4RCxPQUFPLEdBQUcsQ0FBQztDQUNaOzs7Ozs7O0FBRUQsU0FBUyxPQUFPLENBQUMsSUFBWSxFQUFFLE1BQTRCLEVBQUUsT0FBbUI7SUFDOUUsT0FBTyxJQUFJLElBQUksT0FBTyxDQUFDLElBQUksSUFBSSxZQUFZLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztDQUN6RSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBY3RpdmF0ZWRSb3V0ZX0gZnJvbSAnLi9yb3V0ZXJfc3RhdGUnO1xuaW1wb3J0IHtQUklNQVJZX09VVExFVCwgUGFyYW1zfSBmcm9tICcuL3NoYXJlZCc7XG5pbXBvcnQge1VybFNlZ21lbnQsIFVybFNlZ21lbnRHcm91cCwgVXJsVHJlZX0gZnJvbSAnLi91cmxfdHJlZSc7XG5pbXBvcnQge2ZvckVhY2gsIGxhc3QsIHNoYWxsb3dFcXVhbH0gZnJvbSAnLi91dGlscy9jb2xsZWN0aW9uJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVVybFRyZWUoXG4gICAgcm91dGU6IEFjdGl2YXRlZFJvdXRlLCB1cmxUcmVlOiBVcmxUcmVlLCBjb21tYW5kczogYW55W10sIHF1ZXJ5UGFyYW1zOiBQYXJhbXMsXG4gICAgZnJhZ21lbnQ6IHN0cmluZyk6IFVybFRyZWUge1xuICBpZiAoY29tbWFuZHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHRyZWUodXJsVHJlZS5yb290LCB1cmxUcmVlLnJvb3QsIHVybFRyZWUsIHF1ZXJ5UGFyYW1zLCBmcmFnbWVudCk7XG4gIH1cblxuICBjb25zdCBuYXYgPSBjb21wdXRlTmF2aWdhdGlvbihjb21tYW5kcyk7XG5cbiAgaWYgKG5hdi50b1Jvb3QoKSkge1xuICAgIHJldHVybiB0cmVlKHVybFRyZWUucm9vdCwgbmV3IFVybFNlZ21lbnRHcm91cChbXSwge30pLCB1cmxUcmVlLCBxdWVyeVBhcmFtcywgZnJhZ21lbnQpO1xuICB9XG5cbiAgY29uc3Qgc3RhcnRpbmdQb3NpdGlvbiA9IGZpbmRTdGFydGluZ1Bvc2l0aW9uKG5hdiwgdXJsVHJlZSwgcm91dGUpO1xuXG4gIGNvbnN0IHNlZ21lbnRHcm91cCA9IHN0YXJ0aW5nUG9zaXRpb24ucHJvY2Vzc0NoaWxkcmVuID9cbiAgICAgIHVwZGF0ZVNlZ21lbnRHcm91cENoaWxkcmVuKFxuICAgICAgICAgIHN0YXJ0aW5nUG9zaXRpb24uc2VnbWVudEdyb3VwLCBzdGFydGluZ1Bvc2l0aW9uLmluZGV4LCBuYXYuY29tbWFuZHMpIDpcbiAgICAgIHVwZGF0ZVNlZ21lbnRHcm91cChzdGFydGluZ1Bvc2l0aW9uLnNlZ21lbnRHcm91cCwgc3RhcnRpbmdQb3NpdGlvbi5pbmRleCwgbmF2LmNvbW1hbmRzKTtcbiAgcmV0dXJuIHRyZWUoc3RhcnRpbmdQb3NpdGlvbi5zZWdtZW50R3JvdXAsIHNlZ21lbnRHcm91cCwgdXJsVHJlZSwgcXVlcnlQYXJhbXMsIGZyYWdtZW50KTtcbn1cblxuZnVuY3Rpb24gaXNNYXRyaXhQYXJhbXMoY29tbWFuZDogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiB0eXBlb2YgY29tbWFuZCA9PT0gJ29iamVjdCcgJiYgY29tbWFuZCAhPSBudWxsICYmICFjb21tYW5kLm91dGxldHMgJiYgIWNvbW1hbmQuc2VnbWVudFBhdGg7XG59XG5cbmZ1bmN0aW9uIHRyZWUoXG4gICAgb2xkU2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIG5ld1NlZ21lbnRHcm91cDogVXJsU2VnbWVudEdyb3VwLCB1cmxUcmVlOiBVcmxUcmVlLFxuICAgIHF1ZXJ5UGFyYW1zOiBQYXJhbXMsIGZyYWdtZW50OiBzdHJpbmcpOiBVcmxUcmVlIHtcbiAgbGV0IHFwOiBhbnkgPSB7fTtcbiAgaWYgKHF1ZXJ5UGFyYW1zKSB7XG4gICAgZm9yRWFjaChxdWVyeVBhcmFtcywgKHZhbHVlOiBhbnksIG5hbWU6IGFueSkgPT4ge1xuICAgICAgcXBbbmFtZV0gPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlLm1hcCgodjogYW55KSA9PiBgJHt2fWApIDogYCR7dmFsdWV9YDtcbiAgICB9KTtcbiAgfVxuXG4gIGlmICh1cmxUcmVlLnJvb3QgPT09IG9sZFNlZ21lbnRHcm91cCkge1xuICAgIHJldHVybiBuZXcgVXJsVHJlZShuZXdTZWdtZW50R3JvdXAsIHFwLCBmcmFnbWVudCk7XG4gIH1cblxuICByZXR1cm4gbmV3IFVybFRyZWUocmVwbGFjZVNlZ21lbnQodXJsVHJlZS5yb290LCBvbGRTZWdtZW50R3JvdXAsIG5ld1NlZ21lbnRHcm91cCksIHFwLCBmcmFnbWVudCk7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VTZWdtZW50KFxuICAgIGN1cnJlbnQ6IFVybFNlZ21lbnRHcm91cCwgb2xkU2VnbWVudDogVXJsU2VnbWVudEdyb3VwLFxuICAgIG5ld1NlZ21lbnQ6IFVybFNlZ21lbnRHcm91cCk6IFVybFNlZ21lbnRHcm91cCB7XG4gIGNvbnN0IGNoaWxkcmVuOiB7W2tleTogc3RyaW5nXTogVXJsU2VnbWVudEdyb3VwfSA9IHt9O1xuICBmb3JFYWNoKGN1cnJlbnQuY2hpbGRyZW4sIChjOiBVcmxTZWdtZW50R3JvdXAsIG91dGxldE5hbWU6IHN0cmluZykgPT4ge1xuICAgIGlmIChjID09PSBvbGRTZWdtZW50KSB7XG4gICAgICBjaGlsZHJlbltvdXRsZXROYW1lXSA9IG5ld1NlZ21lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNoaWxkcmVuW291dGxldE5hbWVdID0gcmVwbGFjZVNlZ21lbnQoYywgb2xkU2VnbWVudCwgbmV3U2VnbWVudCk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG5ldyBVcmxTZWdtZW50R3JvdXAoY3VycmVudC5zZWdtZW50cywgY2hpbGRyZW4pO1xufVxuXG5jbGFzcyBOYXZpZ2F0aW9uIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgaXNBYnNvbHV0ZTogYm9vbGVhbiwgcHVibGljIG51bWJlck9mRG91YmxlRG90czogbnVtYmVyLCBwdWJsaWMgY29tbWFuZHM6IGFueVtdKSB7XG4gICAgaWYgKGlzQWJzb2x1dGUgJiYgY29tbWFuZHMubGVuZ3RoID4gMCAmJiBpc01hdHJpeFBhcmFtcyhjb21tYW5kc1swXSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9vdCBzZWdtZW50IGNhbm5vdCBoYXZlIG1hdHJpeCBwYXJhbWV0ZXJzJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY21kV2l0aE91dGxldCA9IGNvbW1hbmRzLmZpbmQoYyA9PiB0eXBlb2YgYyA9PT0gJ29iamVjdCcgJiYgYyAhPSBudWxsICYmIGMub3V0bGV0cyk7XG4gICAgaWYgKGNtZFdpdGhPdXRsZXQgJiYgY21kV2l0aE91dGxldCAhPT0gbGFzdChjb21tYW5kcykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigne291dGxldHM6e319IGhhcyB0byBiZSB0aGUgbGFzdCBjb21tYW5kJyk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHRvUm9vdCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc0Fic29sdXRlICYmIHRoaXMuY29tbWFuZHMubGVuZ3RoID09PSAxICYmIHRoaXMuY29tbWFuZHNbMF0gPT0gJy8nO1xuICB9XG59XG5cbi8qKiBUcmFuc2Zvcm1zIGNvbW1hbmRzIHRvIGEgbm9ybWFsaXplZCBgTmF2aWdhdGlvbmAgKi9cbmZ1bmN0aW9uIGNvbXB1dGVOYXZpZ2F0aW9uKGNvbW1hbmRzOiBhbnlbXSk6IE5hdmlnYXRpb24ge1xuICBpZiAoKHR5cGVvZiBjb21tYW5kc1swXSA9PT0gJ3N0cmluZycpICYmIGNvbW1hbmRzLmxlbmd0aCA9PT0gMSAmJiBjb21tYW5kc1swXSA9PT0gJy8nKSB7XG4gICAgcmV0dXJuIG5ldyBOYXZpZ2F0aW9uKHRydWUsIDAsIGNvbW1hbmRzKTtcbiAgfVxuXG4gIGxldCBudW1iZXJPZkRvdWJsZURvdHMgPSAwO1xuICBsZXQgaXNBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGNvbnN0IHJlczogYW55W10gPSBjb21tYW5kcy5yZWR1Y2UoKHJlcywgY21kLCBjbWRJZHgpID0+IHtcbiAgICBpZiAodHlwZW9mIGNtZCA9PT0gJ29iamVjdCcgJiYgY21kICE9IG51bGwpIHtcbiAgICAgIGlmIChjbWQub3V0bGV0cykge1xuICAgICAgICBjb25zdCBvdXRsZXRzOiB7W2s6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICAgICAgZm9yRWFjaChjbWQub3V0bGV0cywgKGNvbW1hbmRzOiBhbnksIG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIG91dGxldHNbbmFtZV0gPSB0eXBlb2YgY29tbWFuZHMgPT09ICdzdHJpbmcnID8gY29tbWFuZHMuc3BsaXQoJy8nKSA6IGNvbW1hbmRzO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIFsuLi5yZXMsIHtvdXRsZXRzfV07XG4gICAgICB9XG5cbiAgICAgIGlmIChjbWQuc2VnbWVudFBhdGgpIHtcbiAgICAgICAgcmV0dXJuIFsuLi5yZXMsIGNtZC5zZWdtZW50UGF0aF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCEodHlwZW9mIGNtZCA9PT0gJ3N0cmluZycpKSB7XG4gICAgICByZXR1cm4gWy4uLnJlcywgY21kXTtcbiAgICB9XG5cbiAgICBpZiAoY21kSWR4ID09PSAwKSB7XG4gICAgICBjbWQuc3BsaXQoJy8nKS5mb3JFYWNoKCh1cmxQYXJ0LCBwYXJ0SW5kZXgpID0+IHtcbiAgICAgICAgaWYgKHBhcnRJbmRleCA9PSAwICYmIHVybFBhcnQgPT09ICcuJykge1xuICAgICAgICAgIC8vIHNraXAgJy4vYSdcbiAgICAgICAgfSBlbHNlIGlmIChwYXJ0SW5kZXggPT0gMCAmJiB1cmxQYXJ0ID09PSAnJykgeyAgLy8gICcvYSdcbiAgICAgICAgICBpc0Fic29sdXRlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh1cmxQYXJ0ID09PSAnLi4nKSB7ICAvLyAgJy4uL2EnXG4gICAgICAgICAgbnVtYmVyT2ZEb3VibGVEb3RzKys7XG4gICAgICAgIH0gZWxzZSBpZiAodXJsUGFydCAhPSAnJykge1xuICAgICAgICAgIHJlcy5wdXNoKHVybFBhcnQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICByZXR1cm4gWy4uLnJlcywgY21kXTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiBuZXcgTmF2aWdhdGlvbihpc0Fic29sdXRlLCBudW1iZXJPZkRvdWJsZURvdHMsIHJlcyk7XG59XG5cbmNsYXNzIFBvc2l0aW9uIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIHB1YmxpYyBwcm9jZXNzQ2hpbGRyZW46IGJvb2xlYW4sIHB1YmxpYyBpbmRleDogbnVtYmVyKSB7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZFN0YXJ0aW5nUG9zaXRpb24obmF2OiBOYXZpZ2F0aW9uLCB0cmVlOiBVcmxUcmVlLCByb3V0ZTogQWN0aXZhdGVkUm91dGUpOiBQb3NpdGlvbiB7XG4gIGlmIChuYXYuaXNBYnNvbHV0ZSkge1xuICAgIHJldHVybiBuZXcgUG9zaXRpb24odHJlZS5yb290LCB0cnVlLCAwKTtcbiAgfVxuXG4gIGlmIChyb3V0ZS5zbmFwc2hvdC5fbGFzdFBhdGhJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gbmV3IFBvc2l0aW9uKHJvdXRlLnNuYXBzaG90Ll91cmxTZWdtZW50LCB0cnVlLCAwKTtcbiAgfVxuXG4gIGNvbnN0IG1vZGlmaWVyID0gaXNNYXRyaXhQYXJhbXMobmF2LmNvbW1hbmRzWzBdKSA/IDAgOiAxO1xuICBjb25zdCBpbmRleCA9IHJvdXRlLnNuYXBzaG90Ll9sYXN0UGF0aEluZGV4ICsgbW9kaWZpZXI7XG4gIHJldHVybiBjcmVhdGVQb3NpdGlvbkFwcGx5aW5nRG91YmxlRG90cyhcbiAgICAgIHJvdXRlLnNuYXBzaG90Ll91cmxTZWdtZW50LCBpbmRleCwgbmF2Lm51bWJlck9mRG91YmxlRG90cyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVBvc2l0aW9uQXBwbHlpbmdEb3VibGVEb3RzKFxuICAgIGdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIGluZGV4OiBudW1iZXIsIG51bWJlck9mRG91YmxlRG90czogbnVtYmVyKTogUG9zaXRpb24ge1xuICBsZXQgZyA9IGdyb3VwO1xuICBsZXQgY2kgPSBpbmRleDtcbiAgbGV0IGRkID0gbnVtYmVyT2ZEb3VibGVEb3RzO1xuICB3aGlsZSAoZGQgPiBjaSkge1xuICAgIGRkIC09IGNpO1xuICAgIGcgPSBnLnBhcmVudCAhO1xuICAgIGlmICghZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG51bWJlciBvZiBcXCcuLi9cXCcnKTtcbiAgICB9XG4gICAgY2kgPSBnLnNlZ21lbnRzLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gbmV3IFBvc2l0aW9uKGcsIGZhbHNlLCBjaSAtIGRkKTtcbn1cblxuZnVuY3Rpb24gZ2V0UGF0aChjb21tYW5kOiBhbnkpOiBhbnkge1xuICBpZiAodHlwZW9mIGNvbW1hbmQgPT09ICdvYmplY3QnICYmIGNvbW1hbmQgIT0gbnVsbCAmJiBjb21tYW5kLm91dGxldHMpIHtcbiAgICByZXR1cm4gY29tbWFuZC5vdXRsZXRzW1BSSU1BUllfT1VUTEVUXTtcbiAgfVxuICByZXR1cm4gYCR7Y29tbWFuZH1gO1xufVxuXG5mdW5jdGlvbiBnZXRPdXRsZXRzKGNvbW1hbmRzOiBhbnlbXSk6IHtbazogc3RyaW5nXTogYW55W119IHtcbiAgaWYgKCEodHlwZW9mIGNvbW1hbmRzWzBdID09PSAnb2JqZWN0JykpIHJldHVybiB7W1BSSU1BUllfT1VUTEVUXTogY29tbWFuZHN9O1xuICBpZiAoY29tbWFuZHNbMF0ub3V0bGV0cyA9PT0gdW5kZWZpbmVkKSByZXR1cm4ge1tQUklNQVJZX09VVExFVF06IGNvbW1hbmRzfTtcbiAgcmV0dXJuIGNvbW1hbmRzWzBdLm91dGxldHM7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVNlZ21lbnRHcm91cChcbiAgICBzZWdtZW50R3JvdXA6IFVybFNlZ21lbnRHcm91cCwgc3RhcnRJbmRleDogbnVtYmVyLCBjb21tYW5kczogYW55W10pOiBVcmxTZWdtZW50R3JvdXAge1xuICBpZiAoIXNlZ21lbnRHcm91cCkge1xuICAgIHNlZ21lbnRHcm91cCA9IG5ldyBVcmxTZWdtZW50R3JvdXAoW10sIHt9KTtcbiAgfVxuICBpZiAoc2VnbWVudEdyb3VwLnNlZ21lbnRzLmxlbmd0aCA9PT0gMCAmJiBzZWdtZW50R3JvdXAuaGFzQ2hpbGRyZW4oKSkge1xuICAgIHJldHVybiB1cGRhdGVTZWdtZW50R3JvdXBDaGlsZHJlbihzZWdtZW50R3JvdXAsIHN0YXJ0SW5kZXgsIGNvbW1hbmRzKTtcbiAgfVxuXG4gIGNvbnN0IG0gPSBwcmVmaXhlZFdpdGgoc2VnbWVudEdyb3VwLCBzdGFydEluZGV4LCBjb21tYW5kcyk7XG4gIGNvbnN0IHNsaWNlZENvbW1hbmRzID0gY29tbWFuZHMuc2xpY2UobS5jb21tYW5kSW5kZXgpO1xuICBpZiAobS5tYXRjaCAmJiBtLnBhdGhJbmRleCA8IHNlZ21lbnRHcm91cC5zZWdtZW50cy5sZW5ndGgpIHtcbiAgICBjb25zdCBnID0gbmV3IFVybFNlZ21lbnRHcm91cChzZWdtZW50R3JvdXAuc2VnbWVudHMuc2xpY2UoMCwgbS5wYXRoSW5kZXgpLCB7fSk7XG4gICAgZy5jaGlsZHJlbltQUklNQVJZX09VVExFVF0gPVxuICAgICAgICBuZXcgVXJsU2VnbWVudEdyb3VwKHNlZ21lbnRHcm91cC5zZWdtZW50cy5zbGljZShtLnBhdGhJbmRleCksIHNlZ21lbnRHcm91cC5jaGlsZHJlbik7XG4gICAgcmV0dXJuIHVwZGF0ZVNlZ21lbnRHcm91cENoaWxkcmVuKGcsIDAsIHNsaWNlZENvbW1hbmRzKTtcbiAgfSBlbHNlIGlmIChtLm1hdGNoICYmIHNsaWNlZENvbW1hbmRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgVXJsU2VnbWVudEdyb3VwKHNlZ21lbnRHcm91cC5zZWdtZW50cywge30pO1xuICB9IGVsc2UgaWYgKG0ubWF0Y2ggJiYgIXNlZ21lbnRHcm91cC5oYXNDaGlsZHJlbigpKSB7XG4gICAgcmV0dXJuIGNyZWF0ZU5ld1NlZ21lbnRHcm91cChzZWdtZW50R3JvdXAsIHN0YXJ0SW5kZXgsIGNvbW1hbmRzKTtcbiAgfSBlbHNlIGlmIChtLm1hdGNoKSB7XG4gICAgcmV0dXJuIHVwZGF0ZVNlZ21lbnRHcm91cENoaWxkcmVuKHNlZ21lbnRHcm91cCwgMCwgc2xpY2VkQ29tbWFuZHMpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjcmVhdGVOZXdTZWdtZW50R3JvdXAoc2VnbWVudEdyb3VwLCBzdGFydEluZGV4LCBjb21tYW5kcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlU2VnbWVudEdyb3VwQ2hpbGRyZW4oXG4gICAgc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIHN0YXJ0SW5kZXg6IG51bWJlciwgY29tbWFuZHM6IGFueVtdKTogVXJsU2VnbWVudEdyb3VwIHtcbiAgaWYgKGNvbW1hbmRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgVXJsU2VnbWVudEdyb3VwKHNlZ21lbnRHcm91cC5zZWdtZW50cywge30pO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IG91dGxldHMgPSBnZXRPdXRsZXRzKGNvbW1hbmRzKTtcbiAgICBjb25zdCBjaGlsZHJlbjoge1trZXk6IHN0cmluZ106IFVybFNlZ21lbnRHcm91cH0gPSB7fTtcblxuICAgIGZvckVhY2gob3V0bGV0cywgKGNvbW1hbmRzOiBhbnksIG91dGxldDogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoY29tbWFuZHMgIT09IG51bGwpIHtcbiAgICAgICAgY2hpbGRyZW5bb3V0bGV0XSA9IHVwZGF0ZVNlZ21lbnRHcm91cChzZWdtZW50R3JvdXAuY2hpbGRyZW5bb3V0bGV0XSwgc3RhcnRJbmRleCwgY29tbWFuZHMpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZm9yRWFjaChzZWdtZW50R3JvdXAuY2hpbGRyZW4sIChjaGlsZDogVXJsU2VnbWVudEdyb3VwLCBjaGlsZE91dGxldDogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAob3V0bGV0c1tjaGlsZE91dGxldF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjaGlsZHJlbltjaGlsZE91dGxldF0gPSBjaGlsZDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFVybFNlZ21lbnRHcm91cChzZWdtZW50R3JvdXAuc2VnbWVudHMsIGNoaWxkcmVuKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwcmVmaXhlZFdpdGgoc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIHN0YXJ0SW5kZXg6IG51bWJlciwgY29tbWFuZHM6IGFueVtdKSB7XG4gIGxldCBjdXJyZW50Q29tbWFuZEluZGV4ID0gMDtcbiAgbGV0IGN1cnJlbnRQYXRoSW5kZXggPSBzdGFydEluZGV4O1xuXG4gIGNvbnN0IG5vTWF0Y2ggPSB7bWF0Y2g6IGZhbHNlLCBwYXRoSW5kZXg6IDAsIGNvbW1hbmRJbmRleDogMH07XG4gIHdoaWxlIChjdXJyZW50UGF0aEluZGV4IDwgc2VnbWVudEdyb3VwLnNlZ21lbnRzLmxlbmd0aCkge1xuICAgIGlmIChjdXJyZW50Q29tbWFuZEluZGV4ID49IGNvbW1hbmRzLmxlbmd0aCkgcmV0dXJuIG5vTWF0Y2g7XG4gICAgY29uc3QgcGF0aCA9IHNlZ21lbnRHcm91cC5zZWdtZW50c1tjdXJyZW50UGF0aEluZGV4XTtcbiAgICBjb25zdCBjdXJyID0gZ2V0UGF0aChjb21tYW5kc1tjdXJyZW50Q29tbWFuZEluZGV4XSk7XG4gICAgY29uc3QgbmV4dCA9XG4gICAgICAgIGN1cnJlbnRDb21tYW5kSW5kZXggPCBjb21tYW5kcy5sZW5ndGggLSAxID8gY29tbWFuZHNbY3VycmVudENvbW1hbmRJbmRleCArIDFdIDogbnVsbDtcblxuICAgIGlmIChjdXJyZW50UGF0aEluZGV4ID4gMCAmJiBjdXJyID09PSB1bmRlZmluZWQpIGJyZWFrO1xuXG4gICAgaWYgKGN1cnIgJiYgbmV4dCAmJiAodHlwZW9mIG5leHQgPT09ICdvYmplY3QnKSAmJiBuZXh0Lm91dGxldHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKCFjb21wYXJlKGN1cnIsIG5leHQsIHBhdGgpKSByZXR1cm4gbm9NYXRjaDtcbiAgICAgIGN1cnJlbnRDb21tYW5kSW5kZXggKz0gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFjb21wYXJlKGN1cnIsIHt9LCBwYXRoKSkgcmV0dXJuIG5vTWF0Y2g7XG4gICAgICBjdXJyZW50Q29tbWFuZEluZGV4Kys7XG4gICAgfVxuICAgIGN1cnJlbnRQYXRoSW5kZXgrKztcbiAgfVxuXG4gIHJldHVybiB7bWF0Y2g6IHRydWUsIHBhdGhJbmRleDogY3VycmVudFBhdGhJbmRleCwgY29tbWFuZEluZGV4OiBjdXJyZW50Q29tbWFuZEluZGV4fTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTmV3U2VnbWVudEdyb3VwKFxuICAgIHNlZ21lbnRHcm91cDogVXJsU2VnbWVudEdyb3VwLCBzdGFydEluZGV4OiBudW1iZXIsIGNvbW1hbmRzOiBhbnlbXSk6IFVybFNlZ21lbnRHcm91cCB7XG4gIGNvbnN0IHBhdGhzID0gc2VnbWVudEdyb3VwLnNlZ21lbnRzLnNsaWNlKDAsIHN0YXJ0SW5kZXgpO1xuXG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBjb21tYW5kcy5sZW5ndGgpIHtcbiAgICBpZiAodHlwZW9mIGNvbW1hbmRzW2ldID09PSAnb2JqZWN0JyAmJiBjb21tYW5kc1tpXS5vdXRsZXRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gY3JlYXRlTmV3U2VnbWVudENoaWxkcmVuKGNvbW1hbmRzW2ldLm91dGxldHMpO1xuICAgICAgcmV0dXJuIG5ldyBVcmxTZWdtZW50R3JvdXAocGF0aHMsIGNoaWxkcmVuKTtcbiAgICB9XG5cbiAgICAvLyBpZiB3ZSBzdGFydCB3aXRoIGFuIG9iamVjdCBsaXRlcmFsLCB3ZSBuZWVkIHRvIHJldXNlIHRoZSBwYXRoIHBhcnQgZnJvbSB0aGUgc2VnbWVudFxuICAgIGlmIChpID09PSAwICYmIGlzTWF0cml4UGFyYW1zKGNvbW1hbmRzWzBdKSkge1xuICAgICAgY29uc3QgcCA9IHNlZ21lbnRHcm91cC5zZWdtZW50c1tzdGFydEluZGV4XTtcbiAgICAgIHBhdGhzLnB1c2gobmV3IFVybFNlZ21lbnQocC5wYXRoLCBjb21tYW5kc1swXSkpO1xuICAgICAgaSsrO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgY3VyciA9IGdldFBhdGgoY29tbWFuZHNbaV0pO1xuICAgIGNvbnN0IG5leHQgPSAoaSA8IGNvbW1hbmRzLmxlbmd0aCAtIDEpID8gY29tbWFuZHNbaSArIDFdIDogbnVsbDtcbiAgICBpZiAoY3VyciAmJiBuZXh0ICYmIGlzTWF0cml4UGFyYW1zKG5leHQpKSB7XG4gICAgICBwYXRocy5wdXNoKG5ldyBVcmxTZWdtZW50KGN1cnIsIHN0cmluZ2lmeShuZXh0KSkpO1xuICAgICAgaSArPSAyO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXRocy5wdXNoKG5ldyBVcmxTZWdtZW50KGN1cnIsIHt9KSk7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG4gIHJldHVybiBuZXcgVXJsU2VnbWVudEdyb3VwKHBhdGhzLCB7fSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU5ld1NlZ21lbnRDaGlsZHJlbihvdXRsZXRzOiB7W25hbWU6IHN0cmluZ106IGFueX0pOiBhbnkge1xuICBjb25zdCBjaGlsZHJlbjoge1trZXk6IHN0cmluZ106IFVybFNlZ21lbnRHcm91cH0gPSB7fTtcbiAgZm9yRWFjaChvdXRsZXRzLCAoY29tbWFuZHM6IGFueSwgb3V0bGV0OiBzdHJpbmcpID0+IHtcbiAgICBpZiAoY29tbWFuZHMgIT09IG51bGwpIHtcbiAgICAgIGNoaWxkcmVuW291dGxldF0gPSBjcmVhdGVOZXdTZWdtZW50R3JvdXAobmV3IFVybFNlZ21lbnRHcm91cChbXSwge30pLCAwLCBjb21tYW5kcyk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGNoaWxkcmVuO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnkocGFyYW1zOiB7W2tleTogc3RyaW5nXTogYW55fSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgY29uc3QgcmVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICBmb3JFYWNoKHBhcmFtcywgKHY6IGFueSwgazogc3RyaW5nKSA9PiByZXNba10gPSBgJHt2fWApO1xuICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBjb21wYXJlKHBhdGg6IHN0cmluZywgcGFyYW1zOiB7W2tleTogc3RyaW5nXTogYW55fSwgc2VnbWVudDogVXJsU2VnbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gcGF0aCA9PSBzZWdtZW50LnBhdGggJiYgc2hhbGxvd0VxdWFsKHBhcmFtcywgc2VnbWVudC5wYXJhbWV0ZXJzKTtcbn1cbiJdfQ==