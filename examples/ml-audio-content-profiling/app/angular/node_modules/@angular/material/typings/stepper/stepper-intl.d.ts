/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Optional } from '@angular/core';
import { Subject } from 'rxjs';
/** Stepper data that is required for internationalization. */
export declare class MatStepperIntl {
    /**
     * Stream that emits whenever the labels here are changed. Use this to notify
     * components if the labels have changed after initialization.
     */
    readonly changes: Subject<void>;
    /** Label that is rendered below optional steps. */
    optionalLabel: string;
}
/** @docs-private */
export declare function MAT_STEPPER_INTL_PROVIDER_FACTORY(parentIntl: MatStepperIntl): MatStepperIntl;
/** @docs-private */
export declare const MAT_STEPPER_INTL_PROVIDER: {
    provide: typeof MatStepperIntl;
    deps: Optional[][];
    useFactory: typeof MAT_STEPPER_INTL_PROVIDER_FACTORY;
};
