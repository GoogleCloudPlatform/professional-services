/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngcc/src/rendering/ngcc_import_manager" />
import { ImportManager } from '../../../ngtsc/translator';
export declare class NgccImportManager extends ImportManager {
    private isFlat;
    constructor(isFlat: boolean, isCore: boolean, prefix?: string);
    generateNamedImport(moduleName: string, symbol: string): string | null;
}
