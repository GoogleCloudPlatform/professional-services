#!/usr/bin/env node
/// <amd-module name="@angular/compiler-cli/src/main" />
import 'reflect-metadata';
import * as ts from 'typescript';
import * as api from './transformers/api';
import { ParsedConfiguration } from './perform_compile';
export declare function main(args: string[], consoleError?: (s: string) => void, config?: NgcParsedConfiguration): number;
export declare function mainDiagnosticsForTest(args: string[], config?: NgcParsedConfiguration): ReadonlyArray<ts.Diagnostic | api.Diagnostic>;
export interface NgcParsedConfiguration extends ParsedConfiguration {
    watch?: boolean;
}
export declare function readCommandLineAndConfiguration(args: string[], existingOptions?: api.CompilerOptions, ngCmdLineOptions?: string[]): ParsedConfiguration;
export declare function watchMode(project: string, options: api.CompilerOptions, consoleError: (s: string) => void): {
    close: () => void;
    ready: (cb: () => void) => void;
    firstCompileResult: ReadonlyArray<api.Diagnostic | ts.Diagnostic>;
};
