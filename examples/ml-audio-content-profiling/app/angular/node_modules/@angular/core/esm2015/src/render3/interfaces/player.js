/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * A shared interface which contains an animation player
 * @record
 */
export function Player() { }
/** @type {?|undefined} */
Player.prototype.parent;
/** @type {?} */
Player.prototype.state;
/** @type {?} */
Player.prototype.play;
/** @type {?} */
Player.prototype.pause;
/** @type {?} */
Player.prototype.finish;
/** @type {?} */
Player.prototype.destroy;
/** @type {?} */
Player.prototype.addEventListener;
/** @enum {number} */
var BindingType = {
    Unset: 0,
    Class: 2,
    Style: 3,
};
export { BindingType };
/**
 * @record
 */
export function BindingStore() { }
/** @type {?} */
BindingStore.prototype.setValue;
/**
 * Defines the shape which produces the Player.
 *
 * Used to produce a player that will be placed on an element that contains
 * styling bindings that make use of the player. This function is designed
 * to be used with `PlayerFactory`.
 * @record
 */
export function PlayerFactoryBuildFn() { }
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
 * @record
 */
export function PlayerFactory() { }
/** @type {?} */
PlayerFactory.prototype.__brand__;
/**
 * @record
 */
export function PlayerBuilder() { }
/** @type {?} */
PlayerBuilder.prototype.buildPlayer;
/** @enum {number} */
var PlayState = {
    Pending: 0, Running: 1, Paused: 2, Finished: 100, Destroyed: 200,
};
export { PlayState };
/**
 * The context that stores all the active players and queued player factories present on an element.
 * @record
 */
export function PlayerContext() { }
/**
 * Designed to be used as an injection service to capture all animation players.
 *
 * When present all animation players will be passed into the flush method below.
 * This feature is designed to service application-wide animation testing, live
 * debugging as well as custom animation choreographing tools.
 * @record
 */
export function PlayerHandler() { }
/**
 * Designed to kick off the player at the end of change detection
 * @type {?}
 */
PlayerHandler.prototype.flushPlayers;
/**
 * \@param player The player that has been scheduled to run within the application.
 * \@param context The context as to where the player was bound to
 * @type {?}
 */
