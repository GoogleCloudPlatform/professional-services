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
// unsupported: template constraints.
/**
 * Factory for ViewDefinitions/NgModuleDefinitions.
 * We use a function so we can reexeute it in case an error happens and use the given logger
 * function to log the error from the definition of the node, which is shown in all browser
 * logs.
 * @record
 * @template D
 */
export function DefinitionFactory() { }
/**
 * Function to call console.error at the right source location. This is an indirection
 * via another function as browser will log the location that actually called
 * `console.error`.
 * @record
 */
export function NodeLogger() { }
// unsupported: template constraints.
/**
 * @record
 * @template DF
 */
export function Definition() { }
/** @type {?} */
Definition.prototype.factory;
/**
 * @record
 */
export function NgModuleDefinition() { }
/** @type {?} */
NgModuleDefinition.prototype.providers;
/** @type {?} */
NgModuleDefinition.prototype.providersByKey;
/** @type {?} */
NgModuleDefinition.prototype.modules;
/** @type {?} */
NgModuleDefinition.prototype.isRoot;
/**
 * @record
 */
export function NgModuleDefinitionFactory() { }
/**
 * @record
 */
export function ViewDefinition() { }
/** @type {?} */
ViewDefinition.prototype.flags;
/** @type {?} */
ViewDefinition.prototype.updateDirectives;
/** @type {?} */
ViewDefinition.prototype.updateRenderer;
/** @type {?} */
ViewDefinition.prototype.handleEvent;
/**
 * Order: Depth first.
 * Especially providers are before elements / anchors.
 * @type {?}
 */
ViewDefinition.prototype.nodes;
/**
 * aggregated NodeFlags for all nodes *
 * @type {?}
 */
ViewDefinition.prototype.nodeFlags;
/** @type {?} */
ViewDefinition.prototype.rootNodeFlags;
/** @type {?} */
ViewDefinition.prototype.lastRenderRootNode;
/** @type {?} */
ViewDefinition.prototype.bindingCount;
/** @type {?} */
ViewDefinition.prototype.outputCount;
/**
 * Binary or of all query ids that are matched by one of the nodes.
 * This includes query ids from templates as well.
 * Used as a bloom filter.
 * @type {?}
 */
ViewDefinition.prototype.nodeMatchedQueries;
/**
 * @record
 */
export function ViewDefinitionFactory() { }
/**
 * @record
 */
export function ViewUpdateFn() { }
/**
 * @record
 */
export function NodeCheckFn() { }
/** @enum {number} */
var ArgumentType = {
    Inline: 0, Dynamic: 1,
};
export { ArgumentType };
/**
 * @record
 */
export function ViewHandleEventFn() { }
/** @enum {number} */
var ViewFlags = {
    None: 0,
    OnPush: 2,
};
export { ViewFlags };
/**
 * A node definition in the view.
 *
 * Note: We use one type for all nodes so that loops that loop over all nodes
 * of a ViewDefinition stay monomorphic!
 * @record
 */
export function NodeDef() { }
/** @type {?} */
NodeDef.prototype.flags;
/** @type {?} */
NodeDef.prototype.nodeIndex;
/** @type {?} */
NodeDef.prototype.checkIndex;
/** @type {?} */
NodeDef.prototype.parent;
/** @type {?} */
NodeDef.prototype.renderParent;
/**
 * this is checked against NgContentDef.index to find matched nodes
 * @type {?}
 */
NodeDef.prototype.ngContentIndex;
/**
 * number of transitive children
 * @type {?}
 */
NodeDef.prototype.childCount;
/**
 * aggregated NodeFlags for all transitive children (does not include self) *
 * @type {?}
 */
NodeDef.prototype.childFlags;
/**
 * aggregated NodeFlags for all direct children (does not include self) *
 * @type {?}
 */
NodeDef.prototype.directChildFlags;
/** @type {?} */
NodeDef.prototype.bindingIndex;
/** @type {?} */
NodeDef.prototype.bindings;
/** @type {?} */
NodeDef.prototype.bindingFlags;
/** @type {?} */
NodeDef.prototype.outputIndex;
/** @type {?} */
NodeDef.prototype.outputs;
/**
 * references that the user placed on the element
 * @type {?}
 */
NodeDef.prototype.references;
/**
 * ids and value types of all queries that are matched by this node.
 * @type {?}
 */
NodeDef.prototype.matchedQueries;
/**
 * Binary or of all matched query ids of this node.
 * @type {?}
 */
NodeDef.prototype.matchedQueryIds;
/**
 * Binary or of all query ids that are matched by one of the children.
 * This includes query ids from templates as well.
 * Used as a bloom filter.
 * @type {?}
 */
NodeDef.prototype.childMatchedQueries;
/** @type {?} */
NodeDef.prototype.element;
/** @type {?} */
NodeDef.prototype.provider;
/** @type {?} */
NodeDef.prototype.text;
/** @type {?} */
NodeDef.prototype.query;
/** @type {?} */
NodeDef.prototype.ngContent;
/** @enum {number} */
var NodeFlags = {
    None: 0,
    TypeElement: 1,
    TypeText: 2,
    ProjectedTemplate: 4,
    CatRenderNode: 3,
    TypeNgContent: 8,
    TypePipe: 16,
    TypePureArray: 32,
    TypePureObject: 64,
    TypePurePipe: 128,
    CatPureExpression: 224,
    TypeValueProvider: 256,
    TypeClassProvider: 512,
    TypeFactoryProvider: 1024,
    TypeUseExistingProvider: 2048,
    LazyProvider: 4096,
    PrivateProvider: 8192,
    TypeDirective: 16384,
    Component: 32768,
    CatProviderNoDirective: 3840,
    CatProvider: 20224,
    OnInit: 65536,
    OnDestroy: 131072,
    DoCheck: 262144,
    OnChanges: 524288,
    AfterContentInit: 1048576,
    AfterContentChecked: 2097152,
    AfterViewInit: 4194304,
    AfterViewChecked: 8388608,
    EmbeddedViews: 16777216,
    ComponentView: 33554432,
    TypeContentQuery: 67108864,
    TypeViewQuery: 134217728,
    StaticQuery: 268435456,
    DynamicQuery: 536870912,
    TypeNgModule: 1073741824,
    CatQuery: 201326592,
    // mutually exclusive values...
    Types: 201347067,
};
export { NodeFlags };
/**
 * @record
 */
export function BindingDef() { }
/** @type {?} */
BindingDef.prototype.flags;
/** @type {?} */
BindingDef.prototype.ns;
/** @type {?} */
BindingDef.prototype.name;
/** @type {?} */
BindingDef.prototype.nonMinifiedName;
/** @type {?} */
BindingDef.prototype.securityContext;
/** @type {?} */
BindingDef.prototype.suffix;
/** @enum {number} */
var BindingFlags = {
    TypeElementAttribute: 1,
    TypeElementClass: 2,
    TypeElementStyle: 4,
    TypeProperty: 8,
    SyntheticProperty: 16,
    SyntheticHostProperty: 32,
    CatSyntheticProperty: 48,
    // mutually exclusive values...
    Types: 15,
};
export { BindingFlags };
/**
 * @record
 */
export function OutputDef() { }
/** @type {?} */
OutputDef.prototype.type;
/** @type {?} */
OutputDef.prototype.target;
/** @type {?} */
OutputDef.prototype.eventName;
/** @type {?} */
OutputDef.prototype.propName;
/** @enum {number} */
var OutputType = {
    ElementOutput: 0, DirectiveOutput: 1,
};
export { OutputType };
/** @enum {number} */
var QueryValueType = {
    ElementRef: 0,
    RenderElement: 1,
    TemplateRef: 2,
    ViewContainerRef: 3,
    Provider: 4,
};
export { QueryValueType };
/**
 * @record
 */
export function ElementDef() { }
/** @type {?} */
ElementDef.prototype.name;
/** @type {?} */
ElementDef.prototype.ns;
/**
 * ns, name, value
 * @type {?}
 */
ElementDef.prototype.attrs;
/** @type {?} */
ElementDef.prototype.template;
/** @type {?} */
ElementDef.prototype.componentProvider;
/** @type {?} */
ElementDef.prototype.componentRendererType;
/** @type {?} */
ElementDef.prototype.componentView;
/**
 * visible public providers for DI in the view,
 * as see from this element. This does not include private providers.
 * @type {?}
 */
ElementDef.prototype.publicProviders;
/**
 * same as visiblePublicProviders, but also includes private providers
 * that are located on this element.
 * @type {?}
 */
ElementDef.prototype.allProviders;
/** @type {?} */
ElementDef.prototype.handleEvent;
/**
 * @record
 */
export function ElementHandleEventFn() { }
/**
 * @record
 */
export function ProviderDef() { }
/** @type {?} */
ProviderDef.prototype.token;
/** @type {?} */
ProviderDef.prototype.value;
/** @type {?} */
ProviderDef.prototype.deps;
/**
 * @record
 */
export function NgModuleProviderDef() { }
/** @type {?} */
NgModuleProviderDef.prototype.flags;
/** @type {?} */
NgModuleProviderDef.prototype.index;
/** @type {?} */
NgModuleProviderDef.prototype.token;
/** @type {?} */
NgModuleProviderDef.prototype.value;
/** @type {?} */
NgModuleProviderDef.prototype.deps;
/**
 * @record
 */
