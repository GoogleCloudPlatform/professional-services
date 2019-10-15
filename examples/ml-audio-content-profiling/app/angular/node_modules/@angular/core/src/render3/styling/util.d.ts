/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../ng_dev_mode';
import { StyleSanitizeFn } from '../../sanitization/style_sanitizer';
import { LContext } from '../interfaces/context';
import { Player, PlayerContext } from '../interfaces/player';
import { RElement } from '../interfaces/renderer';
import { InitialStyles, StylingContext } from '../interfaces/styling';
import { LViewData, RootContext } from '../interfaces/view';
export declare function createEmptyStylingContext(element?: RElement | null, sanitizer?: StyleSanitizeFn | null, initialStylingValues?: InitialStyles): StylingContext;
/**
 * Used clone a copy of a pre-computed template of a styling context.
 *
 * A pre-computed template is designed to be computed once for a given element
 * (instructions.ts has logic for caching this).
 */
export declare function allocStylingContext(element: RElement | null, templateStyleContext: StylingContext): StylingContext;
/**
 * Retrieve the `StylingContext` at a given index.
 *
 * This method lazily creates the `StylingContext`. This is because in most cases
 * we have styling without any bindings. Creating `StylingContext` eagerly would mean that
 * every style declaration such as `<div style="color: red">` would result `StyleContext`
 * which would create unnecessary memory pressure.
 *
 * @param index Index of the style allocation. See: `elementStyling`.
 * @param viewData The view to search for the styling context
 */
export declare function getStylingContext(index: number, viewData: LViewData): StylingContext;
export declare function addPlayerInternal(playerContext: PlayerContext, rootContext: RootContext, element: HTMLElement, player: Player | null, playerContextIndex: number, ref?: any): boolean;
export declare function getPlayersInternal(playerContext: PlayerContext): Player[];
export declare function getOrCreatePlayerContext(target: {}, context?: LContext | null): PlayerContext | null;
export declare function getPlayerContext(stylingContext: StylingContext): PlayerContext | null;
export declare function allocPlayerContext(data: StylingContext): PlayerContext;
export declare function throwInvalidRefError(): void;
