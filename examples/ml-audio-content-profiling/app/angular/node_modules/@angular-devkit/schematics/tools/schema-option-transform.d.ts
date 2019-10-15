/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { schema } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { FileSystemSchematicDescription } from './description';
export declare class InvalidInputOptions<T = {}> extends schema.SchemaValidationException {
    constructor(options: T, errors: schema.SchemaValidatorError[]);
}
export declare function validateOptionsWithSchema(registry: schema.SchemaRegistry): <T extends {}>(schematic: FileSystemSchematicDescription, options: T, context?: import("../src/engine/interface").TypedSchematicContext<import("./description").FileSystemCollectionDescription, FileSystemSchematicDescription> | undefined) => Observable<T>;
