"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const exception_1 = require("../exception/exception");
const filtered_1 = require("./filtered");
const host_tree_1 = require("./host-tree");
const interface_1 = require("./interface");
const virtual_1 = require("./virtual");
function empty() {
    return new host_tree_1.HostTree();
}
exports.empty = empty;
function branch(tree) {
    // TODO: Remove VirtualTree usage in 7.0
    if (tree instanceof virtual_1.VirtualTree) {
        return virtual_1.VirtualTree.branch(tree);
    }
    return tree.branch();
}
exports.branch = branch;
function merge(tree, other, strategy = interface_1.MergeStrategy.Default) {
    // TODO: Remove VirtualTree usage in 7.0
    if (tree instanceof virtual_1.VirtualTree) {
        return virtual_1.VirtualTree.merge(tree, other, strategy);
    }
    tree.merge(other, strategy);
    return tree;
}
exports.merge = merge;
function partition(tree, predicate) {
    // TODO: Remove VirtualTree usage in 7.0
    if (tree instanceof virtual_1.VirtualTree) {
        return [
            new filtered_1.FilteredTree(tree, predicate),
            new filtered_1.FilteredTree(tree, (path, entry) => !predicate(path, entry)),
        ];
    }
    else if (tree instanceof host_tree_1.HostTree) {
        return [
            new host_tree_1.FilterHostTree(tree, predicate),
            new host_tree_1.FilterHostTree(tree, (path, entry) => !predicate(path, entry)),
        ];
    }
    else {
        throw new exception_1.SchematicsException('Tree type is not supported.');
    }
}
exports.partition = partition;
function optimize(tree) {
    // TODO: Remove VirtualTree usage in 7.0
    if (tree instanceof virtual_1.VirtualTree) {
        return virtual_1.VirtualTree.optimize(tree);
    }
    return tree;
}
exports.optimize = optimize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy90cmVlL3N0YXRpYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILHNEQUE2RDtBQUM3RCx5Q0FBMEM7QUFDMUMsMkNBQXVEO0FBQ3ZELDJDQUFpRTtBQUNqRSx1Q0FBd0M7QUFHeEMsU0FBZ0IsS0FBSztJQUNuQixPQUFPLElBQUksb0JBQVEsRUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFGRCxzQkFFQztBQUVELFNBQWdCLE1BQU0sQ0FBQyxJQUFVO0lBQy9CLHdDQUF3QztJQUN4QyxJQUFJLElBQUksWUFBWSxxQkFBVyxFQUFFO1FBQy9CLE9BQU8scUJBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDakM7SUFFRCxPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN2QixDQUFDO0FBUEQsd0JBT0M7QUFFRCxTQUFnQixLQUFLLENBQUMsSUFBVSxFQUFFLEtBQVcsRUFBRSxXQUEwQix5QkFBYSxDQUFDLE9BQU87SUFDNUYsd0NBQXdDO0lBQ3hDLElBQUksSUFBSSxZQUFZLHFCQUFXLEVBQUU7UUFDL0IsT0FBTyxxQkFBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ2pEO0lBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFNUIsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBVEQsc0JBU0M7QUFFRCxTQUFnQixTQUFTLENBQUMsSUFBVSxFQUFFLFNBQWlDO0lBQ3JFLHdDQUF3QztJQUN4QyxJQUFJLElBQUksWUFBWSxxQkFBVyxFQUFFO1FBQy9CLE9BQU87WUFDTCxJQUFJLHVCQUFZLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQztZQUNqQyxJQUFJLHVCQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ2pFLENBQUM7S0FDSDtTQUFNLElBQUksSUFBSSxZQUFZLG9CQUFRLEVBQUU7UUFDbkMsT0FBTztZQUNMLElBQUksMEJBQWMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDO1lBQ25DLElBQUksMEJBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDbkUsQ0FBQztLQUNIO1NBQU07UUFDTCxNQUFNLElBQUksK0JBQW1CLENBQUMsNkJBQTZCLENBQUMsQ0FBQztLQUM5RDtBQUNILENBQUM7QUFmRCw4QkFlQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxJQUFVO0lBQ2pDLHdDQUF3QztJQUN4QyxJQUFJLElBQUksWUFBWSxxQkFBVyxFQUFFO1FBQy9CLE9BQU8scUJBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDbkM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFQRCw0QkFPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IFNjaGVtYXRpY3NFeGNlcHRpb24gfSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7IEZpbHRlcmVkVHJlZSB9IGZyb20gJy4vZmlsdGVyZWQnO1xuaW1wb3J0IHsgRmlsdGVySG9zdFRyZWUsIEhvc3RUcmVlIH0gZnJvbSAnLi9ob3N0LXRyZWUnO1xuaW1wb3J0IHsgRmlsZVByZWRpY2F0ZSwgTWVyZ2VTdHJhdGVneSwgVHJlZSB9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IFZpcnR1YWxUcmVlIH0gZnJvbSAnLi92aXJ0dWFsJztcblxuXG5leHBvcnQgZnVuY3Rpb24gZW1wdHkoKSB7XG4gIHJldHVybiBuZXcgSG9zdFRyZWUoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJyYW5jaCh0cmVlOiBUcmVlKSB7XG4gIC8vIFRPRE86IFJlbW92ZSBWaXJ0dWFsVHJlZSB1c2FnZSBpbiA3LjBcbiAgaWYgKHRyZWUgaW5zdGFuY2VvZiBWaXJ0dWFsVHJlZSkge1xuICAgIHJldHVybiBWaXJ0dWFsVHJlZS5icmFuY2godHJlZSk7XG4gIH1cblxuICByZXR1cm4gdHJlZS5icmFuY2goKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlKHRyZWU6IFRyZWUsIG90aGVyOiBUcmVlLCBzdHJhdGVneTogTWVyZ2VTdHJhdGVneSA9IE1lcmdlU3RyYXRlZ3kuRGVmYXVsdCkge1xuICAvLyBUT0RPOiBSZW1vdmUgVmlydHVhbFRyZWUgdXNhZ2UgaW4gNy4wXG4gIGlmICh0cmVlIGluc3RhbmNlb2YgVmlydHVhbFRyZWUpIHtcbiAgICByZXR1cm4gVmlydHVhbFRyZWUubWVyZ2UodHJlZSwgb3RoZXIsIHN0cmF0ZWd5KTtcbiAgfVxuXG4gIHRyZWUubWVyZ2Uob3RoZXIsIHN0cmF0ZWd5KTtcblxuICByZXR1cm4gdHJlZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnRpdGlvbih0cmVlOiBUcmVlLCBwcmVkaWNhdGU6IEZpbGVQcmVkaWNhdGU8Ym9vbGVhbj4pOiBbVHJlZSwgVHJlZV0ge1xuICAvLyBUT0RPOiBSZW1vdmUgVmlydHVhbFRyZWUgdXNhZ2UgaW4gNy4wXG4gIGlmICh0cmVlIGluc3RhbmNlb2YgVmlydHVhbFRyZWUpIHtcbiAgICByZXR1cm4gW1xuICAgICAgbmV3IEZpbHRlcmVkVHJlZSh0cmVlLCBwcmVkaWNhdGUpLFxuICAgICAgbmV3IEZpbHRlcmVkVHJlZSh0cmVlLCAocGF0aCwgZW50cnkpID0+ICFwcmVkaWNhdGUocGF0aCwgZW50cnkpKSxcbiAgICBdO1xuICB9IGVsc2UgaWYgKHRyZWUgaW5zdGFuY2VvZiBIb3N0VHJlZSkge1xuICAgIHJldHVybiBbXG4gICAgICBuZXcgRmlsdGVySG9zdFRyZWUodHJlZSwgcHJlZGljYXRlKSxcbiAgICAgIG5ldyBGaWx0ZXJIb3N0VHJlZSh0cmVlLCAocGF0aCwgZW50cnkpID0+ICFwcmVkaWNhdGUocGF0aCwgZW50cnkpKSxcbiAgICBdO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdUcmVlIHR5cGUgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3B0aW1pemUodHJlZTogVHJlZSkge1xuICAvLyBUT0RPOiBSZW1vdmUgVmlydHVhbFRyZWUgdXNhZ2UgaW4gNy4wXG4gIGlmICh0cmVlIGluc3RhbmNlb2YgVmlydHVhbFRyZWUpIHtcbiAgICByZXR1cm4gVmlydHVhbFRyZWUub3B0aW1pemUodHJlZSk7XG4gIH1cblxuICByZXR1cm4gdHJlZTtcbn1cbiJdfQ==