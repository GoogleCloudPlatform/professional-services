/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '../../output/output_ast';
/** Name of the i18n attributes **/
export declare const I18N_ATTR = "i18n";
export declare const I18N_ATTR_PREFIX = "i18n-";
/** Placeholder wrapper for i18n expressions **/
export declare const I18N_PLACEHOLDER_SYMBOL = "\uFFFD";
export declare function parseI18nMeta(meta?: string): I18nMeta;
export declare function isI18NAttribute(name: string): boolean;
export declare function wrapI18nPlaceholder(content: string | number, contextId?: number): string;
export declare function assembleI18nBoundString(strings: Array<string>, bindingStartIndex?: number, contextId?: number): string;
export declare type I18nMeta = {
    id?: string;
    description?: string;
    meaning?: string;
};
/**
 * I18nContext is a helper class which keeps track of all i18n-related aspects
 * (accumulates content, bindings, etc) between i18nStart and i18nEnd instructions.
 *
 * When we enter a nested template, the top-level context is being passed down
 * to the nested component, which uses this context to generate a child instance
 * of I18nContext class (to handle nested template) and at the end, reconciles it back
 * with the parent context.
 */
export declare class I18nContext {
    private index;
    private templateIndex;
    private ref;
    private level;
    private uniqueIdGen?;
    private id;
    private content;
    private bindings;
    constructor(index: number, templateIndex: number | null, ref: any, level?: number, uniqueIdGen?: (() => number) | undefined);
    private wrap;
    private append;
    private genTemplatePattern;
    getId(): number;
    getRef(): any;
    getIndex(): number;
    getContent(): string;
    getTemplateIndex(): number | null;
    getBindings(): Set<o.Expression>;
    appendBinding(binding: o.Expression): void;
    isRoot(): boolean;
    isResolved(): boolean;
    appendText(content: string): void;
    appendTemplate(index: number): void;
    appendElement(elementIndex: number, closed?: boolean): void;
    forkChildContext(index: number, templateIndex: number): I18nContext;
    reconcileChildContext(context: I18nContext): void;
}
