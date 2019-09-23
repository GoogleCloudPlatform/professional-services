/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { logging } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { DelegateTree, Rule, SchematicContext, SchematicEngine, TaskConfiguration, Tree } from '../src';
export declare class UnitTestTree extends DelegateTree {
    readonly files: string[];
    readContent(path: string): string;
}
export declare class SchematicTestRunner {
    private _collectionName;
    private _engineHost;
    private _engine;
    private _collection;
    private _logger;
    constructor(_collectionName: string, collectionPath: string);
    readonly engine: SchematicEngine<{}, {}>;
    readonly logger: logging.Logger;
    readonly tasks: TaskConfiguration[];
    runSchematicAsync<SchematicSchemaT>(schematicName: string, opts?: SchematicSchemaT, tree?: Tree): Observable<UnitTestTree>;
    runSchematic<SchematicSchemaT>(schematicName: string, opts?: SchematicSchemaT, tree?: Tree): UnitTestTree;
    runExternalSchematicAsync<SchematicSchemaT>(collectionName: string, schematicName: string, opts?: SchematicSchemaT, tree?: Tree): Observable<UnitTestTree>;
    runExternalSchematic<SchematicSchemaT>(collectionName: string, schematicName: string, opts?: SchematicSchemaT, tree?: Tree): UnitTestTree;
    callRule(rule: Rule, tree: Tree, parentContext?: Partial<SchematicContext>): Observable<Tree>;
}
