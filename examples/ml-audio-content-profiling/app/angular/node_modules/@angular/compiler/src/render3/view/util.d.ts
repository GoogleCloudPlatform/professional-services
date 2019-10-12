/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ConstantPool } from '../../constant_pool';
import * as o from '../../output/output_ast';
import * as t from '../r3_ast';
import { R3QueryMetadata } from './api';
/** Name of the temporary to use during data binding */
export declare const TEMPORARY_NAME = "_t";
/** Name of the context parameter passed into a template function */
export declare const CONTEXT_NAME = "ctx";
/** Name of the RenderFlag passed into a template function */
export declare const RENDER_FLAGS = "rf";
/** The prefix reference variables */
export declare const REFERENCE_PREFIX = "_r";
/** The name of the implicit context reference */
export declare const IMPLICIT_REFERENCE = "$implicit";
/** Non bindable attribute name **/
export declare const NON_BINDABLE_ATTR = "ngNonBindable";
/**
 * Creates an allocator for a temporary variable.
 *
 * A variable declaration is added to the statements the first time the allocator is invoked.
 */
export declare function temporaryAllocator(statements: o.Statement[], name: string): () => o.ReadVarExpr;
export declare function unsupported(feature: string): never;
export declare function invalid<T>(arg: o.Expression | o.Statement | t.Node): never;
export declare function asLiteral(value: any): o.Expression;
export declare function conditionallyCreateMapObjectLiteral(keys: {
    [key: string]: string | [string, string];
}): o.Expression | null;
export declare function mapToExpression(map: {
    [key: string]: any;
}, quoted?: boolean): o.Expression;
/**
 *  Remove trailing null nodes as they are implied.
 */
export declare function trimTrailingNulls(parameters: o.Expression[]): o.Expression[];
export declare function getQueryPredicate(query: R3QueryMetadata, constantPool: ConstantPool): o.Expression;
export declare function noop(): void;
export declare class DefinitionMap {
    values: {
        key: string;
        quoted: boolean;
        value: o.Expression;
    }[];
    set(key: string, value: o.Expression | null): void;
    toLiteralMap(): o.LiteralMapExpr;
}
/**
 * Extract a map of properties to values for a given element or template node, which can be used
 * by the directive matching machinery.
 *
 * @param elOrTpl the element or template in question
 * @return an object set up for directive matching. For attributes on the element/template, this
 * object maps a property name to its (static) value. For any bindings, this map simply maps the
 * property name to an empty string.
 */
export declare function getAttrsForDirectiveMatching(elOrTpl: t.Element | t.Template): {
    [name: string]: string;
};
