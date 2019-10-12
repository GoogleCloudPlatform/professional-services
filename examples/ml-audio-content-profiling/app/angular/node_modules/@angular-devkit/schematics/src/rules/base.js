"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const exception_1 = require("../exception/exception");
const filtered_1 = require("../tree/filtered");
const host_tree_1 = require("../tree/host-tree");
const interface_1 = require("../tree/interface");
const static_1 = require("../tree/static");
const virtual_1 = require("../tree/virtual");
const call_1 = require("./call");
/**
 * A Source that returns an tree as its single value.
 */
function source(tree) {
    return () => tree;
}
exports.source = source;
/**
 * A source that returns an empty tree.
 */
function empty() {
    return () => static_1.empty();
}
exports.empty = empty;
/**
 * Chain multiple rules into a single rule.
 */
function chain(rules) {
    return (tree, context) => {
        return rules.reduce((acc, curr) => {
            return call_1.callRule(curr, acc, context);
        }, rxjs_1.of(tree));
    };
}
exports.chain = chain;
/**
 * Apply multiple rules to a source, and returns the source transformed.
 */
function apply(source, rules) {
    return (context) => {
        return call_1.callRule(chain([
            ...rules,
            // Optimize the tree. Since this is a source tree, there's not much harm here and this might
            // avoid further issues.
            tree => {
                if (tree instanceof virtual_1.VirtualTree) {
                    tree.optimize();
                    return tree;
                }
                else if (tree.actions.length != 0) {
                    return static_1.optimize(tree);
                }
                else {
                    return tree;
                }
            },
        ]), call_1.callSource(source, context), context);
    };
}
exports.apply = apply;
/**
 * Merge an input tree with the source passed in.
 */
