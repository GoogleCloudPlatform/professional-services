/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { assertDefined, assertEqual, assertLessThan, assertNotEqual } from './assert';
import { attachPatchData, getComponentViewByInstance } from './context_discovery';
import { throwCyclicDependencyError, throwErrorIfNoChangesMode, throwMultipleComponentError } from './errors';
import { executeHooks, executeInitHooks, queueInitHooks, queueLifecycleHooks } from './hooks';
import { ACTIVE_INDEX, VIEWS } from './interfaces/container';
import { INJECTOR_SIZE } from './interfaces/injector';
import { NG_PROJECT_AS_ATTR_NAME } from './interfaces/projection';
import { isProceduralRenderer } from './interfaces/renderer';
import { BINDING_INDEX, CLEANUP, CONTAINER_INDEX, CONTENT_QUERIES, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, HOST_NODE, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, SANITIZER, TAIL, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { appendChild, appendProjectedNode, createTextNode, findComponentView, getLViewChild, getRenderParent, insertView, removeView } from './node_manipulation';
import { isNodeMatchingSelectorList, matchingSelectorIndex } from './node_selector_matcher';
import { createStylingContextTemplate, renderStyleAndClassBindings, updateClassProp as updateElementClassProp, updateStyleProp as updateElementStyleProp, updateStylingMap } from './styling/class_and_style_bindings';
import { BoundPlayerFactory } from './styling/player_factory';
import { getStylingContext } from './styling/util';
import { assertDataInRangeInternal, getComponentViewByIndex, getNativeByIndex, getNativeByTNode, getRootContext, getRootView, getTNode, isComponent, isContentQueryHost, isDifferent, loadInternal, readPatchedLViewData, stringify } from './util';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
var _CLEAN_PROMISE = Promise.resolve(null);
/**
 * Token set in currentMatches while dependencies are being resolved.
 *
 * If we visit a directive that has a value set to CIRCULAR, we know we've
 * already seen it, and thus have a circular dependency.
 */
export var CIRCULAR = '__CIRCULAR__';
/**
 * This property gets set before entering a template.
 *
 * This renderer can be one of two varieties of Renderer3:
 *
 * - ObjectedOrientedRenderer3
 *
 * This is the native browser API style, e.g. operations are methods on individual objects
 * like HTMLElement. With this style, no additional code is needed as a facade (reducing payload
 * size).
 *
 * - ProceduralRenderer3
 *
 * In non-native browser environments (e.g. platforms such as web-workers), this is the facade
 * that enables element manipulation. This also facilitates backwards compatibility with
 * Renderer2.
 */
var renderer;
export function getRenderer() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return renderer;
}
var rendererFactory;
export function getRendererFactory() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return rendererFactory;
}
export function getCurrentSanitizer() {
    return viewData && viewData[SANITIZER];
}
/**
 * Store the element depth count. This is used to identify the root elements of the template
 * so that we can than attach `LViewData` to only those elements.
 */
var elementDepthCount;
/**
 * Stores whether directives should be matched to elements.
 *
 * When template contains `ngNonBindable` than we need to prevent the runtime form matching
 * directives on children of that element.
 *
 * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 * </div>
 * ```
 */
var bindingsEnabled;
/**
 * Returns the current OpaqueViewState instance.
 *
 * Used in conjunction with the restoreView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 */
export function getCurrentView() {
    return viewData;
}
/**
 * Restores `contextViewData` to the given OpaqueViewState instance.
 *
 * Used in conjunction with the getCurrentView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 *
 * @param viewToRestore The OpaqueViewState instance to restore.
 */
export function restoreView(viewToRestore) {
    contextViewData = viewToRestore;
}
/** Used to set the parent property when nodes are created and track query results. */
var previousOrParentTNode;
export function getPreviousOrParentTNode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return previousOrParentTNode;
}
export function setEnvironment(tNode, view) {
    previousOrParentTNode = tNode;
    viewData = view;
}
/**
 * If `isParent` is:
 *  - `true`: then `previousOrParentTNode` points to a parent node.
 *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
 */
var isParent;
var tView;
var currentQueries;
/**
 * Query instructions can ask for "current queries" in 2 different cases:
 * - when creating view queries (at the root of a component view, before any node is created - in
 * this case currentQueries points to view queries)
 * - when creating content queries (i.e. this previousOrParentTNode points to a node on which we
 * create content queries).
 */
export function getOrCreateCurrentQueries(QueryType) {
    // if this is the first content query on a node, any existing LQueries needs to be cloned
    // in subsequent template passes, the cloning occurs before directive instantiation.
    if (previousOrParentTNode && previousOrParentTNode !== viewData[HOST_NODE] &&
        !isContentQueryHost(previousOrParentTNode)) {
        currentQueries && (currentQueries = currentQueries.clone());
        previousOrParentTNode.flags |= 16384 /* hasContentQuery */;
    }
    return currentQueries || (currentQueries = new QueryType(null, null, null));
}
/**
 * This property gets set before entering a template.
 */
var creationMode;
export function getCreationMode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return creationMode;
}
/**
 * State of the current view being processed.
 *
 * An array of nodes (text, element, container, etc), pipes, their bindings, and
 * any local variables that need to be stored between invocations.
 */
var viewData;
/**
 * Internal function that returns the current LViewData instance.
 *
 * The getCurrentView() instruction should be used for anything public.
 */
export function _getViewData() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return viewData;
}
/**
 * The last viewData retrieved by nextContext().
 * Allows building nextContext() and reference() calls.
 *
 * e.g. const inner = x().$implicit; const outer = x().$implicit;
 */
var contextViewData = null;
function getCleanup(view) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return view[CLEANUP] || (view[CLEANUP] = []);
}
function getTViewCleanup(view) {
    return view[TVIEW].cleanup || (view[TVIEW].cleanup = []);
}
/**
 * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
 *
 * Necessary to support ChangeDetectorRef.checkNoChanges().
 */
var checkNoChangesMode = false;
/** Whether or not this is the first time the current view has been processed. */
var firstTemplatePass = true;
/**
 * The root index from which pure function instructions should calculate their binding
 * indices. In component views, this is TView.bindingStartIndex. In a host binding
 * context, this is the TView.expandoStartIndex + any dirs/hostVars before the given dir.
 */
var bindingRootIndex = -1;
// top level variables should not be exported for performance reasons (PERF_NOTES.md)
export function getBindingRoot() {
    return bindingRootIndex;
}
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
export function enterView(newView, hostTNode) {
    var oldView = viewData;
    tView = newView && newView[TVIEW];
    creationMode = newView && (newView[FLAGS] & 1 /* CreationMode */) === 1 /* CreationMode */;
    firstTemplatePass = newView && tView.firstTemplatePass;
    bindingRootIndex = newView && tView.bindingStartIndex;
    renderer = newView && newView[RENDERER];
    previousOrParentTNode = hostTNode;
    isParent = true;
    viewData = contextViewData = newView;
    oldView && (oldView[QUERIES] = currentQueries);
    currentQueries = newView && newView[QUERIES];
    return oldView;
}
/**
 * Used in lieu of enterView to make it clear when we are exiting a child view. This makes
 * the direction of traversal (up or down the view tree) a bit clearer.
 *
 * @param newView New state to become active
 * @param creationOnly An optional boolean to indicate that the view was processed in creation mode
 * only, i.e. the first update will be done later. Only possible for dynamically created views.
 */
export function leaveView(newView, creationOnly) {
    if (!creationOnly) {
        if (!checkNoChangesMode) {
            executeHooks(viewData, tView.viewHooks, tView.viewCheckHooks, creationMode);
        }
        // Views are clean and in update mode after being checked, so these bits are cleared
        viewData[FLAGS] &= ~(1 /* CreationMode */ | 4 /* Dirty */);
    }
    viewData[FLAGS] |= 16 /* RunInit */;
    viewData[BINDING_INDEX] = tView.bindingStartIndex;
    enterView(newView, null);
}
/**
 * Refreshes the view, executing the following steps in that order:
 * triggers init hooks, refreshes dynamic embedded views, triggers content hooks, sets host
 * bindings, refreshes child components.
 * Note: view hooks are triggered later when leaving the view.
 */
function refreshDescendantViews() {
    setHostBindings();
    var parentFirstTemplatePass = firstTemplatePass;
    // This needs to be set before children are processed to support recursive components
    tView.firstTemplatePass = firstTemplatePass = false;
    if (!checkNoChangesMode) {
        executeInitHooks(viewData, tView, creationMode);
    }
    refreshDynamicEmbeddedViews(viewData);
    // Content query results must be refreshed before content hooks are called.
    refreshContentQueries(tView);
    if (!checkNoChangesMode) {
        executeHooks(viewData, tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
    refreshChildComponents(tView.components, parentFirstTemplatePass);
}
/** Sets the host bindings for the current view. */
export function setHostBindings() {
    if (tView.expandoInstructions) {
        bindingRootIndex = viewData[BINDING_INDEX] = tView.expandoStartIndex;
        var currentDirectiveIndex = -1;
        var currentElementIndex = -1;
        for (var i = 0; i < tView.expandoInstructions.length; i++) {
            var instruction = tView.expandoInstructions[i];
            if (typeof instruction === 'number') {
                if (instruction <= 0) {
                    // Negative numbers mean that we are starting new EXPANDO block and need to update
                    // the current element and directive index.
                    currentElementIndex = -instruction;
                    if (typeof viewData[bindingRootIndex] === 'number') {
                        // We've hit an injector. It may or may not exist depending on whether
                        // there is a public directive on this node.
                        bindingRootIndex += INJECTOR_SIZE;
                    }
                    currentDirectiveIndex = bindingRootIndex;
                }
                else {
                    // This is either the injector size (so the binding root can skip over directives
                    // and get to the first set of host bindings on this node) or the host var count
                    // (to get to the next set of host bindings on this node).
                    bindingRootIndex += instruction;
                }
            }
            else {
                // If it's not a number, it's a host binding function that needs to be executed.
                viewData[BINDING_INDEX] = bindingRootIndex;
                // We must subtract the header offset because the load() instruction
                // expects a raw, unadjusted index.
                instruction(currentDirectiveIndex - HEADER_OFFSET, currentElementIndex);
                currentDirectiveIndex++;
            }
        }
    }
}
/** Refreshes content queries for all directives in the given view. */
function refreshContentQueries(tView) {
    if (tView.contentQueries != null) {
        for (var i = 0; i < tView.contentQueries.length; i += 2) {
            var directiveDefIdx = tView.contentQueries[i];
            var directiveDef = tView.data[directiveDefIdx];
            directiveDef.contentQueriesRefresh(directiveDefIdx - HEADER_OFFSET, tView.contentQueries[i + 1]);
        }
    }
}
/** Refreshes child components in the current view. */
function refreshChildComponents(components, parentFirstTemplatePass) {
    if (components != null) {
        for (var i = 0; i < components.length; i++) {
            componentRefresh(components[i], parentFirstTemplatePass);
        }
    }
}
export function executeInitAndContentHooks() {
    if (!checkNoChangesMode) {
        executeInitHooks(viewData, tView, creationMode);
        executeHooks(viewData, tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
}
export function createLViewData(renderer, tView, context, flags, sanitizer) {
    var instance = tView.blueprint.slice();
    instance[FLAGS] = flags | 1 /* CreationMode */ | 8 /* Attached */ | 16 /* RunInit */;
    instance[PARENT] = instance[DECLARATION_VIEW] = viewData;
    instance[CONTEXT] = context;
    instance[INJECTOR] = viewData ? viewData[INJECTOR] : null;
    instance[RENDERER] = renderer;
    instance[SANITIZER] = sanitizer || null;
    return instance;
}
export function createNodeAtIndex(index, type, native, name, attrs) {
    var adjustedIndex = index + HEADER_OFFSET;
    ngDevMode &&
        assertLessThan(adjustedIndex, viewData.length, "Slot should have been initialized with null");
    viewData[adjustedIndex] = native;
    var tNode = tView.data[adjustedIndex];
    if (tNode == null) {
        tNode = tView.data[adjustedIndex] = createTNode(type, adjustedIndex, name, attrs, null);
        // Now link ourselves into the tree.
        if (previousOrParentTNode) {
            if (isParent && previousOrParentTNode.child == null &&
                (tNode.parent !== null || previousOrParentTNode.type === 2 /* View */)) {
                // We are in the same view, which means we are adding content node to the parent view.
                previousOrParentTNode.child = tNode;
            }
            else if (!isParent) {
                previousOrParentTNode.next = tNode;
            }
        }
    }
    if (tView.firstChild == null && type === 3 /* Element */) {
        tView.firstChild = tNode;
    }
    previousOrParentTNode = tNode;
    isParent = true;
    return tNode;
}
export function createViewNode(index, view) {
    // View nodes are not stored in data because they can be added / removed at runtime (which
    // would cause indices to change). Their TNodes are instead stored in tView.node.
    if (view[TVIEW].node == null) {
        view[TVIEW].node = createTNode(2 /* View */, index, null, null, null);
    }
    isParent = true;
    return previousOrParentTNode = view[HOST_NODE] = view[TVIEW].node;
}
/**
 * When elements are created dynamically after a view blueprint is created (e.g. through
 * i18nApply() or ComponentFactory.create), we need to adjust the blueprint for future
 * template passes.
 */
export function adjustBlueprintForNewNode(view) {
    var tView = view[TVIEW];
    if (tView.firstTemplatePass) {
        tView.expandoStartIndex++;
        tView.blueprint.push(null);
        view.push(null);
    }
}
//////////////////////////
//// Render
//////////////////////////
/**
 * Resets the application state.
 */
export function resetComponentState() {
    isParent = false;
    previousOrParentTNode = null;
    elementDepthCount = 0;
    bindingsEnabled = true;
}
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
export function renderTemplate(hostNode, templateFn, consts, vars, context, providedRendererFactory, hostView, directives, pipes, sanitizer) {
    if (hostView == null) {
        resetComponentState();
        rendererFactory = providedRendererFactory;
        renderer = providedRendererFactory.createRenderer(null, null);
        // We need to create a root view so it's possible to look up the host element through its index
        tView = createTView(-1, null, 1, 0, null, null, null);
        viewData = createLViewData(renderer, tView, {}, 2 /* CheckAlways */ | 64 /* IsRoot */);
        var componentTView = getOrCreateTView(templateFn, consts, vars, directives || null, pipes || null, null);
        hostView =
            createLViewData(renderer, componentTView, context, 2 /* CheckAlways */, sanitizer);
        hostView[HOST_NODE] = createNodeAtIndex(0, 3 /* Element */, hostNode, null, null);
    }
    renderComponentOrTemplate(hostView, context, templateFn);
    return hostView;
}
/**
 * Used for creating the LViewNode of a dynamic embedded view,
 * either through ViewContainerRef.createEmbeddedView() or TemplateRef.createEmbeddedView().
 * Such lViewNode will then be renderer with renderEmbeddedTemplate() (see below).
 */
export function createEmbeddedViewAndNode(tView, context, declarationView, renderer, queries, injectorIndex) {
    var _isParent = isParent;
    var _previousOrParentTNode = previousOrParentTNode;
    isParent = true;
    previousOrParentTNode = null;
    var lView = createLViewData(renderer, tView, context, 2 /* CheckAlways */, getCurrentSanitizer());
    lView[DECLARATION_VIEW] = declarationView;
    if (queries) {
        lView[QUERIES] = queries.createView();
    }
    createViewNode(-1, lView);
    if (tView.firstTemplatePass) {
        tView.node.injectorIndex = injectorIndex;
    }
    isParent = _isParent;
    previousOrParentTNode = _previousOrParentTNode;
    return lView;
}
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
export function renderEmbeddedTemplate(viewToRender, tView, context, rf) {
    var _isParent = isParent;
    var _previousOrParentTNode = previousOrParentTNode;
    var oldView;
    if (viewToRender[FLAGS] & 64 /* IsRoot */) {
        // This is a root view inside the view tree
        tickRootContext(viewToRender[CONTEXT]);
    }
    else {
        try {
            isParent = true;
            previousOrParentTNode = null;
            oldView = enterView(viewToRender, viewToRender[HOST_NODE]);
            namespaceHTML();
            tView.template(rf, context);
            if (rf & 2 /* Update */) {
                refreshDescendantViews();
            }
            else {
                // This must be set to false immediately after the first creation run because in an
                // ngFor loop, all the views will be created together before update mode runs and turns
                // off firstTemplatePass. If we don't set it here, instances will perform directive
                // matching, etc again and again.
                viewToRender[TVIEW].firstTemplatePass = firstTemplatePass = false;
            }
        }
        finally {
            // renderEmbeddedTemplate() is called twice, once for creation only and then once for
            // update. When for creation only, leaveView() must not trigger view hooks, nor clean flags.
            var isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
            leaveView(oldView, isCreationOnly);
            isParent = _isParent;
            previousOrParentTNode = _previousOrParentTNode;
        }
    }
}
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
export function nextContext(level) {
    if (level === void 0) { level = 1; }
    contextViewData = walkUpViews(level, contextViewData);
    return contextViewData[CONTEXT];
}
export function renderComponentOrTemplate(hostView, componentOrContext, templateFn) {
    var oldView = enterView(hostView, hostView[HOST_NODE]);
    try {
        if (rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (templateFn) {
            namespaceHTML();
            templateFn(getRenderFlags(hostView), componentOrContext);
            refreshDescendantViews();
        }
        else {
            executeInitAndContentHooks();
            // Element was stored at 0 in data and directive was stored at 0 in directives
            // in renderComponent()
            setHostBindings();
            componentRefresh(HEADER_OFFSET, false);
        }
    }
    finally {
        if (rendererFactory.end) {
            rendererFactory.end();
        }
        leaveView(oldView);
    }
}
/**
 * This function returns the default configuration of rendering flags depending on when the
 * template is in creation mode or update mode. By default, the update block is run with the
 * creation block when the view is in creation mode. Otherwise, the update block is run
 * alone.
 *
 * Dynamically created views do NOT use this configuration (update block and create block are
 * always run separately).
 */
function getRenderFlags(view) {
    return view[FLAGS] & 1 /* CreationMode */ ? 1 /* Create */ | 2 /* Update */ :
        2 /* Update */;
}
//////////////////////////
//// Namespace
//////////////////////////
var _currentNamespace = null;
export function namespaceSVG() {
    _currentNamespace = 'http://www.w3.org/2000/svg/';
}
export function namespaceMathML() {
    _currentNamespace = 'http://www.w3.org/1998/MathML/';
}
export function namespaceHTML() {
    _currentNamespace = null;
}
//////////////////////////
//// Element
//////////////////////////
/**
 * Creates an empty element using {@link elementStart} and {@link elementEnd}
 *
 * @param index Index of the element in the data array
 * @param name Name of the DOM Node
 * @param attrs Statically bound set of attributes to be written into the DOM element on creation.
 * @param localRefs A set of local reference bindings on the element.
 */
export function element(index, name, attrs, localRefs) {
    elementStart(index, name, attrs, localRefs);
    elementEnd();
}
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
export function elementContainerStart(index, attrs, localRefs) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'element containers should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateComment++;
    var native = renderer.createComment(ngDevMode ? 'ng-container' : '');
    ngDevMode && assertDataInRange(index - 1);
    var tNode = createNodeAtIndex(index, 4 /* ElementContainer */, native, null, attrs || null);
    appendChild(native, tNode, viewData);
    createDirectivesAndLocals(localRefs);
}
/** Mark the end of the <ng-container>. */
export function elementContainerEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertHasParent();
        previousOrParentTNode = previousOrParentTNode.parent;
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 4 /* ElementContainer */);
    currentQueries &&
        (currentQueries = currentQueries.addNode(previousOrParentTNode));
    queueLifecycleHooks(previousOrParentTNode.flags, tView);
}
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
export function elementStart(index, name, attrs, localRefs) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'elements should be created before any bindings ');
    ngDevMode && ngDevMode.rendererCreateElement++;
    var native = elementCreate(name);
    ngDevMode && assertDataInRange(index - 1);
    var tNode = createNodeAtIndex(index, 3 /* Element */, native, name, attrs || null);
    if (attrs) {
        setUpAttributes(native, attrs);
    }
    appendChild(native, tNode, viewData);
    createDirectivesAndLocals(localRefs);
    // any immediate children of a component or template container must be pre-emptively
    // monkey-patched with the component view data so that the element can be inspected
    // later on using any element discovery utility methods (see `element_discovery.ts`)
    if (elementDepthCount === 0) {
        attachPatchData(native, viewData);
    }
    elementDepthCount++;
}
/**
 * Creates a native element from a tag name, using a renderer.
 * @param name the tag name
 * @param overriddenRenderer Optional A renderer to override the default one
 * @returns the element created
 */
export function elementCreate(name, overriddenRenderer) {
    var native;
    var rendererToUse = overriddenRenderer || renderer;
    if (isProceduralRenderer(rendererToUse)) {
        native = rendererToUse.createElement(name, _currentNamespace);
    }
    else {
        if (_currentNamespace === null) {
            native = rendererToUse.createElement(name);
        }
        else {
            native = rendererToUse.createElementNS(_currentNamespace, name);
        }
    }
    return native;
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param localRefs Local refs of the node in question
 * @param localRefExtractor mapping function that extracts local ref value from TNode
 */
function createDirectivesAndLocals(localRefs, localRefExtractor) {
    if (localRefExtractor === void 0) { localRefExtractor = getNativeByTNode; }
    if (!bindingsEnabled)
        return;
    if (firstTemplatePass) {
        ngDevMode && ngDevMode.firstTemplatePass++;
        cacheMatchingDirectivesForNode(previousOrParentTNode, tView, localRefs || null);
    }
    else {
        instantiateDirectivesDirectly();
    }
    saveResolvedLocalsInData(localRefExtractor);
}
/**
 * On first template pass, we match each node against available directive selectors and save
 * the resulting defs in the correct instantiation order for subsequent change detection runs
 * (so dependencies are always created before the directives that inject them).
 */
function cacheMatchingDirectivesForNode(tNode, tView, localRefs) {
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in tsickle.
    var exportsMap = localRefs ? { '': -1 } : null;
    var matches = tView.currentMatches = findDirectiveMatches(tNode);
    generateExpandoBlock(tNode, matches);
    var totalHostVars = 0;
    if (matches) {
        for (var i = 0; i < matches.length; i += 2) {
            var def = matches[i];
            var valueIndex = i + 1;
            resolveDirective(def, valueIndex, matches);
            totalHostVars += def.hostVars;
            saveNameToExportMap(matches[valueIndex], def, exportsMap);
        }
    }
    if (exportsMap)
        cacheMatchingLocalNames(tNode, localRefs, exportsMap);
    prefillHostVars(totalHostVars);
}
/**
 * Generates a new block in TView.expandoInstructions for this node.
 *
 * Each expando block starts with the element index (turned negative so we can distinguish
 * it from the hostVar count) and the directive count. See more in VIEW_DATA.md.
 */
function generateExpandoBlock(tNode, matches) {
    var directiveCount = matches ? matches.length / 2 : 0;
    var elementIndex = -(tNode.index - HEADER_OFFSET);
    if (directiveCount > 0) {
        (tView.expandoInstructions || (tView.expandoInstructions = [])).push(elementIndex, directiveCount);
    }
}
/**
 * On the first template pass, we need to reserve space for host binding values
 * after directives are matched (so all directives are saved, then bindings).
 * Because we are updating the blueprint, we only need to do this once.
 */
export function prefillHostVars(totalHostVars) {
    for (var i = 0; i < totalHostVars; i++) {
        viewData.push(NO_CHANGE);
        tView.blueprint.push(NO_CHANGE);
        tView.data.push(null);
    }
}
/** Matches the current node against all available selectors. */
function findDirectiveMatches(tNode) {
    var registry = tView.directiveRegistry;
    var matches = null;
    if (registry) {
        for (var i = 0; i < registry.length; i++) {
            var def = registry[i];
            if (isNodeMatchingSelectorList(tNode, def.selectors)) {
                matches || (matches = []);
                if (def.diPublic)
                    def.diPublic(def);
                if (def.template) {
                    if (tNode.flags & 4096 /* isComponent */)
                        throwMultipleComponentError(tNode);
                    addComponentLogic(def);
                    // The component is always stored first with directives after.
                    matches.unshift(def, null);
                }
                else {
                    matches.push(def, null);
                }
            }
        }
    }
    return matches;
}
export function resolveDirective(def, valueIndex, matches) {
    if (matches[valueIndex] === null) {
        matches[valueIndex] = CIRCULAR;
        var instance = def.factory();
        return directiveCreate(matches[valueIndex] = viewData.length, instance, def);
    }
    else if (matches[valueIndex] === CIRCULAR) {
        // If we revisit this directive before it's resolved, we know it's circular
        throwCyclicDependencyError(def.type);
    }
    return null;
}
/** Stores index of component's host element so it will be queued for view refresh during CD. */
function queueComponentIndexForCheck() {
    if (firstTemplatePass) {
        (tView.components || (tView.components = [])).push(previousOrParentTNode.index);
    }
}
/** Stores index of directive and host element so it will be queued for binding refresh during CD.
 */
export function queueHostBindingForCheck(dirIndex, def) {
    ngDevMode &&
        assertEqual(firstTemplatePass, true, 'Should only be called in first template pass.');
    tView.expandoInstructions.push(def.hostBindings, def.hostVars);
}
/**
 * This function instantiates the given directives.
 */
function instantiateDirectivesDirectly() {
    ngDevMode && assertEqual(firstTemplatePass, false, "Directives should only be instantiated directly after first template pass");
    var count = previousOrParentTNode.flags & 4095 /* DirectiveCountMask */;
    if (isContentQueryHost(previousOrParentTNode) && currentQueries) {
        currentQueries = currentQueries.clone();
    }
    if (count > 0) {
        var start = previousOrParentTNode.flags >> 15 /* DirectiveStartingIndexShift */;
        var end = start + count;
        for (var i = start; i < end; i++) {
            var def = tView.data[i];
            // Component view must be set on node before the factory is created so
            // ChangeDetectorRefs have a way to store component view on creation.
            if (def.template) {
                addComponentLogic(def);
            }
            directiveCreate(i, def.factory(), def);
        }
    }
}
/** Caches local names and their matching directive indices for query and template lookups. */
function cacheMatchingLocalNames(tNode, localRefs, exportsMap) {
    if (localRefs) {
        var localNames = tNode.localNames = [];
        // Local names must be stored in tNode in the same order that localRefs are defined
        // in the template to ensure the data is loaded in the same slots as their refs
        // in the template (for template queries).
        for (var i = 0; i < localRefs.length; i += 2) {
            var index = exportsMap[localRefs[i + 1]];
            if (index == null)
                throw new Error("Export of name '" + localRefs[i + 1] + "' not found!");
            localNames.push(localRefs[i], index);
        }
    }
}
/**
 * Builds up an export map as directives are created, so local refs can be quickly mapped
 * to their directive instances.
 */
function saveNameToExportMap(index, def, exportsMap) {
    if (exportsMap) {
        if (def.exportAs)
            exportsMap[def.exportAs] = index;
        if (def.template)
            exportsMap[''] = index;
    }
}
/**
 * Takes a list of local names and indices and pushes the resolved local variable values
 * to LViewData in the same order as they are loaded in the template with load().
 */
function saveResolvedLocalsInData(localRefExtractor) {
    var localNames = previousOrParentTNode.localNames;
    var tNode = previousOrParentTNode;
    if (localNames) {
        var localIndex = previousOrParentTNode.index + 1;
        for (var i = 0; i < localNames.length; i += 2) {
            var index = localNames[i + 1];
            var value = index === -1 ? localRefExtractor(tNode, viewData) : viewData[index];
            viewData[localIndex++] = value;
        }
    }
}
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
export function getOrCreateTView(templateFn, consts, vars, directives, pipes, viewQuery) {
    // TODO(misko): reading `ngPrivateData` here is problematic for two reasons
    // 1. It is a megamorphic call on each invocation.
    // 2. For nested embedded views (ngFor inside ngFor) the template instance is per
    //    outer template invocation, which means that no such property will exist
    // Correct solution is to only put `ngPrivateData` on the Component template
    // and not on embedded templates.
    return templateFn.ngPrivateData ||
        (templateFn.ngPrivateData =
            createTView(-1, templateFn, consts, vars, directives, pipes, viewQuery));
}
/**
 * Creates a TView instance
 *
 * @param viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param templateFn Template function
 * @param consts The number of nodes, local refs, and pipes in this template
 * @param directives Registry of directives for this view
 * @param pipes Registry of pipes for this view
 */
export function createTView(viewIndex, templateFn, consts, vars, directives, pipes, viewQuery) {
    ngDevMode && ngDevMode.tView++;
    var bindingStartIndex = HEADER_OFFSET + consts;
    // This length does not yet contain host bindings from child directives because at this point,
    // we don't know which directives are active on this template. As soon as a directive is matched
    // that has a host binding, we will update the blueprint with that def's hostVars count.
    var initialViewLength = bindingStartIndex + vars;
    var blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
    return blueprint[TVIEW] = {
        id: viewIndex,
        blueprint: blueprint,
        template: templateFn,
        viewQuery: viewQuery,
        node: null,
        data: blueprint.slice(),
        childIndex: -1,
        bindingStartIndex: bindingStartIndex,
        expandoStartIndex: initialViewLength,
        expandoInstructions: null,
        firstTemplatePass: true,
        initHooks: null,
        checkHooks: null,
        contentHooks: null,
        contentCheckHooks: null,
        viewHooks: null,
        viewCheckHooks: null,
        destroyHooks: null,
        pipeDestroyHooks: null,
        cleanup: null,
        contentQueries: null,
        components: null,
        directiveRegistry: typeof directives === 'function' ? directives() : directives,
        pipeRegistry: typeof pipes === 'function' ? pipes() : pipes,
        currentMatches: null,
        firstChild: null,
    };
}
function createViewBlueprint(bindingStartIndex, initialViewLength) {
    var blueprint = new Array(initialViewLength)
        .fill(null, 0, bindingStartIndex)
        .fill(NO_CHANGE, bindingStartIndex);
    blueprint[CONTAINER_INDEX] = -1;
    blueprint[BINDING_INDEX] = bindingStartIndex;
    return blueprint;
}
function setUpAttributes(native, attrs) {
    var isProc = isProceduralRenderer(renderer);
    var i = 0;
    while (i < attrs.length) {
        var attrName = attrs[i];
        if (attrName === 1 /* SelectOnly */)
            break;
        if (attrName === NG_PROJECT_AS_ATTR_NAME) {
            i += 2;
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            if (attrName === 0 /* NamespaceURI */) {
                // Namespaced attributes
                var namespaceURI = attrs[i + 1];
                var attrName_1 = attrs[i + 2];
                var attrVal = attrs[i + 3];
                isProc ?
                    renderer
                        .setAttribute(native, attrName_1, attrVal, namespaceURI) :
                    native.setAttributeNS(namespaceURI, attrName_1, attrVal);
                i += 4;
            }
            else {
                // Standard attributes
                var attrVal = attrs[i + 1];
                isProc ?
                    renderer
                        .setAttribute(native, attrName, attrVal) :
                    native.setAttribute(attrName, attrVal);
                i += 2;
            }
        }
    }
}
export function createError(text, token) {
    return new Error("Renderer: " + text + " [" + stringify(token) + "]");
}
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param elementOrSelector Render element or CSS selector to locate the element.
 */
export function locateHostElement(factory, elementOrSelector) {
    ngDevMode && assertDataInRange(-1);
    rendererFactory = factory;
    var defaultRenderer = factory.createRenderer(null, null);
    var rNode = typeof elementOrSelector === 'string' ?
        (isProceduralRenderer(defaultRenderer) ?
            defaultRenderer.selectRootElement(elementOrSelector) :
            defaultRenderer.querySelector(elementOrSelector)) :
        elementOrSelector;
    if (ngDevMode && !rNode) {
        if (typeof elementOrSelector === 'string') {
            throw createError('Host node with selector not found:', elementOrSelector);
        }
        else {
            throw createError('Host node is required:', elementOrSelector);
        }
    }
    return rNode;
}
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
export function listener(eventName, listenerFn, useCapture) {
    if (useCapture === void 0) { useCapture = false; }
    var tNode = previousOrParentTNode;
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
    // add native event listener - applicable to elements only
    if (tNode.type === 3 /* Element */) {
        var native = getNativeByTNode(previousOrParentTNode, viewData);
        ngDevMode && ngDevMode.rendererAddEventListener++;
        // In order to match current behavior, native DOM event listeners must be added for all
        // events (including outputs).
        if (isProceduralRenderer(renderer)) {
            var cleanupFn = renderer.listen(native, eventName, listenerFn);
            storeCleanupFn(viewData, cleanupFn);
        }
        else {
            var wrappedListener = wrapListenerWithPreventDefault(listenerFn);
            native.addEventListener(eventName, wrappedListener, useCapture);
            var cleanupInstances = getCleanup(viewData);
            cleanupInstances.push(wrappedListener);
            if (firstTemplatePass) {
                getTViewCleanup(viewData).push(eventName, tNode.index, cleanupInstances.length - 1, useCapture);
            }
        }
    }
    // subscribe to directive outputs
    if (tNode.outputs === undefined) {
        // if we create TNode here, inputs must be undefined so we know they still need to be
        // checked
        tNode.outputs = generatePropertyAliases(tNode.flags, 1 /* Output */);
    }
    var outputs = tNode.outputs;
    var outputData;
    if (outputs && (outputData = outputs[eventName])) {
        createOutput(outputData, listenerFn);
    }
}
/**
 * Iterates through the outputs associated with a particular event name and subscribes to
 * each output.
 */
function createOutput(outputs, listener) {
    for (var i = 0; i < outputs.length; i += 2) {
        ngDevMode && assertDataInRange(outputs[i], viewData);
        var subscription = viewData[outputs[i]][outputs[i + 1]].subscribe(listener);
        storeCleanupWithContext(viewData, subscription, subscription.unsubscribe);
    }
}
/**
 * Saves context for this cleanup function in LView.cleanupInstances.
 *
 * On the first template pass, saves in TView:
 * - Cleanup function
 * - Index of context we just saved in LView.cleanupInstances
 */
export function storeCleanupWithContext(view, context, cleanupFn) {
    if (!view)
        view = viewData;
    getCleanup(view).push(context);
    if (view[TVIEW].firstTemplatePass) {
        getTViewCleanup(view).push(cleanupFn, view[CLEANUP].length - 1);
    }
}
/**
 * Saves the cleanup function itself in LView.cleanupInstances.
 *
 * This is necessary for functions that are wrapped with their contexts, like in renderer2
 * listeners.
 *
 * On the first template pass, the index of the cleanup function is saved in TView.
 */
export function storeCleanupFn(view, cleanupFn) {
    getCleanup(view).push(cleanupFn);
    if (view[TVIEW].firstTemplatePass) {
        getTViewCleanup(view).push(view[CLEANUP].length - 1, null);
    }
}
/** Mark the end of the element. */
export function elementEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertHasParent();
        previousOrParentTNode = previousOrParentTNode.parent;
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 3 /* Element */);
    currentQueries &&
        (currentQueries = currentQueries.addNode(previousOrParentTNode));
    queueLifecycleHooks(previousOrParentTNode.flags, tView);
    elementDepthCount--;
}
/**
 * Updates the value of removes an attribute on an Element.
 *
 * @param number index The index of the element in the data array
 * @param name name The name of the attribute.
 * @param value value The attribute is removed when value is `null` or `undefined`.
 *                  Otherwise the attribute value is set to the stringified value.
 * @param sanitizer An optional function used to sanitize the value.
 */
