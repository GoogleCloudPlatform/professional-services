/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { QueryList } from '../linker';
import { Sanitizer } from '../sanitization/security';
import { StyleSanitizeFn } from '../sanitization/style_sanitizer';
import { LContainer } from './interfaces/container';
import { ComponentDef, ComponentQuery, ComponentTemplate, DirectiveDef, DirectiveDefListOrFactory, InitialStylingFlags, PipeDefListOrFactory, RenderFlags } from './interfaces/definition';
import { LocalRefExtractor, TAttributes, TContainerNode, TElementContainerNode, TElementNode, TNode, TNodeType, TProjectionNode, TViewNode } from './interfaces/node';
import { PlayerFactory } from './interfaces/player';
import { CssSelectorList } from './interfaces/projection';
import { LQueries } from './interfaces/query';
import { RComment, RElement, RNode, RText, Renderer3, RendererFactory3 } from './interfaces/renderer';
import { CurrentMatchesList, LViewData, LViewFlags, OpaqueViewState, RootContext, RootContextFlags, TView } from './interfaces/view';
/**
 * Function used to sanitize the value before writing it into the renderer.
 */
export declare type SanitizerFn = (value: any) => string;
/**
 * Token set in currentMatches while dependencies are being resolved.
 *
 * If we visit a directive that has a value set to CIRCULAR, we know we've
 * already seen it, and thus have a circular dependency.
 */
export declare const CIRCULAR = "__CIRCULAR__";
export declare function getRenderer(): Renderer3;
export declare function getRendererFactory(): RendererFactory3;
export declare function getCurrentSanitizer(): Sanitizer | null;
/**
 * Returns the current OpaqueViewState instance.
 *
 * Used in conjunction with the restoreView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 */
export declare function getCurrentView(): OpaqueViewState;
/**
 * Restores `contextViewData` to the given OpaqueViewState instance.
 *
 * Used in conjunction with the getCurrentView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 *
 * @param viewToRestore The OpaqueViewState instance to restore.
 */
export declare function restoreView(viewToRestore: OpaqueViewState): void;
export declare function getPreviousOrParentTNode(): TNode;
export declare function setEnvironment(tNode: TNode, view: LViewData): void;
/**
 * Query instructions can ask for "current queries" in 2 different cases:
 * - when creating view queries (at the root of a component view, before any node is created - in
 * this case currentQueries points to view queries)
 * - when creating content queries (i.e. this previousOrParentTNode points to a node on which we
 * create content queries).
 */
export declare function getOrCreateCurrentQueries(QueryType: {
    new (parent: null, shallow: null, deep: null): LQueries;
}): LQueries;
export declare function getCreationMode(): boolean;
/**
 * Internal function that returns the current LViewData instance.
 *
 * The getCurrentView() instruction should be used for anything public.
 */
export declare function _getViewData(): LViewData;
export declare function getBindingRoot(): number;
/**
 * Swap the current state with a new state.
 *
 * For performance reasons we store the state in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the state for later, and when the view is
 * exited the state has to be restored
 *
 * @param newView New state to become active
 * @param host Element to which the View is a child of
 * @returns the previous state;
 */
export declare function enterView(newView: LViewData, hostTNode: TElementNode | TViewNode | null): LViewData;
/**
 * Used in lieu of enterView to make it clear when we are exiting a child view. This makes
 * the direction of traversal (up or down the view tree) a bit clearer.
 *
 * @param newView New state to become active
 * @param creationOnly An optional boolean to indicate that the view was processed in creation mode
 * only, i.e. the first update will be done later. Only possible for dynamically created views.
 */
export declare function leaveView(newView: LViewData, creationOnly?: boolean): void;
/** Sets the host bindings for the current view. */
export declare function setHostBindings(): void;
export declare function executeInitAndContentHooks(): void;
export declare function createLViewData<T>(renderer: Renderer3, tView: TView, context: T | null, flags: LViewFlags, sanitizer?: Sanitizer | null): LViewData;
/**
 * Create and stores the TNode, and hooks it up to the tree.
 *
 * @param index The index at which the TNode should be saved (null if view, since they are not
 * saved).
 * @param type The type of TNode to create
 * @param native The native element for this node, if applicable
 * @param name The tag name of the associated native element, if applicable
 * @param attrs Any attrs for the native element, if applicable
 */
