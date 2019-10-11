/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/transform/src/transform" />
import * as ts from 'typescript';
import { ReflectionHost } from '../../host';
import { IvyCompilation } from './compilation';
export declare function ivyTransformFactory(compilation: IvyCompilation, reflector: ReflectionHost, coreImportsFrom: ts.SourceFile | null): ts.TransformerFactory<ts.SourceFile>;
