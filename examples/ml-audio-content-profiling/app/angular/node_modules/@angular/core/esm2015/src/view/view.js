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
import { checkAndUpdateElementDynamic, checkAndUpdateElementInline, createElement, listenToElementOutputs } from './element';
import { expressionChangedAfterItHasBeenCheckedError } from './errors';
import { appendNgContent } from './ng_content';
import { callLifecycleHooksChildrenFirst, checkAndUpdateDirectiveDynamic, checkAndUpdateDirectiveInline, createDirectiveInstance, createPipeInstance, createProviderInstance } from './provider';
import { checkAndUpdatePureExpressionDynamic, checkAndUpdatePureExpressionInline, createPureExpression } from './pure_expression';
import { checkAndUpdateQuery, createQuery } from './query';
import { createTemplateData, createViewContainerData } from './refs';
import { checkAndUpdateTextDynamic, checkAndUpdateTextInline, createText } from './text';
import { Services, asElementData, asQueryList, asTextData, shiftInitState } from './types';
import { NOOP, checkBindingNoChanges, isComponentView, markParentViewsForCheckProjectedViews, resolveDefinition, tokenKey } from './util';
import { detachProjectedView } from './view_attach';
/**
 * @param {?} flags
 * @param {?} nodes
 * @param {?=} updateDirectives
 * @param {?=} updateRenderer
 * @return {?}
 */
export function viewDef(flags, nodes, updateDirectives, updateRenderer) {
    /** @type {?} */
    let viewBindingCount = 0;
    /** @type {?} */
    let viewDisposableCount = 0;
    /** @type {?} */
    let viewNodeFlags = 0;
    /** @type {?} */
    let viewRootNodeFlags = 0;
    /** @type {?} */
    let viewMatchedQueries = 0;
    /** @type {?} */
    let currentParent = null;
    /** @type {?} */
    let currentRenderParent = null;
    /** @type {?} */
    let currentElementHasPublicProviders = false;
    /** @type {?} */
    let currentElementHasPrivateProviders = false;
    /** @type {?} */
    let lastRenderRootNode = null;
    for (let i = 0; i < nodes.length; i++) {
        /** @type {?} */
        const node = nodes[i];
        node.nodeIndex = i;
        node.parent = currentParent;
        node.bindingIndex = viewBindingCount;
        node.outputIndex = viewDisposableCount;
        node.renderParent = currentRenderParent;
        viewNodeFlags |= node.flags;
        viewMatchedQueries |= node.matchedQueryIds;
        if (node.element) {
            /** @type {?} */
            const elDef = node.element;
            elDef.publicProviders =
                currentParent ? /** @type {?} */ ((currentParent.element)).publicProviders : Object.create(null);
            elDef.allProviders = elDef.publicProviders;
            // Note: We assume that all providers of an element are before any child element!
            currentElementHasPublicProviders = false;
            currentElementHasPrivateProviders = false;
            if (node.element.template) {
                viewMatchedQueries |= node.element.template.nodeMatchedQueries;
            }
        }
        validateNode(currentParent, node, nodes.length);
        viewBindingCount += node.bindings.length;
        viewDisposableCount += node.outputs.length;
        if (!currentRenderParent && (node.flags & 3 /* CatRenderNode */)) {
            lastRenderRootNode = node;
        }
        if (node.flags & 20224 /* CatProvider */) {
            if (!currentElementHasPublicProviders) {
                currentElementHasPublicProviders = true; /** @type {?} */
                ((/** @type {?} */ ((currentParent)).element)).publicProviders = Object.create(/** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).publicProviders); /** @type {?} */
                ((/** @type {?} */ ((currentParent)).element)).allProviders = /** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).publicProviders;
            }
            /** @type {?} */
            const isPrivateService = (node.flags & 8192 /* PrivateProvider */) !== 0;
            /** @type {?} */
            const isComponent = (node.flags & 32768 /* Component */) !== 0;
            if (!isPrivateService || isComponent) {
                /** @type {?} */ ((/** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).publicProviders))[tokenKey(/** @type {?} */ ((node.provider)).token)] = node;
            }
            else {
                if (!currentElementHasPrivateProviders) {
                    currentElementHasPrivateProviders = true; /** @type {?} */
                    ((/** @type {?} */ ((currentParent)).element)).allProviders = Object.create(/** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).publicProviders);
                } /** @type {?} */
                ((/** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).allProviders))[tokenKey(/** @type {?} */ ((node.provider)).token)] = node;
            }
            if (isComponent) {
                /** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).componentProvider = node;
            }
        }
        if (currentParent) {
            currentParent.childFlags |= node.flags;
            currentParent.directChildFlags |= node.flags;
            currentParent.childMatchedQueries |= node.matchedQueryIds;
            if (node.element && node.element.template) {
                currentParent.childMatchedQueries |= node.element.template.nodeMatchedQueries;
            }
        }
        else {
            viewRootNodeFlags |= node.flags;
        }
        if (node.childCount > 0) {
            currentParent = node;
            if (!isNgContainer(node)) {
                currentRenderParent = node;
            }
        }
        else {
            // When the current node has no children, check if it is the last children of its parent.
            // When it is, propagate the flags up.
            // The loop is required because an element could be the last transitive children of several
            // elements. We loop to either the root or the highest opened element (= with remaining
            // children)
            while (currentParent && i === currentParent.nodeIndex + currentParent.childCount) {
                /** @type {?} */
                const newParent = currentParent.parent;
                if (newParent) {
                    newParent.childFlags |= currentParent.childFlags;
                    newParent.childMatchedQueries |= currentParent.childMatchedQueries;
                }
                currentParent = newParent;
                // We also need to update the render parent & account for ng-container
                if (currentParent && isNgContainer(currentParent)) {
                    currentRenderParent = currentParent.renderParent;
                }
                else {
                    currentRenderParent = currentParent;
                }
            }
        }
    }
    /** @type {?} */
    const handleEvent = (view, nodeIndex, eventName, event) => /** @type {?} */ ((/** @type {?} */ ((nodes[nodeIndex].element)).handleEvent))(view, eventName, event);
    return {
        // Will be filled later...
        factory: null,
        nodeFlags: viewNodeFlags,
        rootNodeFlags: viewRootNodeFlags,
        nodeMatchedQueries: viewMatchedQueries, flags,
        nodes: nodes,
        updateDirectives: updateDirectives || NOOP,
        updateRenderer: updateRenderer || NOOP, handleEvent,
        bindingCount: viewBindingCount,
        outputCount: viewDisposableCount, lastRenderRootNode
    };
}
/**
 * @param {?} node
 * @return {?}
 */
function isNgContainer(node) {
    return (node.flags & 1 /* TypeElement */) !== 0 && /** @type {?} */ ((node.element)).name === null;
}
/**
 * @param {?} parent
 * @param {?} node
 * @param {?} nodeCount
 * @return {?}
 */
function validateNode(parent, node, nodeCount) {
    /** @type {?} */
    const template = node.element && node.element.template;
    if (template) {
        if (!template.lastRenderRootNode) {
            throw new Error(`Illegal State: Embedded templates without nodes are not allowed!`);
        }
        if (template.lastRenderRootNode &&
            template.lastRenderRootNode.flags & 16777216 /* EmbeddedViews */) {
            throw new Error(`Illegal State: Last root node of a template can't have embedded views, at index ${node.nodeIndex}!`);
        }
    }
    if (node.flags & 20224 /* CatProvider */) {
        /** @type {?} */
        const parentFlags = parent ? parent.flags : 0;
        if ((parentFlags & 1 /* TypeElement */) === 0) {
            throw new Error(`Illegal State: StaticProvider/Directive nodes need to be children of elements or anchors, at index ${node.nodeIndex}!`);
        }
    }
    if (node.query) {
        if (node.flags & 67108864 /* TypeContentQuery */ &&
            (!parent || (parent.flags & 16384 /* TypeDirective */) === 0)) {
            throw new Error(`Illegal State: Content Query nodes need to be children of directives, at index ${node.nodeIndex}!`);
        }
        if (node.flags & 134217728 /* TypeViewQuery */ && parent) {
            throw new Error(`Illegal State: View Query nodes have to be top level nodes, at index ${node.nodeIndex}!`);
        }
    }
    if (node.childCount) {
        /** @type {?} */
        const parentEnd = parent ? parent.nodeIndex + parent.childCount : nodeCount - 1;
        if (node.nodeIndex <= parentEnd && node.nodeIndex + node.childCount > parentEnd) {
            throw new Error(`Illegal State: childCount of node leads outside of parent, at index ${node.nodeIndex}!`);
        }
    }
}
/**
 * @param {?} parent
 * @param {?} anchorDef
 * @param {?} viewDef
 * @param {?=} context
 * @return {?}
 */
export function createEmbeddedView(parent, anchorDef, viewDef, context) {
    /** @type {?} */
    const view = createView(parent.root, parent.renderer, parent, anchorDef, viewDef);
    initView(view, parent.component, context);
    createViewNodes(view);
    return view;
}
/**
 * @param {?} root
 * @param {?} def
 * @param {?=} context
 * @return {?}
 */
export function createRootView(root, def, context) {
    /** @type {?} */
    const view = createView(root, root.renderer, null, null, def);
    initView(view, context, context);
    createViewNodes(view);
    return view;
}
/**
 * @param {?} parentView
 * @param {?} nodeDef
 * @param {?} viewDef
 * @param {?} hostElement
 * @return {?}
 */
export function createComponentView(parentView, nodeDef, viewDef, hostElement) {
    /** @type {?} */
    const rendererType = /** @type {?} */ ((nodeDef.element)).componentRendererType;
    /** @type {?} */
    let compRenderer;
    if (!rendererType) {
        compRenderer = parentView.root.renderer;
    }
    else {
        compRenderer = parentView.root.rendererFactory.createRenderer(hostElement, rendererType);
    }
    return createView(parentView.root, compRenderer, parentView, /** @type {?} */ ((nodeDef.element)).componentProvider, viewDef);
}
/**
 * @param {?} root
 * @param {?} renderer
 * @param {?} parent
 * @param {?} parentNodeDef
 * @param {?} def
 * @return {?}
 */
function createView(root, renderer, parent, parentNodeDef, def) {
    /** @type {?} */
    const nodes = new Array(def.nodes.length);
    /** @type {?} */
    const disposables = def.outputCount ? new Array(def.outputCount) : null;
    /** @type {?} */
    const view = {
        def,
        parent,
        viewContainerParent: null, parentNodeDef,
        context: null,
        component: null, nodes,
        state: 13 /* CatInit */, root, renderer,
        oldValues: new Array(def.bindingCount), disposables,
        initIndex: -1
    };
    return view;
}
/**
 * @param {?} view
 * @param {?} component
 * @param {?} context
 * @return {?}
 */
function initView(view, component, context) {
    view.component = component;
    view.context = context;
}
/**
 * @param {?} view
 * @return {?}
 */
function createViewNodes(view) {
    /** @type {?} */
    let renderHost;
    if (isComponentView(view)) {
        /** @type {?} */
        const hostDef = view.parentNodeDef;
        renderHost = asElementData(/** @type {?} */ ((view.parent)), /** @type {?} */ ((/** @type {?} */ ((hostDef)).parent)).nodeIndex).renderElement;
    }
    /** @type {?} */
    const def = view.def;
    /** @type {?} */
    const nodes = view.nodes;
    for (let i = 0; i < def.nodes.length; i++) {
        /** @type {?} */
        const nodeDef = def.nodes[i];
        Services.setCurrentNode(view, i);
        /** @type {?} */
        let nodeData;
        switch (nodeDef.flags & 201347067 /* Types */) {
            case 1 /* TypeElement */:
                /** @type {?} */
                const el = /** @type {?} */ (createElement(view, renderHost, nodeDef));
                /** @type {?} */
                let componentView = /** @type {?} */ ((undefined));
                if (nodeDef.flags & 33554432 /* ComponentView */) {
                    /** @type {?} */
                    const compViewDef = resolveDefinition(/** @type {?} */ ((/** @type {?} */ ((nodeDef.element)).componentView)));
                    componentView = Services.createComponentView(view, nodeDef, compViewDef, el);
                }
                listenToElementOutputs(view, componentView, nodeDef, el);
                nodeData = /** @type {?} */ ({
                    renderElement: el,
                    componentView,
                    viewContainer: null,
                    template: /** @type {?} */ ((nodeDef.element)).template ? createTemplateData(view, nodeDef) : undefined
                });
                if (nodeDef.flags & 16777216 /* EmbeddedViews */) {
                    nodeData.viewContainer = createViewContainerData(view, nodeDef, nodeData);
                }
                break;
            case 2 /* TypeText */:
                nodeData = /** @type {?} */ (createText(view, renderHost, nodeDef));
                break;
            case 512 /* TypeClassProvider */:
            case 1024 /* TypeFactoryProvider */:
            case 2048 /* TypeUseExistingProvider */:
            case 256 /* TypeValueProvider */: {
                nodeData = nodes[i];
                if (!nodeData && !(nodeDef.flags & 4096 /* LazyProvider */)) {
                    /** @type {?} */
                    const instance = createProviderInstance(view, nodeDef);
                    nodeData = /** @type {?} */ ({ instance });
                }
                break;
            }
            case 16 /* TypePipe */: {
                /** @type {?} */
                const instance = createPipeInstance(view, nodeDef);
                nodeData = /** @type {?} */ ({ instance });
                break;
            }
            case 16384 /* TypeDirective */: {
                nodeData = nodes[i];
                if (!nodeData) {
                    /** @type {?} */
                    const instance = createDirectiveInstance(view, nodeDef);
                    nodeData = /** @type {?} */ ({ instance });
                }
                if (nodeDef.flags & 32768 /* Component */) {
                    /** @type {?} */
                    const compView = asElementData(view, /** @type {?} */ ((nodeDef.parent)).nodeIndex).componentView;
                    initView(compView, nodeData.instance, nodeData.instance);
                }
                break;
            }
            case 32 /* TypePureArray */:
            case 64 /* TypePureObject */:
            case 128 /* TypePurePipe */:
                nodeData = /** @type {?} */ (createPureExpression(view, nodeDef));
                break;
            case 67108864 /* TypeContentQuery */:
            case 134217728 /* TypeViewQuery */:
                nodeData = /** @type {?} */ (createQuery());
                break;
            case 8 /* TypeNgContent */:
                appendNgContent(view, renderHost, nodeDef);
                // no runtime data needed for NgContent...
                nodeData = undefined;
                break;
        }
        nodes[i] = nodeData;
    }
    // Create the ViewData.nodes of component views after we created everything else,
    // so that e.g. ng-content works
    execComponentViewsAction(view, ViewAction.CreateViewNodes);
    // fill static content and view queries
    execQueriesAction(view, 67108864 /* TypeContentQuery */ | 134217728 /* TypeViewQuery */, 268435456 /* StaticQuery */, 0 /* CheckAndUpdate */);
}
/**
 * @param {?} view
 * @return {?}
 */
export function checkNoChangesView(view) {
    markProjectedViewsForCheck(view);
    Services.updateDirectives(view, 1 /* CheckNoChanges */);
    execEmbeddedViewsAction(view, ViewAction.CheckNoChanges);
    Services.updateRenderer(view, 1 /* CheckNoChanges */);
    execComponentViewsAction(view, ViewAction.CheckNoChanges);
    // Note: We don't check queries for changes as we didn't do this in v2.x.
    // TODO(tbosch): investigate if we can enable the check again in v5.x with a nicer error message.
    view.state &= ~(64 /* CheckProjectedViews */ | 32 /* CheckProjectedView */);
}
/**
 * @param {?} view
 * @return {?}
 */
export function checkAndUpdateView(view) {
    if (view.state & 1 /* BeforeFirstCheck */) {
        view.state &= ~1 /* BeforeFirstCheck */;
        view.state |= 2 /* FirstCheck */;
    }
    else {
        view.state &= ~2 /* FirstCheck */;
    }
    shiftInitState(view, 0 /* InitState_BeforeInit */, 256 /* InitState_CallingOnInit */);
    markProjectedViewsForCheck(view);
    Services.updateDirectives(view, 0 /* CheckAndUpdate */);
    execEmbeddedViewsAction(view, ViewAction.CheckAndUpdate);
    execQueriesAction(view, 67108864 /* TypeContentQuery */, 536870912 /* DynamicQuery */, 0 /* CheckAndUpdate */);
    /** @type {?} */
    let callInit = shiftInitState(view, 256 /* InitState_CallingOnInit */, 512 /* InitState_CallingAfterContentInit */);
    callLifecycleHooksChildrenFirst(view, 2097152 /* AfterContentChecked */ | (callInit ? 1048576 /* AfterContentInit */ : 0));
    Services.updateRenderer(view, 0 /* CheckAndUpdate */);
    execComponentViewsAction(view, ViewAction.CheckAndUpdate);
    execQueriesAction(view, 134217728 /* TypeViewQuery */, 536870912 /* DynamicQuery */, 0 /* CheckAndUpdate */);
    callInit = shiftInitState(view, 512 /* InitState_CallingAfterContentInit */, 768 /* InitState_CallingAfterViewInit */);
    callLifecycleHooksChildrenFirst(view, 8388608 /* AfterViewChecked */ | (callInit ? 4194304 /* AfterViewInit */ : 0));
    if (view.def.flags & 2 /* OnPush */) {
        view.state &= ~8 /* ChecksEnabled */;
    }
    view.state &= ~(64 /* CheckProjectedViews */ | 32 /* CheckProjectedView */);
    shiftInitState(view, 768 /* InitState_CallingAfterViewInit */, 1024 /* InitState_AfterInit */);
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} argStyle
 * @param {?=} v0
 * @param {?=} v1
 * @param {?=} v2
 * @param {?=} v3
 * @param {?=} v4
 * @param {?=} v5
 * @param {?=} v6
 * @param {?=} v7
 * @param {?=} v8
 * @param {?=} v9
 * @return {?}
 */
export function checkAndUpdateNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    if (argStyle === 0 /* Inline */) {
        return checkAndUpdateNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    }
    else {
        return checkAndUpdateNodeDynamic(view, nodeDef, v0);
    }
}
/**
 * @param {?} view
 * @return {?}
 */
function markProjectedViewsForCheck(view) {
    /** @type {?} */
    const def = view.def;
    if (!(def.nodeFlags & 4 /* ProjectedTemplate */)) {
        return;
    }
    for (let i = 0; i < def.nodes.length; i++) {
        /** @type {?} */
        const nodeDef = def.nodes[i];
        if (nodeDef.flags & 4 /* ProjectedTemplate */) {
            /** @type {?} */
            const projectedViews = asElementData(view, i).template._projectedViews;
            if (projectedViews) {
                for (let i = 0; i < projectedViews.length; i++) {
                    /** @type {?} */
                    const projectedView = projectedViews[i];
                    projectedView.state |= 32 /* CheckProjectedView */;
                    markParentViewsForCheckProjectedViews(projectedView, view);
                }
            }
        }
        else if ((nodeDef.childFlags & 4 /* ProjectedTemplate */) === 0) {
            // a parent with leafs
            // no child is a component,
            // then skip the children
            i += nodeDef.childCount;
        }
    }
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?=} v0
 * @param {?=} v1
 * @param {?=} v2
 * @param {?=} v3
 * @param {?=} v4
 * @param {?=} v5
 * @param {?=} v6
 * @param {?=} v7
 * @param {?=} v8
 * @param {?=} v9
 * @return {?}
 */
function checkAndUpdateNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    switch (nodeDef.flags & 201347067 /* Types */) {
        case 1 /* TypeElement */:
            return checkAndUpdateElementInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        case 2 /* TypeText */:
            return checkAndUpdateTextInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        case 16384 /* TypeDirective */:
            return checkAndUpdateDirectiveInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        case 32 /* TypePureArray */:
        case 64 /* TypePureObject */:
        case 128 /* TypePurePipe */:
            return checkAndUpdatePureExpressionInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        default:
            throw 'unreachable';
    }
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} values
 * @return {?}
 */
function checkAndUpdateNodeDynamic(view, nodeDef, values) {
    switch (nodeDef.flags & 201347067 /* Types */) {
        case 1 /* TypeElement */:
            return checkAndUpdateElementDynamic(view, nodeDef, values);
        case 2 /* TypeText */:
            return checkAndUpdateTextDynamic(view, nodeDef, values);
        case 16384 /* TypeDirective */:
            return checkAndUpdateDirectiveDynamic(view, nodeDef, values);
        case 32 /* TypePureArray */:
        case 64 /* TypePureObject */:
        case 128 /* TypePurePipe */:
            return checkAndUpdatePureExpressionDynamic(view, nodeDef, values);
        default:
            throw 'unreachable';
    }
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} argStyle
 * @param {?=} v0
 * @param {?=} v1
 * @param {?=} v2
 * @param {?=} v3
 * @param {?=} v4
 * @param {?=} v5
 * @param {?=} v6
 * @param {?=} v7
 * @param {?=} v8
 * @param {?=} v9
 * @return {?}
 */
export function checkNoChangesNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    if (argStyle === 0 /* Inline */) {
        checkNoChangesNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    }
    else {
        checkNoChangesNodeDynamic(view, nodeDef, v0);
    }
    // Returning false is ok here as we would have thrown in case of a change.
    return false;
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} v0
 * @param {?} v1
 * @param {?} v2
 * @param {?} v3
 * @param {?} v4
 * @param {?} v5
 * @param {?} v6
 * @param {?} v7
 * @param {?} v8
 * @param {?} v9
 * @return {?}
 */
function checkNoChangesNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    /** @type {?} */
    const bindLen = nodeDef.bindings.length;
    if (bindLen > 0)
        checkBindingNoChanges(view, nodeDef, 0, v0);
    if (bindLen > 1)
        checkBindingNoChanges(view, nodeDef, 1, v1);
    if (bindLen > 2)
        checkBindingNoChanges(view, nodeDef, 2, v2);
    if (bindLen > 3)
        checkBindingNoChanges(view, nodeDef, 3, v3);
    if (bindLen > 4)
        checkBindingNoChanges(view, nodeDef, 4, v4);
    if (bindLen > 5)
        checkBindingNoChanges(view, nodeDef, 5, v5);
    if (bindLen > 6)
        checkBindingNoChanges(view, nodeDef, 6, v6);
    if (bindLen > 7)
        checkBindingNoChanges(view, nodeDef, 7, v7);
    if (bindLen > 8)
        checkBindingNoChanges(view, nodeDef, 8, v8);
    if (bindLen > 9)
        checkBindingNoChanges(view, nodeDef, 9, v9);
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} values
 * @return {?}
 */
