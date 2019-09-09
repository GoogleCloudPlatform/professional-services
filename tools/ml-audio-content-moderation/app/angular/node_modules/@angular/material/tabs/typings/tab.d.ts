/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TemplatePortal } from '@angular/cdk/portal';
import { OnChanges, OnDestroy, OnInit, SimpleChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { CanDisable, CanDisableCtor } from '@angular/material/core';
import { Subject } from 'rxjs';
import { MatTabLabel } from './tab-label';
/** @docs-private */
export declare class MatTabBase {
}
export declare const _MatTabMixinBase: CanDisableCtor & typeof MatTabBase;
export declare class MatTab extends _MatTabMixinBase implements OnInit, CanDisable, OnChanges, OnDestroy {
    private _viewContainerRef;
    /** Content for the tab label given by `<ng-template mat-tab-label>`. */
    templateLabel: MatTabLabel;
    /**
     * Template provided in the tab content that will be used if present, used to enable lazy-loading
     */
    _explicitContent: TemplateRef<any>;
    /** Template inside the MatTab view that contains an `<ng-content>`. */
    _implicitContent: TemplateRef<any>;
    /** Plain text label for the tab, used when there is no template label. */
    textLabel: string;
    /** Aria label for the tab. */
    ariaLabel: string;
    /**
     * Reference to the element that the tab is labelled by.
     * Will be cleared if `aria-label` is set at the same time.
     */
    ariaLabelledby: string;
    /** Portal that will be the hosted content of the tab */
    private _contentPortal;
    /** @docs-private */
    readonly content: TemplatePortal | null;
    /** Emits whenever the internal state of the tab changes. */
    readonly _stateChanges: Subject<void>;
    /**
     * The relatively indexed position where 0 represents the center, negative is left, and positive
     * represents the right.
     */
    position: number | null;
    /**
     * The initial relatively index origin of the tab if it was created and selected after there
     * was already a selected tab. Provides context of what position the tab should originate from.
     */
    origin: number | null;
    /**
     * Whether the tab is currently active.
     */
    isActive: boolean;
    constructor(_viewContainerRef: ViewContainerRef);
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    ngOnInit(): void;
}
