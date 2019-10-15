/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ArchitectCommand, ArchitectCommandOptions } from '../models/architect-command';
import { Arguments } from '../models/interface';
import { Schema as ServeCommandSchema } from './serve';
export declare class ServeCommand extends ArchitectCommand<ServeCommandSchema> {
    readonly target = "serve";
    validate(_options: ArchitectCommandOptions & Arguments): boolean;
    run(options: ArchitectCommandOptions & Arguments): Promise<number>;
}
