/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { PlayerFactory, PlayerFactoryBuildFn } from '../interfaces/player';
/**
 * Combines the binding value and a factory for an animation player.
 *
 * Used to bind a player to an element template binding (currently only
 * `[style]`, `[style.prop]`, `[class]` and `[class.name]` bindings
 * supported). The provided `factoryFn` function will be run once all
 * the associated bindings have been evaluated on the element and is
 * designed to return a player which will then be placed on the element.
 *
 * @param factoryFn The function that is used to create a player
 *   once all the rendering-related (styling values) have been
 *   processed for the element binding.
 * @param value The raw value that will be exposed to the binding
 *   so that the binding can update its internal values when
 *   any changes are evaluated.
 */
export declare function bindPlayerFactory<T>(factoryFn: PlayerFactoryBuildFn, value: T): PlayerFactory;
export declare class BoundPlayerFactory<T> {
    fn: PlayerFactoryBuildFn;
    value: T;
    '__brand__': 'Brand for PlayerFactory that nothing will match';
    constructor(fn: PlayerFactoryBuildFn, value: T);
}