export declare function createNodeAtIndex(index: number, type: TNodeType.Element, native: RElement | RText | null, name: string | null, attrs: TAttributes | null): TElementNode;
export declare function createNodeAtIndex(index: number, type: TNodeType.Container, native: RComment, name: string | null, attrs: TAttributes | null): TContainerNode;
export declare function createNodeAtIndex(index: number, type: TNodeType.Projection, native: null, name: null, attrs: TAttributes | null): TProjectionNode;
export declare function createNodeAtIndex(index: number, type: TNodeType.ElementContainer, native: RComment, name: null, attrs: TAttributes | null): TElementContainerNode;
export declare function createViewNode(index: number, view: LViewData): TViewNode;
/**
 * When elements are created dynamically after a view blueprint is created (e.g. through
 * i18nApply() or ComponentFactory.create), we need to adjust the blueprint for future
 * template passes.
 */
export declare function adjustBlueprintForNewNode(view: LViewData): void;
/**
 * Resets the application state.
 */
export declare function resetComponentState(): void;
/**
 *
 * @param hostNode Existing node to render into.
 * @param templateFn Template function with the instructions.
 * @param consts The number of nodes, local refs, and pipes in this template
 * @param context to pass into the template.
 * @param providedRendererFactory renderer factory to use
 * @param host The host element node to use
 * @param directives Directive defs that should be used for matching
 * @param pipes Pipe defs that should be used for matching
 */
export declare function renderTemplate<T>(hostNode: RElement, templateFn: ComponentTemplate<T>, consts: number, vars: number, context: T, providedRendererFactory: RendererFactory3, hostView: LViewData | null, directives?: DirectiveDefListOrFactory | null, pipes?: PipeDefListOrFactory | null, sanitizer?: Sanitizer | null): LViewData;
/**
 * Used for creating the LViewNode of a dynamic embedded view,
 * either through ViewContainerRef.createEmbeddedView() or TemplateRef.createEmbeddedView().
 * Such lViewNode will then be renderer with renderEmbeddedTemplate() (see below).
 */
export declare function createEmbeddedViewAndNode<T>(tView: TView, context: T, declarationView: LViewData, renderer: Renderer3, queries: LQueries | null, injectorIndex: number): LViewData;
/**
 * Used for rendering embedded views (e.g. dynamically created views)
 *
 * Dynamically created views must store/retrieve their TViews differently from component views
 * because their template functions are nested in the template functions of their hosts, creating
 * closures. If their host template happens to be an embedded template in a loop (e.g. ngFor inside
 * an ngFor), the nesting would mean we'd have multiple instances of the template function, so we
 * can't store TViews in the template function itself (as we do for comps). Instead, we store the
 * TView for dynamically created views on their host TNode, which only has one instance.
 */
export declare function renderEmbeddedTemplate<T>(viewToRender: LViewData, tView: TView, context: T, rf: RenderFlags): void;
/**
 * Retrieves a context at the level specified and saves it as the global, contextViewData.
 * Will get the next level up if level is not specified.
 *
 * This is used to save contexts of parent views so they can be bound in embedded views, or
 * in conjunction with reference() to bind a ref from a parent view.
 *
 * @param level The relative level of the view from which to grab context compared to contextVewData
 * @returns context
 */
export declare function nextContext<T = any>(level?: number): T;
export declare function renderComponentOrTemplate<T>(hostView: LViewData, componentOrContext: T, templateFn?: ComponentTemplate<T>): void;
export declare function namespaceSVG(): void;
export declare function namespaceMathML(): void;
export declare function namespaceHTML(): void;
/**
 * Creates an empty element using {@link elementStart} and {@link elementEnd}
 *
 * @param index Index of the element in the data array
 * @param name Name of the DOM Node
 * @param attrs Statically bound set of attributes to be written into the DOM element on creation.
 * @param localRefs A set of local reference bindings on the element.
 */
