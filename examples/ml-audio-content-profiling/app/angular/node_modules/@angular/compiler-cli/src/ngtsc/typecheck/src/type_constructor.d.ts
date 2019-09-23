/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/typecheck/src/type_constructor" />
import * as ts from 'typescript';
import { TypeCtorMetadata } from './api';
/**
 * Generate a type constructor for the given class and metadata.
 *
 * A type constructor is a specially shaped TypeScript static method, intended to be placed within
 * a directive class itself, that permits type inference of any generic type parameters of the class
 * from the types of expressions bound to inputs or outputs, and the types of elements that match
 * queries performed by the directive. It also catches any errors in the types of these expressions.
 * This method is never called at runtime, but is used in type-check blocks to construct directive
 * types.
 *
 * A type constructor for NgFor looks like:
 *
 * static ngTypeCtor<T>(init: Partial<Pick<NgForOf<T>, 'ngForOf'|'ngForTrackBy'|'ngForTemplate'>>):
 *   NgForOf<T>;
 *
 * A typical usage would be:
 *
 * NgForOf.ngTypeCtor(init: {ngForOf: ['foo', 'bar']}); // Infers a type of NgForOf<string>.
 *
 * @param node the `ts.ClassDeclaration` for which a type constructor will be generated.
 * @param meta additional metadata required to generate the type constructor.
 * @returns a `ts.MethodDeclaration` for the type constructor.
 */
export declare function generateTypeCtor(node: ts.ClassDeclaration, meta: TypeCtorMetadata): ts.MethodDeclaration;
