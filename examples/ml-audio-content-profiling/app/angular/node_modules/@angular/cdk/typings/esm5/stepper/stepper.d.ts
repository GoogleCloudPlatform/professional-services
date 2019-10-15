/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusableOption } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { AfterViewInit, ChangeDetectorRef, EventEmitter, ElementRef, OnChanges, OnDestroy, QueryList, TemplateRef, InjectionToken } from '@angular/core';
import { CdkStepLabel } from './step-label';
import { Observable, Subject } from 'rxjs';
/**
 * Position state of the content of each step in stepper that is used for transitioning
 * the content into correct position upon step selection change.
 */
export declare type StepContentPositionState = 'previous' | 'current' | 'next';
/** Possible orientation of a stepper. */
export declare type StepperOrientation = 'horizontal' | 'vertical';
/** Change event emitted on selection changes. */
export declare class StepperSelectionEvent {
    /** Index of the step now selected. */
    selectedIndex: number;
    /** Index of the step previously selected. */
    previouslySelectedIndex: number;
    /** The step instance now selected. */
    selectedStep: CdkStep;
    /** The step instance previously selected. */
    previouslySelectedStep: CdkStep;
}
/** The state of each step. */
export declare type StepState = 'number' | 'edit' | 'done' | 'error' | string;
/** Enum to represent the different states of the steps. */
export declare const STEP_STATE: {
    NUMBER: string;
    EDIT: string;
    DONE: string;
    ERROR: string;
};
/** InjectionToken that can be used to specify the global stepper options. */
export declare const STEPPER_GLOBAL_OPTIONS: InjectionToken<StepperOptions>;
/**
 * InjectionToken that can be used to specify the global stepper options.
 * @deprecated Use `STEPPER_GLOBAL_OPTIONS` instead.
 * @breaking-change 8.0.0.
 */
export declare const MAT_STEPPER_GLOBAL_OPTIONS: InjectionToken<StepperOptions>;
/** Configurable options for stepper. */
export interface StepperOptions {
    /**
     * Whether the stepper should display an error state or not.
     * Default behavior is assumed to be false.
     */
    showError?: boolean;
    /**
     * Whether the stepper should display the default indicator type
     * or not.
     * Default behavior is assumed to be true.
     */
    displayDefaultIndicatorType?: boolean;
}
export declare class CdkStep implements OnChanges {
    private _stepper;
    private _stepperOptions;
    _showError: boolean;
    _displayDefaultIndicatorType: boolean;
    /** Template for step label if it exists. */
    stepLabel: CdkStepLabel;
    /** Template for step content. */
    content: TemplateRef<any>;
    /** The top level abstract control of the step. */
    stepControl: FormControlLike;
    /** Whether user has seen the expanded step content or not. */
    interacted: boolean;
    /** Plain text label of the step. */
    label: string;
    /** Error message to display when there's an error. */
    errorMessage: string;
    /** Aria label for the tab. */
    ariaLabel: string;
    /**
     * Reference to the element that the tab is labelled by.
     * Will be cleared if `aria-label` is set at the same time.
     */
    ariaLabelledby: string;
    /** State of the step. */
    state: StepState;
    /** Whether the user can return to this step once it has been marked as completed. */
    editable: boolean;
    private _editable;
    /** Whether the completion of step is optional. */
    optional: boolean;
    private _optional;
    /** Whether step is marked as completed. */
    completed: boolean;
    private _customCompleted;
    private _getDefaultCompleted;
    /** Whether step has an error. */
    hasError: boolean;
    private _customError;
    private _getDefaultError;
    /** @breaking-change 8.0.0 remove the `?` after `stepperOptions` */
    constructor(_stepper: CdkStepper, stepperOptions?: StepperOptions);
    /** Selects this step component. */
    select(): void;
    /** Resets the step to its initial state. Note that this includes resetting form data. */
    reset(): void;
    ngOnChanges(): void;
}
export declare class CdkStepper implements AfterViewInit, OnDestroy {
    private _dir;
    private _changeDetectorRef;
    private _elementRef?;
    /** Emits when the component is destroyed. */
    protected _destroyed: Subject<void>;
    /** Used for managing keyboard focus. */
    private _keyManager;
    /**
     * @breaking-change 8.0.0 Remove `| undefined` once the `_document`
     * constructor param is required.
     */
    private _document;
    /**
     * The list of step components that the stepper is holding.
     * @deprecated use `steps` instead
     * @breaking-change 9.0.0 remove this property
     */
    _steps: QueryList<CdkStep>;
    /** The list of step components that the stepper is holding. */
    readonly steps: QueryList<CdkStep>;
    /**
     * The list of step headers of the steps in the stepper.
     * @deprecated Type to be changed to `QueryList<CdkStepHeader>`.
     * @breaking-change 8.0.0
     */
    _stepHeader: QueryList<FocusableOption>;
    /** Whether the validity of previous steps should be checked or not. */
    linear: boolean;
    private _linear;
    /** The index of the selected step. */
    selectedIndex: number;
    private _selectedIndex;
    /** The step that is selected. */
    selected: CdkStep;
    /** Event emitted when the selected step has changed. */
    selectionChange: EventEmitter<StepperSelectionEvent>;
    /** Used to track unique ID for each stepper component. */
    _groupId: number;
    protected _orientation: StepperOrientation;
    constructor(_dir: Directionality, _changeDetectorRef: ChangeDetectorRef, _elementRef?: ElementRef<HTMLElement> | undefined, _document?: any);
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    /** Selects and focuses the next step in list. */
    next(): void;
    /** Selects and focuses the previous step in list. */
    previous(): void;
    /** Resets the stepper to its initial state. Note that this includes clearing form data. */
    reset(): void;
    /** Returns a unique id for each step label element. */
    _getStepLabelId(i: number): string;
    /** Returns unique id for each step content element. */
    _getStepContentId(i: number): string;
    /** Marks the component to be change detected. */
    _stateChanged(): void;
    /** Returns position state of the step with the given index. */
    _getAnimationDirection(index: number): StepContentPositionState;
    /** Returns the type of icon to be displayed. */
    _getIndicatorType(index: number, state?: StepState): StepState;
    private _getDefaultIndicatorLogic;
    private _getGuidelineLogic;
    private _isCurrentStep;
    /** Returns the index of the currently-focused step header. */
    _getFocusIndex(): number | null;
    private _updateSelectedItemIndex;
    _onKeydown(event: KeyboardEvent): void;
    private _anyControlsInvalidOrPending;
    private _layoutDirection;
    /** Checks whether the stepper contains the focused element. */
    private _containsFocus;
}
/**
 * Simplified representation of a FormControl from @angular/forms.
 * Used to avoid having to bring in @angular/forms for a single optional interface.
 * @docs-private
 */