export declare function element(index: number, name: string, attrs?: TAttributes | null, localRefs?: string[] | null): void;
/**
 * Creates a logical container for other nodes (<ng-container>) backed by a comment node in the DOM.
 * The instruction must later be followed by `elementContainerEnd()` call.
 *
 * @param index Index of the element in the LViewData array
 * @param attrs Set of attributes to be used when matching directives.
 * @param localRefs A set of local reference bindings on the element.
 *
 * Even if this instruction accepts a set of attributes no actual attribute values are propagated to
 * the DOM (as a comment node can't have attributes). Attributes are here only for directive
 * matching purposes and setting initial inputs of directives.
 */
export declare function elementContainerStart(index: number, attrs?: TAttributes | null, localRefs?: string[] | null): void;
/** Mark the end of the <ng-container>. */
export declare function elementContainerEnd(): void;
/**
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * @param index Index of the element in the LViewData array
 * @param name Name of the DOM Node
 * @param attrs Statically bound set of attributes to be written into the DOM element on creation.
 * @param localRefs A set of local reference bindings on the element.
 *
 * Attributes and localRefs are passed as an array of strings where elements with an even index
 * hold an attribute name and elements with an odd index hold an attribute value, ex.:
 * ['id', 'warning5', 'class', 'alert']
 */
export declare function elementStart(index: number, name: string, attrs?: TAttributes | null, localRefs?: string[] | null): void;
/**
 * Creates a native element from a tag name, using a renderer.
 * @param name the tag name
 * @param overriddenRenderer Optional A renderer to override the default one
 * @returns the element created
 */
export declare function elementCreate(name: string, overriddenRenderer?: Renderer3): RElement;
/**
 * On the first template pass, we need to reserve space for host binding values
 * after directives are matched (so all directives are saved, then bindings).
 * Because we are updating the blueprint, we only need to do this once.
 */
export declare function prefillHostVars(totalHostVars: number): void;
export declare function resolveDirective(def: DirectiveDef<any>, valueIndex: number, matches: CurrentMatchesList): any;
/** Stores index of directive and host element so it will be queued for binding refresh during CD.
 */
export declare function queueHostBindingForCheck(dirIndex: number, def: DirectiveDef<any> | ComponentDef<any>): void;
/**
 * Gets TView from a template function or creates a new TView
 * if it doesn't already exist.
 *
 * @param templateFn The template from which to get static data
 * @param consts The number of nodes, local refs, and pipes in this view
 * @param vars The number of bindings and pure function bindings in this view
 * @param directives Directive defs that should be saved on TView
 * @param pipes Pipe defs that should be saved on TView
 * @returns TView
 */
export declare function getOrCreateTView(templateFn: ComponentTemplate<any>, consts: number, vars: number, directives: DirectiveDefListOrFactory | null, pipes: PipeDefListOrFactory | null, viewQuery: ComponentQuery<any> | null): TView;
/**
 * Creates a TView instance
 *
 * @param viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param templateFn Template function
 * @param consts The number of nodes, local refs, and pipes in this template
 * @param directives Registry of directives for this view
 * @param pipes Registry of pipes for this view
 */
export declare function createTView(viewIndex: number, templateFn: ComponentTemplate<any> | null, consts: number, vars: number, directives: DirectiveDefListOrFactory | null, pipes: PipeDefListOrFactory | null, viewQuery: ComponentQuery<any> | null): TView;
export declare function createError(text: string, token: any): Error;
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param elementOrSelector Render element or CSS selector to locate the element.
 */
export declare function locateHostElement(factory: RendererFactory3, elementOrSelector: RElement | string): RElement | null;
/**
 * Adds an event listener to the current node.
 *
 * If an output exists on one of the node's directives, it also subscribes to the output
 * and saves the subscription for later cleanup.
 *
 * @param eventName Name of the event
 * @param listenerFn The function to be called when event emits
 * @param useCapture Whether or not to use capture in event listener.
 */