function mergeWith(source, strategy = interface_1.MergeStrategy.Default) {
    return (tree, context) => {
        const result = call_1.callSource(source, context);
        return result.pipe(operators_1.map(other => static_1.merge(tree, other, strategy || context.strategy)));
    };
}
exports.mergeWith = mergeWith;
function noop() {
    return (tree, _context) => tree;
}
exports.noop = noop;
function filter(predicate) {
    return ((tree) => {
        // TODO: Remove VirtualTree usage in 7.0
        if (virtual_1.VirtualTree.isVirtualTree(tree)) {
            return new filtered_1.FilteredTree(tree, predicate);
        }
        else if (host_tree_1.HostTree.isHostTree(tree)) {
            return new host_tree_1.FilterHostTree(tree, predicate);
        }
        else {
            throw new exception_1.SchematicsException('Tree type is not supported.');
        }
    });
}
exports.filter = filter;
function asSource(rule) {
    return apply(empty(), [rule]);
}
exports.asSource = asSource;
function branchAndMerge(rule, strategy = interface_1.MergeStrategy.Default) {
    return (tree, context) => {
        const branchedTree = static_1.branch(tree);
        return call_1.callRule(rule, rxjs_1.of(branchedTree), context)
            .pipe(operators_1.last(), operators_1.map(t => static_1.merge(tree, t, strategy)));
    };
}
exports.branchAndMerge = branchAndMerge;
function when(predicate, operator) {
    return (entry) => {
        if (predicate(entry.path, entry)) {
            return operator(entry);
        }
        else {
            return entry;
        }
    };
}
exports.when = when;
function partitionApplyMerge(predicate, ruleYes, ruleNo) {
    return (tree, context) => {
        const [yes, no] = static_1.partition(tree, predicate);
        if (!ruleNo) {
            // Shortcut.
            return call_1.callRule(ruleYes, rxjs_1.of(static_1.partition(tree, predicate)[0]), context)
                .pipe(operators_1.map(yesTree => static_1.merge(yesTree, no, context.strategy)));
        }
        return call_1.callRule(ruleYes, rxjs_1.of(yes), context)
            .pipe(operators_1.concatMap(yesTree => {
            return call_1.callRule(ruleNo, rxjs_1.of(no), context)
                .pipe(operators_1.map(noTree => static_1.merge(yesTree, noTree, context.strategy)));
        }));
    };
}
exports.partitionApplyMerge = partitionApplyMerge;
function forEach(operator) {
    return (tree) => {
        tree.visit((path, entry) => {
            if (!entry) {
                return;
            }
            const newEntry = operator(entry);
            if (newEntry === entry) {
                return;
            }
            if (newEntry === null) {
                tree.delete(path);
                return;
            }
            if (newEntry.path != path) {
                tree.rename(path, newEntry.path);
            }
            if (!newEntry.content.equals(entry.content)) {
                tree.overwrite(newEntry.path, newEntry.content);
            }
        });
        return tree;
    };
}
exports.forEach = forEach;
function composeFileOperators(operators) {
    return (entry) => {
        let current = entry;
        for (const op of operators) {
            current = op(current);
            if (current === null) {
                // Deleted, just return.
                return null;
            }
        }
        return current;
    };
}
exports.composeFileOperators = composeFileOperators;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvcnVsZXMvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtCQUFzRDtBQUN0RCw4Q0FBc0Q7QUFFdEQsc0RBQTZEO0FBQzdELCtDQUFnRDtBQUNoRCxpREFBNkQ7QUFDN0QsaURBQWtGO0FBQ2xGLDJDQU13QjtBQUN4Qiw2Q0FBOEM7QUFDOUMsaUNBQThDO0FBRzlDOztHQUVHO0FBQ0gsU0FBZ0IsTUFBTSxDQUFDLElBQVU7SUFDL0IsT0FBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7QUFDcEIsQ0FBQztBQUZELHdCQUVDO0FBR0Q7O0dBRUc7QUFDSCxTQUFnQixLQUFLO0lBQ25CLE9BQU8sR0FBRyxFQUFFLENBQUMsY0FBVyxFQUFFLENBQUM7QUFDN0IsQ0FBQztBQUZELHNCQUVDO0FBR0Q7O0dBRUc7QUFDSCxTQUFnQixLQUFLLENBQUMsS0FBYTtJQUNqQyxPQUFPLENBQUMsSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUMvQyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFxQixFQUFFLElBQVUsRUFBRSxFQUFFO1lBQ3hELE9BQU8sZUFBUSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxFQUFFLFNBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLENBQUMsQ0FBQztBQUNKLENBQUM7QUFORCxzQkFNQztBQUdEOztHQUVHO0FBQ0gsU0FBZ0IsS0FBSyxDQUFDLE1BQWMsRUFBRSxLQUFhO0lBQ2pELE9BQU8sQ0FBQyxPQUF5QixFQUFFLEVBQUU7UUFDbkMsT0FBTyxlQUFRLENBQUMsS0FBSyxDQUFDO1lBQ3BCLEdBQUcsS0FBSztZQUNSLDRGQUE0RjtZQUM1Rix3QkFBd0I7WUFDeEIsSUFBSSxD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Q0osQ0FBQztBQWRELG9EQWNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAsIGxhc3QsIG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IEZpbGVPcGVyYXRvciwgUnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU291cmNlIH0gZnJvbSAnLi4vZW5naW5lL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBTY2hlbWF0aWNzRXhjZXB0aW9uIH0gZnJvbSAnLi4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBGaWx0ZXJlZFRyZWUgfSBmcm9tICcuLi90cmVlL2ZpbHRlcmVkJztcbmltcG9ydCB7IEZpbHRlckhvc3RUcmVlLCBIb3N0VHJlZSB9IGZyb20gJy4uL3RyZWUvaG9zdC10cmVlJztcbmltcG9ydCB7IEZpbGVFbnRyeSwgRmlsZVByZWRpY2F0ZSwgTWVyZ2VTdHJhdGVneSwgVHJlZSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7XG4gIGJyYW5jaCxcbiAgZW1wdHkgYXMgc3RhdGljRW1wdHksXG4gIG1lcmdlIGFzIHN0YXRpY01lcmdlLFxuICBvcHRpbWl6ZSBhcyBzdGF0aWNPcHRpbWl6ZSxcbiAgcGFydGl0aW9uIGFzIHN0YXRpY1BhcnRpdGlvbixcbn0gZnJvbSAnLi4vdHJlZS9zdGF0aWMnO1xuaW1wb3J0IHsgVmlydHVhbFRyZWUgfSBmcm9tICcuLi90cmVlL3ZpcnR1YWwnO1xuaW1wb3J0IHsgY2FsbFJ1bGUsIGNhbGxTb3VyY2UgfSBmcm9tICcuL2NhbGwnO1xuXG5cbi8qKlxuICogQSBTb3VyY2UgdGhhdCByZXR1cm5zIGFuIHRyZWUgYXMgaXRzIHNpbmdsZSB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNvdXJjZSh0cmVlOiBUcmVlKTogU291cmNlIHtcbiAgcmV0dXJuICgpID0+IHRyZWU7XG59XG5cblxuLyoqXG4gKiBBIHNvdXJjZSB0aGF0IHJldHVybnMgYW4gZW1wdHkgdHJlZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtcHR5KCk6IFNvdXJjZSB7XG4gIHJldHVybiAoKSA9PiBzdGF0aWNFbXB0eSgpO1xufVxuXG5cbi8qKlxuICogQ2hhaW4gbXVsdGlwbGUgcnVsZXMgaW50byBhIHNpbmdsZSBydWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hhaW4ocnVsZXM6IFJ1bGVbXSk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICByZXR1cm4gcnVsZXMucmVkdWNlKChhY2M6IE9ic2VydmFibGU8VHJlZT4sIGN1cnI6IFJ1bGUpID0+IHtcbiAgICAgIHJldHVybiBjYWxsUnVsZShjdXJyLCBhY2MsIGNvbnRleHQpO1xuICAgIH0sIG9ic2VydmFibGVPZih0cmVlKSk7XG4gIH07XG59XG5cblxuLyoqXG4gKiBBcHBseSBtdWx0aXBsZSBydWxlcyB0byBhIHNvdXJjZSwgYW5kIHJldHVybnMgdGhlIHNvdXJjZSB0cmFuc2Zvcm1lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5KHNvdXJjZTogU291cmNlLCBydWxlczogUnVsZVtdKTogU291cmNlIHtcbiAgcmV0dXJuIChjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgcmV0dXJuIGNhbGxSdWxlKGNoYWluKFtcbiAgICAgIC4uLnJ1bGVzLFxuICAgICAgLy8gT3B0aW1pemUgdGhlIHRyZWUuIFNpbmNlIHRoaXMgaXMgYSBzb3VyY2UgdHJlZSwgdGhlcmUncyBub3QgbXVjaCBoYXJtIGhlcmUgYW5kIHRoaXMgbWlnaHRcbiAgICAgIC8vIGF2b2lkIGZ1cnRoZXIgaXNzdWVzLlxuICAgICAgdHJlZSA9PiB7XG4gICAgICAgIGlmICh0cmVlIGluc3RhbmNlb2YgVmlydHVhbFRyZWUpIHtcbiAgICAgICAgICB0cmVlLm9wdGltaXplKCk7XG5cbiAgICAgICAgICByZXR1cm4gdHJlZTtcbiAgICAgICAgfSBlbHNlIGlmICh0cmVlLmFjdGlvbnMubGVuZ3RoICE9IDApIHtcbiAgICAgICAgICByZXR1cm4gc3RhdGljT3B0aW1pemUodHJlZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgXSksIGNhbGxTb3VyY2Uoc291cmNlLCBjb250ZXh0KSwgY29udGV4dCk7XG4gIH07XG59XG5cblxuLyoqXG4gKiBNZXJnZSBhbiBpbnB1dCB0cmVlIHdpdGggdGhlIHNvdXJjZSBwYXNzZWQgaW4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVdpdGgoc291cmNlOiBTb3VyY2UsIHN0cmF0ZWd5OiBNZXJnZVN0cmF0ZWd5ID0gTWVyZ2VTdHJhdGVneS5EZWZhdWx0KTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxTb3VyY2Uoc291cmNlLCBjb250ZXh0KTtcblxuICAgIHJldHVybiByZXN1bHQucGlwZShtYXAob3RoZXIgPT4gc3RhdGljTWVyZ2UodHJlZSwgb3RoZXIsIHN0cmF0ZWd5IHx8IGNvbnRleHQuc3RyYXRlZ3kpKSk7XG4gIH07XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIG5vb3AoKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgX2NvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHRyZWU7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlcihwcmVkaWNhdGU6IEZpbGVQcmVkaWNhdGU8Ym9vbGVhbj4pOiBSdWxlIHtcbiAgcmV0dXJuICgodHJlZTogVHJlZSkgPT4ge1xuICAgIC8vIFRPRE86IFJlbW92ZSBWaXJ0dWFsVHJlZSB1c2FnZSBpbiA3LjBcbiAgICBpZiAoVmlydHVhbFRyZWUuaXNWaXJ0dWFsVHJlZSh0cmVlKSkge1xuICAgICAgcmV0dXJuIG5ldyBGaWx0ZXJlZFRyZWUodHJlZSwgcHJlZGljYXRlKTtcbiAgICB9IGVsc2UgaWYgKEhvc3RUcmVlLmlzSG9zdFRyZWUodHJlZSkpIHtcbiAgICAgIHJldHVybiBuZXcgRmlsdGVySG9zdFRyZWUodHJlZSwgcHJlZGljYXRlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ1RyZWUgdHlwZSBpcyBub3Qgc3VwcG9ydGVkLicpO1xuICAgIH1cbiAgfSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGFzU291cmNlKHJ1bGU6IFJ1bGUpOiBTb3VyY2Uge1xuICByZXR1cm4gYXBwbHkoZW1wdHkoKSwgW3J1bGVdKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYnJhbmNoQW5kTWVyZ2UocnVsZTogUnVsZSwgc3RyYXRlZ3kgPSBNZXJnZVN0cmF0ZWd5LkRlZmF1bHQpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgYnJhbmNoZWRUcmVlID0gYnJhbmNoKHRyZWUpO1xuXG4gICAgcmV0dXJuIGNhbGxSdWxlKHJ1bGUsIG9ic2VydmFibGVPZihicmFuY2hlZFRyZWUpLCBjb250ZXh0KVxuICAgICAgLnBpcGUoXG4gICAgICAgIGxhc3QoKSxcbiAgICAgICAgbWFwKHQgPT4gc3RhdGljTWVyZ2UodHJlZSwgdCwgc3RyYXRlZ3kpKSxcbiAgICAgICk7XG4gIH07XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHdoZW4ocHJlZGljYXRlOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+LCBvcGVyYXRvcjogRmlsZU9wZXJhdG9yKTogRmlsZU9wZXJhdG9yIHtcbiAgcmV0dXJuIChlbnRyeTogRmlsZUVudHJ5KSA9PiB7XG4gICAgaWYgKHByZWRpY2F0ZShlbnRyeS5wYXRoLCBlbnRyeSkpIHtcbiAgICAgIHJldHVybiBvcGVyYXRvcihlbnRyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBlbnRyeTtcbiAgICB9XG4gIH07XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnRpdGlvbkFwcGx5TWVyZ2UoXG4gIHByZWRpY2F0ZTogRmlsZVByZWRpY2F0ZTxib29sZWFuPixcbiAgcnVsZVllczogUnVsZSxcbiAgcnVsZU5vPzogUnVsZSxcbik6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBbeWVzLCBub10gPSBzdGF0aWNQYXJ0aXRpb24odHJlZSwgcHJlZGljYXRlKTtcblxuICAgIGlmICghcnVsZU5vKSB7XG4gICAgICAvLyBTaG9ydGN1dC5cbiAgICAgIHJldHVybiBjYWxsUnVsZShydWxlWWVzLCBvYnNlcnZhYmxlT2Yoc3RhdGljUGFydGl0aW9uKHRyZWUsIHByZWRpY2F0ZSlbMF0pLCBjb250ZXh0KVxuICAgICAgICAucGlwZShtYXAoeWVzVHJlZSA9PiBzdGF0aWNNZXJnZSh5ZXNUcmVlLCBubywgY29udGV4dC5zdHJhdGVneSkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2FsbFJ1bGUocnVsZVllcywgb2JzZXJ2YWJsZU9mKHllcyksIGNvbnRleHQpXG4gICAgICAucGlwZShjb25jYXRNYXAoeWVzVHJlZSA9PiB7XG4gICAgICAgIHJldHVybiBjYWxsUnVsZShydWxlTm8sIG9ic2VydmFibGVPZihubyksIGNvbnRleHQpXG4gICAgICAgICAgLnBpcGUobWFwKG5vVHJlZSA9PiBzdGF0aWNNZXJnZSh5ZXNUcmVlLCBub1RyZWUsIGNvbnRleHQuc3RyYXRlZ3kpKSk7XG4gICAgICB9KSk7XG4gIH07XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGZvckVhY2gob3BlcmF0b3I6IEZpbGVPcGVyYXRvcik6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUpID0+IHtcbiAgICB0cmVlLnZpc2l0KChwYXRoLCBlbnRyeSkgPT4ge1xuICAgICAgaWYgKCFlbnRyeSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBuZXdFbnRyeSA9IG9wZXJhdG9yKGVudHJ5KTtcbiAgICAgIGlmIChuZXdFbnRyeSA9PT0gZW50cnkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKG5ld0VudHJ5ID09PSBudWxsKSB7XG4gICAgICAgIHRyZWUuZGVsZXRlKHBhdGgpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChuZXdFbnRyeS5wYXRoICE9IHBhdGgpIHtcbiAgICAgICAgdHJlZS5yZW5hbWUocGF0aCwgbmV3RW50cnkucGF0aCk7XG4gICAgICB9XG4gICAgICBpZiAoIW5ld0VudHJ5LmNvbnRlbnQuZXF1YWxzKGVudHJ5LmNvbnRlbnQpKSB7XG4gICAgICAgIHRyZWUub3ZlcndyaXRlKG5ld0VudHJ5LnBhdGgsIG5ld0VudHJ5LmNvbnRlbnQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRyZWU7XG4gIH07XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvc2VGaWxlT3BlcmF0b3JzKG9wZXJhdG9yczogRmlsZU9wZXJhdG9yW10pOiBGaWxlT3BlcmF0b3Ige1xuICByZXR1cm4gKGVudHJ5OiBGaWxlRW50cnkpID0+IHtcbiAgICBsZXQgY3VycmVudDogRmlsZUVudHJ5IHwgbnVsbCA9IGVudHJ5O1xuICAgIGZvciAoY29uc3Qgb3Agb2Ygb3BlcmF0b3JzKSB7XG4gICAgICBjdXJyZW50ID0gb3AoY3VycmVudCk7XG5cbiAgICAgIGlmIChjdXJyZW50ID09PSBudWxsKSB7XG4gICAgICAgIC8vIERlbGV0ZWQsIGp1c3QgcmV0dXJuLlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY3VycmVudDtcbiAgfTtcbn1cbiJdfQ==