interface FormControlLike {
    asyncValidator: () => any | null;
    dirty: boolean;
    disabled: boolean;
    enabled: boolean;
    errors: {
        [key: string]: any;
    } | null;
    invalid: boolean;
    parent: any;
    pending: boolean;
    pristine: boolean;
    root: FormControlLike;
    status: string;
    statusChanges: Observable<any>;
    touched: boolean;
    untouched: boolean;
    updateOn: any;
    valid: boolean;
    validator: () => any | null;
    value: any;
    valueChanges: Observable<any>;
    clearAsyncValidators(): void;
    clearValidators(): void;
    disable(opts?: any): void;
    enable(opts?: any): void;
    get(path: (string | number)[] | string): FormControlLike | null;
    getError(errorCode: string, path?: (string | number)[] | string): any;
    hasError(errorCode: string, path?: (string | number)[] | string): boolean;
    markAllAsTouched(): void;
    markAsDirty(opts?: any): void;
    markAsPending(opts?: any): void;
    markAsPristine(opts?: any): void;
    markAsTouched(opts?: any): void;
    markAsUntouched(opts?: any): void;
    patchValue(value: any, options?: Object): void;
    reset(value?: any, options?: Object): void;
    setAsyncValidators(newValidator: () => any | (() => any)[] | null): void;
    setErrors(errors: {
        [key: string]: any;
    } | null, opts?: any): void;
    setParent(parent: any): void;
    setValidators(newValidator: () => any | (() => any)[] | null): void;
    setValue(value: any, options?: Object): void;
    updateValueAndValidity(opts?: any): void;
    patchValue(value: any, options?: any): void;
    registerOnChange(fn: Function): void;
    registerOnDisabledChange(fn: (isDisabled: boolean) => void): void;
    reset(formState?: any, options?: any): void;
    setValue(value: any, options?: any): void;
}
export {};
