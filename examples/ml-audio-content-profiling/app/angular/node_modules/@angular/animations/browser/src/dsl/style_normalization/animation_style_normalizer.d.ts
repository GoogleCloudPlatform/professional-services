/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @publicApi
 */
export declare abstract class AnimationStyleNormalizer {
    abstract normalizePropertyName(propertyName: string, errors: string[]): string;
    abstract normalizeStyleValue(userProvidedProperty: string, normalizedProperty: string, value: string | number, errors: string[]): string;
}
/**
 * @publicApi
 */
export declare class NoopAnimationStyleNormalizer {
    normalizePropertyName(propertyName: string, errors: string[]): string;
    normalizeStyleValue(userProvidedProperty: string, normalizedProperty: string, value: string | number, errors: string[]): string;
}