export function elementAttribute(index, name, value, sanitizer) {
    if (value !== NO_CHANGE) {
        var element_1 = getNativeByIndex(index, viewData);
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveAttribute++;
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element_1, name) :
                element_1.removeAttribute(name);
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            var strValue = sanitizer == null ? stringify(value) : sanitizer(value);
            isProceduralRenderer(renderer) ? renderer.setAttribute(element_1, name, strValue) :
                element_1.setAttribute(name, strValue);
        }
    }
}
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
export function elementProperty(index, propName, value, sanitizer) {
    if (value === NO_CHANGE)
        return;
    var element = getNativeByIndex(index, viewData);
    var tNode = getTNode(index, viewData);
    // if tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked
    if (tNode && tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(tNode.flags, 0 /* Input */);
    }
    var inputData = tNode && tNode.inputs;
    var dataValue;
    if (inputData && (dataValue = inputData[propName])) {
        setInputsForProperty(dataValue, value);
        if (isComponent(tNode))
            markDirtyIfOnPush(index + HEADER_OFFSET);
    }
    else if (tNode.type === 3 /* Element */) {
        // It is assumed that the sanitizer is only added when the compiler determines that the property
        // is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? sanitizer(value) : value;
        ngDevMode && ngDevMode.rendererSetProperty++;
        isProceduralRenderer(renderer) ?
            renderer.setProperty(element, propName, value) :
            (element.setProperty ? element.setProperty(propName, value) :
                element[propName] = value);
    }
}
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
export function enableBindings() {
    bindingsEnabled = true;
}
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
export function disableBindings() {
    bindingsEnabled = false;
}
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
export function createTNode(type, adjustedIndex, tagName, attrs, tViews) {
    ngDevMode && ngDevMode.tNode++;
    var parent = isParent ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    var parentInSameView = parent && viewData && parent !== viewData[HOST_NODE];
    var tParent = parentInSameView ? parent : null;
    return {
        type: type,
        index: adjustedIndex,
        injectorIndex: tParent ? tParent.injectorIndex : -1,
        flags: 0,
        tagName: tagName,
        attrs: attrs,
        localNames: null,
        initialInputs: undefined,
        inputs: undefined,
        outputs: undefined,
        tViews: tViews,
        next: null,
        child: null,
        parent: tParent,
        detached: null,
        stylingTemplate: null,
        projection: null
    };
}
/**
 * Given a list of directive indices and minified input names, sets the
 * input properties on the corresponding directives.
 */
function setInputsForProperty(inputs, value) {
    for (var i = 0; i < inputs.length; i += 2) {
        ngDevMode && assertDataInRange(inputs[i], viewData);
        viewData[inputs[i]][inputs[i + 1]] = value;
    }
}
/**
 * Consolidates all inputs or outputs of all directives on this logical node.
 *
 * @param number tNodeFlags node flags
 * @param Direction direction whether to consider inputs or outputs
 * @returns PropertyAliases|null aggregate of all properties if any, `null` otherwise
 */
function generatePropertyAliases(tNodeFlags, direction) {
    var count = tNodeFlags & 4095 /* DirectiveCountMask */;
    var propStore = null;
    if (count > 0) {
        var start = tNodeFlags >> 15 /* DirectiveStartingIndexShift */;
        var end = start + count;
        var isInput = direction === 0 /* Input */;
        var defs = tView.data;
        for (var i = start; i < end; i++) {
            var directiveDef = defs[i];
            var propertyAliasMap = isInput ? directiveDef.inputs : directiveDef.outputs;
            for (var publicName in propertyAliasMap) {
                if (propertyAliasMap.hasOwnProperty(publicName)) {
                    propStore = propStore || {};
                    var internalName = propertyAliasMap[publicName];
                    var hasProperty = propStore.hasOwnProperty(publicName);
                    hasProperty ? propStore[publicName].push(i, internalName) :
                        (propStore[publicName] = [i, internalName]);
                }
            }
        }
    }
    return propStore;
}
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
export function elementClassProp(index, stylingIndex, value) {
    var val = (value instanceof BoundPlayerFactory) ? value : (!!value);
    updateElementClassProp(getStylingContext(index, viewData), stylingIndex, val);
}
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
export function elementStyling(classDeclarations, styleDeclarations, styleSanitizer) {
    var tNode = previousOrParentTNode;
    if (!tNode.stylingTemplate) {
        // initialize the styling template.
        tNode.stylingTemplate =
            createStylingContextTemplate(classDeclarations, styleDeclarations, styleSanitizer);
    }
    if (styleDeclarations && styleDeclarations.length ||
        classDeclarations && classDeclarations.length) {
        elementStylingApply(tNode.index - HEADER_OFFSET);
    }
}
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
export function elementStylingApply(index) {
    var totalPlayersQueued = renderStyleAndClassBindings(getStylingContext(index, viewData), renderer, viewData);
    if (totalPlayersQueued > 0) {
        var rootContext = getRootContext(viewData);
        scheduleTick(rootContext, 2 /* FlushPlayers */);
    }
}
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
export function elementStyleProp(index, styleIndex, value, suffix) {
    var valueToAdd = null;
    if (value) {
        if (suffix) {
            // when a suffix is applied then it will bypass
            // sanitization entirely (b/c a new string is created)
            valueToAdd = stringify(value) + suffix;
        }
        else {
            // sanitization happens by dealing with a String value
            // this means that the string value will be passed through
            // into the style rendering later (which is where the value
            // will be sanitized before it is applied)
            valueToAdd = value;
        }
    }
    updateElementStyleProp(getStylingContext(index, viewData), styleIndex, valueToAdd);
}
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
export function elementStylingMap(index, classes, styles) {
    updateStylingMap(getStylingContext(index, viewData), classes, styles);
}
//////////////////////////
//// Text
//////////////////////////
/**
 * Create static text node
 *
 * @param index Index of the node in the data array
 * @param value Value to write. This value will be stringified.
 */
export function text(index, value) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'text nodes should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    var textNative = createTextNode(value, renderer);
    var tNode = createNodeAtIndex(index, 3 /* Element */, textNative, null, null);
    // Text nodes are self closing.
    isParent = false;
    appendChild(textNative, tNode, viewData);
}
/**
 * Create text node with binding
 * Bindings should be handled externally with the proper interpolation(1-8) method
 *
 * @param index Index of the node in the data array.
 * @param value Stringified value to write.
 */
export function textBinding(index, value) {
    if (value !== NO_CHANGE) {
        ngDevMode && assertDataInRange(index + HEADER_OFFSET);
        var element_2 = getNativeByIndex(index, viewData);
        ngDevMode && assertDefined(element_2, 'native element should exist');
        ngDevMode && ngDevMode.rendererSetText++;
        isProceduralRenderer(renderer) ? renderer.setValue(element_2, stringify(value)) :
            element_2.textContent = stringify(value);
    }
}
//////////////////////////
//// Directive
//////////////////////////
/**
 * Create a directive and their associated content queries.
 *
 * NOTE: directives can be created in order other than the index order. They can also
 *       be retrieved before they are created in which case the value will be null.
 *
 * @param directive The directive instance.
 * @param directiveDef DirectiveDef object which contains information about the template.
 */
export function directiveCreate(directiveDefIdx, directive, directiveDef) {
    var native = getNativeByTNode(previousOrParentTNode, viewData);
    var instance = baseDirectiveCreate(directiveDefIdx, directive, directiveDef, native);
    if (directiveDef.template) {
        var componentView = getComponentViewByIndex(previousOrParentTNode.index, viewData);
        componentView[CONTEXT] = directive;
    }
    if (firstTemplatePass) {
        // Init hooks are queued now so ngOnInit is called in host components before
        // any projected components.
        queueInitHooks(directiveDefIdx, directiveDef.onInit, directiveDef.doCheck, tView);
    }
    ngDevMode && assertDefined(previousOrParentTNode, 'previousOrParentTNode');
    if (previousOrParentTNode && previousOrParentTNode.attrs) {
        setInputsFromAttrs(directiveDefIdx, instance, directiveDef.inputs, previousOrParentTNode);
    }
    if (directiveDef.contentQueries) {
        directiveDef.contentQueries();
    }
    return instance;
}
function addComponentLogic(def) {
    var native = getNativeByTNode(previousOrParentTNode, viewData);
    var tView = getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    var componentView = addToViewTree(viewData, previousOrParentTNode.index, createLViewData(rendererFactory.createRenderer(native, def), tView, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    componentView[HOST_NODE] = previousOrParentTNode;
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    componentView[HOST] = viewData[previousOrParentTNode.index];
    viewData[previousOrParentTNode.index] = componentView;
    if (firstTemplatePass) {
        queueComponentIndexForCheck();
        previousOrParentTNode.flags =
            viewData.length << 15 /* DirectiveStartingIndexShift */ | 4096 /* isComponent */;
    }
}
/**
 * A lighter version of directiveCreate() that is used for the root component
 *
 * This version does not contain features that we don't already support at root in
 * current Angular. Example: local refs and inputs on root component.
 */
export function baseDirectiveCreate(index, directive, directiveDef, native) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'directives should be created before any bindings');
    ngDevMode && assertPreviousIsParent();
    attachPatchData(directive, viewData);
    if (native) {
        attachPatchData(native, viewData);
    }
    viewData[index] = directive;
    if (firstTemplatePass) {
        var flags = previousOrParentTNode.flags;
        if (flags === 0) {
            // When the first directive is created:
            // - save the index,
            // - set the number of directives to 1
            previousOrParentTNode.flags =
                index << 15 /* DirectiveStartingIndexShift */ | flags & 4096 /* isComponent */ | 1;
        }
        else {
            // Only need to bump the size when subsequent directives are created
            ngDevMode && assertNotEqual(flags & 4095 /* DirectiveCountMask */, 4095 /* DirectiveCountMask */, 'Reached the max number of directives');
            previousOrParentTNode.flags++;
        }
        tView.data.push(directiveDef);
        tView.blueprint.push(null);
        if (directiveDef.hostBindings)
            queueHostBindingForCheck(index, directiveDef);
    }
    else {
        var diPublic = directiveDef.diPublic;
        if (diPublic)
            diPublic(directiveDef);
    }
    if (directiveDef.attributes != null && previousOrParentTNode.type == 3 /* Element */) {
        setUpAttributes(native, directiveDef.attributes);
    }
    return directive;
}
/**
 * Sets initial input properties on directive instances from attribute data
 *
 * @param directiveIndex Index of the directive in directives array
 * @param instance Instance of the directive on which to set the initial inputs
 * @param inputs The list of inputs from the directive def
 * @param tNode The static data for this node
 */
function setInputsFromAttrs(directiveIndex, instance, inputs, tNode) {
    var initialInputData = tNode.initialInputs;
    if (initialInputData === undefined || directiveIndex >= initialInputData.length) {
        initialInputData = generateInitialInputs(directiveIndex, inputs, tNode);
    }
    var initialInputs = initialInputData[directiveIndex];
    if (initialInputs) {
        for (var i = 0; i < initialInputs.length; i += 2) {
            instance[initialInputs[i]] = initialInputs[i + 1];
        }
    }
}
/**
 * Generates initialInputData for a node and stores it in the template's static storage
 * so subsequent template invocations don't have to recalculate it.
 *
 * initialInputData is an array containing values that need to be set as input properties
 * for directives on this node, but only once on creation. We need this array to support
 * the case where you set an @Input property of a directive using attribute-like syntax.
 * e.g. if you have a `name` @Input, you can set it once like this:
 *
 * <my-component name="Bess"></my-component>
 *
 * @param directiveIndex Index to store the initial input data
 * @param inputs The list of inputs from the directive def
 * @param tNode The static data on this node
 */
function generateInitialInputs(directiveIndex, inputs, tNode) {
    var initialInputData = tNode.initialInputs || (tNode.initialInputs = []);
    initialInputData[directiveIndex] = null;
    var attrs = tNode.attrs;
    var i = 0;
    while (i < attrs.length) {
        var attrName = attrs[i];
        if (attrName === 1 /* SelectOnly */)
            break;
        if (attrName === 0 /* NamespaceURI */) {
            // We do not allow inputs on namespaced attributes.
            i += 4;
            continue;
        }
        var minifiedInputName = inputs[attrName];
        var attrValue = attrs[i + 1];
        if (minifiedInputName !== undefined) {
            var inputsToStore = initialInputData[directiveIndex] || (initialInputData[directiveIndex] = []);
            inputsToStore.push(minifiedInputName, attrValue);
        }
        i += 2;
    }
    return initialInputData;
}
//////////////////////////
//// ViewContainer & View
//////////////////////////
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
export function createLContainer(hostNative, hostTNode, currentView, native, isForViewContainerRef) {
    return [
        isForViewContainerRef ? -1 : 0,
        [],
        currentView,
        null,
        null,
        hostNative,
        native,
        getRenderParent(hostTNode, currentView) // renderParent
    ];
}
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
export function template(index, templateFn, consts, vars, tagName, attrs, localRefs, localRefExtractor) {
    // TODO: consider a separate node type for templates
    var tNode = containerInternal(index, tagName || null, attrs || null);
    if (firstTemplatePass) {
        tNode.tViews = createTView(-1, templateFn, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    createDirectivesAndLocals(localRefs, localRefExtractor);
    currentQueries &&
        (currentQueries = currentQueries.addNode(previousOrParentTNode));
    queueLifecycleHooks(tNode.flags, tView);
    isParent = false;
}
/**
 * Creates an LContainer for inline views, e.g.
 *
 * % if (showing) {
 *   <div></div>
 * % }
 *
 * @param index The index of the container in the data array
 */
export function container(index) {
    var tNode = containerInternal(index, null, null);
    firstTemplatePass && (tNode.tViews = []);
    isParent = false;
}
function containerInternal(index, tagName, attrs) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'container nodes should be created before any bindings');
    var adjustedIndex = index + HEADER_OFFSET;
    var comment = renderer.createComment(ngDevMode ? 'container' : '');
    ngDevMode && ngDevMode.rendererCreateComment++;
    var tNode = createNodeAtIndex(index, 0 /* Container */, comment, tagName, attrs);
    var lContainer = viewData[adjustedIndex] =
        createLContainer(viewData[adjustedIndex], tNode, viewData, comment);
    appendChild(comment, tNode, viewData);
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(viewData, index + HEADER_OFFSET, lContainer);
    if (currentQueries) {
        // prepare place for matching nodes from views inserted into a given container
        lContainer[QUERIES] = currentQueries.container();
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    return tNode;
}
/**
 * Sets a container up to receive views.
 *
 * @param index The index of the container in the data array
 */
export function containerRefreshStart(index) {
    previousOrParentTNode = loadInternal(index, tView.data);
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    isParent = true;
    viewData[index + HEADER_OFFSET][ACTIVE_INDEX] = 0;
    if (!checkNoChangesMode) {
        // We need to execute init hooks here so ngOnInit hooks are called in top level views
        // before they are called in embedded views (for backwards compatibility).
        executeInitHooks(viewData, tView, creationMode);
    }
}
/**
 * Marks the end of the LContainer.
 *
 * Marking the end of LContainer is the time when to child views get inserted or removed.
 */
export function containerRefreshEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertNodeType(previousOrParentTNode, 2 /* View */);
        ngDevMode && assertHasParent();
        previousOrParentTNode = previousOrParentTNode.parent;
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    var lContainer = viewData[previousOrParentTNode.index];
    var nextIndex = lContainer[ACTIVE_INDEX];
    // remove extra views at the end of the container
    while (nextIndex < lContainer[VIEWS].length) {
        removeView(lContainer, previousOrParentTNode, nextIndex);
    }
}
/**
 * Goes over dynamic embedded views (ones created through ViewContainerRef APIs) and refreshes them
 * by executing an associated template function.
 */
function refreshDynamicEmbeddedViews(lViewData) {
    for (var current = getLViewChild(lViewData); current !== null; current = current[NEXT]) {
        // Note: current can be an LViewData or an LContainer instance, but here we are only interested
        // in LContainer. We can tell it's an LContainer because its length is less than the LViewData
        // header.
        if (current.length < HEADER_OFFSET && current[ACTIVE_INDEX] === -1) {
            var container_1 = current;
            for (var i = 0; i < container_1[VIEWS].length; i++) {
                var dynamicViewData = container_1[VIEWS][i];
                // The directives and pipes are not needed here as an existing view is only being refreshed.
                ngDevMode && assertDefined(dynamicViewData[TVIEW], 'TView must be allocated');
                renderEmbeddedTemplate(dynamicViewData, dynamicViewData[TVIEW], dynamicViewData[CONTEXT], 2 /* Update */);
            }
        }
    }
}
/**
 * Looks for a view with a given view block id inside a provided LContainer.
 * Removes views that need to be deleted in the process.
 *
 * @param lContainer to search for views
 * @param tContainerNode to search for views
 * @param startIdx starting index in the views array to search from
 * @param viewBlockId exact view block id to look for
 * @returns index of a found view or -1 if not found
 */
function scanForView(lContainer, tContainerNode, startIdx, viewBlockId) {
    var views = lContainer[VIEWS];
    for (var i = startIdx; i < views.length; i++) {
        var viewAtPositionId = views[i][TVIEW].id;
        if (viewAtPositionId === viewBlockId) {
            return views[i];
        }
        else if (viewAtPositionId < viewBlockId) {
            // found a view that should not be at this position - remove
            removeView(lContainer, tContainerNode, i);
        }
        else {
            // found a view with id greater than the one we are searching for
            // which means that required view doesn't exist and can't be found at
            // later positions in the views array - stop the search here
            break;
        }
    }
    return null;
}
/**
 * Marks the start of an embedded view.
 *
 * @param viewBlockId The ID of this view
 * @return boolean Whether or not this view is in creation mode
 */