export declare function listener(eventName: string, listenerFn: (e?: any) => any, useCapture?: boolean): void;
/**
 * Saves context for this cleanup function in LView.cleanupInstances.
 *
 * On the first template pass, saves in TView:
 * - Cleanup function
 * - Index of context we just saved in LView.cleanupInstances
 */
export declare function storeCleanupWithContext(view: LViewData | null, context: any, cleanupFn: Function): void;
/**
 * Saves the cleanup function itself in LView.cleanupInstances.
 *
 * This is necessary for functions that are wrapped with their contexts, like in renderer2
 * listeners.
 *
 * On the first template pass, the index of the cleanup function is saved in TView.
 */
export declare function storeCleanupFn(view: LViewData, cleanupFn: Function): void;
/** Mark the end of the element. */
export declare function elementEnd(): void;
/**
 * Updates the value of removes an attribute on an Element.
 *
 * @param number index The index of the element in the data array
 * @param name name The name of the attribute.
 * @param value value The attribute is removed when value is `null` or `undefined`.
 *                  Otherwise the attribute value is set to the stringified value.
 * @param sanitizer An optional function used to sanitize the value.
 */
export declare function elementAttribute(index: number, name: string, value: any, sanitizer?: SanitizerFn): void;
/**
 * Update a property on an Element.
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new @Inputs don't have to be re-compiled.
 *
 * @param index The index of the element to update in the data array
 * @param propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param value New value to write.
 * @param sanitizer An optional function used to sanitize the value.
 */
export declare function elementProperty<T>(index: number, propName: string, value: T | NO_CHANGE, sanitizer?: SanitizerFn): void;
/**
 * Enables directive matching on elements.
 *
 *  * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- disabledBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- enableBindings() -->
 * </div>
 * ```
 */
export declare function enableBindings(): void;
/**
 * Disables directive matching on element.
 *
 *  * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- disabledBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- enableBindings() -->
 * </div>
 * ```
 */
export declare function disableBindings(): void;
/**
 * Constructs a TNode object from the arguments.
 *
 * @param type The type of the node
 * @param adjustedIndex The index of the TNode in TView.data, adjusted for HEADER_OFFSET
 * @param tagName The tag name of the node
 * @param attrs The attributes defined on this node
 * @param tViews Any TViews attached to this node
 * @returns the TNode object
 */
export declare function createTNode(type: TNodeType, adjustedIndex: number, tagName: string | null, attrs: TAttributes | null, tViews: TView[] | null): TNode;
/**
 * Add or remove a class in a `classList` on a DOM element.
 *
 * This instruction is meant to handle the [class.foo]="exp" case
 *
 * @param index The index of the element to update in the data array
 * @param className Name of class to toggle. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param value A value indicating if a given class should be added or removed.
 */
export declare function elementClassProp(index: number, stylingIndex: number, value: boolean | PlayerFactory): void;
/**
 * Assign any inline style values to the element during creation mode.
 *
 * This instruction is meant to be called during creation mode to apply all styling
 * (e.g. `style="..."`) values to the element. This is also where the provided index
 * value is allocated for the styling details for its corresponding element (the element
 * index is the previous index value from this one).
 *
 * (Note this function calls `elementStylingApply` immediately when called.)
 *
 *
 * @param index Index value which will be allocated to store styling data for the element.
 *        (Note that this is not the element index, but rather an index value allocated
 *        specifically for element styling--the index must be the next index after the element
 *        index.)
 * @param classDeclarations A key/value array of CSS classes that will be registered on the element.
 *   Each individual style will be used on the element as long as it is not overridden
 *   by any classes placed on the element by multiple (`[class]`) or singular (`[class.named]`)
 *   bindings. If a class binding changes its value to a falsy value then the matching initial
 *   class value that are passed in here will be applied to the element (if matched).
 * @param styleDeclarations A key/value array of CSS styles that will be registered on the element.
 *   Each individual style will be used on the element as long as it is not overridden
 *   by any styles placed on the element by multiple (`[style]`) or singular (`[style.prop]`)
 *   bindings. If a style binding changes its value to null then the initial styling
 *   values that are passed in here will be applied to the element (if matched).
 * @param styleSanitizer An optional sanitizer function that will be used (if provided)
 *   to sanitize the any CSS property values that are applied to the element (during rendering).
 */
