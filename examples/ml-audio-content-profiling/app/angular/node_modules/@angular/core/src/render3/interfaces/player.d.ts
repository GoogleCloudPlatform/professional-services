/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * A shared interface which contains an animation player
 */
export interface Player {
    parent?: Player | null;
    state: PlayState;
    play(): void;
    pause(): void;
    finish(): void;
    destroy(): void;
    addEventListener(state: PlayState | string, cb: (data?: any) => any): void;
}
export declare const enum BindingType {
    Unset = 0,
    Class = 2,
    Style = 3
}
export interface BindingStore {
    setValue(prop: string, value: any): void;
}
/**
 * Defines the shape which produces the Player.
 *
 * Used to produce a player that will be placed on an element that contains
 * styling bindings that make use of the player. This function is designed
 * to be used with `PlayerFactory`.
 */
export interface PlayerFactoryBuildFn {
    (element: HTMLElement, type: BindingType, values: {
        [key: string]: any;
    }, currentPlayer: Player | null): Player | null;
}
/**
 * Used as a reference to build a player from a styling template binding
 * (`[style]` and `[class]`).
 *
 * The `fn` function will be called once any styling-related changes are
 * evaluated on an element and is expected to return a player that will
 * be then run on the element.
 *
 * `[style]`, `[style.prop]`, `[class]` and `[class.name]` template bindings
 * all accept a `PlayerFactory` as input and this player factories.
 */
export interface PlayerFactory {
    '__brand__': 'Brand for PlayerFactory that nothing will match';
}
export interface PlayerBuilder extends BindingStore {
    buildPlayer(currentPlayer: Player | null): Player | undefined | null;
}
/**
 * The state of a given player
 *
 * Do not change the increasing nature of the numbers since the player
 * code may compare state by checking if a number is higher or lower than
 * a certain numeric value.
 */
export declare const enum PlayState {
    Pending = 0,
    Running = 1,
    Paused = 2,
    Finished = 100,
    Destroyed = 200
}
/**
 * The context that stores all the active players and queued player factories present on an element.
 */
export interface PlayerContext extends Array<null | number | Player | PlayerBuilder> {
    [PlayerIndex.NonBuilderPlayersStart]: number;
    [PlayerIndex.ClassMapPlayerBuilderPosition]: PlayerBuilder | null;
    [PlayerIndex.ClassMapPlayerPosition]: Player | null;
    [PlayerIndex.StyleMapPlayerBuilderPosition]: PlayerBuilder | null;
    [PlayerIndex.StyleMapPlayerPosition]: Player | null;
}
/**
 * Designed to be used as an injection service to capture all animation players.
 *
 * When present all animation players will be passed into the flush method below.
 * This feature is designed to service application-wide animation testing, live
 * debugging as well as custom animation choreographing tools.
 */
export interface PlayerHandler {
    /**
     * Designed to kick off the player at the end of change detection
     */
    flushPlayers(): void;
    /**
     * @param player The player that has been scheduled to run within the application.
     * @param context The context as to where the player was bound to
     */
    queuePlayer(player: Player, context: ComponentInstance | DirectiveInstance | HTMLElement): void;
}
export declare const enum PlayerIndex {
    NonBuilderPlayersStart = 0,
    ClassMapPlayerBuilderPosition = 1,
    ClassMapPlayerPosition = 2,
    StyleMapPlayerBuilderPosition = 3,
    StyleMapPlayerPosition = 4,
    PlayerBuildersStartPosition = 1,
    SinglePlayerBuildersStartPosition = 5,
    PlayerAndPlayerBuildersTupleSize = 2,
    PlayerOffsetPosition = 1
}
export declare type ComponentInstance = {};
export declare type DirectiveInstance = {};
