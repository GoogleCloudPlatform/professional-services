/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
declare global {
    const ngDevMode: null | NgDevModePerfCounters;
    interface NgDevModePerfCounters {
        firstTemplatePass: number;
        tNode: number;
        tView: number;
        rendererCreateTextNode: number;
        rendererSetText: number;
        rendererCreateElement: number;
        rendererAddEventListener: number;
        rendererSetAttribute: number;
        rendererRemoveAttribute: number;
        rendererSetProperty: number;
        rendererSetClassName: number;
        rendererAddClass: number;
        rendererRemoveClass: number;
        rendererSetStyle: number;
        rendererRemoveStyle: number;
        rendererDestroy: number;
        rendererDestroyNode: number;
        rendererMoveNode: number;
        rendererRemoveNode: number;
        rendererCreateComment: number;
    }
}
export declare function ngDevModeResetPerfCounters(): NgDevModePerfCounters;
