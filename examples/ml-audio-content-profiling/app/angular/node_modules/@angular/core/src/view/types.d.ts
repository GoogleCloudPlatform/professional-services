/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di';
import { ErrorHandler } from '../error_handler';
import { ComponentFactory } from '../linker/component_factory';
import { NgModuleRef } from '../linker/ng_module_factory';
import { QueryList } from '../linker/query_list';
import { TemplateRef } from '../linker/template_ref';
import { ViewContainerRef } from '../linker/view_container_ref';
import { Renderer2, RendererFactory2, RendererType2 } from '../render/api';
import { Sanitizer, SecurityContext } from '../sanitization/security';
import { Type } from '../type';
/**
 * Factory for ViewDefinitions/NgModuleDefinitions.
 * We use a function so we can reexeute it in case an error happens and use the given logger
 * function to log the error from the definition of the node, which is shown in all browser
 * logs.
 */
export interface DefinitionFactory<D extends Definition<any>> {
    (logger: NodeLogger): D;
}
/**
 * Function to call console.error at the right source location. This is an indirection
 * via another function as browser will log the location that actually called
 * `console.error`.
 */
export interface NodeLogger {
    (): () => void;
}
export interface Definition<DF extends DefinitionFactory<any>> {
    factory: DF | null;
}
export interface NgModuleDefinition extends Definition<NgModuleDefinitionFactory> {
    providers: NgModuleProviderDef[];
    providersByKey: {
        [tokenKey: string]: NgModuleProviderDef;
    };
    modules: any[];
    isRoot: boolean;
}
export interface NgModuleDefinitionFactory extends DefinitionFactory<NgModuleDefinition> {
}
export interface ViewDefinition extends Definition<ViewDefinitionFactory> {
    flags: ViewFlags;
    updateDirectives: ViewUpdateFn;
    updateRenderer: ViewUpdateFn;
    handleEvent: ViewHandleEventFn;
    /**
     * Order: Depth first.
     * Especially providers are before elements / anchors.
     */
    nodes: NodeDef[];
    /** aggregated NodeFlags for all nodes **/
    nodeFlags: NodeFlags;
    rootNodeFlags: NodeFlags;
    lastRenderRootNode: NodeDef | null;
    bindingCount: number;
    outputCount: number;
    /**
     * Binary or of all query ids that are matched by one of the nodes.
     * This includes query ids from templates as well.
     * Used as a bloom filter.
     */
    nodeMatchedQueries: number;
}
export interface ViewDefinitionFactory extends DefinitionFactory<ViewDefinition> {
}
export interface ViewUpdateFn {
    (check: NodeCheckFn, view: ViewData): void;
}
export interface NodeCheckFn {
    (view: ViewData, nodeIndex: number, argStyle: ArgumentType.Dynamic, values: any[]): any;
    (view: ViewData, nodeIndex: number, argStyle: ArgumentType.Inline, v0?: any, v1?: any, v2?: any, v3?: any, v4?: any, v5?: any, v6?: any, v7?: any, v8?: any, v9?: any): any;
}
export declare const enum ArgumentType {
    Inline = 0,
    Dynamic = 1
}
export interface ViewHandleEventFn {
    (view: ViewData, nodeIndex: number, eventName: string, event: any): boolean;
}
/**
 * Bitmask for ViewDefinition.flags.
 */
export declare const enum ViewFlags {
    None = 0,
    OnPush = 2
}
/**
 * A node definition in the view.
 *
 * Note: We use one type for all nodes so that loops that loop over all nodes
 * of a ViewDefinition stay monomorphic!
 */
export interface NodeDef {
    flags: NodeFlags;
    nodeIndex: number;
    checkIndex: number;
    parent: NodeDef | null;
    renderParent: NodeDef | null;
    /** this is checked against NgContentDef.index to find matched nodes */
    ngContentIndex: number | null;
    /** number of transitive children */
    childCount: number;
    /** aggregated NodeFlags for all transitive children (does not include self) **/
    childFlags: NodeFlags;
    /** aggregated NodeFlags for all direct children (does not include self) **/
    directChildFlags: NodeFlags;
    bindingIndex: number;
    bindings: BindingDef[];
    bindingFlags: BindingFlags;
    outputIndex: number;
    outputs: OutputDef[];
    /**
     * references that the user placed on the element
     */
    references: {
        [refId: string]: QueryValueType;
    };
    /**
     * ids and value types of all queries that are matched by this node.
     */
    matchedQueries: {
        [queryId: number]: QueryValueType;
    };
    /** Binary or of all matched query ids of this node. */
    matchedQueryIds: number;
    /**
     * Binary or of all query ids that are matched by one of the children.
     * This includes query ids from templates as well.
     * Used as a bloom filter.
     */
    childMatchedQueries: number;
    element: ElementDef | null;
    provider: ProviderDef | null;
    text: TextDef | null;
    query: QueryDef | null;
    ngContent: NgContentDef | null;
}
/**
 * Bitmask for NodeDef.flags.
 * Naming convention:
 * - `Type...`: flags that are mutually exclusive
 * - `Cat...`: union of multiple `Type...` (short for category).
 */
