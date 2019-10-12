/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type } from '../type';
/**
 * An interface implemented by all Angular type decorators, which allows them to be used as ES7
 * decorators as well as
 * Angular DSL syntax.
 *
 * ES7 syntax:
 *
 * ```
 * @ng.Component({...})
 * class MyClass {...}
 * ```
 *
 * @publicApi
 */
export interface TypeDecorator {
    /**
     * Invoke as ES7 decorator.
     */
    <T extends Type<any>>(type: T): T;
    (target: Object, propertyKey?: string | symbol, parameterIndex?: number): void;
}
export declare const ANNOTATIONS = "__annotations__";
export declare const PARAMETERS = "__parameters__";
export declare const PROP_METADATA = "__prop__metadata__";
/**
 * @suppress {globalThis}
 */
export declare function makeDecorator<T>(name: string, props?: (...args: any[]) => any, parentClass?: any, additionalProcessing?: (type: Type<T>) => void, typeFn?: (type: Type<T>, ...args: any[]) => void): {
    new (...args: any[]): any;
    (...args: any[]): any;
    (...args: any[]): (cls: any) => any;
};
export declare function makeParamDecorator(name: string, props?: (...args: any[]) => any, parentClass?: any): any;
export declare function makePropDecorator(name: string, props?: (...args: any[]) => any, parentClass?: any, additionalProcessing?: (target: any, name: string, ...args: any[]) => void): any;
