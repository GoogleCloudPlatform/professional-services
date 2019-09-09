/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
import { ReplaceNodeOperation } from './interfaces';
export declare function replaceResources(shouldTransform: (fileName: string) => boolean): ts.TransformerFactory<ts.SourceFile>;
export interface ResourceReplacement {
    resourcePaths: string[];
    replaceNodeOperation: ReplaceNodeOperation;
}
export declare function findResources(sourceFile: ts.SourceFile): ResourceReplacement[];
