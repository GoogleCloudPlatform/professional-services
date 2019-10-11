/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/typecheck/src/type_check_block" />
import * as ts from 'typescript';
import { ImportManager } from '../../translator';
import { TypeCheckBlockMetadata } from './api';
/**
 * Given a `ts.ClassDeclaration` for a component, and metadata regarding that component, compose a
 * "type check block" function.
 *
 * When passed through TypeScript's TypeChecker, type errors that arise within the type check block
 * function indicate issues in the template itself.
 *
 * @param node the TypeScript node for the component class.
 * @param meta metadata about the component's template and the function being generated.
 * @param importManager an `ImportManager` for the file into which the TCB will be written.
 */
export declare function generateTypeCheckBlock(node: ts.ClassDeclaration, meta: TypeCheckBlockMetadata, importManager: ImportManager): ts.FunctionDeclaration;
