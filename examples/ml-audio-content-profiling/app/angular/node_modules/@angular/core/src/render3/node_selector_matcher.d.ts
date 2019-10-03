/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { TNode } from './interfaces/node';
import { CssSelector, CssSelectorList } from './interfaces/projection';
/**
 * A utility function to match an Ivy node static data against a simple CSS selector
 *
 * @param node static data to match
 * @param selector
 * @returns true if node matches the selector.
 */
export declare function isNodeMatchingSelector(tNode: TNode, selector: CssSelector): boolean;
export declare function isNodeMatchingSelectorList(tNode: TNode, selector: CssSelectorList): boolean;
export declare function getProjectAsAttrValue(tNode: TNode): string | null;
/**
 * Checks a given node against matching selectors and returns
 * selector index (or 0 if none matched).
 *
 * This function takes into account the ngProjectAs attribute: if present its value will be compared
 * to the raw (un-parsed) CSS selector instead of using standard selector matching logic.
 */
export declare function matchingSelectorIndex(tNode: TNode, selectors: CssSelectorList[], textSelectors: string[]): number;
