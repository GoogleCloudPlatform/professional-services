/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/factories/src/generator" />
import * as ts from 'typescript';
/**
 * Generates ts.SourceFiles which contain variable declarations for NgFactories for every exported
 * class of an input ts.SourceFile.
 */
export declare class FactoryGenerator {
    factoryFor(original: ts.SourceFile, genFilePath: string): ts.SourceFile;
    computeFactoryFileMap(files: ReadonlyArray<string>): Map<string, string>;
}
