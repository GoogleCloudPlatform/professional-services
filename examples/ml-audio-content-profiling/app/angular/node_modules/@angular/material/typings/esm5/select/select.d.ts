/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ActiveDescendantKeyManager, LiveAnnouncer } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { SelectionModel } from '@angular/cdk/collections';
import { CdkConnectedOverlay, Overlay, ScrollStrategy } from '@angular/cdk/overlay';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { AfterContentInit, ChangeDetectorRef, DoCheck, ElementRef, EventEmitter, InjectionToken, NgZone, OnChanges, OnDestroy, OnInit, QueryList, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormGroupDirective, NgControl, NgForm } from '@angular/forms';
import { CanDisable, CanDisableCtor, CanDisableRipple, CanDisableRippleCtor, CanUpdateErrorState, CanUpdateErrorStateCtor, ErrorStateMatcher, HasTabIndex, HasTabIndexCtor, MatOptgroup, MatOption, MatOptionSelectionChange } from '@angular/material/core';
import { MatFormField, MatFormFieldControl } from '@angular/material/form-field';
import { Observable, Subject } from 'rxjs';
/**
 * The following style constants are necessary to save here in order
 * to properly calculate the alignment of the selected option over
 * the trigger element.
 */
/** The max height of the select's overlay panel */
export declare const SELECT_PANEL_MAX_HEIGHT = 256;
/** The panel's padding on the x-axis */
export declare const SELECT_PANEL_PADDING_X = 16;
/** The panel's x axis padding if it is indented (e.g. there is an option group). */
export declare const SELECT_PANEL_INDENT_PADDING_X: number;
/** The height of the select items in `em` units. */
export declare const SELECT_ITEM_HEIGHT_EM = 3;
/**
 * Distance between the panel edge and the option text in
 * multi-selection mode.
 *
 * Calculated as:
 * (SELECT_PANEL_PADDING_X * 1.5) + 20 = 44
 * The padding is multiplied by 1.5 because the checkbox's margin is half the padding.
 * The checkbox width is 16px.
 */
export declare let SELECT_MULTIPLE_PANEL_PADDING_X: number;
/**
 * The select panel will only "fit" inside the viewport if it is positioned at
 * this value or more away from the viewport boundary.
 */
export declare const SELECT_PANEL_VIEWPORT_PADDING = 8;
/** Injection token that determines the scroll handling while a select is open. */
export declare const MAT_SELECT_SCROLL_STRATEGY: InjectionToken<() => ScrollStrategy>;
/** @docs-private */
export declare function MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY(overlay: Overlay): () => ScrollStrategy;
/** @docs-private */
export declare const MAT_SELECT_SCROLL_STRATEGY_PROVIDER: {
    provide: InjectionToken<() => ScrollStrategy>;
    deps: (typeof Overlay)[];
    useFactory: typeof MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY;
};
/** Change event object that is emitted when the select value has changed. */
export declare class MatSelectChange {
    /** Reference to the select that emitted the change event. */
    source: MatSelect;
    /** Current value of the select that emitted the event. */
    value: any;
    constructor(
    /** Reference to the select that emitted the change event. */
    source: MatSelect, 
    /** Current value of the select that emitted the event. */
    value: any);
}
/** @docs-private */
export declare class MatSelectBase {
    _elementRef: ElementRef;
    _defaultErrorStateMatcher: ErrorStateMatcher;
    _parentForm: NgForm;
    _parentFormGroup: FormGroupDirective;
    ngControl: NgControl;
    constructor(_elementRef: ElementRef, _defaultErrorStateMatcher: ErrorStateMatcher, _parentForm: NgForm, _parentFormGroup: FormGroupDirective, ngControl: NgControl);
}
export declare const _MatSelectMixinBase: CanDisableCtor & HasTabIndexCtor & CanDisableRippleCtor & CanUpdateErrorStateCtor & typeof MatSelectBase;
/**
 * Allows the user to customize the trigger that is displayed when the select has a value.
 */
