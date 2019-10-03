/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/transformers/program" />
import { MessageBundle } from '@angular/compiler';
import * as path from 'path';
import * as ts from 'typescript';
import { CompilerHost, CompilerOptions, Program } from './api';
/**
 * Checks whether a given version ∈ [minVersion, maxVersion[
 * An error will be thrown if the following statements are simultaneously true:
 * - the given version ∉ [minVersion, maxVersion[,
 * - the result of the version check is not meant to be bypassed (the parameter disableVersionCheck
 * is false)
 *
 * @param version The version on which the check will be performed
 * @param minVersion The lower bound version. A valid version needs to be greater than minVersion
 * @param maxVersion The upper bound version. A valid version needs to be strictly less than
 * maxVersion
 * @param disableVersionCheck Indicates whether version check should be bypassed
 *
 * @throws Will throw an error if the following statements are simultaneously true:
 * - the given version ∉ [minVersion, maxVersion[,
 * - the result of the version check is not meant to be bypassed (the parameter disableVersionCheck
 * is false)
 */
export declare function checkVersion(version: string, minVersion: string, maxVersion: string, disableVersionCheck: boolean | undefined): void;
export declare function createProgram({ rootNames, options, host, oldProgram }: {
    rootNames: ReadonlyArray<string>;
    options: CompilerOptions;
    host: CompilerHost;
    oldProgram?: Program;
}): Program;
/**
 * Returns a function that can adjust a path from source path to out path,
 * based on an existing mapping from source to out path.
 *
 * TODO(tbosch): talk to the TypeScript team to expose their logic for calculating the `rootDir`
 * if none was specified.
 *
 * Note: This function works on normalized paths from typescript but should always return
 * POSIX normalized paths for output paths.
 */
export declare function createSrcToOutPathMapper(outDir: string | undefined, sampleSrcFileName: string | undefined, sampleOutFileName: string | undefined, host?: {
    dirname: typeof path.dirname;
    resolve: typeof path.resolve;
    relative: typeof path.relative;
}): (srcFileName: string) => string;
export declare function i18nExtract(formatName: string | null, outFile: string | null, host: ts.CompilerHost, options: CompilerOptions, bundle: MessageBundle): string[];
export declare function i18nSerialize(bundle: MessageBundle, formatName: string, options: CompilerOptions): string;
export declare function i18nGetExtension(formatName: string): string;
