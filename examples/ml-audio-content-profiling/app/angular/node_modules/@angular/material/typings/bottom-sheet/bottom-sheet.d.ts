/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Overlay } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { Injector, TemplateRef, InjectionToken, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { MatBottomSheetConfig } from './bottom-sheet-config';
import { MatBottomSheetRef } from './bottom-sheet-ref';
/** Injection token that can be used to specify default bottom sheet options. */
export declare const MAT_BOTTOM_SHEET_DEFAULT_OPTIONS: InjectionToken<MatBottomSheetConfig<any>>;
/**
 * Service to trigger Material Design bottom sheets.
 */
export declare class MatBottomSheet implements OnDestroy {
    private _overlay;
    private _injector;
    private _parentBottomSheet;
    private _location?;
    private _defaultOptions?;
    private _bottomSheetRefAtThisLevel;
    /** Reference to the currently opened bottom sheet. */
    _openedBottomSheetRef: MatBottomSheetRef<any> | null;
    constructor(_overlay: Overlay, _injector: Injector, _parentBottomSheet: MatBottomSheet, _location?: Location | undefined, _defaultOptions?: MatBottomSheetConfig<any> | undefined);
    open<T, D = any, R = any>(component: ComponentType<T>, config?: MatBottomSheetConfig<D>): MatBottomSheetRef<T, R>;
    open<T, D = any, R = any>(template: TemplateRef<T>, config?: MatBottomSheetConfig<D>): MatBottomSheetRef<T, R>;
    /**
     * Dismisses the currently-visible bottom sheet.
     */
    dismiss(): void;
    ngOnDestroy(): void;
    /**
     * Attaches the bottom sheet container component to the overlay.
     */
    private _attachContainer;
    /**
     * Creates a new overlay and places it in the correct location.
     * @param config The user-specified bottom sheet config.
     */
    private _createOverlay;
    /**
     * Creates an injector to be used inside of a bottom sheet component.
     * @param config Config that was used to create the bottom sheet.
     * @param bottomSheetRef Reference to the bottom sheet.
     */
    private _createInjector;
}
