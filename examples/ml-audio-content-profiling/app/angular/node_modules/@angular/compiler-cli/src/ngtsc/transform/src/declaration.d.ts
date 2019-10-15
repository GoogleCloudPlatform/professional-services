/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/transform/src/declaration" />
import * as ts from 'typescript';
import { CompileResult } from './api';
/**
 * Processes .d.ts file text and adds static field declarations, with types.
 */
export declare class DtsFileTransformer {
    private coreImportsFrom;
    private ivyFields;
    private imports;
    constructor(coreImportsFrom: ts.SourceFile | null, importPrefix?: string);
    /**
     * Track that a static field was added to the code for a class.
     */
    recordStaticField(name: string, decls: CompileResult[]): void;
    /**
     * Process the .d.ts text for a file and add any declarations which were recorded.
     */
    transform(dts: string, tsPath: string): string;
}