export function embeddedViewStart(viewBlockId, consts, vars) {
    // The previous node can be a view node if we are processing an inline for loop
    var containerTNode = previousOrParentTNode.type === 2 /* View */ ?
        previousOrParentTNode.parent :
        previousOrParentTNode;
    var lContainer = viewData[containerTNode.index];
    var currentView = viewData;
    ngDevMode && assertNodeType(containerTNode, 0 /* Container */);
    var viewToRender = scanForView(lContainer, containerTNode, lContainer[ACTIVE_INDEX], viewBlockId);
    if (viewToRender) {
        isParent = true;
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        viewToRender = createLViewData(renderer, getOrCreateEmbeddedTView(viewBlockId, consts, vars, containerTNode), null, 2 /* CheckAlways */, getCurrentSanitizer());
        if (lContainer[QUERIES]) {
            viewToRender[QUERIES] = lContainer[QUERIES].createView();
        }
        createViewNode(viewBlockId, viewToRender);
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    if (lContainer) {
        if (creationMode) {
            // it is a new view, insert it into collection of views for a given container
            insertView(viewToRender, lContainer, currentView, lContainer[ACTIVE_INDEX], -1);
        }
        lContainer[ACTIVE_INDEX]++;
    }
    return getRenderFlags(viewToRender);
}
/**
 * Initialize the TView (e.g. static data) for the active embedded view.
 *
 * Each embedded view block must create or retrieve its own TView. Otherwise, the embedded view's
 * static data for a particular node would overwrite the static data for a node in the view above
 * it with the same index (since it's in the same template).
 *
 * @param viewIndex The index of the TView in TNode.tViews
 * @param consts The number of nodes, local refs, and pipes in this template
 * @param vars The number of bindings and pure function bindings in this template
 * @param container The parent container in which to look for the view's static data
 * @returns TView
 */
function getOrCreateEmbeddedTView(viewIndex, consts, vars, parent) {
    ngDevMode && assertNodeType(parent, 0 /* Container */);
    var containerTViews = parent.tViews;
    ngDevMode && assertDefined(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        containerTViews[viewIndex] = createTView(viewIndex, null, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    return containerTViews[viewIndex];
}
/** Marks the end of an embedded view. */
export function embeddedViewEnd() {
    var viewHost = viewData[HOST_NODE];
    refreshDescendantViews();
    leaveView(viewData[PARENT]);
    previousOrParentTNode = viewHost;
    isParent = false;
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param adjustedElementIndex  Element index in LViewData[] (adjusted for HEADER_OFFSET)
 */
export function componentRefresh(adjustedElementIndex, parentFirstTemplatePass) {
    ngDevMode && assertDataInRange(adjustedElementIndex);
    var hostView = getComponentViewByIndex(adjustedElementIndex, viewData);
    ngDevMode && assertNodeType(tView.data[adjustedElementIndex], 3 /* Element */);
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView[FLAGS] & (2 /* CheckAlways */ | 4 /* Dirty */)) {
        parentFirstTemplatePass && syncViewWithBlueprint(hostView);
        detectChangesInternal(hostView, hostView[CONTEXT]);
    }
}
/**
 * Syncs an LViewData instance with its blueprint if they have gotten out of sync.
 *
 * Typically, blueprints and their view instances should always be in sync, so the loop here
 * will be skipped. However, consider this case of two components side-by-side:
 *
 * App template:
 * ```
 * <comp></comp>
 * <comp></comp>
 * ```
 *
 * The following will happen:
 * 1. App template begins processing.
 * 2. First <comp> is matched as a component and its LViewData is created.
 * 3. Second <comp> is matched as a component and its LViewData is created.
 * 4. App template completes processing, so it's time to check child templates.
 * 5. First <comp> template is checked. It has a directive, so its def is pushed to blueprint.
 * 6. Second <comp> template is checked. Its blueprint has been updated by the first
 * <comp> template, but its LViewData was created before this update, so it is out of sync.
 *
 * Note that embedded views inside ngFor loops will never be out of sync because these views
 * are processed as soon as they are created.
 *
 * @param componentView The view to sync
 */
function syncViewWithBlueprint(componentView) {
    var componentTView = componentView[TVIEW];
    for (var i = componentView.length; i < componentTView.blueprint.length; i++) {
        componentView[i] = componentTView.blueprint[i];
    }
}
/** Returns a boolean for whether the view is attached */
export function viewAttached(view) {
    return (view[FLAGS] & 8 /* Attached */) === 8 /* Attached */;
}
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
export function projectionDef(selectors, textSelectors) {
    var componentNode = findComponentView(viewData)[HOST_NODE];
    if (!componentNode.projection) {
        var noOfNodeBuckets = selectors ? selectors.length + 1 : 1;
        var pData = componentNode.projection =
            new Array(noOfNodeBuckets).fill(null);
        var tails = pData.slice();
        var componentChild = componentNode.child;
        while (componentChild !== null) {
            var bucketIndex = selectors ? matchingSelectorIndex(componentChild, selectors, textSelectors) : 0;
            var nextNode = componentChild.next;
            if (tails[bucketIndex]) {
                tails[bucketIndex].next = componentChild;
            }
            else {
                pData[bucketIndex] = componentChild;
                componentChild.next = null;
            }
            tails[bucketIndex] = componentChild;
            componentChild = nextNode;
        }
    }
}
/**
 * Stack used to keep track of projection nodes in projection() instruction.
 *
 * This is deliberately created outside of projection() to avoid allocating
 * a new array each time the function is called. Instead the array will be
 * re-used by each invocation. This works because the function is not reentrant.
 */
var projectionNodeStack = [];
/**
 * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
 * to the projectionDef instruction.
 *
 * @param nodeIndex
 * @param selectorIndex:
 *        - 0 when the selector is `*` (or unspecified as this is the default value),
 *        - 1 based index of the selector from the {@link projectionDef}
 */
export function projection(nodeIndex, selectorIndex, attrs) {
    if (selectorIndex === void 0) { selectorIndex = 0; }
    var tProjectionNode = createNodeAtIndex(nodeIndex, 1 /* Projection */, null, null, attrs || null);
    // We can't use viewData[HOST_NODE] because projection nodes can be nested in embedded views.
    if (tProjectionNode.projection === null)
        tProjectionNode.projection = selectorIndex;
    // `<ng-content>` has no content
    isParent = false;
    // re-distribution of projectable nodes is stored on a component's view level
    var componentView = findComponentView(viewData);
    var componentNode = componentView[HOST_NODE];
    var nodeToProject = componentNode.projection[selectorIndex];
    var projectedView = componentView[PARENT];
    var projectionNodeIndex = -1;
    while (nodeToProject) {
        if (nodeToProject.type === 1 /* Projection */) {
            // This node is re-projected, so we must go up the tree to get its projected nodes.
            var currentComponentView = findComponentView(projectedView);
            var currentComponentHost = currentComponentView[HOST_NODE];
            var firstProjectedNode = currentComponentHost.projection[nodeToProject.projection];
            if (firstProjectedNode) {
                projectionNodeStack[++projectionNodeIndex] = nodeToProject;
                projectionNodeStack[++projectionNodeIndex] = projectedView;
                nodeToProject = firstProjectedNode;
                projectedView = currentComponentView[PARENT];
                continue;
            }
        }
        else {
            // This flag must be set now or we won't know that this node is projected
            // if the nodes are inserted into a container later.
            nodeToProject.flags |= 8192 /* isProjected */;
            appendProjectedNode(nodeToProject, tProjectionNode, viewData, projectedView);
        }
        // If we are finished with a list of re-projected nodes, we need to get
        // back to the root projection node that was re-projected.
        if (nodeToProject.next === null && projectedView !== componentView[PARENT]) {
            projectedView = projectionNodeStack[projectionNodeIndex--];
            nodeToProject = projectionNodeStack[projectionNodeIndex--];
        }
        nodeToProject = nodeToProject.next;
    }
}
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
export function addToViewTree(currentView, adjustedHostIndex, state) {
    if (currentView[TAIL]) {
        currentView[TAIL][NEXT] = state;
    }
    else if (firstTemplatePass) {
        tView.childIndex = adjustedHostIndex;
    }
    currentView[TAIL] = state;
    return state;
}
///////////////////////////////
//// Change detection
///////////////////////////////
/** If node is an OnPush component, marks its LViewData dirty. */
export function markDirtyIfOnPush(viewIndex) {
    var view = getComponentViewByIndex(viewIndex, viewData);
    if (!(view[FLAGS] & 2 /* CheckAlways */)) {
        view[FLAGS] |= 4 /* Dirty */;
    }
}
/** Wraps an event listener with preventDefault behavior. */
export function wrapListenerWithPreventDefault(listenerFn) {
    return function wrapListenerIn_preventDefault(e) {
        if (listenerFn(e) === false) {
            e.preventDefault();
            // Necessary for legacy browsers that don't support preventDefault (e.g. IE)
            e.returnValue = false;
        }
    };
}
/** Marks current view and all ancestors dirty */
export function markViewDirty(view) {
    var currentView = view;
    while (currentView && !(currentView[FLAGS] & 64 /* IsRoot */)) {
        currentView[FLAGS] |= 4 /* Dirty */;
        currentView = currentView[PARENT];
    }
    currentView[FLAGS] |= 4 /* Dirty */;
    ngDevMode && assertDefined(currentView[CONTEXT], 'rootContext should be defined');
    var rootContext = currentView[CONTEXT];
    scheduleTick(rootContext, 1 /* DetectChanges */);
}
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
export function scheduleTick(rootContext, flags) {
    var nothingScheduled = rootContext.flags === 0 /* Empty */;
    rootContext.flags |= flags;
    if (nothingScheduled && rootContext.clean == _CLEAN_PROMISE) {
        var res_1;
        rootContext.clean = new Promise(function (r) { return res_1 = r; });
        rootContext.scheduler(function () {
            if (rootContext.flags & 1 /* DetectChanges */) {
                rootContext.flags &= ~1 /* DetectChanges */;
                tickRootContext(rootContext);
            }
            if (rootContext.flags & 2 /* FlushPlayers */) {
                rootContext.flags &= ~2 /* FlushPlayers */;
                var playerHandler = rootContext.playerHandler;
                if (playerHandler) {
                    playerHandler.flushPlayers();
                }
            }
            rootContext.clean = _CLEAN_PROMISE;
            res_1(null);
        });
    }
}
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
export function tick(component) {
    var rootView = getRootView(component);
    var rootContext = rootView[CONTEXT];
    tickRootContext(rootContext);
}
function tickRootContext(rootContext) {
    for (var i = 0; i < rootContext.components.length; i++) {
        var rootComponent = rootContext.components[i];
        renderComponentOrTemplate(readPatchedLViewData(rootComponent), rootComponent);
    }
}
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
export function detectChanges(component) {
    detectChangesInternal(getComponentViewByInstance(component), component);
}
/**
 * Synchronously perform change detection on a root view and its components.
 *
 * @param lViewData The view which the change detection should be performed on.
 */
export function detectChangesInRootView(lViewData) {
    tickRootContext(lViewData[CONTEXT]);
}
/**
 * Checks the change detector and its children, and throws if any changes are detected.
 *
 * This is used in development mode to verify that running change detection doesn't
 * introduce other changes.
 */
export function checkNoChanges(component) {
    checkNoChangesMode = true;
    try {
        detectChanges(component);
    }
    finally {
        checkNoChangesMode = false;
    }
}
/**
 * Checks the change detector on a root view and its components, and throws if any changes are
 * detected.
 *
 * This is used in development mode to verify that running change detection doesn't
 * introduce other changes.
 *
 * @param lViewData The view which the change detection should be checked on.
 */
export function checkNoChangesInRootView(lViewData) {
    checkNoChangesMode = true;
    try {
        detectChangesInRootView(lViewData);
    }
    finally {
        checkNoChangesMode = false;
    }
}
/** Checks the view of the component provided. Does not gate on dirty checks or execute doCheck. */
export function detectChangesInternal(hostView, component) {
    var hostTView = hostView[TVIEW];
    var oldView = enterView(hostView, hostView[HOST_NODE]);
    var templateFn = hostTView.template;
    var viewQuery = hostTView.viewQuery;
    try {
        namespaceHTML();
        createViewQuery(viewQuery, hostView[FLAGS], component);
        templateFn(getRenderFlags(hostView), component);
        refreshDescendantViews();
        updateViewQuery(viewQuery, component);
    }
    finally {
        leaveView(oldView);
    }
}
function createViewQuery(viewQuery, flags, component) {
    if (viewQuery && (flags & 1 /* CreationMode */)) {
        viewQuery(1 /* Create */, component);
    }
}
function updateViewQuery(viewQuery, component) {
    if (viewQuery) {
        viewQuery(2 /* Update */, component);
    }
}
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
export function markDirty(component) {
    ngDevMode && assertDefined(component, 'component');
    markViewDirty(getComponentViewByInstance(component));
}
/** A special value which designates that a value has not changed. */
export var NO_CHANGE = {};
/**
 * Creates a single value binding.
 *
 * @param value Value to diff
 */
export function bind(value) {
    return bindingUpdated(viewData[BINDING_INDEX]++, value) ? value : NO_CHANGE;
}
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
export function interpolationV(values) {
    ngDevMode && assertLessThan(2, values.length, 'should have at least 3 values');
    ngDevMode && assertEqual(values.length % 2, 1, 'should have an odd number of values');
    var different = false;
    for (var i = 1; i < values.length; i += 2) {
        // Check if bindings (odd indexes) have changed
        bindingUpdated(viewData[BINDING_INDEX]++, values[i]) && (different = true);
    }
    if (!different) {
        return NO_CHANGE;
    }
    // Build the updated content
    var content = values[0];
    for (var i = 1; i < values.length; i += 2) {
        content += stringify(values[i]) + values[i + 1];
    }
    return content;
}
/**
 * Creates an interpolation binding with 1 expression.
 *
 * @param prefix static value used for concatenation only.
 * @param v0 value checked for change.
 * @param suffix static value used for concatenation only.
 */
export function interpolation1(prefix, v0, suffix) {
    var different = bindingUpdated(viewData[BINDING_INDEX]++, v0);
    return different ? prefix + stringify(v0) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 2 expressions. */
export function interpolation2(prefix, v0, i0, v1, suffix) {
    var different = bindingUpdated2(viewData[BINDING_INDEX], v0, v1);
    viewData[BINDING_INDEX] += 2;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 3 expressions. */
export function interpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
    var different = bindingUpdated3(viewData[BINDING_INDEX], v0, v1, v2);
    viewData[BINDING_INDEX] += 3;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + suffix :
        NO_CHANGE;
}
/** Create an interpolation binding with 4 expressions. */
export function interpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    viewData[BINDING_INDEX] += 4;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) +
            suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 5 expressions. */
export function interpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated(viewData[BINDING_INDEX] + 4, v4) || different;
    viewData[BINDING_INDEX] += 5;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 6 expressions. */
export function interpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated2(viewData[BINDING_INDEX] + 4, v4, v5) || different;
    viewData[BINDING_INDEX] += 6;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 7 expressions. */
export function interpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated3(viewData[BINDING_INDEX] + 4, v4, v5, v6) || different;
    viewData[BINDING_INDEX] += 7;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 8 expressions. */
export function interpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated4(viewData[BINDING_INDEX] + 4, v4, v5, v6, v7) || different;
    viewData[BINDING_INDEX] += 8;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + i6 + stringify(v7) + suffix :
        NO_CHANGE;
}
/** Store a value in the `data` at a given `index`. */
export function store(index, value) {
    // We don't store any static data for local variables, so the first time
    // we see the template, we should store as null to avoid a sparse array
    var adjustedIndex = index + HEADER_OFFSET;
    if (adjustedIndex >= tView.data.length) {
        tView.data[adjustedIndex] = null;
    }
    viewData[adjustedIndex] = value;
}
/**
 * Retrieves a local reference from the current contextViewData.
 *
 * If the reference to retrieve is in a parent view, this instruction is used in conjunction
 * with a nextContext() call, which walks up the tree and updates the contextViewData instance.
 *
 * @param index The index of the local ref in contextViewData.
 */
export function reference(index) {
    return loadInternal(index, contextViewData);
}
function walkUpViews(nestingLevel, currentView) {
    while (nestingLevel > 0) {
        ngDevMode && assertDefined(currentView[DECLARATION_VIEW], 'Declaration view should be defined if nesting level is greater than 0.');
        currentView = currentView[DECLARATION_VIEW];
        nestingLevel--;
    }
    return currentView;
}
export function loadQueryList(queryListIdx) {
    ngDevMode && assertDefined(viewData[CONTENT_QUERIES], 'Content QueryList array should be defined if reading a query.');
    ngDevMode && assertDataInRange(queryListIdx, viewData[CONTENT_QUERIES]);
    return viewData[CONTENT_QUERIES][queryListIdx];
}
/** Retrieves a value from current `viewData`. */
export function load(index) {
    return loadInternal(index, viewData);
}
/** Gets the current binding value. */
export function getBinding(bindingIndex) {
    ngDevMode && assertDataInRange(viewData[bindingIndex]);
    ngDevMode &&
        assertNotEqual(viewData[bindingIndex], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
    return viewData[bindingIndex];
}
/** Updates binding if changed, then returns whether it was updated. */
export function bindingUpdated(bindingIndex, value) {
    ngDevMode && assertNotEqual(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    ngDevMode && assertLessThan(bindingIndex, viewData.length, "Slot should have been initialized to NO_CHANGE");
    if (viewData[bindingIndex] === NO_CHANGE) {
        viewData[bindingIndex] = value;
    }
    else if (isDifferent(viewData[bindingIndex], value, checkNoChangesMode)) {
        throwErrorIfNoChangesMode(creationMode, checkNoChangesMode, viewData[bindingIndex], value);
        viewData[bindingIndex] = value;
    }
    else {
        return false;
    }
    return true;
}
/** Updates binding and returns the value. */
export function updateBinding(bindingIndex, value) {
    return viewData[bindingIndex] = value;
}
/** Updates 2 bindings if changed, then returns whether either was updated. */
export function bindingUpdated2(bindingIndex, exp1, exp2) {
    var different = bindingUpdated(bindingIndex, exp1);
    return bindingUpdated(bindingIndex + 1, exp2) || different;
}
/** Updates 3 bindings if changed, then returns whether any was updated. */
export function bindingUpdated3(bindingIndex, exp1, exp2, exp3) {
    var different = bindingUpdated2(bindingIndex, exp1, exp2);
    return bindingUpdated(bindingIndex + 2, exp3) || different;
}
/** Updates 4 bindings if changed, then returns whether any was updated. */
export function bindingUpdated4(bindingIndex, exp1, exp2, exp3, exp4) {
    var different = bindingUpdated2(bindingIndex, exp1, exp2);
    return bindingUpdated2(bindingIndex + 2, exp3, exp4) || different;
}
export function getTView() {
    return tView;
}
/**
 * Registers a QueryList, associated with a content query, for later refresh (part of a view
 * refresh).
 */
export function registerContentQuery(queryList) {
    var savedContentQueriesLength = (viewData[CONTENT_QUERIES] || (viewData[CONTENT_QUERIES] = [])).push(queryList);
    if (firstTemplatePass) {
        var currentDirectiveIndex = viewData.length - 1;
        var tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
        var lastSavedDirectiveIndex = tView.contentQueries.length ? tView.contentQueries[tView.contentQueries.length - 2] : -1;
        if (currentDirectiveIndex !== lastSavedDirectiveIndex) {
            tViewContentQueries.push(currentDirectiveIndex, savedContentQueriesLength - 1);
        }
    }
}
export function assertPreviousIsParent() {
    assertEqual(isParent, true, 'previousOrParentTNode should be a parent');
}
function assertHasParent() {
    assertDefined(previousOrParentTNode.parent, 'previousOrParentTNode should have a parent');
}
function assertDataInRange(index, arr) {
    if (arr == null)
        arr = viewData;
    assertDataInRangeInternal(index, arr || viewData);
}
function assertDataNext(index, arr) {
    if (arr == null)
        arr = viewData;
    assertEqual(arr.length, index, "index " + index + " expected to be at the end of arr (length " + arr.length + ")");
}
export var CLEAN_PROMISE = _CLEAN_PROMISE;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxlQUFlLENBQUM7QUFNdkIsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNwRixPQUFPLEVBQUMsZUFBZSxFQUFFLDBCQUEwQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDaEYsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHlCQUF5QixFQUFFLDJCQUEyQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVHLE9BQU8sRUFBQyxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLG1CQUFtQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzVGLE9BQU8sRUFBQyxZQUFZLEVBQWMsS0FBSyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFdkUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBR3BELE9BQU8sRUFBa0IsdUJBQXVCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUVqRixPQUFPLEVBQXFGLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0ksT0FBTyxFQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQXNCLGdCQUFnQixFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQXlCLElBQUksRUFBbUIsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQWlDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDbFUsT0FBTyxFQUFDLHlCQUF5QixFQUFF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LEVBQUU7WUFDckQsbUJBQW1CLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLHlCQUF5QixHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ2hGO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQjtJQUNwQyxXQUFXLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDO0FBQzFFLENBQUM7QUFFRCxTQUFTLGVBQWU7SUFDdEIsYUFBYSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDO0FBQzVGLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEtBQWEsRUFBRSxHQUFXO0lBQ25ELElBQUksR0FBRyxJQUFJLElBQUk7UUFBRSxHQUFHLEdBQUcsUUFBUSxDQUFDO0lBQ2hDLHlCQUF5QixDQUFDLEtBQUssRUFBRSxHQUFHLElBQUksUUFBUSxDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLEtBQWEsRUFBRSxHQUFXO0lBQ2hELElBQUksR0FBRyxJQUFJLElBQUk7UUFBRSxHQUFHLEdBQUcsUUFBUSxDQUFDO0lBQ2hDLFdBQVcsQ0FDUCxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxXQUFTLEtBQUssa0RBQTZDLEdBQUcsQ0FBQyxNQUFNLE1BQUcsQ0FBQyxDQUFDO0FBQ25HLENBQUM7QUFFRCxNQUFNLENBQUMsSUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4vbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhLCBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge3Rocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yLCB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlLCB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7ZXhlY3V0ZUhvb2tzLCBleGVjdXRlSW5pdEhvb2tzLCBxdWV1ZUluaXRIb29rcywgcXVldWVMaWZlY3ljbGVIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgTENvbnRhaW5lciwgVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFF1ZXJ5LCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5LCBJbml0aWFsU3R5bGluZ0ZsYWdzLCBQaXBlRGVmTGlzdE9yRmFjdG9yeSwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7SU5KRUNUT1JfU0laRX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBJbml0aWFsSW5wdXREYXRhLCBJbml0aWFsSW5wdXRzLCBMb2NhbFJlZkV4dHJhY3RvciwgUHJvcGVydHlBbGlhc1ZhbHVlLCBQcm9wZXJ0eUFsaWFzZXMsIFRBdHRyaWJ1dGVzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1BsYXllckZhY3Rvcnl9IGZyb20gJy4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtDc3NTZWxlY3Rvckxpc3QsIE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge0xRdWVyaWVzfSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dCwgUmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgQ0xFQU5VUCwgQ09OVEFJTkVSX0lOREVYLCBDT05URU5UX1FVRVJJRVMsIENPTlRFWFQsIEN1cnJlbnRNYXRjaGVzTGlzdCwgREVDTEFSQVRJT05fVklFVywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIEhPU1RfTk9ERSwgSU5KRUNUT1IsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgTkVYVCwgT3BhcXVlVmlld1N0YXRlLCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgU0FOSVRJWkVSLCBUQUlMLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcywgYXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgYXBwZW5kUHJvamVjdGVkTm9kZSwgY3JlYXRlVGV4dE5vZGUsIGZpbmRDb21wb25lbnRWaWV3LCBnZXRMVmlld0NoaWxkLCBnZXRSZW5kZXJQYXJlbnQsIGluc2VydFZpZXcsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCwgbWF0Y2hpbmdTZWxlY3RvckluZGV4fSBmcm9tICcuL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge2NyZWF0ZVN0eWxpbmdDb250ZXh0VGVtcGxhdGUsIHJlbmRlclN0eWxlQW5kQ2xhc3NCaW5kaW5ncywgdXBkYXRlQ2xhc3NQcm9wIGFzIHVwZGF0ZUVsZW1lbnRDbGFzc1Byb3AsIHVwZGF0ZVN0eWxlUHJvcCBhcyB1cGRhdGVFbGVtZW50U3R5bGVQcm9wLCB1cGRhdGVTdHlsaW5nTWFwfSBmcm9tICcuL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcbmltcG9ydCB7Qm91bmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuL3N0eWxpbmcvcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHtnZXRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9zdHlsaW5nL3V0aWwnO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZUludGVybmFsLCBnZXRDb21wb25lbnRWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0Um9vdENvbnRleHQsIGdldFJvb3RWaWV3LCBnZXRUTm9kZSwgaXNDb21wb25lbnQsIGlzQ29udGVudFF1ZXJ5SG9zdCwgaXNEaWZmZXJlbnQsIGxvYWRJbnRlcm5hbCwgcmVhZFBhdGNoZWRMVmlld0RhdGEsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuXG4vKipcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlIGJlZm9yZSB3cml0aW5nIGl0IGludG8gdGhlIHJlbmRlcmVyLlxuICovXG5leHBvcnQgdHlwZSBTYW5pdGl6ZXJGbiA9ICh2YWx1ZTogYW55KSA9PiBzdHJpbmc7XG5cbi8qKlxuICogVG9rZW4gc2V0IGluIGN1cnJlbnRNYXRjaGVzIHdoaWxlIGRlcGVuZGVuY2llcyBhcmUgYmVpbmcgcmVzb2x2ZWQuXG4gKlxuICogSWYgd2UgdmlzaXQgYSBkaXJlY3RpdmUgdGhhdCBoYXMgYSB2YWx1ZSBzZXQgdG8gQ0lSQ1VMQVIsIHdlIGtub3cgd2UndmVcbiAqIGFscmVhZHkgc2VlbiBpdCwgYW5kIHRodXMgaGF2ZSBhIGNpcmN1bGFyIGRlcGVuZGVuY3kuXG4gKi9cbmV4cG9ydCBjb25zdCBDSVJDVUxBUiA9ICdfX0NJUkNVTEFSX18nO1xuXG4vKipcbiAqIFRoaXMgcHJvcGVydHkgZ2V0cyBzZXQgYmVmb3JlIGVudGVyaW5nIGEgdGVtcGxhdGUuXG4gKlxuICogVGhpcyByZW5kZXJlciBjYW4gYmUgb25lIG9mIHR3byB2YXJpZXRpZXMgb2YgUmVuZGVyZXIzOlxuICpcbiAqIC0gT2JqZWN0ZWRPcmllbnRlZFJlbmRlcmVyM1xuICpcbiAqIFRoaXMgaXMgdGhlIG5hdGl2ZSBicm93c2VyIEFQSSBzdHlsZSwgZS5nLiBvcGVyYXRpb25zIGFyZSBtZXRob2RzIG9uIGluZGl2aWR1YWwgb2JqZWN0c1xuICogbGlrZSBIVE1MRWxlbWVudC4gV2l0aCB0aGlzIHN0eWxlLCBubyBhZGRpdGlvbmFsIGNvZGUgaXMgbmVlZGVkIGFzIGEgZmFjYWRlIChyZWR1Y2luZyBwYXlsb2FkXG4gKiBzaXplKS5cbiAqXG4gKiAtIFByb2NlZHVyYWxSZW5kZXJlcjNcbiAqXG4gKiBJbiBub24tbmF0aXZlIGJyb3dzZXIgZW52aXJvbm1lbnRzIChlLmcuIHBsYXRmb3JtcyBzdWNoIGFzIHdlYi13b3JrZXJzKSwgdGhpcyBpcyB0aGUgZmFjYWRlXG4gKiB0aGF0IGVuYWJsZXMgZWxlbWVudCBtYW5pcHVsYXRpb24uIFRoaXMgYWxzbyBmYWNpbGl0YXRlcyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3aXRoXG4gKiBSZW5kZXJlcjIuXG4gKi9cbmxldCByZW5kZXJlcjogUmVuZGVyZXIzO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZXIoKTogUmVuZGVyZXIzIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcmVuZGVyZXI7XG59XG5cbmxldCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTM7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZW5kZXJlckZhY3RvcnkoKTogUmVuZGVyZXJGYWN0b3J5MyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHJlbmRlcmVyRmFjdG9yeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRTYW5pdGl6ZXIoKTogU2FuaXRpemVyfG51bGwge1xuICByZXR1cm4gdmlld0RhdGEgJiYgdmlld0RhdGFbU0FOSVRJWkVSXTtcbn1cblxuLyoqXG4gKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICogc28gdGhhdCB3ZSBjYW4gdGhhbiBhdHRhY2ggYExWaWV3RGF0YWAgdG8gb25seSB0aG9zZSBlbGVtZW50cy5cbiAqL1xubGV0IGVsZW1lbnREZXB0aENvdW50ICE6IG51bWJlcjtcblxuLyoqXG4gKiBTdG9yZXMgd2hldGhlciBkaXJlY3RpdmVzIHNob3VsZCBiZSBtYXRjaGVkIHRvIGVsZW1lbnRzLlxuICpcbiAqIFdoZW4gdGVtcGxhdGUgY29udGFpbnMgYG5nTm9uQmluZGFibGVgIHRoYW4gd2UgbmVlZCB0byBwcmV2ZW50IHRoZSBydW50aW1lIGZvcm0gbWF0Y2hpbmdcbiAqIGRpcmVjdGl2ZXMgb24gY2hpbGRyZW4gb2YgdGhhdCBlbGVtZW50LlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqIDwvZGl2PlxuICogYGBgXG4gKi9cbmxldCBiaW5kaW5nc0VuYWJsZWQgITogYm9vbGVhbjtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIHJlc3RvcmVWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRWaWV3KCk6IE9wYXF1ZVZpZXdTdGF0ZSB7XG4gIHJldHVybiB2aWV3RGF0YSBhcyBhbnkgYXMgT3BhcXVlVmlld1N0YXRlO1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIGBjb250ZXh0Vmlld0RhdGFgIHRvIHRoZSBnaXZlbiBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKlxuICogQHBhcmFtIHZpZXdUb1Jlc3RvcmUgVGhlIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZSB0byByZXN0b3JlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzdG9yZVZpZXcodmlld1RvUmVzdG9yZTogT3BhcXVlVmlld1N0YXRlKSB7XG4gIGNvbnRleHRWaWV3RGF0YSA9IHZpZXdUb1Jlc3RvcmUgYXMgYW55IGFzIExWaWV3RGF0YTtcbn1cblxuLyoqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZCBhbmQgdHJhY2sgcXVlcnkgcmVzdWx0cy4gKi9cbmxldCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk6IFROb2RlIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcHJldmlvdXNPclBhcmVudFROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0RW52aXJvbm1lbnQodE5vZGU6IFROb2RlLCB2aWV3OiBMVmlld0RhdGEpIHtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGU7XG4gIHZpZXdEYXRhID0gdmlldztcbn1cblxuLyoqXG4gKiBJZiBgaXNQYXJlbnRgIGlzOlxuICogIC0gYHRydWVgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBhIHBhcmVudCBub2RlLlxuICogIC0gYGZhbHNlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudFROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gKi9cbmxldCBpc1BhcmVudDogYm9vbGVhbjtcblxubGV0IHRWaWV3OiBUVmlldztcblxubGV0IGN1cnJlbnRRdWVyaWVzOiBMUXVlcmllc3xudWxsO1xuXG4vKipcbiAqIFF1ZXJ5IGluc3RydWN0aW9ucyBjYW4gYXNrIGZvciBcImN1cnJlbnQgcXVlcmllc1wiIGluIDIgZGlmZmVyZW50IGNhc2VzOlxuICogLSB3aGVuIGNyZWF0aW5nIHZpZXcgcXVlcmllcyAoYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQgdmlldywgYmVmb3JlIGFueSBub2RlIGlzIGNyZWF0ZWQgLSBpblxuICogdGhpcyBjYXNlIGN1cnJlbnRRdWVyaWVzIHBvaW50cyB0byB2aWV3IHF1ZXJpZXMpXG4gKiAtIHdoZW4gY3JlYXRpbmcgY29udGVudCBxdWVyaWVzIChpLmUuIHRoaXMgcHJldmlvdXNPclBhcmVudFROb2RlIHBvaW50cyB0byBhIG5vZGUgb24gd2hpY2ggd2VcbiAqIGNyZWF0ZSBjb250ZW50IHF1ZXJpZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllcyhcbiAgICBRdWVyeVR5cGU6IHtuZXcgKHBhcmVudDogbnVsbCwgc2hhbGxvdzogbnVsbCwgZGVlcDogbnVsbCk6IExRdWVyaWVzfSk6IExRdWVyaWVzIHtcbiAgLy8gaWYgdGhpcyBpcyB0aGUgZmlyc3QgY29udGVudCBxdWVyeSBvbiBhIG5vZGUsIGFueSBleGlzdGluZyBMUXVlcmllcyBuZWVkcyB0byBiZSBjbG9uZWRcbiAgLy8gaW4gc3Vic2VxdWVudCB0ZW1wbGF0ZSBwYXNzZXMsIHRoZSBjbG9uaW5nIG9jY3VycyBiZWZvcmUgZGlyZWN0aXZlIGluc3RhbnRpYXRpb24uXG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlICE9PSB2aWV3RGF0YVtIT1NUX05PREVdICYmXG4gICAgICAhaXNDb250ZW50UXVlcnlIb3N0KHByZXZpb3VzT3JQYXJlbnRUTm9kZSkpIHtcbiAgICBjdXJyZW50UXVlcmllcyAmJiAoY3VycmVudFF1ZXJpZXMgPSBjdXJyZW50UXVlcmllcy5jbG9uZSgpKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnk7XG4gIH1cblxuICByZXR1cm4gY3VycmVudFF1ZXJpZXMgfHwgKGN1cnJlbnRRdWVyaWVzID0gbmV3IFF1ZXJ5VHlwZShudWxsLCBudWxsLCBudWxsKSk7XG59XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSBnZXRzIHNldCBiZWZvcmUgZW50ZXJpbmcgYSB0ZW1wbGF0ZS5cbiAqL1xubGV0IGNyZWF0aW9uTW9kZTogYm9vbGVhbjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENyZWF0aW9uTW9kZSgpOiBib29sZWFuIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY3JlYXRpb25Nb2RlO1xufVxuXG4vKipcbiAqIFN0YXRlIG9mIHRoZSBjdXJyZW50IHZpZXcgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gKiBhbnkgbG9jYWwgdmFyaWFibGVzIHRoYXQgbmVlZCB0byBiZSBzdG9yZWQgYmV0d2VlbiBpbnZvY2F0aW9ucy5cbiAqL1xubGV0IHZpZXdEYXRhOiBMVmlld0RhdGE7XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjdXJyZW50IExWaWV3RGF0YSBpbnN0YW5jZS5cbiAqXG4gKiBUaGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiBzaG91bGQgYmUgdXNlZCBmb3IgYW55dGhpbmcgcHVibGljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gX2dldFZpZXdEYXRhKCk6IExWaWV3RGF0YSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdEYXRhO1xufVxuXG4vKipcbiAqIFRoZSBsYXN0IHZpZXdEYXRhIHJldHJpZXZlZCBieSBuZXh0Q29udGV4dCgpLlxuICogQWxsb3dzIGJ1aWxkaW5nIG5leHRDb250ZXh0KCkgYW5kIHJlZmVyZW5jZSgpIGNhbGxzLlxuICpcbiAqIGUuZy4gY29uc3QgaW5uZXIgPSB4KCkuJGltcGxpY2l0OyBjb25zdCBvdXRlciA9IHgoKS4kaW1wbGljaXQ7XG4gKi9cbmxldCBjb250ZXh0Vmlld0RhdGE6IExWaWV3RGF0YSA9IG51bGwgITtcblxuZnVuY3Rpb24gZ2V0Q2xlYW51cCh2aWV3OiBMVmlld0RhdGEpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBbXSk7XG59XG5cbmZ1bmN0aW9uIGdldFRWaWV3Q2xlYW51cCh2aWV3OiBMVmlld0RhdGEpOiBhbnlbXSB7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5jbGVhbnVwIHx8ICh2aWV3W1RWSUVXXS5jbGVhbnVwID0gW10pO1xufVxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqL1xubGV0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuXG4vKiogV2hldGhlciBvciBub3QgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGUgY3VycmVudCB2aWV3IGhhcyBiZWVuIHByb2Nlc3NlZC4gKi9cbmxldCBmaXJzdFRlbXBsYXRlUGFzcyA9IHRydWU7XG5cbi8qKlxuICogVGhlIHJvb3QgaW5kZXggZnJvbSB3aGljaCBwdXJlIGZ1bmN0aW9uIGluc3RydWN0aW9ucyBzaG91bGQgY2FsY3VsYXRlIHRoZWlyIGJpbmRpbmdcbiAqIGluZGljZXMuIEluIGNvbXBvbmVudCB2aWV3cywgdGhpcyBpcyBUVmlldy5iaW5kaW5nU3RhcnRJbmRleC4gSW4gYSBob3N0IGJpbmRpbmdcbiAqIGNvbnRleHQsIHRoaXMgaXMgdGhlIFRWaWV3LmV4cGFuZG9TdGFydEluZGV4ICsgYW55IGRpcnMvaG9zdFZhcnMgYmVmb3JlIHRoZSBnaXZlbiBkaXIuXG4gKi9cbmxldCBiaW5kaW5nUm9vdEluZGV4OiBudW1iZXIgPSAtMTtcblxuLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdSb290KCkge1xuICByZXR1cm4gYmluZGluZ1Jvb3RJbmRleDtcbn1cblxuY29uc3QgZW51bSBCaW5kaW5nRGlyZWN0aW9uIHtcbiAgSW5wdXQsXG4gIE91dHB1dCxcbn1cblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IHN0YXRlIHdpdGggYSBuZXcgc3RhdGUuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIHN0YXRlIGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIHN0YXRlIGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBob3N0IEVsZW1lbnQgdG8gd2hpY2ggdGhlIFZpZXcgaXMgYSBjaGlsZCBvZlxuICogQHJldHVybnMgdGhlIHByZXZpb3VzIHN0YXRlO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJWaWV3KFxuICAgIG5ld1ZpZXc6IExWaWV3RGF0YSwgaG9zdFROb2RlOiBURWxlbWVudE5vZGUgfCBUVmlld05vZGUgfCBudWxsKTogTFZpZXdEYXRhIHtcbiAgY29uc3Qgb2xkVmlldzogTFZpZXdEYXRhID0gdmlld0RhdGE7XG4gIHRWaWV3ID0gbmV3VmlldyAmJiBuZXdWaWV3W1RWSUVXXTtcblxuICBjcmVhdGlvbk1vZGUgPSBuZXdWaWV3ICYmIChuZXdWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSA9PT0gTFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gIGZpcnN0VGVtcGxhdGVQYXNzID0gbmV3VmlldyAmJiB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcztcbiAgYmluZGluZ1Jvb3RJbmRleCA9IG5ld1ZpZXcgJiYgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG4gIHJlbmRlcmVyID0gbmV3VmlldyAmJiBuZXdWaWV3W1JFTkRFUkVSXTtcblxuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBob3N0VE5vZGUgITtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuXG4gIHZpZXdEYXRhID0gY29udGV4dFZpZXdEYXRhID0gbmV3VmlldztcbiAgb2xkVmlldyAmJiAob2xkVmlld1tRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzKTtcbiAgY3VycmVudFF1ZXJpZXMgPSBuZXdWaWV3ICYmIG5ld1ZpZXdbUVVFUklFU107XG5cbiAgcmV0dXJuIG9sZFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBpbiBsaWV1IG9mIGVudGVyVmlldyB0byBtYWtlIGl0IGNsZWFyIHdoZW4gd2UgYXJlIGV4aXRpbmcgYSBjaGlsZCB2aWV3LiBUaGlzIG1ha2VzXG4gKiB0aGUgZGlyZWN0aW9uIG9mIHRyYXZlcnNhbCAodXAgb3IgZG93biB0aGUgdmlldyB0cmVlKSBhIGJpdCBjbGVhcmVyLlxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gY3JlYXRpb25Pbmx5IEFuIG9wdGlvbmFsIGJvb2xlYW4gdG8gaW5kaWNhdGUgdGhhdCB0aGUgdmlldyB3YXMgcHJvY2Vzc2VkIGluIGNyZWF0aW9uIG1vZGVcbiAqIG9ubHksIGkuZS4gdGhlIGZpcnN0IHVwZGF0ZSB3aWxsIGJlIGRvbmUgbGF0ZXIuIE9ubHkgcG9zc2libGUgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXcobmV3VmlldzogTFZpZXdEYXRhLCBjcmVhdGlvbk9ubHk/OiBib29sZWFuKTogdm9pZCB7XG4gIGlmICghY3JlYXRpb25Pbmx5KSB7XG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGV4ZWN1dGVIb29rcyh2aWV3RGF0YSwgdFZpZXcudmlld0hvb2tzLCB0Vmlldy52aWV3Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgICB9XG4gICAgLy8gVmlld3MgYXJlIGNsZWFuIGFuZCBpbiB1cGRhdGUgbW9kZSBhZnRlciBiZWluZyBjaGVja2VkLCBzbyB0aGVzZSBiaXRzIGFyZSBjbGVhcmVkXG4gICAgdmlld0RhdGFbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkRpcnR5KTtcbiAgfVxuICB2aWV3RGF0YVtGTEFHU10gfD0gTFZpZXdGbGFncy5SdW5Jbml0O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuICBlbnRlclZpZXcobmV3VmlldywgbnVsbCk7XG59XG5cbi8qKlxuICogUmVmcmVzaGVzIHRoZSB2aWV3LCBleGVjdXRpbmcgdGhlIGZvbGxvd2luZyBzdGVwcyBpbiB0aGF0IG9yZGVyOlxuICogdHJpZ2dlcnMgaW5pdCBob29rcywgcmVmcmVzaGVzIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MsIHRyaWdnZXJzIGNvbnRlbnQgaG9va3MsIHNldHMgaG9zdFxuICogYmluZGluZ3MsIHJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzLlxuICogTm90ZTogdmlldyBob29rcyBhcmUgdHJpZ2dlcmVkIGxhdGVyIHdoZW4gbGVhdmluZyB0aGUgdmlldy5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpIHtcbiAgc2V0SG9zdEJpbmRpbmdzKCk7XG4gIGNvbnN0IHBhcmVudEZpcnN0VGVtcGxhdGVQYXNzID0gZmlyc3RUZW1wbGF0ZVBhc3M7XG5cbiAgLy8gVGhpcyBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIGNoaWxkcmVuIGFyZSBwcm9jZXNzZWQgdG8gc3VwcG9ydCByZWN1cnNpdmUgY29tcG9uZW50c1xuICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyA9IGZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgfVxuICByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3Modmlld0RhdGEpO1xuXG4gIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcpO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUhvb2tzKHZpZXdEYXRhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICB9XG5cbiAgcmVmcmVzaENoaWxkQ29tcG9uZW50cyh0Vmlldy5jb21wb25lbnRzLCBwYXJlbnRGaXJzdFRlbXBsYXRlUGFzcyk7XG59XG5cblxuLyoqIFNldHMgdGhlIGhvc3QgYmluZGluZ3MgZm9yIHRoZSBjdXJyZW50IHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SG9zdEJpbmRpbmdzKCk6IHZvaWQge1xuICBpZiAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucykge1xuICAgIGJpbmRpbmdSb290SW5kZXggPSB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmV4cGFuZG9TdGFydEluZGV4O1xuICAgIGxldCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSAtMTtcbiAgICBsZXQgY3VycmVudEVsZW1lbnRJbmRleCA9IC0xO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zW2ldO1xuICAgICAgaWYgKHR5cGVvZiBpbnN0cnVjdGlvbiA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWYgKGluc3RydWN0aW9uIDw9IDApIHtcbiAgICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIG1lYW4gdGhhdCB3ZSBhcmUgc3RhcnRpbmcgbmV3IEVYUEFORE8gYmxvY2sgYW5kIG5lZWQgdG8gdXBkYXRlXG4gICAgICAgICAgLy8gdGhlIGN1cnJlbnQgZWxlbWVudCBhbmQgZGlyZWN0aXZlIGluZGV4LlxuICAgICAgICAgIGN1cnJlbnRFbGVtZW50SW5kZXggPSAtaW5zdHJ1Y3Rpb247XG4gICAgICAgICAgaWYgKHR5cGVvZiB2aWV3RGF0YVtiaW5kaW5nUm9vdEluZGV4XSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIC8vIFdlJ3ZlIGhpdCBhbiBpbmplY3Rvci4gSXQgbWF5IG9yIG1heSBub3QgZXhpc3QgZGVwZW5kaW5nIG9uIHdoZXRoZXJcbiAgICAgICAgICAgIC8vIHRoZXJlIGlzIGEgcHVibGljIGRpcmVjdGl2ZSBvbiB0aGlzIG5vZGUuXG4gICAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IElOSkVDVE9SX1NJWkU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IGJpbmRpbmdSb290SW5kZXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gVGhpcyBpcyBlaXRoZXIgdGhlIGluamVjdG9yIHNpemUgKHNvIHRoZSBiaW5kaW5nIHJvb3QgY2FuIHNraXAgb3ZlciBkaXJlY3RpdmVzXG4gICAgICAgICAgLy8gYW5kIGdldCB0byB0aGUgZmlyc3Qgc2V0IG9mIGhvc3QgYmluZGluZ3Mgb24gdGhpcyBub2RlKSBvciB0aGUgaG9zdCB2YXIgY291bnRcbiAgICAgICAgICAvLyAodG8gZ2V0IHRvIHRoZSBuZXh0IHNldCBvZiBob3N0IGJpbmRpbmdzIG9uIHRoaXMgbm9kZSkuXG4gICAgICAgICAgYmluZGluZ1Jvb3RJbmRleCArPSBpbnN0cnVjdGlvbjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgaXQncyBub3QgYSBudW1iZXIsIGl0J3MgYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24gdGhhdCBuZWVkcyB0byBiZSBleGVjdXRlZC5cbiAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSBiaW5kaW5nUm9vdEluZGV4O1xuICAgICAgICAvLyBXZSBtdXN0IHN1YnRyYWN0IHRoZSBoZWFkZXIgb2Zmc2V0IGJlY2F1c2UgdGhlIGxvYWQoKSBpbnN0cnVjdGlvblxuICAgICAgICAvLyBleHBlY3RzIGEgcmF3LCB1bmFkanVzdGVkIGluZGV4LlxuICAgICAgICBpbnN0cnVjdGlvbihjdXJyZW50RGlyZWN0aXZlSW5kZXggLSBIRUFERVJfT0ZGU0VULCBjdXJyZW50RWxlbWVudEluZGV4KTtcbiAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY29udGVudCBxdWVyaWVzIGZvciBhbGwgZGlyZWN0aXZlcyBpbiB0aGUgZ2l2ZW4gdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZJZHggPSB0Vmlldy5jb250ZW50UXVlcmllc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRhdGFbZGlyZWN0aXZlRGVmSWR4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcblxuICAgICAgZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzUmVmcmVzaCAhKFxuICAgICAgICAgIGRpcmVjdGl2ZURlZklkeCAtIEhFQURFUl9PRkZTRVQsIHRWaWV3LmNvbnRlbnRRdWVyaWVzW2kgKyAxXSk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3LiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhcbiAgICBjb21wb25lbnRzOiBudW1iZXJbXSB8IG51bGwsIHBhcmVudEZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuKTogdm9pZCB7XG4gIGlmIChjb21wb25lbnRzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbXBvbmVudFJlZnJlc2goY29tcG9uZW50c1tpXSwgcGFyZW50Rmlyc3RUZW1wbGF0ZVBhc3MpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUluaXRBbmRDb250ZW50SG9va3MoKTogdm9pZCB7XG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUluaXRIb29rcyh2aWV3RGF0YSwgdFZpZXcsIGNyZWF0aW9uTW9kZSk7XG4gICAgZXhlY3V0ZUhvb2tzKHZpZXdEYXRhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlld0RhdGE8VD4oXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIGNvbnN0IGluc3RhbmNlID0gdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXdEYXRhO1xuICBpbnN0YW5jZVtGTEFHU10gPSBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuUnVuSW5pdDtcbiAgaW5zdGFuY2VbUEFSRU5UXSA9IGluc3RhbmNlW0RFQ0xBUkFUSU9OX1ZJRVddID0gdmlld0RhdGE7XG4gIGluc3RhbmNlW0NPTlRFWFRdID0gY29udGV4dDtcbiAgaW5zdGFuY2VbSU5KRUNUT1JdID0gdmlld0RhdGEgPyB2aWV3RGF0YVtJTkpFQ1RPUl0gOiBudWxsO1xuICBpbnN0YW5jZVtSRU5ERVJFUl0gPSByZW5kZXJlcjtcbiAgaW5zdGFuY2VbU0FOSVRJWkVSXSA9IHNhbml0aXplciB8fCBudWxsO1xuICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuZCBzdG9yZXMgdGhlIFROb2RlLCBhbmQgaG9va3MgaXQgdXAgdG8gdGhlIHRyZWUuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0aGUgVE5vZGUgc2hvdWxkIGJlIHNhdmVkIChudWxsIGlmIHZpZXcsIHNpbmNlIHRoZXkgYXJlIG5vdFxuICogc2F2ZWQpLlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgVE5vZGUgdG8gY3JlYXRlXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgZWxlbWVudCBmb3IgdGhpcyBub2RlLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIGFzc29jaWF0ZWQgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBBbnkgYXR0cnMgZm9yIHRoZSBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZTogUkVsZW1lbnQgfCBSVGV4dCB8IG51bGwsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuQ29udGFpbmVyLCBuYXRpdmU6IFJDb21tZW50LCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUQ29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmF0aXZlOiBudWxsLCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUUHJvamVjdGlvbk5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hdGl2ZTogUlRleHQgfCBSRWxlbWVudCB8IFJDb21tZW50IHwgbnVsbCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnROb2RlJlRDb250YWluZXJOb2RlJlRFbGVtZW50Q29udGFpbmVyTm9kZSZUUHJvamVjdGlvbk5vZGUge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydExlc3NUaGFuKGFkanVzdGVkSW5kZXgsIHZpZXdEYXRhLmxlbmd0aCwgYFNsb3Qgc2hvdWxkIGhhdmUgYmVlbiBpbml0aWFsaXplZCB3aXRoIG51bGxgKTtcbiAgdmlld0RhdGFbYWRqdXN0ZWRJbmRleF0gPSBuYXRpdmU7XG5cbiAgbGV0IHROb2RlID0gdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHROb2RlID09IG51bGwpIHtcbiAgICB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBjcmVhdGVUTm9kZSh0eXBlLCBhZGp1c3RlZEluZGV4LCBuYW1lLCBhdHRycywgbnVsbCk7XG5cbiAgICAvLyBOb3cgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZS5cbiAgICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlKSB7XG4gICAgICBpZiAoaXNQYXJlbnQgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID09IG51bGwgJiZcbiAgICAgICAgICAodE5vZGUucGFyZW50ICE9PSBudWxsIHx8IHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykpIHtcbiAgICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgdmlldy5cbiAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gICAgICB9IGVsc2UgaWYgKCFpc1BhcmVudCkge1xuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh0Vmlldy5maXJzdENoaWxkID09IG51bGwgJiYgdHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICB0Vmlldy5maXJzdENoaWxkID0gdE5vZGU7XG4gIH1cblxuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZTtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuICByZXR1cm4gdE5vZGUgYXMgVEVsZW1lbnROb2RlICYgVFZpZXdOb2RlICYgVENvbnRhaW5lck5vZGUgJiBURWxlbWVudENvbnRhaW5lck5vZGUgJlxuICAgICAgVFByb2plY3Rpb25Ob2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlld05vZGUoaW5kZXg6IG51bWJlciwgdmlldzogTFZpZXdEYXRhKSB7XG4gIC8vIFZpZXcgbm9kZXMgYXJlIG5vdCBzdG9yZWQgaW4gZGF0YSBiZWNhdXNlIHRoZXkgY2FuIGJlIGFkZGVkIC8gcmVtb3ZlZCBhdCBydW50aW1lICh3aGljaFxuICAvLyB3b3VsZCBjYXVzZSBpbmRpY2VzIHRvIGNoYW5nZSkuIFRoZWlyIFROb2RlcyBhcmUgaW5zdGVhZCBzdG9yZWQgaW4gdFZpZXcubm9kZS5cbiAgaWYgKHZpZXdbVFZJRVddLm5vZGUgPT0gbnVsbCkge1xuICAgIHZpZXdbVFZJRVddLm5vZGUgPSBjcmVhdGVUTm9kZShUTm9kZVR5cGUuVmlldywgaW5kZXgsIG51bGwsIG51bGwsIG51bGwpIGFzIFRWaWV3Tm9kZTtcbiAgfVxuXG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgcmV0dXJuIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXSA9IHZpZXdbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlO1xufVxuXG5cbi8qKlxuICogV2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkgb3IgQ29tcG9uZW50RmFjdG9yeS5jcmVhdGUpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdEJsdWVwcmludEZvck5ld05vZGUodmlldzogTFZpZXdEYXRhKSB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3LmV4cGFuZG9TdGFydEluZGV4Kys7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2gobnVsbCk7XG4gICAgdmlldy5wdXNoKG51bGwpO1xuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gUmVuZGVyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlc2V0cyB0aGUgYXBwbGljYXRpb24gc3RhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldENvbXBvbmVudFN0YXRlKCkge1xuICBpc1BhcmVudCA9IGZhbHNlO1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBudWxsICE7XG4gIGVsZW1lbnREZXB0aENvdW50ID0gMDtcbiAgYmluZGluZ3NFbmFibGVkID0gdHJ1ZTtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIGhvc3ROb2RlIEV4aXN0aW5nIG5vZGUgdG8gcmVuZGVyIGludG8uXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvbiB3aXRoIHRoZSBpbnN0cnVjdGlvbnMuXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gY29udGV4dCB0byBwYXNzIGludG8gdGhlIHRlbXBsYXRlLlxuICogQHBhcmFtIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5IHJlbmRlcmVyIGZhY3RvcnkgdG8gdXNlXG4gKiBAcGFyYW0gaG9zdCBUaGUgaG9zdCBlbGVtZW50IG5vZGUgdG8gdXNlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVGVtcGxhdGU8VD4oXG4gICAgaG9zdE5vZGU6IFJFbGVtZW50LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlciwgY29udGV4dDogVCxcbiAgICBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgaG9zdFZpZXc6IExWaWV3RGF0YSB8IG51bGwsXG4gICAgZGlyZWN0aXZlcz86IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlcz86IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTFZpZXdEYXRhIHtcbiAgaWYgKGhvc3RWaWV3ID09IG51bGwpIHtcbiAgICByZXNldENvbXBvbmVudFN0YXRlKCk7XG4gICAgcmVuZGVyZXJGYWN0b3J5ID0gcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk7XG4gICAgcmVuZGVyZXIgPSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcblxuICAgIC8vIFdlIG5lZWQgdG8gY3JlYXRlIGEgcm9vdCB2aWV3IHNvIGl0J3MgcG9zc2libGUgdG8gbG9vayB1cCB0aGUgaG9zdCBlbGVtZW50IHRocm91Z2ggaXRzIGluZGV4XG4gICAgdFZpZXcgPSBjcmVhdGVUVmlldygtMSwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgdmlld0RhdGEgPSBjcmVhdGVMVmlld0RhdGEocmVuZGVyZXIsIHRWaWV3LCB7fSwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuSXNSb290KTtcblxuICAgIGNvbnN0IGNvbXBvbmVudFRWaWV3ID1cbiAgICAgICAgZ2V0T3JDcmVhdGVUVmlldyh0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIGRpcmVjdGl2ZXMgfHwgbnVsbCwgcGlwZXMgfHwgbnVsbCwgbnVsbCk7XG4gICAgaG9zdFZpZXcgPVxuICAgICAgICBjcmVhdGVMVmlld0RhdGEocmVuZGVyZXIsIGNvbXBvbmVudFRWaWV3LCBjb250ZXh0LCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBzYW5pdGl6ZXIpO1xuICAgIGhvc3RWaWV3W0hPU1RfTk9ERV0gPSBjcmVhdGVOb2RlQXRJbmRleCgwLCBUTm9kZVR5cGUuRWxlbWVudCwgaG9zdE5vZGUsIG51bGwsIG51bGwpO1xuICB9XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdFZpZXcsIGNvbnRleHQsIHRlbXBsYXRlRm4pO1xuXG4gIHJldHVybiBob3N0Vmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGZvciBjcmVhdGluZyB0aGUgTFZpZXdOb2RlIG9mIGEgZHluYW1pYyBlbWJlZGRlZCB2aWV3LFxuICogZWl0aGVyIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKSBvciBUZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKS5cbiAqIFN1Y2ggbFZpZXdOb2RlIHdpbGwgdGhlbiBiZSByZW5kZXJlciB3aXRoIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSAoc2VlIGJlbG93KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCBkZWNsYXJhdGlvblZpZXc6IExWaWV3RGF0YSwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBxdWVyaWVzOiBMUXVlcmllcyB8IG51bGwsIGluamVjdG9ySW5kZXg6IG51bWJlcik6IExWaWV3RGF0YSB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGlzUGFyZW50O1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlO1xuICBpc1BhcmVudCA9IHRydWU7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IG51bGwgITtcblxuICBjb25zdCBsVmlldyA9XG4gICAgICBjcmVhdGVMVmlld0RhdGEocmVuZGVyZXIsIHRWaWV3LCBjb250ZXh0LCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBnZXRDdXJyZW50U2FuaXRpemVyKCkpO1xuICBsVmlld1tERUNMQVJBVElPTl9WSUVXXSA9IGRlY2xhcmF0aW9uVmlldztcblxuICBpZiAocXVlcmllcykge1xuICAgIGxWaWV3W1FVRVJJRVNdID0gcXVlcmllcy5jcmVhdGVWaWV3KCk7XG4gIH1cbiAgY3JlYXRlVmlld05vZGUoLTEsIGxWaWV3KTtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5ub2RlICEuaW5qZWN0b3JJbmRleCA9IGluamVjdG9ySW5kZXg7XG4gIH1cblxuICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gX3ByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIHJlbmRlcmluZyBlbWJlZGRlZCB2aWV3cyAoZS5nLiBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzKVxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgbXVzdCBzdG9yZS9yZXRyaWV2ZSB0aGVpciBUVmlld3MgZGlmZmVyZW50bHkgZnJvbSBjb21wb25lbnQgdmlld3NcbiAqIGJlY2F1c2UgdGhlaXIgdGVtcGxhdGUgZnVuY3Rpb25zIGFyZSBuZXN0ZWQgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9ucyBvZiB0aGVpciBob3N0cywgY3JlYXRpbmdcbiAqIGNsb3N1cmVzLiBJZiB0aGVpciBob3N0IHRlbXBsYXRlIGhhcHBlbnMgdG8gYmUgYW4gZW1iZWRkZWQgdGVtcGxhdGUgaW4gYSBsb29wIChlLmcuIG5nRm9yIGluc2lkZVxuICogYW4gbmdGb3IpLCB0aGUgbmVzdGluZyB3b3VsZCBtZWFuIHdlJ2QgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uLCBzbyB3ZVxuICogY2FuJ3Qgc3RvcmUgVFZpZXdzIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBpdHNlbGYgKGFzIHdlIGRvIGZvciBjb21wcykuIEluc3RlYWQsIHdlIHN0b3JlIHRoZVxuICogVFZpZXcgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3Mgb24gdGhlaXIgaG9zdCBUTm9kZSwgd2hpY2ggb25seSBoYXMgb25lIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZTxUPihcbiAgICB2aWV3VG9SZW5kZXI6IExWaWV3RGF0YSwgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCByZjogUmVuZGVyRmxhZ3MpIHtcbiAgY29uc3QgX2lzUGFyZW50ID0gaXNQYXJlbnQ7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGU7XG4gIGxldCBvbGRWaWV3OiBMVmlld0RhdGE7XG4gIGlmICh2aWV3VG9SZW5kZXJbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpIHtcbiAgICAvLyBUaGlzIGlzIGEgcm9vdCB2aWV3IGluc2lkZSB0aGUgdmlldyB0cmVlXG4gICAgdGlja1Jvb3RDb250ZXh0KHZpZXdUb1JlbmRlcltDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIGlzUGFyZW50ID0gdHJ1ZTtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IG51bGwgITtcblxuICAgICAgb2xkVmlldyA9IGVudGVyVmlldyh2aWV3VG9SZW5kZXIsIHZpZXdUb1JlbmRlcltIT1NUX05PREVdKTtcbiAgICAgIG5hbWVzcGFjZUhUTUwoKTtcbiAgICAgIHRWaWV3LnRlbXBsYXRlICEocmYsIGNvbnRleHQpO1xuICAgICAgaWYgKHJmICYgUmVuZGVyRmxhZ3MuVXBkYXRlKSB7XG4gICAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgbXVzdCBiZSBzZXQgdG8gZmFsc2UgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGZpcnN0IGNyZWF0aW9uIHJ1biBiZWNhdXNlIGluIGFuXG4gICAgICAgIC8vIG5nRm9yIGxvb3AsIGFsbCB0aGUgdmlld3Mgd2lsbCBiZSBjcmVhdGVkIHRvZ2V0aGVyIGJlZm9yZSB1cGRhdGUgbW9kZSBydW5zIGFuZCB0dXJuc1xuICAgICAgICAvLyBvZmYgZmlyc3RUZW1wbGF0ZVBhc3MuIElmIHdlIGRvbid0IHNldCBpdCBoZXJlLCBpbnN0YW5jZXMgd2lsbCBwZXJmb3JtIGRpcmVjdGl2ZVxuICAgICAgICAvLyBtYXRjaGluZywgZXRjIGFnYWluIGFuZCBhZ2Fpbi5cbiAgICAgICAgdmlld1RvUmVuZGVyW1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcyA9IGZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSBpcyBjYWxsZWQgdHdpY2UsIG9uY2UgZm9yIGNyZWF0aW9uIG9ubHkgYW5kIHRoZW4gb25jZSBmb3JcbiAgICAgIC8vIHVwZGF0ZS4gV2hlbiBmb3IgY3JlYXRpb24gb25seSwgbGVhdmVWaWV3KCkgbXVzdCBub3QgdHJpZ2dlciB2aWV3IGhvb2tzLCBub3IgY2xlYW4gZmxhZ3MuXG4gICAgICBjb25zdCBpc0NyZWF0aW9uT25seSA9IChyZiAmIFJlbmRlckZsYWdzLkNyZWF0ZSkgPT09IFJlbmRlckZsYWdzLkNyZWF0ZTtcbiAgICAgIGxlYXZlVmlldyhvbGRWaWV3ICEsIGlzQ3JlYXRpb25Pbmx5KTtcbiAgICAgIGlzUGFyZW50ID0gX2lzUGFyZW50O1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gX3ByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBjb250ZXh0IGF0IHRoZSBsZXZlbCBzcGVjaWZpZWQgYW5kIHNhdmVzIGl0IGFzIHRoZSBnbG9iYWwsIGNvbnRleHRWaWV3RGF0YS5cbiAqIFdpbGwgZ2V0IHRoZSBuZXh0IGxldmVsIHVwIGlmIGxldmVsIGlzIG5vdCBzcGVjaWZpZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIHRvIHNhdmUgY29udGV4dHMgb2YgcGFyZW50IHZpZXdzIHNvIHRoZXkgY2FuIGJlIGJvdW5kIGluIGVtYmVkZGVkIHZpZXdzLCBvclxuICogaW4gY29uanVuY3Rpb24gd2l0aCByZWZlcmVuY2UoKSB0byBiaW5kIGEgcmVmIGZyb20gYSBwYXJlbnQgdmlldy5cbiAqXG4gKiBAcGFyYW0gbGV2ZWwgVGhlIHJlbGF0aXZlIGxldmVsIG9mIHRoZSB2aWV3IGZyb20gd2hpY2ggdG8gZ3JhYiBjb250ZXh0IGNvbXBhcmVkIHRvIGNvbnRleHRWZXdEYXRhXG4gKiBAcmV0dXJucyBjb250ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q29udGV4dDxUID0gYW55PihsZXZlbDogbnVtYmVyID0gMSk6IFQge1xuICBjb250ZXh0Vmlld0RhdGEgPSB3YWxrVXBWaWV3cyhsZXZlbCwgY29udGV4dFZpZXdEYXRhICEpO1xuICByZXR1cm4gY29udGV4dFZpZXdEYXRhW0NPTlRFWFRdIGFzIFQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlPFQ+KFxuICAgIGhvc3RWaWV3OiBMVmlld0RhdGEsIGNvbXBvbmVudE9yQ29udGV4dDogVCwgdGVtcGxhdGVGbj86IENvbXBvbmVudFRlbXBsYXRlPFQ+KSB7XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIGhvc3RWaWV3W0hPU1RfTk9ERV0pO1xuICB0cnkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGVGbikge1xuICAgICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgICAgdGVtcGxhdGVGbihnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudE9yQ29udGV4dCAhKTtcbiAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhlY3V0ZUluaXRBbmRDb250ZW50SG9va3MoKTtcblxuICAgICAgLy8gRWxlbWVudCB3YXMgc3RvcmVkIGF0IDAgaW4gZGF0YSBhbmQgZGlyZWN0aXZlIHdhcyBzdG9yZWQgYXQgMCBpbiBkaXJlY3RpdmVzXG4gICAgICAvLyBpbiByZW5kZXJDb21wb25lbnQoKVxuICAgICAgc2V0SG9zdEJpbmRpbmdzKCk7XG4gICAgICBjb21wb25lbnRSZWZyZXNoKEhFQURFUl9PRkZTRVQsIGZhbHNlKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gb2YgcmVuZGVyaW5nIGZsYWdzIGRlcGVuZGluZyBvbiB3aGVuIHRoZVxuICogdGVtcGxhdGUgaXMgaW4gY3JlYXRpb24gbW9kZSBvciB1cGRhdGUgbW9kZS4gQnkgZGVmYXVsdCwgdGhlIHVwZGF0ZSBibG9jayBpcyBydW4gd2l0aCB0aGVcbiAqIGNyZWF0aW9uIGJsb2NrIHdoZW4gdGhlIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZS4gT3RoZXJ3aXNlLCB0aGUgdXBkYXRlIGJsb2NrIGlzIHJ1blxuICogYWxvbmUuXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBkbyBOT1QgdXNlIHRoaXMgY29uZmlndXJhdGlvbiAodXBkYXRlIGJsb2NrIGFuZCBjcmVhdGUgYmxvY2sgYXJlXG4gKiBhbHdheXMgcnVuIHNlcGFyYXRlbHkpLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlld0RhdGEpOiBSZW5kZXJGbGFncyB7XG4gIHJldHVybiB2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlID8gUmVuZGVyRmxhZ3MuQ3JlYXRlIHwgUmVuZGVyRmxhZ3MuVXBkYXRlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIE5hbWVzcGFjZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxubGV0IF9jdXJyZW50TmFtZXNwYWNlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VTVkcoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VIVE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTSBlbGVtZW50IG9uIGNyZWF0aW9uLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBlbGVtZW50U3RhcnQoaW5kZXgsIG5hbWUsIGF0dHJzLCBsb2NhbFJlZnMpO1xuICBlbGVtZW50RW5kKCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGxvZ2ljYWwgY29udGFpbmVyIGZvciBvdGhlciBub2RlcyAoPG5nLWNvbnRhaW5lcj4pIGJhY2tlZCBieSBhIGNvbW1lbnQgbm9kZSBpbiB0aGUgRE9NLlxuICogVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRDb250YWluZXJFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3RGF0YSBhcnJheVxuICogQHBhcmFtIGF0dHJzIFNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHVzZWQgd2hlbiBtYXRjaGluZyBkaXJlY3RpdmVzLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogRXZlbiBpZiB0aGlzIGluc3RydWN0aW9uIGFjY2VwdHMgYSBzZXQgb2YgYXR0cmlidXRlcyBubyBhY3R1YWwgYXR0cmlidXRlIHZhbHVlcyBhcmUgcHJvcGFnYXRlZCB0b1xuICogdGhlIERPTSAoYXMgYSBjb21tZW50IG5vZGUgY2FuJ3QgaGF2ZSBhdHRyaWJ1dGVzKS4gQXR0cmlidXRlcyBhcmUgaGVyZSBvbmx5IGZvciBkaXJlY3RpdmVcbiAqIG1hdGNoaW5nIHB1cnBvc2VzIGFuZCBzZXR0aW5nIGluaXRpYWwgaW5wdXRzIG9mIGRpcmVjdGl2ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q29udGFpbmVyU3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50IGNvbnRhaW5lcnMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gIGNvbnN0IG5hdGl2ZSA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ25nLWNvbnRhaW5lcicgOiAnJyk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4IC0gMSk7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBuYXRpdmUsIG51bGwsIGF0dHJzIHx8IG51bGwpO1xuXG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdE5vZGUsIHZpZXdEYXRhKTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhsb2NhbFJlZnMpO1xufVxuXG4vKiogTWFyayB0aGUgZW5kIG9mIHRoZSA8bmctY29udGFpbmVyPi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q29udGFpbmVyRW5kKCk6IHZvaWQge1xuICBpZiAoaXNQYXJlbnQpIHtcbiAgICBpc1BhcmVudCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG4gIGN1cnJlbnRRdWVyaWVzICYmXG4gICAgICAoY3VycmVudFF1ZXJpZXMgPSBjdXJyZW50UXVlcmllcy5hZGROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSBhcyBURWxlbWVudENvbnRhaW5lck5vZGUpKTtcblxuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncywgdFZpZXcpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBET00gZWxlbWVudC4gVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3RGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NIGVsZW1lbnQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzICcpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG5cbiAgY29uc3QgbmF0aXZlID0gZWxlbWVudENyZWF0ZShuYW1lKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggLSAxKTtcblxuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgbmF0aXZlICEsIG5hbWUsIGF0dHJzIHx8IG51bGwpO1xuXG4gIGlmIChhdHRycykge1xuICAgIHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdE5vZGUsIHZpZXdEYXRhKTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhsb2NhbFJlZnMpO1xuXG4gIC8vIGFueSBpbW1lZGlhdGUgY2hpbGRyZW4gb2YgYSBjb21wb25lbnQgb3IgdGVtcGxhdGUgY29udGFpbmVyIG11c3QgYmUgcHJlLWVtcHRpdmVseVxuICAvLyBtb25rZXktcGF0Y2hlZCB3aXRoIHRoZSBjb21wb25lbnQgdmlldyBkYXRhIHNvIHRoYXQgdGhlIGVsZW1lbnQgY2FuIGJlIGluc3BlY3RlZFxuICAvLyBsYXRlciBvbiB1c2luZyBhbnkgZWxlbWVudCBkaXNjb3ZlcnkgdXRpbGl0eSBtZXRob2RzIChzZWUgYGVsZW1lbnRfZGlzY292ZXJ5LnRzYClcbiAgaWYgKGVsZW1lbnREZXB0aENvdW50ID09PSAwKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgdmlld0RhdGEpO1xuICB9XG4gIGVsZW1lbnREZXB0aENvdW50Kys7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5hdGl2ZSBlbGVtZW50IGZyb20gYSB0YWcgbmFtZSwgdXNpbmcgYSByZW5kZXJlci5cbiAqIEBwYXJhbSBuYW1lIHRoZSB0YWcgbmFtZVxuICogQHBhcmFtIG92ZXJyaWRkZW5SZW5kZXJlciBPcHRpb25hbCBBIHJlbmRlcmVyIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IG9uZVxuICogQHJldHVybnMgdGhlIGVsZW1lbnQgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENyZWF0ZShuYW1lOiBzdHJpbmcsIG92ZXJyaWRkZW5SZW5kZXJlcj86IFJlbmRlcmVyMyk6IFJFbGVtZW50IHtcbiAgbGV0IG5hdGl2ZTogUkVsZW1lbnQ7XG4gIGNvbnN0IHJlbmRlcmVyVG9Vc2UgPSBvdmVycmlkZGVuUmVuZGVyZXIgfHwgcmVuZGVyZXI7XG5cbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyVG9Vc2UpKSB7XG4gICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50KG5hbWUsIF9jdXJyZW50TmFtZXNwYWNlKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoX2N1cnJlbnROYW1lc3BhY2UgPT09IG51bGwpIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50TlMoX2N1cnJlbnROYW1lc3BhY2UsIG5hbWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmF0aXZlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgZGlyZWN0aXZlIGluc3RhbmNlcyBhbmQgcG9wdWxhdGVzIGxvY2FsIHJlZnMuXG4gKlxuICogQHBhcmFtIGxvY2FsUmVmcyBMb2NhbCByZWZzIG9mIHRoZSBub2RlIGluIHF1ZXN0aW9uXG4gKiBAcGFyYW0gbG9jYWxSZWZFeHRyYWN0b3IgbWFwcGluZyBmdW5jdGlvbiB0aGF0IGV4dHJhY3RzIGxvY2FsIHJlZiB2YWx1ZSBmcm9tIFROb2RlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoXG4gICAgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgbG9jYWxSZWZFeHRyYWN0b3I6IExvY2FsUmVmRXh0cmFjdG9yID0gZ2V0TmF0aXZlQnlUTm9kZSkge1xuICBpZiAoIWJpbmRpbmdzRW5hYmxlZCkgcmV0dXJuO1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZpcnN0VGVtcGxhdGVQYXNzKys7XG4gICAgY2FjaGVNYXRjaGluZ0RpcmVjdGl2ZXNGb3JOb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgdFZpZXcsIGxvY2FsUmVmcyB8fCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBpbnN0YW50aWF0ZURpcmVjdGl2ZXNEaXJlY3RseSgpO1xuICB9XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsb2NhbFJlZkV4dHJhY3Rvcik7XG59XG5cbi8qKlxuICogT24gZmlyc3QgdGVtcGxhdGUgcGFzcywgd2UgbWF0Y2ggZWFjaCBub2RlIGFnYWluc3QgYXZhaWxhYmxlIGRpcmVjdGl2ZSBzZWxlY3RvcnMgYW5kIHNhdmVcbiAqIHRoZSByZXN1bHRpbmcgZGVmcyBpbiB0aGUgY29ycmVjdCBpbnN0YW50aWF0aW9uIG9yZGVyIGZvciBzdWJzZXF1ZW50IGNoYW5nZSBkZXRlY3Rpb24gcnVuc1xuICogKHNvIGRlcGVuZGVuY2llcyBhcmUgYWx3YXlzIGNyZWF0ZWQgYmVmb3JlIHRoZSBkaXJlY3RpdmVzIHRoYXQgaW5qZWN0IHRoZW0pLlxuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nRGlyZWN0aXZlc0Zvck5vZGUoXG4gICAgdE5vZGU6IFROb2RlLCB0VmlldzogVFZpZXcsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIC8vIFBsZWFzZSBtYWtlIHN1cmUgdG8gaGF2ZSBleHBsaWNpdCB0eXBlIGZvciBgZXhwb3J0c01hcGAuIEluZmVycmVkIHR5cGUgdHJpZ2dlcnMgYnVnIGluIHRzaWNrbGUuXG4gIGNvbnN0IGV4cG9ydHNNYXA6ICh7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpID0gbG9jYWxSZWZzID8geycnOiAtMX0gOiBudWxsO1xuICBjb25zdCBtYXRjaGVzID0gdFZpZXcuY3VycmVudE1hdGNoZXMgPSBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0Tm9kZSk7XG4gIGdlbmVyYXRlRXhwYW5kb0Jsb2NrKHROb2RlLCBtYXRjaGVzKTtcbiAgbGV0IHRvdGFsSG9zdFZhcnMgPSAwO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGVmID0gbWF0Y2hlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGNvbnN0IHZhbHVlSW5kZXggPSBpICsgMTtcbiAgICAgIHJlc29sdmVEaXJlY3RpdmUoZGVmLCB2YWx1ZUluZGV4LCBtYXRjaGVzKTtcbiAgICAgIHRvdGFsSG9zdFZhcnMgKz0gZGVmLmhvc3RWYXJzO1xuICAgICAgc2F2ZU5hbWVUb0V4cG9ydE1hcChtYXRjaGVzW3ZhbHVlSW5kZXhdIGFzIG51bWJlciwgZGVmLCBleHBvcnRzTWFwKTtcbiAgICB9XG4gIH1cbiAgaWYgKGV4cG9ydHNNYXApIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKHROb2RlLCBsb2NhbFJlZnMsIGV4cG9ydHNNYXApO1xuICBwcmVmaWxsSG9zdFZhcnModG90YWxIb3N0VmFycyk7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgbmV3IGJsb2NrIGluIFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgZm9yIHRoaXMgbm9kZS5cbiAqXG4gKiBFYWNoIGV4cGFuZG8gYmxvY2sgc3RhcnRzIHdpdGggdGhlIGVsZW1lbnQgaW5kZXggKHR1cm5lZCBuZWdhdGl2ZSBzbyB3ZSBjYW4gZGlzdGluZ3Vpc2hcbiAqIGl0IGZyb20gdGhlIGhvc3RWYXIgY291bnQpIGFuZCB0aGUgZGlyZWN0aXZlIGNvdW50LiBTZWUgbW9yZSBpbiBWSUVXX0RBVEEubWQuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlRXhwYW5kb0Jsb2NrKHROb2RlOiBUTm9kZSwgbWF0Y2hlczogQ3VycmVudE1hdGNoZXNMaXN0IHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBkaXJlY3RpdmVDb3VudCA9IG1hdGNoZXMgPyBtYXRjaGVzLmxlbmd0aCAvIDIgOiAwO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSAtKHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gIGlmIChkaXJlY3RpdmVDb3VudCA+IDApIHtcbiAgICAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyB8fCAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyA9IFtcbiAgICAgXSkpLnB1c2goZWxlbWVudEluZGV4LCBkaXJlY3RpdmVDb3VudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgd2UgbmVlZCB0byByZXNlcnZlIHNwYWNlIGZvciBob3N0IGJpbmRpbmcgdmFsdWVzXG4gKiBhZnRlciBkaXJlY3RpdmVzIGFyZSBtYXRjaGVkIChzbyBhbGwgZGlyZWN0aXZlcyBhcmUgc2F2ZWQsIHRoZW4gYmluZGluZ3MpLlxuICogQmVjYXVzZSB3ZSBhcmUgdXBkYXRpbmcgdGhlIGJsdWVwcmludCwgd2Ugb25seSBuZWVkIHRvIGRvIHRoaXMgb25jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByZWZpbGxIb3N0VmFycyh0b3RhbEhvc3RWYXJzOiBudW1iZXIpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbEhvc3RWYXJzOyBpKyspIHtcbiAgICB2aWV3RGF0YS5wdXNoKE5PX0NIQU5HRSk7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2goTk9fQ0hBTkdFKTtcbiAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gIH1cbn1cblxuLyoqIE1hdGNoZXMgdGhlIGN1cnJlbnQgbm9kZSBhZ2FpbnN0IGFsbCBhdmFpbGFibGUgc2VsZWN0b3JzLiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXModE5vZGU6IFROb2RlKTogQ3VycmVudE1hdGNoZXNMaXN0fG51bGwge1xuICBjb25zdCByZWdpc3RyeSA9IHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogYW55W118bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldO1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSk7XG4gICAgICAgIGlmIChkZWYuZGlQdWJsaWMpIGRlZi5kaVB1YmxpYyhkZWYpO1xuXG4gICAgICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KS50ZW1wbGF0ZSkge1xuICAgICAgICAgIGlmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpIHRocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcih0Tm9kZSk7XG4gICAgICAgICAgYWRkQ29tcG9uZW50TG9naWMoZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KTtcbiAgICAgICAgICAvLyBUaGUgY29tcG9uZW50IGlzIGFsd2F5cyBzdG9yZWQgZmlyc3Qgd2l0aCBkaXJlY3RpdmVzIGFmdGVyLlxuICAgICAgICAgIG1hdGNoZXMudW5zaGlmdChkZWYsIG51bGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzIGFzIEN1cnJlbnRNYXRjaGVzTGlzdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVEaXJlY3RpdmUoXG4gICAgZGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgdmFsdWVJbmRleDogbnVtYmVyLCBtYXRjaGVzOiBDdXJyZW50TWF0Y2hlc0xpc3QpOiBhbnkge1xuICBpZiAobWF0Y2hlc1t2YWx1ZUluZGV4XSA9PT0gbnVsbCkge1xuICAgIG1hdGNoZXNbdmFsdWVJbmRleF0gPSBDSVJDVUxBUjtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGRlZi5mYWN0b3J5KCk7XG4gICAgcmV0dXJuIGRpcmVjdGl2ZUNyZWF0ZShtYXRjaGVzW3ZhbHVlSW5kZXhdID0gdmlld0RhdGEubGVuZ3RoLCBpbnN0YW5jZSwgZGVmKTtcbiAgfSBlbHNlIGlmIChtYXRjaGVzW3ZhbHVlSW5kZXhdID09PSBDSVJDVUxBUikge1xuICAgIC8vIElmIHdlIHJldmlzaXQgdGhpcyBkaXJlY3RpdmUgYmVmb3JlIGl0J3MgcmVzb2x2ZWQsIHdlIGtub3cgaXQncyBjaXJjdWxhclxuICAgIHRocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yKGRlZi50eXBlKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFN0b3JlcyBpbmRleCBvZiBjb21wb25lbnQncyBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIHZpZXcgcmVmcmVzaCBkdXJpbmcgQ0QuICovXG5mdW5jdGlvbiBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2soKTogdm9pZCB7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICh0Vmlldy5jb21wb25lbnRzIHx8ICh0Vmlldy5jb21wb25lbnRzID0gW10pKS5wdXNoKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCk7XG4gIH1cbn1cblxuLyoqIFN0b3JlcyBpbmRleCBvZiBkaXJlY3RpdmUgYW5kIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgYmluZGluZyByZWZyZXNoIGR1cmluZyBDRC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXVlSG9zdEJpbmRpbmdGb3JDaGVjayhcbiAgICBkaXJJbmRleDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55Pik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGluIGZpcnN0IHRlbXBsYXRlIHBhc3MuJyk7XG4gIHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgIS5wdXNoKGRlZi5ob3N0QmluZGluZ3MgISwgZGVmLmhvc3RWYXJzKTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGluc3RhbnRpYXRlcyB0aGUgZ2l2ZW4gZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVEaXJlY3RpdmVzRGlyZWN0bHkoKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBmaXJzdFRlbXBsYXRlUGFzcywgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgYERpcmVjdGl2ZXMgc2hvdWxkIG9ubHkgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5IGFmdGVyIGZpcnN0IHRlbXBsYXRlIHBhc3NgKTtcbiAgY29uc3QgY291bnQgPSBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHByZXZpb3VzT3JQYXJlbnRUTm9kZSkgJiYgY3VycmVudFF1ZXJpZXMpIHtcbiAgICBjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmNsb25lKCk7XG4gIH1cblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PjtcblxuICAgICAgLy8gQ29tcG9uZW50IHZpZXcgbXVzdCBiZSBzZXQgb24gbm9kZSBiZWZvcmUgdGhlIGZhY3RvcnkgaXMgY3JlYXRlZCBzb1xuICAgICAgLy8gQ2hhbmdlRGV0ZWN0b3JSZWZzIGhhdmUgYSB3YXkgdG8gc3RvcmUgY29tcG9uZW50IHZpZXcgb24gY3JlYXRpb24uXG4gICAgICBpZiAoKGRlZiBhcyBDb21wb25lbnREZWY8YW55PikudGVtcGxhdGUpIHtcbiAgICAgICAgYWRkQ29tcG9uZW50TG9naWMoZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KTtcbiAgICAgIH1cbiAgICAgIGRpcmVjdGl2ZUNyZWF0ZShpLCBkZWYuZmFjdG9yeSgpLCBkZWYpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsLCBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSk6IHZvaWQge1xuICBpZiAobG9jYWxSZWZzKSB7XG4gICAgY29uc3QgbG9jYWxOYW1lczogKHN0cmluZyB8IG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4gKiB0byB0aGVpciBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzXSA9IGluZGV4O1xuICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KS50ZW1wbGF0ZSkgZXhwb3J0c01hcFsnJ10gPSBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIExWaWV3RGF0YSBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IGFyZSBsb2FkZWQgaW4gdGhlIHRlbXBsYXRlIHdpdGggbG9hZCgpLlxuICovXG5mdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEobG9jYWxSZWZFeHRyYWN0b3I6IExvY2FsUmVmRXh0cmFjdG9yKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSBwcmV2aW91c09yUGFyZW50VE5vZGUubG9jYWxOYW1lcztcbiAgY29uc3QgdE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGU7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggKyAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluZGV4ID09PSAtMSA/IGxvY2FsUmVmRXh0cmFjdG9yKHROb2RlLCB2aWV3RGF0YSkgOiB2aWV3RGF0YVtpbmRleF07XG4gICAgICB2aWV3RGF0YVtsb2NhbEluZGV4KytdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0cyBUVmlldyBmcm9tIGEgdGVtcGxhdGUgZnVuY3Rpb24gb3IgY3JlYXRlcyBhIG5ldyBUVmlld1xuICogaWYgaXQgZG9lc24ndCBhbHJlYWR5IGV4aXN0LlxuICpcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRoZSB0ZW1wbGF0ZSBmcm9tIHdoaWNoIHRvIGdldCBzdGF0aWMgZGF0YVxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB2aWV3XG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGFuZCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIGluIHRoaXMgdmlld1xuICogQHBhcmFtIGRpcmVjdGl2ZXMgRGlyZWN0aXZlIGRlZnMgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gVFZpZXdcbiAqIEBwYXJhbSBwaXBlcyBQaXBlIGRlZnMgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gVFZpZXdcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3KFxuICAgIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICAvLyBUT0RPKG1pc2tvKTogcmVhZGluZyBgbmdQcml2YXRlRGF0YWAgaGVyZSBpcyBwcm9ibGVtYXRpYyBmb3IgdHdvIHJlYXNvbnNcbiAgLy8gMS4gSXQgaXMgYSBtZWdhbW9ycGhpYyBjYWxsIG9uIGVhY2ggaW52b2NhdGlvbi5cbiAgLy8gMi4gRm9yIG5lc3RlZCBlbWJlZGRlZCB2aWV3cyAobmdGb3IgaW5zaWRlIG5nRm9yKSB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgaXMgcGVyXG4gIC8vICAgIG91dGVyIHRlbXBsYXRlIGludm9jYXRpb24sIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3VjaCBwcm9wZXJ0eSB3aWxsIGV4aXN0XG4gIC8vIENvcnJlY3Qgc29sdXRpb24gaXMgdG8gb25seSBwdXQgYG5nUHJpdmF0ZURhdGFgIG9uIHRoZSBDb21wb25lbnQgdGVtcGxhdGVcbiAgLy8gYW5kIG5vdCBvbiBlbWJlZGRlZCB0ZW1wbGF0ZXMuXG5cbiAgcmV0dXJuIHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSB8fFxuICAgICAgKHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSA9XG4gICAgICAgICAgIGNyZWF0ZVRWaWV3KC0xLCB0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIGRpcmVjdGl2ZXMsIHBpcGVzLCB2aWV3UXVlcnkpIGFzIG5ldmVyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSB2aWV3QmxvY2tJZCBmb3IgaW5saW5lIHZpZXdzLCBvciAtMSBpZiBpdCdzIGEgY29tcG9uZW50L2R5bmFtaWNcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICB2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PGFueT58IG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgY29uc3RzO1xuICAvLyBUaGlzIGxlbmd0aCBkb2VzIG5vdCB5ZXQgY29udGFpbiBob3N0IGJpbmRpbmdzIGZyb20gY2hpbGQgZGlyZWN0aXZlcyBiZWNhdXNlIGF0IHRoaXMgcG9pbnQsXG4gIC8vIHdlIGRvbid0IGtub3cgd2hpY2ggZGlyZWN0aXZlcyBhcmUgYWN0aXZlIG9uIHRoaXMgdGVtcGxhdGUuIEFzIHNvb24gYXMgYSBkaXJlY3RpdmUgaXMgbWF0Y2hlZFxuICAvLyB0aGF0IGhhcyBhIGhvc3QgYmluZGluZywgd2Ugd2lsbCB1cGRhdGUgdGhlIGJsdWVwcmludCB3aXRoIHRoYXQgZGVmJ3MgaG9zdFZhcnMgY291bnQuXG4gIGNvbnN0IGluaXRpYWxWaWV3TGVuZ3RoID0gYmluZGluZ1N0YXJ0SW5kZXggKyB2YXJzO1xuICBjb25zdCBibHVlcHJpbnQgPSBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4LCBpbml0aWFsVmlld0xlbmd0aCk7XG4gIHJldHVybiBibHVlcHJpbnRbVFZJRVddID0ge1xuICAgIGlkOiB2aWV3SW5kZXgsXG4gICAgYmx1ZXByaW50OiBibHVlcHJpbnQsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlRm4sXG4gICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgbm9kZTogbnVsbCAhLFxuICAgIGRhdGE6IGJsdWVwcmludC5zbGljZSgpLCAgLy8gRmlsbCBpbiB0byBtYXRjaCBIRUFERVJfT0ZGU0VUIGluIExWaWV3RGF0YVxuICAgIGNoaWxkSW5kZXg6IC0xLCAgICAgICAgICAgLy8gQ2hpbGRyZW4gc2V0IGluIGFkZFRvVmlld1RyZWUoKSwgaWYgYW55XG4gICAgYmluZGluZ1N0YXJ0SW5kZXg6IGJpbmRpbmdTdGFydEluZGV4LFxuICAgIGV4cGFuZG9TdGFydEluZGV4OiBpbml0aWFsVmlld0xlbmd0aCxcbiAgICBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBudWxsLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgIGluaXRIb29rczogbnVsbCxcbiAgICBjaGVja0hvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgIHBpcGVEZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBjb250ZW50UXVlcmllczogbnVsbCxcbiAgICBjb21wb25lbnRzOiBudWxsLFxuICAgIGRpcmVjdGl2ZVJlZ2lzdHJ5OiB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/IGRpcmVjdGl2ZXMoKSA6IGRpcmVjdGl2ZXMsXG4gICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgY3VycmVudE1hdGNoZXM6IG51bGwsXG4gICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLCBpbml0aWFsVmlld0xlbmd0aDogbnVtYmVyKTogTFZpZXdEYXRhIHtcbiAgY29uc3QgYmx1ZXByaW50ID0gbmV3IEFycmF5KGluaXRpYWxWaWV3TGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbGwobnVsbCwgMCwgYmluZGluZ1N0YXJ0SW5kZXgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsbChOT19DSEFOR0UsIGJpbmRpbmdTdGFydEluZGV4KSBhcyBMVmlld0RhdGE7XG4gIGJsdWVwcmludFtDT05UQUlORVJfSU5ERVhdID0gLTE7XG4gIGJsdWVwcmludFtCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdTdGFydEluZGV4O1xuICByZXR1cm4gYmx1ZXByaW50O1xufVxuXG5mdW5jdGlvbiBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlOiBSRWxlbWVudCwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogdm9pZCB7XG4gIGNvbnN0IGlzUHJvYyA9IGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSBicmVhaztcbiAgICBpZiAoYXR0ck5hbWUgPT09IE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FKSB7XG4gICAgICBpICs9IDI7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgICAvLyBOYW1lc3BhY2VkIGF0dHJpYnV0ZXNcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlVVJJID0gYXR0cnNbaSArIDFdIGFzIHN0cmluZztcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpICsgMl0gYXMgc3RyaW5nO1xuICAgICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbaSArIDNdIGFzIHN0cmluZztcbiAgICAgICAgaXNQcm9jID9cbiAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKVxuICAgICAgICAgICAgICAgIC5zZXRBdHRyaWJ1dGUobmF0aXZlLCBhdHRyTmFtZSwgYXR0clZhbCwgbmFtZXNwYWNlVVJJKSA6XG4gICAgICAgICAgICBuYXRpdmUuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBhdHRyTmFtZSwgYXR0clZhbCk7XG4gICAgICAgIGkgKz0gNDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFN0YW5kYXJkIGF0dHJpYnV0ZXNcbiAgICAgICAgY29uc3QgYXR0clZhbCA9IGF0dHJzW2kgKyAxXTtcbiAgICAgICAgaXNQcm9jID9cbiAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKVxuICAgICAgICAgICAgICAgIC5zZXRBdHRyaWJ1dGUobmF0aXZlLCBhdHRyTmFtZSBhcyBzdHJpbmcsIGF0dHJWYWwgYXMgc3RyaW5nKSA6XG4gICAgICAgICAgICBuYXRpdmUuc2V0QXR0cmlidXRlKGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpO1xuICAgICAgICBpICs9IDI7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvcih0ZXh0OiBzdHJpbmcsIHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgUmVuZGVyZXI6ICR7dGV4dH0gWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBob3N0IG5hdGl2ZSBlbGVtZW50LCB1c2VkIGZvciBib290c3RyYXBwaW5nIGV4aXN0aW5nIG5vZGVzIGludG8gcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50T3JTZWxlY3RvciBSZW5kZXIgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgdG8gbG9jYXRlIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYXRlSG9zdEVsZW1lbnQoXG4gICAgZmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgZWxlbWVudE9yU2VsZWN0b3I6IFJFbGVtZW50IHwgc3RyaW5nKTogUkVsZW1lbnR8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSgtMSk7XG4gIHJlbmRlcmVyRmFjdG9yeSA9IGZhY3Rvcnk7XG4gIGNvbnN0IGRlZmF1bHRSZW5kZXJlciA9IGZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG4gIGNvbnN0IHJOb2RlID0gdHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJyA/XG4gICAgICAoaXNQcm9jZWR1cmFsUmVuZGVyZXIoZGVmYXVsdFJlbmRlcmVyKSA/XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5zZWxlY3RSb290RWxlbWVudChlbGVtZW50T3JTZWxlY3RvcikgOlxuICAgICAgICAgICBkZWZhdWx0UmVuZGVyZXIucXVlcnlTZWxlY3RvcihlbGVtZW50T3JTZWxlY3RvcikpIDpcbiAgICAgIGVsZW1lbnRPclNlbGVjdG9yO1xuICBpZiAobmdEZXZNb2RlICYmICFyTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIHdpdGggc2VsZWN0b3Igbm90IGZvdW5kOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSBpcyByZXF1aXJlZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiByTm9kZTtcbn1cblxuLyoqXG4gKiBBZGRzIGFuIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBjdXJyZW50IG5vZGUuXG4gKlxuICogSWYgYW4gb3V0cHV0IGV4aXN0cyBvbiBvbmUgb2YgdGhlIG5vZGUncyBkaXJlY3RpdmVzLCBpdCBhbHNvIHN1YnNjcmliZXMgdG8gdGhlIG91dHB1dFxuICogYW5kIHNhdmVzIHRoZSBzdWJzY3JpcHRpb24gZm9yIGxhdGVyIGNsZWFudXAuXG4gKlxuICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIGV2ZW50IGVtaXRzXG4gKiBAcGFyYW0gdXNlQ2FwdHVyZSBXaGV0aGVyIG9yIG5vdCB0byB1c2UgY2FwdHVyZSBpbiBldmVudCBsaXN0ZW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIC8vIGFkZCBuYXRpdmUgZXZlbnQgbGlzdGVuZXIgLSBhcHBsaWNhYmxlIHRvIGVsZW1lbnRzIG9ubHlcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIHZpZXdEYXRhKSBhcyBSRWxlbWVudDtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkRXZlbnRMaXN0ZW5lcisrO1xuXG4gICAgLy8gSW4gb3JkZXIgdG8gbWF0Y2ggY3VycmVudCBiZWhhdmlvciwgbmF0aXZlIERPTSBldmVudCBsaXN0ZW5lcnMgbXVzdCBiZSBhZGRlZCBmb3IgYWxsXG4gICAgLy8gZXZlbnRzIChpbmNsdWRpbmcgb3V0cHV0cykuXG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKG5hdGl2ZSwgZXZlbnROYW1lLCBsaXN0ZW5lckZuKTtcbiAgICAgIHN0b3JlQ2xlYW51cEZuKHZpZXdEYXRhLCBjbGVhbnVwRm4pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB3cmFwcGVkTGlzdGVuZXIgPSB3cmFwTGlzdGVuZXJXaXRoUHJldmVudERlZmF1bHQobGlzdGVuZXJGbik7XG4gICAgICBuYXRpdmUuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIHdyYXBwZWRMaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICBjb25zdCBjbGVhbnVwSW5zdGFuY2VzID0gZ2V0Q2xlYW51cCh2aWV3RGF0YSk7XG4gICAgICBjbGVhbnVwSW5zdGFuY2VzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICAgIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgICBnZXRUVmlld0NsZWFudXAodmlld0RhdGEpLnB1c2goXG4gICAgICAgICAgICBldmVudE5hbWUsIHROb2RlLmluZGV4LCBjbGVhbnVwSW5zdGFuY2VzICEubGVuZ3RoIC0gMSwgdXNlQ2FwdHVyZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gc3Vic2NyaWJlIHRvIGRpcmVjdGl2ZSBvdXRwdXRzXG4gIGlmICh0Tm9kZS5vdXRwdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBpZiB3ZSBjcmVhdGUgVE5vZGUgaGVyZSwgaW5wdXRzIG11c3QgYmUgdW5kZWZpbmVkIHNvIHdlIGtub3cgdGhleSBzdGlsbCBuZWVkIHRvIGJlXG4gICAgLy8gY2hlY2tlZFxuICAgIHROb2RlLm91dHB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZS5mbGFncywgQmluZGluZ0RpcmVjdGlvbi5PdXRwdXQpO1xuICB9XG5cbiAgY29uc3Qgb3V0cHV0cyA9IHROb2RlLm91dHB1dHM7XG4gIGxldCBvdXRwdXREYXRhOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAob3V0cHV0cyAmJiAob3V0cHV0RGF0YSA9IG91dHB1dHNbZXZlbnROYW1lXSkpIHtcbiAgICBjcmVhdGVPdXRwdXQob3V0cHV0RGF0YSwgbGlzdGVuZXJGbik7XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHBhcnRpY3VsYXIgZXZlbnQgbmFtZSBhbmQgc3Vic2NyaWJlcyB0b1xuICogZWFjaCBvdXRwdXQuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU91dHB1dChvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG91dHB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2Uob3V0cHV0c1tpXSBhcyBudW1iZXIsIHZpZXdEYXRhKTtcbiAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB2aWV3RGF0YVtvdXRwdXRzW2ldIGFzIG51bWJlcl1bb3V0cHV0c1tpICsgMV1dLnN1YnNjcmliZShsaXN0ZW5lcik7XG4gICAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQodmlld0RhdGEsIHN1YnNjcmlwdGlvbiwgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIGNvbnRleHQgZm9yIHRoaXMgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBzYXZlcyBpbiBUVmlldzpcbiAqIC0gQ2xlYW51cCBmdW5jdGlvblxuICogLSBJbmRleCBvZiBjb250ZXh0IHdlIGp1c3Qgc2F2ZWQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwV2l0aENvbnRleHQoXG4gICAgdmlldzogTFZpZXdEYXRhIHwgbnVsbCwgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGlmICghdmlldykgdmlldyA9IHZpZXdEYXRhO1xuICBnZXRDbGVhbnVwKHZpZXcpLnB1c2goY29udGV4dCk7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2goY2xlYW51cEZuLCB2aWV3W0NMRUFOVVBdICEubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyB0aGUgY2xlYW51cCBmdW5jdGlvbiBpdHNlbGYgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgZnVuY3Rpb25zIHRoYXQgYXJlIHdyYXBwZWQgd2l0aCB0aGVpciBjb250ZXh0cywgbGlrZSBpbiByZW5kZXJlcjJcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGlzIHNhdmVkIGluIFRWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwRm4odmlldzogTFZpZXdEYXRhLCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGdldENsZWFudXAodmlldykucHVzaChjbGVhbnVwRm4pO1xuXG4gIGlmICh2aWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3KS5wdXNoKHZpZXdbQ0xFQU5VUF0gIS5sZW5ndGggLSAxLCBudWxsKTtcbiAgfVxufVxuXG4vKiogTWFyayB0aGUgZW5kIG9mIHRoZSBlbGVtZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRFbmQoKTogdm9pZCB7XG4gIGlmIChpc1BhcmVudCkge1xuICAgIGlzUGFyZW50ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgITtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gIGN1cnJlbnRRdWVyaWVzICYmXG4gICAgICAoY3VycmVudFF1ZXJpZXMgPSBjdXJyZW50UXVlcmllcy5hZGROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSBhcyBURWxlbWVudE5vZGUpKTtcblxuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncywgdFZpZXcpO1xuICBlbGVtZW50RGVwdGhDb3VudC0tO1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHZhbHVlIG9mIHJlbW92ZXMgYW4gYXR0cmlidXRlIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIG51bWJlciBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB2YWx1ZSB2YWx1ZSBUaGUgYXR0cmlidXRlIGlzIHJlbW92ZWQgd2hlbiB2YWx1ZSBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAuXG4gKiAgICAgICAgICAgICAgICAgIE90aGVyd2lzZSB0aGUgYXR0cmlidXRlIHZhbHVlIGlzIHNldCB0byB0aGUgc3RyaW5naWZpZWQgdmFsdWUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEF0dHJpYnV0ZShcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIHNhbml0aXplcj86IFNhbml0aXplckZuKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIHZpZXdEYXRhKTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQsIG5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICBjb25zdCBzdHJWYWx1ZSA9IHNhbml0aXplciA9PSBudWxsID8gc3RyaW5naWZ5KHZhbHVlKSA6IHNhbml0aXplcih2YWx1ZSk7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgc3RyVmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHN0clZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBwcm9wZXJ0eSBvbiBhbiBFbGVtZW50LlxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgQElucHV0cyBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50UHJvcGVydHk8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHNhbml0aXplcj86IFNhbml0aXplckZuKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PT0gTk9fQ0hBTkdFKSByZXR1cm47XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCB2aWV3RGF0YSkgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgdmlld0RhdGEpO1xuICAvLyBpZiB0Tm9kZS5pbnB1dHMgaXMgdW5kZWZpbmVkLCBhIGxpc3RlbmVyIGhhcyBjcmVhdGVkIG91dHB1dHMsIGJ1dCBpbnB1dHMgaGF2ZW4ndFxuICAvLyB5ZXQgYmVlbiBjaGVja2VkXG4gIGlmICh0Tm9kZSAmJiB0Tm9kZS5pbnB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIG1hcmsgaW5wdXRzIGFzIGNoZWNrZWRcbiAgICB0Tm9kZS5pbnB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZS5mbGFncywgQmluZGluZ0RpcmVjdGlvbi5JbnB1dCk7XG4gIH1cblxuICBjb25zdCBpbnB1dERhdGEgPSB0Tm9kZSAmJiB0Tm9kZS5pbnB1dHM7XG4gIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmIChpbnB1dERhdGEgJiYgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtwcm9wTmFtZV0pKSB7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgaWYgKGlzQ29tcG9uZW50KHROb2RlKSkgbWFya0RpcnR5SWZPblB1c2goaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLnNldFByb3BlcnR5KGVsZW1lbnQgYXMgUkVsZW1lbnQsIHByb3BOYW1lLCB2YWx1ZSkgOlxuICAgICAgICAoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldFByb3BlcnR5ID8gKGVsZW1lbnQgYXMgYW55KS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbGVtZW50IGFzIGFueSlbcHJvcE5hbWVdID0gdmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogRW5hYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudHMuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIGRpc2FibGVkQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSBlbmFibGVCaW5kaW5ncygpIC0tPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBiaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIERpc2FibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50LlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSBkaXNhYmxlZEJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNhYmxlQmluZGluZ3MoKTogdm9pZCB7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgdFZpZXdzOiBUVmlld1tdIHwgbnVsbCk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50Tm9kZSsrO1xuICBjb25zdCBwYXJlbnQgPVxuICAgICAgaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOiBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcblxuICAvLyBQYXJlbnRzIGNhbm5vdCBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyBiZWNhdXNlIGNvbXBvbmVudHMgd2lsbCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyxcbiAgLy8gc28gaXQncyBvbmx5IHNldCBpZiB0aGUgdmlldyBpcyB0aGUgc2FtZS5cbiAgY29uc3QgcGFyZW50SW5TYW1lVmlldyA9IHBhcmVudCAmJiB2aWV3RGF0YSAmJiBwYXJlbnQgIT09IHZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIGNvbnN0IHRQYXJlbnQgPSBwYXJlbnRJblNhbWVWaWV3ID8gcGFyZW50IGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIDogbnVsbDtcblxuICByZXR1cm4ge1xuICAgIHR5cGU6IHR5cGUsXG4gICAgaW5kZXg6IGFkanVzdGVkSW5kZXgsXG4gICAgaW5qZWN0b3JJbmRleDogdFBhcmVudCA/IHRQYXJlbnQuaW5qZWN0b3JJbmRleCA6IC0xLFxuICAgIGZsYWdzOiAwLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgYXR0cnM6IGF0dHJzLFxuICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgIGlucHV0czogdW5kZWZpbmVkLFxuICAgIG91dHB1dHM6IHVuZGVmaW5lZCxcbiAgICB0Vmlld3M6IHRWaWV3cyxcbiAgICBuZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogdFBhcmVudCxcbiAgICBkZXRhY2hlZDogbnVsbCxcbiAgICBzdHlsaW5nVGVtcGxhdGU6IG51bGwsXG4gICAgcHJvamVjdGlvbjogbnVsbFxuICB9O1xufVxuXG4vKipcbiAqIEdpdmVuIGEgbGlzdCBvZiBkaXJlY3RpdmUgaW5kaWNlcyBhbmQgbWluaWZpZWQgaW5wdXQgbmFtZXMsIHNldHMgdGhlXG4gKiBpbnB1dCBwcm9wZXJ0aWVzIG9uIHRoZSBjb3JyZXNwb25kaW5nIGRpcmVjdGl2ZXMuXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0ZvclByb3BlcnR5KGlucHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGlucHV0c1tpXSBhcyBudW1iZXIsIHZpZXdEYXRhKTtcbiAgICB2aWV3RGF0YVtpbnB1dHNbaV0gYXMgbnVtYmVyXVtpbnB1dHNbaSArIDFdXSA9IHZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQ29uc29saWRhdGVzIGFsbCBpbnB1dHMgb3Igb3V0cHV0cyBvZiBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIGxvZ2ljYWwgbm9kZS5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIHROb2RlRmxhZ3Mgbm9kZSBmbGFnc1xuICogQHBhcmFtIERpcmVjdGlvbiBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICB0Tm9kZUZsYWdzOiBUTm9kZUZsYWdzLCBkaXJlY3Rpb246IEJpbmRpbmdEaXJlY3Rpb24pOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICBsZXQgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG5cbiAgaWYgKGNvdW50ID4gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IGlzSW5wdXQgPSBkaXJlY3Rpb24gPT09IEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQ7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRhdGE7XG5cbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGNvbnN0IHByb3BlcnR5QWxpYXNNYXA6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSA9XG4gICAgICAgICAgaXNJbnB1dCA/IGRpcmVjdGl2ZURlZi5pbnB1dHMgOiBkaXJlY3RpdmVEZWYub3V0cHV0cztcbiAgICAgIGZvciAobGV0IHB1YmxpY05hbWUgaW4gcHJvcGVydHlBbGlhc01hcCkge1xuICAgICAgICBpZiAocHJvcGVydHlBbGlhc01hcC5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgICAgIHByb3BTdG9yZSA9IHByb3BTdG9yZSB8fCB7fTtcbiAgICAgICAgICBjb25zdCBpbnRlcm5hbE5hbWUgPSBwcm9wZXJ0eUFsaWFzTWFwW3B1YmxpY05hbWVdO1xuICAgICAgICAgIGNvbnN0IGhhc1Byb3BlcnR5ID0gcHJvcFN0b3JlLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpO1xuICAgICAgICAgIGhhc1Byb3BlcnR5ID8gcHJvcFN0b3JlW3B1YmxpY05hbWVdLnB1c2goaSwgaW50ZXJuYWxOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAocHJvcFN0b3JlW3B1YmxpY05hbWVdID0gW2ksIGludGVybmFsTmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wU3RvcmU7XG59XG5cbi8qKlxuICogQWRkIG9yIHJlbW92ZSBhIGNsYXNzIGluIGEgYGNsYXNzTGlzdGAgb24gYSBET00gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgW2NsYXNzLmZvb109XCJleHBcIiBjYXNlXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBjbGFzc05hbWUgTmFtZSBvZiBjbGFzcyB0byB0b2dnbGUuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgQSB2YWx1ZSBpbmRpY2F0aW5nIGlmIGEgZ2l2ZW4gY2xhc3Mgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q2xhc3NQcm9wKFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYm9vbGVhbiB8IFBsYXllckZhY3RvcnkpOiB2b2lkIHtcbiAgY29uc3QgdmFsID1cbiAgICAgICh2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgPyAodmFsdWUgYXMgQm91bmRQbGF5ZXJGYWN0b3J5PGJvb2xlYW4+KSA6ICghIXZhbHVlKTtcbiAgdXBkYXRlRWxlbWVudENsYXNzUHJvcChnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgdmlld0RhdGEpLCBzdHlsaW5nSW5kZXgsIHZhbCk7XG59XG5cbi8qKlxuICogQXNzaWduIGFueSBpbmxpbmUgc3R5bGUgdmFsdWVzIHRvIHRoZSBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiBtb2RlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGR1cmluZyBjcmVhdGlvbiBtb2RlIHRvIGFwcGx5IGFsbCBzdHlsaW5nXG4gKiAoZS5nLiBgc3R5bGU9XCIuLi5cImApIHZhbHVlcyB0byB0aGUgZWxlbWVudC4gVGhpcyBpcyBhbHNvIHdoZXJlIHRoZSBwcm92aWRlZCBpbmRleFxuICogdmFsdWUgaXMgYWxsb2NhdGVkIGZvciB0aGUgc3R5bGluZyBkZXRhaWxzIGZvciBpdHMgY29ycmVzcG9uZGluZyBlbGVtZW50ICh0aGUgZWxlbWVudFxuICogaW5kZXggaXMgdGhlIHByZXZpb3VzIGluZGV4IHZhbHVlIGZyb20gdGhpcyBvbmUpLlxuICpcbiAqIChOb3RlIHRoaXMgZnVuY3Rpb24gY2FsbHMgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGltbWVkaWF0ZWx5IHdoZW4gY2FsbGVkLilcbiAqXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IHZhbHVlIHdoaWNoIHdpbGwgYmUgYWxsb2NhdGVkIHRvIHN0b3JlIHN0eWxpbmcgZGF0YSBmb3IgdGhlIGVsZW1lbnQuXG4gKiAgICAgICAgKE5vdGUgdGhhdCB0aGlzIGlzIG5vdCB0aGUgZWxlbWVudCBpbmRleCwgYnV0IHJhdGhlciBhbiBpbmRleCB2YWx1ZSBhbGxvY2F0ZWRcbiAqICAgICAgICBzcGVjaWZpY2FsbHkgZm9yIGVsZW1lbnQgc3R5bGluZy0tdGhlIGluZGV4IG11c3QgYmUgdGhlIG5leHQgaW5kZXggYWZ0ZXIgdGhlIGVsZW1lbnRcbiAqICAgICAgICBpbmRleC4pXG4gKiBAcGFyYW0gY2xhc3NEZWNsYXJhdGlvbnMgQSBrZXkvdmFsdWUgYXJyYXkgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIHJlZ2lzdGVyZWQgb24gdGhlIGVsZW1lbnQuXG4gKiAgIEVhY2ggaW5kaXZpZHVhbCBzdHlsZSB3aWxsIGJlIHVzZWQgb24gdGhlIGVsZW1lbnQgYXMgbG9uZyBhcyBpdCBpcyBub3Qgb3ZlcnJpZGRlblxuICogICBieSBhbnkgY2xhc3NlcyBwbGFjZWQgb24gdGhlIGVsZW1lbnQgYnkgbXVsdGlwbGUgKGBbY2xhc3NdYCkgb3Igc2luZ3VsYXIgKGBbY2xhc3MubmFtZWRdYClcbiAqICAgYmluZGluZ3MuIElmIGEgY2xhc3MgYmluZGluZyBjaGFuZ2VzIGl0cyB2YWx1ZSB0byBhIGZhbHN5IHZhbHVlIHRoZW4gdGhlIG1hdGNoaW5nIGluaXRpYWxcbiAqICAgY2xhc3MgdmFsdWUgdGhhdCBhcmUgcGFzc2VkIGluIGhlcmUgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpZiBtYXRjaGVkKS5cbiAqIEBwYXJhbSBzdHlsZURlY2xhcmF0aW9ucyBBIGtleS92YWx1ZSBhcnJheSBvZiBDU1Mgc3R5bGVzIHRoYXQgd2lsbCBiZSByZWdpc3RlcmVkIG9uIHRoZSBlbGVtZW50LlxuICogICBFYWNoIGluZGl2aWR1YWwgc3R5bGUgd2lsbCBiZSB1c2VkIG9uIHRoZSBlbGVtZW50IGFzIGxvbmcgYXMgaXQgaXMgbm90IG92ZXJyaWRkZW5cbiAqICAgYnkgYW55IHN0eWxlcyBwbGFjZWQgb24gdGhlIGVsZW1lbnQgYnkgbXVsdGlwbGUgKGBbc3R5bGVdYCkgb3Igc2luZ3VsYXIgKGBbc3R5bGUucHJvcF1gKVxuICogICBiaW5kaW5ncy4gSWYgYSBzdHlsZSBiaW5kaW5nIGNoYW5nZXMgaXRzIHZhbHVlIHRvIG51bGwgdGhlbiB0aGUgaW5pdGlhbCBzdHlsaW5nXG4gKiAgIHZhbHVlcyB0aGF0IGFyZSBwYXNzZWQgaW4gaGVyZSB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGlmIG1hdGNoZWQpLlxuICogQHBhcmFtIHN0eWxlU2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCAoaWYgcHJvdmlkZWQpXG4gKiAgIHRvIHNhbml0aXplIHRoZSBhbnkgQ1NTIHByb3BlcnR5IHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nKFxuICAgIGNsYXNzRGVjbGFyYXRpb25zPzogKHN0cmluZyB8IGJvb2xlYW4gfCBJbml0aWFsU3R5bGluZ0ZsYWdzKVtdIHwgbnVsbCxcbiAgICBzdHlsZURlY2xhcmF0aW9ucz86IChzdHJpbmcgfCBib29sZWFuIHwgSW5pdGlhbFN0eWxpbmdGbGFncylbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlO1xuICBpZiAoIXROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgIC8vIGluaXRpYWxpemUgdGhlIHN0eWxpbmcgdGVtcGxhdGUuXG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID1cbiAgICAgICAgY3JlYXRlU3R5bGluZ0NvbnRleHRUZW1wbGF0ZShjbGFzc0RlY2xhcmF0aW9ucywgc3R5bGVEZWNsYXJhdGlvbnMsIHN0eWxlU2FuaXRpemVyKTtcbiAgfVxuICBpZiAoc3R5bGVEZWNsYXJhdGlvbnMgJiYgc3R5bGVEZWNsYXJhdGlvbnMubGVuZ3RoIHx8XG4gICAgICBjbGFzc0RlY2xhcmF0aW9ucyAmJiBjbGFzc0RlY2xhcmF0aW9ucy5sZW5ndGgpIHtcbiAgICBlbGVtZW50U3R5bGluZ0FwcGx5KHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIEFwcGx5IGFsbCBzdHlsaW5nIHZhbHVlcyB0byB0aGUgZWxlbWVudCB3aGljaCBoYXZlIGJlZW4gcXVldWVkIGJ5IGFueSBzdHlsaW5nIGluc3RydWN0aW9ucy5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIHJ1biBvbmNlIG9uZSBvciBtb3JlIGBlbGVtZW50U3R5bGVgIGFuZC9vciBgZWxlbWVudFN0eWxlUHJvcGBcbiAqIGhhdmUgYmVlbiBpc3N1ZWQgYWdhaW5zdCB0aGUgZWxlbWVudC4gVGhpcyBmdW5jdGlvbiB3aWxsIGFsc28gZGV0ZXJtaW5lIGlmIGFueSBzdHlsZXMgaGF2ZVxuICogY2hhbmdlZCBhbmQgd2lsbCB0aGVuIHNraXAgdGhlIG9wZXJhdGlvbiBpZiB0aGVyZSBpcyBub3RoaW5nIG5ldyB0byByZW5kZXIuXG4gKlxuICogT25jZSBjYWxsZWQgdGhlbiBhbGwgcXVldWVkIHN0eWxlcyB3aWxsIGJlIGZsdXNoZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgc3R5bGluZyBzdG9yYWdlIHRoYXQgd2lsbCBiZSByZW5kZXJlZC5cbiAqICAgICAgICAoTm90ZSB0aGF0IHRoaXMgaXMgbm90IHRoZSBlbGVtZW50IGluZGV4LCBidXQgcmF0aGVyIGFuIGluZGV4IHZhbHVlIGFsbG9jYXRlZFxuICogICAgICAgIHNwZWNpZmljYWxseSBmb3IgZWxlbWVudCBzdHlsaW5nLS10aGUgaW5kZXggbXVzdCBiZSB0aGUgbmV4dCBpbmRleCBhZnRlciB0aGUgZWxlbWVudFxuICogICAgICAgIGluZGV4LilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nQXBwbHkoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCB0b3RhbFBsYXllcnNRdWV1ZWQgPVxuICAgICAgcmVuZGVyU3R5bGVBbmRDbGFzc0JpbmRpbmdzKGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCB2aWV3RGF0YSksIHJlbmRlcmVyLCB2aWV3RGF0YSk7XG4gIGlmICh0b3RhbFBsYXllcnNRdWV1ZWQgPiAwKSB7XG4gICAgY29uc3Qgcm9vdENvbnRleHQgPSBnZXRSb290Q29udGV4dCh2aWV3RGF0YSk7XG4gICAgc2NoZWR1bGVUaWNrKHJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycyk7XG4gIH1cbn1cblxuLyoqXG4gKiBRdWV1ZSBhIGdpdmVuIHN0eWxlIHRvIGJlIHJlbmRlcmVkIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGBudWxsYCB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIGVsZW1lbnQgd2l0aCBgZWxlbWVudFN0eWxlYCBvciBhbnkgc3R5bGVzIHRoYXQgYXJlIHByZXNlbnRcbiAqIGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCAod2l0aCBgZWxlbWVudFN0eWxpbmdgKS5cbiAqXG4gKiAoTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC4pXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgc3R5bGluZyBzdG9yYWdlIHRvIGNoYW5nZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqICAgICAgICAoTm90ZSB0aGF0IHRoaXMgaXMgbm90IHRoZSBlbGVtZW50IGluZGV4LCBidXQgcmF0aGVyIGFuIGluZGV4IHZhbHVlIGFsbG9jYXRlZFxuICogICAgICAgIHNwZWNpZmljYWxseSBmb3IgZWxlbWVudCBzdHlsaW5nLS10aGUgaW5kZXggbXVzdCBiZSB0aGUgbmV4dCBpbmRleCBhZnRlciB0aGUgZWxlbWVudFxuICogICAgICAgIGluZGV4LilcbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHRoZSBzdHlsZSBwcm9wZXJ0eSBvbiB0aGlzIGVsZW1lbnQuIChNb25vdG9uaWNhbGx5IGluY3JlYXNpbmcuKVxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAobnVsbCB0byByZW1vdmUpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZVByb3AoXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVJbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgUGxheWVyRmFjdG9yeSB8IG51bGwsXG4gICAgc3VmZml4Pzogc3RyaW5nKTogdm9pZCB7XG4gIGxldCB2YWx1ZVRvQWRkOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHZhbHVlVG9BZGQgPSBzdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBTdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHZhbHVlVG9BZGQgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICB1cGRhdGVFbGVtZW50U3R5bGVQcm9wKGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCB2aWV3RGF0YSksIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQpO1xufVxuXG4vKipcbiAqIFF1ZXVlIGEga2V5L3ZhbHVlIG1hcCBvZiBzdHlsZXMgdG8gYmUgcmVuZGVyZWQgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtzdHlsZV09XCJleHBcImAgdXNhZ2UuIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvXG4gKiB0aGUgRWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSBwbGFjZWQgd2l0aCByZXNwZWN0IHRvIGFueSBzdHlsZXMgc2V0IHdpdGggYGVsZW1lbnRTdHlsZVByb3BgLlxuICogSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGBudWxsYCB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQgKHVubGVzcyB0aGUgc2FtZVxuICogc3R5bGUgcHJvcGVydGllcyBoYXZlIGJlZW4gYXNzaWduZWQgdG8gdGhlIGVsZW1lbnQgZHVyaW5nIGNyZWF0aW9uIHVzaW5nIGBlbGVtZW50U3R5bGluZ2ApLlxuICpcbiAqIChOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgZWxlbWVudFN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLilcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyBzdHlsaW5nIHN0b3JhZ2UgdG8gY2hhbmdlIGluIHRoZSBkYXRhIGFycmF5LlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nTWFwPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCxcbiAgICBzdHlsZXM/OiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IG51bGwpOiB2b2lkIHtcbiAgdXBkYXRlU3R5bGluZ01hcChnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgdmlld0RhdGEpLCBjbGFzc2VzLCBzdHlsZXMpO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBUZXh0XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZSBzdGF0aWMgdGV4dCBub2RlXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBub2RlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gd3JpdGUuIFRoaXMgdmFsdWUgd2lsbCBiZSBzdHJpbmdpZmllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHQoaW5kZXg6IG51bWJlciwgdmFsdWU/OiBhbnkpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAndGV4dCBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICBjb25zdCB0ZXh0TmF0aXZlID0gY3JlYXRlVGV4dE5vZGUodmFsdWUsIHJlbmRlcmVyKTtcbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHROYXRpdmUsIG51bGwsIG51bGwpO1xuXG4gIC8vIFRleHQgbm9kZXMgYXJlIHNlbGYgY2xvc2luZy5cbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgYXBwZW5kQ2hpbGQodGV4dE5hdGl2ZSwgdE5vZGUsIHZpZXdEYXRhKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgdGV4dCBub2RlIHdpdGggYmluZGluZ1xuICogQmluZGluZ3Mgc2hvdWxkIGJlIGhhbmRsZWQgZXh0ZXJuYWxseSB3aXRoIHRoZSBwcm9wZXIgaW50ZXJwb2xhdGlvbigxLTgpIG1ldGhvZFxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqIEBwYXJhbSB2YWx1ZSBTdHJpbmdpZmllZCB2YWx1ZSB0byB3cml0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRCaW5kaW5nPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gICAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIHZpZXdEYXRhKSBhcyBhbnkgYXMgUlRleHQ7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZWxlbWVudCwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0VmFsdWUoZWxlbWVudCwgc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBzdHJpbmdpZnkodmFsdWUpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIERpcmVjdGl2ZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgYSBkaXJlY3RpdmUgYW5kIHRoZWlyIGFzc29jaWF0ZWQgY29udGVudCBxdWVyaWVzLlxuICpcbiAqIE5PVEU6IGRpcmVjdGl2ZXMgY2FuIGJlIGNyZWF0ZWQgaW4gb3JkZXIgb3RoZXIgdGhhbiB0aGUgaW5kZXggb3JkZXIuIFRoZXkgY2FuIGFsc29cbiAqICAgICAgIGJlIHJldHJpZXZlZCBiZWZvcmUgdGhleSBhcmUgY3JlYXRlZCBpbiB3aGljaCBjYXNlIHRoZSB2YWx1ZSB3aWxsIGJlIG51bGwuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZSBUaGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICogQHBhcmFtIGRpcmVjdGl2ZURlZiBEaXJlY3RpdmVEZWYgb2JqZWN0IHdoaWNoIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUNyZWF0ZTxUPihcbiAgICBkaXJlY3RpdmVEZWZJZHg6IG51bWJlciwgZGlyZWN0aXZlOiBULCBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZjxUPnwgQ29tcG9uZW50RGVmPFQ+KTogVCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCB2aWV3RGF0YSk7XG4gIGNvbnN0IGluc3RhbmNlID0gYmFzZURpcmVjdGl2ZUNyZWF0ZShkaXJlY3RpdmVEZWZJZHgsIGRpcmVjdGl2ZSwgZGlyZWN0aXZlRGVmLCBuYXRpdmUpO1xuXG4gIGlmICgoZGlyZWN0aXZlRGVmIGFzIENvbXBvbmVudERlZjxUPikudGVtcGxhdGUpIHtcbiAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4LCB2aWV3RGF0YSk7XG4gICAgY29tcG9uZW50Vmlld1tDT05URVhUXSA9IGRpcmVjdGl2ZTtcbiAgfVxuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIC8vIEluaXQgaG9va3MgYXJlIHF1ZXVlZCBub3cgc28gbmdPbkluaXQgaXMgY2FsbGVkIGluIGhvc3QgY29tcG9uZW50cyBiZWZvcmVcbiAgICAvLyBhbnkgcHJvamVjdGVkIGNvbXBvbmVudHMuXG4gICAgcXVldWVJbml0SG9va3MoZGlyZWN0aXZlRGVmSWR4LCBkaXJlY3RpdmVEZWYub25Jbml0LCBkaXJlY3RpdmVEZWYuZG9DaGVjaywgdFZpZXcpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocHJldmlvdXNPclBhcmVudFROb2RlLCAncHJldmlvdXNPclBhcmVudFROb2RlJyk7XG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmF0dHJzKSB7XG4gICAgc2V0SW5wdXRzRnJvbUF0dHJzKGRpcmVjdGl2ZURlZklkeCwgaW5zdGFuY2UsIGRpcmVjdGl2ZURlZi5pbnB1dHMsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cblxuICBpZiAoZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzKCk7XG4gIH1cblxuICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbmZ1bmN0aW9uIGFkZENvbXBvbmVudExvZ2ljPFQ+KGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCB2aWV3RGF0YSk7XG5cbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KFxuICAgICAgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSk7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBhZGRUb1ZpZXdUcmVlKFxuICAgICAgdmlld0RhdGEsIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCBhcyBudW1iZXIsXG4gICAgICBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgICAgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG5hdGl2ZSBhcyBSRWxlbWVudCwgZGVmKSwgdFZpZXcsIG51bGwsXG4gICAgICAgICAgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBnZXRDdXJyZW50U2FuaXRpemVyKCkpKTtcblxuICBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gPSBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuXG4gIC8vIENvbXBvbmVudCB2aWV3IHdpbGwgYWx3YXlzIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBpbmplY3RlZCBMQ29udGFpbmVycyxcbiAgLy8gc28gdGhpcyBpcyBhIHJlZ3VsYXIgZWxlbWVudCwgd3JhcCBpdCB3aXRoIHRoZSBjb21wb25lbnQgdmlld1xuICBjb21wb25lbnRWaWV3W0hPU1RdID0gdmlld0RhdGFbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XTtcbiAgdmlld0RhdGFbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKCk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzID1cbiAgICAgICAgdmlld0RhdGEubGVuZ3RoIDw8IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0IHwgVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgfVxufVxuXG4vKipcbiAqIEEgbGlnaHRlciB2ZXJzaW9uIG9mIGRpcmVjdGl2ZUNyZWF0ZSgpIHRoYXQgaXMgdXNlZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50XG4gKlxuICogVGhpcyB2ZXJzaW9uIGRvZXMgbm90IGNvbnRhaW4gZmVhdHVyZXMgdGhhdCB3ZSBkb24ndCBhbHJlYWR5IHN1cHBvcnQgYXQgcm9vdCBpblxuICogY3VycmVudCBBbmd1bGFyLiBFeGFtcGxlOiBsb2NhbCByZWZzIGFuZCBpbnB1dHMgb24gcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlRGlyZWN0aXZlQ3JlYXRlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCwgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8VD58IENvbXBvbmVudERlZjxUPixcbiAgICBuYXRpdmU6IFJOb2RlIHwgbnVsbCk6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdkaXJlY3RpdmVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcblxuICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlLCB2aWV3RGF0YSk7XG4gIGlmIChuYXRpdmUpIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCB2aWV3RGF0YSk7XG4gIH1cblxuICB2aWV3RGF0YVtpbmRleF0gPSBkaXJlY3RpdmU7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgZmxhZ3MgPSBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3M7XG4gICAgaWYgKGZsYWdzID09PSAwKSB7XG4gICAgICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZDpcbiAgICAgIC8vIC0gc2F2ZSB0aGUgaW5kZXgsXG4gICAgICAvLyAtIHNldCB0aGUgbnVtYmVyIG9mIGRpcmVjdGl2ZXMgdG8gMVxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzID1cbiAgICAgICAgICBpbmRleCA8PCBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdCB8IGZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCB8IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE9ubHkgbmVlZCB0byBidW1wIHRoZSBzaXplIHdoZW4gc3Vic2VxdWVudCBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgIGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2ssIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrLFxuICAgICAgICAgICAgICAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MrKztcbiAgICB9XG5cbiAgICB0Vmlldy5kYXRhLnB1c2goZGlyZWN0aXZlRGVmKTtcbiAgICB0Vmlldy5ibHVlcHJpbnQucHVzaChudWxsKTtcbiAgICBpZiAoZGlyZWN0aXZlRGVmLmhvc3RCaW5kaW5ncykgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGluZGV4LCBkaXJlY3RpdmVEZWYpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGRpUHVibGljID0gZGlyZWN0aXZlRGVmICEuZGlQdWJsaWM7XG4gICAgaWYgKGRpUHVibGljKSBkaVB1YmxpYyhkaXJlY3RpdmVEZWYgISk7XG4gIH1cblxuICBpZiAoZGlyZWN0aXZlRGVmICEuYXR0cmlidXRlcyAhPSBudWxsICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZSBhcyBSRWxlbWVudCwgZGlyZWN0aXZlRGVmICEuYXR0cmlidXRlcyBhcyBzdHJpbmdbXSk7XG4gIH1cblxuICByZXR1cm4gZGlyZWN0aXZlO1xufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGlucHV0czoge1tQIGluIGtleW9mIFRdOiBzdHJpbmc7fSwgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGxldCBpbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyBhcyBJbml0aWFsSW5wdXREYXRhIHwgdW5kZWZpbmVkO1xuICBpZiAoaW5pdGlhbElucHV0RGF0YSA9PT0gdW5kZWZpbmVkIHx8IGRpcmVjdGl2ZUluZGV4ID49IGluaXRpYWxJbnB1dERhdGEubGVuZ3RoKSB7XG4gICAgaW5pdGlhbElucHV0RGF0YSA9IGdlbmVyYXRlSW5pdGlhbElucHV0cyhkaXJlY3RpdmVJbmRleCwgaW5wdXRzLCB0Tm9kZSk7XG4gIH1cblxuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIChpbnN0YW5jZSBhcyBhbnkpW2luaXRpYWxJbnB1dHNbaV1dID0gaW5pdGlhbElucHV0c1tpICsgMV07XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IHRvIHN0b3JlIHRoZSBpbml0aWFsIGlucHV0IGRhdGFcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgb24gdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUpOiBJbml0aWFsSW5wdXREYXRhIHtcbiAgY29uc3QgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSA9IHROb2RlLmluaXRpYWxJbnB1dHMgfHwgKHROb2RlLmluaXRpYWxJbnB1dHMgPSBbXSk7XG4gIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdID0gbnVsbDtcblxuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzICE7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgbWluaWZpZWRJbnB1dE5hbWUgPSBpbnB1dHNbYXR0ck5hbWVdO1xuICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGF0dHJzW2kgKyAxXTtcblxuICAgIGlmIChtaW5pZmllZElucHV0TmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzID1cbiAgICAgICAgICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSB8fCAoaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBbXSk7XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2gobWluaWZpZWRJbnB1dE5hbWUsIGF0dHJWYWx1ZSBhcyBzdHJpbmcpO1xuICAgIH1cblxuICAgIGkgKz0gMjtcbiAgfVxuICByZXR1cm4gaW5pdGlhbElucHV0RGF0YTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBob3N0TmF0aXZlIFRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBob3N0IFROb2RlIGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGNvbW1lbnQgZWxlbWVudFxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIGhvc3ROYXRpdmU6IFJFbGVtZW50IHwgUkNvbW1lbnQsXG4gICAgaG9zdFROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSxcbiAgICBuYXRpdmU6IFJDb21tZW50LCBpc0ZvclZpZXdDb250YWluZXJSZWY/OiBib29sZWFuKTogTENvbnRhaW5lciB7XG4gIHJldHVybiBbXG4gICAgaXNGb3JWaWV3Q29udGFpbmVyUmVmID8gLTEgOiAwLCAgICAgICAgICAvLyBhY3RpdmUgaW5kZXhcbiAgICBbXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXdzXG4gICAgY3VycmVudFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJlbnRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICBob3N0TmF0aXZlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhvc3QgbmF0aXZlXG4gICAgbmF0aXZlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuYXRpdmVcbiAgICBnZXRSZW5kZXJQYXJlbnQoaG9zdFROb2RlLCBjdXJyZW50VmlldykgIC8vIHJlbmRlclBhcmVudFxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lciBmb3IgYW4gbmctdGVtcGxhdGUgKGR5bmFtaWNhbGx5LWluc2VydGVkIHZpZXcpLCBlLmcuXG4gKlxuICogPG5nLXRlbXBsYXRlICNmb28+XG4gKiAgICA8ZGl2PjwvZGl2PlxuICogPC9uZy10ZW1wbGF0ZT5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIElubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB2YXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250YWluZXIgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRycyBhdHRhY2hlZCB0byB0aGUgY29udGFpbmVyLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBBIGZ1bmN0aW9uIHdoaWNoIGV4dHJhY3RzIGxvY2FsLXJlZnMgdmFsdWVzIGZyb20gdGhlIHRlbXBsYXRlLlxuICogICAgICAgIERlZmF1bHRzIHRvIHRoZSBjdXJyZW50IGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBsb2NhbC1yZWYuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZShcbiAgICBpbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIHRhZ05hbWU/OiBzdHJpbmcgfCBudWxsLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yPzogTG9jYWxSZWZFeHRyYWN0b3IpIHtcbiAgLy8gVE9ETzogY29uc2lkZXIgYSBzZXBhcmF0ZSBub2RlIHR5cGUgZm9yIHRlbXBsYXRlc1xuICBjb25zdCB0Tm9kZSA9IGNvbnRhaW5lckludGVybmFsKGluZGV4LCB0YWdOYW1lIHx8IG51bGwsIGF0dHJzIHx8IG51bGwpO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHROb2RlLnRWaWV3cyA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAtMSwgdGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKTtcbiAgfVxuXG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMobG9jYWxSZWZzLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG4gIGN1cnJlbnRRdWVyaWVzICYmXG4gICAgICAoY3VycmVudFF1ZXJpZXMgPSBjdXJyZW50UXVlcmllcy5hZGROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSBhcyBUQ29udGFpbmVyTm9kZSkpO1xuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHROb2RlLmZsYWdzLCB0Vmlldyk7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBMQ29udGFpbmVyIGZvciBpbmxpbmUgdmlld3MsIGUuZy5cbiAqXG4gKiAlIGlmIChzaG93aW5nKSB7XG4gKiAgIDxkaXY+PC9kaXY+XG4gKiAlIH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lcihpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gY29udGFpbmVySW50ZXJuYWwoaW5kZXgsIG51bGwsIG51bGwpO1xuICBmaXJzdFRlbXBsYXRlUGFzcyAmJiAodE5vZGUudFZpZXdzID0gW10pO1xuICBpc1BhcmVudCA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBjb250YWluZXJJbnRlcm5hbChcbiAgICBpbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdjb250YWluZXIgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IGNvbW1lbnQgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICdjb250YWluZXInIDogJycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBjb21tZW50LCB0YWdOYW1lLCBhdHRycyk7XG4gIGNvbnN0IGxDb250YWluZXIgPSB2aWV3RGF0YVthZGp1c3RlZEluZGV4XSA9XG4gICAgICBjcmVhdGVMQ29udGFpbmVyKHZpZXdEYXRhW2FkanVzdGVkSW5kZXhdLCB0Tm9kZSwgdmlld0RhdGEsIGNvbW1lbnQpO1xuXG4gIGFwcGVuZENoaWxkKGNvbW1lbnQsIHROb2RlLCB2aWV3RGF0YSk7XG5cbiAgLy8gQ29udGFpbmVycyBhcmUgYWRkZWQgdG8gdGhlIGN1cnJlbnQgdmlldyB0cmVlIGluc3RlYWQgb2YgdGhlaXIgZW1iZWRkZWQgdmlld3NcbiAgLy8gYmVjYXVzZSB2aWV3cyBjYW4gYmUgcmVtb3ZlZCBhbmQgcmUtaW5zZXJ0ZWQuXG4gIGFkZFRvVmlld1RyZWUodmlld0RhdGEsIGluZGV4ICsgSEVBREVSX09GRlNFVCwgbENvbnRhaW5lcik7XG5cbiAgaWYgKGN1cnJlbnRRdWVyaWVzKSB7XG4gICAgLy8gcHJlcGFyZSBwbGFjZSBmb3IgbWF0Y2hpbmcgbm9kZXMgZnJvbSB2aWV3cyBpbnNlcnRlZCBpbnRvIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgbENvbnRhaW5lcltRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzLmNvbnRhaW5lcigpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuLyoqXG4gKiBTZXRzIGEgY29udGFpbmVyIHVwIHRvIHJlY2VpdmUgdmlld3MuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoU3RhcnQoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBsb2FkSW50ZXJuYWwoaW5kZXgsIHRWaWV3LmRhdGEpIGFzIFROb2RlO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBpc1BhcmVudCA9IHRydWU7XG5cbiAgdmlld0RhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXVtBQ1RJVkVfSU5ERVhdID0gMDtcblxuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIC8vIFdlIG5lZWQgdG8gZXhlY3V0ZSBpbml0IGhvb2tzIGhlcmUgc28gbmdPbkluaXQgaG9va3MgYXJlIGNhbGxlZCBpbiB0b3AgbGV2ZWwgdmlld3NcbiAgICAvLyBiZWZvcmUgdGhleSBhcmUgY2FsbGVkIGluIGVtYmVkZGVkIHZpZXdzIChmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkpLlxuICAgIGV4ZWN1dGVJbml0SG9va3Modmlld0RhdGEsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWFya3MgdGhlIGVuZCBvZiB0aGUgTENvbnRhaW5lci5cbiAqXG4gKiBNYXJraW5nIHRoZSBlbmQgb2YgTENvbnRhaW5lciBpcyB0aGUgdGltZSB3aGVuIHRvIGNoaWxkIHZpZXdzIGdldCBpbnNlcnRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyUmVmcmVzaEVuZCgpOiB2b2lkIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgITtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuXG4gIGNvbnN0IGxDb250YWluZXIgPSB2aWV3RGF0YVtwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXhdO1xuICBjb25zdCBuZXh0SW5kZXggPSBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF07XG5cbiAgLy8gcmVtb3ZlIGV4dHJhIHZpZXdzIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lclxuICB3aGlsZSAobmV4dEluZGV4IDwgbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgcmVtb3ZlVmlldyhsQ29udGFpbmVyLCBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVENvbnRhaW5lck5vZGUsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZHluYW1pYyBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzIHRoZW1cbiAqIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXdEYXRhOiBMVmlld0RhdGEpIHtcbiAgZm9yIChsZXQgY3VycmVudCA9IGdldExWaWV3Q2hpbGQobFZpZXdEYXRhKTsgY3VycmVudCAhPT0gbnVsbDsgY3VycmVudCA9IGN1cnJlbnRbTkVYVF0pIHtcbiAgICAvLyBOb3RlOiBjdXJyZW50IGNhbiBiZSBhbiBMVmlld0RhdGEgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHkgaW50ZXJlc3RlZFxuICAgIC8vIGluIExDb250YWluZXIuIFdlIGNhbiB0ZWxsIGl0J3MgYW4gTENvbnRhaW5lciBiZWNhdXNlIGl0cyBsZW5ndGggaXMgbGVzcyB0aGFuIHRoZSBMVmlld0RhdGFcbiAgICAvLyBoZWFkZXIuXG4gICAgaWYgKGN1cnJlbnQubGVuZ3RoIDwgSEVBREVSX09GRlNFVCAmJiBjdXJyZW50W0FDVElWRV9JTkRFWF0gPT09IC0xKSB7XG4gICAgICBjb25zdCBjb250YWluZXIgPSBjdXJyZW50IGFzIExDb250YWluZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRhaW5lcltWSUVXU10ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZHluYW1pY1ZpZXdEYXRhID0gY29udGFpbmVyW1ZJRVdTXVtpXTtcbiAgICAgICAgLy8gVGhlIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZSBub3QgbmVlZGVkIGhlcmUgYXMgYW4gZXhpc3RpbmcgdmlldyBpcyBvbmx5IGJlaW5nIHJlZnJlc2hlZC5cbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoXG4gICAgICAgICAgICBkeW5hbWljVmlld0RhdGEsIGR5bmFtaWNWaWV3RGF0YVtUVklFV10sIGR5bmFtaWNWaWV3RGF0YVtDT05URVhUXSAhLFxuICAgICAgICAgICAgUmVuZGVyRmxhZ3MuVXBkYXRlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIExvb2tzIGZvciBhIHZpZXcgd2l0aCBhIGdpdmVuIHZpZXcgYmxvY2sgaWQgaW5zaWRlIGEgcHJvdmlkZWQgTENvbnRhaW5lci5cbiAqIFJlbW92ZXMgdmlld3MgdGhhdCBuZWVkIHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHByb2Nlc3MuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdG8gc2VhcmNoIGZvciB2aWV3c1xuICogQHBhcmFtIHRDb250YWluZXJOb2RlIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyBpbmRleCBvZiBhIGZvdW5kIHZpZXcgb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHRDb250YWluZXJOb2RlOiBUQ29udGFpbmVyTm9kZSwgc3RhcnRJZHg6IG51bWJlcixcbiAgICB2aWV3QmxvY2tJZDogbnVtYmVyKTogTFZpZXdEYXRhfG51bGwge1xuICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICBmb3IgKGxldCBpID0gc3RhcnRJZHg7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZpZXdBdFBvc2l0aW9uSWQgPSB2aWV3c1tpXVtUVklFV10uaWQ7XG4gICAgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPT09IHZpZXdCbG9ja0lkKSB7XG4gICAgICByZXR1cm4gdmlld3NbaV07XG4gICAgfSBlbHNlIGlmICh2aWV3QXRQb3NpdGlvbklkIDwgdmlld0Jsb2NrSWQpIHtcbiAgICAgIC8vIGZvdW5kIGEgdmlldyB0aGF0IHNob3VsZCBub3QgYmUgYXQgdGhpcyBwb3NpdGlvbiAtIHJlbW92ZVxuICAgICAgcmVtb3ZlVmlldyhsQ29udGFpbmVyLCB0Q29udGFpbmVyTm9kZSwgaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGZvdW5kIGEgdmlldyB3aXRoIGlkIGdyZWF0ZXIgdGhhbiB0aGUgb25lIHdlIGFyZSBzZWFyY2hpbmcgZm9yXG4gICAgICAvLyB3aGljaCBtZWFucyB0aGF0IHJlcXVpcmVkIHZpZXcgZG9lc24ndCBleGlzdCBhbmQgY2FuJ3QgYmUgZm91bmQgYXRcbiAgICAgIC8vIGxhdGVyIHBvc2l0aW9ucyBpbiB0aGUgdmlld3MgYXJyYXkgLSBzdG9wIHRoZSBzZWFyY2ggaGVyZVxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBzdGFydCBvZiBhbiBlbWJlZGRlZCB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBUaGUgSUQgb2YgdGhpcyB2aWV3XG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld1N0YXJ0KHZpZXdCbG9ja0lkOiBudW1iZXIsIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIpOiBSZW5kZXJGbGFncyB7XG4gIC8vIFRoZSBwcmV2aW91cyBub2RlIGNhbiBiZSBhIHZpZXcgbm9kZSBpZiB3ZSBhcmUgcHJvY2Vzc2luZyBhbiBpbmxpbmUgZm9yIGxvb3BcbiAgY29uc3QgY29udGFpbmVyVE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhIDpcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgY29uc3QgbENvbnRhaW5lciA9IHZpZXdEYXRhW2NvbnRhaW5lclROb2RlLmluZGV4XSBhcyBMQ29udGFpbmVyO1xuICBjb25zdCBjdXJyZW50VmlldyA9IHZpZXdEYXRhO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXJUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGxldCB2aWV3VG9SZW5kZXIgPSBzY2FuRm9yVmlldyhcbiAgICAgIGxDb250YWluZXIsIGNvbnRhaW5lclROb2RlIGFzIFRDb250YWluZXJOb2RlLCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISwgdmlld0Jsb2NrSWQpO1xuXG4gIGlmICh2aWV3VG9SZW5kZXIpIHtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gICAgZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW1RWSUVXXS5ub2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHdlIGNyZWF0ZSBhIG5ldyBMVmlldywgd2UgYWx3YXlzIHJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgIHZpZXdUb1JlbmRlciA9IGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgcmVuZGVyZXIsXG4gICAgICAgIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3QmxvY2tJZCwgY29uc3RzLCB2YXJzLCBjb250YWluZXJUTm9kZSBhcyBUQ29udGFpbmVyTm9kZSksIG51bGwsXG4gICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG5cbiAgICBpZiAobENvbnRhaW5lcltRVUVSSUVTXSkge1xuICAgICAgdmlld1RvUmVuZGVyW1FVRVJJRVNdID0gbENvbnRhaW5lcltRVUVSSUVTXSAhLmNyZWF0ZVZpZXcoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVWaWV3Tm9kZSh2aWV3QmxvY2tJZCwgdmlld1RvUmVuZGVyKTtcbiAgICBlbnRlclZpZXcodmlld1RvUmVuZGVyLCB2aWV3VG9SZW5kZXJbVFZJRVddLm5vZGUpO1xuICB9XG4gIGlmIChsQ29udGFpbmVyKSB7XG4gICAgaWYgKGNyZWF0aW9uTW9kZSkge1xuICAgICAgLy8gaXQgaXMgYSBuZXcgdmlldywgaW5zZXJ0IGl0IGludG8gY29sbGVjdGlvbiBvZiB2aWV3cyBmb3IgYSBnaXZlbiBjb250YWluZXJcbiAgICAgIGluc2VydFZpZXcodmlld1RvUmVuZGVyLCBsQ29udGFpbmVyLCBjdXJyZW50VmlldywgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICEsIC0xKTtcbiAgICB9XG4gICAgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICErKztcbiAgfVxuICByZXR1cm4gZ2V0UmVuZGVyRmxhZ3Modmlld1RvUmVuZGVyKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGFuZCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIHBhcmVudCBjb250YWluZXIgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHZpZXcncyBzdGF0aWMgZGF0YVxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KFxuICAgIHZpZXdJbmRleDogbnVtYmVyLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLCBwYXJlbnQ6IFRDb250YWluZXJOb2RlKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyVFZpZXdzID0gcGFyZW50LnRWaWV3cyBhcyBUVmlld1tdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb250YWluZXJUVmlld3MsICdUVmlldyBleHBlY3RlZCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoQXJyYXkuaXNBcnJheShjb250YWluZXJUVmlld3MpLCB0cnVlLCAnVFZpZXdzIHNob3VsZCBiZSBpbiBhbiBhcnJheScpO1xuICBpZiAodmlld0luZGV4ID49IGNvbnRhaW5lclRWaWV3cy5sZW5ndGggfHwgY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF0gPT0gbnVsbCkge1xuICAgIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIHZpZXdJbmRleCwgbnVsbCwgY29uc3RzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKTtcbiAgfVxuICByZXR1cm4gY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF07XG59XG5cbi8qKiBNYXJrcyB0aGUgZW5kIG9mIGFuIGVtYmVkZGVkIHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gZW1iZWRkZWRWaWV3RW5kKCk6IHZvaWQge1xuICBjb25zdCB2aWV3SG9zdCA9IHZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKTtcbiAgbGVhdmVWaWV3KHZpZXdEYXRhW1BBUkVOVF0gISk7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHZpZXdIb3N0ICE7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGFkanVzdGVkRWxlbWVudEluZGV4ICBFbGVtZW50IGluZGV4IGluIExWaWV3RGF0YVtdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudFJlZnJlc2g8VD4oXG4gICAgYWRqdXN0ZWRFbGVtZW50SW5kZXg6IG51bWJlciwgcGFyZW50Rmlyc3RUZW1wbGF0ZVBhc3M6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGFkanVzdGVkRWxlbWVudEluZGV4KTtcbiAgY29uc3QgaG9zdFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChhZGp1c3RlZEVsZW1lbnRJbmRleCwgdmlld0RhdGEpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUodFZpZXcuZGF0YVthZGp1c3RlZEVsZW1lbnRJbmRleF0gYXMgVE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcblxuICAvLyBPbmx5IGF0dGFjaGVkIENoZWNrQWx3YXlzIGNvbXBvbmVudHMgb3IgYXR0YWNoZWQsIGRpcnR5IE9uUHVzaCBjb21wb25lbnRzIHNob3VsZCBiZSBjaGVja2VkXG4gIGlmICh2aWV3QXR0YWNoZWQoaG9zdFZpZXcpICYmIGhvc3RWaWV3W0ZMQUdTXSAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBwYXJlbnRGaXJzdFRlbXBsYXRlUGFzcyAmJiBzeW5jVmlld1dpdGhCbHVlcHJpbnQoaG9zdFZpZXcpO1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbChob3N0VmlldywgaG9zdFZpZXdbQ09OVEVYVF0pO1xuICB9XG59XG5cbi8qKlxuICogU3luY3MgYW4gTFZpZXdEYXRhIGluc3RhbmNlIHdpdGggaXRzIGJsdWVwcmludCBpZiB0aGV5IGhhdmUgZ290dGVuIG91dCBvZiBzeW5jLlxuICpcbiAqIFR5cGljYWxseSwgYmx1ZXByaW50cyBhbmQgdGhlaXIgdmlldyBpbnN0YW5jZXMgc2hvdWxkIGFsd2F5cyBiZSBpbiBzeW5jLCBzbyB0aGUgbG9vcCBoZXJlXG4gKiB3aWxsIGJlIHNraXBwZWQuIEhvd2V2ZXIsIGNvbnNpZGVyIHRoaXMgY2FzZSBvZiB0d28gY29tcG9uZW50cyBzaWRlLWJ5LXNpZGU6XG4gKlxuICogQXBwIHRlbXBsYXRlOlxuICogYGBgXG4gKiA8Y29tcD48L2NvbXA+XG4gKiA8Y29tcD48L2NvbXA+XG4gKiBgYGBcbiAqXG4gKiBUaGUgZm9sbG93aW5nIHdpbGwgaGFwcGVuOlxuICogMS4gQXBwIHRlbXBsYXRlIGJlZ2lucyBwcm9jZXNzaW5nLlxuICogMi4gRmlyc3QgPGNvbXA+IGlzIG1hdGNoZWQgYXMgYSBjb21wb25lbnQgYW5kIGl0cyBMVmlld0RhdGEgaXMgY3JlYXRlZC5cbiAqIDMuIFNlY29uZCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3RGF0YSBpcyBjcmVhdGVkLlxuICogNC4gQXBwIHRlbXBsYXRlIGNvbXBsZXRlcyBwcm9jZXNzaW5nLCBzbyBpdCdzIHRpbWUgdG8gY2hlY2sgY2hpbGQgdGVtcGxhdGVzLlxuICogNS4gRmlyc3QgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0IGhhcyBhIGRpcmVjdGl2ZSwgc28gaXRzIGRlZiBpcyBwdXNoZWQgdG8gYmx1ZXByaW50LlxuICogNi4gU2Vjb25kIDxjb21wPiB0ZW1wbGF0ZSBpcyBjaGVja2VkLiBJdHMgYmx1ZXByaW50IGhhcyBiZWVuIHVwZGF0ZWQgYnkgdGhlIGZpcnN0XG4gKiA8Y29tcD4gdGVtcGxhdGUsIGJ1dCBpdHMgTFZpZXdEYXRhIHdhcyBjcmVhdGVkIGJlZm9yZSB0aGlzIHVwZGF0ZSwgc28gaXQgaXMgb3V0IG9mIHN5bmMuXG4gKlxuICogTm90ZSB0aGF0IGVtYmVkZGVkIHZpZXdzIGluc2lkZSBuZ0ZvciBsb29wcyB3aWxsIG5ldmVyIGJlIG91dCBvZiBzeW5jIGJlY2F1c2UgdGhlc2Ugdmlld3NcbiAqIGFyZSBwcm9jZXNzZWQgYXMgc29vbiBhcyB0aGV5IGFyZSBjcmVhdGVkLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRWaWV3IFRoZSB2aWV3IHRvIHN5bmNcbiAqL1xuZnVuY3Rpb24gc3luY1ZpZXdXaXRoQmx1ZXByaW50KGNvbXBvbmVudFZpZXc6IExWaWV3RGF0YSkge1xuICBjb25zdCBjb21wb25lbnRUVmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICBmb3IgKGxldCBpID0gY29tcG9uZW50Vmlldy5sZW5ndGg7IGkgPCBjb21wb25lbnRUVmlldy5ibHVlcHJpbnQubGVuZ3RoOyBpKyspIHtcbiAgICBjb21wb25lbnRWaWV3W2ldID0gY29tcG9uZW50VFZpZXcuYmx1ZXByaW50W2ldO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3Igd2hldGhlciB0aGUgdmlldyBpcyBhdHRhY2hlZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgcmV0dXJuICh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpID09PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIEluc3RydWN0aW9uIHRvIGRpc3RyaWJ1dGUgcHJvamVjdGFibGUgbm9kZXMgYW1vbmcgPG5nLWNvbnRlbnQ+IG9jY3VycmVuY2VzIGluIGEgZ2l2ZW4gdGVtcGxhdGUuXG4gKiBJdCB0YWtlcyBhbGwgdGhlIHNlbGVjdG9ycyBmcm9tIHRoZSBlbnRpcmUgY29tcG9uZW50J3MgdGVtcGxhdGUgYW5kIGRlY2lkZXMgd2hlcmVcbiAqIGVhY2ggcHJvamVjdGVkIG5vZGUgYmVsb25ncyAoaXQgcmUtZGlzdHJpYnV0ZXMgbm9kZXMgYW1vbmcgXCJidWNrZXRzXCIgd2hlcmUgZWFjaCBcImJ1Y2tldFwiIGlzXG4gKiBiYWNrZWQgYnkgYSBzZWxlY3RvcikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXF1aXJlcyBDU1Mgc2VsZWN0b3JzIHRvIGJlIHByb3ZpZGVkIGluIDIgZm9ybXM6IHBhcnNlZCAoYnkgYSBjb21waWxlcikgYW5kIHRleHQsXG4gKiB1bi1wYXJzZWQgZm9ybS5cbiAqXG4gKiBUaGUgcGFyc2VkIGZvcm0gaXMgbmVlZGVkIGZvciBlZmZpY2llbnQgbWF0Y2hpbmcgb2YgYSBub2RlIGFnYWluc3QgYSBnaXZlbiBDU1Mgc2VsZWN0b3IuXG4gKiBUaGUgdW4tcGFyc2VkLCB0ZXh0dWFsIGZvcm0gaXMgbmVlZGVkIGZvciBzdXBwb3J0IG9mIHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUuXG4gKlxuICogSGF2aW5nIGEgQ1NTIHNlbGVjdG9yIGluIDIgZGlmZmVyZW50IGZvcm1hdHMgaXMgbm90IGlkZWFsLCBidXQgYWx0ZXJuYXRpdmVzIGhhdmUgZXZlbiBtb3JlXG4gKiBkcmF3YmFja3M6XG4gKiAtIGhhdmluZyBvbmx5IGEgdGV4dHVhbCBmb3JtIHdvdWxkIHJlcXVpcmUgcnVudGltZSBwYXJzaW5nIG9mIENTUyBzZWxlY3RvcnM7XG4gKiAtIHdlIGNhbid0IGhhdmUgb25seSBhIHBhcnNlZCBhcyB3ZSBjYW4ndCByZS1jb25zdHJ1Y3QgdGV4dHVhbCBmb3JtIGZyb20gaXQgKGFzIGVudGVyZWQgYnkgYVxuICogdGVtcGxhdGUgYXV0aG9yKS5cbiAqXG4gKiBAcGFyYW0gc2VsZWN0b3JzIEEgY29sbGVjdGlvbiBvZiBwYXJzZWQgQ1NTIHNlbGVjdG9yc1xuICogQHBhcmFtIHJhd1NlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgQ1NTIHNlbGVjdG9ycyBpbiB0aGUgcmF3LCB1bi1wYXJzZWQgZm9ybVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbkRlZihzZWxlY3RvcnM/OiBDc3NTZWxlY3Rvckxpc3RbXSwgdGV4dFNlbGVjdG9ycz86IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBmaW5kQ29tcG9uZW50Vmlldyh2aWV3RGF0YSlbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG5cbiAgaWYgKCFjb21wb25lbnROb2RlLnByb2plY3Rpb24pIHtcbiAgICBjb25zdCBub09mTm9kZUJ1Y2tldHMgPSBzZWxlY3RvcnMgPyBzZWxlY3RvcnMubGVuZ3RoICsgMSA6IDE7XG4gICAgY29uc3QgcERhdGE6IChUTm9kZSB8IG51bGwpW10gPSBjb21wb25lbnROb2RlLnByb2plY3Rpb24gPVxuICAgICAgICBuZXcgQXJyYXkobm9PZk5vZGVCdWNrZXRzKS5maWxsKG51bGwpO1xuICAgIGNvbnN0IHRhaWxzOiAoVE5vZGUgfCBudWxsKVtdID0gcERhdGEuc2xpY2UoKTtcblxuICAgIGxldCBjb21wb25lbnRDaGlsZDogVE5vZGV8bnVsbCA9IGNvbXBvbmVudE5vZGUuY2hpbGQ7XG5cbiAgICB3aGlsZSAoY29tcG9uZW50Q2hpbGQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGJ1Y2tldEluZGV4ID1cbiAgICAgICAgICBzZWxlY3RvcnMgPyBtYXRjaGluZ1NlbGVjdG9ySW5kZXgoY29tcG9uZW50Q2hpbGQsIHNlbGVjdG9ycywgdGV4dFNlbGVjdG9ycyAhKSA6IDA7XG4gICAgICBjb25zdCBuZXh0Tm9kZSA9IGNvbXBvbmVudENoaWxkLm5leHQ7XG5cbiAgICAgIGlmICh0YWlsc1tidWNrZXRJbmRleF0pIHtcbiAgICAgICAgdGFpbHNbYnVja2V0SW5kZXhdICEubmV4dCA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcERhdGFbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICAgIGNvbXBvbmVudENoaWxkLm5leHQgPSBudWxsO1xuICAgICAgfVxuICAgICAgdGFpbHNbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG5cbiAgICAgIGNvbXBvbmVudENoaWxkID0gbmV4dE5vZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU3RhY2sgdXNlZCB0byBrZWVwIHRyYWNrIG9mIHByb2plY3Rpb24gbm9kZXMgaW4gcHJvamVjdGlvbigpIGluc3RydWN0aW9uLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiBwcm9qZWN0aW9uKCkgdG8gYXZvaWQgYWxsb2NhdGluZ1xuICogYSBuZXcgYXJyYXkgZWFjaCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEluc3RlYWQgdGhlIGFycmF5IHdpbGwgYmVcbiAqIHJlLXVzZWQgYnkgZWFjaCBpbnZvY2F0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIG5vdCByZWVudHJhbnQuXG4gKi9cbmNvbnN0IHByb2plY3Rpb25Ob2RlU3RhY2s6IChMVmlld0RhdGEgfCBUTm9kZSlbXSA9IFtdO1xuXG4vKipcbiAqIEluc2VydHMgcHJldmlvdXNseSByZS1kaXN0cmlidXRlZCBwcm9qZWN0ZWQgbm9kZXMuIFRoaXMgaW5zdHJ1Y3Rpb24gbXVzdCBiZSBwcmVjZWRlZCBieSBhIGNhbGxcbiAqIHRvIHRoZSBwcm9qZWN0aW9uRGVmIGluc3RydWN0aW9uLlxuICpcbiAqIEBwYXJhbSBub2RlSW5kZXhcbiAqIEBwYXJhbSBzZWxlY3RvckluZGV4OlxuICogICAgICAgIC0gMCB3aGVuIHRoZSBzZWxlY3RvciBpcyBgKmAgKG9yIHVuc3BlY2lmaWVkIGFzIHRoaXMgaXMgdGhlIGRlZmF1bHQgdmFsdWUpLFxuICogICAgICAgIC0gMSBiYXNlZCBpbmRleCBvZiB0aGUgc2VsZWN0b3IgZnJvbSB0aGUge0BsaW5rIHByb2plY3Rpb25EZWZ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uKG5vZGVJbmRleDogbnVtYmVyLCBzZWxlY3RvckluZGV4OiBudW1iZXIgPSAwLCBhdHRycz86IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IHRQcm9qZWN0aW9uTm9kZSA9XG4gICAgICBjcmVhdGVOb2RlQXRJbmRleChub2RlSW5kZXgsIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBudWxsLCBudWxsLCBhdHRycyB8fCBudWxsKTtcblxuICAvLyBXZSBjYW4ndCB1c2Ugdmlld0RhdGFbSE9TVF9OT0RFXSBiZWNhdXNlIHByb2plY3Rpb24gbm9kZXMgY2FuIGJlIG5lc3RlZCBpbiBlbWJlZGRlZCB2aWV3cy5cbiAgaWYgKHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uID09PSBudWxsKSB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiA9IHNlbGVjdG9ySW5kZXg7XG5cbiAgLy8gYDxuZy1jb250ZW50PmAgaGFzIG5vIGNvbnRlbnRcbiAgaXNQYXJlbnQgPSBmYWxzZTtcblxuICAvLyByZS1kaXN0cmlidXRpb24gb2YgcHJvamVjdGFibGUgbm9kZXMgaXMgc3RvcmVkIG9uIGEgY29tcG9uZW50J3MgdmlldyBsZXZlbFxuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcodmlld0RhdGEpO1xuICBjb25zdCBjb21wb25lbnROb2RlID0gY29tcG9uZW50Vmlld1tIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgbGV0IG5vZGVUb1Byb2plY3QgPSAoY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbc2VsZWN0b3JJbmRleF07XG4gIGxldCBwcm9qZWN0ZWRWaWV3ID0gY29tcG9uZW50Vmlld1tQQVJFTlRdICE7XG4gIGxldCBwcm9qZWN0aW9uTm9kZUluZGV4ID0gLTE7XG5cbiAgd2hpbGUgKG5vZGVUb1Byb2plY3QpIHtcbiAgICBpZiAobm9kZVRvUHJvamVjdC50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgLy8gVGhpcyBub2RlIGlzIHJlLXByb2plY3RlZCwgc28gd2UgbXVzdCBnbyB1cCB0aGUgdHJlZSB0byBnZXQgaXRzIHByb2plY3RlZCBub2Rlcy5cbiAgICAgIGNvbnN0IGN1cnJlbnRDb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcocHJvamVjdGVkVmlldyk7XG4gICAgICBjb25zdCBjdXJyZW50Q29tcG9uZW50SG9zdCA9IGN1cnJlbnRDb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICAgICAgY29uc3QgZmlyc3RQcm9qZWN0ZWROb2RlID1cbiAgICAgICAgICAoY3VycmVudENvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW25vZGVUb1Byb2plY3QucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgICBpZiAoZmlyc3RQcm9qZWN0ZWROb2RlKSB7XG4gICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IG5vZGVUb1Byb2plY3Q7XG4gICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IHByb2plY3RlZFZpZXc7XG5cbiAgICAgICAgbm9kZVRvUHJvamVjdCA9IGZpcnN0UHJvamVjdGVkTm9kZTtcbiAgICAgICAgcHJvamVjdGVkVmlldyA9IGN1cnJlbnRDb21wb25lbnRWaWV3W1BBUkVOVF0gITtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoaXMgZmxhZyBtdXN0IGJlIHNldCBub3cgb3Igd2Ugd29uJ3Qga25vdyB0aGF0IHRoaXMgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICAgIC8vIGlmIHRoZSBub2RlcyBhcmUgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lciBsYXRlci5cbiAgICAgIG5vZGVUb1Byb2plY3QuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc1Byb2plY3RlZDtcbiAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUobm9kZVRvUHJvamVjdCwgdFByb2plY3Rpb25Ob2RlLCB2aWV3RGF0YSwgcHJvamVjdGVkVmlldyk7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgYXJlIGZpbmlzaGVkIHdpdGggYSBsaXN0IG9mIHJlLXByb2plY3RlZCBub2Rlcywgd2UgbmVlZCB0byBnZXRcbiAgICAvLyBiYWNrIHRvIHRoZSByb290IHByb2plY3Rpb24gbm9kZSB0aGF0IHdhcyByZS1wcm9qZWN0ZWQuXG4gICAgaWYgKG5vZGVUb1Byb2plY3QubmV4dCA9PT0gbnVsbCAmJiBwcm9qZWN0ZWRWaWV3ICE9PSBjb21wb25lbnRWaWV3W1BBUkVOVF0gISkge1xuICAgICAgcHJvamVjdGVkVmlldyA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBMVmlld0RhdGE7XG4gICAgICBub2RlVG9Qcm9qZWN0ID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIFROb2RlO1xuICAgIH1cbiAgICBub2RlVG9Qcm9qZWN0ID0gbm9kZVRvUHJvamVjdC5uZXh0O1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBMVmlld0RhdGEgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXdEYXRhIG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gYWRqdXN0ZWRIb3N0SW5kZXggSW5kZXggb2YgdGhlIHZpZXcncyBob3N0IG5vZGUgaW4gTFZpZXdEYXRhW10sIGFkanVzdGVkIGZvciBoZWFkZXJcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXdEYXRhIG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3RGF0YXxMQ29udGFpbmVyPihcbiAgICBjdXJyZW50VmlldzogTFZpZXdEYXRhLCBhZGp1c3RlZEhvc3RJbmRleDogbnVtYmVyLCBzdGF0ZTogVCk6IFQge1xuICBpZiAoY3VycmVudFZpZXdbVEFJTF0pIHtcbiAgICBjdXJyZW50Vmlld1tUQUlMXSAhW05FWFRdID0gc3RhdGU7XG4gIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5jaGlsZEluZGV4ID0gYWRqdXN0ZWRIb3N0SW5kZXg7XG4gIH1cbiAgY3VycmVudFZpZXdbVEFJTF0gPSBzdGF0ZTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3RGF0YSBkaXJ0eS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaCh2aWV3SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCB2aWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgodmlld0luZGV4LCB2aWV3RGF0YSk7XG4gIGlmICghKHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICB2aWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbi8qKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciB3aXRoIHByZXZlbnREZWZhdWx0IGJlaGF2aW9yLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyYXBMaXN0ZW5lcldpdGhQcmV2ZW50RGVmYXVsdChsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55KTogRXZlbnRMaXN0ZW5lciB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwTGlzdGVuZXJJbl9wcmV2ZW50RGVmYXVsdChlOiBFdmVudCkge1xuICAgIGlmIChsaXN0ZW5lckZuKGUpID09PSBmYWxzZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgLy8gTmVjZXNzYXJ5IGZvciBsZWdhY3kgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IHByZXZlbnREZWZhdWx0IChlLmcuIElFKVxuICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqIE1hcmtzIGN1cnJlbnQgdmlldyBhbmQgYWxsIGFuY2VzdG9ycyBkaXJ0eSAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtWaWV3RGlydHkodmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGxldCBjdXJyZW50VmlldzogTFZpZXdEYXRhID0gdmlldztcblxuICB3aGlsZSAoY3VycmVudFZpZXcgJiYgIShjdXJyZW50Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkpIHtcbiAgICBjdXJyZW50Vmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3W1BBUkVOVF0gITtcbiAgfVxuICBjdXJyZW50Vmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY3VycmVudFZpZXdbQ09OVEVYVF0sICdyb290Q29udGV4dCBzaG91bGQgYmUgZGVmaW5lZCcpO1xuXG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gY3VycmVudFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQ7XG4gIHNjaGVkdWxlVGljayhyb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzKTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljazxUPihyb290Q29udGV4dDogUm9vdENvbnRleHQsIGZsYWdzOiBSb290Q29udGV4dEZsYWdzKSB7XG4gIGNvbnN0IG5vdGhpbmdTY2hlZHVsZWQgPSByb290Q29udGV4dC5mbGFncyA9PT0gUm9vdENvbnRleHRGbGFncy5FbXB0eTtcbiAgcm9vdENvbnRleHQuZmxhZ3MgfD0gZmxhZ3M7XG5cbiAgaWYgKG5vdGhpbmdTY2hlZHVsZWQgJiYgcm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXM7XG4gICAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycztcbiAgICAgICAgY29uc3QgcGxheWVySGFuZGxlciA9IHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXI7XG4gICAgICAgIGlmIChwbGF5ZXJIYW5kbGVyKSB7XG4gICAgICAgICAgcGxheWVySGFuZGxlci5mbHVzaFBsYXllcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgICAgcmVzICEobnVsbCk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIGBkZXRlY3RDaGFuZ2VzYCwgYnV0IGludm9rZWQgb24gcm9vdCBjb21wb25lbnQuIEFkZGl0aW9uYWxseSwgYHRpY2tgXG4gKiBleGVjdXRlcyBsaWZlY3ljbGUgaG9va3MgYW5kIGNvbmRpdGlvbmFsbHkgY2hlY2tzIGNvbXBvbmVudHMgYmFzZWQgb24gdGhlaXJcbiAqIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneWAgYW5kIGRpcnRpbmVzcy5cbiAqXG4gKiBUaGUgcHJlZmVycmVkIHdheSB0byB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gaXMgdG8gY2FsbCBgbWFya0RpcnR5YC4gYG1hcmtEaXJ0eWAgaW50ZXJuYWxseVxuICogc2NoZWR1bGVzIGB0aWNrYCB1c2luZyBhIHNjaGVkdWxlciBpbiBvcmRlciB0byBjb2FsZXNjZSBtdWx0aXBsZSBgbWFya0RpcnR5YCBjYWxscyBpbnRvIGFcbiAqIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi4gQnkgZGVmYXVsdCwgdGhlIHNjaGVkdWxlciBpcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCwgYnV0IGNhblxuICogYmUgY2hhbmdlZCB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgYW5kIHByb3ZpZGluZyB0aGUgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGljazxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3Qgcm9vdFZpZXcgPSBnZXRSb290Vmlldyhjb21wb25lbnQpO1xuICBjb25zdCByb290Q29udGV4dCA9IHJvb3RWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xuICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xufVxuXG5mdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUocmVhZFBhdGNoZWRMVmlld0RhdGEocm9vdENvbXBvbmVudCkgISwgcm9vdENvbXBvbmVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIGNvbXBvbmVudCAoYW5kIHBvc3NpYmx5IGl0cyBzdWItY29tcG9uZW50cykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0cmlnZ2VycyBjaGFuZ2UgZGV0ZWN0aW9uIGluIGEgc3luY2hyb25vdXMgd2F5IG9uIGEgY29tcG9uZW50LiBUaGVyZSBzaG91bGRcbiAqIGJlIHZlcnkgbGl0dGxlIHJlYXNvbiB0byBjYWxsIHRoaXMgZnVuY3Rpb24gZGlyZWN0bHkgc2luY2UgYSBwcmVmZXJyZWQgd2F5IHRvIGRvIGNoYW5nZVxuICogZGV0ZWN0aW9uIGlzIHRvIHtAbGluayBtYXJrRGlydHl9IHRoZSBjb21wb25lbnQgYW5kIHdhaXQgZm9yIHRoZSBzY2hlZHVsZXIgdG8gY2FsbCB0aGlzIG1ldGhvZFxuICogYXQgc29tZSBmdXR1cmUgcG9pbnQgaW4gdGltZS4gVGhpcyBpcyBiZWNhdXNlIGEgc2luZ2xlIHVzZXIgYWN0aW9uIG9mdGVuIHJlc3VsdHMgaW4gbWFueVxuICogY29tcG9uZW50cyBiZWluZyBpbnZhbGlkYXRlZCBhbmQgY2FsbGluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGVhY2ggY29tcG9uZW50IHN5bmNocm9ub3VzbHlcbiAqIHdvdWxkIGJlIGluZWZmaWNpZW50LiBJdCBpcyBiZXR0ZXIgdG8gd2FpdCB1bnRpbCBhbGwgY29tcG9uZW50cyBhcmUgbWFya2VkIGFzIGRpcnR5IGFuZFxuICogdGhlbiBwZXJmb3JtIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIGFjcm9zcyBhbGwgb2YgdGhlIGNvbXBvbmVudHNcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGRldGVjdENoYW5nZXNJbnRlcm5hbChnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZShjb21wb25lbnQpICEsIGNvbXBvbmVudCk7XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlld0RhdGEgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblJvb3RWaWV3KGxWaWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIHRpY2tSb290Q29udGV4dChsVmlld0RhdGFbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQpO1xufVxuXG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IHRydWU7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlcyhjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3Igb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZVxuICogZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBsVmlld0RhdGEgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIGNoZWNrZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0luUm9vdFZpZXcobFZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY2hlY2tOb0NoYW5nZXNNb2RlID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlld0RhdGEpO1xuICB9IGZpbmFsbHkge1xuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuICB9XG59XG5cbi8qKiBDaGVja3MgdGhlIHZpZXcgb2YgdGhlIGNvbXBvbmVudCBwcm92aWRlZC4gRG9lcyBub3QgZ2F0ZSBvbiBkaXJ0eSBjaGVja3Mgb3IgZXhlY3V0ZSBkb0NoZWNrLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPihob3N0VmlldzogTFZpZXdEYXRhLCBjb21wb25lbnQ6IFQpIHtcbiAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdFZpZXdbVFZJRVddO1xuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KGhvc3RWaWV3LCBob3N0Vmlld1tIT1NUX05PREVdKTtcbiAgY29uc3QgdGVtcGxhdGVGbiA9IGhvc3RUVmlldy50ZW1wbGF0ZSAhO1xuICBjb25zdCB2aWV3UXVlcnkgPSBob3N0VFZpZXcudmlld1F1ZXJ5O1xuXG4gIHRyeSB7XG4gICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgIGNyZWF0ZVZpZXdRdWVyeSh2aWV3UXVlcnksIGhvc3RWaWV3W0ZMQUdTXSwgY29tcG9uZW50KTtcbiAgICB0ZW1wbGF0ZUZuKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50KTtcbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKCk7XG4gICAgdXBkYXRlVmlld1F1ZXJ5KHZpZXdRdWVyeSwgY29tcG9uZW50KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBsZWF2ZVZpZXcob2xkVmlldyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld1F1ZXJ5PFQ+KFxuICAgIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8e30+fCBudWxsLCBmbGFnczogTFZpZXdGbGFncywgY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGlmICh2aWV3UXVlcnkgJiYgKGZsYWdzICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpKSB7XG4gICAgdmlld1F1ZXJ5KFJlbmRlckZsYWdzLkNyZWF0ZSwgY29tcG9uZW50KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVWaWV3UXVlcnk8VD4odmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTx7fT58IG51bGwsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBpZiAodmlld1F1ZXJ5KSB7XG4gICAgdmlld1F1ZXJ5KFJlbmRlckZsYWdzLlVwZGF0ZSwgY29tcG9uZW50KTtcbiAgfVxufVxuXG5cbi8qKlxuICogTWFyayB0aGUgY29tcG9uZW50IGFzIGRpcnR5IChuZWVkaW5nIGNoYW5nZSBkZXRlY3Rpb24pLlxuICpcbiAqIE1hcmtpbmcgYSBjb21wb25lbnQgZGlydHkgd2lsbCBzY2hlZHVsZSBhIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhpc1xuICogY29tcG9uZW50IGF0IHNvbWUgcG9pbnQgaW4gdGhlIGZ1dHVyZS4gTWFya2luZyBhbiBhbHJlYWR5IGRpcnR5XG4gKiBjb21wb25lbnQgYXMgZGlydHkgaXMgYSBub29wLiBPbmx5IG9uZSBvdXRzdGFuZGluZyBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBjYW4gYmUgc2NoZWR1bGVkIHBlciBjb21wb25lbnQgdHJlZS4gKFR3byBjb21wb25lbnRzIGJvb3RzdHJhcHBlZCB3aXRoXG4gKiBzZXBhcmF0ZSBgcmVuZGVyQ29tcG9uZW50YCB3aWxsIGhhdmUgc2VwYXJhdGUgc2NoZWR1bGVycylcbiAqXG4gKiBXaGVuIHRoZSByb290IGNvbXBvbmVudCBpcyBib290c3RyYXBwZWQgd2l0aCBgcmVuZGVyQ29tcG9uZW50YCwgYSBzY2hlZHVsZXJcbiAqIGNhbiBiZSBwcm92aWRlZC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCB0byBtYXJrIGFzIGRpcnR5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya0RpcnR5PFQ+KGNvbXBvbmVudDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnQsICdjb21wb25lbnQnKTtcbiAgbWFya1ZpZXdEaXJ0eShnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZShjb21wb25lbnQpKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBCaW5kaW5ncyAmIGludGVycG9sYXRpb25zXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBpbnRlcmZhY2UgTk9fQ0hBTkdFIHtcbiAgLy8gVGhpcyBpcyBhIGJyYW5kIHRoYXQgZW5zdXJlcyB0aGF0IHRoaXMgdHlwZSBjYW4gbmV2ZXIgbWF0Y2ggYW55dGhpbmcgZWxzZVxuICBicmFuZDogJ05PX0NIQU5HRSc7XG59XG5cbi8qKiBBIHNwZWNpYWwgdmFsdWUgd2hpY2ggZGVzaWduYXRlcyB0aGF0IGEgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLiAqL1xuZXhwb3J0IGNvbnN0IE5PX0NIQU5HRSA9IHt9IGFzIE5PX0NIQU5HRTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgc2luZ2xlIHZhbHVlIGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIGRpZmZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmQ8VD4odmFsdWU6IFQpOiBUfE5PX0NIQU5HRSB7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSsrLCB2YWx1ZSkgPyB2YWx1ZSA6IE5PX0NIQU5HRTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgaW50ZXJwb2xhdGlvbiBiaW5kaW5ncyB3aXRoIGEgdmFyaWFibGUgbnVtYmVyIG9mIGV4cHJlc3Npb25zLlxuICpcbiAqIElmIHRoZXJlIGFyZSAxIHRvIDggZXhwcmVzc2lvbnMgYGludGVycG9sYXRpb24xKClgIHRvIGBpbnRlcnBvbGF0aW9uOCgpYCBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkLlxuICogVGhvc2UgYXJlIGZhc3RlciBiZWNhdXNlIHRoZXJlIGlzIG5vIG5lZWQgdG8gY3JlYXRlIGFuIGFycmF5IG9mIGV4cHJlc3Npb25zIGFuZCBpdGVyYXRlIG92ZXIgaXQuXG4gKlxuICogYHZhbHVlc2A6XG4gKiAtIGhhcyBzdGF0aWMgdGV4dCBhdCBldmVuIGluZGV4ZXMsXG4gKiAtIGhhcyBldmFsdWF0ZWQgZXhwcmVzc2lvbnMgYXQgb2RkIGluZGV4ZXMuXG4gKlxuICogUmV0dXJucyB0aGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb25WKHZhbHVlczogYW55W10pOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKDIsIHZhbHVlcy5sZW5ndGgsICdzaG91bGQgaGF2ZSBhdCBsZWFzdCAzIHZhbHVlcycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodmFsdWVzLmxlbmd0aCAlIDIsIDEsICdzaG91bGQgaGF2ZSBhbiBvZGQgbnVtYmVyIG9mIHZhbHVlcycpO1xuICBsZXQgZGlmZmVyZW50ID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAvLyBDaGVjayBpZiBiaW5kaW5ncyAob2RkIGluZGV4ZXMpIGhhdmUgY2hhbmdlZFxuICAgIGJpbmRpbmdVcGRhdGVkKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKyssIHZhbHVlc1tpXSkgJiYgKGRpZmZlcmVudCA9IHRydWUpO1xuICB9XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgLy8gQnVpbGQgdGhlIHVwZGF0ZWQgY29udGVudFxuICBsZXQgY29udGVudCA9IHZhbHVlc1swXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb250ZW50ICs9IHN0cmluZ2lmeSh2YWx1ZXNbaV0pICsgdmFsdWVzW2kgKyAxXTtcbiAgfVxuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMSBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSBwcmVmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMShwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodmlld0RhdGFbQklORElOR19JTkRFWF0rKywgdjApO1xuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMiBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEpO1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSAyO1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAzIGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24zKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDModmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIpO1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSAzO1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgc3VmZml4IDpcbiAgICAgICAgICAgICAgICAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZSBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA0IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb240KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSA0O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArXG4gICAgICAgICAgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNSBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNShcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNTtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDYgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjYoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodmlld0RhdGFbQklORElOR19JTkRFWF0gKyA0LCB2NCwgdjUpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNjtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDcgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjcoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDModmlld0RhdGFbQklORElOR19JTkRFWF0gKyA0LCB2NCwgdjUsIHY2KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDc7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBpNSArIHN0cmluZ2lmeSh2NikgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA4IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb244KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIGk2OiBzdHJpbmcsIHY3OiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0gKyA0LCB2NCwgdjUsIHY2LCB2NykgfHwgZGlmZmVyZW50O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSA4O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgaTUgKyBzdHJpbmdpZnkodjYpICsgaTYgKyBzdHJpbmdpZnkodjcpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIFN0b3JlIGEgdmFsdWUgaW4gdGhlIGBkYXRhYCBhdCBhIGdpdmVuIGBpbmRleGAuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmU8VD4oaW5kZXg6IG51bWJlciwgdmFsdWU6IFQpOiB2b2lkIHtcbiAgLy8gV2UgZG9uJ3Qgc3RvcmUgYW55IHN0YXRpYyBkYXRhIGZvciBsb2NhbCB2YXJpYWJsZXMsIHNvIHRoZSBmaXJzdCB0aW1lXG4gIC8vIHdlIHNlZSB0aGUgdGVtcGxhdGUsIHdlIHNob3VsZCBzdG9yZSBhcyBudWxsIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGlmIChhZGp1c3RlZEluZGV4ID49IHRWaWV3LmRhdGEubGVuZ3RoKSB7XG4gICAgdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSA9IG51bGw7XG4gIH1cbiAgdmlld0RhdGFbYWRqdXN0ZWRJbmRleF0gPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBsb2NhbCByZWZlcmVuY2UgZnJvbSB0aGUgY3VycmVudCBjb250ZXh0Vmlld0RhdGEuXG4gKlxuICogSWYgdGhlIHJlZmVyZW5jZSB0byByZXRyaWV2ZSBpcyBpbiBhIHBhcmVudCB2aWV3LCB0aGlzIGluc3RydWN0aW9uIGlzIHVzZWQgaW4gY29uanVuY3Rpb25cbiAqIHdpdGggYSBuZXh0Q29udGV4dCgpIGNhbGwsIHdoaWNoIHdhbGtzIHVwIHRoZSB0cmVlIGFuZCB1cGRhdGVzIHRoZSBjb250ZXh0Vmlld0RhdGEgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgbG9jYWwgcmVmIGluIGNvbnRleHRWaWV3RGF0YS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZmVyZW5jZTxUPihpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBsb2FkSW50ZXJuYWw8VD4oaW5kZXgsIGNvbnRleHRWaWV3RGF0YSk7XG59XG5cbmZ1bmN0aW9uIHdhbGtVcFZpZXdzKG5lc3RpbmdMZXZlbDogbnVtYmVyLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogTFZpZXdEYXRhIHtcbiAgd2hpbGUgKG5lc3RpbmdMZXZlbCA+IDApIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddLFxuICAgICAgICAgICAgICAgICAgICAgJ0RlY2xhcmF0aW9uIHZpZXcgc2hvdWxkIGJlIGRlZmluZWQgaWYgbmVzdGluZyBsZXZlbCBpcyBncmVhdGVyIHRoYW4gMC4nKTtcbiAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgbmVzdGluZ0xldmVsLS07XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnRWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZFF1ZXJ5TGlzdDxUPihxdWVyeUxpc3RJZHg6IG51bWJlcik6IFF1ZXJ5TGlzdDxUPiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10sXG4gICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQgUXVlcnlMaXN0IGFycmF5IHNob3VsZCBiZSBkZWZpbmVkIGlmIHJlYWRpbmcgYSBxdWVyeS4nKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHF1ZXJ5TGlzdElkeCwgdmlld0RhdGFbQ09OVEVOVF9RVUVSSUVTXSAhKTtcblxuICByZXR1cm4gdmlld0RhdGFbQ09OVEVOVF9RVUVSSUVTXSAhW3F1ZXJ5TGlzdElkeF07XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIGN1cnJlbnQgYHZpZXdEYXRhYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkPFQ+KGluZGV4OiBudW1iZXIpOiBUIHtcbiAgcmV0dXJuIGxvYWRJbnRlcm5hbDxUPihpbmRleCwgdmlld0RhdGEpO1xufVxuXG4vKiogR2V0cyB0aGUgY3VycmVudCBiaW5kaW5nIHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmcoYmluZGluZ0luZGV4OiBudW1iZXIpOiBhbnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2Uodmlld0RhdGFbYmluZGluZ0luZGV4XSk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwodmlld0RhdGFbYmluZGluZ0luZGV4XSwgTk9fQ0hBTkdFLCAnU3RvcmVkIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIHJldHVybiB2aWV3RGF0YVtiaW5kaW5nSW5kZXhdO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGl0IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkKGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbCh2YWx1ZSwgTk9fQ0hBTkdFLCAnSW5jb21pbmcgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKFxuICAgICAgICAgICAgICAgICAgIGJpbmRpbmdJbmRleCwgdmlld0RhdGEubGVuZ3RoLCBgU2xvdCBzaG91bGQgaGF2ZSBiZWVuIGluaXRpYWxpemVkIHRvIE5PX0NIQU5HRWApO1xuXG4gIGlmICh2aWV3RGF0YVtiaW5kaW5nSW5kZXhdID09PSBOT19DSEFOR0UpIHtcbiAgICB2aWV3RGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG4gIH0gZWxzZSBpZiAoaXNEaWZmZXJlbnQodmlld0RhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUsIGNoZWNrTm9DaGFuZ2VzTW9kZSkpIHtcbiAgICB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlKGNyZWF0aW9uTW9kZSwgY2hlY2tOb0NoYW5nZXNNb2RlLCB2aWV3RGF0YVtiaW5kaW5nSW5kZXhdLCB2YWx1ZSk7XG4gICAgdmlld0RhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqIFVwZGF0ZXMgYmluZGluZyBhbmQgcmV0dXJucyB0aGUgdmFsdWUuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQmluZGluZyhiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSk6IGFueSB7XG4gIHJldHVybiB2aWV3RGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKiBVcGRhdGVzIDIgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgZWl0aGVyIHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkMihiaW5kaW5nSW5kZXg6IG51bWJlciwgZXhwMTogYW55LCBleHAyOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQoYmluZGluZ0luZGV4LCBleHAxKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGJpbmRpbmdJbmRleCArIDEsIGV4cDIpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgMyBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQzKGJpbmRpbmdJbmRleDogbnVtYmVyLCBleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQoYmluZGluZ0luZGV4ICsgMiwgZXhwMykgfHwgZGlmZmVyZW50O1xufVxuXG4vKiogVXBkYXRlcyA0IGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGFueSB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDQoXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIoYmluZGluZ0luZGV4LCBleHAxLCBleHAyKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMihiaW5kaW5nSW5kZXggKyAyLCBleHAzLCBleHA0KSB8fCBkaWZmZXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUVmlldygpOiBUVmlldyB7XG4gIHJldHVybiB0Vmlldztcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBRdWVyeUxpc3QsIGFzc29jaWF0ZWQgd2l0aCBhIGNvbnRlbnQgcXVlcnksIGZvciBsYXRlciByZWZyZXNoIChwYXJ0IG9mIGEgdmlld1xuICogcmVmcmVzaCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbnRlbnRRdWVyeTxRPihxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxRPik6IHZvaWQge1xuICBjb25zdCBzYXZlZENvbnRlbnRRdWVyaWVzTGVuZ3RoID1cbiAgICAgICh2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdIHx8ICh2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdID0gW10pKS5wdXNoKHF1ZXJ5TGlzdCk7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGNvbnN0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IHZpZXdEYXRhLmxlbmd0aCAtIDE7XG4gICAgY29uc3QgdFZpZXdDb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzIHx8ICh0Vmlldy5jb250ZW50UXVlcmllcyA9IFtdKTtcbiAgICBjb25zdCBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCA9XG4gICAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aCA/IHRWaWV3LmNvbnRlbnRRdWVyaWVzW3RWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aCAtIDJdIDogLTE7XG4gICAgaWYgKGN1cnJlbnREaXJlY3RpdmVJbmRleCAhPT0gbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXgpIHtcbiAgICAgIHRWaWV3Q29udGVudFF1ZXJpZXMucHVzaChjdXJyZW50RGlyZWN0aXZlSW5kZXgsIHNhdmVkQ29udGVudFF1ZXJpZXNMZW5ndGggLSAxKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKSB7XG4gIGFzc2VydEVxdWFsKGlzUGFyZW50LCB0cnVlLCAncHJldmlvdXNPclBhcmVudFROb2RlIHNob3VsZCBiZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRIYXNQYXJlbnQoKSB7XG4gIGFzc2VydERlZmluZWQocHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCwgJ3ByZXZpb3VzT3JQYXJlbnRUTm9kZSBzaG91bGQgaGF2ZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnREYXRhSW5SYW5nZShpbmRleDogbnVtYmVyLCBhcnI/OiBhbnlbXSkge1xuICBpZiAoYXJyID09IG51bGwpIGFyciA9IHZpZXdEYXRhO1xuICBhc3NlcnREYXRhSW5SYW5nZUludGVybmFsKGluZGV4LCBhcnIgfHwgdmlld0RhdGEpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnREYXRhTmV4dChpbmRleDogbnVtYmVyLCBhcnI/OiBhbnlbXSkge1xuICBpZiAoYXJyID09IG51bGwpIGFyciA9IHZpZXdEYXRhO1xuICBhc3NlcnRFcXVhbChcbiAgICAgIGFyci5sZW5ndGgsIGluZGV4LCBgaW5kZXggJHtpbmRleH0gZXhwZWN0ZWQgdG8gYmUgYXQgdGhlIGVuZCBvZiBhcnIgKGxlbmd0aCAke2Fyci5sZW5ndGh9KWApO1xufVxuXG5leHBvcnQgY29uc3QgQ0xFQU5fUFJPTUlTRSA9IF9DTEVBTl9QUk9NSVNFO1xuIl19