function checkNoChangesNodeDynamic(view, nodeDef, values) {
    for (let i = 0; i < values.length; i++) {
        checkBindingNoChanges(view, nodeDef, i, values[i]);
    }
}
/**
 * Workaround https://github.com/angular/tsickle/issues/497
 * @suppress {misplacedTypeAnnotation}
 * @param {?} view
 * @param {?} nodeDef
 * @return {?}
 */
function checkNoChangesQuery(view, nodeDef) {
    /** @type {?} */
    const queryList = asQueryList(view, nodeDef.nodeIndex);
    if (queryList.dirty) {
        throw expressionChangedAfterItHasBeenCheckedError(Services.createDebugContext(view, nodeDef.nodeIndex), `Query ${(/** @type {?} */ ((nodeDef.query))).id} not dirty`, `Query ${(/** @type {?} */ ((nodeDef.query))).id} dirty`, (view.state & 1 /* BeforeFirstCheck */) !== 0);
    }
}
/**
 * @param {?} view
 * @return {?}
 */
export function destroyView(view) {
    if (view.state & 128 /* Destroyed */) {
        return;
    }
    execEmbeddedViewsAction(view, ViewAction.Destroy);
    execComponentViewsAction(view, ViewAction.Destroy);
    callLifecycleHooksChildrenFirst(view, 131072 /* OnDestroy */);
    if (view.disposables) {
        for (let i = 0; i < view.disposables.length; i++) {
            view.disposables[i]();
        }
    }
    detachProjectedView(view);
    if (view.renderer.destroyNode) {
        destroyViewNodes(view);
    }
    if (isComponentView(view)) {
        view.renderer.destroy();
    }
    view.state |= 128 /* Destroyed */;
}
/**
 * @param {?} view
 * @return {?}
 */
