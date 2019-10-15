/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Path, virtualFs } from '@angular-devkit/core';
import { workflow } from '@angular-devkit/schematics';
/**
 * A workflow specifically for Node tools.
 */
export declare class NodeWorkflow extends workflow.BaseWorkflow {
    constructor(host: virtualFs.Host, options: {
        force?: boolean;
        dryRun?: boolean;
        root?: Path;
        packageManager?: string;
    });
}
