/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { StyleSanitizeFn } from '../../sanitization/style_sanitizer';
import { InitialStylingFlags } from '../interfaces/definition';
import { BindingStore, BindingType, Player, PlayerBuilder, PlayerFactory } from '../interfaces/player';
import { Renderer3 } from '../interfaces/renderer';
import { StylingContext } from '../interfaces/styling';
import { LViewData, RootContext } from '../interfaces/view';
import { BoundPlayerFactory } from './player_factory';
/**
 * Creates a styling context template where styling information is stored.
 * Any styles that are later referenced using `updateStyleProp` must be
 * passed in within this function. Initial values for those styles are to
 * be declared after all initial style properties are declared (this change in
 * mode between declarations and initial styles is made possible using a special
 * enum value found in `definition.ts`).
 *
 * @param initialStyleDeclarations a list of style declarations and initial style values
 *    that are used later within the styling context.
 *
 *    -> ['width', 'height', SPECIAL_ENUM_VAL, 'width', '100px']
 *       This implies that `width` and `height` will be later styled and that the `width`
 *       property has an initial value of `100px`.
 *
 * @param initialClassDeclarations a list of class declarations and initial class values
 *    that are used later within the styling context.
 *
 *    -> ['foo', 'bar', SPECIAL_ENUM_VAL, 'foo', true]
 *       This implies that `foo` and `bar` will be later styled and that the `foo`
 *       class will be applied to the element as an initial class since it's true
 */
export declare function createStylingContextTemplate(initialClassDeclarations?: (string | boolean | InitialStylingFlags)[] | null, initialStyleDeclarations?: (string | boolean | InitialStylingFlags)[] | null, styleSanitizer?: StyleSanitizeFn | null): StylingContext;
/**
 * Sets and resolves all `multi` styling on an `StylingContext` so that they can be
 * applied to the element once `renderStyleAndClassBindings` is called.
 *
 * All missing styles/class (any values that are not provided in the new `styles`
 * or `classes` params) will resolve to `null` within their respective positions
 * in the context.
 *
 * @param context The styling context that will be updated with the
 *    newly provided style values.
 * @param classesInput The key/value map of CSS class names that will be used for the update.
 * @param stylesInput The key/value map of CSS styles that will be used for the update.
 */
export declare function updateStylingMap(context: StylingContext, classesInput: {
    [key: string]: any;
} | string | BoundPlayerFactory<null | string | {
    [key: string]: any;
}> | null, stylesInput?: {
    [key: string]: any;
} | BoundPlayerFactory<null | {
    [key: string]: any;
}> | null): void;
/**
 * Sets and resolves a single styling property/value on the provided `StylingContext` so
 * that they can be applied to the element once `renderStyleAndClassBindings` is called.
 *
 * Note that prop-level styling values are considered higher priority than any styling that
 * has been applied using `updateStylingMap`, therefore, when styling values are rendered
 * then any styles/classes that have been applied using this function will be considered first
 * (then multi values second and then initial values as a backup).
 *
 * @param context The styling context that will be updated with the
 *    newly provided style value.
 * @param index The index of the property which is being updated.
 * @param value The CSS style value that will be assigned
 */
export declare function updateStyleProp(context: StylingContext, index: number, input: string | boolean | null | BoundPlayerFactory<string | boolean | null>): void;
/**
 * This method will toggle the referenced CSS class (by the provided index)
 * within the given context.
 *
 * @param context The styling context that will be updated with the
 *    newly provided class value.
 * @param index The index of the CSS class which is being updated.
 * @param addOrRemove Whether or not to add or remove the CSS class
 */
export declare function updateClassProp(context: StylingContext, index: number, addOrRemove: boolean | BoundPlayerFactory<boolean>): void;
/**
 * Renders all queued styling using a renderer onto the given element.
 *
 * This function works by rendering any styles (that have been applied
 * using `updateStylingMap`) and any classes (that have been applied using
 * `updateStyleProp`) onto the provided element using the provided renderer.
 * Just before the styles/classes are rendered a final key/value style map
 * will be assembled (if `styleStore` or `classStore` are provided).
 *
 * @param lElement the element that the styles will be rendered on
 * @param context The styling context that will be used to determine
 *      what styles will be rendered
 * @param renderer the renderer that will be used to apply the styling
 * @param classesStore if provided, the updated class values will be applied
 *    to this key/value map instead of being renderered via the renderer.
 * @param stylesStore if provided, the updated style values will be applied
 *    to this key/value map instead of being renderered via the renderer.
 * @returns number the total amount of players that got queued for animation (if any)
 */
export declare function renderStyleAndClassBindings(context: StylingContext, renderer: Renderer3, rootOrView: RootContext | LViewData, classesStore?: BindingStore | null, stylesStore?: BindingStore | null): number;
export declare function isContextDirty(context: StylingContext): boolean;
export declare function setContextDirty(context: StylingContext, isDirtyYes: boolean): void;
export declare function setContextPlayersDirty(context: StylingContext, isDirtyYes: boolean): void;
export declare class ClassAndStylePlayerBuilder<T> implements PlayerBuilder {
    private _element;
    private _type;
    private _values;
    private _dirty;
    private _factory;
    constructor(factory: PlayerFactory, _element: HTMLElement, _type: BindingType);
    setValue(prop: string, value: any): void;
    buildPlayer(currentPlayer?: Player | null): Player | undefined | null;
}
