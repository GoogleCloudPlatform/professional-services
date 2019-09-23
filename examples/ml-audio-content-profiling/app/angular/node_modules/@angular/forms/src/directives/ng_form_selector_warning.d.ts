/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '@angular/core';
/**
 * Token to provide to turn off the warning when using 'ngForm' deprecated selector.
 */
export declare const NG_FORM_SELECTOR_WARNING: InjectionToken<{}>;
/**
 * This directive is solely used to display warnings when the deprecated `ngForm` selector is used.
 *
 * @deprecated in Angular v6 and will be removed in Angular v9.
 * @ngModule FormsModule
 * @publicApi
 */
export declare class NgFormSelectorWarning {
    constructor(ngFormWarning: string | null);
}
