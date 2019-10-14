/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { CdkStep, CdkStepper, StepperOptions } from '@angular/cdk/stepper';
import { AnimationEvent } from '@angular/animations';
import { AfterContentInit, ChangeDetectorRef, ElementRef, EventEmitter, QueryList, TemplateRef } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Subject } from 'rxjs';
import { MatStepHeader } from './step-header';
import { MatStepLabel } from './step-label';
import { MatStepperIcon, MatStepperIconContext } from './stepper-icon';
export declare class MatStep extends CdkStep implements ErrorStateMatcher {
    private _errorStateMatcher;
    /** Content for step label given by `<ng-template matStepLabel>`. */
    stepLabel: MatStepLabel;
    /** @breaking-change 8.0.0 remove the `?` after `stepperOptions` */
    constructor(stepper: MatStepper, _errorStateMatcher: ErrorStateMatcher, stepperOptions?: StepperOptions);
    /** Custom error state matcher that additionally checks for validity of interacted form. */
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean;
}
export declare class MatStepper extends CdkStepper implements AfterContentInit {
    /** The list of step headers of the steps in the stepper. */
    _stepHeader: QueryList<MatStepHeader>;
    /** Steps that the stepper holds. */
    _steps: QueryList<MatStep>;
    /** Custom icon overrides passed in by the consumer. */
    _icons: QueryList<MatStepperIcon>;
    /** Event emitted when the current step is done transitioning in. */
    readonly animationDone: EventEmitter<void>;
    /** Consumer-specified template-refs to be used to override the header icons. */
    _iconOverrides: {
        [key: string]: TemplateRef<MatStepperIconContext>;
    };
    /** Stream of animation `done` events when the body expands/collapses. */
    _animationDone: Subject<AnimationEvent>;
    ngAfterContentInit(): void;
}
export declare class MatHorizontalStepper extends MatStepper {
    /** Whether the label should display in bottom or end position. */
    labelPosition: 'bottom' | 'end';
}
export declare class MatVerticalStepper extends MatStepper {
    constructor(dir: Directionality, changeDetectorRef: ChangeDetectorRef, elementRef?: ElementRef<HTMLElement>, _document?: any);
}
