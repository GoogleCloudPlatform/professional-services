/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, ElementRef, QueryList, OnChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CanDisableRipple, CanDisableRippleCtor, MatLine } from '@angular/material/core';
import { Subject } from 'rxjs';
/** @docs-private */
export declare class MatListBase {
}
export declare const _MatListMixinBase: CanDisableRippleCtor & typeof MatListBase;
/** @docs-private */
export declare class MatListItemBase {
}
export declare const _MatListItemMixinBase: CanDisableRippleCtor & typeof MatListItemBase;
export declare class MatNavList extends _MatListMixinBase implements CanDisableRipple, OnChanges, OnDestroy {
    /** Emits when the state of the list changes. */
    _stateChanges: Subject<void>;
    ngOnChanges(): void;
    ngOnDestroy(): void;
}
export declare class MatList extends _MatListMixinBase implements CanDisableRipple, OnChanges, OnDestroy {
    private _elementRef?;
    /** Emits when the state of the list changes. */
    _stateChanges: Subject<void>;
    /**
     * @deprecated _elementRef parameter to be made required.
     * @breaking-change 8.0.0
     */
    constructor(_elementRef?: ElementRef<HTMLElement> | undefined);
    _getListType(): 'list' | 'action-list' | null;
    ngOnChanges(): void;
    ngOnDestroy(): void;
}
/**
 * Directive whose purpose is to add the mat- CSS styling to this selector.
 * @docs-private
 */
export declare class MatListAvatarCssMatStyler {
}
/**
 * Directive whose purpose is to add the mat- CSS styling to this selector.
 * @docs-private
 */
export declare class MatListIconCssMatStyler {
}
/**
 * Directive whose purpose is to add the mat- CSS styling to this selector.
 * @docs-private
 */
export declare class MatListSubheaderCssMatStyler {
}
/** An item within a Material Design list. */
export declare class MatListItem extends _MatListItemMixinBase implements AfterContentInit, CanDisableRipple, OnDestroy {
    private _element;
    private _isInteractiveList;
    private _list?;
    private _destroyed;
    _lines: QueryList<MatLine>;
    _avatar: MatListAvatarCssMatStyler;
    _icon: MatListIconCssMatStyler;
    constructor(_element: ElementRef<HTMLElement>, navList?: MatNavList, list?: MatList, _changeDetectorRef?: ChangeDetectorRef);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /** Whether this list item should show a ripple effect when clicked. */
    _isRippleDisabled(): boolean;
    /** Retrieves the DOM element of the component host. */
    _getHostElement(): HTMLElement;
}