export declare function elementStyling(classDeclarations?: (string | boolean | InitialStylingFlags)[] | null, styleDeclarations?: (string | boolean | InitialStylingFlags)[] | null, styleSanitizer?: StyleSanitizeFn | null): void;
/**
 * Apply all styling values to the element which have been queued by any styling instructions.
 *
 * This instruction is meant to be run once one or more `elementStyle` and/or `elementStyleProp`
 * have been issued against the element. This function will also determine if any styles have
 * changed and will then skip the operation if there is nothing new to render.
 *
 * Once called then all queued styles will be flushed.
 *
 * @param index Index of the element's styling storage that will be rendered.
 *        (Note that this is not the element index, but rather an index value allocated
 *        specifically for element styling--the index must be the next index after the element
 *        index.)
 */
export declare function elementStylingApply(index: number): void;
/**
 * Queue a given style to be rendered on an Element.
 *
 * If the style value is `null` then it will be removed from the element
 * (or assigned a different value depending if there are any styles placed
 * on the element with `elementStyle` or any styles that are present
 * from when the element was created (with `elementStyling`).
 *
 * (Note that the styling instruction will not be applied until `elementStylingApply` is called.)
 *
 * @param index Index of the element's styling storage to change in the data array.
 *        (Note that this is not the element index, but rather an index value allocated
 *        specifically for element styling--the index must be the next index after the element
 *        index.)
 * @param styleIndex Index of the style property on this element. (Monotonically increasing.)
 * @param value New value to write (null to remove).
 * @param suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 */
export declare function elementStyleProp(index: number, styleIndex: number, value: string | number | String | PlayerFactory | null, suffix?: string): void;
/**
 * Queue a key/value map of styles to be rendered on an Element.
 *
 * This instruction is meant to handle the `[style]="exp"` usage. When styles are applied to
 * the Element they will then be placed with respect to any styles set with `elementStyleProp`.
 * If any styles are set to `null` then they will be removed from the element (unless the same
 * style properties have been assigned to the element during creation using `elementStyling`).
 *
 * (Note that the styling instruction will not be applied until `elementStylingApply` is called.)
 *
 * @param index Index of the element's styling storage to change in the data array.
 *        (Note that this is not the element index, but rather an index value allocated
 *        specifically for element styling--the index must be the next index after the element
 *        index.)
 * @param classes A key/value style map of CSS classes that will be added to the given element.
 *        Any missing classes (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's list of CSS classes.
 * @param styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 */
export declare function elementStylingMap<T>(index: number, classes: {
    [key: string]: any;
} | string | null, styles?: {
    [styleName: string]: any;
} | null): void;
/**
 * Create static text node
 *
 * @param index Index of the node in the data array
 * @param value Value to write. This value will be stringified.
 */
export declare function text(index: number, value?: any): void;
/**
 * Create text node with binding
 * Bindings should be handled externally with the proper interpolation(1-8) method
 *
 * @param index Index of the node in the data array.
 * @param value Stringified value to write.
 */
export declare function textBinding<T>(index: number, value: T | NO_CHANGE): void;
/**
 * Create a directive and their associated content queries.
 *
 * NOTE: directives can be created in order other than the index order. They can also
 *       be retrieved before they are created in which case the value will be null.
 *
 * @param directive The directive instance.
 * @param directiveDef DirectiveDef object which contains information about the template.
 */
export declare function directiveCreate<T>(directiveDefIdx: number, directive: T, directiveDef: DirectiveDef<T> | ComponentDef<T>): T;
/**
 * A lighter version of directiveCreate() that is used for the root component
 *
 * This version does not contain features that we don't already support at root in
 * current Angular. Example: local refs and inputs on root component.
 */