export declare const enum NodeFlags {
    None = 0,
    TypeElement = 1,
    TypeText = 2,
    ProjectedTemplate = 4,
    CatRenderNode = 3,
    TypeNgContent = 8,
    TypePipe = 16,
    TypePureArray = 32,
    TypePureObject = 64,
    TypePurePipe = 128,
    CatPureExpression = 224,
    TypeValueProvider = 256,
    TypeClassProvider = 512,
    TypeFactoryProvider = 1024,
    TypeUseExistingProvider = 2048,
    LazyProvider = 4096,
    PrivateProvider = 8192,
    TypeDirective = 16384,
    Component = 32768,
    CatProviderNoDirective = 3840,
    CatProvider = 20224,
    OnInit = 65536,
    OnDestroy = 131072,
    DoCheck = 262144,
    OnChanges = 524288,
    AfterContentInit = 1048576,
    AfterContentChecked = 2097152,
    AfterViewInit = 4194304,
    AfterViewChecked = 8388608,
    EmbeddedViews = 16777216,
    ComponentView = 33554432,
    TypeContentQuery = 67108864,
    TypeViewQuery = 134217728,
    StaticQuery = 268435456,
    DynamicQuery = 536870912,
    TypeNgModule = 1073741824,
    CatQuery = 201326592,
    Types = 201347067
}
export interface BindingDef {
    flags: BindingFlags;
    ns: string | null;
    name: string | null;
    nonMinifiedName: string | null;
    securityContext: SecurityContext | null;
    suffix: string | null;
}
export declare const enum BindingFlags {
    TypeElementAttribute = 1,
    TypeElementClass = 2,
    TypeElementStyle = 4,
    TypeProperty = 8,
    SyntheticProperty = 16,
    SyntheticHostProperty = 32,
    CatSyntheticProperty = 48,
    Types = 15
}
export interface OutputDef {
    type: OutputType;
    target: 'window' | 'document' | 'body' | 'component' | null;
    eventName: string;
    propName: string | null;
}
export declare const enum OutputType {
    ElementOutput = 0,
    DirectiveOutput = 1
}
export declare const enum QueryValueType {
    ElementRef = 0,
    RenderElement = 1,
    TemplateRef = 2,
    ViewContainerRef = 3,
    Provider = 4
}
export interface ElementDef {
    name: string | null;
    ns: string | null;
    /** ns, name, value */
    attrs: [string, string, string][] | null;
    template: ViewDefinition | null;
    componentProvider: NodeDef | null;
    componentRendererType: RendererType2 | null;
    componentView: ViewDefinitionFactory | null;
    /**
     * visible public providers for DI in the view,
     * as see from this element. This does not include private providers.
     */
    publicProviders: {
        [tokenKey: string]: NodeDef;
    } | null;
    /**
     * same as visiblePublicProviders, but also includes private providers
     * that are located on this element.
     */
    allProviders: {
        [tokenKey: string]: NodeDef;
    } | null;
    handleEvent: ElementHandleEventFn | null;
}
export interface ElementHandleEventFn {
    (view: ViewData, eventName: string, event: any): boolean;
}
export interface ProviderDef {
    token: any;
    value: any;
    deps: DepDef[];
}
export interface NgModuleProviderDef {
    flags: NodeFlags;
    index: number;
    token: any;
    value: any;
    deps: DepDef[];
}
export interface DepDef {
    flags: DepFlags;
    token: any;
    tokenKey: string;
}
/**
 * Bitmask for DI flags
 */
export declare const enum DepFlags {
    None = 0,
    SkipSelf = 1,
    Optional = 2,
    Self = 4,
    Value = 8
}
export interface TextDef {
    prefix: string;
}
export interface QueryDef {
    id: number;
    filterId: number;
    bindings: QueryBindingDef[];
}
export interface QueryBindingDef {
    propName: string;
    bindingType: QueryBindingType;
}
export declare const enum QueryBindingType {
    First = 0,
    All = 1
}
export interface NgContentDef {
    /**
     * this index is checked against NodeDef.ngContentIndex to find the nodes
     * that are matched by this ng-content.
     * Note that a NodeDef with an ng-content can be reprojected, i.e.
     * have a ngContentIndex on its own.
     */
    index: number;
}
export interface NgModuleData extends Injector, NgModuleRef<any> {
    _def: NgModuleDefinition;
    _parent: Injector;
    _providers: any[];
}
/**
 * View instance data.
 * Attention: Adding fields to this is performance sensitive!
 */
export interface ViewData {
    def: ViewDefinition;
    root: RootData;
    renderer: Renderer2;
    parentNodeDef: NodeDef | null;
    parent: ViewData | null;
    viewContainerParent: ViewData | null;
    component: any;
    context: any;
    nodes: {
        [key: number]: NodeData;
    };
    state: ViewState;
    oldValues: any[];
    disposables: DisposableFn[] | null;
    initIndex: number;
}
/**
 * Bitmask of states
 */
