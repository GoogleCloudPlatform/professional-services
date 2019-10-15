/// <amd-module name="@angular/compiler-cli/src/ngcc/src/utils" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
export declare function getOriginalSymbol(checker: ts.TypeChecker): (symbol: ts.Symbol) => ts.Symbol;
export declare function isDefined<T>(value: T | undefined | null): value is T;
export declare function getNameText(name: ts.PropertyName | ts.BindingName): string;
/**
 * Parse down the AST and capture all the nodes that satisfy the test.
 * @param node The start node.
 * @param test The function that tests whether a node should be included.
 * @returns a collection of nodes that satisfy the test.
 */
export declare function findAll<T>(node: ts.Node, test: (node: ts.Node) => node is ts.Node & T): T[];
