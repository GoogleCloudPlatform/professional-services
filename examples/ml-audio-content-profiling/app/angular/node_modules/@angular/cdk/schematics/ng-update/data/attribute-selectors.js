"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const target_version_1 = require("../target-version");
exports.attributeSelectors = {
    [target_version_1.TargetVersion.V6]: [
        {
            pr: 'https://github.com/angular/material2/pull/10257',
            changes: [
                {
                    replace: 'cdkPortalHost',
                    replaceWith: 'cdkPortalOutlet'
                },
                {
                    replace: 'portalHost',
                    replaceWith: 'cdkPortalOutlet'
                }
            ]
        }
    ]
};
//# sourceMappingURL=attribute-selectors.js.map