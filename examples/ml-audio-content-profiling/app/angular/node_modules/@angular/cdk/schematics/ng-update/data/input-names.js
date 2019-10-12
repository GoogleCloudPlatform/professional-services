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
exports.inputNames = {
    [target_version_1.TargetVersion.V6]: [
        {
            pr: 'https://github.com/angular/material2/pull/10161',
            changes: [
                {
                    replace: 'origin',
                    replaceWith: 'cdkConnectedOverlayOrigin',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                },
                {
                    replace: 'positions',
                    replaceWith: 'cdkConnectedOverlayPositions',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                },
                {
                    replace: 'offsetX',
                    replaceWith: 'cdkConnectedOverlayOffsetX',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                },
                {
                    replace: 'offsetY',
                    replaceWith: 'cdkConnectedOverlayOffsetY',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                },
                {
                    replace: 'width',
                    replaceWith: 'cdkConnectedOverlayWidth',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                },
                {
                    replace: 'height',
                    replaceWith: 'cdkConnectedOverlayHeight',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                },
                {
                    replace: 'minWidth',
                    replaceWith: 'cdkConnectedOverlayMinWidth',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                },
                {
                    replace: 'minHeight',
                    replaceWith: 'cdkConnectedOverlayMinHeight',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                },
                {
                    replace: 'backdropClass',
                    replaceWith: 'cdkConnectedOverlayBackdropClass',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                },
                {
                    replace: 'scrollStrategy',
                    replaceWith: 'cdkConnectedOverlayScrollStrategy',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                },
                {
                    replace: 'open',
                    replaceWith: 'cdkConnectedOverlayOpen',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                },
                {
                    replace: 'hasBackdrop',
                    replaceWith: 'cdkConnectedOverlayHasBackdrop',
                    whitelist: {
                        attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay']
                    }
                }
            ]
        },
    ]
};
//# sourceMappingURL=input-names.js.map