function destroyViewNodes(view) {
    /** @type {?} */
    const len = view.def.nodes.length;
    for (let i = 0; i < len; i++) {
        /** @type {?} */
        const def = view.def.nodes[i];
        if (def.flags & 1 /* TypeElement */) {
            /** @type {?} */ ((view.renderer.destroyNode))(asElementData(view, i).renderElement);
        }
        else if (def.flags & 2 /* TypeText */) {
            /** @type {?} */ ((view.renderer.destroyNode))(asTextData(view, i).renderText);
        }
        else if (def.flags & 67108864 /* TypeContentQuery */ || def.flags & 134217728 /* TypeViewQuery */) {
            asQueryList(view, i).destroy();
        }
    }
}
/** @enum {number} */
var ViewAction = {
    CreateViewNodes: 0,
    CheckNoChanges: 1,
    CheckNoChangesProjectedViews: 2,
    CheckAndUpdate: 3,
    CheckAndUpdateProjectedViews: 4,
    Destroy: 5,
};
ViewAction[ViewAction.CreateViewNodes] = 'CreateViewNodes';
ViewAction[ViewAction.CheckNoChanges] = 'CheckNoChanges';
ViewAction[ViewAction.CheckNoChangesProjectedViews] = 'CheckNoChangesProjectedViews';
ViewAction[ViewAction.CheckAndUpdate] = 'CheckAndUpdate';
ViewAction[ViewAction.CheckAndUpdateProjectedViews] = 'CheckAndUpdateProjectedViews';
ViewAction[ViewAction.Destroy] = 'Destroy';
/**
 * @param {?} view
 * @param {?} action
 * @return {?}
 */
function execComponentViewsAction(view, action) {
    /** @type {?} */
    const def = view.def;
    if (!(def.nodeFlags & 33554432 /* ComponentView */)) {
        return;
    }
    for (let i = 0; i < def.nodes.length; i++) {
        /** @type {?} */
        const nodeDef = def.nodes[i];
        if (nodeDef.flags & 33554432 /* ComponentView */) {
            // a leaf
            callViewAction(asElementData(view, i).componentView, action);
        }
        else if ((nodeDef.childFlags & 33554432 /* ComponentView */) === 0) {
            // a parent with leafs
            // no child is a component,
            // then skip the children
            i += nodeDef.childCount;
        }
    }
}
/**
 * @param {?} view
 * @param {?} action
 * @return {?}
 */
function execEmbeddedViewsAction(view, action) {
    /** @type {?} */
    const def = view.def;
    if (!(def.nodeFlags & 16777216 /* EmbeddedViews */)) {
        return;
    }
    for (let i = 0; i < def.nodes.length; i++) {
        /** @type {?} */
        const nodeDef = def.nodes[i];
        if (nodeDef.flags & 16777216 /* EmbeddedViews */) {
            /** @type {?} */
            const embeddedViews = /** @type {?} */ ((asElementData(view, i).viewContainer))._embeddedViews;
            for (let k = 0; k < embeddedViews.length; k++) {
                callViewAction(embeddedViews[k], action);
            }
        }
        else if ((nodeDef.childFlags & 16777216 /* EmbeddedViews */) === 0) {
            // a parent with leafs
            // no child is a component,
            // then skip the children
            i += nodeDef.childCount;
        }
    }
}
/**
 * @param {?} view
 * @param {?} action
 * @return {?}
 */
function callViewAction(view, action) {
    /** @type {?} */
    const viewState = view.state;
    switch (action) {
        case ViewAction.CheckNoChanges:
            if ((viewState & 128 /* Destroyed */) === 0) {
                if ((viewState & 12 /* CatDetectChanges */) === 12 /* CatDetectChanges */) {
                    checkNoChangesView(view);
                }
                else if (viewState & 64 /* CheckProjectedViews */) {
                    execProjectedViewsAction(view, ViewAction.CheckNoChangesProjectedViews);
                }
            }
            break;
        case ViewAction.CheckNoChangesProjectedViews:
            if ((viewState & 128 /* Destroyed */) === 0) {
                if (viewState & 32 /* CheckProjectedView */) {
                    checkNoChangesView(view);
                }
                else if (viewState & 64 /* CheckProjectedViews */) {
                    execProjectedViewsAction(view, action);
                }
            }
            break;
        case ViewAction.CheckAndUpdate:
            if ((viewState & 128 /* Destroyed */) === 0) {
                if ((viewState & 12 /* CatDetectChanges */) === 12 /* CatDetectChanges */) {
                    checkAndUpdateView(view);
                }
                else if (viewState & 64 /* CheckProjectedViews */) {
                    execProjectedViewsAction(view, ViewAction.CheckAndUpdateProjectedViews);
                }
            }
            break;
        case ViewAction.CheckAndUpdateProjectedViews:
            if ((viewState & 128 /* Destroyed */) === 0) {
                if (viewState & 32 /* CheckProjectedView */) {
                    checkAndUpdateView(view);
                }
                else if (viewState & 64 /* CheckProjectedViews */) {
                    execProjectedViewsAction(view, action);
                }
            }
            break;
        case ViewAction.Destroy:
            // Note: destroyView recurses over all views,
            // so we don't need to special case projected views here.
            destroyView(view);
            break;
        case ViewAction.CreateViewNodes:
            createViewNodes(view);
            break;
    }
}
/**
 * @param {?} view
 * @param {?} action
 * @return {?}
 */
function execProjectedViewsAction(view, action) {
    execEmbeddedViewsAction(view, action);
    execComponentViewsAction(view, action);
}
/**
 * @param {?} view
 * @param {?} queryFlags
 * @param {?} staticDynamicQueryFlag
 * @param {?} checkType
 * @return {?}
 */
