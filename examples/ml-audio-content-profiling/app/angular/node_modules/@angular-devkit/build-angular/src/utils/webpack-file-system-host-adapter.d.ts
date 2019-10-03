/// <reference types="node" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { JsonObject, virtualFs } from '@angular-devkit/core';
import { Callback } from '@ngtools/webpack/src/webpack';
import { Stats } from 'fs';
export declare class WebpackFileSystemHostAdapter {
    protected _host: virtualFs.Host<Stats>;
    protected _syncHost: virtualFs.SyncDelegateHost<Stats> | null;
    constructor(_host: virtualFs.Host<Stats>);
    private _doHostCall;
    stat(path: string, callback: Callback<Stats>): void;
    readdir(path: string, callback: Callback<string[]>): void;
    readFile(path: string, callback: Callback<Buffer>): void;
    readJson(path: string, callback: Callback<JsonObject>): void;
    readlink(path: string, callback: Callback<string>): void;
    statSync(path: string): Stats;
    readdirSync(path: string): string[];
    readFileSync(path: string): Buffer;
    readJsonSync(path: string): {};
    readlinkSync(path: string): string;
    purge(_changes?: string[] | string): void;
}
