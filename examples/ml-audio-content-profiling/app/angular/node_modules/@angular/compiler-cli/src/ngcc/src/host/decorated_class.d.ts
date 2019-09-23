/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngcc/src/host/decorated_class" />
import * as ts from 'typescript';
import { Decorator } from '../../../ngtsc/host';
/**
 * A simple container that holds the details of a decorated class that has been
 * found in a `DecoratedFile`.
 */
export declare class DecoratedClass {
    name: string;
    declaration: ts.Declaration;
    decorators: Decorator[];
    /**
     * Initialize a `DecoratedClass` that was found in a `DecoratedFile`.
     * @param name The name of the class that has been found. This is mostly used
     * for informational purposes.
     * @param declaration The TypeScript AST node where this class is declared
     * @param decorators The collection of decorators that have been found on this class.
     */
    constructor(name: string, declaration: ts.Declaration, decorators: Decorator[]);
}
