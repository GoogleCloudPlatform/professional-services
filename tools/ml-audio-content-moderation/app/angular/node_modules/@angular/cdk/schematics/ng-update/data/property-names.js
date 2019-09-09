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
exports.propertyNames = {
    [target_version_1.TargetVersion.V7]: [
        {
            pr: 'https://github.com/angular/material2/pull/8286',
            changes: [
                {
                    replace: 'onChange',
                    replaceWith: 'changed',
                    whitelist: {
                        classes: ['SelectionModel']
                    }
                }
            ]
        },
        {
            pr: 'https://github.com/angular/material2/pull/12927',
            changes: [
                {
                    replace: 'flexibleDiemsions',
                    replaceWith: 'flexibleDimensions',
                    whitelist: {
                        classes: ['CdkConnectedOverlay']
                    }
                }
            ]
        }
    ],
    [target_version_1.TargetVersion.V6]: [
        {
            pr: 'https://github.com/angular/material2/pull/10161',
            changes: [
                {
                    replace: '_deprecatedOrigin',
                    replaceWith: 'origin',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                },
                {
                    replace: '_deprecatedPositions',
                    replaceWith: 'positions',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                },
                {
                    replace: '_deprecatedOffsetX',
                    replaceWith: 'offsetX',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                },
                {
                    replace: '_deprecatedOffsetY',
                    replaceWith: 'offsetY',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                },
                {
                    replace: '_deprecatedWidth',
                    replaceWith: 'width',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                },
                {
                    replace: '_deprecatedHeight',
                    replaceWith: 'height',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                },
                {
                    replace: '_deprecatedMinWidth',
                    replaceWith: 'minWidth',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                },
                {
                    replace: '_deprecatedMinHeight',
                    replaceWith: 'minHeight',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                },
                {
                    replace: '_deprecatedBackdropClass',
                    replaceWith: 'backdropClass',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                },
                {
                    replace: '_deprecatedScrollStrategy',
                    replaceWith: 'scrollStrategy',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                },
                {
                    replace: '_deprecatedOpen',
                    replaceWith: 'open',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                },
                {
                    replace: '_deprecatedHasBackdrop',
                    replaceWith: 'hasBackdrop',
                    whitelist: {
                        classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']
                    }
                }
            ]
        },
        {
            pr: 'https://github.com/angular/material2/pull/10257',
            changes: [
                {
                    replace: '_deprecatedPortal',
                    replaceWith: 'portal',
                    whitelist: {
                        classes: ['CdkPortalOutlet']
                    }
                },
                {
                    replace: '_deprecatedPortalHost',
                    replaceWith: 'portal',
                    whitelist: {
                        classes: ['CdkPortalOutlet']
                    }
                }
            ]
        },
    ]
};
//# sourceMappingURL=property-names.js.map