export declare function baseDirectiveCreate<T>(index: number, directive: T, directiveDef: DirectiveDef<T> | ComponentDef<T>, native: RNode | null): T;
/**
 * Creates a LContainer, either from a container instruction, or for a ViewContainerRef.
 *
 * @param hostNative The host element for the LContainer
 * @param hostTNode The host TNode for the LContainer
 * @param currentView The parent view of the LContainer
 * @param native The native comment element
 * @param isForViewContainerRef Optional a flag indicating the ViewContainerRef case
 * @returns LContainer
 */
export declare function createLContainer(hostNative: RElement | RComment, hostTNode: TElementNode | TContainerNode | TElementContainerNode, currentView: LViewData, native: RComment, isForViewContainerRef?: boolean): LContainer;
/**
 * Creates an LContainer for an ng-template (dynamically-inserted view), e.g.
 *
 * <ng-template #foo>
 *    <div></div>
 * </ng-template>
 *
 * @param index The index of the container in the data array
 * @param templateFn Inline template
 * @param consts The number of nodes, local refs, and pipes for this template
 * @param vars The number of bindings for this template
 * @param tagName The name of the container element, if applicable
 * @param attrs The attrs attached to the container, if applicable
 * @param localRefs A set of local reference bindings on the element.
 * @param localRefExtractor A function which extracts local-refs values from the template.
 *        Defaults to the current element associated with the local-ref.
 */
export declare function template(index: number, templateFn: ComponentTemplate<any> | null, consts: number, vars: number, tagName?: string | null, attrs?: TAttributes | null, localRefs?: string[] | null, localRefExtractor?: LocalRefExtractor): void;
/**
 * Creates an LContainer for inline views, e.g.
 *
 * % if (showing) {
 *   <div></div>
 * % }
 *
 * @param index The index of the container in the data array
 */
export declare function container(index: number): void;
/**
 * Sets a container up to receive views.
 *
 * @param index The index of the container in the data array
 */
export declare function containerRefreshStart(index: number): void;
/**
 * Marks the end of the LContainer.
 *
 * Marking the end of LContainer is the time when to child views get inserted or removed.
 */
export declare function containerRefreshEnd(): void;
/**
 * Marks the start of an embedded view.
 *
 * @param viewBlockId The ID of this view
 * @return boolean Whether or not this view is in creation mode
 */
export declare function embeddedViewStart(viewBlockId: number, consts: number, vars: number): RenderFlags;
/** Marks the end of an embedded view. */
export declare function embeddedViewEnd(): void;
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param adjustedElementIndex  Element index in LViewData[] (adjusted for HEADER_OFFSET)
 */
export declare function componentRefresh<T>(adjustedElementIndex: number, parentFirstTemplatePass: boolean): void;
/** Returns a boolean for whether the view is attached */
export declare function viewAttached(view: LViewData): boolean;
/**
 * Instruction to distribute projectable nodes among <ng-content> occurrences in a given template.
 * It takes all the selectors from the entire component's template and decides where
 * each projected node belongs (it re-distributes nodes among "buckets" where each "bucket" is
 * backed by a selector).
 *
 * This function requires CSS selectors to be provided in 2 forms: parsed (by a compiler) and text,
 * un-parsed form.
 *
 * The parsed form is needed for efficient matching of a node against a given CSS selector.
 * The un-parsed, textual form is needed for support of the ngProjectAs attribute.
 *
 * Having a CSS selector in 2 different formats is not ideal, but alternatives have even more
 * drawbacks:
 * - having only a textual form would require runtime parsing of CSS selectors;
 * - we can't have only a parsed as we can't re-construct textual form from it (as entered by a
 * template author).
 *
 * @param selectors A collection of parsed CSS selectors
 * @param rawSelectors A collection of CSS selectors in the raw, un-parsed form
 */
export declare function projectionDef(selectors?: CssSelectorList[], textSelectors?: string[]): void;
/**
 * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
 * to the projectionDef instruction.
 *
 * @param nodeIndex
 * @param selectorIndex:
 *        - 0 when the selector is `*` (or unspecified as this is the default value),
 *        - 1 based index of the selector from the {@link projectionDef}
 */