export function DepDef() { }
/** @type {?} */
DepDef.prototype.flags;
/** @type {?} */
DepDef.prototype.token;
/** @type {?} */
DepDef.prototype.tokenKey;
/** @enum {number} */
var DepFlags = {
    None: 0,
    SkipSelf: 1,
    Optional: 2,
    Self: 4,
    Value: 8,
};
export { DepFlags };
/**
 * @record
 */
export function TextDef() { }
/** @type {?} */
TextDef.prototype.prefix;
/**
 * @record
 */
export function QueryDef() { }
/** @type {?} */
QueryDef.prototype.id;
/** @type {?} */
QueryDef.prototype.filterId;
/** @type {?} */
QueryDef.prototype.bindings;
/**
 * @record
 */
export function QueryBindingDef() { }
/** @type {?} */
QueryBindingDef.prototype.propName;
/** @type {?} */
QueryBindingDef.prototype.bindingType;
/** @enum {number} */
var QueryBindingType = {
    First: 0, All: 1,
};
export { QueryBindingType };
/**
 * @record
 */
export function NgContentDef() { }
/**
 * this index is checked against NodeDef.ngContentIndex to find the nodes
 * that are matched by this ng-content.
 * Note that a NodeDef with an ng-content can be reprojected, i.e.
 * have a ngContentIndex on its own.
 * @type {?}
 */
NgContentDef.prototype.index;
/**
 * @record
 */
export function NgModuleData() { }
/** @type {?} */
NgModuleData.prototype._def;
/** @type {?} */
NgModuleData.prototype._parent;
/** @type {?} */
NgModuleData.prototype._providers;
/**
 * View instance data.
 * Attention: Adding fields to this is performance sensitive!
 * @record
 */
export function ViewData() { }
/** @type {?} */
ViewData.prototype.def;
/** @type {?} */
ViewData.prototype.root;
/** @type {?} */
ViewData.prototype.renderer;
/** @type {?} */
ViewData.prototype.parentNodeDef;
/** @type {?} */
ViewData.prototype.parent;
/** @type {?} */
ViewData.prototype.viewContainerParent;
/** @type {?} */
ViewData.prototype.component;
/** @type {?} */
ViewData.prototype.context;
/** @type {?} */
ViewData.prototype.nodes;
/** @type {?} */
ViewData.prototype.state;
/** @type {?} */
ViewData.prototype.oldValues;
/** @type {?} */
ViewData.prototype.disposables;
/** @type {?} */
ViewData.prototype.initIndex;
/** @enum {number} */
var ViewState = {
    BeforeFirstCheck: 1,
    FirstCheck: 2,
    Attached: 4,
    ChecksEnabled: 8,
    IsProjectedView: 16,
    CheckProjectedView: 32,
    CheckProjectedViews: 64,
    Destroyed: 128,
    // InitState Uses 3 bits
    InitState_Mask: 1792,
    InitState_BeforeInit: 0,
    InitState_CallingOnInit: 256,
    InitState_CallingAfterContentInit: 512,
    InitState_CallingAfterViewInit: 768,
    InitState_AfterInit: 1024,
    CatDetectChanges: 12,
    CatInit: 13,
};
export { ViewState };
/**
 * @param {?} view
 * @param {?} priorInitState
 * @param {?} newInitState
 * @return {?}
 */
export function shiftInitState(view, priorInitState, newInitState) {
    /** @type {?} */
    const state = view.state;
    /** @type {?} */
    const initState = state & 1792 /* InitState_Mask */;
    if (initState === priorInitState) {
        view.state = (state & ~1792 /* InitState_Mask */) | newInitState;
        view.initIndex = -1;
        return true;
    }
    return initState === newInitState;
}
/**
 * @param {?} view
 * @param {?} initState
 * @param {?} index
 * @return {?}
 */
export function shouldCallLifecycleInitHook(view, initState, index) {
    if ((view.state & 1792 /* InitState_Mask */) === initState && view.initIndex <= index) {
        view.initIndex = index + 1;
        return true;
    }
    return false;
}
/**
 * @record
 */
export function DisposableFn() { }
/**
 * Node instance data.
 *
 * We have a separate type per NodeType to save memory
 * (TextData | ElementData | ProviderData | PureExpressionData | QueryList<any>)
 *
 * To keep our code monomorphic,
 * we prohibit using `NodeData` directly but enforce the use of accessors (`asElementData`, ...).
 * This way, no usage site can get a `NodeData` from view.nodes and then use it for different
 * purposes.
 */
export class NodeData {
}
if (false) {
    /** @type {?} */
    NodeData.prototype.__brand;
}
/**
 * Data for an instantiated NodeType.Text.
 *
 * Attention: Adding fields to this is performance sensitive!
 * @record
 */
export function TextData() { }
/** @type {?} */
TextData.prototype.renderText;
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asTextData(view, index) {
    return /** @type {?} */ (view.nodes[index]);
}
/**
 * Data for an instantiated NodeType.Element.
 *
 * Attention: Adding fields to this is performance sensitive!
 * @record
 */
export function ElementData() { }
/** @type {?} */
ElementData.prototype.renderElement;
/** @type {?} */
ElementData.prototype.componentView;
/** @type {?} */
ElementData.prototype.viewContainer;
/** @type {?} */
ElementData.prototype.template;
/**
 * @record
 */
export function ViewContainerData() { }
/** @type {?} */
ViewContainerData.prototype._embeddedViews;
/**
 * @record
 */
export function TemplateData() { }
/** @type {?} */
TemplateData.prototype._projectedViews;
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asElementData(view, index) {
    return /** @type {?} */ (view.nodes[index]);
}
/**
 * Data for an instantiated NodeType.Provider.
 *
 * Attention: Adding fields to this is performance sensitive!
 * @record
 */
export function ProviderData() { }
/** @type {?} */
ProviderData.prototype.instance;
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asProviderData(view, index) {
    return /** @type {?} */ (view.nodes[index]);
}
/**
 * Data for an instantiated NodeType.PureExpression.
 *
 * Attention: Adding fields to this is performance sensitive!
 * @record
 */
