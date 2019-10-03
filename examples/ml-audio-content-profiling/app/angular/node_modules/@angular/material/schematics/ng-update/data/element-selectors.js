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
exports.elementSelectors = {
    [schematics_1.TargetVersion.V6]: [
        {
            pr: 'https://github.com/angular/material2/pull/10297',
            changes: [
                {
                    replace: 'mat-input-container',
                    replaceWith: 'mat-form-field'
                }
            ]
        }
    ]
};
//# sourceMappingURL=element-selectors.js.map