export declare function projection(nodeIndex: number, selectorIndex?: number, attrs?: string[]): void;
/**
 * Adds LViewData or LContainer to the end of the current view tree.
 *
 * This structure will be used to traverse through nested views to remove listeners
 * and call onDestroy callbacks.
 *
 * @param currentView The view where LViewData or LContainer should be added
 * @param adjustedHostIndex Index of the view's host node in LViewData[], adjusted for header
 * @param state The LViewData or LContainer to add to the view tree
 * @returns The state passed in
 */
export declare function addToViewTree<T extends LViewData | LContainer>(currentView: LViewData, adjustedHostIndex: number, state: T): T;
/** If node is an OnPush component, marks its LViewData dirty. */
export declare function markDirtyIfOnPush(viewIndex: number): void;
/** Wraps an event listener with preventDefault behavior. */
export declare function wrapListenerWithPreventDefault(listenerFn: (e?: any) => any): EventListener;
/** Marks current view and all ancestors dirty */
export declare function markViewDirty(view: LViewData): void;
/**
 * Used to schedule change detection on the whole application.
 *
 * Unlike `tick`, `scheduleTick` coalesces multiple calls into one change detection run.
 * It is usually called indirectly by calling `markDirty` when the view needs to be
 * re-rendered.
 *
 * Typically `scheduleTick` uses `requestAnimationFrame` to coalesce multiple
 * `scheduleTick` requests. The scheduling function can be overridden in
 * `renderComponent`'s `scheduler` option.
 */
export declare function scheduleTick<T>(rootContext: RootContext, flags: RootContextFlags): void;
/**
 * Used to perform change detection on the whole application.
 *
 * This is equivalent to `detectChanges`, but invoked on root component. Additionally, `tick`
 * executes lifecycle hooks and conditionally checks components based on their
 * `ChangeDetectionStrategy` and dirtiness.
 *
 * The preferred way to trigger change detection is to call `markDirty`. `markDirty` internally
 * schedules `tick` using a scheduler in order to coalesce multiple `markDirty` calls into a
 * single change detection run. By default, the scheduler is `requestAnimationFrame`, but can
 * be changed when calling `renderComponent` and providing the `scheduler` option.
 */
export declare function tick<T>(component: T): void;
/**
 * Synchronously perform change detection on a component (and possibly its sub-components).
 *
 * This function triggers change detection in a synchronous way on a component. There should
 * be very little reason to call this function directly since a preferred way to do change
 * detection is to {@link markDirty} the component and wait for the scheduler to call this method
 * at some future point in time. This is because a single user action often results in many
 * components being invalidated and calling change detection on each component synchronously
 * would be inefficient. It is better to wait until all components are marked as dirty and
 * then perform single change detection across all of the components
 *
 * @param component The component which the change detection should be performed on.
 */
export declare function detectChanges<T>(component: T): void;
/**
 * Synchronously perform change detection on a root view and its components.
 *
 * @param lViewData The view which the change detection should be performed on.
 */
export declare function detectChangesInRootView(lViewData: LViewData): void;
/**
 * Checks the change detector and its children, and throws if any changes are detected.
 *
 * This is used in development mode to verify that running change detection doesn't
 * introduce other changes.
 */
export declare function checkNoChanges<T>(component: T): void;
/**
 * Checks the change detector on a root view and its components, and throws if any changes are
 * detected.
 *
 * This is used in development mode to verify that running change detection doesn't
 * introduce other changes.
 *
 * @param lViewData The view which the change detection should be checked on.
 */
export declare function checkNoChangesInRootView(lViewData: LViewData): void;
/** Checks the view of the component provided. Does not gate on dirty checks or execute doCheck. */
export declare function detectChangesInternal<T>(hostView: LViewData, component: T): void;
/**
 * Mark the component as dirty (needing change detection).
 *
 * Marking a component dirty will schedule a change detection on this
 * component at some point in the future. Marking an already dirty
 * component as dirty is a noop. Only one outstanding change detection
 * can be scheduled per component tree. (Two components bootstrapped with
 * separate `renderComponent` will have separate schedulers)
 *
 * When the root component is bootstrapped with `renderComponent`, a scheduler
 * can be provided.
 *
 * @param component Component to mark as dirty.
 */
