/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngcc/src/host/dts_mapper" />
/**
 * Map source files to their associated typings definitions files.
 */
export declare class DtsMapper {
    private sourceRoot;
    private dtsRoot;
    constructor(sourceRoot: string, dtsRoot: string);
    /**
     * Given the absolute path to a source file, return the absolute path to the corresponding `.d.ts`
     * file. Assume that source files and `.d.ts` files have the same directory layout and the names
     * of the `.d.ts` files can be derived by replacing the `.js` extension of the source file with
     * `.d.ts`.
     *
     * @param sourceFileName The absolute path to the source file whose corresponding `.d.ts` file
     *     should be returned.
     *
     * @returns The absolute path to the `.d.ts` file that corresponds to the specified source file.
     */
    getDtsFileNameFor(sourceFileName: string): string;
}