export declare const enum ViewState {
    BeforeFirstCheck = 1,
    FirstCheck = 2,
    Attached = 4,
    ChecksEnabled = 8,
    IsProjectedView = 16,
    CheckProjectedView = 32,
    CheckProjectedViews = 64,
    Destroyed = 128,
    InitState_Mask = 1792,
    InitState_BeforeInit = 0,
    InitState_CallingOnInit = 256,
    InitState_CallingAfterContentInit = 512,
    InitState_CallingAfterViewInit = 768,
    InitState_AfterInit = 1024,
    CatDetectChanges = 12,
    CatInit = 13
}
export declare function shiftInitState(view: ViewData, priorInitState: ViewState, newInitState: ViewState): boolean;
export declare function shouldCallLifecycleInitHook(view: ViewData, initState: ViewState, index: number): boolean;
export interface DisposableFn {
    (): void;
}
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
export declare class NodeData {
    private __brand;
}
/**
 * Data for an instantiated NodeType.Text.
 *
 * Attention: Adding fields to this is performance sensitive!
 */
export interface TextData {
    renderText: any;
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 */
export declare function asTextData(view: ViewData, index: number): TextData;
/**
 * Data for an instantiated NodeType.Element.
 *
 * Attention: Adding fields to this is performance sensitive!
 */
export interface ElementData {
    renderElement: any;
    componentView: ViewData;
    viewContainer: ViewContainerData | null;
    template: TemplateData;
}
export interface ViewContainerData extends ViewContainerRef {
    _embeddedViews: ViewData[];
}
export interface TemplateData extends TemplateRef<any> {
    _projectedViews: ViewData[];
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 */
export declare function asElementData(view: ViewData, index: number): ElementData;
/**
 * Data for an instantiated NodeType.Provider.
 *
 * Attention: Adding fields to this is performance sensitive!
 */
export interface ProviderData {
    instance: any;
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 */
export declare function asProviderData(view: ViewData, index: number): ProviderData;
/**
 * Data for an instantiated NodeType.PureExpression.
 *
 * Attention: Adding fields to this is performance sensitive!
 */
export interface PureExpressionData {
    value: any;
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 */
export declare function asPureExpressionData(view: ViewData, index: number): PureExpressionData;
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 */
export declare function asQueryList(view: ViewData, index: number): QueryList<any>;
export interface RootData {
    injector: Injector;
    ngModule: NgModuleRef<any>;
    projectableNodes: any[][];
    selectorOrNode: any;
    renderer: Renderer2;
    rendererFactory: RendererFactory2;
    errorHandler: ErrorHandler;
    sanitizer: Sanitizer;
}
export declare abstract class DebugContext {
    abstract readonly view: ViewData;
    abstract readonly nodeIndex: number | null;
    abstract readonly injector: Injector;
    abstract readonly component: any;
    abstract readonly providerTokens: any[];
    abstract readonly references: {
        [key: string]: any;
    };
    abstract readonly context: any;
    abstract readonly componentRenderElement: any;
    abstract readonly renderNode: any;
    abstract logError(console: Console, ...values: any[]): void;
}
export declare const enum CheckType {
    CheckAndUpdate = 0,
    CheckNoChanges = 1
}
export interface ProviderOverride {
    token: any;
    flags: NodeFlags;
    value: any;
    deps: ([DepFlags, any] | any)[];
    deprecatedBehavior: boolean;
}
export interface Services {
    setCurrentNode(view: ViewData, nodeIndex: number): void;
    createRootView(injector: Injector, projectableNodes: any[][], rootSelectorOrNode: string | any, def: ViewDefinition, ngModule: NgModuleRef<any>, context?: any): ViewData;
    createEmbeddedView(parent: ViewData, anchorDef: NodeDef, viewDef: ViewDefinition, context?: any): ViewData;
    createComponentView(parentView: ViewData, nodeDef: NodeDef, viewDef: ViewDefinition, hostElement: any): ViewData;
    createNgModuleRef(moduleType: Type<any>, parent: Injector, bootstrapComponents: Type<any>[], def: NgModuleDefinition): NgModuleRef<any>;
    overrideProvider(override: ProviderOverride): void;
    overrideComponentView(compType: Type<any>, compFactory: ComponentFactory<any>): void;
    clearOverrides(): void;
    checkAndUpdateView(view: ViewData): void;
    checkNoChangesView(view: ViewData): void;
    destroyView(view: ViewData): void;
    resolveDep(view: ViewData, elDef: NodeDef | null, allowPrivateServices: boolean, depDef: DepDef, notFoundValue?: any): any;
    createDebugContext(view: ViewData, nodeIndex: number): DebugContext;
    handleEvent: ViewHandleEventFn;
    updateDirectives: (view: ViewData, checkType: CheckType) => void;
    updateRenderer: (view: ViewData, checkType: CheckType) => void;
    dirtyParentQueries: (view: ViewData) => void;
}
/**
 * This object is used to prevent cycles in the source files and to have a place where
 * debug mode can hook it. It is lazily filled when `isDevMode` is known.
 */
export declare const Services: Services;
