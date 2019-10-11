/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Observable } from 'rxjs';
import { BuildEvent, Builder, BuilderConfiguration } from '../../src';
export interface BrowserTargetOptions {
    browserOption: number;
    optionalBrowserOption: boolean;
}
export default class BrowserTarget implements Builder<BrowserTargetOptions> {
    run(_browserConfig: BuilderConfiguration<Partial<BrowserTargetOptions>>): Observable<BuildEvent>;
}
