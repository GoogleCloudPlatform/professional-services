/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '../model';
import { ControlContainer } from './control_container';
import { Form } from './form_interface';
import { AsyncValidatorFn, ValidatorFn } from './validators';
/**
 * @description
 * A base class for code shared between the `NgModelGroup` and `FormGroupName` directives.
 *
 * @publicApi
 */
export declare class AbstractFormGroupDirective extends ControlContainer implements OnInit, OnDestroy {
    /**
     * @description
     * An internal callback method triggered on the instance after the inputs are set.
     * Registers the group with its parent group.
     */
    ngOnInit(): void;
    /**
     * @description
     * An internal callback method triggered before the instance is destroyed.
     * Removes the group from its parent group.
     */
    ngOnDestroy(): void;
    /**
     * @description
     * The `FormGroup` bound to this directive.
     */
    readonly control: FormGroup;
    /**
     * @description
     * The path to this group from the top-level directive.
     */
    readonly path: string[];
    /**
     * @description
     * The top-level directive for this group if present, otherwise null.
     */
    readonly formDirective: Form | null;
    /**
     * @description
     * The synchronous validators registered with this group.
     */
    readonly validator: ValidatorFn | null;
    /**
     * @description
     * The async validators registered with this group.
     */
    readonly asyncValidator: AsyncValidatorFn | null;
}
