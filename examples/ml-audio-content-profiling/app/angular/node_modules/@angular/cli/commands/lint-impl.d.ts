/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TargetSpecifier } from '@angular-devkit/architect';
import { ArchitectCommand, ArchitectCommandOptions } from '../models/architect-command';
import { Arguments } from '../models/interface';
import { Schema as LintCommandSchema } from './lint';
export declare class LintCommand extends ArchitectCommand<LintCommandSchema> {
    readonly target = "lint";
    readonly multiTarget = true;
    protected runSingleTarget(targetSpec: TargetSpecifier, options: string[]): Promise<1 | 0>;
    run(options: ArchitectCommandOptions & Arguments): Promise<number>;
}
