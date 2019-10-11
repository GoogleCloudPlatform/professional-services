/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngcc/src/host/esm2015_host" />
import * as ts from 'typescript';
import { DtsMapper } from './dts_mapper';
import { Fesm2015ReflectionHost } from './fesm2015_host';
export declare class Esm2015ReflectionHost extends Fesm2015ReflectionHost {
    protected dtsMapper: DtsMapper;
    constructor(isCore: boolean, checker: ts.TypeChecker, dtsMapper: DtsMapper);
    /**
     * Get the number of generic type parameters of a given class.
     *
     * @returns the number of type parameters of the class, if known, or `null` if the declaration
     * is not a class or has an unknown number of type parameters.
     */
    getGenericArityOfClass(clazz: ts.Declaration): number | null;
}
