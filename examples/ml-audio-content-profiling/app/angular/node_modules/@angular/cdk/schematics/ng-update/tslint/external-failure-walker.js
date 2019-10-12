"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslint_1 = require("tslint");
/**
 * Enhanced TSLint rule walker that makes it easier to create rule failures that don't belong to
 * the source file that has been passed to the rule walker.
 */
class ExternalFailureWalker extends tslint_1.RuleWalker {
    /** Adds a failure for the external resource at the specified position with the given width. */
    addExternalFailureAt(node, start, width, message, fix) {
        this.addFailure(new tslint_1.RuleFailure(node, start, start + width, message, this.getRuleName(), fix));
    }
    /** Adds a failure at the specified range for the external resource. */
    addExternalFailureFromStartToEnd(node, start, end, message, fix) {
        this.addFailure(new tslint_1.RuleFailure(node, start, end, message, this.getRuleName(), fix));
    }
    /** Adds a failure for the whole external resource node. */
    addExternalFailure(node, message, fix) {
        this.addExternalFailureAt(node, node.getStart(), node.getFullWidth(), message, fix);
    }
    /** Adds a failure to the external resource at the location of the specified replacement. */
    addExternalFailureAtReplacement(node, message, replacement) {
        this.addExternalFailureAt(node, replacement.start, replacement.end, message, replacement);
    }
    /** Adds a failure at the location of the specified replacement. */
    addFailureAtReplacement(message, replacement) {
        this.addFailureAt(replacement.start, replacement.end, message, replacement);
    }
}
exports.ExternalFailureWalker = ExternalFailureWalker;
//# sourceMappingURL=external-failure-walker.js.map