PlayerHandler.prototype.queuePlayer;
/** @enum {number} */
var PlayerIndex = {
    // The position where the index that reveals where players start in the PlayerContext
    NonBuilderPlayersStart: 0,
    // The position where the player builder lives (which handles {key:value} map expression) for
    // classes
    ClassMapPlayerBuilderPosition: 1,
    // The position where the last player assigned to the class player builder is stored
    ClassMapPlayerPosition: 2,
    // The position where the player builder lives (which handles {key:value} map expression) for
    // styles
    StyleMapPlayerBuilderPosition: 3,
    // The position where the last player assigned to the style player builder is stored
    StyleMapPlayerPosition: 4,
    // The position where any player builders start in the PlayerContext
    PlayerBuildersStartPosition: 1,
    // The position where non map-based player builders start in the PlayerContext
    SinglePlayerBuildersStartPosition: 5,
    // For each player builder there is a player in the player context (therefore size = 2)
    PlayerAndPlayerBuildersTupleSize: 2,
    // The player exists next to the player builder in the list
    PlayerOffsetPosition: 1,
};
export { PlayerIndex };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnRlcmZhY2VzL3BsYXllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXNCRSxRQUFTO0lBQ1QsUUFBUztJQUNULFFBQVM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBeUNrQixVQUFXLEVBQUUsVUFBVyxFQUFFLFNBQVUsRUFBRSxhQUFjLEVBQUUsY0FBZTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW1DaEcseUJBQTBCOzs7SUFHMUIsZ0NBQWlDOztJQUVqQyx5QkFBMEI7OztJQUcxQixnQ0FBaUM7O0lBRWpDLHlCQUEwQjs7SUFFMUIsOEJBQStCOztJQUUvQixvQ0FBcUM7O0lBRXJDLG1DQUFvQzs7SUFFcEMsdUJBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEEgc2hhcmVkIGludGVyZmFjZSB3aGljaCBjb250YWlucyBhbiBhbmltYXRpb24gcGxheWVyXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGxheWVyIHtcbiAgcGFyZW50PzogUGxheWVyfG51bGw7XG4gIHN0YXRlOiBQbGF5U3RhdGU7XG4gIHBsYXkoKTogdm9pZDtcbiAgcGF1c2UoKTogdm9pZDtcbiAgZmluaXNoKCk6IHZvaWQ7XG4gIGRlc3Ryb3koKTogdm9pZDtcbiAgYWRkRXZlbnRMaXN0ZW5lcihzdGF0ZTogUGxheVN0YXRlfHN0cmluZywgY2I6IChkYXRhPzogYW55KSA9PiBhbnkpOiB2b2lkO1xufVxuXG5leHBvcnQgY29uc3QgZW51bSBCaW5kaW5nVHlwZSB7XG4gIFVuc2V0ID0gMCxcbiAgQ2xhc3MgPSAyLFxuICBTdHlsZSA9IDMsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmluZGluZ1N0b3JlIHsgc2V0VmFsdWUocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZDsgfVxuXG4vKipcbiAqIERlZmluZXMgdGhlIHNoYXBlIHdoaWNoIHByb2R1Y2VzIHRoZSBQbGF5ZXIuXG4gKlxuICogVXNlZCB0byBwcm9kdWNlIGEgcGxheWVyIHRoYXQgd2lsbCBiZSBwbGFjZWQgb24gYW4gZWxlbWVudCB0aGF0IGNvbnRhaW5zXG4gKiBzdHlsaW5nIGJpbmRpbmdzIHRoYXQgbWFrZSB1c2Ugb2YgdGhlIHBsYXllci4gVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZFxuICogdG8gYmUgdXNlZCB3aXRoIGBQbGF5ZXJGYWN0b3J5YC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQbGF5ZXJGYWN0b3J5QnVpbGRGbiB7XG4gIChlbGVtZW50OiBIVE1MRWxlbWVudCwgdHlwZTogQmluZGluZ1R5cGUsIHZhbHVlczoge1trZXk6IHN0cmluZ106IGFueX0sXG4gICBjdXJyZW50UGxheWVyOiBQbGF5ZXJ8bnVsbCk6IFBsYXllcnxudWxsO1xufVxuXG4vKipcbiAqIFVzZWQgYXMgYSByZWZlcmVuY2UgdG8gYnVpbGQgYSBwbGF5ZXIgZnJvbSBhIHN0eWxpbmcgdGVtcGxhdGUgYmluZGluZ1xuICogKGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gKS5cbiAqXG4gKiBUaGUgYGZuYCBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBvbmNlIGFueSBzdHlsaW5nLXJlbGF0ZWQgY2hhbmdlcyBhcmVcbiAqIGV2YWx1YXRlZCBvbiBhbiBlbGVtZW50IGFuZCBpcyBleHBlY3RlZCB0byByZXR1cm4gYSBwbGF5ZXIgdGhhdCB3aWxsXG4gKiBiZSB0aGVuIHJ1biBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBgW3N0eWxlXWAsIGBbc3R5bGUucHJvcF1gLCBgW2NsYXNzXWAgYW5kIGBbY2xhc3MubmFtZV1gIHRlbXBsYXRlIGJpbmRpbmdzXG4gKiBhbGwgYWNjZXB0IGEgYFBsYXllckZhY3RvcnlgIGFzIGlucHV0IGFuZCB0aGlzIHBsYXllciBmYWN0b3JpZXMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGxheWVyRmFjdG9yeSB7ICdfX2JyYW5kX18nOiAnQnJhbmQgZm9yIFBsYXllckZhY3RvcnkgdGhhdCBub3RoaW5nIHdpbGwgbWF0Y2gnOyB9XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGxheWVyQnVpbGRlciBleHRlbmRzIEJpbmRpbmdTdG9yZSB7XG4gIGJ1aWxkUGxheWVyKGN1cnJlbnRQbGF5ZXI6IFBsYXllcnxudWxsKTogUGxheWVyfHVuZGVmaW5lZHxudWxsO1xufVxuXG4vKipcbiAqIFRoZSBzdGF0ZSBvZiBhIGdpdmVuIHBsYXllclxuICpcbiAqIERvIG5vdCBjaGFuZ2UgdGhlIGluY3JlYXNpbmcgbmF0dXJlIG9mIHRoZSBudW1iZXJzIHNpbmNlIHRoZSBwbGF5ZXJcbiAqIGNvZGUgbWF5IGNvbXBhcmUgc3RhdGUgYnkgY2hlY2tpbmcgaWYgYSBudW1iZXIgaXMgaGlnaGVyIG9yIGxvd2VyIHRoYW5cbiAqIGEgY2VydGFpbiBudW1lcmljIHZhbHVlLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBQbGF5U3RhdGUge1BlbmRpbmcgPSAwLCBSdW5uaW5nID0gMSwgUGF1c2VkID0gMiwgRmluaXNoZWQgPSAxMDAsIERlc3Ryb3llZCA9IDIwMH1cblxuLyoqXG4gKiBUaGUgY29udGV4dCB0aGF0IHN0b3JlcyBhbGwgdGhlIGFjdGl2ZSBwbGF5ZXJzIGFuZCBxdWV1ZWQgcGxheWVyIGZhY3RvcmllcyBwcmVzZW50IG9uIGFuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGxheWVyQ29udGV4dCBleHRlbmRzIEFycmF5PG51bGx8bnVtYmVyfFBsYXllcnxQbGF5ZXJCdWlsZGVyPiB7XG4gIFtQbGF5ZXJJbmRleC5Ob25CdWlsZGVyUGxheWVyc1N0YXJ0XTogbnVtYmVyO1xuICBbUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb25dOiBQbGF5ZXJCdWlsZGVyfG51bGw7XG4gIFtQbGF5ZXJJbmRleC5DbGFzc01hcFBsYXllclBvc2l0aW9uXTogUGxheWVyfG51bGw7XG4gIFtQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbl06IFBsYXllckJ1aWxkZXJ8bnVsbDtcbiAgW1BsYXllckluZGV4LlN0eWxlTWFwUGxheWVyUG9zaXRpb25dOiBQbGF5ZXJ8bnVsbDtcbn1cblxuLyoqXG4gKiBEZXNpZ25lZCB0byBiZSB1c2VkIGFzIGFuIGluamVjdGlvbiBzZXJ2aWNlIHRvIGNhcHR1cmUgYWxsIGFuaW1hdGlvbiBwbGF5ZXJzLlxuICpcbiAqIFdoZW4gcHJlc2VudCBhbGwgYW5pbWF0aW9uIHBsYXllcnMgd2lsbCBiZSBwYXNzZWQgaW50byB0aGUgZmx1c2ggbWV0aG9kIGJlbG93LlxuICogVGhpcyBmZWF0dXJlIGlzIGRlc2lnbmVkIHRvIHNlcnZpY2UgYXBwbGljYXRpb24td2lkZSBhbmltYXRpb24gdGVzdGluZywgbGl2ZVxuICogZGVidWdnaW5nIGFzIHdlbGwgYXMgY3VzdG9tIGFuaW1hdGlvbiBjaG9yZW9ncmFwaGluZyB0b29scy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQbGF5ZXJIYW5kbGVyIHtcbiAgLyoqXG4gICAqIERlc2lnbmVkIHRvIGtpY2sgb2ZmIHRoZSBwbGF5ZXIgYXQgdGhlIGVuZCBvZiBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAqL1xuICBmbHVzaFBsYXllcnMoKTogdm9pZDtcblxuICAvKipcbiAgICogQHBhcmFtIHBsYXllciBUaGUgcGxheWVyIHRoYXQgaGFzIGJlZW4gc2NoZWR1bGVkIHRvIHJ1biB3aXRoaW4gdGhlIGFwcGxpY2F0aW9uLlxuICAgKiBAcGFyYW0gY29udGV4dCBUaGUgY29udGV4dCBhcyB0byB3aGVyZSB0aGUgcGxheWVyIHdhcyBib3VuZCB0b1xuICAgKi9cbiAgcXVldWVQbGF5ZXIocGxheWVyOiBQbGF5ZXIsIGNvbnRleHQ6IENvbXBvbmVudEluc3RhbmNlfERpcmVjdGl2ZUluc3RhbmNlfEhUTUxFbGVtZW50KTogdm9pZDtcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gUGxheWVySW5kZXgge1xuICAvLyBUaGUgcG9zaXRpb24gd2hlcmUgdGhlIGluZGV4IHRoYXQgcmV2ZWFscyB3aGVyZSBwbGF5ZXJzIHN0YXJ0IGluIHRoZSBQbGF5ZXJDb250ZXh0XG4gIE5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnQgPSAwLFxuICAvLyBUaGUgcG9zaXRpb24gd2hlcmUgdGhlIHBsYXllciBidWlsZGVyIGxpdmVzICh3aGljaCBoYW5kbGVzIHtrZXk6dmFsdWV9IG1hcCBleHByZXNzaW9uKSBmb3JcbiAgLy8gY2xhc3Nlc1xuICBDbGFzc01hcFBsYXllckJ1aWxkZXJQb3NpdGlvbiA9IDEsXG4gIC8vIFRoZSBwb3NpdGlvbiB3aGVyZSB0aGUgbGFzdCBwbGF5ZXIgYXNzaWduZWQgdG8gdGhlIGNsYXNzIHBsYXllciBidWlsZGVyIGlzIHN0b3JlZFxuICBDbGFzc01hcFBsYXllclBvc2l0aW9uID0gMixcbiAgLy8gVGhlIHBvc2l0aW9uIHdoZXJlIHRoZSBwbGF5ZXIgYnVpbGRlciBsaXZlcyAod2hpY2ggaGFuZGxlcyB7a2V5OnZhbHVlfSBtYXAgZXhwcmVzc2lvbikgZm9yXG4gIC8vIHN0eWxlc1xuICBTdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbiA9IDMsXG4gIC8vIFRoZSBwb3NpdGlvbiB3aGVyZSB0aGUgbGFzdCBwbGF5ZXIgYXNzaWduZWQgdG8gdGhlIHN0eWxlIHBsYXllciBidWlsZGVyIGlzIHN0b3JlZFxuICBTdHlsZU1hcFBsYXllclBvc2l0aW9uID0gNCxcbiAgLy8gVGhlIHBvc2l0aW9uIHdoZXJlIGFueSBwbGF5ZXIgYnVpbGRlcnMgc3RhcnQgaW4gdGhlIFBsYXllckNvbnRleHRcbiAgUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uID0gMSxcbiAgLy8gVGhlIHBvc2l0aW9uIHdoZXJlIG5vbiBtYXAtYmFzZWQgcGxheWVyIGJ1aWxkZXJzIHN0YXJ0IGluIHRoZSBQbGF5ZXJDb250ZXh0XG4gIFNpbmdsZVBsYXllckJ1aWxkZXJzU3RhcnRQb3NpdGlvbiA9IDUsXG4gIC8vIEZvciBlYWNoIHBsYXllciBidWlsZGVyIHRoZXJlIGlzIGEgcGxheWVyIGluIHRoZSBwbGF5ZXIgY29udGV4dCAodGhlcmVmb3JlIHNpemUgPSAyKVxuICBQbGF5ZXJBbmRQbGF5ZXJCdWlsZGVyc1R1cGxlU2l6ZSA9IDIsXG4gIC8vIFRoZSBwbGF5ZXIgZXhpc3RzIG5leHQgdG8gdGhlIHBsYXllciBidWlsZGVyIGluIHRoZSBsaXN0XG4gIFBsYXllck9mZnNldFBvc2l0aW9uID0gMSxcbn1cblxuZXhwb3J0IGRlY2xhcmUgdHlwZSBDb21wb25lbnRJbnN0YW5jZSA9IHt9O1xuZXhwb3J0IGRlY2xhcmUgdHlwZSBEaXJlY3RpdmVJbnN0YW5jZSA9IHt9O1xuIl19