export declare class MatSelectTrigger {
}
export declare class MatSelect extends _MatSelectMixinBase implements AfterContentInit, OnChanges, OnDestroy, OnInit, DoCheck, ControlValueAccessor, CanDisable, HasTabIndex, MatFormFieldControl<any>, CanUpdateErrorState, CanDisableRipple {
    private _viewportRuler;
    private _changeDetectorRef;
    private _ngZone;
    private _dir;
    private _parentFormField;
    ngControl: NgControl;
    /**
     * @deprecated _liveAnnouncer to be turned into a required parameter.
     * @breaking-change 8.0.0
     */
    private _liveAnnouncer?;
    private _scrollStrategyFactory;
    /** Whether or not the overlay panel is open. */
    private _panelOpen;
    /** Whether filling out the select is required in the form. */
    private _required;
    /** The scroll position of the overlay panel, calculated to center the selected option. */
    private _scrollTop;
    /** The placeholder displayed in the trigger of the select. */
    private _placeholder;
    /** Whether the component is in multiple selection mode. */
    private _multiple;
    /** Comparison function to specify which option is displayed. Defaults to object equality. */
    private _compareWith;
    /** Unique id for this input. */
    private _uid;
    /** Emits whenever the component is destroyed. */
    private readonly _destroy;
    /** The last measured value for the trigger's client bounding rect. */
    _triggerRect: ClientRect;
    /** The aria-describedby attribute on the select for improved a11y. */
    _ariaDescribedby: string;
    /** The cached font-size of the trigger element. */
    _triggerFontSize: number;
    /** Deals with the selection logic. */
    _selectionModel: SelectionModel<MatOption>;
    /** Manages keyboard events for options in the panel. */
    _keyManager: ActiveDescendantKeyManager<MatOption>;
    /** `View -> model callback called when value changes` */
    _onChange: (value: any) => void;
    /** `View -> model callback called when select has been touched` */
    _onTouched: () => void;
    /** The IDs of child options to be passed to the aria-owns attribute. */
    _optionIds: string;
    /** The value of the select panel's transform-origin property. */
    _transformOrigin: string;
    /** Emits when the panel element is finished transforming in. */
    _panelDoneAnimatingStream: Subject<string>;
    /** Strategy that will be used to handle scrolling while the select panel is open. */
    _scrollStrategy: ScrollStrategy;
    /**
     * The y-offset of the overlay panel in relation to the trigger's top start corner.
     * This must be adjusted to align the selected option text over the trigger text.
     * when the panel opens. Will change based on the y-position of the selected option.
     */
    _offsetY: number;
    /**
     * This position config ensures that the top "start" corner of the overlay
     * is aligned with with the top "start" of the origin by default (overlapping
     * the trigger completely). If the panel cannot fit below the trigger, it
     * will fall back to a position above the trigger.
     */
    _positions: {
        originX: string;
        originY: string;
        overlayX: string;
        overlayY: string;
    }[];
    /** Whether the component is disabling centering of the active option over the trigger. */
    private _disableOptionCentering;
    /** Whether the select is focused. */
    /**
    * @deprecated Setter to be removed as this property is intended to be readonly.
    * @breaking-change 8.0.0
    */
    focused: boolean;
    private _focused;
    /** A name for this control that can be used by `mat-form-field`. */
    controlType: string;
    /** Trigger that opens the select. */
    trigger: ElementRef;
    /** Panel containing the select options. */
    panel: ElementRef;
    /** Overlay pane containing the options. */
    overlayDir: CdkConnectedOverlay;
    /** All of the defined select options. */
    options: QueryList<MatOption>;
    /** All of the defined groups of options. */
    optionGroups: QueryList<MatOptgroup>;
    /** Classes to be passed to the select panel. Supports the same syntax as `ngClass`. */
    panelClass: string | string[] | Set<string> | {
        [key: string]: any;
    };
    /** User-supplied override of the trigger element. */
    customTrigger: MatSelectTrigger;
    /** Placeholder to be shown if no value has been selected. */
    placeholder: string;
    /** Whether the component is required. */
    required: boolean;
    /** Whether the user should be allowed to select multiple options. */
    multiple: boolean;
    /** Whether to center the active option over the trigger. */
    disableOptionCentering: boolean;
    /**
     * Function to compare the option values with the selected values. The first argument
     * is a value from an option. The second is a value from the selection. A boolean
     * should be returned.
     */
    compareWith: (o1: any, o2: any) => boolean;
    /** Value of the select control. */
    value: any;
    private _value;
    /** Aria label of the select. If not specified, the placeholder will be used as label. */
    ariaLabel: string;
    /** Input that can be used to specify the `aria-labelledby` attribute. */
    ariaLabelledby: string;
    /** Object used to control when error messages are shown. */
    errorStateMatcher: ErrorStateMatcher;
    /**
     * Function used to sort the values in a select in multiple mode.
     * Follows the same logic as `Array.prototype.sort`.
     */
    sortComparator: (a: MatOption, b: MatOption, options: MatOption[]) => number;
    /** Unique id of the element. */
    id: string;
    private _id;
    /** Combined stream of all of the child options' change events. */
    readonly optionSelectionChanges: Observable<MatOptionSelectionChange>;
    /** Event emitted when the select panel has been toggled. */
    readonly openedChange: EventEmitter<boolean>;
    /** Event emitted when the select has been opened. */
    readonly _openedStream: Observable<void>;
    /** Event emitted when the select has been closed. */
    readonly _closedStream: Observable<void>;
    /** Event emitted when the selected value has been changed by the user. */
    readonly selectionChange: EventEmitter<MatSelectChange>;
    /**
     * Event that emits whenever the raw value of the select changes. This is here primarily
     * to facilitate the two-way binding for the `value` input.
     * @docs-private
     */
    readonly valueChange: EventEmitter<any>;
    constructor(_viewportRuler: ViewportRuler, _changeDetectorRef: ChangeDetectorRef, _ngZone: NgZone, _defaultErrorStateMatcher: ErrorStateMatcher, elementRef: ElementRef, _dir: Directionality, _parentForm: NgForm, _parentFormGroup: FormGroupDirective, _parentFormField: MatFormField, ngControl: NgControl, tabIndex: string, scrollStrategyFactory: any, 
    /**
     * @deprecated _liveAnnouncer to be turned into a required parameter.
     * @breaking-change 8.0.0
     */
    _liveAnnouncer?: LiveAnnouncer | undefined);
    ngOnInit(): void;
    ngAfterContentInit(): void;
    ngDoCheck(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    /** Toggles the overlay panel open or closed. */
    toggle(): void;
    /** Opens the overlay panel. */
    open(): void;
    /** Closes the overlay panel and focuses the host element. */
    close(): void;
    /**
     * Sets the select's value. Part of the ControlValueAccessor interface
     * required to integrate with Angular's core forms API.
     *
     * @param value New value to be written to the model.
     */
    writeValue(value: any): void;
    /**
     * Saves a callback function to be invoked when the select's value
     * changes from user input. Part of the ControlValueAccessor interface
     * required to integrate with Angular's core forms API.
     *
     * @param fn Callback to be triggered when the value changes.
     */
    registerOnChange(fn: (value: any) => void): void;
    /**
     * Saves a callback function to be invoked when the select is blurred
     * by the user. Part of the ControlValueAccessor interface required
     * to integrate with Angular's core forms API.
     *
     * @param fn Callback to be triggered when the component has been touched.
     */
    registerOnTouched(fn: () => {}): void;
    /**
     * Disables the select. Part of the ControlValueAccessor interface required
     * to integrate with Angular's core forms API.
     *
     * @param isDisabled Sets whether the component is disabled.
     */
    setDisabledState(isDisabled: boolean): void;
    /** Whether or not the overlay panel is open. */
    readonly panelOpen: boolean;
    /** The currently selected option. */
    readonly selected: MatOption | MatOption[];
    /** The value displayed in the trigger. */
    readonly triggerValue: string;
    /** Whether the element is in RTL mode. */
    _isRtl(): boolean;
    /** Handles all keydown events on the select. */
    _handleKeydown(event: KeyboardEvent): void;
    /** Handles keyboard events while the select is closed. */
    private _handleClosedKeydown;
    /** Handles keyboard events when the selected is open. */
    private _handleOpenKeydown;
    _onFocus(): void;
    /**
     * Calls the touched callback only if the panel is closed. Otherwise, the trigger will
     * "blur" to the panel when it opens, causing a false positive.
     */
    _onBlur(): void;
    /**
     * Callback that is invoked when the overlay panel has been attached.
     */
    _onAttached(): void;
    /** Returns the theme to be used on the panel. */
    _getPanelTheme(): string;
    /** Sets the pseudo checkbox padding size based on the width of the pseudo checkbox. */
    private _setPseudoCheckboxPaddingSize;
    /** Whether the select has a value. */
    readonly empty: boolean;
    private _initializeSelection;
    /**
     * Sets the selected option based on a value. If no option can be
     * found with the designated value, the select trigger is cleared.
     */
    private _setSelectionByValue;
    /**
     * Finds and selects and option based on its value.
     * @returns Option that has the corresponding value.
     */
    private _selectValue;
    /** Sets up a key manager to listen to keyboard events on the overlay panel. */
    private _initKeyManager;
    /** Drops current option subscriptions and IDs and resets from scratch. */
    private _resetOptions;
    /** Invoked when an option is clicked. */
    private _onSelect;
    /** Sorts the selected values in the selected based on their order in the panel. */
    private _sortValues;
    /** Emits change event to set the model value. */
    private _propagateChanges;
    /** Records option IDs to pass to the aria-owns property. */
    private _setOptionIds;
    /**
     * Highlights the selected item. If no option is selected, it will highlight
     * the first item instead.
     */
    private _highlightCorrectOption;
    /** Scrolls the active option into view. */
    private _scrollActiveOptionIntoView;
    /** Focuses the select element. */
    focus(): void;
    /** Gets the index of the provided option in the option list. */
    private _getOptionIndex;
    /** Calculates the scroll position and x- and y-offsets of the overlay panel. */
    private _calculateOverlayPosition;
    /**
     * Calculates the scroll position of the select's overlay panel.
     *
     * Attempts to center the selected option in the panel. If the option is
     * too high or too low in the panel to be scrolled to the center, it clamps the
     * scroll position to the min or max scroll positions respectively.
     */
    _calculateOverlayScroll(selectedIndex: number, scrollBuffer: number, maxScroll: number): number;
    /** Returns the aria-label of the select component. */
    _getAriaLabel(): string | null;
    /** Returns the aria-labelledby of the select component. */
    _getAriaLabelledby(): string | null;
    /** Determines the `aria-activedescendant` to be set on the host. */
    _getAriaActiveDescendant(): string | null;
    /**
     * Sets the x-offset of the overlay panel in relation to the trigger's top start corner.
     * This must be adjusted to align the selected option text over the trigger text when
     * the panel opens. Will change based on LTR or RTL text direction. Note that the offset
     * can't be calculated until the panel has been attached, because we need to know the
     * content width in order to constrain the panel within the viewport.
     */
    private _calculateOverlayOffsetX;
    /**
     * Calculates the y-offset of the select's overlay panel in relation to the
     * top start corner of the trigger. It has to be adjusted in order for the
     * selected option to be aligned over the trigger when the panel opens.
     */
    private _calculateOverlayOffsetY;
    /**
     * Checks that the attempted overlay position will fit within the viewport.
     * If it will not fit, tries to adjust the scroll position and the associated
     * y-offset so the panel can open fully on-screen. If it still won't fit,
     * sets the offset back to 0 to allow the fallback position to take over.
     */
    private _checkOverlayWithinViewport;
    /** Adjusts the overlay panel up to fit in the viewport. */
    private _adjustPanelUp;
    /** Adjusts the overlay panel down to fit in the viewport. */
    private _adjustPanelDown;
    /** Sets the transform origin point based on the selected option. */
    private _getOriginBasedOnOption;
    /** Calculates the amount of items in the select. This includes options and group labels. */
    private _getItemCount;
    /** Calculates the height of the select's options. */
    private _getItemHeight;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    setDescribedByIds(ids: string[]): void;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    onContainerClick(): void;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    readonly shouldLabelFloat: boolean;
}
