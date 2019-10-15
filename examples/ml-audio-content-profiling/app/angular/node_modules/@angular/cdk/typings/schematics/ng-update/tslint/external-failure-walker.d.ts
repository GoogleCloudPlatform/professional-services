/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Fix, Replacement, RuleWalker } from 'tslint';
import { ExternalResource } from './component-file';
/**
 * Enhanced TSLint rule walker that makes it easier to create rule failures that don't belong to
 * the source file that has been passed to the rule walker.
 */
export declare class ExternalFailureWalker extends RuleWalker {
    /** Adds a failure for the external resource at the specified position with the given width. */
    addExternalFailureAt(node: ExternalResource, start: number, width: number, message: string, fix?: Fix): void;
    /** Adds a failure at the specified range for the external resource. */
    addExternalFailureFromStartToEnd(node: ExternalResource, start: number, end: number, message: string, fix?: Fix): void;
    /** Adds a failure for the whole external resource node. */
    addExternalFailure(node: ExternalResource, message: string, fix?: Fix): void;
    /** Adds a failure to the external resource at the location of the specified replacement. */
    addExternalFailureAtReplacement(node: ExternalResource, message: string, replacement: Replacement): void;
    /** Adds a failure at the location of the specified replacement. */
    addFailureAtReplacement(message: string, replacement: Replacement): void;
}
