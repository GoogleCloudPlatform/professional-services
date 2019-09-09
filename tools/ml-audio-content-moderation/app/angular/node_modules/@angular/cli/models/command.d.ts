/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { logging } from '@angular-devkit/core';
import { Arguments, CommandContext, CommandDescription, CommandDescriptionMap, CommandScope, CommandWorkspace, Option, SubCommandDescription } from './interface';
export interface BaseCommandOptions {
    help?: boolean | string;
}
export declare abstract class Command<T extends BaseCommandOptions = BaseCommandOptions> {
    readonly description: CommandDescription;
    protected readonly logger: logging.Logger;
    allowMissingWorkspace: boolean;
    workspace: CommandWorkspace;
    protected static commandMap: CommandDescriptionMap;
    static setCommandMap(map: CommandDescriptionMap): void;
    constructor(context: CommandContext, description: CommandDescription, logger: logging.Logger);
    initialize(options: T & Arguments): Promise<void>;
    printHelp(options: T & Arguments): Promise<number>;
    printJsonHelp(_options: T & Arguments): Promise<number>;
    protected printHelpUsage(): Promise<void>;
    protected printHelpSubcommand(subcommand: SubCommandDescription): Promise<void>;
    protected printHelpOptions(options?: Option[]): Promise<void>;
    validateScope(scope?: CommandScope): Promise<void>;
    abstract run(options: T & Arguments): Promise<number | void>;
    validateAndRun(options: T & Arguments): Promise<number | void>;
}
