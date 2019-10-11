/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OnDestroy } from '@angular/core';
export declare class SharedStylesHost {
    addStyles(styles: string[]): void;
    onStylesAdded(additions: Set<string>): void;
    getAllStyles(): string[];
}
export declare class DomSharedStylesHost extends SharedStylesHost implements OnDestroy {
    private _doc;
    private _hostNodes;
    private _styleNodes;
    constructor(_doc: any);
    private _addStylesToHost;
    addHost(hostNode: Node): void;
    removeHost(hostNode: Node): void;
    onStylesAdded(additions: Set<string>): void;
    ngOnDestroy(): void;
}
