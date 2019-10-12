/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
export declare type ExternalResource = ts.SourceFile;
/**
 * Creates a fake TypeScript source file that can contain content of templates or stylesheets.
 * The fake TypeScript source file then can be passed to TSLint in combination with a rule failure.
 */
export declare function createComponentFile(filePath: string, content: string): ExternalResource;
