/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Injector } from '../di/injector';
import { ComponentFactory, ComponentRef } from '../linker/component_factory';
import { ComponentFactoryBoundToModule, ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { ElementRef } from '../linker/element_ref';
import { NgModuleRef } from '../linker/ng_module_factory';
import { TemplateRef } from '../linker/template_ref';
import { stringify } from '../util';
import { VERSION } from '../version';
import { callNgModuleLifecycle, initNgModule, resolveNgModuleDep } from './ng_module';
import { Services, asElementData, asProviderData, asTextData } from './types';
import { markParentViewsForCheck, resolveDefinition, rootRenderNodes, splitNamespace, tokenKey, viewParentEl } from './util';
import { attachEmbeddedView, detachEmbeddedView, moveEmbeddedView, renderDetachView } from './view_attach';
var EMPTY_CONTEXT = new Object();
// Attention: this function is called as top level function.
// Putting any logic in here will destroy closure tree shaking!
export function createComponentFactory(selector, componentType, viewDefFactory, inputs, outputs, ngContentSelectors) {
    return new ComponentFactory_(selector, componentType, viewDefFactory, inputs, outputs, ngContentSelectors);
}
export function getComponentViewDefinitionFactory(componentFactory) {
    return componentFactory.viewDefFactory;
}
var ComponentFactory_ = /** @class */ (function (_super) {
    tslib_1.__extends(ComponentFactory_, _super);
    function ComponentFactory_(selector, componentType, viewDefFactory, _inputs, _outputs, ngContentSelectors) {
        var _this = 
        // Attention: this ctor is called as top level function.
        // Putting any logic in here will destroy closure tree shaking!
        _super.call(this) || this;
        _this.selector = selector;
        _this.componentType = componentType;
        _this._inputs = _inputs;
        _this._outputs = _outputs;
        _this.ngContentSelectors = ngContentSelectors;
        _this.viewDefFactory = viewDefFactory;
        return _this;
    }
    Object.defineProperty(ComponentFactory_.prototype, "inputs", {
        get: function () {
            var inputsArr = [];
            var inputs = this._inputs;
            for (var propName in inputs) {
                var templateName = inputs[propName];
                inputsArr.push({ propName: propName, templateName: templateName });
            }
            return inputsArr;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ComponentFactory_.prototype, "outputs", {
        get: function () {
            var outputsArr = [];
            for (var propName in this._outputs) {
                var templateName = this._outputs[propName];
                outputsArr.push({ propName: propName, templateName: templateName });
            }
            return outputsArr;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Creates a new component.
     */
    ComponentFactory_.prototype.create = function (injector, projectableNodes, rootSelectorOrNode, ngModule) {
        if (!ngModule) {
            throw new Error('ngModule should be provided');
        }
        var viewDef = resolveDefinition(this.viewDefFactory);
        var componentNodeIndex = viewDef.nodes[0].element.componentProvider.nodeIndex;
        var view = Services.createRootView(injector, projectableNodes || [], rootSelectorOrNode, viewDef, ngModule, EMPTY_CONTEXT);
        var component = asProviderData(view, componentNodeIndex).instance;
        if (rootSelectorOrNode) {
            view.renderer.setAttribute(asElementData(view, 0).renderElement, 'ng-version', VERSION.full);
        }
        return new ComponentRef_(view, new ViewRef_(view), component);
    };
    return ComponentFactory_;
}(ComponentFactory));
var ComponentRef_ = /** @class */ (function (_super) {
    tslib_1.__extends(ComponentRef_, _super);
    function ComponentRef_(_view, _viewRef, _component) {
        var _this = _super.call(this) || this;
        _this._view = _view;
        _this._viewRef = _viewRef;
        _this._component = _component;
        _this._elDef = _this._view.def.nodes[0];
        _this.hostView = _viewRef;
        _this.changeDetectorRef = _viewRef;
        _this.instance = _component;
        return _this;
    }
    Object.defineProperty(ComponentRef_.prototype, "location", {
        get: function () {
            return new ElementRef(asElementData(this._view, this._elDef.nodeIndex).renderElement);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ComponentRef_.prototype, "injector", {
        get: function () { return new Injector_(this._view, this._elDef); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ComponentRef_.prototype, "componentType", {
        get: function () { return this._component.constructor; },
        enumerable: true,
        configurable: true
    });
    ComponentRef_.prototype.destroy = function () { this._viewRef.destroy(); };
    ComponentRef_.prototype.onDestroy = function (callback) { this._viewRef.onDestroy(callback); };
    return ComponentRef_;
}(ComponentRef));
export function createViewContainerData(view, elDef, elData) {
    return new ViewContainerRef_(view, elDef, elData);
}
var ViewContainerRef_ = /** @class */ (function () {
    function ViewContainerRef_(_view, _elDef, _data) {
        this._view = _view;
        this._elDef = _elDef;
        this._data = _data;
        /**
         * @internal
         */
        this._embeddedViews = [];
    }
    Object.defineProperty(ViewContainerRef_.prototype, "element", {
        get: function () { return new ElementRef(this._data.renderElement); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewContainerRef_.prototype, "injector", {
        get: function () { return new Injector_(this._view, this._elDef); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewContainerRef_.prototype, "parentInjector", {
        /** @deprecated No replacement */
        get: function () {
            var view = this._view;
            var elDef = this._elDef.parent;
            while (!elDef && view) {
                elDef = viewParentEl(view);
                view = view.parent;
            }
            return view ? new Injector_(view, elDef) : new Injector_(this._view, null);
        },
        enumerable: true,
        configurable: true
    });
    ViewContainerRef_.prototype.clear = function () {
        var len = this._embeddedViews.length;
        for (var i = len - 1; i >= 0; i--) {
            var view = detachEmbeddedView(this._data, i);
            Services.destroyView(view);
        }
    };
    ViewContainerRef_.prototype.get = function (index) {
        var view = this._embeddedViews[index];
        if (view) {
            var ref = new ViewRef_(view);
            ref.attachToViewContainerRef(this);
            return ref;
        }
        return null;
    };
    Object.defineProperty(ViewContainerRef_.prototype, "length", {
        get: function () { return this._embeddedViews.length; },
        enumerable: true,
        configurable: true
    });
    ViewContainerRef_.prototype.createEmbeddedView = function (templateRef, context, index) {
        var viewRef = templateRef.createEmbeddedView(context || {});
        this.insert(viewRef, index);
        return viewRef;
    };
    ViewContainerRef_.prototype.createComponent = function (componentFactory, index, injector, projectableNodes, ngModuleRef) {
        var contextInjector = injector || this.parentInjector;
        if (!ngModuleRef && !(componentFactory instanceof ComponentFactoryBoundToModule)) {
            ngModuleRef = contextInjector.get(NgModuleRef);
        }
        var componentRef = componentFactory.create(contextInjector, projectableNodes, undefined, ngModuleRef);
        this.insert(componentRef.hostView, index);
        return componentRef;
    };
    ViewContainerRef_.prototype.insert = function (viewRef, index) {
        if (viewRef.destroyed) {
            throw new Error('Cannot insert a destroyed View in a ViewContainer!');
        }
        var viewRef_ = viewRef;
        var viewData = viewRef_._view;
        attachEmbeddedView(this._view, this._data, index, viewData);
        viewRef_.attachToViewContainerRef(this);
        return viewRef;
    };
    ViewContainerRef_.prototype.move = function (viewRef, currentIndex) {
        if (viewRef.destroyed) {
            throw new Error('Cannot move a destroyed View in a ViewContainer!');
        }
        var previousIndex = this._embeddedViews.indexOf(viewRef._view);
        moveEmbeddedView(this._data, previousIndex, currentIndex);
        return viewRef;
    };
    ViewContainerRef_.prototype.indexOf = function (viewRef) {
        return this._embeddedViews.indexOf(viewRef._view);
    };
    ViewContainerRef_.prototype.remove = function (index) {
        var viewData = detachEmbeddedView(this._data, index);
        if (viewData) {
            Services.destroyView(viewData);
        }
    };
    ViewContainerRef_.prototype.detach = function (index) {
        var view = detachEmbeddedView(this._data, index);
        return view ? new ViewRef_(view) : null;
    };
    return ViewContainerRef_;
}());
export function createChangeDetectorRef(view) {
    return new ViewRef_(view);
}
var ViewRef_ = /** @class */ (function () {
    function ViewRef_(_view) {
        this._view = _view;
        this._viewContainerRef = null;
        this._appRef = null;
    }
    Object.defineProperty(ViewRef_.prototype, "rootNodes", {
        get: function () { return rootRenderNodes(this._view); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewRef_.prototype, "context", {
        get: function () { return this._view.context; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewRef_.prototype, "destroyed", {
        get: function () { return (this._view.state & 128 /* Destroyed */) !== 0; },
        enumerable: true,
        configurable: true
    });
    ViewRef_.prototype.markForCheck = function () { markParentViewsForCheck(this._view); };
    ViewRef_.prototype.detach = function () { this._view.state &= ~4 /* Attached */; };
    ViewRef_.prototype.detectChanges = function () {
        var fs = this._view.root.rendererFactory;
        if (fs.begin) {
            fs.begin();
        }
        try {
            Services.checkAndUpdateView(this._view);
        }
        finally {
            if (fs.end) {
                fs.end();
            }
        }
    };
    ViewRef_.prototype.checkNoChanges = function () { Services.checkNoChangesView(this._view); };
    ViewRef_.prototype.reattach = function () { this._view.state |= 4 /* Attached */; };
    ViewRef_.prototype.onDestroy = function (callback) {
        if (!this._view.disposables) {
            this._view.disposables = [];
        }
        this._view.disposables.push(callback);
    };
    ViewRef_.prototype.destroy = function () {
        if (this._appRef) {
            this._appRef.detachView(this);
        }
        else if (this._viewContainerRef) {
            this._viewContainerRef.detach(this._viewContainerRef.indexOf(this));
        }
        Services.destroyView(this._view);
    };
    ViewRef_.prototype.detachFromAppRef = function () {
        this._appRef = null;
        renderDetachView(this._view);
        Services.dirtyParentQueries(this._view);
    };
    ViewRef_.prototype.attachToAppRef = function (appRef) {
        if (this._viewContainerRef) {
            throw new Error('This view is already attached to a ViewContainer!');
        }
        this._appRef = appRef;
    };
    ViewRef_.prototype.attachToViewContainerRef = function (vcRef) {
        if (this._appRef) {
            throw new Error('This view is already attached directly to the ApplicationRef!');
        }
        this._viewContainerRef = vcRef;
    };
    return ViewRef_;
}());
export { ViewRef_ };
export function createTemplateData(view, def) {
    return new TemplateRef_(view, def);
}
var TemplateRef_ = /** @class */ (function (_super) {
    tslib_1.__extends(TemplateRef_, _super);
    function TemplateRef_(_parentView, _def) {
        var _this = _super.call(this) || this;
        _this._parentView = _parentView;
        _this._def = _def;
        return _this;
    }
    TemplateRef_.prototype.createEmbeddedView = function (context) {
        return new ViewRef_(Services.createEmbeddedView(this._parentView, this._def, this._def.element.template, context));
    };
    Object.defineProperty(TemplateRef_.prototype, "elementRef", {
        get: function () {
            return new ElementRef(asElementData(this._parentView, this._def.nodeIndex).renderElement);
        },
        enumerable: true,
        configurable: true
    });
    return TemplateRef_;
}(TemplateRef));
export function createInjector(view, elDef) {
    return new Injector_(view, elDef);
}
var Injector_ = /** @class */ (function () {
    function Injector_(view, elDef) {
        this.view = view;
        this.elDef = elDef;
    }
    Injector_.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        var allowPrivateServices = this.elDef ? (this.elDef.flags & 33554432 /* ComponentView */) !== 0 : false;
        return Services.resolveDep(this.view, this.elDef, allowPrivateServices, { flags: 0 /* None */, token: token, tokenKey: tokenKey(token) }, notFoundValue);
    };
    return Injector_;
}());
export function nodeValue(view, index) {
    var def = view.def.nodes[index];
    if (def.flags & 1 /* TypeElement */) {
        var elData = asElementData(view, def.nodeIndex);
        return def.element.template ? elData.template : elData.renderElement;
    }
    else if (def.flags & 2 /* TypeText */) {
        return asTextData(view, def.nodeIndex).renderText;
    }
    else if (def.flags & (20224 /* CatProvider */ | 16 /* TypePipe */)) {
        return asProviderData(view, def.nodeIndex).instance;
    }
    throw new Error("Illegal state: read nodeValue for node index " + index);
}
export function createRendererV1(view) {
    return new RendererAdapter(view.renderer);
}
var RendererAdapter = /** @class */ (function () {
    function RendererAdapter(delegate) {
        this.delegate = delegate;
    }
    RendererAdapter.prototype.selectRootElement = function (selectorOrNode) {
        return this.delegate.selectRootElement(selectorOrNode);
    };
    RendererAdapter.prototype.createElement = function (parent, namespaceAndName) {
        var _a = tslib_1.__read(splitNamespace(namespaceAndName), 2), ns = _a[0], name = _a[1];
        var el = this.delegate.createElement(name, ns);
        if (parent) {
            this.delegate.appendChild(parent, el);
        }
        return el;
    };
    RendererAdapter.prototype.createViewRoot = function (hostElement) { return hostElement; };
    RendererAdapter.prototype.createTemplateAnchor = function (parentElement) {
        var comment = this.delegate.createComment('');
        if (parentElement) {
            this.delegate.appendChild(parentElement, comment);
        }
        return comment;
    };
    RendererAdapter.prototype.createText = function (parentElement, value) {
        var node = this.delegate.createText(value);
        if (parentElement) {
            this.delegate.appendChild(parentElement, node);
        }
        return node;
    };
    RendererAdapter.prototype.projectNodes = function (parentElement, nodes) {
        for (var i = 0; i < nodes.length; i++) {
            this.delegate.appendChild(parentElement, nodes[i]);
        }
    };
    RendererAdapter.prototype.attachViewAfter = function (node, viewRootNodes) {
        var parentElement = this.delegate.parentNode(node);
        var nextSibling = this.delegate.nextSibling(node);
        for (var i = 0; i < viewRootNodes.length; i++) {
            this.delegate.insertBefore(parentElement, viewRootNodes[i], nextSibling);
        }
    };
    RendererAdapter.prototype.detachView = function (viewRootNodes) {
        for (var i = 0; i < viewRootNodes.length; i++) {
            var node = viewRootNodes[i];
            var parentElement = this.delegate.parentNode(node);
            this.delegate.removeChild(parentElement, node);
        }
    };
    RendererAdapter.prototype.destroyView = function (hostElement, viewAllNodes) {
        for (var i = 0; i < viewAllNodes.length; i++) {
            this.delegate.destroyNode(viewAllNodes[i]);
        }
    };
    RendererAdapter.prototype.listen = function (renderElement, name, callback) {
        return this.delegate.listen(renderElement, name, callback);
    };
    RendererAdapter.prototype.listenGlobal = function (target, name, callback) {
        return this.delegate.listen(target, name, callback);
    };
    RendererAdapter.prototype.setElementProperty = function (renderElement, propertyName, propertyValue) {
        this.delegate.setProperty(renderElement, propertyName, propertyValue);
    };
    RendererAdapter.prototype.setElementAttribute = function (renderElement, namespaceAndName, attributeValue) {
        var _a = tslib_1.__read(splitNamespace(namespaceAndName), 2), ns = _a[0], name = _a[1];
        if (attributeValue != null) {
            this.delegate.setAttribute(renderElement, name, attributeValue, ns);
        }
        else {
            this.delegate.removeAttribute(renderElement, name, ns);
        }
    };
    RendererAdapter.prototype.setBindingDebugInfo = function (renderElement, propertyName, propertyValue) { };
    RendererAdapter.prototype.setElementClass = function (renderElement, className, isAdd) {
        if (isAdd) {
            this.delegate.addClass(renderElement, className);
        }
        else {
            this.delegate.removeClass(renderElement, className);
        }
    };
    RendererAdapter.prototype.setElementStyle = function (renderElement, styleName, styleValue) {
        if (styleValue != null) {
            this.delegate.setStyle(renderElement, styleName, styleValue);
        }
        else {
            this.delegate.removeStyle(renderElement, styleName);
        }
    };
    RendererAdapter.prototype.invokeElementMethod = function (renderElement, methodName, args) {
        renderElement[methodName].apply(renderElement, args);
    };
    RendererAdapter.prototype.setText = function (renderNode, text) { this.delegate.setValue(renderNode, text); };
    RendererAdapter.prototype.animate = function () { throw new Error('Renderer.animate is no longer supported!'); };
    return RendererAdapter;
}());
export function createNgModuleRef(moduleType, parent, bootstrapComponents, def) {
    return new NgModuleRef_(moduleType, parent, bootstrapComponents, def);
}
var NgModuleRef_ = /** @class */ (function () {
    function NgModuleRef_(_moduleType, _parent, _bootstrapComponents, _def) {
        this._moduleType = _moduleType;
        this._parent = _parent;
        this._bootstrapComponents = _bootstrapComponents;
        this._def = _def;
        this._destroyListeners = [];
        this._destroyed = false;
        this.injector = this;
        initNgModule(this);
    }
    NgModuleRef_.prototype.get = function (token, notFoundValue, injectFlags) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        if (injectFlags === void 0) { injectFlags = 0 /* Default */; }
        var flags = 0 /* None */;
        if (injectFlags & 4 /* SkipSelf */) {
            flags |= 1 /* SkipSelf */;
        }
        else if (injectFlags & 2 /* Self */) {
            flags |= 4 /* Self */;
        }
        return resolveNgModuleDep(this, { token: token, tokenKey: tokenKey(token), flags: flags }, notFoundValue);
    };
    Object.defineProperty(NgModuleRef_.prototype, "instance", {
        get: function () { return this.get(this._moduleType); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NgModuleRef_.prototype, "componentFactoryResolver", {
        get: function () { return this.get(ComponentFactoryResolver); },
        enumerable: true,
        configurable: true
    });
    NgModuleRef_.prototype.destroy = function () {
        if (this._destroyed) {
            throw new Error("The ng module " + stringify(this.instance.constructor) + " has already been destroyed.");
        }
        this._destroyed = true;
        callNgModuleLifecycle(this, 131072 /* OnDestroy */);
        this._destroyListeners.forEach(function (listener) { return listener(); });
    };
    NgModuleRef_.prototype.onDestroy = function (callback) { this._destroyListeners.push(callback); };
    return NgModuleRef_;
}());

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvcmVmcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBSUgsT0FBTyxFQUFjLFFBQVEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxZQUFZLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUMzRSxPQUFPLEVBQUMsNkJBQTZCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUM3RyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDakQsT0FBTyxFQUFzQixXQUFXLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFLbkQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRW5DLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDcEYsT0FBTyxFQUE4RSxRQUFRLEVBQStFLGFBQWEsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3RPLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDM0gsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXpHLElBQU0sYUFBYSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUFFbkMsNERBQTREO0FBQzVELCtE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QWtCLENBQ3JCLElBQUksRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDcEYsQ0FBQztJQUVELHNCQUFJLGtDQUFRO2FBQVosY0FBaUIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBRXJELHNCQUFJLGtEQUF3QjthQUE1QixjQUFpQyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBRTdFLDhCQUFPLEdBQVA7UUFDRSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FDWCxtQkFBaUIsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLGlDQUE4QixDQUFDLENBQUM7U0FDMUY7UUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN2QixxQkFBcUIsQ0FBQyxJQUFJLHlCQUFzQixDQUFDO1FBQ2pELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsVUFBQyxRQUFRLElBQUssT0FBQSxRQUFRLEVBQUUsRUFBVixDQUFVLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsZ0NBQVMsR0FBVCxVQUFVLFFBQW9CLElBQVUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEYsbUJBQUM7QUFBRCxDQUFDLEFBN0NELElBNkNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmfSBmcm9tICcuLi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7SW5qZWN0RmxhZ3MsIEluamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeUJvdW5kVG9Nb2R1bGUsIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7RWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7SW50ZXJuYWxOZ01vZHVsZVJlZiwgTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgSW50ZXJuYWxWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19yZWYnO1xuaW1wb3J0IHtSZW5kZXJlciBhcyBSZW5kZXJlclYxLCBSZW5kZXJlcjJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7VkVSU0lPTn0gZnJvbSAnLi4vdmVyc2lvbic7XG5cbmltcG9ydCB7Y2FsbE5nTW9kdWxlTGlmZWN5Y2xlLCBpbml0TmdNb2R1bGUsIHJlc29sdmVOZ01vZHVsZURlcH0gZnJvbSAnLi9uZ19tb2R1bGUnO1xuaW1wb3J0IHtEZXBGbGFncywgRWxlbWVudERhdGEsIE5nTW9kdWxlRGF0YSwgTmdNb2R1bGVEZWZpbml0aW9uLCBOb2RlRGVmLCBOb2RlRmxhZ3MsIFNlcnZpY2VzLCBUZW1wbGF0ZURhdGEsIFZpZXdDb250YWluZXJEYXRhLCBWaWV3RGF0YSwgVmlld0RlZmluaXRpb25GYWN0b3J5LCBWaWV3U3RhdGUsIGFzRWxlbWVudERhdGEsIGFzUHJvdmlkZXJEYXRhLCBhc1RleHREYXRhfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7bWFya1BhcmVudFZpZXdzRm9yQ2hlY2ssIHJlc29sdmVEZWZpbml0aW9uLCByb290UmVuZGVyTm9kZXMsIHNwbGl0TmFtZXNwYWNlLCB0b2tlbktleSwgdmlld1BhcmVudEVsfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHthdHRhY2hFbWJlZGRlZFZpZXcsIGRldGFjaEVtYmVkZGVkVmlldywgbW92ZUVtYmVkZGVkVmlldywgcmVuZGVyRGV0YWNoVmlld30gZnJvbSAnLi92aWV3X2F0dGFjaCc7XG5cbmNvbnN0IEVNUFRZX0NPTlRFWFQgPSBuZXcgT2JqZWN0KCk7XG5cbi8vIEF0dGVudGlvbjogdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYXMgdG9wIGxldmVsIGZ1bmN0aW9uLlxuLy8gUHV0dGluZyBhbnkgbG9naWMgaW4gaGVyZSB3aWxsIGRlc3Ryb3kgY2xvc3VyZSB0cmVlIHNoYWtpbmchXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29tcG9uZW50RmFjdG9yeShcbiAgICBzZWxlY3Rvcjogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBUeXBlPGFueT4sIHZpZXdEZWZGYWN0b3J5OiBWaWV3RGVmaW5pdGlvbkZhY3RvcnksXG4gICAgaW5wdXRzOiB7W3Byb3BOYW1lOiBzdHJpbmddOiBzdHJpbmd9IHwgbnVsbCwgb3V0cHV0czoge1twcm9wTmFtZTogc3RyaW5nXTogc3RyaW5nfSxcbiAgICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdKTogQ29tcG9uZW50RmFjdG9yeTxhbnk+IHtcbiAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5XyhcbiAgICAgIHNlbGVjdG9yLCBjb21wb25lbnRUeXBlLCB2aWV3RGVmRmFjdG9yeSwgaW5wdXRzLCBvdXRwdXRzLCBuZ0NvbnRlbnRTZWxlY3RvcnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50Vmlld0RlZmluaXRpb25GYWN0b3J5KGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55Pik6XG4gICAgVmlld0RlZmluaXRpb25GYWN0b3J5IHtcbiAgcmV0dXJuIChjb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnlfKS52aWV3RGVmRmFjdG9yeTtcbn1cblxuY2xhc3MgQ29tcG9uZW50RmFjdG9yeV8gZXh0ZW5kcyBDb21wb25lbnRGYWN0b3J5PGFueT4ge1xuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICB2aWV3RGVmRmFjdG9yeTogVmlld0RlZmluaXRpb25GYWN0b3J5O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHNlbGVjdG9yOiBzdHJpbmcsIHB1YmxpYyBjb21wb25lbnRUeXBlOiBUeXBlPGFueT4sXG4gICAgICB2aWV3RGVmRmFjdG9yeTogVmlld0RlZmluaXRpb25GYWN0b3J5LCBwcml2YXRlIF9pbnB1dHM6IHtbcHJvcE5hbWU6IHN0cmluZ106IHN0cmluZ318bnVsbCxcbiAgICAgIHByaXZhdGUgX291dHB1dHM6IHtbcHJvcE5hbWU6IHN0cmluZ106IHN0cmluZ30sIHB1YmxpYyBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdKSB7XG4gICAgLy8gQXR0ZW50aW9uOiB0aGlzIGN0b3IgaXMgY2FsbGVkIGFzIHRvcCBsZXZlbCBmdW5jdGlvbi5cbiAgICAvLyBQdXR0aW5nIGFueSBsb2dpYyBpbiBoZXJlIHdpbGwgZGVzdHJveSBjbG9zdXJlIHRyZWUgc2hha2luZyFcbiAgICBzdXBlcigpO1xuICAgIHRoaXMudmlld0RlZkZhY3RvcnkgPSB2aWV3RGVmRmFjdG9yeTtcbiAgfVxuXG4gIGdldCBpbnB1dHMoKSB7XG4gICAgY29uc3QgaW5wdXRzQXJyOiB7cHJvcE5hbWU6IHN0cmluZywgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W10gPSBbXTtcbiAgICBjb25zdCBpbnB1dHMgPSB0aGlzLl9pbnB1dHMgITtcbiAgICBmb3IgKGxldCBwcm9wTmFtZSBpbiBpbnB1dHMpIHtcbiAgICAgIGNvbnN0IHRlbXBsYXRlTmFtZSA9IGlucHV0c1twcm9wTmFtZV07XG4gICAgICBpbnB1dHNBcnIucHVzaCh7cHJvcE5hbWUsIHRlbXBsYXRlTmFtZX0pO1xuICAgIH1cbiAgICByZXR1cm4gaW5wdXRzQXJyO1xuICB9XG5cbiAgZ2V0IG91dHB1dHMoKSB7XG4gICAgY29uc3Qgb3V0cHV0c0Fycjoge3Byb3BOYW1lOiBzdHJpbmcsIHRlbXBsYXRlTmFtZTogc3RyaW5nfVtdID0gW107XG4gICAgZm9yIChsZXQgcHJvcE5hbWUgaW4gdGhpcy5fb3V0cHV0cykge1xuICAgICAgY29uc3QgdGVtcGxhdGVOYW1lID0gdGhpcy5fb3V0cHV0c1twcm9wTmFtZV07XG4gICAgICBvdXRwdXRzQXJyLnB1c2goe3Byb3BOYW1lLCB0ZW1wbGF0ZU5hbWV9KTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dHNBcnI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjb21wb25lbnQuXG4gICAqL1xuICBjcmVhdGUoXG4gICAgICBpbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdLCByb290U2VsZWN0b3JPck5vZGU/OiBzdHJpbmd8YW55LFxuICAgICAgbmdNb2R1bGU/OiBOZ01vZHVsZVJlZjxhbnk+KTogQ29tcG9uZW50UmVmPGFueT4ge1xuICAgIGlmICghbmdNb2R1bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbmdNb2R1bGUgc2hvdWxkIGJlIHByb3ZpZGVkJyk7XG4gICAgfVxuICAgIGNvbnN0IHZpZXdEZWYgPSByZXNvbHZlRGVmaW5pdGlvbih0aGlzLnZpZXdEZWZGYWN0b3J5KTtcbiAgICBjb25zdCBjb21wb25lbnROb2RlSW5kZXggPSB2aWV3RGVmLm5vZGVzWzBdLmVsZW1lbnQgIS5jb21wb25lbnRQcm92aWRlciAhLm5vZGVJbmRleDtcbiAgICBjb25zdCB2aWV3ID0gU2VydmljZXMuY3JlYXRlUm9vdFZpZXcoXG4gICAgICAgIGluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzIHx8IFtdLCByb290U2VsZWN0b3JPck5vZGUsIHZpZXdEZWYsIG5nTW9kdWxlLCBFTVBUWV9DT05URVhUKTtcbiAgICBjb25zdCBjb21wb25lbnQgPSBhc1Byb3ZpZGVyRGF0YSh2aWV3LCBjb21wb25lbnROb2RlSW5kZXgpLmluc3RhbmNlO1xuICAgIGlmIChyb290U2VsZWN0b3JPck5vZGUpIHtcbiAgICAgIHZpZXcucmVuZGVyZXIuc2V0QXR0cmlidXRlKGFzRWxlbWVudERhdGEodmlldywgMCkucmVuZGVyRWxlbWVudCwgJ25nLXZlcnNpb24nLCBWRVJTSU9OLmZ1bGwpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQ29tcG9uZW50UmVmXyh2aWV3LCBuZXcgVmlld1JlZl8odmlldyksIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuY2xhc3MgQ29tcG9uZW50UmVmXyBleHRlbmRzIENvbXBvbmVudFJlZjxhbnk+IHtcbiAgcHVibGljIHJlYWRvbmx5IGhvc3RWaWV3OiBWaWV3UmVmO1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2U6IGFueTtcbiAgcHVibGljIHJlYWRvbmx5IGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZjtcbiAgcHJpdmF0ZSBfZWxEZWY6IE5vZGVEZWY7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3ZpZXc6IFZpZXdEYXRhLCBwcml2YXRlIF92aWV3UmVmOiBWaWV3UmVmLCBwcml2YXRlIF9jb21wb25lbnQ6IGFueSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fZWxEZWYgPSB0aGlzLl92aWV3LmRlZi5ub2Rlc1swXTtcbiAgICB0aGlzLmhvc3RWaWV3ID0gX3ZpZXdSZWY7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IF92aWV3UmVmO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBfY29tcG9uZW50O1xuICB9XG4gIGdldCBsb2NhdGlvbigpOiBFbGVtZW50UmVmIHtcbiAgICByZXR1cm4gbmV3IEVsZW1lbnRSZWYoYXNFbGVtZW50RGF0YSh0aGlzLl92aWV3LCB0aGlzLl9lbERlZi5ub2RlSW5kZXgpLnJlbmRlckVsZW1lbnQpO1xuICB9XG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBuZXcgSW5qZWN0b3JfKHRoaXMuX3ZpZXcsIHRoaXMuX2VsRGVmKTsgfVxuICBnZXQgY29tcG9uZW50VHlwZSgpOiBUeXBlPGFueT4geyByZXR1cm4gPGFueT50aGlzLl9jb21wb25lbnQuY29uc3RydWN0b3I7IH1cblxuICBkZXN0cm95KCk6IHZvaWQgeyB0aGlzLl92aWV3UmVmLmRlc3Ryb3koKTsgfVxuICBvbkRlc3Ryb3koY2FsbGJhY2s6IEZ1bmN0aW9uKTogdm9pZCB7IHRoaXMuX3ZpZXdSZWYub25EZXN0cm95KGNhbGxiYWNrKTsgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlld0NvbnRhaW5lckRhdGEoXG4gICAgdmlldzogVmlld0RhdGEsIGVsRGVmOiBOb2RlRGVmLCBlbERhdGE6IEVsZW1lbnREYXRhKTogVmlld0NvbnRhaW5lckRhdGEge1xuICByZXR1cm4gbmV3IFZpZXdDb250YWluZXJSZWZfKHZpZXcsIGVsRGVmLCBlbERhdGEpO1xufVxuXG5jbGFzcyBWaWV3Q29udGFpbmVyUmVmXyBpbXBsZW1lbnRzIFZpZXdDb250YWluZXJEYXRhIHtcbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2VtYmVkZGVkVmlld3M6IFZpZXdEYXRhW10gPSBbXTtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfdmlldzogVmlld0RhdGEsIHByaXZhdGUgX2VsRGVmOiBOb2RlRGVmLCBwcml2YXRlIF9kYXRhOiBFbGVtZW50RGF0YSkge31cblxuICBnZXQgZWxlbWVudCgpOiBFbGVtZW50UmVmIHsgcmV0dXJuIG5ldyBFbGVtZW50UmVmKHRoaXMuX2RhdGEucmVuZGVyRWxlbWVudCk7IH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gbmV3IEluamVjdG9yXyh0aGlzLl92aWV3LCB0aGlzLl9lbERlZik7IH1cblxuICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBsZXQgdmlldyA9IHRoaXMuX3ZpZXc7XG4gICAgbGV0IGVsRGVmID0gdGhpcy5fZWxEZWYucGFyZW50O1xuICAgIHdoaWxlICghZWxEZWYgJiYgdmlldykge1xuICAgICAgZWxEZWYgPSB2aWV3UGFyZW50RWwodmlldyk7XG4gICAgICB2aWV3ID0gdmlldy5wYXJlbnQgITtcbiAgICB9XG5cbiAgICByZXR1cm4gdmlldyA/IG5ldyBJbmplY3Rvcl8odmlldywgZWxEZWYpIDogbmV3IEluamVjdG9yXyh0aGlzLl92aWV3LCBudWxsKTtcbiAgfVxuXG4gIGNsZWFyKCk6IHZvaWQge1xuICAgIGNvbnN0IGxlbiA9IHRoaXMuX2VtYmVkZGVkVmlld3MubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSBsZW4gLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3QgdmlldyA9IGRldGFjaEVtYmVkZGVkVmlldyh0aGlzLl9kYXRhLCBpKSAhO1xuICAgICAgU2VydmljZXMuZGVzdHJveVZpZXcodmlldyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0KGluZGV4OiBudW1iZXIpOiBWaWV3UmVmfG51bGwge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLl9lbWJlZGRlZFZpZXdzW2luZGV4XTtcbiAgICBpZiAodmlldykge1xuICAgICAgY29uc3QgcmVmID0gbmV3IFZpZXdSZWZfKHZpZXcpO1xuICAgICAgcmVmLmF0dGFjaFRvVmlld0NvbnRhaW5lclJlZih0aGlzKTtcbiAgICAgIHJldHVybiByZWY7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fZW1iZWRkZWRWaWV3cy5sZW5ndGg7IH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgRW1iZWRkZWRWaWV3UmVmPEM+IHtcbiAgICBjb25zdCB2aWV3UmVmID0gdGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQgfHwgPGFueT57fSk7XG4gICAgdGhpcy5pbnNlcnQodmlld1JlZiwgaW5kZXgpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXIsIGluamVjdG9yPzogSW5qZWN0b3IsXG4gICAgICBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXSwgbmdNb2R1bGVSZWY/OiBOZ01vZHVsZVJlZjxhbnk+KTogQ29tcG9uZW50UmVmPEM+IHtcbiAgICBjb25zdCBjb250ZXh0SW5qZWN0b3IgPSBpbmplY3RvciB8fCB0aGlzLnBhcmVudEluamVjdG9yO1xuICAgIGlmICghbmdNb2R1bGVSZWYgJiYgIShjb21wb25lbnRGYWN0b3J5IGluc3RhbmNlb2YgQ29tcG9uZW50RmFjdG9yeUJvdW5kVG9Nb2R1bGUpKSB7XG4gICAgICBuZ01vZHVsZVJlZiA9IGNvbnRleHRJbmplY3Rvci5nZXQoTmdNb2R1bGVSZWYpO1xuICAgIH1cbiAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjb250ZXh0SW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIHVuZGVmaW5lZCwgbmdNb2R1bGVSZWYpO1xuICAgIHRoaXMuaW5zZXJ0KGNvbXBvbmVudFJlZi5ob3N0VmlldywgaW5kZXgpO1xuICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gIH1cblxuICBpbnNlcnQodmlld1JlZjogVmlld1JlZiwgaW5kZXg/OiBudW1iZXIpOiBWaWV3UmVmIHtcbiAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc2VydCBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgY29uc3Qgdmlld1JlZl8gPSA8Vmlld1JlZl8+dmlld1JlZjtcbiAgICBjb25zdCB2aWV3RGF0YSA9IHZpZXdSZWZfLl92aWV3O1xuICAgIGF0dGFjaEVtYmVkZGVkVmlldyh0aGlzLl92aWV3LCB0aGlzLl9kYXRhLCBpbmRleCwgdmlld0RhdGEpO1xuICAgIHZpZXdSZWZfLmF0dGFjaFRvVmlld0NvbnRhaW5lclJlZih0aGlzKTtcbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIG1vdmUodmlld1JlZjogVmlld1JlZl8sIGN1cnJlbnRJbmRleDogbnVtYmVyKTogVmlld1JlZiB7XG4gICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBtb3ZlIGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgIH1cbiAgICBjb25zdCBwcmV2aW91c0luZGV4ID0gdGhpcy5fZW1iZWRkZWRWaWV3cy5pbmRleE9mKHZpZXdSZWYuX3ZpZXcpO1xuICAgIG1vdmVFbWJlZGRlZFZpZXcodGhpcy5fZGF0YSwgcHJldmlvdXNJbmRleCwgY3VycmVudEluZGV4KTtcbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIGluZGV4T2Yodmlld1JlZjogVmlld1JlZik6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2VtYmVkZGVkVmlld3MuaW5kZXhPZigoPFZpZXdSZWZfPnZpZXdSZWYpLl92aWV3KTtcbiAgfVxuXG4gIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IHZpZXdEYXRhID0gZGV0YWNoRW1iZWRkZWRWaWV3KHRoaXMuX2RhdGEsIGluZGV4KTtcbiAgICBpZiAodmlld0RhdGEpIHtcbiAgICAgIFNlcnZpY2VzLmRlc3Ryb3lWaWV3KHZpZXdEYXRhKTtcbiAgICB9XG4gIH1cblxuICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiBWaWV3UmVmfG51bGwge1xuICAgIGNvbnN0IHZpZXcgPSBkZXRhY2hFbWJlZGRlZFZpZXcodGhpcy5fZGF0YSwgaW5kZXgpO1xuICAgIHJldHVybiB2aWV3ID8gbmV3IFZpZXdSZWZfKHZpZXcpIDogbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYodmlldzogVmlld0RhdGEpOiBDaGFuZ2VEZXRlY3RvclJlZiB7XG4gIHJldHVybiBuZXcgVmlld1JlZl8odmlldyk7XG59XG5cbmV4cG9ydCBjbGFzcyBWaWV3UmVmXyBpbXBsZW1lbnRzIEVtYmVkZGVkVmlld1JlZjxhbnk+LCBJbnRlcm5hbFZpZXdSZWYge1xuICAvKiogQGludGVybmFsICovXG4gIF92aWV3OiBWaWV3RGF0YTtcbiAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZnxudWxsO1xuICBwcml2YXRlIF9hcHBSZWY6IEFwcGxpY2F0aW9uUmVmfG51bGw7XG5cbiAgY29uc3RydWN0b3IoX3ZpZXc6IFZpZXdEYXRhKSB7XG4gICAgdGhpcy5fdmlldyA9IF92aWV3O1xuICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYgPSBudWxsO1xuICAgIHRoaXMuX2FwcFJlZiA9IG51bGw7XG4gIH1cblxuICBnZXQgcm9vdE5vZGVzKCk6IGFueVtdIHsgcmV0dXJuIHJvb3RSZW5kZXJOb2Rlcyh0aGlzLl92aWV3KTsgfVxuXG4gIGdldCBjb250ZXh0KCkgeyByZXR1cm4gdGhpcy5fdmlldy5jb250ZXh0OyB9XG5cbiAgZ2V0IGRlc3Ryb3llZCgpOiBib29sZWFuIHsgcmV0dXJuICh0aGlzLl92aWV3LnN0YXRlICYgVmlld1N0YXRlLkRlc3Ryb3llZCkgIT09IDA7IH1cblxuICBtYXJrRm9yQ2hlY2soKTogdm9pZCB7IG1hcmtQYXJlbnRWaWV3c0ZvckNoZWNrKHRoaXMuX3ZpZXcpOyB9XG4gIGRldGFjaCgpOiB2b2lkIHsgdGhpcy5fdmlldy5zdGF0ZSAmPSB+Vmlld1N0YXRlLkF0dGFjaGVkOyB9XG4gIGRldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgY29uc3QgZnMgPSB0aGlzLl92aWV3LnJvb3QucmVuZGVyZXJGYWN0b3J5O1xuICAgIGlmIChmcy5iZWdpbikge1xuICAgICAgZnMuYmVnaW4oKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIFNlcnZpY2VzLmNoZWNrQW5kVXBkYXRlVmlldyh0aGlzLl92aWV3KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGZzLmVuZCkge1xuICAgICAgICBmcy5lbmQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY2hlY2tOb0NoYW5nZXMoKTogdm9pZCB7IFNlcnZpY2VzLmNoZWNrTm9DaGFuZ2VzVmlldyh0aGlzLl92aWV3KTsgfVxuXG4gIHJlYXR0YWNoKCk6IHZvaWQgeyB0aGlzLl92aWV3LnN0YXRlIHw9IFZpZXdTdGF0ZS5BdHRhY2hlZDsgfVxuICBvbkRlc3Ryb3koY2FsbGJhY2s6IEZ1bmN0aW9uKSB7XG4gICAgaWYgKCF0aGlzLl92aWV3LmRpc3Bvc2FibGVzKSB7XG4gICAgICB0aGlzLl92aWV3LmRpc3Bvc2FibGVzID0gW107XG4gICAgfVxuICAgIHRoaXMuX3ZpZXcuZGlzcG9zYWJsZXMucHVzaCg8YW55PmNhbGxiYWNrKTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX2FwcFJlZikge1xuICAgICAgdGhpcy5fYXBwUmVmLmRldGFjaFZpZXcodGhpcyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl92aWV3Q29udGFpbmVyUmVmKSB7XG4gICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmRldGFjaCh0aGlzLl92aWV3Q29udGFpbmVyUmVmLmluZGV4T2YodGhpcykpO1xuICAgIH1cbiAgICBTZXJ2aWNlcy5kZXN0cm95Vmlldyh0aGlzLl92aWV3KTtcbiAgfVxuXG4gIGRldGFjaEZyb21BcHBSZWYoKSB7XG4gICAgdGhpcy5fYXBwUmVmID0gbnVsbDtcbiAgICByZW5kZXJEZXRhY2hWaWV3KHRoaXMuX3ZpZXcpO1xuICAgIFNlcnZpY2VzLmRpcnR5UGFyZW50UXVlcmllcyh0aGlzLl92aWV3KTtcbiAgfVxuXG4gIGF0dGFjaFRvQXBwUmVmKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHtcbiAgICBpZiAodGhpcy5fdmlld0NvbnRhaW5lclJlZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCB0byBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgfVxuICAgIHRoaXMuX2FwcFJlZiA9IGFwcFJlZjtcbiAgfVxuXG4gIGF0dGFjaFRvVmlld0NvbnRhaW5lclJlZih2Y1JlZjogVmlld0NvbnRhaW5lclJlZikge1xuICAgIGlmICh0aGlzLl9hcHBSZWYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhpcyB2aWV3IGlzIGFscmVhZHkgYXR0YWNoZWQgZGlyZWN0bHkgdG8gdGhlIEFwcGxpY2F0aW9uUmVmIScpO1xuICAgIH1cbiAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmID0gdmNSZWY7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRlbXBsYXRlRGF0YSh2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmKTogVGVtcGxhdGVEYXRhIHtcbiAgcmV0dXJuIG5ldyBUZW1wbGF0ZVJlZl8odmlldywgZGVmKTtcbn1cblxuY2xhc3MgVGVtcGxhdGVSZWZfIGV4dGVuZHMgVGVtcGxhdGVSZWY8YW55PiBpbXBsZW1lbnRzIFRlbXBsYXRlRGF0YSB7XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBfcHJvamVjdGVkVmlld3MgITogVmlld0RhdGFbXTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9wYXJlbnRWaWV3OiBWaWV3RGF0YSwgcHJpdmF0ZSBfZGVmOiBOb2RlRGVmKSB7IHN1cGVyKCk7IH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dDogYW55KTogRW1iZWRkZWRWaWV3UmVmPGFueT4ge1xuICAgIHJldHVybiBuZXcgVmlld1JlZl8oU2VydmljZXMuY3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgICAgICB0aGlzLl9wYXJlbnRWaWV3LCB0aGlzLl9kZWYsIHRoaXMuX2RlZi5lbGVtZW50ICEudGVtcGxhdGUgISwgY29udGV4dCkpO1xuICB9XG5cbiAgZ2V0IGVsZW1lbnRSZWYoKTogRWxlbWVudFJlZiB7XG4gICAgcmV0dXJuIG5ldyBFbGVtZW50UmVmKGFzRWxlbWVudERhdGEodGhpcy5fcGFyZW50VmlldywgdGhpcy5fZGVmLm5vZGVJbmRleCkucmVuZGVyRWxlbWVudCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUluamVjdG9yKHZpZXc6IFZpZXdEYXRhLCBlbERlZjogTm9kZURlZik6IEluamVjdG9yIHtcbiAgcmV0dXJuIG5ldyBJbmplY3Rvcl8odmlldywgZWxEZWYpO1xufVxuXG5jbGFzcyBJbmplY3Rvcl8gaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdmlldzogVmlld0RhdGEsIHByaXZhdGUgZWxEZWY6IE5vZGVEZWZ8bnVsbCkge31cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgY29uc3QgYWxsb3dQcml2YXRlU2VydmljZXMgPVxuICAgICAgICB0aGlzLmVsRGVmID8gKHRoaXMuZWxEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50VmlldykgIT09IDAgOiBmYWxzZTtcbiAgICByZXR1cm4gU2VydmljZXMucmVzb2x2ZURlcChcbiAgICAgICAgdGhpcy52aWV3LCB0aGlzLmVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcyxcbiAgICAgICAge2ZsYWdzOiBEZXBGbGFncy5Ob25lLCB0b2tlbiwgdG9rZW5LZXk6IHRva2VuS2V5KHRva2VuKX0sIG5vdEZvdW5kVmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub2RlVmFsdWUodmlldzogVmlld0RhdGEsIGluZGV4OiBudW1iZXIpOiBhbnkge1xuICBjb25zdCBkZWYgPSB2aWV3LmRlZi5ub2Rlc1tpbmRleF07XG4gIGlmIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpIHtcbiAgICBjb25zdCBlbERhdGEgPSBhc0VsZW1lbnREYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpO1xuICAgIHJldHVybiBkZWYuZWxlbWVudCAhLnRlbXBsYXRlID8gZWxEYXRhLnRlbXBsYXRlIDogZWxEYXRhLnJlbmRlckVsZW1lbnQ7XG4gIH0gZWxzZSBpZiAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVUZXh0KSB7XG4gICAgcmV0dXJuIGFzVGV4dERhdGEodmlldywgZGVmLm5vZGVJbmRleCkucmVuZGVyVGV4dDtcbiAgfSBlbHNlIGlmIChkZWYuZmxhZ3MgJiAoTm9kZUZsYWdzLkNhdFByb3ZpZGVyIHwgTm9kZUZsYWdzLlR5cGVQaXBlKSkge1xuICAgIHJldHVybiBhc1Byb3ZpZGVyRGF0YSh2aWV3LCBkZWYubm9kZUluZGV4KS5pbnN0YW5jZTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYElsbGVnYWwgc3RhdGU6IHJlYWQgbm9kZVZhbHVlIGZvciBub2RlIGluZGV4ICR7aW5kZXh9YCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZW5kZXJlclYxKHZpZXc6IFZpZXdEYXRhKTogUmVuZGVyZXJWMSB7XG4gIHJldHVybiBuZXcgUmVuZGVyZXJBZGFwdGVyKHZpZXcucmVuZGVyZXIpO1xufVxuXG5jbGFzcyBSZW5kZXJlckFkYXB0ZXIgaW1wbGVtZW50cyBSZW5kZXJlclYxIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBkZWxlZ2F0ZTogUmVuZGVyZXIyKSB7fVxuICBzZWxlY3RSb290RWxlbWVudChzZWxlY3Rvck9yTm9kZTogc3RyaW5nfEVsZW1lbnQpOiBFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5zZWxlY3RSb290RWxlbWVudChzZWxlY3Rvck9yTm9kZSk7XG4gIH1cblxuICBjcmVhdGVFbGVtZW50KHBhcmVudDogRWxlbWVudHxEb2N1bWVudEZyYWdtZW50LCBuYW1lc3BhY2VBbmROYW1lOiBzdHJpbmcpOiBFbGVtZW50IHtcbiAgICBjb25zdCBbbnMsIG5hbWVdID0gc3BsaXROYW1lc3BhY2UobmFtZXNwYWNlQW5kTmFtZSk7XG4gICAgY29uc3QgZWwgPSB0aGlzLmRlbGVnYXRlLmNyZWF0ZUVsZW1lbnQobmFtZSwgbnMpO1xuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuYXBwZW5kQ2hpbGQocGFyZW50LCBlbCk7XG4gICAgfVxuICAgIHJldHVybiBlbDtcbiAgfVxuXG4gIGNyZWF0ZVZpZXdSb290KGhvc3RFbGVtZW50OiBFbGVtZW50KTogRWxlbWVudHxEb2N1bWVudEZyYWdtZW50IHsgcmV0dXJuIGhvc3RFbGVtZW50OyB9XG5cbiAgY3JlYXRlVGVtcGxhdGVBbmNob3IocGFyZW50RWxlbWVudDogRWxlbWVudHxEb2N1bWVudEZyYWdtZW50KTogQ29tbWVudCB7XG4gICAgY29uc3QgY29tbWVudCA9IHRoaXMuZGVsZWdhdGUuY3JlYXRlQ29tbWVudCgnJyk7XG4gICAgaWYgKHBhcmVudEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuYXBwZW5kQ2hpbGQocGFyZW50RWxlbWVudCwgY29tbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBjb21tZW50O1xuICB9XG5cbiAgY3JlYXRlVGV4dChwYXJlbnRFbGVtZW50OiBFbGVtZW50fERvY3VtZW50RnJhZ21lbnQsIHZhbHVlOiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLmRlbGVnYXRlLmNyZWF0ZVRleHQodmFsdWUpO1xuICAgIGlmIChwYXJlbnRFbGVtZW50KSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmFwcGVuZENoaWxkKHBhcmVudEVsZW1lbnQsIG5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIHByb2plY3ROb2RlcyhwYXJlbnRFbGVtZW50OiBFbGVtZW50fERvY3VtZW50RnJhZ21lbnQsIG5vZGVzOiBOb2RlW10pIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmFwcGVuZENoaWxkKHBhcmVudEVsZW1lbnQsIG5vZGVzW2ldKTtcbiAgICB9XG4gIH1cblxuICBhdHRhY2hWaWV3QWZ0ZXIobm9kZTogTm9kZSwgdmlld1Jvb3ROb2RlczogTm9kZVtdKSB7XG4gICAgY29uc3QgcGFyZW50RWxlbWVudCA9IHRoaXMuZGVsZWdhdGUucGFyZW50Tm9kZShub2RlKTtcbiAgICBjb25zdCBuZXh0U2libGluZyA9IHRoaXMuZGVsZWdhdGUubmV4dFNpYmxpbmcobm9kZSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3Um9vdE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmluc2VydEJlZm9yZShwYXJlbnRFbGVtZW50LCB2aWV3Um9vdE5vZGVzW2ldLCBuZXh0U2libGluZyk7XG4gICAgfVxuICB9XG5cbiAgZGV0YWNoVmlldyh2aWV3Um9vdE5vZGVzOiAoRWxlbWVudHxUZXh0fENvbW1lbnQpW10pIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdSb290Tm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGUgPSB2aWV3Um9vdE5vZGVzW2ldO1xuICAgICAgY29uc3QgcGFyZW50RWxlbWVudCA9IHRoaXMuZGVsZWdhdGUucGFyZW50Tm9kZShub2RlKTtcbiAgICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlQ2hpbGQocGFyZW50RWxlbWVudCwgbm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZGVzdHJveVZpZXcoaG9zdEVsZW1lbnQ6IEVsZW1lbnR8RG9jdW1lbnRGcmFnbWVudCwgdmlld0FsbE5vZGVzOiBOb2RlW10pIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdBbGxOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5kZXN0cm95Tm9kZSAhKHZpZXdBbGxOb2Rlc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgbGlzdGVuKHJlbmRlckVsZW1lbnQ6IGFueSwgbmFtZTogc3RyaW5nLCBjYWxsYmFjazogRnVuY3Rpb24pOiBGdW5jdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUubGlzdGVuKHJlbmRlckVsZW1lbnQsIG5hbWUsIDxhbnk+Y2FsbGJhY2spO1xuICB9XG5cbiAgbGlzdGVuR2xvYmFsKHRhcmdldDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbik6IEZ1bmN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5saXN0ZW4odGFyZ2V0LCBuYW1lLCA8YW55PmNhbGxiYWNrKTtcbiAgfVxuXG4gIHNldEVsZW1lbnRQcm9wZXJ0eShcbiAgICAgIHJlbmRlckVsZW1lbnQ6IEVsZW1lbnR8RG9jdW1lbnRGcmFnbWVudCwgcHJvcGVydHlOYW1lOiBzdHJpbmcsIHByb3BlcnR5VmFsdWU6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuZGVsZWdhdGUuc2V0UHJvcGVydHkocmVuZGVyRWxlbWVudCwgcHJvcGVydHlOYW1lLCBwcm9wZXJ0eVZhbHVlKTtcbiAgfVxuXG4gIHNldEVsZW1lbnRBdHRyaWJ1dGUocmVuZGVyRWxlbWVudDogRWxlbWVudCwgbmFtZXNwYWNlQW5kTmFtZTogc3RyaW5nLCBhdHRyaWJ1dGVWYWx1ZT86IHN0cmluZyk6XG4gICAgICB2b2lkIHtcbiAgICBjb25zdCBbbnMsIG5hbWVdID0gc3BsaXROYW1lc3BhY2UobmFtZXNwYWNlQW5kTmFtZSk7XG4gICAgaWYgKGF0dHJpYnV0ZVZhbHVlICE9IG51bGwpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuc2V0QXR0cmlidXRlKHJlbmRlckVsZW1lbnQsIG5hbWUsIGF0dHJpYnV0ZVZhbHVlLCBucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlQXR0cmlidXRlKHJlbmRlckVsZW1lbnQsIG5hbWUsIG5zKTtcbiAgICB9XG4gIH1cblxuICBzZXRCaW5kaW5nRGVidWdJbmZvKHJlbmRlckVsZW1lbnQ6IEVsZW1lbnQsIHByb3BlcnR5TmFtZTogc3RyaW5nLCBwcm9wZXJ0eVZhbHVlOiBzdHJpbmcpOiB2b2lkIHt9XG5cbiAgc2V0RWxlbWVudENsYXNzKHJlbmRlckVsZW1lbnQ6IEVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nLCBpc0FkZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmIChpc0FkZCkge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5hZGRDbGFzcyhyZW5kZXJFbGVtZW50LCBjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZUNsYXNzKHJlbmRlckVsZW1lbnQsIGNsYXNzTmFtZSk7XG4gICAgfVxuICB9XG5cbiAgc2V0RWxlbWVudFN0eWxlKHJlbmRlckVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzdHlsZU5hbWU6IHN0cmluZywgc3R5bGVWYWx1ZT86IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChzdHlsZVZhbHVlICE9IG51bGwpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuc2V0U3R5bGUocmVuZGVyRWxlbWVudCwgc3R5bGVOYW1lLCBzdHlsZVZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVTdHlsZShyZW5kZXJFbGVtZW50LCBzdHlsZU5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIGludm9rZUVsZW1lbnRNZXRob2QocmVuZGVyRWxlbWVudDogRWxlbWVudCwgbWV0aG9kTmFtZTogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IHZvaWQge1xuICAgIChyZW5kZXJFbGVtZW50IGFzIGFueSlbbWV0aG9kTmFtZV0uYXBwbHkocmVuZGVyRWxlbWVudCwgYXJncyk7XG4gIH1cblxuICBzZXRUZXh0KHJlbmRlck5vZGU6IFRleHQsIHRleHQ6IHN0cmluZyk6IHZvaWQgeyB0aGlzLmRlbGVnYXRlLnNldFZhbHVlKHJlbmRlck5vZGUsIHRleHQpOyB9XG5cbiAgYW5pbWF0ZSgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ1JlbmRlcmVyLmFuaW1hdGUgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCEnKTsgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOZ01vZHVsZVJlZihcbiAgICBtb2R1bGVUeXBlOiBUeXBlPGFueT4sIHBhcmVudDogSW5qZWN0b3IsIGJvb3RzdHJhcENvbXBvbmVudHM6IFR5cGU8YW55PltdLFxuICAgIGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gIHJldHVybiBuZXcgTmdNb2R1bGVSZWZfKG1vZHVsZVR5cGUsIHBhcmVudCwgYm9vdHN0cmFwQ29tcG9uZW50cywgZGVmKTtcbn1cblxuY2xhc3MgTmdNb2R1bGVSZWZfIGltcGxlbWVudHMgTmdNb2R1bGVEYXRhLCBJbnRlcm5hbE5nTW9kdWxlUmVmPGFueT4ge1xuICBwcml2YXRlIF9kZXN0cm95TGlzdGVuZXJzOiAoKCkgPT4gdm9pZClbXSA9IFtdO1xuICBwcml2YXRlIF9kZXN0cm95ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgX3Byb3ZpZGVycyAhOiBhbnlbXTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgX21vZHVsZXMgITogYW55W107XG5cbiAgcmVhZG9ubHkgaW5qZWN0b3I6IEluamVjdG9yID0gdGhpcztcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX21vZHVsZVR5cGU6IFR5cGU8YW55PiwgcHVibGljIF9wYXJlbnQ6IEluamVjdG9yLFxuICAgICAgcHVibGljIF9ib290c3RyYXBDb21wb25lbnRzOiBUeXBlPGFueT5bXSwgcHVibGljIF9kZWY6IE5nTW9kdWxlRGVmaW5pdGlvbikge1xuICAgIGluaXROZ01vZHVsZSh0aGlzKTtcbiAgfVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBpbmplY3RGbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICBsZXQgZmxhZ3MgPSBEZXBGbGFncy5Ob25lO1xuICAgIGlmIChpbmplY3RGbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSB7XG4gICAgICBmbGFncyB8PSBEZXBGbGFncy5Ta2lwU2VsZjtcbiAgICB9IGVsc2UgaWYgKGluamVjdEZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikge1xuICAgICAgZmxhZ3MgfD0gRGVwRmxhZ3MuU2VsZjtcbiAgICB9XG4gICAgcmV0dXJuIHJlc29sdmVOZ01vZHVsZURlcChcbiAgICAgICAgdGhpcywge3Rva2VuOiB0b2tlbiwgdG9rZW5LZXk6IHRva2VuS2V5KHRva2VuKSwgZmxhZ3M6IGZsYWdzfSwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICBnZXQgaW5zdGFuY2UoKSB7IHJldHVybiB0aGlzLmdldCh0aGlzLl9tb2R1bGVUeXBlKTsgfVxuXG4gIGdldCBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKSB7IHJldHVybiB0aGlzLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpOyB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFRoZSBuZyBtb2R1bGUgJHtzdHJpbmdpZnkodGhpcy5pbnN0YW5jZS5jb25zdHJ1Y3Rvcil9IGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLmApO1xuICAgIH1cbiAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuICAgIGNhbGxOZ01vZHVsZUxpZmVjeWNsZSh0aGlzLCBOb2RlRmxhZ3MuT25EZXN0cm95KTtcbiAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcigpKTtcbiAgfVxuXG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLnB1c2goY2FsbGJhY2spOyB9XG59XG4iXX0=