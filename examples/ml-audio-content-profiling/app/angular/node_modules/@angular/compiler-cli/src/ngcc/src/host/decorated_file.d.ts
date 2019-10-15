/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngcc/src/host/decorated_file" />
import * as ts from 'typescript';
import { DecoratedClass } from './decorated_class';
/**
 * Information about a source file that contains decorated exported classes.
 */
export declare class DecoratedFile {
    sourceFile: ts.SourceFile;
    /**
     * The decorated exported classes that have been found in the file.
     */
    decoratedClasses: DecoratedClass[];
    constructor(sourceFile: ts.SourceFile);
}
