import * as ts from 'typescript';
import { Options } from './cli';
/**
 * Run tslint with the default configuration. Returns true on success.
 * @param options gts options
 * @param files files to run linter on
 * @param fix automatically fix linter errors. Ignored when options.dryRun is
 *            set.
 */
export declare function lint(options: Options, files?: string[], fix?: boolean): boolean;
export declare function createProgram(options: Options): ts.Program;
