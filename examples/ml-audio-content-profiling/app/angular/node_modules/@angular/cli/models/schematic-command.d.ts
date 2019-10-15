/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { logging } from '@angular-devkit/core';
import { Engine, workflow } from '@angular-devkit/schematics';
import { FileSystemCollection, FileSystemCollectionDesc, FileSystemEngineHostBase, FileSystemSchematic, FileSystemSchematicDesc } from '@angular-devkit/schematics/tools';
import { BaseCommandOptions, Command } from './command';
import { Arguments, CommandContext, CommandDescription, Option } from './interface';
export interface BaseSchematicSchema {
    debug?: boolean;
    dryRun?: boolean;
    force?: boolean;
    interactive?: boolean;
    defaults?: boolean;
}
export interface RunSchematicOptions extends BaseSchematicSchema {
    collectionName: string;
    schematicName: string;
    schematicOptions?: string[];
    showNothingDone?: boolean;
}
export declare class UnknownCollectionError extends Error {
    constructor(collectionName: string);
}
export declare abstract class SchematicCommand<T extends (BaseSchematicSchema & BaseCommandOptions)> extends Command<T> {
    private readonly _engineHost;
    readonly allowPrivateSchematics: boolean;
    private _host;
    private _workspace;
    private readonly _engine;
    protected _workflow: workflow.BaseWorkflow;
    protected collectionName: string;
    protected schematicName?: string;
    constructor(context: CommandContext, description: CommandDescription, logger: logging.Logger, _engineHost?: FileSystemEngineHostBase);
    initialize(options: T & Arguments): Promise<void>;
    printHelp(options: T & Arguments): Promise<number>;
    printHelpUsage(): Promise<void>;
    protected getEngineHost(): FileSystemEngineHostBase;
    protected getEngine(): Engine<FileSystemCollectionDesc, FileSystemSchematicDesc>;
    protected getCollection(collectionName: string): FileSystemCollection;
    protected getSchematic(collection: FileSystemCollection, schematicName: string, allowPrivate?: boolean): FileSystemSchematic;
    protected setPathOptions(options: Option[], workingDir: string): {};
    protected createWorkflow(options: BaseSchematicSchema): workflow.BaseWorkflow;
    protected getDefaultSchematicCollection(): string;
    protected runSchematic(options: RunSchematicOptions): Promise<number | void>;
    protected parseFreeFormArguments(schematicOptions: string[]): Promise<Arguments>;
    protected parseArguments(schematicOptions: string[], options: Option[] | null): Promise<Arguments>;
    private _loadWorkspace;
}