export function PureExpressionData() { }
/** @type {?} */
PureExpressionData.prototype.value;
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asPureExpressionData(view, index) {
    return /** @type {?} */ (view.nodes[index]);
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asQueryList(view, index) {
    return /** @type {?} */ (view.nodes[index]);
}
/**
 * @record
 */
export function RootData() { }
/** @type {?} */
RootData.prototype.injector;
/** @type {?} */
RootData.prototype.ngModule;
/** @type {?} */
RootData.prototype.projectableNodes;
/** @type {?} */
RootData.prototype.selectorOrNode;
/** @type {?} */
RootData.prototype.renderer;
/** @type {?} */
RootData.prototype.rendererFactory;
/** @type {?} */
RootData.prototype.errorHandler;
/** @type {?} */
RootData.prototype.sanitizer;
/**
 * @abstract
 */
export class DebugContext {
}
if (false) {
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.view = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.nodeIndex = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.injector = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.component = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.providerTokens = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.references = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.context = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.componentRenderElement = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.renderNode = function () { };
    /**
     * @abstract
     * @param {?} console
     * @param {...?} values
     * @return {?}
     */
    DebugContext.prototype.logError = function (console, values) { };
}
/** @enum {number} */
var CheckType = {
    CheckAndUpdate: 0, CheckNoChanges: 1,
};
export { CheckType };
/**
 * @record
 */
export function ProviderOverride() { }
/** @type {?} */
ProviderOverride.prototype.token;
/** @type {?} */
ProviderOverride.prototype.flags;
/** @type {?} */
ProviderOverride.prototype.value;
/** @type {?} */
ProviderOverride.prototype.deps;
/** @type {?} */
ProviderOverride.prototype.deprecatedBehavior;
/** *
 * This object is used to prevent cycles in the source files and to have a place where
 * debug mode can hook it. It is lazily filled when `isDevMode` is known.
  @type {?} */
export const Services = {
    setCurrentNode: /** @type {?} */ ((undefined)),
    createRootView: /** @type {?} */ ((undefined)),
    createEmbeddedView: /** @type {?} */ ((undefined)),
    createComponentView: /** @type {?} */ ((undefined)),
    createNgModuleRef: /** @type {?} */ ((undefined)),
    overrideProvider: /** @type {?} */ ((undefined)),
    overrideComponentView: /** @type {?} */ ((undefined)),
    clearOverrides: /** @type {?} */ ((undefined)),
    checkAndUpdateView: /** @type {?} */ ((undefined)),
    checkNoChangesView: /** @type {?} */ ((undefined)),
    destroyView: /** @type {?} */ ((undefined)),
    resolveDep: /** @type {?} */ ((undefined)),
    createDebugContext: /** @type {?} */ ((undefined)),
    handleEvent: /** @type {?} */ ((undefined)),
    updateDirectives: /** @type {?} */ ((undefined)),
    updateRenderer: /** @type {?} */ ((undefined)),
    dirtyParentQueries: /** @type {?} */ ((undefined)),
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3R5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBdUZnQyxTQUFVLEVBQUUsVUFBVzs7Ozs7Ozs7O0lBVXJELE9BQVE7SUFDUixTQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBOERmLE9BQVE7SUFDUixjQUFvQjtJQUNwQixXQUFpQjtJQUNqQixvQkFBMEI7SUFDMUIsZ0JBQXNDO0lBQ3RDLGdCQUFzQjtJQUN0QixZQUFpQjtJQUNqQixpQkFBc0I7SUFDdEIsa0JBQXVCO0lBQ3ZCLGlCQUFxQjtJQUNyQixzQkFBaUU7SUFDakUsc0JBQTBCO0lBQzFCLHNCQUEwQjtJQUMxQix5QkFBNkI7SUFDN0IsNkJBQWlDO0lBQ2pDLGtCQUFzQjtJQUN0QixxQkFBeUI7SUFDekIsb0JBQXVCO0lBQ3ZCLGdCQUFtQjtJQUNuQiw0QkFDeUY7SUFDekYsa0JBQW9EO0lBQ3BELGFBQWdCO0lBQ2hCLGlCQUFtQjtJQUNuQixlQUFpQjtJQUNqQixpQkFBbUI7SUFDbkIseUJBQTBCO0lBQzFCLDRCQUE2QjtJQUM3QixzQkFBdUI7SUFDdkIseUJBQTBCO0lBQzFCLHVCQUF1QjtJQUN2Qix1QkFBdUI7SUFDdkIsMEJBQTBCO0lBQzFCLHdCQUF1QjtJQUN2QixzQkFBcUI7SUFDckIsdUJBQXNCO0lBQ3RCLHdCQUFzQjtJQUN0QixtQkFBMkM7O0lBRzNDLGdCQUE2Rjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBYTdGLHVCQUE2QjtJQUM3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QUFLLENBQUMsRUFBQztDQUMvQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxPQUFnQixZQUFZO0NBV2pDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFNNEIsaUJBQWMsRUFBRSxpQkFBYzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEMzRCxhQUFhLFFBQVEsR0FBYTtJQUNoQyxjQUFjLHFCQUFFLFNBQVMsRUFBRTtJQUMzQixjQUFjLHFCQUFFLFNBQVMsRUFBRTtJQUMzQixrQkFBa0IscUJBQUUsU0FBUyxFQUFFO0lBQy9CLG1CQUFtQixxQkFBRSxTQUFTLEVBQUU7SUFDaEMsaUJBQWlCLHFCQUFFLFNBQVMsRUFBRTtJQUM5QixnQkFBZ0IscUJBQUUsU0FBUyxFQUFFO0lBQzdCLHFCQUFxQixxQkFBRSxTQUFTLEVBQUU7SUFDbEMsY0FBYyxxQkFBRSxTQUFTLEVBQUU7SUFDM0Isa0JBQWtCLHFCQUFFLFNBQVMsRUFBRTtJQUMvQixrQkFBa0IscUJBQUUsU0FBUyxFQUFFO0lBQy9CLFdBQVcscUJBQUUsU0FBUyxFQUFFO0lBQ3hCLFVBQVUscUJBQUUsU0FBUyxFQUFFO0lBQ3ZCLGtCQUFrQixxQkFBRSxTQUFTLEVBQUU7SUFDL0IsV0FBVyxxQkFBRSxTQUFTLEVBQUU7SUFDeEIsZ0JBQWdCLHFCQUFFLFNBQVMsRUFBRTtJQUM3QixjQUFjLHFCQUFFLFNBQVMsRUFBRTtJQUMzQixrQkFBa0IscUJBQUUsU0FBUyxFQUFFO0NBQ2hDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeX0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7TmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyRmFjdG9yeTIsIFJlbmRlcmVyVHlwZTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXIsIFNlY3VyaXR5Q29udGV4dH0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRGVmc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vKipcbiAqIEZhY3RvcnkgZm9yIFZpZXdEZWZpbml0aW9ucy9OZ01vZHVsZURlZmluaXRpb25zLlxuICogV2UgdXNlIGEgZnVuY3Rpb24gc28gd2UgY2FuIHJlZXhldXRlIGl0IGluIGNhc2UgYW4gZXJyb3IgaGFwcGVucyBhbmQgdXNlIHRoZSBnaXZlbiBsb2dnZXJcbiAqIGZ1bmN0aW9uIHRvIGxvZyB0aGUgZXJyb3IgZnJvbSB0aGUgZGVmaW5pdGlvbiBvZiB0aGUgbm9kZSwgd2hpY2ggaXMgc2hvd24gaW4gYWxsIGJyb3dzZXJcbiAqIGxvZ3MuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVmaW5pdGlvbkZhY3Rvcnk8RCBleHRlbmRzIERlZmluaXRpb248YW55Pj4geyAobG9nZ2VyOiBOb2RlTG9nZ2VyKTogRDsgfVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGNhbGwgY29uc29sZS5lcnJvciBhdCB0aGUgcmlnaHQgc291cmNlIGxvY2F0aW9uLiBUaGlzIGlzIGFuIGluZGlyZWN0aW9uXG4gKiB2aWEgYW5vdGhlciBmdW5jdGlvbiBhcyBicm93c2VyIHdpbGwgbG9nIHRoZSBsb2NhdGlvbiB0aGF0IGFjdHVhbGx5IGNhbGxlZFxuICogYGNvbnNvbGUuZXJyb3JgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5vZGVMb2dnZXIgeyAoKTogKCkgPT4gdm9pZDsgfVxuXG5leHBvcnQgaW50ZXJmYWNlIERlZmluaXRpb248REYgZXh0ZW5kcyBEZWZpbml0aW9uRmFjdG9yeTxhbnk+PiB7IGZhY3Rvcnk6IERGfG51bGw7IH1cblxuZXhwb3J0IGludGVyZmFjZSBOZ01vZHVsZURlZmluaXRpb24gZXh0ZW5kcyBEZWZpbml0aW9uPE5nTW9kdWxlRGVmaW5pdGlvbkZhY3Rvcnk+IHtcbiAgcHJvdmlkZXJzOiBOZ01vZHVsZVByb3ZpZGVyRGVmW107XG4gIHByb3ZpZGVyc0J5S2V5OiB7W3Rva2VuS2V5OiBzdHJpbmddOiBOZ01vZHVsZVByb3ZpZGVyRGVmfTtcbiAgbW9kdWxlczogYW55W107XG4gIGlzUm9vdDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOZ01vZHVsZURlZmluaXRpb25GYWN0b3J5IGV4dGVuZHMgRGVmaW5pdGlvbkZhY3Rvcnk8TmdNb2R1bGVEZWZpbml0aW9uPiB7fVxuXG5leHBvcnQgaW50ZXJmYWNlIFZpZXdEZWZpbml0aW9uIGV4dGVuZHMgRGVmaW5pdGlvbjxWaWV3RGVmaW5pdGlvbkZhY3Rvcnk+IHtcbiAgZmxhZ3M6IFZpZXdGbGFncztcbiAgdXBkYXRlRGlyZWN0aXZlczogVmlld1VwZGF0ZUZuO1xuICB1cGRhdGVSZW5kZXJlcjogVmlld1VwZGF0ZUZuO1xuICBoYW5kbGVFdmVudDogVmlld0hhbmRsZUV2ZW50Rm47XG4gIC8qKlxuICAgKiBPcmRlcjogRGVwdGggZmlyc3QuXG4gICAqIEVzcGVjaWFsbHkgcHJvdmlkZXJzIGFyZSBiZWZvcmUgZWxlbWVudHMgLyBhbmNob3JzLlxuICAgKi9cbiAgbm9kZXM6IE5vZGVEZWZbXTtcbiAgLyoqIGFnZ3JlZ2F0ZWQgTm9kZUZsYWdzIGZvciBhbGwgbm9kZXMgKiovXG4gIG5vZGVGbGFnczogTm9kZUZsYWdzO1xuICByb290Tm9kZUZsYWdzOiBOb2RlRmxhZ3M7XG4gIGxhc3RSZW5kZXJSb290Tm9kZTogTm9kZURlZnxudWxsO1xuICBiaW5kaW5nQ291bnQ6IG51bWJlcjtcbiAgb3V0cHV0Q291bnQ6IG51bWJlcjtcbiAgLyoqXG4gICAqIEJpbmFyeSBvciBvZiBhbGwgcXVlcnkgaWRzIHRoYXQgYXJlIG1hdGNoZWQgYnkgb25lIG9mIHRoZSBub2Rlcy5cbiAgICogVGhpcyBpbmNsdWRlcyBxdWVyeSBpZHMgZnJvbSB0ZW1wbGF0ZXMgYXMgd2VsbC5cbiAgICogVXNlZCBhcyBhIGJsb29tIGZpbHRlci5cbiAgICovXG4gIG5vZGVNYXRjaGVkUXVlcmllczogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZpZXdEZWZpbml0aW9uRmFjdG9yeSBleHRlbmRzIERlZmluaXRpb25GYWN0b3J5PFZpZXdEZWZpbml0aW9uPiB7fVxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlld1VwZGF0ZUZuIHsgKGNoZWNrOiBOb2RlQ2hlY2tGbiwgdmlldzogVmlld0RhdGEpOiB2b2lkOyB9XG5cbi8vIGhlbHBlciBmdW5jdGlvbnMgdG8gY3JlYXRlIGFuIG92ZXJsb2FkZWQgZnVuY3Rpb24gdHlwZS5cbmV4cG9ydCBpbnRlcmZhY2UgTm9kZUNoZWNrRm4ge1xuICAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLkR5bmFtaWMsIHZhbHVlczogYW55W10pOiBhbnk7XG5cbiAgKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZS5JbmxpbmUsIHYwPzogYW55LCB2MT86IGFueSwgdjI/OiBhbnksXG4gICB2Mz86IGFueSwgdjQ/OiBhbnksIHY1PzogYW55LCB2Nj86IGFueSwgdjc/OiBhbnksIHY4PzogYW55LCB2OT86IGFueSk6IGFueTtcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQXJndW1lbnRUeXBlIHtJbmxpbmUgPSAwLCBEeW5hbWljID0gMX1cblxuZXhwb3J0IGludGVyZmFjZSBWaWV3SGFuZGxlRXZlbnRGbiB7XG4gICh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIGV2ZW50TmFtZTogc3RyaW5nLCBldmVudDogYW55KTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBCaXRtYXNrIGZvciBWaWV3RGVmaW5pdGlvbi5mbGFncy5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVmlld0ZsYWdzIHtcbiAgTm9uZSA9IDAsXG4gIE9uUHVzaCA9IDEgPDwgMSxcbn1cblxuLyoqXG4gKiBBIG5vZGUgZGVmaW5pdGlvbiBpbiB0aGUgdmlldy5cbiAqXG4gKiBOb3RlOiBXZSB1c2Ugb25lIHR5cGUgZm9yIGFsbCBub2RlcyBzbyB0aGF0IGxvb3BzIHRoYXQgbG9vcCBvdmVyIGFsbCBub2Rlc1xuICogb2YgYSBWaWV3RGVmaW5pdGlvbiBzdGF5IG1vbm9tb3JwaGljIVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5vZGVEZWYge1xuICBmbGFnczogTm9kZUZsYWdzO1xuICAvLyBJbmRleCBvZiB0aGUgbm9kZSBpbiB2aWV3IGRhdGEgYW5kIHZpZXcgZGVmaW5pdGlvbiAodGhvc2UgYXJlIHRoZSBzYW1lKVxuICBub2RlSW5kZXg6IG51bWJlcjtcbiAgLy8gSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGNoZWNrIGZ1bmN0aW9uc1xuICAvLyBEaWZmZXIgZnJvbSBub2RlSW5kZXggd2hlbiBub2RlcyBhcmUgYWRkZWQgb3IgcmVtb3ZlZCBhdCBydW50aW1lIChpZSBhZnRlciBjb21waWxhdGlvbilcbiAgY2hlY2tJbmRleDogbnVtYmVyO1xuICBwYXJlbnQ6IE5vZGVEZWZ8bnVsbDtcbiAgcmVuZGVyUGFyZW50OiBOb2RlRGVmfG51bGw7XG4gIC8qKiB0aGlzIGlzIGNoZWNrZWQgYWdhaW5zdCBOZ0NvbnRlbnREZWYuaW5kZXggdG8gZmluZCBtYXRjaGVkIG5vZGVzICovXG4gIG5nQ29udGVudEluZGV4OiBudW1iZXJ8bnVsbDtcbiAgLyoqIG51bWJlciBvZiB0cmFuc2l0aXZlIGNoaWxkcmVuICovXG4gIGNoaWxkQ291bnQ6IG51bWJlcjtcbiAgLyoqIGFnZ3JlZ2F0ZWQgTm9kZUZsYWdzIGZvciBhbGwgdHJhbnNpdGl2ZSBjaGlsZHJlbiAoZG9lcyBub3QgaW5jbHVkZSBzZWxmKSAqKi9cbiAgY2hpbGRGbGFnczogTm9kZUZsYWdzO1xuICAvKiogYWdncmVnYXRlZCBOb2RlRmxhZ3MgZm9yIGFsbCBkaXJlY3QgY2hpbGRyZW4gKGRvZXMgbm90IGluY2x1ZGUgc2VsZikgKiovXG4gIGRpcmVjdENoaWxkRmxhZ3M6IE5vZGVGbGFncztcblxuICBiaW5kaW5nSW5kZXg6IG51bWJlcjtcbiAgYmluZGluZ3M6IEJpbmRpbmdEZWZbXTtcbiAgYmluZGluZ0ZsYWdzOiBCaW5kaW5nRmxhZ3M7XG4gIG91dHB1dEluZGV4OiBudW1iZXI7XG4gIG91dHB1dHM6IE91dHB1dERlZltdO1xuICAvKipcbiAgICogcmVmZXJlbmNlcyB0aGF0IHRoZSB1c2VyIHBsYWNlZCBvbiB0aGUgZWxlbWVudFxuICAgKi9cbiAgcmVmZXJlbmNlczoge1tyZWZJZDogc3RyaW5nXTogUXVlcnlWYWx1ZVR5cGV9O1xuICAvKipcbiAgICogaWRzIGFuZCB2YWx1ZSB0eXBlcyBvZiBhbGwgcXVlcmllcyB0aGF0IGFyZSBtYXRjaGVkIGJ5IHRoaXMgbm9kZS5cbiAgICovXG4gIG1hdGNoZWRRdWVyaWVzOiB7W3F1ZXJ5SWQ6IG51bWJlcl06IFF1ZXJ5VmFsdWVUeXBlfTtcbiAgLyoqIEJpbmFyeSBvciBvZiBhbGwgbWF0Y2hlZCBxdWVyeSBpZHMgb2YgdGhpcyBub2RlLiAqL1xuICBtYXRjaGVkUXVlcnlJZHM6IG51bWJlcjtcbiAgLyoqXG4gICAqIEJpbmFyeSBvciBvZiBhbGwgcXVlcnkgaWRzIHRoYXQgYXJlIG1hdGNoZWQgYnkgb25lIG9mIHRoZSBjaGlsZHJlbi5cbiAgICogVGhpcyBpbmNsdWRlcyBxdWVyeSBpZHMgZnJvbSB0ZW1wbGF0ZXMgYXMgd2VsbC5cbiAgICogVXNlZCBhcyBhIGJsb29tIGZpbHRlci5cbiAgICovXG4gIGNoaWxkTWF0Y2hlZFF1ZXJpZXM6IG51bWJlcjtcbiAgZWxlbWVudDogRWxlbWVudERlZnxudWxsO1xuICBwcm92aWRlcjogUHJvdmlkZXJEZWZ8bnVsbDtcbiAgdGV4dDogVGV4dERlZnxudWxsO1xuICBxdWVyeTogUXVlcnlEZWZ8bnVsbDtcbiAgbmdDb250ZW50OiBOZ0NvbnRlbnREZWZ8bnVsbDtcbn1cblxuLyoqXG4gKiBCaXRtYXNrIGZvciBOb2RlRGVmLmZsYWdzLlxuICogTmFtaW5nIGNvbnZlbnRpb246XG4gKiAtIGBUeXBlLi4uYDogZmxhZ3MgdGhhdCBhcmUgbXV0dWFsbHkgZXhjbHVzaXZlXG4gKiAtIGBDYXQuLi5gOiB1bmlvbiBvZiBtdWx0aXBsZSBgVHlwZS4uLmAgKHNob3J0IGZvciBjYXRlZ29yeSkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIE5vZGVGbGFncyB7XG4gIE5vbmUgPSAwLFxuICBUeXBlRWxlbWVudCA9IDEgPDwgMCxcbiAgVHlwZVRleHQgPSAxIDw8IDEsXG4gIFByb2plY3RlZFRlbXBsYXRlID0gMSA8PCAyLFxuICBDYXRSZW5kZXJOb2RlID0gVHlwZUVsZW1lbnQgfCBUeXBlVGV4dCxcbiAgVHlwZU5nQ29udGVudCA9IDEgPDwgMyxcbiAgVHlwZVBpcGUgPSAxIDw8IDQsXG4gIFR5cGVQdXJlQXJyYXkgPSAxIDw8IDUsXG4gIFR5cGVQdXJlT2JqZWN0ID0gMSA8PCA2LFxuICBUeXBlUHVyZVBpcGUgPSAxIDw8IDcsXG4gIENhdFB1cmVFeHByZXNzaW9uID0gVHlwZVB1cmVBcnJheSB8IFR5cGVQdXJlT2JqZWN0IHwgVHlwZVB1cmVQaXBlLFxuICBUeXBlVmFsdWVQcm92aWRlciA9IDEgPDwgOCxcbiAgVHlwZUNsYXNzUHJvdmlkZXIgPSAxIDw8IDksXG4gIFR5cGVGYWN0b3J5UHJvdmlkZXIgPSAxIDw8IDEwLFxuICBUeXBlVXNlRXhpc3RpbmdQcm92aWRlciA9IDEgPDwgMTEsXG4gIExhenlQcm92aWRlciA9IDEgPDwgMTIsXG4gIFByaXZhdGVQcm92aWRlciA9IDEgPDwgMTMsXG4gIFR5cGVEaXJlY3RpdmUgPSAxIDw8IDE0LFxuICBDb21wb25lbnQgPSAxIDw8IDE1LFxuICBDYXRQcm92aWRlck5vRGlyZWN0aXZlID1cbiAgICAgIFR5cGVWYWx1ZVByb3ZpZGVyIHwgVHlwZUNsYXNzUHJvdmlkZXIgfCBUeXBlRmFjdG9yeVByb3ZpZGVyIHwgVHlwZVVzZUV4aXN0aW5nUHJvdmlkZXIsXG4gIENhdFByb3ZpZGVyID0gQ2F0UHJvdmlkZXJOb0RpcmVjdGl2ZSB8IFR5cGVEaXJlY3RpdmUsXG4gIE9uSW5pdCA9IDEgPDwgMTYsXG4gIE9uRGVzdHJveSA9IDEgPDwgMTcsXG4gIERvQ2hlY2sgPSAxIDw8IDE4LFxuICBPbkNoYW5nZXMgPSAxIDw8IDE5LFxuICBBZnRlckNvbnRlbnRJbml0ID0gMSA8PCAyMCxcbiAgQWZ0ZXJDb250ZW50Q2hlY2tlZCA9IDEgPDwgMjEsXG4gIEFmdGVyVmlld0luaXQgPSAxIDw8IDIyLFxuICBBZnRlclZpZXdDaGVja2VkID0gMSA8PCAyMyxcbiAgRW1iZWRkZWRWaWV3cyA9IDEgPDwgMjQsXG4gIENvbXBvbmVudFZpZXcgPSAxIDw8IDI1LFxuICBUeXBlQ29udGVudFF1ZXJ5ID0gMSA8PCAyNixcbiAgVHlwZVZpZXdRdWVyeSA9IDEgPDwgMjcsXG4gIFN0YXRpY1F1ZXJ5ID0gMSA8PCAyOCxcbiAgRHluYW1pY1F1ZXJ5ID0gMSA8PCAyOSxcbiAgVHlwZU5nTW9kdWxlID0gMSA8PCAzMCxcbiAgQ2F0UXVlcnkgPSBUeXBlQ29udGVudFF1ZXJ5IHwgVHlwZVZpZXdRdWVyeSxcblxuICAvLyBtdXR1YWxseSBleGNsdXNpdmUgdmFsdWVzLi4uXG4gIFR5cGVzID0gQ2F0UmVuZGVyTm9kZSB8IFR5cGVOZ0NvbnRlbnQgfCBUeXBlUGlwZSB8IENhdFB1cmVFeHByZXNzaW9uIHwgQ2F0UHJvdmlkZXIgfCBDYXRRdWVyeVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJpbmRpbmdEZWYge1xuICBmbGFnczogQmluZGluZ0ZsYWdzO1xuICBuczogc3RyaW5nfG51bGw7XG4gIG5hbWU6IHN0cmluZ3xudWxsO1xuICBub25NaW5pZmllZE5hbWU6IHN0cmluZ3xudWxsO1xuICBzZWN1cml0eUNvbnRleHQ6IFNlY3VyaXR5Q29udGV4dHxudWxsO1xuICBzdWZmaXg6IHN0cmluZ3xudWxsO1xufVxuXG5leHBvcnQgY29uc3QgZW51bSBCaW5kaW5nRmxhZ3Mge1xuICBUeXBlRWxlbWVudEF0dHJpYnV0ZSA9IDEgPDwgMCxcbiAgVHlwZUVsZW1lbnRDbGFzcyA9IDEgPDwgMSxcbiAgVHlwZUVsZW1lbnRTdHlsZSA9IDEgPDwgMixcbiAgVHlwZVByb3BlcnR5ID0gMSA8PCAzLFxuICBTeW50aGV0aWNQcm9wZXJ0eSA9IDEgPDwgNCxcbiAgU3ludGhldGljSG9zdFByb3BlcnR5ID0gMSA8PCA1LFxuICBDYXRTeW50aGV0aWNQcm9wZXJ0eSA9IFN5bnRoZXRpY1Byb3BlcnR5IHwgU3ludGhldGljSG9zdFByb3BlcnR5LFxuXG4gIC8vIG11dHVhbGx5IGV4Y2x1c2l2ZSB2YWx1ZXMuLi5cbiAgVHlwZXMgPSBUeXBlRWxlbWVudEF0dHJpYnV0ZSB8IFR5cGVFbGVtZW50Q2xhc3MgfCBUeXBlRWxlbWVudFN0eWxlIHwgVHlwZVByb3BlcnR5XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0cHV0RGVmIHtcbiAgdHlwZTogT3V0cHV0VHlwZTtcbiAgdGFyZ2V0OiAnd2luZG93J3wnZG9jdW1lbnQnfCdib2R5J3wnY29tcG9uZW50J3xudWxsO1xuICBldmVudE5hbWU6IHN0cmluZztcbiAgcHJvcE5hbWU6IHN0cmluZ3xudWxsO1xufVxuXG5leHBvcnQgY29uc3QgZW51bSBPdXRwdXRUeXBlIHtFbGVtZW50T3V0cHV0LCBEaXJlY3RpdmVPdXRwdXR9XG5cbmV4cG9ydCBjb25zdCBlbnVtIFF1ZXJ5VmFsdWVUeXBlIHtcbiAgRWxlbWVudFJlZiA9IDAsXG4gIFJlbmRlckVsZW1lbnQgPSAxLFxuICBUZW1wbGF0ZVJlZiA9IDIsXG4gIFZpZXdDb250YWluZXJSZWYgPSAzLFxuICBQcm92aWRlciA9IDRcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFbGVtZW50RGVmIHtcbiAgLy8gc2V0IHRvIG51bGwgZm9yIGA8bmctY29udGFpbmVyPmBcbiAgbmFtZTogc3RyaW5nfG51bGw7XG4gIG5zOiBzdHJpbmd8bnVsbDtcbiAgLyoqIG5zLCBuYW1lLCB2YWx1ZSAqL1xuICBhdHRyczogW3N0cmluZywgc3RyaW5nLCBzdHJpbmddW118bnVsbDtcbiAgdGVtcGxhdGU6IFZpZXdEZWZpbml0aW9ufG51bGw7XG4gIGNvbXBvbmVudFByb3ZpZGVyOiBOb2RlRGVmfG51bGw7XG4gIGNvbXBvbmVudFJlbmRlcmVyVHlwZTogUmVuZGVyZXJUeXBlMnxudWxsO1xuICAvLyBjbG9zdXJlIHRvIGFsbG93IHJlY3Vyc2l2ZSBjb21wb25lbnRzXG4gIGNvbXBvbmVudFZpZXc6IFZpZXdEZWZpbml0aW9uRmFjdG9yeXxudWxsO1xuICAvKipcbiAgICogdmlzaWJsZSBwdWJsaWMgcHJvdmlkZXJzIGZvciBESSBpbiB0aGUgdmlldyxcbiAgICogYXMgc2VlIGZyb20gdGhpcyBlbGVtZW50LiBUaGlzIGRvZXMgbm90IGluY2x1ZGUgcHJpdmF0ZSBwcm92aWRlcnMuXG4gICAqL1xuICBwdWJsaWNQcm92aWRlcnM6IHtbdG9rZW5LZXk6IHN0cmluZ106IE5vZGVEZWZ9fG51bGw7XG4gIC8qKlxuICAgKiBzYW1lIGFzIHZpc2libGVQdWJsaWNQcm92aWRlcnMsIGJ1dCBhbHNvIGluY2x1ZGVzIHByaXZhdGUgcHJvdmlkZXJzXG4gICAqIHRoYXQgYXJlIGxvY2F0ZWQgb24gdGhpcyBlbGVtZW50LlxuICAgKi9cbiAgYWxsUHJvdmlkZXJzOiB7W3Rva2VuS2V5OiBzdHJpbmddOiBOb2RlRGVmfXxudWxsO1xuICBoYW5kbGVFdmVudDogRWxlbWVudEhhbmRsZUV2ZW50Rm58bnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFbGVtZW50SGFuZGxlRXZlbnRGbiB7ICh2aWV3OiBWaWV3RGF0YSwgZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50OiBhbnkpOiBib29sZWFuOyB9XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvdmlkZXJEZWYge1xuICB0b2tlbjogYW55O1xuICB2YWx1ZTogYW55O1xuICBkZXBzOiBEZXBEZWZbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOZ01vZHVsZVByb3ZpZGVyRGVmIHtcbiAgZmxhZ3M6IE5vZGVGbGFncztcbiAgaW5kZXg6IG51bWJlcjtcbiAgdG9rZW46IGFueTtcbiAgdmFsdWU6IGFueTtcbiAgZGVwczogRGVwRGVmW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVwRGVmIHtcbiAgZmxhZ3M6IERlcEZsYWdzO1xuICB0b2tlbjogYW55O1xuICB0b2tlbktleTogc3RyaW5nO1xufVxuXG4vKipcbiAqIEJpdG1hc2sgZm9yIERJIGZsYWdzXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIERlcEZsYWdzIHtcbiAgTm9uZSA9IDAsXG4gIFNraXBTZWxmID0gMSA8PCAwLFxuICBPcHRpb25hbCA9IDEgPDwgMSxcbiAgU2VsZiA9IDEgPDwgMixcbiAgVmFsdWUgPSAxIDw8IDMsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGV4dERlZiB7IHByZWZpeDogc3RyaW5nOyB9XG5cbmV4cG9ydCBpbnRlcmZhY2UgUXVlcnlEZWYge1xuICBpZDogbnVtYmVyO1xuICAvLyB2YXJpYW50IG9mIHRoZSBpZCB0aGF0IGNhbiBiZSB1c2VkIHRvIGNoZWNrIGFnYWluc3QgTm9kZURlZi5tYXRjaGVkUXVlcnlJZHMsIC4uLlxuICBmaWx0ZXJJZDogbnVtYmVyO1xuICBiaW5kaW5nczogUXVlcnlCaW5kaW5nRGVmW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUXVlcnlCaW5kaW5nRGVmIHtcbiAgcHJvcE5hbWU6IHN0cmluZztcbiAgYmluZGluZ1R5cGU6IFF1ZXJ5QmluZGluZ1R5cGU7XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFF1ZXJ5QmluZGluZ1R5cGUge0ZpcnN0ID0gMCwgQWxsID0gMX1cblxuZXhwb3J0IGludGVyZmFjZSBOZ0NvbnRlbnREZWYge1xuICAvKipcbiAgICogdGhpcyBpbmRleCBpcyBjaGVja2VkIGFnYWluc3QgTm9kZURlZi5uZ0NvbnRlbnRJbmRleCB0byBmaW5kIHRoZSBub2Rlc1xuICAgKiB0aGF0IGFyZSBtYXRjaGVkIGJ5IHRoaXMgbmctY29udGVudC5cbiAgICogTm90ZSB0aGF0IGEgTm9kZURlZiB3aXRoIGFuIG5nLWNvbnRlbnQgY2FuIGJlIHJlcHJvamVjdGVkLCBpLmUuXG4gICAqIGhhdmUgYSBuZ0NvbnRlbnRJbmRleCBvbiBpdHMgb3duLlxuICAgKi9cbiAgaW5kZXg6IG51bWJlcjtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRGF0YVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgaW50ZXJmYWNlIE5nTW9kdWxlRGF0YSBleHRlbmRzIEluamVjdG9yLCBOZ01vZHVsZVJlZjxhbnk+IHtcbiAgLy8gTm90ZTogd2UgYXJlIHVzaW5nIHRoZSBwcmVmaXggXyBhcyBOZ01vZHVsZURhdGEgaXMgYW4gTmdNb2R1bGVSZWYgYW5kIHRoZXJlZm9yZSBkaXJlY3RseVxuICAvLyBleHBvc2VkIHRvIHRoZSB1c2VyLlxuICBfZGVmOiBOZ01vZHVsZURlZmluaXRpb247XG4gIF9wYXJlbnQ6IEluamVjdG9yO1xuICBfcHJvdmlkZXJzOiBhbnlbXTtcbn1cblxuLyoqXG4gKiBWaWV3IGluc3RhbmNlIGRhdGEuXG4gKiBBdHRlbnRpb246IEFkZGluZyBmaWVsZHMgdG8gdGhpcyBpcyBwZXJmb3JtYW5jZSBzZW5zaXRpdmUhXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVmlld0RhdGEge1xuICBkZWY6IFZpZXdEZWZpbml0aW9uO1xuICByb290OiBSb290RGF0YTtcbiAgcmVuZGVyZXI6IFJlbmRlcmVyMjtcbiAgLy8gaW5kZXggb2YgY29tcG9uZW50IHByb3ZpZGVyIC8gYW5jaG9yLlxuICBwYXJlbnROb2RlRGVmOiBOb2RlRGVmfG51bGw7XG4gIHBhcmVudDogVmlld0RhdGF8bnVsbDtcbiAgdmlld0NvbnRhaW5lclBhcmVudDogVmlld0RhdGF8bnVsbDtcbiAgY29tcG9uZW50OiBhbnk7XG4gIGNvbnRleHQ6IGFueTtcbiAgLy8gQXR0ZW50aW9uOiBOZXZlciBsb29wIG92ZXIgdGhpcywgYXMgdGhpcyB3aWxsXG4gIC8vIGNyZWF0ZSBhIHBvbHltb3JwaGljIHVzYWdlIHNpdGUuXG4gIC8vIEluc3RlYWQ6IEFsd2F5cyBsb29wIG92ZXIgVmlld0RlZmluaXRpb24ubm9kZXMsXG4gIC8vIGFuZCBjYWxsIHRoZSByaWdodCBhY2Nlc3NvciAoZS5nLiBgZWxlbWVudERhdGFgKSBiYXNlZCBvblxuICAvLyB0aGUgTm9kZVR5cGUuXG4gIG5vZGVzOiB7W2tleTogbnVtYmVyXTogTm9kZURhdGF9O1xuICBzdGF0ZTogVmlld1N0YXRlO1xuICBvbGRWYWx1ZXM6IGFueVtdO1xuICBkaXNwb3NhYmxlczogRGlzcG9zYWJsZUZuW118bnVsbDtcbiAgaW5pdEluZGV4OiBudW1iZXI7XG59XG5cbi8qKlxuICogQml0bWFzayBvZiBzdGF0ZXNcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVmlld1N0YXRlIHtcbiAgQmVmb3JlRmlyc3RDaGVjayA9IDEgPDwgMCxcbiAgRmlyc3RDaGVjayA9IDEgPDwgMSxcbiAgQXR0YWNoZWQgPSAxIDw8IDIsXG4gIENoZWNrc0VuYWJsZWQgPSAxIDw8IDMsXG4gIElzUHJvamVjdGVkVmlldyA9IDEgPDwgNCxcbiAgQ2hlY2tQcm9qZWN0ZWRWaWV3ID0gMSA8PCA1LFxuICBDaGVja1Byb2plY3RlZFZpZXdzID0gMSA8PCA2LFxuICBEZXN0cm95ZWQgPSAxIDw8IDcsXG5cbiAgLy8gSW5pdFN0YXRlIFVzZXMgMyBiaXRzXG4gIEluaXRTdGF0ZV9NYXNrID0gNyA8PCA4LFxuICBJbml0U3RhdGVfQmVmb3JlSW5pdCA9IDAgPDwgOCxcbiAgSW5pdFN0YXRlX0NhbGxpbmdPbkluaXQgPSAxIDw8IDgsXG4gIEluaXRTdGF0ZV9DYWxsaW5nQWZ0ZXJDb250ZW50SW5pdCA9IDIgPDwgOCxcbiAgSW5pdFN0YXRlX0NhbGxpbmdBZnRlclZpZXdJbml0ID0gMyA8PCA4LFxuICBJbml0U3RhdGVfQWZ0ZXJJbml0ID0gNCA8PCA4LFxuXG4gIENhdERldGVjdENoYW5nZXMgPSBBdHRhY2hlZCB8IENoZWNrc0VuYWJsZWQsXG4gIENhdEluaXQgPSBCZWZvcmVGaXJzdENoZWNrIHwgQ2F0RGV0ZWN0Q2hhbmdlcyB8IEluaXRTdGF0ZV9CZWZvcmVJbml0XG59XG5cbi8vIENhbGxlZCBiZWZvcmUgZWFjaCBjeWNsZSBvZiBhIHZpZXcncyBjaGVjayB0byBkZXRlY3Qgd2hldGhlciB0aGlzIGlzIGluIHRoZVxuLy8gaW5pdFN0YXRlIGZvciB3aGljaCB3ZSBuZWVkIHRvIGNhbGwgbmdPbkluaXQsIG5nQWZ0ZXJDb250ZW50SW5pdCBvciBuZ0FmdGVyVmlld0luaXRcbi8vIGxpZmVjeWNsZSBtZXRob2RzLiBSZXR1cm5zIHRydWUgaWYgdGhpcyBjaGVjayBjeWNsZSBzaG91bGQgY2FsbCBsaWZlY3ljbGVcbi8vIG1ldGhvZHMuXG5leHBvcnQgZnVuY3Rpb24gc2hpZnRJbml0U3RhdGUoXG4gICAgdmlldzogVmlld0RhdGEsIHByaW9ySW5pdFN0YXRlOiBWaWV3U3RhdGUsIG5ld0luaXRTdGF0ZTogVmlld1N0YXRlKTogYm9vbGVhbiB7XG4gIC8vIE9ubHkgdXBkYXRlIHRoZSBJbml0U3RhdGUgaWYgd2UgYXJlIGN1cnJlbnRseSBpbiB0aGUgcHJpb3Igc3RhdGUuXG4gIC8vIEZvciBleGFtcGxlLCBvbmx5IG1vdmUgaW50byBDYWxsaW5nSW5pdCBpZiB3ZSBhcmUgaW4gQmVmb3JlSW5pdC4gT25seVxuICAvLyBtb3ZlIGludG8gQ2FsbGluZ0NvbnRlbnRJbml0IGlmIHdlIGFyZSBpbiBDYWxsaW5nSW5pdC4gTm9ybWFsbHkgdGhpcyB3aWxsXG4gIC8vIGFsd2F5cyBiZSB0cnVlIGJlY2F1c2Ugb2YgaG93IGNoZWNrQ3ljbGUgaXMgY2FsbGVkIGluIGNoZWNrQW5kVXBkYXRlVmlldy5cbiAgLy8gSG93ZXZlciwgaWYgY2hlY2tBbmRVcGRhdGVWaWV3IGlzIGNhbGxlZCByZWN1cnNpdmVseSBvciBpZiBhbiBleGNlcHRpb24gaXNcbiAgLy8gdGhyb3duIHdoaWxlIGNoZWNrQW5kVXBkYXRlVmlldyBpcyBydW5uaW5nLCBjaGVja0FuZFVwZGF0ZVZpZXcgc3RhcnRzIG92ZXJcbiAgLy8gZnJvbSB0aGUgYmVnaW5uaW5nLiBUaGlzIGVuc3VyZXMgdGhlIHN0YXRlIGlzIG1vbm90b25pY2FsbHkgaW5jcmVhc2luZyxcbiAgLy8gdGVybWluYXRpbmcgaW4gdGhlIEFmdGVySW5pdCBzdGF0ZSwgd2hpY2ggZW5zdXJlcyB0aGUgSW5pdCBtZXRob2RzIGFyZSBjYWxsZWRcbiAgLy8gYXQgbGVhc3Qgb25jZSBhbmQgb25seSBvbmNlLlxuICBjb25zdCBzdGF0ZSA9IHZpZXcuc3RhdGU7XG4gIGNvbnN0IGluaXRTdGF0ZSA9IHN0YXRlICYgVmlld1N0YXRlLkluaXRTdGF0ZV9NYXNrO1xuICBpZiAoaW5pdFN0YXRlID09PSBwcmlvckluaXRTdGF0ZSkge1xuICAgIHZpZXcuc3RhdGUgPSAoc3RhdGUgJiB+Vmlld1N0YXRlLkluaXRTdGF0ZV9NYXNrKSB8IG5ld0luaXRTdGF0ZTtcbiAgICB2aWV3LmluaXRJbmRleCA9IC0xO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBpbml0U3RhdGUgPT09IG5ld0luaXRTdGF0ZTtcbn1cblxuLy8gUmV0dXJucyB0cnVlIGlmIHRoZSBsaWZlY3ljbGUgaW5pdCBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCBmb3IgdGhlIG5vZGUgd2l0aFxuLy8gdGhlIGdpdmVuIGluaXQgaW5kZXguXG5leHBvcnQgZnVuY3Rpb24gc2hvdWxkQ2FsbExpZmVjeWNsZUluaXRIb29rKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBpbml0U3RhdGU6IFZpZXdTdGF0ZSwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBpZiAoKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuSW5pdFN0YXRlX01hc2spID09PSBpbml0U3RhdGUgJiYgdmlldy5pbml0SW5kZXggPD0gaW5kZXgpIHtcbiAgICB2aWV3LmluaXRJbmRleCA9IGluZGV4ICsgMTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGlzcG9zYWJsZUZuIHsgKCk6IHZvaWQ7IH1cblxuLyoqXG4gKiBOb2RlIGluc3RhbmNlIGRhdGEuXG4gKlxuICogV2UgaGF2ZSBhIHNlcGFyYXRlIHR5cGUgcGVyIE5vZGVUeXBlIHRvIHNhdmUgbWVtb3J5XG4gKiAoVGV4dERhdGEgfCBFbGVtZW50RGF0YSB8IFByb3ZpZGVyRGF0YSB8IFB1cmVFeHByZXNzaW9uRGF0YSB8IFF1ZXJ5TGlzdDxhbnk+KVxuICpcbiAqIFRvIGtlZXAgb3VyIGNvZGUgbW9ub21vcnBoaWMsXG4gKiB3ZSBwcm9oaWJpdCB1c2luZyBgTm9kZURhdGFgIGRpcmVjdGx5IGJ1dCBlbmZvcmNlIHRoZSB1c2Ugb2YgYWNjZXNzb3JzIChgYXNFbGVtZW50RGF0YWAsIC4uLikuXG4gKiBUaGlzIHdheSwgbm8gdXNhZ2Ugc2l0ZSBjYW4gZ2V0IGEgYE5vZGVEYXRhYCBmcm9tIHZpZXcubm9kZXMgYW5kIHRoZW4gdXNlIGl0IGZvciBkaWZmZXJlbnRcbiAqIHB1cnBvc2VzLlxuICovXG5leHBvcnQgY2xhc3MgTm9kZURhdGEgeyBwcml2YXRlIF9fYnJhbmQ6IGFueTsgfVxuXG4vKipcbiAqIERhdGEgZm9yIGFuIGluc3RhbnRpYXRlZCBOb2RlVHlwZS5UZXh0LlxuICpcbiAqIEF0dGVudGlvbjogQWRkaW5nIGZpZWxkcyB0byB0aGlzIGlzIHBlcmZvcm1hbmNlIHNlbnNpdGl2ZSFcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXh0RGF0YSB7IHJlbmRlclRleHQ6IGFueTsgfVxuXG4vKipcbiAqIEFjY2Vzc29yIGZvciB2aWV3Lm5vZGVzLCBlbmZvcmNpbmcgdGhhdCBldmVyeSB1c2FnZSBzaXRlIHN0YXlzIG1vbm9tb3JwaGljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNUZXh0RGF0YSh2aWV3OiBWaWV3RGF0YSwgaW5kZXg6IG51bWJlcik6IFRleHREYXRhIHtcbiAgcmV0dXJuIDxhbnk+dmlldy5ub2Rlc1tpbmRleF07XG59XG5cbi8qKlxuICogRGF0YSBmb3IgYW4gaW5zdGFudGlhdGVkIE5vZGVUeXBlLkVsZW1lbnQuXG4gKlxuICogQXR0ZW50aW9uOiBBZGRpbmcgZmllbGRzIHRvIHRoaXMgaXMgcGVyZm9ybWFuY2Ugc2Vuc2l0aXZlIVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEVsZW1lbnREYXRhIHtcbiAgcmVuZGVyRWxlbWVudDogYW55O1xuICBjb21wb25lbnRWaWV3OiBWaWV3RGF0YTtcbiAgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lckRhdGF8bnVsbDtcbiAgdGVtcGxhdGU6IFRlbXBsYXRlRGF0YTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBWaWV3Q29udGFpbmVyRGF0YSBleHRlbmRzIFZpZXdDb250YWluZXJSZWYge1xuICAvLyBOb3RlOiB3ZSBhcmUgdXNpbmcgdGhlIHByZWZpeCBfIGFzIFZpZXdDb250YWluZXJEYXRhIGlzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgdGhlcmVmb3JlXG4gIC8vIGRpcmVjdGx5XG4gIC8vIGV4cG9zZWQgdG8gdGhlIHVzZXIuXG4gIF9lbWJlZGRlZFZpZXdzOiBWaWV3RGF0YVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlRGF0YSBleHRlbmRzIFRlbXBsYXRlUmVmPGFueT4ge1xuICAvLyB2aWV3cyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkIGZyb20gdGhlIHRlbXBsYXRlXG4gIC8vIG9mIHRoaXMgZWxlbWVudCxcbiAgLy8gYnV0IGluc2VydGVkIGludG8gdGhlIGVtYmVkZGVkVmlld3Mgb2YgYW5vdGhlciBlbGVtZW50LlxuICAvLyBCeSBkZWZhdWx0LCB0aGlzIGlzIHVuZGVmaW5lZC5cbiAgLy8gTm90ZTogd2UgYXJlIHVzaW5nIHRoZSBwcmVmaXggXyBhcyBUZW1wbGF0ZURhdGEgaXMgYSBUZW1wbGF0ZVJlZiBhbmQgdGhlcmVmb3JlIGRpcmVjdGx5XG4gIC8vIGV4cG9zZWQgdG8gdGhlIHVzZXIuXG4gIF9wcm9qZWN0ZWRWaWV3czogVmlld0RhdGFbXTtcbn1cblxuLyoqXG4gKiBBY2Nlc3NvciBmb3Igdmlldy5ub2RlcywgZW5mb3JjaW5nIHRoYXQgZXZlcnkgdXNhZ2Ugc2l0ZSBzdGF5cyBtb25vbW9ycGhpYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzRWxlbWVudERhdGEodmlldzogVmlld0RhdGEsIGluZGV4OiBudW1iZXIpOiBFbGVtZW50RGF0YSB7XG4gIHJldHVybiA8YW55PnZpZXcubm9kZXNbaW5kZXhdO1xufVxuXG4vKipcbiAqIERhdGEgZm9yIGFuIGluc3RhbnRpYXRlZCBOb2RlVHlwZS5Qcm92aWRlci5cbiAqXG4gKiBBdHRlbnRpb246IEFkZGluZyBmaWVsZHMgdG8gdGhpcyBpcyBwZXJmb3JtYW5jZSBzZW5zaXRpdmUhXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJvdmlkZXJEYXRhIHsgaW5zdGFuY2U6IGFueTsgfVxuXG4vKipcbiAqIEFjY2Vzc29yIGZvciB2aWV3Lm5vZGVzLCBlbmZvcmNpbmcgdGhhdCBldmVyeSB1c2FnZSBzaXRlIHN0YXlzIG1vbm9tb3JwaGljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNQcm92aWRlckRhdGEodmlldzogVmlld0RhdGEsIGluZGV4OiBudW1iZXIpOiBQcm92aWRlckRhdGEge1xuICByZXR1cm4gPGFueT52aWV3Lm5vZGVzW2luZGV4XTtcbn1cblxuLyoqXG4gKiBEYXRhIGZvciBhbiBpbnN0YW50aWF0ZWQgTm9kZVR5cGUuUHVyZUV4cHJlc3Npb24uXG4gKlxuICogQXR0ZW50aW9uOiBBZGRpbmcgZmllbGRzIHRvIHRoaXMgaXMgcGVyZm9ybWFuY2Ugc2Vuc2l0aXZlIVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFB1cmVFeHByZXNzaW9uRGF0YSB7IHZhbHVlOiBhbnk7IH1cblxuLyoqXG4gKiBBY2Nlc3NvciBmb3Igdmlldy5ub2RlcywgZW5mb3JjaW5nIHRoYXQgZXZlcnkgdXNhZ2Ugc2l0ZSBzdGF5cyBtb25vbW9ycGhpYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXc6IFZpZXdEYXRhLCBpbmRleDogbnVtYmVyKTogUHVyZUV4cHJlc3Npb25EYXRhIHtcbiAgcmV0dXJuIDxhbnk+dmlldy5ub2Rlc1tpbmRleF07XG59XG5cbi8qKlxuICogQWNjZXNzb3IgZm9yIHZpZXcubm9kZXMsIGVuZm9yY2luZyB0aGF0IGV2ZXJ5IHVzYWdlIHNpdGUgc3RheXMgbW9ub21vcnBoaWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc1F1ZXJ5TGlzdCh2aWV3OiBWaWV3RGF0YSwgaW5kZXg6IG51bWJlcik6IFF1ZXJ5TGlzdDxhbnk+IHtcbiAgcmV0dXJuIDxhbnk+dmlldy5ub2Rlc1tpbmRleF07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUm9vdERhdGEge1xuICBpbmplY3RvcjogSW5qZWN0b3I7XG4gIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+O1xuICBwcm9qZWN0YWJsZU5vZGVzOiBhbnlbXVtdO1xuICBzZWxlY3Rvck9yTm9kZTogYW55O1xuICByZW5kZXJlcjogUmVuZGVyZXIyO1xuICByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTI7XG4gIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyO1xuICBzYW5pdGl6ZXI6IFNhbml0aXplcjtcbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIERlYnVnQ29udGV4dCB7XG4gIGFic3RyYWN0IGdldCB2aWV3KCk6IFZpZXdEYXRhO1xuICBhYnN0cmFjdCBnZXQgbm9kZUluZGV4KCk6IG51bWJlcnxudWxsO1xuICBhYnN0cmFjdCBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3I7XG4gIGFic3RyYWN0IGdldCBjb21wb25lbnQoKTogYW55O1xuICBhYnN0cmFjdCBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W107XG4gIGFic3RyYWN0IGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICBhYnN0cmFjdCBnZXQgY29udGV4dCgpOiBhbnk7XG4gIGFic3RyYWN0IGdldCBjb21wb25lbnRSZW5kZXJFbGVtZW50KCk6IGFueTtcbiAgYWJzdHJhY3QgZ2V0IHJlbmRlck5vZGUoKTogYW55O1xuICBhYnN0cmFjdCBsb2dFcnJvcihjb25zb2xlOiBDb25zb2xlLCAuLi52YWx1ZXM6IGFueVtdKTogdm9pZDtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gT3RoZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGNvbnN0IGVudW0gQ2hlY2tUeXBlIHtDaGVja0FuZFVwZGF0ZSwgQ2hlY2tOb0NoYW5nZXN9XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvdmlkZXJPdmVycmlkZSB7XG4gIHRva2VuOiBhbnk7XG4gIGZsYWdzOiBOb2RlRmxhZ3M7XG4gIHZhbHVlOiBhbnk7XG4gIGRlcHM6IChbRGVwRmxhZ3MsIGFueV18YW55KVtdO1xuICBkZXByZWNhdGVkQmVoYXZpb3I6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmljZXMge1xuICBzZXRDdXJyZW50Tm9kZSh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpOiB2b2lkO1xuICBjcmVhdGVSb290VmlldyhcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2RlczogYW55W11bXSwgcm9vdFNlbGVjdG9yT3JOb2RlOiBzdHJpbmd8YW55LFxuICAgICAgZGVmOiBWaWV3RGVmaW5pdGlvbiwgbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4sIGNvbnRleHQ/OiBhbnkpOiBWaWV3RGF0YTtcbiAgY3JlYXRlRW1iZWRkZWRWaWV3KHBhcmVudDogVmlld0RhdGEsIGFuY2hvckRlZjogTm9kZURlZiwgdmlld0RlZjogVmlld0RlZmluaXRpb24sIGNvbnRleHQ/OiBhbnkpOlxuICAgICAgVmlld0RhdGE7XG4gIGNyZWF0ZUNvbXBvbmVudFZpZXcoXG4gICAgICBwYXJlbnRWaWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgdmlld0RlZjogVmlld0RlZmluaXRpb24sIGhvc3RFbGVtZW50OiBhbnkpOiBWaWV3RGF0YTtcbiAgY3JlYXRlTmdNb2R1bGVSZWYoXG4gICAgICBtb2R1bGVUeXBlOiBUeXBlPGFueT4sIHBhcmVudDogSW5qZWN0b3IsIGJvb3RzdHJhcENvbXBvbmVudHM6IFR5cGU8YW55PltdLFxuICAgICAgZGVmOiBOZ01vZHVsZURlZmluaXRpb24pOiBOZ01vZHVsZVJlZjxhbnk+O1xuICBvdmVycmlkZVByb3ZpZGVyKG92ZXJyaWRlOiBQcm92aWRlck92ZXJyaWRlKTogdm9pZDtcbiAgb3ZlcnJpZGVDb21wb25lbnRWaWV3KGNvbXBUeXBlOiBUeXBlPGFueT4sIGNvbXBGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT4pOiB2b2lkO1xuICBjbGVhck92ZXJyaWRlcygpOiB2b2lkO1xuICBjaGVja0FuZFVwZGF0ZVZpZXcodmlldzogVmlld0RhdGEpOiB2b2lkO1xuICBjaGVja05vQ2hhbmdlc1ZpZXcodmlldzogVmlld0RhdGEpOiB2b2lkO1xuICBkZXN0cm95Vmlldyh2aWV3OiBWaWV3RGF0YSk6IHZvaWQ7XG4gIHJlc29sdmVEZXAoXG4gICAgICB2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWZ8bnVsbCwgYWxsb3dQcml2YXRlU2VydmljZXM6IGJvb2xlYW4sIGRlcERlZjogRGVwRGVmLFxuICAgICAgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcbiAgY3JlYXRlRGVidWdDb250ZXh0KHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IERlYnVnQ29udGV4dDtcbiAgaGFuZGxlRXZlbnQ6IFZpZXdIYW5kbGVFdmVudEZuO1xuICB1cGRhdGVEaXJlY3RpdmVzOiAodmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSA9PiB2b2lkO1xuICB1cGRhdGVSZW5kZXJlcjogKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkgPT4gdm9pZDtcbiAgZGlydHlQYXJlbnRRdWVyaWVzOiAodmlldzogVmlld0RhdGEpID0+IHZvaWQ7XG59XG5cbi8qKlxuICogVGhpcyBvYmplY3QgaXMgdXNlZCB0byBwcmV2ZW50IGN5Y2xlcyBpbiB0aGUgc291cmNlIGZpbGVzIGFuZCB0byBoYXZlIGEgcGxhY2Ugd2hlcmVcbiAqIGRlYnVnIG1vZGUgY2FuIGhvb2sgaXQuIEl0IGlzIGxhemlseSBmaWxsZWQgd2hlbiBgaXNEZXZNb2RlYCBpcyBrbm93bi5cbiAqL1xuZXhwb3J0IGNvbnN0IFNlcnZpY2VzOiBTZXJ2aWNlcyA9IHtcbiAgc2V0Q3VycmVudE5vZGU6IHVuZGVmaW5lZCAhLFxuICBjcmVhdGVSb290VmlldzogdW5kZWZpbmVkICEsXG4gIGNyZWF0ZUVtYmVkZGVkVmlldzogdW5kZWZpbmVkICEsXG4gIGNyZWF0ZUNvbXBvbmVudFZpZXc6IHVuZGVmaW5lZCAhLFxuICBjcmVhdGVOZ01vZHVsZVJlZjogdW5kZWZpbmVkICEsXG4gIG92ZXJyaWRlUHJvdmlkZXI6IHVuZGVmaW5lZCAhLFxuICBvdmVycmlkZUNvbXBvbmVudFZpZXc6IHVuZGVmaW5lZCAhLFxuICBjbGVhck92ZXJyaWRlczogdW5kZWZpbmVkICEsXG4gIGNoZWNrQW5kVXBkYXRlVmlldzogdW5kZWZpbmVkICEsXG4gIGNoZWNrTm9DaGFuZ2VzVmlldzogdW5kZWZpbmVkICEsXG4gIGRlc3Ryb3lWaWV3OiB1bmRlZmluZWQgISxcbiAgcmVzb2x2ZURlcDogdW5kZWZpbmVkICEsXG4gIGNyZWF0ZURlYnVnQ29udGV4dDogdW5kZWZpbmVkICEsXG4gIGhhbmRsZUV2ZW50OiB1bmRlZmluZWQgISxcbiAgdXBkYXRlRGlyZWN0aXZlczogdW5kZWZpbmVkICEsXG4gIHVwZGF0ZVJlbmRlcmVyOiB1bmRlZmluZWQgISxcbiAgZGlydHlQYXJlbnRRdWVyaWVzOiB1bmRlZmluZWQgISxcbn07XG4iXX0=