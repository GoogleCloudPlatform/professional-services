/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/cdk/tree'), require('@angular/core'), require('@angular/material/core'), require('@angular/common'), require('@angular/cdk/collections'), require('rxjs'), require('rxjs/operators')) :
	typeof define === 'function' && define.amd ? define('@angular/material/tree', ['exports', '@angular/cdk/tree', '@angular/core', '@angular/material/core', '@angular/common', '@angular/cdk/collections', 'rxjs', 'rxjs/operators'], factory) :
	(factory((global.ng = global.ng || {}, global.ng.material = global.ng.material || {}, global.ng.material.tree = {}),global.ng.cdk.tree,global.ng.core,global.ng.material.core,global.ng.common,global.ng.cdk.collections,global.rxjs,global.rxjs.operators));
}(this, (function (exports,tree,core,core$1,common,collections,rxjs,operators) { 'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Outlet for nested CdkNode. Put `[matTreeNodeOutlet]` on a tag to place children dataNodes
 * inside the outlet.
 */
var MatTreeNodeOutlet = /** @class */ (function () {
    function MatTreeNodeOutlet(viewContainer, _node) {
        this.viewContainer = viewContainer;
        this._node = _node;
    }
    MatTreeNodeOutlet.decorators = [
        { type: core.Directive, args: [{
                    selector: '[matTreeNodeOutlet]'
                },] },
    ];
    /** @nocollapse */
    MatTreeNodeOutlet.ctorParameters = function () { return [
        { type: core.ViewContainerRef },
        { type: undefined, decorators: [{ type: core.Inject, args: [tree.CDK_TREE_NODE_OUTLET_NODE,] }, { type: core.Optional }] }
    ]; };
    return MatTreeNodeOutlet;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/** @type {?} */
var _MatTreeNodeMixinBase = core$1.mixinTabIndex(core$1.mixinDisabled(tree.CdkTreeNode));
/** @type {?} */
var _MatNestedTreeNodeMixinBase = core$1.mixinTabIndex(core$1.mixinDisabled(tree.CdkNestedTreeNode));
/**
 * Wrapper for the CdkTree node with Material design styles.
 * @template T
 */
var MatTreeNode = /** @class */ (function (_super) {
    __extends(MatTreeNode, _super);
    function MatTreeNode(_elementRef, _tree, tabIndex) {
        var _this = _super.call(this, _elementRef, _tree) || this;
        _this._elementRef = _elementRef;
        _this._tree = _tree;
        _this.role = 'treeitem';
        _this.tabIndex = Number(tabIndex) || 0;
        return _this;
    }
    MatTreeNode.decorators = [
        { type: core.Directive, args: [{
                    selector: 'mat-tree-node',
                    exportAs: 'matTreeNode',
                    inputs: ['disabled', 'tabIndex'],
                    host: {
                        '[attr.aria-expanded]': 'isExpanded',
                        '[attr.aria-level]': 'role === "treeitem" ? level : null',
                        '[attr.role]': 'role',
                        'class': 'mat-tree-node'
                    },
                    providers: [{ provide: tree.CdkTreeNode, useExisting: MatTreeNode }]
                },] },
    ];
    /** @nocollapse */
    MatTreeNode.ctorParameters = function () { return [
        { type: core.ElementRef },
        { type: tree.CdkTree },
        { type: String, decorators: [{ type: core.Attribute, args: ['tabindex',] }] }
    ]; };
    MatTreeNode.propDecorators = {
        role: [{ type: core.Input }]
    };
    return MatTreeNode;
}(_MatTreeNodeMixinBase));
/**
 * Wrapper for the CdkTree node definition with Material design styles.
 * @template T
 */
var MatTreeNodeDef = /** @class */ (function (_super) {
    __extends(MatTreeNodeDef, _super);
    function MatTreeNodeDef() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MatTreeNodeDef.decorators = [
        { type: core.Directive, args: [{
                    selector: '[matTreeNodeDef]',
                    inputs: [
                        'when: matTreeNodeDefWhen'
                    ],
                    providers: [{ provide: tree.CdkTreeNodeDef, useExisting: MatTreeNodeDef }]
                },] },
    ];
    MatTreeNodeDef.propDecorators = {
        data: [{ type: core.Input, args: ['matTreeNode',] }]
    };
    return MatTreeNodeDef;
}(tree.CdkTreeNodeDef));
/**
 * Wrapper for the CdkTree nested node with Material design styles.
 * @template T
 */
var MatNestedTreeNode = /** @class */ (function (_super) {
    __extends(MatNestedTreeNode, _super);
    function MatNestedTreeNode(_elementRef, _tree, _differs, tabIndex) {
        var _this = _super.call(this, _elementRef, _tree, _differs) || this;
        _this._elementRef = _elementRef;
        _this._tree = _tree;
        _this._differs = _differs;
        _this.tabIndex = Number(tabIndex) || 0;
        return _this;
    }
    // This is a workaround for https://github.com/angular/angular/issues/23091
    // In aot mode, the lifecycle hooks from parent class are not called.
    // TODO(tinayuangao): Remove when the angular issue #23091 is fixed
    // This is a workaround for https://github.com/angular/angular/issues/23091
    // In aot mode, the lifecycle hooks from parent class are not called.
    // TODO(tinayuangao): Remove when the angular issue #23091 is fixed
    /**
     * @return {?}
     */
    MatNestedTreeNode.prototype.ngAfterContentInit = 
    // This is a workaround for https://github.com/angular/angular/issues/23091
    // In aot mode, the lifecycle hooks from parent class are not called.
    // TODO(tinayuangao): Remove when the angular issue #23091 is fixed
    /**
     * @return {?}
     */
    function () {
        _super.prototype.ngAfterContentInit.call(this);
    };
    /**
     * @return {?}
     */
    MatNestedTreeNode.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        _super.prototype.ngOnDestroy.call(this);
    };
    MatNestedTreeNode.decorators = [
        { type: core.Directive, args: [{
                    selector: 'mat-nested-tree-node',
                    exportAs: 'matNestedTreeNode',
                    host: {
                        '[attr.aria-expanded]': 'isExpanded',
                        '[attr.role]': 'role',
                        'class': 'mat-nested-tree-node',
                    },
                    inputs: ['disabled', 'tabIndex'],
                    providers: [
                        { provide: tree.CdkNestedTreeNode, useExisting: MatNestedTreeNode },
                        { provide: tree.CdkTreeNode, useExisting: MatNestedTreeNode },
                        { provide: tree.CDK_TREE_NODE_OUTLET_NODE, useExisting: MatNestedTreeNode }
                    ]
                },] },
    ];
    /** @nocollapse */
    MatNestedTreeNode.ctorParameters = function () { return [
        { type: core.ElementRef },
        { type: tree.CdkTree },
        { type: core.IterableDiffers },
        { type: String, decorators: [{ type: core.Attribute, args: ['tabindex',] }] }
    ]; };
    MatNestedTreeNode.propDecorators = {
        node: [{ type: core.Input, args: ['matNestedTreeNode',] }],
        nodeOutlet: [{ type: core.ContentChildren, args: [MatTreeNodeOutlet, {
                        // We need to use `descendants: true`, because Ivy will no longer match
                        // indirect descendants if it's left as false.
                        descendants: true
                    },] }]
    };
    return MatNestedTreeNode;
}(_MatNestedTreeNodeMixinBase));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Wrapper for the CdkTree padding with Material design styles.
 * @template T
 */
var MatTreeNodePadding = /** @class */ (function (_super) {
    __extends(MatTreeNodePadding, _super);
    function MatTreeNodePadding() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MatTreeNodePadding.decorators = [
        { type: core.Directive, args: [{
                    selector: '[matTreeNodePadding]',
                    providers: [{ provide: tree.CdkTreeNodePadding, useExisting: MatTreeNodePadding }]
                },] },
    ];
    MatTreeNodePadding.propDecorators = {
        level: [{ type: core.Input, args: ['matTreeNodePadding',] }],
        indent: [{ type: core.Input, args: ['matTreeNodePaddingIndent',] }]
    };
    return MatTreeNodePadding;
}(tree.CdkTreeNodePadding));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Wrapper for the CdkTable with Material design styles.
 * @template T
 */
var MatTree = /** @class */ (function (_super) {
    __extends(MatTree, _super);
    function MatTree() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MatTree.decorators = [
        { type: core.Component, args: [{selector: 'mat-tree',
                    exportAs: 'matTree',
                    template: "<ng-container matTreeNodeOutlet></ng-container>",
                    host: {
                        'class': 'mat-tree',
                        'role': 'tree',
                    },
                    styles: [".mat-tree{display:block}.mat-tree-node{display:flex;align-items:center;min-height:48px;flex:1;overflow:hidden;word-wrap:break-word}.mat-nested-tree-ndoe{border-bottom-width:0}"],
                    encapsulation: core.ViewEncapsulation.None,
                    // See note on CdkTree for explanation on why this uses the default change detection strategy.
                    // tslint:disable-next-line:validate-decorators
                    changeDetection: core.ChangeDetectionStrategy.Default,
                    providers: [{ provide: tree.CdkTree, useExisting: MatTree }]
                },] },
    ];
    MatTree.propDecorators = {
        _nodeOutlet: [{ type: core.ViewChild, args: [MatTreeNodeOutlet,] }]
    };
    return MatTree;
}(tree.CdkTree));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Wrapper for the CdkTree's toggle with Material design styles.
 * @template T
 */
var MatTreeNodeToggle = /** @class */ (function (_super) {
    __extends(MatTreeNodeToggle, _super);
    function MatTreeNodeToggle() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.recursive = false;
        return _this;
    }
    MatTreeNodeToggle.decorators = [
        { type: core.Directive, args: [{
                    selector: '[matTreeNodeToggle]',
                    providers: [{ provide: tree.CdkTreeNodeToggle, useExisting: MatTreeNodeToggle }]
                },] },
    ];
    MatTreeNodeToggle.propDecorators = {
        recursive: [{ type: core.Input, args: ['matTreeNodeToggleRecursive',] }]
    };
    return MatTreeNodeToggle;
}(tree.CdkTreeNodeToggle));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/** @type {?} */
var MAT_TREE_DIRECTIVES = [
    MatNestedTreeNode,
    MatTreeNodeDef,
    MatTreeNodePadding,
    MatTreeNodeToggle,
    MatTree,
    MatTreeNode,
    MatTreeNodeOutlet
];
var MatTreeModule = /** @class */ (function () {
    function MatTreeModule() {
    }
    MatTreeModule.decorators = [
        { type: core.NgModule, args: [{
                    imports: [tree.CdkTreeModule, common.CommonModule, core$1.MatCommonModule],
                    exports: MAT_TREE_DIRECTIVES,
                    declarations: MAT_TREE_DIRECTIVES,
                },] },
    ];
    return MatTreeModule;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Tree flattener to convert a normal type of node to node with children & level information.
 * Transform nested nodes of type `T` to flattened nodes of type `F`.
 *
 * For example, the input data of type `T` is nested, and contains its children data:
 *   SomeNode: {
 *     key: 'Fruits',
 *     children: [
 *       NodeOne: {
 *         key: 'Apple',
 *       },
 *       NodeTwo: {
 *        key: 'Pear',
 *      }
 *    ]
 *  }
 *  After flattener flatten the tree, the structure will become
 *  SomeNode: {
 *    key: 'Fruits',
 *    expandable: true,
 *    level: 1
 *  },
 *  NodeOne: {
 *    key: 'Apple',
 *    expandable: false,
 *    level: 2
 *  },
 *  NodeTwo: {
 *   key: 'Pear',
 *   expandable: false,
 *   level: 2
 * }
 * and the output flattened type is `F` with additional information.
 * @template T, F
 */
var   /**
 * Tree flattener to convert a normal type of node to node with children & level information.
 * Transform nested nodes of type `T` to flattened nodes of type `F`.
 *
 * For example, the input data of type `T` is nested, and contains its children data:
 *   SomeNode: {
 *     key: 'Fruits',
 *     children: [
 *       NodeOne: {
 *         key: 'Apple',
 *       },
 *       NodeTwo: {
 *        key: 'Pear',
 *      }
 *    ]
 *  }
 *  After flattener flatten the tree, the structure will become
 *  SomeNode: {
 *    key: 'Fruits',
 *    expandable: true,
 *    level: 1
 *  },
 *  NodeOne: {
 *    key: 'Apple',
 *    expandable: false,
 *    level: 2
 *  },
 *  NodeTwo: {
 *   key: 'Pear',
 *   expandable: false,
 *   level: 2
 * }
 * and the output flattened type is `F` with additional information.
 * @template T, F
 */
MatTreeFlattener = /** @class */ (function () {
    function MatTreeFlattener(transformFunction, getLevel, isExpandable, getChildren) {
        this.transformFunction = transformFunction;
        this.getLevel = getLevel;
        this.isExpandable = isExpandable;
        this.getChildren = getChildren;
    }
    /**
     * @param {?} node
     * @param {?} level
     * @param {?} resultNodes
     * @param {?} parentMap
     * @return {?}
     */
    MatTreeFlattener.prototype._flattenNode = /**
     * @param {?} node
     * @param {?} level
     * @param {?} resultNodes
     * @param {?} parentMap
     * @return {?}
     */
    function (node, level, resultNodes, parentMap) {
        var _this = this;
        /** @type {?} */
        var flatNode = this.transformFunction(node, level);
        resultNodes.push(flatNode);
        if (this.isExpandable(flatNode)) {
            /** @type {?} */
            var childrenNodes = this.getChildren(node);
            if (childrenNodes) {
                if (Array.isArray(childrenNodes)) {
                    this._flattenChildren(childrenNodes, level, resultNodes, parentMap);
                }
                else {
                    childrenNodes.pipe(operators.take(1)).subscribe(function (children) {
                        _this._flattenChildren(children, level, resultNodes, parentMap);
                    });
                }
            }
        }
        return resultNodes;
    };
    /**
     * @param {?} children
     * @param {?} level
     * @param {?} resultNodes
     * @param {?} parentMap
     * @return {?}
     */
    MatTreeFlattener.prototype._flattenChildren = /**
     * @param {?} children
     * @param {?} level
     * @param {?} resultNodes
     * @param {?} parentMap
     * @return {?}
     */
    function (children, level, resultNodes, parentMap) {
        var _this = this;
        children.forEach(function (child, index) {
            /** @type {?} */
            var childParentMap = parentMap.slice();
            childParentMap.push(index != children.length - 1);
            _this._flattenNode(child, level + 1, resultNodes, childParentMap);
        });
    };
    /**
     * Flatten a list of node type T to flattened version of node F.
     * Please note that type T may be nested, and the length of `structuredData` may be different
     * from that of returned list `F[]`.
     */
    /**
     * Flatten a list of node type T to flattened version of node F.
     * Please note that type T may be nested, and the length of `structuredData` may be different
     * from that of returned list `F[]`.
     * @param {?} structuredData
     * @return {?}
     */
    MatTreeFlattener.prototype.flattenNodes = /**
     * Flatten a list of node type T to flattened version of node F.
     * Please note that type T may be nested, and the length of `structuredData` may be different
     * from that of returned list `F[]`.
     * @param {?} structuredData
     * @return {?}
     */
    function (structuredData) {
        var _this = this;
        /** @type {?} */
        var resultNodes = [];
        structuredData.forEach(function (node) { return _this._flattenNode(node, 0, resultNodes, []); });
        return resultNodes;
    };
    /**
     * Expand flattened node with current expansion status.
     * The returned list may have different length.
     */
    /**
     * Expand flattened node with current expansion status.
     * The returned list may have different length.
     * @param {?} nodes
     * @param {?} treeControl
     * @return {?}
     */
    MatTreeFlattener.prototype.expandFlattenedNodes = /**
     * Expand flattened node with current expansion status.
     * The returned list may have different length.
     * @param {?} nodes
     * @param {?} treeControl
     * @return {?}
     */
    function (nodes, treeControl) {
        var _this = this;
        /** @type {?} */
        var results = [];
        /** @type {?} */
        var currentExpand = [];
        currentExpand[0] = true;
        nodes.forEach(function (node) {
            /** @type {?} */
            var expand = true;
            for (var i = 0; i <= _this.getLevel(node); i++) {
                expand = expand && currentExpand[i];
            }
            if (expand) {
                results.push(node);
            }
            if (_this.isExpandable(node)) {
                currentExpand[_this.getLevel(node) + 1] = treeControl.isExpanded(node);
            }
        });
        return results;
    };
    return MatTreeFlattener;
}());
/**
 * Data source for flat tree.
 * The data source need to handle expansion/collapsion of the tree node and change the data feed
 * to `MatTree`.
 * The nested tree nodes of type `T` are flattened through `MatTreeFlattener`, and converted
 * to type `F` for `MatTree` to consume.
 * @template T, F
 */
var   /**
 * Data source for flat tree.
 * The data source need to handle expansion/collapsion of the tree node and change the data feed
 * to `MatTree`.
 * The nested tree nodes of type `T` are flattened through `MatTreeFlattener`, and converted
 * to type `F` for `MatTree` to consume.
 * @template T, F
 */
MatTreeFlatDataSource = /** @class */ (function (_super) {
    __extends(MatTreeFlatDataSource, _super);
    function MatTreeFlatDataSource(treeControl, treeFlattener, initialData) {
        if (initialData === void 0) { initialData = []; }
        var _this = _super.call(this) || this;
        _this.treeControl = treeControl;
        _this.treeFlattener = treeFlattener;
        _this._flattenedData = new rxjs.BehaviorSubject([]);
        _this._expandedData = new rxjs.BehaviorSubject([]);
        _this._data = new rxjs.BehaviorSubject(initialData);
        return _this;
    }
    Object.defineProperty(MatTreeFlatDataSource.prototype, "data", {
        get: /**
         * @return {?}
         */
        function () { return this._data.value; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            this._data.next(value);
            this._flattenedData.next(this.treeFlattener.flattenNodes(this.data));
            this.treeControl.dataNodes = this._flattenedData.value;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @param {?} collectionViewer
     * @return {?}
     */
    MatTreeFlatDataSource.prototype.connect = /**
     * @param {?} collectionViewer
     * @return {?}
     */
    function (collectionViewer) {
        var _this = this;
        /** @type {?} */
        var changes = [
            collectionViewer.viewChange,
            this.treeControl.expansionModel.onChange,
            this._flattenedData
        ];
        return rxjs.merge.apply(void 0, changes).pipe(operators.map(function () {
            _this._expandedData.next(_this.treeFlattener.expandFlattenedNodes(_this._flattenedData.value, _this.treeControl));
            return _this._expandedData.value;
        }));
    };
    /**
     * @return {?}
     */
    MatTreeFlatDataSource.prototype.disconnect = /**
     * @return {?}
     */
    function () {
        // no op
    };
    return MatTreeFlatDataSource;
}(collections.DataSource));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Data source for nested tree.
 *
 * The data source for nested tree doesn't have to consider node flattener, or the way to expand
 * or collapse. The expansion/collapsion will be handled by TreeControl and each non-leaf node.
 * @template T
 */
var   /**
 * Data source for nested tree.
 *
 * The data source for nested tree doesn't have to consider node flattener, or the way to expand
 * or collapse. The expansion/collapsion will be handled by TreeControl and each non-leaf node.
 * @template T
 */
MatTreeNestedDataSource = /** @class */ (function (_super) {
    __extends(MatTreeNestedDataSource, _super);
    function MatTreeNestedDataSource() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._data = new rxjs.BehaviorSubject([]);
        return _this;
    }
    Object.defineProperty(MatTreeNestedDataSource.prototype, "data", {
        /**
         * Data for the nested tree
         */
        get: /**
         * Data for the nested tree
         * @return {?}
         */
        function () { return this._data.value; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) { this._data.next(value); },
        enumerable: true,
        configurable: true
    });
    /**
     * @param {?} collectionViewer
     * @return {?}
     */
    MatTreeNestedDataSource.prototype.connect = /**
     * @param {?} collectionViewer
     * @return {?}
     */
    function (collectionViewer) {
        var _this = this;
        return rxjs.merge.apply(void 0, [collectionViewer.viewChange, this._data]).pipe(operators.map(function () {
            return _this.data;
        }));
    };
    /**
     * @return {?}
     */
    MatTreeNestedDataSource.prototype.disconnect = /**
     * @return {?}
     */
    function () {
        // no op
    };
    return MatTreeNestedDataSource;
}(collections.DataSource));

exports._MatTreeNodeMixinBase = _MatTreeNodeMixinBase;
exports._MatNestedTreeNodeMixinBase = _MatNestedTreeNodeMixinBase;
exports.MatTreeNode = MatTreeNode;
exports.MatTreeNodeDef = MatTreeNodeDef;
exports.MatNestedTreeNode = MatNestedTreeNode;
exports.MatTreeNodePadding = MatTreeNodePadding;
exports.MatTree = MatTree;
exports.MatTreeModule = MatTreeModule;
exports.MatTreeNodeToggle = MatTreeNodeToggle;
exports.MatTreeNodeOutlet = MatTreeNodeOutlet;
exports.MatTreeFlattener = MatTreeFlattener;
exports.MatTreeFlatDataSource = MatTreeFlatDataSource;
exports.MatTreeNestedDataSource = MatTreeNestedDataSource;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=material-tree.umd.js.map