function execQueriesAction(view, queryFlags, staticDynamicQueryFlag, checkType) {
    if (!(view.def.nodeFlags & queryFlags) || !(view.def.nodeFlags & staticDynamicQueryFlag)) {
        return;
    }
    /** @type {?} */
    const nodeCount = view.def.nodes.length;
    for (let i = 0; i < nodeCount; i++) {
        /** @type {?} */
        const nodeDef = view.def.nodes[i];
        if ((nodeDef.flags & queryFlags) && (nodeDef.flags & staticDynamicQueryFlag)) {
            Services.setCurrentNode(view, nodeDef.nodeIndex);
            switch (checkType) {
                case 0 /* CheckAndUpdate */:
                    checkAndUpdateQuery(view, nodeDef);
                    break;
                case 1 /* CheckNoChanges */:
                    checkNoChangesQuery(view, nodeDef);
                    break;
            }
        }
        if (!(nodeDef.childFlags & queryFlags) || !(nodeDef.childFlags & staticDynamicQueryFlag)) {
            // no child has a matching query
            // then skip the children
            i += nodeDef.childCount;
        }
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBQyw0QkFBNEIsRUFBRSwyQkFBMkIsRUFBRSxhQUFhLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDM0gsT0FBTyxFQUFDLDJDQUEyQyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLCtCQUErQixFQUFFLDhCQUE4QixFQUFFLDZCQUE2QixFQUFFLHVCQUF1QixFQUFFLGtCQUFrQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQy9MLE9BQU8sRUFBQyxtQ0FBbUMsRUFBRSxrQ0FBa0MsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hJLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDekQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLHVCQUF1QixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ25FLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSx3QkFBd0IsRUFBRSxVQUFVLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDdkYsT0FBTyxFQUE2RixRQUFRLEVBQW1GLGFBQWEsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUN0USxPQUFPLEVBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFLGVBQWUsRUFBRSxxQ0FBcUMsRUFBRSxpQkFBaUIsRUFBRSxRQUFRLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDeEksT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7OztBQUVsRCxNQUFNLFVBQVUsT0FB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LGNBQWMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pELFFBQVEsU0FBUyxFQUFFO2dCQUNqQjtvQkFDRSxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ25DLE1BQU07Z0JBQ1I7b0JBQ0UsbUJBQW1CLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUNuQyxNQUFNO2FBQ1Q7U0FDRjtRQUNELElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsc0JBQXNCLENBQUMsRUFBRTs7O1lBR3hGLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDO1NBQ3pCO0tBQ0Y7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZW5kZXJlcjJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuXG5pbXBvcnQge2NoZWNrQW5kVXBkYXRlRWxlbWVudER5bmFtaWMsIGNoZWNrQW5kVXBkYXRlRWxlbWVudElubGluZSwgY3JlYXRlRWxlbWVudCwgbGlzdGVuVG9FbGVtZW50T3V0cHV0c30gZnJvbSAnLi9lbGVtZW50JztcbmltcG9ydCB7ZXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHthcHBlbmROZ0NvbnRlbnR9IGZyb20gJy4vbmdfY29udGVudCc7XG5pbXBvcnQge2NhbGxMaWZlY3ljbGVIb29rc0NoaWxkcmVuRmlyc3QsIGNoZWNrQW5kVXBkYXRlRGlyZWN0aXZlRHluYW1pYywgY2hlY2tBbmRVcGRhdGVEaXJlY3RpdmVJbmxpbmUsIGNyZWF0ZURpcmVjdGl2ZUluc3RhbmNlLCBjcmVhdGVQaXBlSW5zdGFuY2UsIGNyZWF0ZVByb3ZpZGVySW5zdGFuY2V9IGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IHtjaGVja0FuZFVwZGF0ZVB1cmVFeHByZXNzaW9uRHluYW1pYywgY2hlY2tBbmRVcGRhdGVQdXJlRXhwcmVzc2lvbklubGluZSwgY3JlYXRlUHVyZUV4cHJlc3Npb259IGZyb20gJy4vcHVyZV9leHByZXNzaW9uJztcbmltcG9ydCB7Y2hlY2tBbmRVcGRhdGVRdWVyeSwgY3JlYXRlUXVlcnl9IGZyb20gJy4vcXVlcnknO1xuaW1wb3J0IHtjcmVhdGVUZW1wbGF0ZURhdGEsIGNyZWF0ZVZpZXdDb250YWluZXJEYXRhfSBmcm9tICcuL3JlZnMnO1xuaW1wb3J0IHtjaGVja0FuZFVwZGF0ZVRleHREeW5hbWljLCBjaGVja0FuZFVwZGF0ZVRleHRJbmxpbmUsIGNyZWF0ZVRleHR9IGZyb20gJy4vdGV4dCc7XG5pbXBvcnQge0FyZ3VtZW50VHlwZSwgQ2hlY2tUeXBlLCBFbGVtZW50RGF0YSwgTm9kZURhdGEsIE5vZGVEZWYsIE5vZGVGbGFncywgUHJvdmlkZXJEYXRhLCBSb290RGF0YSwgU2VydmljZXMsIFZpZXdEYXRhLCBWaWV3RGVmaW5pdGlvbiwgVmlld0ZsYWdzLCBWaWV3SGFuZGxlRXZlbnRGbiwgVmlld1N0YXRlLCBWaWV3VXBkYXRlRm4sIGFzRWxlbWVudERhdGEsIGFzUXVlcnlMaXN0LCBhc1RleHREYXRhLCBzaGlmdEluaXRTdGF0ZX0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge05PT1AsIGNoZWNrQmluZGluZ05vQ2hhbmdlcywgaXNDb21wb25lbnRWaWV3LCBtYXJrUGFyZW50Vmlld3NGb3JDaGVja1Byb2plY3RlZFZpZXdzLCByZXNvbHZlRGVmaW5pdGlvbiwgdG9rZW5LZXl9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge2RldGFjaFByb2plY3RlZFZpZXd9IGZyb20gJy4vdmlld19hdHRhY2gnO1xuXG5leHBvcnQgZnVuY3Rpb24gdmlld0RlZihcbiAgICBmbGFnczogVmlld0ZsYWdzLCBub2RlczogTm9kZURlZltdLCB1cGRhdGVEaXJlY3RpdmVzPzogbnVsbCB8IFZpZXdVcGRhdGVGbixcbiAgICB1cGRhdGVSZW5kZXJlcj86IG51bGwgfCBWaWV3VXBkYXRlRm4pOiBWaWV3RGVmaW5pdGlvbiB7XG4gIC8vIGNsb25lIG5vZGVzIGFuZCBzZXQgYXV0byBjYWxjdWxhdGVkIHZhbHVlc1xuICBsZXQgdmlld0JpbmRpbmdDb3VudCA9IDA7XG4gIGxldCB2aWV3RGlzcG9zYWJsZUNvdW50ID0gMDtcbiAgbGV0IHZpZXdOb2RlRmxhZ3MgPSAwO1xuICBsZXQgdmlld1Jvb3ROb2RlRmxhZ3MgPSAwO1xuICBsZXQgdmlld01hdGNoZWRRdWVyaWVzID0gMDtcbiAgbGV0IGN1cnJlbnRQYXJlbnQ6IE5vZGVEZWZ8bnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50UmVuZGVyUGFyZW50OiBOb2RlRGVmfG51bGwgPSBudWxsO1xuICBsZXQgY3VycmVudEVsZW1lbnRIYXNQdWJsaWNQcm92aWRlcnMgPSBmYWxzZTtcbiAgbGV0IGN1cnJlbnRFbGVtZW50SGFzUHJpdmF0ZVByb3ZpZGVycyA9IGZhbHNlO1xuICBsZXQgbGFzdFJlbmRlclJvb3ROb2RlOiBOb2RlRGVmfG51bGwgPSBudWxsO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgIG5vZGUubm9kZUluZGV4ID0gaTtcbiAgICBub2RlLnBhcmVudCA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgbm9kZS5iaW5kaW5nSW5kZXggPSB2aWV3QmluZGluZ0NvdW50O1xuICAgIG5vZGUub3V0cHV0SW5kZXggPSB2aWV3RGlzcG9zYWJsZUNvdW50O1xuICAgIG5vZGUucmVuZGVyUGFyZW50ID0gY3VycmVudFJlbmRlclBhcmVudDtcblxuICAgIHZpZXdOb2RlRmxhZ3MgfD0gbm9kZS5mbGFncztcbiAgICB2aWV3TWF0Y2hlZFF1ZXJpZXMgfD0gbm9kZS5tYXRjaGVkUXVlcnlJZHM7XG5cbiAgICBpZiAobm9kZS5lbGVtZW50KSB7XG4gICAgICBjb25zdCBlbERlZiA9IG5vZGUuZWxlbWVudDtcbiAgICAgIGVsRGVmLnB1YmxpY1Byb3ZpZGVycyA9XG4gICAgICAgICAgY3VycmVudFBhcmVudCA/IGN1cnJlbnRQYXJlbnQuZWxlbWVudCAhLnB1YmxpY1Byb3ZpZGVycyA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICBlbERlZi5hbGxQcm92aWRlcnMgPSBlbERlZi5wdWJsaWNQcm92aWRlcnM7XG4gICAgICAvLyBOb3RlOiBXZSBhc3N1bWUgdGhhdCBhbGwgcHJvdmlkZXJzIG9mIGFuIGVsZW1lbnQgYXJlIGJlZm9yZSBhbnkgY2hpbGQgZWxlbWVudCFcbiAgICAgIGN1cnJlbnRFbGVtZW50SGFzUHVibGljUHJvdmlkZXJzID0gZmFsc2U7XG4gICAgICBjdXJyZW50RWxlbWVudEhhc1ByaXZhdGVQcm92aWRlcnMgPSBmYWxzZTtcblxuICAgICAgaWYgKG5vZGUuZWxlbWVudC50ZW1wbGF0ZSkge1xuICAgICAgICB2aWV3TWF0Y2hlZFF1ZXJpZXMgfD0gbm9kZS5lbGVtZW50LnRlbXBsYXRlLm5vZGVNYXRjaGVkUXVlcmllcztcbiAgICAgIH1cbiAgICB9XG4gICAgdmFsaWRhdGVOb2RlKGN1cnJlbnRQYXJlbnQsIG5vZGUsIG5vZGVzLmxlbmd0aCk7XG5cblxuICAgIHZpZXdCaW5kaW5nQ291bnQgKz0gbm9kZS5iaW5kaW5ncy5sZW5ndGg7XG4gICAgdmlld0Rpc3Bvc2FibGVDb3VudCArPSBub2RlLm91dHB1dHMubGVuZ3RoO1xuXG4gICAgaWYgKCFjdXJyZW50UmVuZGVyUGFyZW50ICYmIChub2RlLmZsYWdzICYgTm9kZUZsYWdzLkNhdFJlbmRlck5vZGUpKSB7XG4gICAgICBsYXN0UmVuZGVyUm9vdE5vZGUgPSBub2RlO1xuICAgIH1cblxuICAgIGlmIChub2RlLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyKSB7XG4gICAgICBpZiAoIWN1cnJlbnRFbGVtZW50SGFzUHVibGljUHJvdmlkZXJzKSB7XG4gICAgICAgIGN1cnJlbnRFbGVtZW50SGFzUHVibGljUHJvdmlkZXJzID0gdHJ1ZTtcbiAgICAgICAgLy8gVXNlIHByb3RvdHlwaWNhbCBpbmhlcml0YW5jZSB0byBub3QgZ2V0IE8obl4yKSBjb21wbGV4aXR5Li4uXG4gICAgICAgIGN1cnJlbnRQYXJlbnQgIS5lbGVtZW50ICEucHVibGljUHJvdmlkZXJzID1cbiAgICAgICAgICAgIE9iamVjdC5jcmVhdGUoY3VycmVudFBhcmVudCAhLmVsZW1lbnQgIS5wdWJsaWNQcm92aWRlcnMpO1xuICAgICAgICBjdXJyZW50UGFyZW50ICEuZWxlbWVudCAhLmFsbFByb3ZpZGVycyA9IGN1cnJlbnRQYXJlbnQgIS5lbGVtZW50ICEucHVibGljUHJvdmlkZXJzO1xuICAgICAgfVxuICAgICAgY29uc3QgaXNQcml2YXRlU2VydmljZSA9IChub2RlLmZsYWdzICYgTm9kZUZsYWdzLlByaXZhdGVQcm92aWRlcikgIT09IDA7XG4gICAgICBjb25zdCBpc0NvbXBvbmVudCA9IChub2RlLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudCkgIT09IDA7XG4gICAgICBpZiAoIWlzUHJpdmF0ZVNlcnZpY2UgfHwgaXNDb21wb25lbnQpIHtcbiAgICAgICAgY3VycmVudFBhcmVudCAhLmVsZW1lbnQgIS5wdWJsaWNQcm92aWRlcnMgIVt0b2tlbktleShub2RlLnByb3ZpZGVyICEudG9rZW4pXSA9IG5vZGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWN1cnJlbnRFbGVtZW50SGFzUHJpdmF0ZVByb3ZpZGVycykge1xuICAgICAgICAgIGN1cnJlbnRFbGVtZW50SGFzUHJpdmF0ZVByb3ZpZGVycyA9IHRydWU7XG4gICAgICAgICAgLy8gVXNlIHByb3RvdHlwaWNhbCBpbmhlcml0YW5jZSB0byBub3QgZ2V0IE8obl4yKSBjb21wbGV4aXR5Li4uXG4gICAgICAgICAgY3VycmVudFBhcmVudCAhLmVsZW1lbnQgIS5hbGxQcm92aWRlcnMgPVxuICAgICAgICAgICAgICBPYmplY3QuY3JlYXRlKGN1cnJlbnRQYXJlbnQgIS5lbGVtZW50ICEucHVibGljUHJvdmlkZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50UGFyZW50ICEuZWxlbWVudCAhLmFsbFByb3ZpZGVycyAhW3Rva2VuS2V5KG5vZGUucHJvdmlkZXIgIS50b2tlbildID0gbm9kZTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0NvbXBvbmVudCkge1xuICAgICAgICBjdXJyZW50UGFyZW50ICEuZWxlbWVudCAhLmNvbXBvbmVudFByb3ZpZGVyID0gbm9kZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFBhcmVudCkge1xuICAgICAgY3VycmVudFBhcmVudC5jaGlsZEZsYWdzIHw9IG5vZGUuZmxhZ3M7XG4gICAgICBjdXJyZW50UGFyZW50LmRpcmVjdENoaWxkRmxhZ3MgfD0gbm9kZS5mbGFncztcbiAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRNYXRjaGVkUXVlcmllcyB8PSBub2RlLm1hdGNoZWRRdWVyeUlkcztcbiAgICAgIGlmIChub2RlLmVsZW1lbnQgJiYgbm9kZS5lbGVtZW50LnRlbXBsYXRlKSB7XG4gICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRNYXRjaGVkUXVlcmllcyB8PSBub2RlLmVsZW1lbnQudGVtcGxhdGUubm9kZU1hdGNoZWRRdWVyaWVzO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2aWV3Um9vdE5vZGVGbGFncyB8PSBub2RlLmZsYWdzO1xuICAgIH1cblxuICAgIGlmIChub2RlLmNoaWxkQ291bnQgPiAwKSB7XG4gICAgICBjdXJyZW50UGFyZW50ID0gbm9kZTtcblxuICAgICAgaWYgKCFpc05nQ29udGFpbmVyKG5vZGUpKSB7XG4gICAgICAgIGN1cnJlbnRSZW5kZXJQYXJlbnQgPSBub2RlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSBjdXJyZW50IG5vZGUgaGFzIG5vIGNoaWxkcmVuLCBjaGVjayBpZiBpdCBpcyB0aGUgbGFzdCBjaGlsZHJlbiBvZiBpdHMgcGFyZW50LlxuICAgICAgLy8gV2hlbiBpdCBpcywgcHJvcGFnYXRlIHRoZSBmbGFncyB1cC5cbiAgICAgIC8vIFRoZSBsb29wIGlzIHJlcXVpcmVkIGJlY2F1c2UgYW4gZWxlbWVudCBjb3VsZCBiZSB0aGUgbGFzdCB0cmFuc2l0aXZlIGNoaWxkcmVuIG9mIHNldmVyYWxcbiAgICAgIC8vIGVsZW1lbnRzLiBXZSBsb29wIHRvIGVpdGhlciB0aGUgcm9vdCBvciB0aGUgaGlnaGVzdCBvcGVuZWQgZWxlbWVudCAoPSB3aXRoIHJlbWFpbmluZ1xuICAgICAgLy8gY2hpbGRyZW4pXG4gICAgICB3aGlsZSAoY3VycmVudFBhcmVudCAmJiBpID09PSBjdXJyZW50UGFyZW50Lm5vZGVJbmRleCArIGN1cnJlbnRQYXJlbnQuY2hpbGRDb3VudCkge1xuICAgICAgICBjb25zdCBuZXdQYXJlbnQ6IE5vZGVEZWZ8bnVsbCA9IGN1cnJlbnRQYXJlbnQucGFyZW50O1xuICAgICAgICBpZiAobmV3UGFyZW50KSB7XG4gICAgICAgICAgbmV3UGFyZW50LmNoaWxkRmxhZ3MgfD0gY3VycmVudFBhcmVudC5jaGlsZEZsYWdzO1xuICAgICAgICAgIG5ld1BhcmVudC5jaGlsZE1hdGNoZWRRdWVyaWVzIHw9IGN1cnJlbnRQYXJlbnQuY2hpbGRNYXRjaGVkUXVlcmllcztcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50UGFyZW50ID0gbmV3UGFyZW50O1xuICAgICAgICAvLyBXZSBhbHNvIG5lZWQgdG8gdXBkYXRlIHRoZSByZW5kZXIgcGFyZW50ICYgYWNjb3VudCBmb3IgbmctY29udGFpbmVyXG4gICAgICAgIGlmIChjdXJyZW50UGFyZW50ICYmIGlzTmdDb250YWluZXIoY3VycmVudFBhcmVudCkpIHtcbiAgICAgICAgICBjdXJyZW50UmVuZGVyUGFyZW50ID0gY3VycmVudFBhcmVudC5yZW5kZXJQYXJlbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudFJlbmRlclBhcmVudCA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBoYW5kbGVFdmVudDogVmlld0hhbmRsZUV2ZW50Rm4gPSAodmlldywgbm9kZUluZGV4LCBldmVudE5hbWUsIGV2ZW50KSA9PlxuICAgICAgbm9kZXNbbm9kZUluZGV4XS5lbGVtZW50ICEuaGFuZGxlRXZlbnQgISh2aWV3LCBldmVudE5hbWUsIGV2ZW50KTtcblxuICByZXR1cm4ge1xuICAgIC8vIFdpbGwgYmUgZmlsbGVkIGxhdGVyLi4uXG4gICAgZmFjdG9yeTogbnVsbCxcbiAgICBub2RlRmxhZ3M6IHZpZXdOb2RlRmxhZ3MsXG4gICAgcm9vdE5vZGVGbGFnczogdmlld1Jvb3ROb2RlRmxhZ3MsXG4gICAgbm9kZU1hdGNoZWRRdWVyaWVzOiB2aWV3TWF0Y2hlZFF1ZXJpZXMsIGZsYWdzLFxuICAgIG5vZGVzOiBub2RlcyxcbiAgICB1cGRhdGVEaXJlY3RpdmVzOiB1cGRhdGVEaXJlY3RpdmVzIHx8IE5PT1AsXG4gICAgdXBkYXRlUmVuZGVyZXI6IHVwZGF0ZVJlbmRlcmVyIHx8IE5PT1AsIGhhbmRsZUV2ZW50LFxuICAgIGJpbmRpbmdDb3VudDogdmlld0JpbmRpbmdDb3VudCxcbiAgICBvdXRwdXRDb3VudDogdmlld0Rpc3Bvc2FibGVDb3VudCwgbGFzdFJlbmRlclJvb3ROb2RlXG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzTmdDb250YWluZXIobm9kZTogTm9kZURlZik6IGJvb2xlYW4ge1xuICByZXR1cm4gKG5vZGUuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpICE9PSAwICYmIG5vZGUuZWxlbWVudCAhLm5hbWUgPT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlTm9kZShwYXJlbnQ6IE5vZGVEZWYgfCBudWxsLCBub2RlOiBOb2RlRGVmLCBub2RlQ291bnQ6IG51bWJlcikge1xuICBjb25zdCB0ZW1wbGF0ZSA9IG5vZGUuZWxlbWVudCAmJiBub2RlLmVsZW1lbnQudGVtcGxhdGU7XG4gIGlmICh0ZW1wbGF0ZSkge1xuICAgIGlmICghdGVtcGxhdGUubGFzdFJlbmRlclJvb3ROb2RlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYElsbGVnYWwgU3RhdGU6IEVtYmVkZGVkIHRlbXBsYXRlcyB3aXRob3V0IG5vZGVzIGFyZSBub3QgYWxsb3dlZCFgKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlLmxhc3RSZW5kZXJSb290Tm9kZSAmJlxuICAgICAgICB0ZW1wbGF0ZS5sYXN0UmVuZGVyUm9vdE5vZGUuZmxhZ3MgJiBOb2RlRmxhZ3MuRW1iZWRkZWRWaWV3cykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBJbGxlZ2FsIFN0YXRlOiBMYXN0IHJvb3Qgbm9kZSBvZiBhIHRlbXBsYXRlIGNhbid0IGhhdmUgZW1iZWRkZWQgdmlld3MsIGF0IGluZGV4ICR7bm9kZS5ub2RlSW5kZXh9IWApO1xuICAgIH1cbiAgfVxuICBpZiAobm9kZS5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlcikge1xuICAgIGNvbnN0IHBhcmVudEZsYWdzID0gcGFyZW50ID8gcGFyZW50LmZsYWdzIDogMDtcbiAgICBpZiAoKHBhcmVudEZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBJbGxlZ2FsIFN0YXRlOiBTdGF0aWNQcm92aWRlci9EaXJlY3RpdmUgbm9kZXMgbmVlZCB0byBiZSBjaGlsZHJlbiBvZiBlbGVtZW50cyBvciBhbmNob3JzLCBhdCBpbmRleCAke25vZGUubm9kZUluZGV4fSFgKTtcbiAgICB9XG4gIH1cbiAgaWYgKG5vZGUucXVlcnkpIHtcbiAgICBpZiAobm9kZS5mbGFncyAmIE5vZGVGbGFncy5UeXBlQ29udGVudFF1ZXJ5ICYmXG4gICAgICAgICghcGFyZW50IHx8IChwYXJlbnQuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZSkgPT09IDApKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYElsbGVnYWwgU3RhdGU6IENvbnRlbnQgUXVlcnkgbm9kZXMgbmVlZCB0byBiZSBjaGlsZHJlbiBvZiBkaXJlY3RpdmVzLCBhdCBpbmRleCAke25vZGUubm9kZUluZGV4fSFgKTtcbiAgICB9XG4gICAgaWYgKG5vZGUuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZVZpZXdRdWVyeSAmJiBwYXJlbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgSWxsZWdhbCBTdGF0ZTogVmlldyBRdWVyeSBub2RlcyBoYXZlIHRvIGJlIHRvcCBsZXZlbCBub2RlcywgYXQgaW5kZXggJHtub2RlLm5vZGVJbmRleH0hYCk7XG4gICAgfVxuICB9XG4gIGlmIChub2RlLmNoaWxkQ291bnQpIHtcbiAgICBjb25zdCBwYXJlbnRFbmQgPSBwYXJlbnQgPyBwYXJlbnQubm9kZUluZGV4ICsgcGFyZW50LmNoaWxkQ291bnQgOiBub2RlQ291bnQgLSAxO1xuICAgIGlmIChub2RlLm5vZGVJbmRleCA8PSBwYXJlbnRFbmQgJiYgbm9kZS5ub2RlSW5kZXggKyBub2RlLmNoaWxkQ291bnQgPiBwYXJlbnRFbmQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgSWxsZWdhbCBTdGF0ZTogY2hpbGRDb3VudCBvZiBub2RlIGxlYWRzIG91dHNpZGUgb2YgcGFyZW50LCBhdCBpbmRleCAke25vZGUubm9kZUluZGV4fSFgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICBwYXJlbnQ6IFZpZXdEYXRhLCBhbmNob3JEZWY6IE5vZGVEZWYsIHZpZXdEZWY6IFZpZXdEZWZpbml0aW9uLCBjb250ZXh0PzogYW55KTogVmlld0RhdGEge1xuICAvLyBlbWJlZGRlZCB2aWV3cyBhcmUgc2VlbiBhcyBzaWJsaW5ncyB0byB0aGUgYW5jaG9yLCBzbyB3ZSBuZWVkXG4gIC8vIHRvIGdldCB0aGUgcGFyZW50IG9mIHRoZSBhbmNob3IgYW5kIHVzZSBpdCBhcyBwYXJlbnRJbmRleC5cbiAgY29uc3QgdmlldyA9IGNyZWF0ZVZpZXcocGFyZW50LnJvb3QsIHBhcmVudC5yZW5kZXJlciwgcGFyZW50LCBhbmNob3JEZWYsIHZpZXdEZWYpO1xuICBpbml0Vmlldyh2aWV3LCBwYXJlbnQuY29tcG9uZW50LCBjb250ZXh0KTtcbiAgY3JlYXRlVmlld05vZGVzKHZpZXcpO1xuICByZXR1cm4gdmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvb3RWaWV3KHJvb3Q6IFJvb3REYXRhLCBkZWY6IFZpZXdEZWZpbml0aW9uLCBjb250ZXh0PzogYW55KTogVmlld0RhdGEge1xuICBjb25zdCB2aWV3ID0gY3JlYXRlVmlldyhyb290LCByb290LnJlbmRlcmVyLCBudWxsLCBudWxsLCBkZWYpO1xuICBpbml0Vmlldyh2aWV3LCBjb250ZXh0LCBjb250ZXh0KTtcbiAgY3JlYXRlVmlld05vZGVzKHZpZXcpO1xuICByZXR1cm4gdmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudFZpZXcoXG4gICAgcGFyZW50VmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIHZpZXdEZWY6IFZpZXdEZWZpbml0aW9uLCBob3N0RWxlbWVudDogYW55KTogVmlld0RhdGEge1xuICBjb25zdCByZW5kZXJlclR5cGUgPSBub2RlRGVmLmVsZW1lbnQgIS5jb21wb25lbnRSZW5kZXJlclR5cGU7XG4gIGxldCBjb21wUmVuZGVyZXI6IFJlbmRlcmVyMjtcbiAgaWYgKCFyZW5kZXJlclR5cGUpIHtcbiAgICBjb21wUmVuZGVyZXIgPSBwYXJlbnRWaWV3LnJvb3QucmVuZGVyZXI7XG4gIH0gZWxzZSB7XG4gICAgY29tcFJlbmRlcmVyID0gcGFyZW50Vmlldy5yb290LnJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihob3N0RWxlbWVudCwgcmVuZGVyZXJUeXBlKTtcbiAgfVxuICByZXR1cm4gY3JlYXRlVmlldyhcbiAgICAgIHBhcmVudFZpZXcucm9vdCwgY29tcFJlbmRlcmVyLCBwYXJlbnRWaWV3LCBub2RlRGVmLmVsZW1lbnQgIS5jb21wb25lbnRQcm92aWRlciwgdmlld0RlZik7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXcoXG4gICAgcm9vdDogUm9vdERhdGEsIHJlbmRlcmVyOiBSZW5kZXJlcjIsIHBhcmVudDogVmlld0RhdGEgfCBudWxsLCBwYXJlbnROb2RlRGVmOiBOb2RlRGVmIHwgbnVsbCxcbiAgICBkZWY6IFZpZXdEZWZpbml0aW9uKTogVmlld0RhdGEge1xuICBjb25zdCBub2RlczogTm9kZURhdGFbXSA9IG5ldyBBcnJheShkZWYubm9kZXMubGVuZ3RoKTtcbiAgY29uc3QgZGlzcG9zYWJsZXMgPSBkZWYub3V0cHV0Q291bnQgPyBuZXcgQXJyYXkoZGVmLm91dHB1dENvdW50KSA6IG51bGw7XG4gIGNvbnN0IHZpZXc6IFZpZXdEYXRhID0ge1xuICAgIGRlZixcbiAgICBwYXJlbnQsXG4gICAgdmlld0NvbnRhaW5lclBhcmVudDogbnVsbCwgcGFyZW50Tm9kZURlZixcbiAgICBjb250ZXh0OiBudWxsLFxuICAgIGNvbXBvbmVudDogbnVsbCwgbm9kZXMsXG4gICAgc3RhdGU6IFZpZXdTdGF0ZS5DYXRJbml0LCByb290LCByZW5kZXJlcixcbiAgICBvbGRWYWx1ZXM6IG5ldyBBcnJheShkZWYuYmluZGluZ0NvdW50KSwgZGlzcG9zYWJsZXMsXG4gICAgaW5pdEluZGV4OiAtMVxuICB9O1xuICByZXR1cm4gdmlldztcbn1cblxuZnVuY3Rpb24gaW5pdFZpZXcodmlldzogVmlld0RhdGEsIGNvbXBvbmVudDogYW55LCBjb250ZXh0OiBhbnkpIHtcbiAgdmlldy5jb21wb25lbnQgPSBjb21wb25lbnQ7XG4gIHZpZXcuY29udGV4dCA9IGNvbnRleHQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdOb2Rlcyh2aWV3OiBWaWV3RGF0YSkge1xuICBsZXQgcmVuZGVySG9zdDogYW55O1xuICBpZiAoaXNDb21wb25lbnRWaWV3KHZpZXcpKSB7XG4gICAgY29uc3QgaG9zdERlZiA9IHZpZXcucGFyZW50Tm9kZURlZjtcbiAgICByZW5kZXJIb3N0ID0gYXNFbGVtZW50RGF0YSh2aWV3LnBhcmVudCAhLCBob3N0RGVmICEucGFyZW50ICEubm9kZUluZGV4KS5yZW5kZXJFbGVtZW50O1xuICB9XG4gIGNvbnN0IGRlZiA9IHZpZXcuZGVmO1xuICBjb25zdCBub2RlcyA9IHZpZXcubm9kZXM7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IGRlZi5ub2Rlc1tpXTtcbiAgICBTZXJ2aWNlcy5zZXRDdXJyZW50Tm9kZSh2aWV3LCBpKTtcbiAgICBsZXQgbm9kZURhdGE6IGFueTtcbiAgICBzd2l0Y2ggKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZXMpIHtcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVFbGVtZW50OlxuICAgICAgICBjb25zdCBlbCA9IGNyZWF0ZUVsZW1lbnQodmlldywgcmVuZGVySG9zdCwgbm9kZURlZikgYXMgYW55O1xuICAgICAgICBsZXQgY29tcG9uZW50VmlldzogVmlld0RhdGEgPSB1bmRlZmluZWQgITtcbiAgICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50Vmlldykge1xuICAgICAgICAgIGNvbnN0IGNvbXBWaWV3RGVmID0gcmVzb2x2ZURlZmluaXRpb24obm9kZURlZi5lbGVtZW50ICEuY29tcG9uZW50VmlldyAhKTtcbiAgICAgICAgICBjb21wb25lbnRWaWV3ID0gU2VydmljZXMuY3JlYXRlQ29tcG9uZW50Vmlldyh2aWV3LCBub2RlRGVmLCBjb21wVmlld0RlZiwgZWwpO1xuICAgICAgICB9XG4gICAgICAgIGxpc3RlblRvRWxlbWVudE91dHB1dHModmlldywgY29tcG9uZW50Vmlldywgbm9kZURlZiwgZWwpO1xuICAgICAgICBub2RlRGF0YSA9IDxFbGVtZW50RGF0YT57XG4gICAgICAgICAgcmVuZGVyRWxlbWVudDogZWwsXG4gICAgICAgICAgY29tcG9uZW50VmlldyxcbiAgICAgICAgICB2aWV3Q29udGFpbmVyOiBudWxsLFxuICAgICAgICAgIHRlbXBsYXRlOiBub2RlRGVmLmVsZW1lbnQgIS50ZW1wbGF0ZSA/IGNyZWF0ZVRlbXBsYXRlRGF0YSh2aWV3LCBub2RlRGVmKSA6IHVuZGVmaW5lZFxuICAgICAgICB9O1xuICAgICAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5FbWJlZGRlZFZpZXdzKSB7XG4gICAgICAgICAgbm9kZURhdGEudmlld0NvbnRhaW5lciA9IGNyZWF0ZVZpZXdDb250YWluZXJEYXRhKHZpZXcsIG5vZGVEZWYsIG5vZGVEYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVUZXh0OlxuICAgICAgICBub2RlRGF0YSA9IGNyZWF0ZVRleHQodmlldywgcmVuZGVySG9zdCwgbm9kZURlZikgYXMgYW55O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVDbGFzc1Byb3ZpZGVyOlxuICAgICAgY2FzZSBOb2RlRmxhZ3MuVHlwZUZhY3RvcnlQcm92aWRlcjpcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVVc2VFeGlzdGluZ1Byb3ZpZGVyOlxuICAgICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVZhbHVlUHJvdmlkZXI6IHtcbiAgICAgICAgbm9kZURhdGEgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKCFub2RlRGF0YSAmJiAhKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuTGF6eVByb3ZpZGVyKSkge1xuICAgICAgICAgIGNvbnN0IGluc3RhbmNlID0gY3JlYXRlUHJvdmlkZXJJbnN0YW5jZSh2aWV3LCBub2RlRGVmKTtcbiAgICAgICAgICBub2RlRGF0YSA9IDxQcm92aWRlckRhdGE+e2luc3RhbmNlfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVQaXBlOiB7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gY3JlYXRlUGlwZUluc3RhbmNlKHZpZXcsIG5vZGVEZWYpO1xuICAgICAgICBub2RlRGF0YSA9IDxQcm92aWRlckRhdGE+e2luc3RhbmNlfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlOiB7XG4gICAgICAgIG5vZGVEYXRhID0gbm9kZXNbaV07XG4gICAgICAgIGlmICghbm9kZURhdGEpIHtcbiAgICAgICAgICBjb25zdCBpbnN0YW5jZSA9IGNyZWF0ZURpcmVjdGl2ZUluc3RhbmNlKHZpZXcsIG5vZGVEZWYpO1xuICAgICAgICAgIG5vZGVEYXRhID0gPFByb3ZpZGVyRGF0YT57aW5zdGFuY2V9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudCkge1xuICAgICAgICAgIGNvbnN0IGNvbXBWaWV3ID0gYXNFbGVtZW50RGF0YSh2aWV3LCBub2RlRGVmLnBhcmVudCAhLm5vZGVJbmRleCkuY29tcG9uZW50VmlldztcbiAgICAgICAgICBpbml0Vmlldyhjb21wVmlldywgbm9kZURhdGEuaW5zdGFuY2UsIG5vZGVEYXRhLmluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVQdXJlQXJyYXk6XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZU9iamVjdDpcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVQdXJlUGlwZTpcbiAgICAgICAgbm9kZURhdGEgPSBjcmVhdGVQdXJlRXhwcmVzc2lvbih2aWV3LCBub2RlRGVmKSBhcyBhbnk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBOb2RlRmxhZ3MuVHlwZUNvbnRlbnRRdWVyeTpcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVWaWV3UXVlcnk6XG4gICAgICAgIG5vZGVEYXRhID0gY3JlYXRlUXVlcnkoKSBhcyBhbnk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBOb2RlRmxhZ3MuVHlwZU5nQ29udGVudDpcbiAgICAgICAgYXBwZW5kTmdDb250ZW50KHZpZXcsIHJlbmRlckhvc3QsIG5vZGVEZWYpO1xuICAgICAgICAvLyBubyBydW50aW1lIGRhdGEgbmVlZGVkIGZvciBOZ0NvbnRlbnQuLi5cbiAgICAgICAgbm9kZURhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBub2Rlc1tpXSA9IG5vZGVEYXRhO1xuICB9XG4gIC8vIENyZWF0ZSB0aGUgVmlld0RhdGEubm9kZXMgb2YgY29tcG9uZW50IHZpZXdzIGFmdGVyIHdlIGNyZWF0ZWQgZXZlcnl0aGluZyBlbHNlLFxuICAvLyBzbyB0aGF0IGUuZy4gbmctY29udGVudCB3b3Jrc1xuICBleGVjQ29tcG9uZW50Vmlld3NBY3Rpb24odmlldywgVmlld0FjdGlvbi5DcmVhdGVWaWV3Tm9kZXMpO1xuXG4gIC8vIGZpbGwgc3RhdGljIGNvbnRlbnQgYW5kIHZpZXcgcXVlcmllc1xuICBleGVjUXVlcmllc0FjdGlvbihcbiAgICAgIHZpZXcsIE5vZGVGbGFncy5UeXBlQ29udGVudFF1ZXJ5IHwgTm9kZUZsYWdzLlR5cGVWaWV3UXVlcnksIE5vZGVGbGFncy5TdGF0aWNRdWVyeSxcbiAgICAgIENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc1ZpZXcodmlldzogVmlld0RhdGEpIHtcbiAgbWFya1Byb2plY3RlZFZpZXdzRm9yQ2hlY2sodmlldyk7XG4gIFNlcnZpY2VzLnVwZGF0ZURpcmVjdGl2ZXModmlldywgQ2hlY2tUeXBlLkNoZWNrTm9DaGFuZ2VzKTtcbiAgZXhlY0VtYmVkZGVkVmlld3NBY3Rpb24odmlldywgVmlld0FjdGlvbi5DaGVja05vQ2hhbmdlcyk7XG4gIFNlcnZpY2VzLnVwZGF0ZVJlbmRlcmVyKHZpZXcsIENoZWNrVHlwZS5DaGVja05vQ2hhbmdlcyk7XG4gIGV4ZWNDb21wb25lbnRWaWV3c0FjdGlvbih2aWV3LCBWaWV3QWN0aW9uLkNoZWNrTm9DaGFuZ2VzKTtcbiAgLy8gTm90ZTogV2UgZG9uJ3QgY2hlY2sgcXVlcmllcyBmb3IgY2hhbmdlcyBhcyB3ZSBkaWRuJ3QgZG8gdGhpcyBpbiB2Mi54LlxuICAvLyBUT0RPKHRib3NjaCk6IGludmVzdGlnYXRlIGlmIHdlIGNhbiBlbmFibGUgdGhlIGNoZWNrIGFnYWluIGluIHY1Lnggd2l0aCBhIG5pY2VyIGVycm9yIG1lc3NhZ2UuXG4gIHZpZXcuc3RhdGUgJj0gfihWaWV3U3RhdGUuQ2hlY2tQcm9qZWN0ZWRWaWV3cyB8IFZpZXdTdGF0ZS5DaGVja1Byb2plY3RlZFZpZXcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVWaWV3KHZpZXc6IFZpZXdEYXRhKSB7XG4gIGlmICh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkJlZm9yZUZpcnN0Q2hlY2spIHtcbiAgICB2aWV3LnN0YXRlICY9IH5WaWV3U3RhdGUuQmVmb3JlRmlyc3RDaGVjaztcbiAgICB2aWV3LnN0YXRlIHw9IFZpZXdTdGF0ZS5GaXJzdENoZWNrO1xuICB9IGVsc2Uge1xuICAgIHZpZXcuc3RhdGUgJj0gflZpZXdTdGF0ZS5GaXJzdENoZWNrO1xuICB9XG4gIHNoaWZ0SW5pdFN0YXRlKHZpZXcsIFZpZXdTdGF0ZS5Jbml0U3RhdGVfQmVmb3JlSW5pdCwgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nT25Jbml0KTtcbiAgbWFya1Byb2plY3RlZFZpZXdzRm9yQ2hlY2sodmlldyk7XG4gIFNlcnZpY2VzLnVwZGF0ZURpcmVjdGl2ZXModmlldywgQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlKTtcbiAgZXhlY0VtYmVkZGVkVmlld3NBY3Rpb24odmlldywgVmlld0FjdGlvbi5DaGVja0FuZFVwZGF0ZSk7XG4gIGV4ZWNRdWVyaWVzQWN0aW9uKFxuICAgICAgdmlldywgTm9kZUZsYWdzLlR5cGVDb250ZW50UXVlcnksIE5vZGVGbGFncy5EeW5hbWljUXVlcnksIENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSk7XG4gIGxldCBjYWxsSW5pdCA9IHNoaWZ0SW5pdFN0YXRlKFxuICAgICAgdmlldywgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nT25Jbml0LCBWaWV3U3RhdGUuSW5pdFN0YXRlX0NhbGxpbmdBZnRlckNvbnRlbnRJbml0KTtcbiAgY2FsbExpZmVjeWNsZUhvb2tzQ2hpbGRyZW5GaXJzdChcbiAgICAgIHZpZXcsIE5vZGVGbGFncy5BZnRlckNvbnRlbnRDaGVja2VkIHwgKGNhbGxJbml0ID8gTm9kZUZsYWdzLkFmdGVyQ29udGVudEluaXQgOiAwKSk7XG5cbiAgU2VydmljZXMudXBkYXRlUmVuZGVyZXIodmlldywgQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlKTtcblxuICBleGVjQ29tcG9uZW50Vmlld3NBY3Rpb24odmlldywgVmlld0FjdGlvbi5DaGVja0FuZFVwZGF0ZSk7XG4gIGV4ZWNRdWVyaWVzQWN0aW9uKFxuICAgICAgdmlldywgTm9kZUZsYWdzLlR5cGVWaWV3UXVlcnksIE5vZGVGbGFncy5EeW5hbWljUXVlcnksIENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSk7XG4gIGNhbGxJbml0ID0gc2hpZnRJbml0U3RhdGUoXG4gICAgICB2aWV3LCBWaWV3U3RhdGUuSW5pdFN0YXRlX0NhbGxpbmdBZnRlckNvbnRlbnRJbml0LCBWaWV3U3RhdGUuSW5pdFN0YXRlX0NhbGxpbmdBZnRlclZpZXdJbml0KTtcbiAgY2FsbExpZmVjeWNsZUhvb2tzQ2hpbGRyZW5GaXJzdChcbiAgICAgIHZpZXcsIE5vZGVGbGFncy5BZnRlclZpZXdDaGVja2VkIHwgKGNhbGxJbml0ID8gTm9kZUZsYWdzLkFmdGVyVmlld0luaXQgOiAwKSk7XG5cbiAgaWYgKHZpZXcuZGVmLmZsYWdzICYgVmlld0ZsYWdzLk9uUHVzaCkge1xuICAgIHZpZXcuc3RhdGUgJj0gflZpZXdTdGF0ZS5DaGVja3NFbmFibGVkO1xuICB9XG4gIHZpZXcuc3RhdGUgJj0gfihWaWV3U3RhdGUuQ2hlY2tQcm9qZWN0ZWRWaWV3cyB8IFZpZXdTdGF0ZS5DaGVja1Byb2plY3RlZFZpZXcpO1xuICBzaGlmdEluaXRTdGF0ZSh2aWV3LCBWaWV3U3RhdGUuSW5pdFN0YXRlX0NhbGxpbmdBZnRlclZpZXdJbml0LCBWaWV3U3RhdGUuSW5pdFN0YXRlX0FmdGVySW5pdCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFVwZGF0ZU5vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIHYwPzogYW55LCB2MT86IGFueSwgdjI/OiBhbnksXG4gICAgdjM/OiBhbnksIHY0PzogYW55LCB2NT86IGFueSwgdjY/OiBhbnksIHY3PzogYW55LCB2OD86IGFueSwgdjk/OiBhbnkpOiBib29sZWFuIHtcbiAgaWYgKGFyZ1N0eWxlID09PSBBcmd1bWVudFR5cGUuSW5saW5lKSB7XG4gICAgcmV0dXJuIGNoZWNrQW5kVXBkYXRlTm9kZUlubGluZSh2aWV3LCBub2RlRGVmLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGNoZWNrQW5kVXBkYXRlTm9kZUR5bmFtaWModmlldywgbm9kZURlZiwgdjApO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hcmtQcm9qZWN0ZWRWaWV3c0ZvckNoZWNrKHZpZXc6IFZpZXdEYXRhKSB7XG4gIGNvbnN0IGRlZiA9IHZpZXcuZGVmO1xuICBpZiAoIShkZWYubm9kZUZsYWdzICYgTm9kZUZsYWdzLlByb2plY3RlZFRlbXBsYXRlKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSBkZWYubm9kZXNbaV07XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuUHJvamVjdGVkVGVtcGxhdGUpIHtcbiAgICAgIGNvbnN0IHByb2plY3RlZFZpZXdzID0gYXNFbGVtZW50RGF0YSh2aWV3LCBpKS50ZW1wbGF0ZS5fcHJvamVjdGVkVmlld3M7XG4gICAgICBpZiAocHJvamVjdGVkVmlld3MpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9qZWN0ZWRWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHByb2plY3RlZFZpZXcgPSBwcm9qZWN0ZWRWaWV3c1tpXTtcbiAgICAgICAgICBwcm9qZWN0ZWRWaWV3LnN0YXRlIHw9IFZpZXdTdGF0ZS5DaGVja1Byb2plY3RlZFZpZXc7XG4gICAgICAgICAgbWFya1BhcmVudFZpZXdzRm9yQ2hlY2tQcm9qZWN0ZWRWaWV3cyhwcm9qZWN0ZWRWaWV3LCB2aWV3KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoKG5vZGVEZWYuY2hpbGRGbGFncyAmIE5vZGVGbGFncy5Qcm9qZWN0ZWRUZW1wbGF0ZSkgPT09IDApIHtcbiAgICAgIC8vIGEgcGFyZW50IHdpdGggbGVhZnNcbiAgICAgIC8vIG5vIGNoaWxkIGlzIGEgY29tcG9uZW50LFxuICAgICAgLy8gdGhlbiBza2lwIHRoZSBjaGlsZHJlblxuICAgICAgaSArPSBub2RlRGVmLmNoaWxkQ291bnQ7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrQW5kVXBkYXRlTm9kZUlubGluZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgdjA/OiBhbnksIHYxPzogYW55LCB2Mj86IGFueSwgdjM/OiBhbnksIHY0PzogYW55LCB2NT86IGFueSxcbiAgICB2Nj86IGFueSwgdjc/OiBhbnksIHY4PzogYW55LCB2OT86IGFueSk6IGJvb2xlYW4ge1xuICBzd2l0Y2ggKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZXMpIHtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlRWxlbWVudDpcbiAgICAgIHJldHVybiBjaGVja0FuZFVwZGF0ZUVsZW1lbnRJbmxpbmUodmlldywgbm9kZURlZiwgdjAsIHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3LCB2OCwgdjkpO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVUZXh0OlxuICAgICAgcmV0dXJuIGNoZWNrQW5kVXBkYXRlVGV4dElubGluZSh2aWV3LCBub2RlRGVmLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZTpcbiAgICAgIHJldHVybiBjaGVja0FuZFVwZGF0ZURpcmVjdGl2ZUlubGluZSh2aWV3LCBub2RlRGVmLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVB1cmVBcnJheTpcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZU9iamVjdDpcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZVBpcGU6XG4gICAgICByZXR1cm4gY2hlY2tBbmRVcGRhdGVQdXJlRXhwcmVzc2lvbklubGluZShcbiAgICAgICAgICB2aWV3LCBub2RlRGVmLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93ICd1bnJlYWNoYWJsZSc7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVOb2RlRHluYW1pYyh2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgdmFsdWVzOiBhbnlbXSk6IGJvb2xlYW4ge1xuICBzd2l0Y2ggKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZXMpIHtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlRWxlbWVudDpcbiAgICAgIHJldHVybiBjaGVja0FuZFVwZGF0ZUVsZW1lbnREeW5hbWljKHZpZXcsIG5vZGVEZWYsIHZhbHVlcyk7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVRleHQ6XG4gICAgICByZXR1cm4gY2hlY2tBbmRVcGRhdGVUZXh0RHluYW1pYyh2aWV3LCBub2RlRGVmLCB2YWx1ZXMpO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmU6XG4gICAgICByZXR1cm4gY2hlY2tBbmRVcGRhdGVEaXJlY3RpdmVEeW5hbWljKHZpZXcsIG5vZGVEZWYsIHZhbHVlcyk7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVB1cmVBcnJheTpcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZU9iamVjdDpcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZVBpcGU6XG4gICAgICByZXR1cm4gY2hlY2tBbmRVcGRhdGVQdXJlRXhwcmVzc2lvbkR5bmFtaWModmlldywgbm9kZURlZiwgdmFsdWVzKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgJ3VucmVhY2hhYmxlJztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCB2MD86IGFueSwgdjE/OiBhbnksIHYyPzogYW55LFxuICAgIHYzPzogYW55LCB2ND86IGFueSwgdjU/OiBhbnksIHY2PzogYW55LCB2Nz86IGFueSwgdjg/OiBhbnksIHY5PzogYW55KTogYW55IHtcbiAgaWYgKGFyZ1N0eWxlID09PSBBcmd1bWVudFR5cGUuSW5saW5lKSB7XG4gICAgY2hlY2tOb0NoYW5nZXNOb2RlSW5saW5lKHZpZXcsIG5vZGVEZWYsIHYwLCB2MSwgdjIsIHYzLCB2NCwgdjUsIHY2LCB2NywgdjgsIHY5KTtcbiAgfSBlbHNlIHtcbiAgICBjaGVja05vQ2hhbmdlc05vZGVEeW5hbWljKHZpZXcsIG5vZGVEZWYsIHYwKTtcbiAgfVxuICAvLyBSZXR1cm5pbmcgZmFsc2UgaXMgb2sgaGVyZSBhcyB3ZSB3b3VsZCBoYXZlIHRocm93biBpbiBjYXNlIG9mIGEgY2hhbmdlLlxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzTm9kZUlubGluZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSxcbiAgICB2NzogYW55LCB2ODogYW55LCB2OTogYW55KTogdm9pZCB7XG4gIGNvbnN0IGJpbmRMZW4gPSBub2RlRGVmLmJpbmRpbmdzLmxlbmd0aDtcbiAgaWYgKGJpbmRMZW4gPiAwKSBjaGVja0JpbmRpbmdOb0NoYW5nZXModmlldywgbm9kZURlZiwgMCwgdjApO1xuICBpZiAoYmluZExlbiA+IDEpIGNoZWNrQmluZGluZ05vQ2hhbmdlcyh2aWV3LCBub2RlRGVmLCAxLCB2MSk7XG4gIGlmIChiaW5kTGVuID4gMikgY2hlY2tCaW5kaW5nTm9DaGFuZ2VzKHZpZXcsIG5vZGVEZWYsIDIsIHYyKTtcbiAgaWYgKGJpbmRMZW4gPiAzKSBjaGVja0JpbmRpbmdOb0NoYW5nZXModmlldywgbm9kZURlZiwgMywgdjMpO1xuICBpZiAoYmluZExlbiA+IDQpIGNoZWNrQmluZGluZ05vQ2hhbmdlcyh2aWV3LCBub2RlRGVmLCA0LCB2NCk7XG4gIGlmIChiaW5kTGVuID4gNSkgY2hlY2tCaW5kaW5nTm9DaGFuZ2VzKHZpZXcsIG5vZGVEZWYsIDUsIHY1KTtcbiAgaWYgKGJpbmRMZW4gPiA2KSBjaGVja0JpbmRpbmdOb0NoYW5nZXModmlldywgbm9kZURlZiwgNiwgdjYpO1xuICBpZiAoYmluZExlbiA+IDcpIGNoZWNrQmluZGluZ05vQ2hhbmdlcyh2aWV3LCBub2RlRGVmLCA3LCB2Nyk7XG4gIGlmIChiaW5kTGVuID4gOCkgY2hlY2tCaW5kaW5nTm9DaGFuZ2VzKHZpZXcsIG5vZGVEZWYsIDgsIHY4KTtcbiAgaWYgKGJpbmRMZW4gPiA5KSBjaGVja0JpbmRpbmdOb0NoYW5nZXModmlldywgbm9kZURlZiwgOSwgdjkpO1xufVxuXG5mdW5jdGlvbiBjaGVja05vQ2hhbmdlc05vZGVEeW5hbWljKHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCB2YWx1ZXM6IGFueVtdKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY2hlY2tCaW5kaW5nTm9DaGFuZ2VzKHZpZXcsIG5vZGVEZWYsIGksIHZhbHVlc1tpXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBXb3JrYXJvdW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3RzaWNrbGUvaXNzdWVzLzQ5N1xuICogQHN1cHByZXNzIHttaXNwbGFjZWRUeXBlQW5ub3RhdGlvbn1cbiAqL1xuZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNRdWVyeSh2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZikge1xuICBjb25zdCBxdWVyeUxpc3QgPSBhc1F1ZXJ5TGlzdCh2aWV3LCBub2RlRGVmLm5vZGVJbmRleCk7XG4gIGlmIChxdWVyeUxpc3QuZGlydHkpIHtcbiAgICB0aHJvdyBleHByZXNzaW9uQ2hhbmdlZEFmdGVySXRIYXNCZWVuQ2hlY2tlZEVycm9yKFxuICAgICAgICBTZXJ2aWNlcy5jcmVhdGVEZWJ1Z0NvbnRleHQodmlldywgbm9kZURlZi5ub2RlSW5kZXgpLFxuICAgICAgICBgUXVlcnkgJHtub2RlRGVmLnF1ZXJ5IS5pZH0gbm90IGRpcnR5YCwgYFF1ZXJ5ICR7bm9kZURlZi5xdWVyeSEuaWR9IGRpcnR5YCxcbiAgICAgICAgKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuQmVmb3JlRmlyc3RDaGVjaykgIT09IDApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICBpZiAodmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5EZXN0cm95ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZXhlY0VtYmVkZGVkVmlld3NBY3Rpb24odmlldywgVmlld0FjdGlvbi5EZXN0cm95KTtcbiAgZXhlY0NvbXBvbmVudFZpZXdzQWN0aW9uKHZpZXcsIFZpZXdBY3Rpb24uRGVzdHJveSk7XG4gIGNhbGxMaWZlY3ljbGVIb29rc0NoaWxkcmVuRmlyc3QodmlldywgTm9kZUZsYWdzLk9uRGVzdHJveSk7XG4gIGlmICh2aWV3LmRpc3Bvc2FibGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3LmRpc3Bvc2FibGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2aWV3LmRpc3Bvc2FibGVzW2ldKCk7XG4gICAgfVxuICB9XG4gIGRldGFjaFByb2plY3RlZFZpZXcodmlldyk7XG4gIGlmICh2aWV3LnJlbmRlcmVyLmRlc3Ryb3lOb2RlKSB7XG4gICAgZGVzdHJveVZpZXdOb2Rlcyh2aWV3KTtcbiAgfVxuICBpZiAoaXNDb21wb25lbnRWaWV3KHZpZXcpKSB7XG4gICAgdmlldy5yZW5kZXJlci5kZXN0cm95KCk7XG4gIH1cbiAgdmlldy5zdGF0ZSB8PSBWaWV3U3RhdGUuRGVzdHJveWVkO1xufVxuXG5mdW5jdGlvbiBkZXN0cm95Vmlld05vZGVzKHZpZXc6IFZpZXdEYXRhKSB7XG4gIGNvbnN0IGxlbiA9IHZpZXcuZGVmLm5vZGVzLmxlbmd0aDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IHZpZXcuZGVmLm5vZGVzW2ldO1xuICAgIGlmIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpIHtcbiAgICAgIHZpZXcucmVuZGVyZXIuZGVzdHJveU5vZGUgIShhc0VsZW1lbnREYXRhKHZpZXcsIGkpLnJlbmRlckVsZW1lbnQpO1xuICAgIH0gZWxzZSBpZiAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVUZXh0KSB7XG4gICAgICB2aWV3LnJlbmRlcmVyLmRlc3Ryb3lOb2RlICEoYXNUZXh0RGF0YSh2aWV3LCBpKS5yZW5kZXJUZXh0KTtcbiAgICB9IGVsc2UgaWYgKGRlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlQ29udGVudFF1ZXJ5IHx8IGRlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlVmlld1F1ZXJ5KSB7XG4gICAgICBhc1F1ZXJ5TGlzdCh2aWV3LCBpKS5kZXN0cm95KCk7XG4gICAgfVxuICB9XG59XG5cbmVudW0gVmlld0FjdGlvbiB7XG4gIENyZWF0ZVZpZXdOb2RlcyxcbiAgQ2hlY2tOb0NoYW5nZXMsXG4gIENoZWNrTm9DaGFuZ2VzUHJvamVjdGVkVmlld3MsXG4gIENoZWNrQW5kVXBkYXRlLFxuICBDaGVja0FuZFVwZGF0ZVByb2plY3RlZFZpZXdzLFxuICBEZXN0cm95XG59XG5cbmZ1bmN0aW9uIGV4ZWNDb21wb25lbnRWaWV3c0FjdGlvbih2aWV3OiBWaWV3RGF0YSwgYWN0aW9uOiBWaWV3QWN0aW9uKSB7XG4gIGNvbnN0IGRlZiA9IHZpZXcuZGVmO1xuICBpZiAoIShkZWYubm9kZUZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudFZpZXcpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IGRlZi5ub2Rlc1tpXTtcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5Db21wb25lbnRWaWV3KSB7XG4gICAgICAvLyBhIGxlYWZcbiAgICAgIGNhbGxWaWV3QWN0aW9uKGFzRWxlbWVudERhdGEodmlldywgaSkuY29tcG9uZW50VmlldywgYWN0aW9uKTtcbiAgICB9IGVsc2UgaWYgKChub2RlRGVmLmNoaWxkRmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50VmlldykgPT09IDApIHtcbiAgICAgIC8vIGEgcGFyZW50IHdpdGggbGVhZnNcbiAgICAgIC8vIG5vIGNoaWxkIGlzIGEgY29tcG9uZW50LFxuICAgICAgLy8gdGhlbiBza2lwIHRoZSBjaGlsZHJlblxuICAgICAgaSArPSBub2RlRGVmLmNoaWxkQ291bnQ7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWNFbWJlZGRlZFZpZXdzQWN0aW9uKHZpZXc6IFZpZXdEYXRhLCBhY3Rpb246IFZpZXdBY3Rpb24pIHtcbiAgY29uc3QgZGVmID0gdmlldy5kZWY7XG4gIGlmICghKGRlZi5ub2RlRmxhZ3MgJiBOb2RlRmxhZ3MuRW1iZWRkZWRWaWV3cykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gZGVmLm5vZGVzW2ldO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkVtYmVkZGVkVmlld3MpIHtcbiAgICAgIC8vIGEgbGVhZlxuICAgICAgY29uc3QgZW1iZWRkZWRWaWV3cyA9IGFzRWxlbWVudERhdGEodmlldywgaSkudmlld0NvbnRhaW5lciAhLl9lbWJlZGRlZFZpZXdzO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBlbWJlZGRlZFZpZXdzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgIGNhbGxWaWV3QWN0aW9uKGVtYmVkZGVkVmlld3Nba10sIGFjdGlvbik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICgobm9kZURlZi5jaGlsZEZsYWdzICYgTm9kZUZsYWdzLkVtYmVkZGVkVmlld3MpID09PSAwKSB7XG4gICAgICAvLyBhIHBhcmVudCB3aXRoIGxlYWZzXG4gICAgICAvLyBubyBjaGlsZCBpcyBhIGNvbXBvbmVudCxcbiAgICAgIC8vIHRoZW4gc2tpcCB0aGUgY2hpbGRyZW5cbiAgICAgIGkgKz0gbm9kZURlZi5jaGlsZENvdW50O1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjYWxsVmlld0FjdGlvbih2aWV3OiBWaWV3RGF0YSwgYWN0aW9uOiBWaWV3QWN0aW9uKSB7XG4gIGNvbnN0IHZpZXdTdGF0ZSA9IHZpZXcuc3RhdGU7XG4gIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgY2FzZSBWaWV3QWN0aW9uLkNoZWNrTm9DaGFuZ2VzOlxuICAgICAgaWYgKCh2aWV3U3RhdGUgJiBWaWV3U3RhdGUuRGVzdHJveWVkKSA9PT0gMCkge1xuICAgICAgICBpZiAoKHZpZXdTdGF0ZSAmIFZpZXdTdGF0ZS5DYXREZXRlY3RDaGFuZ2VzKSA9PT0gVmlld1N0YXRlLkNhdERldGVjdENoYW5nZXMpIHtcbiAgICAgICAgICBjaGVja05vQ2hhbmdlc1ZpZXcodmlldyk7XG4gICAgICAgIH0gZWxzZSBpZiAodmlld1N0YXRlICYgVmlld1N0YXRlLkNoZWNrUHJvamVjdGVkVmlld3MpIHtcbiAgICAgICAgICBleGVjUHJvamVjdGVkVmlld3NBY3Rpb24odmlldywgVmlld0FjdGlvbi5DaGVja05vQ2hhbmdlc1Byb2plY3RlZFZpZXdzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBWaWV3QWN0aW9uLkNoZWNrTm9DaGFuZ2VzUHJvamVjdGVkVmlld3M6XG4gICAgICBpZiAoKHZpZXdTdGF0ZSAmIFZpZXdTdGF0ZS5EZXN0cm95ZWQpID09PSAwKSB7XG4gICAgICAgIGlmICh2aWV3U3RhdGUgJiBWaWV3U3RhdGUuQ2hlY2tQcm9qZWN0ZWRWaWV3KSB7XG4gICAgICAgICAgY2hlY2tOb0NoYW5nZXNWaWV3KHZpZXcpO1xuICAgICAgICB9IGVsc2UgaWYgKHZpZXdTdGF0ZSAmIFZpZXdTdGF0ZS5DaGVja1Byb2plY3RlZFZpZXdzKSB7XG4gICAgICAgICAgZXhlY1Byb2plY3RlZFZpZXdzQWN0aW9uKHZpZXcsIGFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgVmlld0FjdGlvbi5DaGVja0FuZFVwZGF0ZTpcbiAgICAgIGlmICgodmlld1N0YXRlICYgVmlld1N0YXRlLkRlc3Ryb3llZCkgPT09IDApIHtcbiAgICAgICAgaWYgKCh2aWV3U3RhdGUgJiBWaWV3U3RhdGUuQ2F0RGV0ZWN0Q2hhbmdlcykgPT09IFZpZXdTdGF0ZS5DYXREZXRlY3RDaGFuZ2VzKSB7XG4gICAgICAgICAgY2hlY2tBbmRVcGRhdGVWaWV3KHZpZXcpO1xuICAgICAgICB9IGVsc2UgaWYgKHZpZXdTdGF0ZSAmIFZpZXdTdGF0ZS5DaGVja1Byb2plY3RlZFZpZXdzKSB7XG4gICAgICAgICAgZXhlY1Byb2plY3RlZFZpZXdzQWN0aW9uKHZpZXcsIFZpZXdBY3Rpb24uQ2hlY2tBbmRVcGRhdGVQcm9qZWN0ZWRWaWV3cyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgVmlld0FjdGlvbi5DaGVja0FuZFVwZGF0ZVByb2plY3RlZFZpZXdzOlxuICAgICAgaWYgKCh2aWV3U3RhdGUgJiBWaWV3U3RhdGUuRGVzdHJveWVkKSA9PT0gMCkge1xuICAgICAgICBpZiAodmlld1N0YXRlICYgVmlld1N0YXRlLkNoZWNrUHJvamVjdGVkVmlldykge1xuICAgICAgICAgIGNoZWNrQW5kVXBkYXRlVmlldyh2aWV3KTtcbiAgICAgICAgfSBlbHNlIGlmICh2aWV3U3RhdGUgJiBWaWV3U3RhdGUuQ2hlY2tQcm9qZWN0ZWRWaWV3cykge1xuICAgICAgICAgIGV4ZWNQcm9qZWN0ZWRWaWV3c0FjdGlvbih2aWV3LCBhY3Rpb24pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIFZpZXdBY3Rpb24uRGVzdHJveTpcbiAgICAgIC8vIE5vdGU6IGRlc3Ryb3lWaWV3IHJlY3Vyc2VzIG92ZXIgYWxsIHZpZXdzLFxuICAgICAgLy8gc28gd2UgZG9uJ3QgbmVlZCB0byBzcGVjaWFsIGNhc2UgcHJvamVjdGVkIHZpZXdzIGhlcmUuXG4gICAgICBkZXN0cm95Vmlldyh2aWV3KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgVmlld0FjdGlvbi5DcmVhdGVWaWV3Tm9kZXM6XG4gICAgICBjcmVhdGVWaWV3Tm9kZXModmlldyk7XG4gICAgICBicmVhaztcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjUHJvamVjdGVkVmlld3NBY3Rpb24odmlldzogVmlld0RhdGEsIGFjdGlvbjogVmlld0FjdGlvbikge1xuICBleGVjRW1iZWRkZWRWaWV3c0FjdGlvbih2aWV3LCBhY3Rpb24pO1xuICBleGVjQ29tcG9uZW50Vmlld3NBY3Rpb24odmlldywgYWN0aW9uKTtcbn1cblxuZnVuY3Rpb24gZXhlY1F1ZXJpZXNBY3Rpb24oXG4gICAgdmlldzogVmlld0RhdGEsIHF1ZXJ5RmxhZ3M6IE5vZGVGbGFncywgc3RhdGljRHluYW1pY1F1ZXJ5RmxhZzogTm9kZUZsYWdzLFxuICAgIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSB7XG4gIGlmICghKHZpZXcuZGVmLm5vZGVGbGFncyAmIHF1ZXJ5RmxhZ3MpIHx8ICEodmlldy5kZWYubm9kZUZsYWdzICYgc3RhdGljRHluYW1pY1F1ZXJ5RmxhZykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgbm9kZUNvdW50ID0gdmlldy5kZWYubm9kZXMubGVuZ3RoO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVDb3VudDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2ldO1xuICAgIGlmICgobm9kZURlZi5mbGFncyAmIHF1ZXJ5RmxhZ3MpICYmIChub2RlRGVmLmZsYWdzICYgc3RhdGljRHluYW1pY1F1ZXJ5RmxhZykpIHtcbiAgICAgIFNlcnZpY2VzLnNldEN1cnJlbnROb2RlKHZpZXcsIG5vZGVEZWYubm9kZUluZGV4KTtcbiAgICAgIHN3aXRjaCAoY2hlY2tUeXBlKSB7XG4gICAgICAgIGNhc2UgQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlOlxuICAgICAgICAgIGNoZWNrQW5kVXBkYXRlUXVlcnkodmlldywgbm9kZURlZik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ2hlY2tUeXBlLkNoZWNrTm9DaGFuZ2VzOlxuICAgICAgICAgIGNoZWNrTm9DaGFuZ2VzUXVlcnkodmlldywgbm9kZURlZik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghKG5vZGVEZWYuY2hpbGRGbGFncyAmIHF1ZXJ5RmxhZ3MpIHx8ICEobm9kZURlZi5jaGlsZEZsYWdzICYgc3RhdGljRHluYW1pY1F1ZXJ5RmxhZykpIHtcbiAgICAgIC8vIG5vIGNoaWxkIGhhcyBhIG1hdGNoaW5nIHF1ZXJ5XG4gICAgICAvLyB0aGVuIHNraXAgdGhlIGNoaWxkcmVuXG4gICAgICBpICs9IG5vZGVEZWYuY2hpbGRDb3VudDtcbiAgICB9XG4gIH1cbn1cbiJdfQ==