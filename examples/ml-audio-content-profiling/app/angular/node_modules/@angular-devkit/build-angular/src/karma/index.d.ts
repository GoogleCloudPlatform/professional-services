/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuildEvent, Builder, BuilderConfiguration, BuilderContext } from '@angular-devkit/architect';
import { Observable } from 'rxjs';
import { AssetPatternObject, CurrentFileReplacement } from '../browser/schema';
import { KarmaBuilderSchema } from './schema';
export interface NormalizedKarmaBuilderSchema extends KarmaBuilderSchema {
    assets: AssetPatternObject[];
    fileReplacements: CurrentFileReplacement[];
}
export declare class KarmaBuilder implements Builder<KarmaBuilderSchema> {
    context: BuilderContext;
    constructor(context: BuilderContext);
    run(builderConfig: BuilderConfiguration<KarmaBuilderSchema>): Observable<BuildEvent>;
    private _buildWebpackConfig;
}
export default KarmaBuilder;
