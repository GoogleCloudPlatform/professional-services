/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare function getClosureSafeProperty<T>(objWithPropertyToExtract: T): string;
/**
 * Sets properties on a target object from a source object, but only if
 * the property doesn't already exist on the target object.
 * @param target The target to set properties on
 * @param source The source of the property keys and values to set
 */
export declare function fillProperties(target: {
    [key: string]: string;
}, source: {
    [key: string]: string;
}): void;
