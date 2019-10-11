/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Arguments } from '../models/interface';
import { SchematicCommand } from '../models/schematic-command';
import { Schema as AddCommandSchema } from './add';
export declare class AddCommand extends SchematicCommand<AddCommandSchema> {
    readonly allowPrivateSchematics = true;
    run(options: AddCommandSchema & Arguments): Promise<number | void>;
}