export declare function markDirty<T>(component: T): void;
export interface NO_CHANGE {
    brand: 'NO_CHANGE';
}
/** A special value which designates that a value has not changed. */
export declare const NO_CHANGE: NO_CHANGE;
/**
 * Creates a single value binding.
 *
 * @param value Value to diff
 */
export declare function bind<T>(value: T): T | NO_CHANGE;
/**
 * Create interpolation bindings with a variable number of expressions.
 *
 * If there are 1 to 8 expressions `interpolation1()` to `interpolation8()` should be used instead.
 * Those are faster because there is no need to create an array of expressions and iterate over it.
 *
 * `values`:
 * - has static text at even indexes,
 * - has evaluated expressions at odd indexes.
 *
 * Returns the concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export declare function interpolationV(values: any[]): string | NO_CHANGE;
/**
 * Creates an interpolation binding with 1 expression.
 *
 * @param prefix static value used for concatenation only.
 * @param v0 value checked for change.
 * @param suffix static value used for concatenation only.
 */
export declare function interpolation1(prefix: string, v0: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation binding with 2 expressions. */
export declare function interpolation2(prefix: string, v0: any, i0: string, v1: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation binding with 3 expressions. */
export declare function interpolation3(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, suffix: string): string | NO_CHANGE;
/** Create an interpolation binding with 4 expressions. */
export declare function interpolation4(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, i2: string, v3: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation binding with 5 expressions. */
export declare function interpolation5(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, i2: string, v3: any, i3: string, v4: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation binding with 6 expressions. */
export declare function interpolation6(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, i2: string, v3: any, i3: string, v4: any, i4: string, v5: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation binding with 7 expressions. */
export declare function interpolation7(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, i2: string, v3: any, i3: string, v4: any, i4: string, v5: any, i5: string, v6: any, suffix: string): string | NO_CHANGE;
/** Creates an interpolation binding with 8 expressions. */
export declare function interpolation8(prefix: string, v0: any, i0: string, v1: any, i1: string, v2: any, i2: string, v3: any, i3: string, v4: any, i4: string, v5: any, i5: string, v6: any, i6: string, v7: any, suffix: string): string | NO_CHANGE;
/** Store a value in the `data` at a given `index`. */
export declare function store<T>(index: number, value: T): void;
/**
 * Retrieves a local reference from the current contextViewData.
 *
 * If the reference to retrieve is in a parent view, this instruction is used in conjunction
 * with a nextContext() call, which walks up the tree and updates the contextViewData instance.
 *
 * @param index The index of the local ref in contextViewData.
 */
export declare function reference<T>(index: number): T;
export declare function loadQueryList<T>(queryListIdx: number): QueryList<T>;
/** Retrieves a value from current `viewData`. */
export declare function load<T>(index: number): T;
/** Gets the current binding value. */
export declare function getBinding(bindingIndex: number): any;
/** Updates binding if changed, then returns whether it was updated. */
export declare function bindingUpdated(bindingIndex: number, value: any): boolean;
/** Updates binding and returns the value. */
export declare function updateBinding(bindingIndex: number, value: any): any;
/** Updates 2 bindings if changed, then returns whether either was updated. */
export declare function bindingUpdated2(bindingIndex: number, exp1: any, exp2: any): boolean;
/** Updates 3 bindings if changed, then returns whether any was updated. */
export declare function bindingUpdated3(bindingIndex: number, exp1: any, exp2: any, exp3: any): boolean;
/** Updates 4 bindings if changed, then returns whether any was updated. */
export declare function bindingUpdated4(bindingIndex: number, exp1: any, exp2: any, exp3: any, exp4: any): boolean;
export declare function getTView(): TView;
/**
 * Registers a QueryList, associated with a content query, for later refresh (part of a view
 * refresh).
 */
export declare function registerContentQuery<Q>(queryList: QueryList<Q>): void;
export declare function assertPreviousIsParent(): void;
export declare const CLEAN_PROMISE: Promise<null>;
