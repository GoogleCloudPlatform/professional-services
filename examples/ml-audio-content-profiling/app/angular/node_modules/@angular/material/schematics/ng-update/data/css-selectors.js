"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular/cdk/schematics");
exports.cssSelectors = {
    [schematics_1.TargetVersion.V6]: [
        {
            pr: 'https://github.com/angular/material2/pull/10296',
            changes: [
                {
                    replace: '.mat-form-field-placeholder',
                    replaceWith: '.mat-form-field-label'
                },
                {
                    replace: '.mat-input-container',
                    replaceWith: '.mat-form-field'
                },
                {
                    replace: '.mat-input-flex',
                    replaceWith: '.mat-form-field-flex'
                },
                {
                    replace: '.mat-input-hint-spacer',
                    replaceWith: '.mat-form-field-hint-spacer'
                },
                {
                    replace: '.mat-input-hint-wrapper',
                    replaceWith: '.mat-form-field-hint-wrapper'
                },
                {
                    replace: '.mat-input-infix',
                    replaceWith: '.mat-form-field-infix'
                },
                {
                    replace: '.mat-input-invalid',
                    replaceWith: '.mat-form-field-invalid'
                },
                {
                    replace: '.mat-input-placeholder',
                    replaceWith: '.mat-form-field-label'
                },
                {
                    replace: '.mat-input-placeholder-wrapper',
                    replaceWith: '.mat-form-field-label-wrapper'
                },
                {
                    replace: '.mat-input-prefix',
                    replaceWith: '.mat-form-field-prefix'
                },
                {
                    replace: '.mat-input-ripple',
                    replaceWith: '.mat-form-field-ripple'
                },
                {
                    replace: '.mat-input-subscript-wrapper',
                    replaceWith: '.mat-form-field-subscript-wrapper'
                },
                {
                    replace: '.mat-input-suffix',
                    replaceWith: '.mat-form-field-suffix'
                },
                {
                    replace: '.mat-input-underline',
                    replaceWith: '.mat-form-field-underline'
                },
                {
                    replace: '.mat-input-wrapper',
                    replaceWith: '.mat-form-field-wrapper'
                }
            ]
        },
        // TODO(devversion): this shouldn't be here because it's not a CSS selector. Move into misc
        // rule.
        {
            pr: 'https://github.com/angular/material2/pull/10430',
            changes: [
                {
                    replace: '$mat-font-family',
                    replaceWith: "Roboto, 'Helvetica Neue', sans-serif",
                    whitelist: {
                        stylesheet: true
                    }
                }
            ]
        }
    ]
};
//# sourceMappingURL=css-selectors.js.map