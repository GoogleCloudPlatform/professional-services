"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const webpack_configs_1 = require("../angular-cli-files/models/webpack-configs");
const read_tsconfig_1 = require("../angular-cli-files/utilities/read-tsconfig");
const require_project_module_1 = require("../angular-cli-files/utilities/require-project-module");
const utils_1 = require("../utils");
const webpackMerge = require('webpack-merge');
class KarmaBuilder {
    constructor(context) {
        this.context = context;
    }
    run(builderConfig) {
        const options = builderConfig.options;
        const root = this.context.workspace.root;
        const projectRoot = core_1.resolve(root, builderConfig.root);
        const host = new core_1.virtualFs.AliasHost(this.context.host);
        return rxjs_1.of(null).pipe(operators_1.concatMap(() => utils_1.normalizeFileReplacements(options.fileReplacements, host, root)), operators_1.tap(fileReplacements => options.fileReplacements = fileReplacements), operators_1.concatMap(() => utils_1.normalizeAssetPatterns(options.assets, host, root, projectRoot, builderConfig.sourceRoot)), 
        // Replace the assets in options with the normalized version.
        operators_1.tap((assetPatternObjects => options.assets = assetPatternObjects)), operators_1.concatMap(() => new rxjs_1.Observable(obs => {
            const karma = require_project_module_1.requireProjectModule(core_1.getSystemPath(projectRoot), 'karma');
            const karmaConfig = core_1.getSystemPath(core_1.resolve(root, core_1.normalize(options.karmaConfig)));
            // TODO: adjust options to account for not passing them blindly to karma.
            // const karmaOptions: any = Object.assign({}, options);
            // tslint:disable-next-line:no-any
            const karmaOptions = {};
            if (options.watch !== undefined) {
                karmaOptions.singleRun = !options.watch;
            }
            // Convert browsers from a string to an array
            if (options.browsers) {
                karmaOptions.browsers = options.browsers.split(',');
            }
            if (options.reporters) {
                // Split along commas to make it more natural, and remove empty strings.
                const reporters = options.reporters
                    .reduce((acc, curr) => acc.concat(curr.split(/,/)), [])
                    .filter(x => !!x);
                if (reporters.length > 0) {
                    karmaOptions.reporters = reporters;
                }
            }
            const sourceRoot = builderConfig.sourceRoot && core_1.resolve(root, builderConfig.sourceRoot);
            karmaOptions.buildWebpack = {
                root: core_1.getSystemPath(root),
                projectRoot: core_1.getSystemPath(projectRoot),
                options: options,
                webpackConfig: this._buildWebpackConfig(root, projectRoot, sourceRoot, host, options),
                // Pass onto Karma to emit BuildEvents.
                successCb: () => obs.next({ success: true }),
                failureCb: () => obs.next({ success: false }),
                // Workaround for https://github.com/karma-runner/karma/issues/3154
                // When this workaround is removed, user projects need to be updated to use a Karma
                // version that has a fix for this issue.
                toJSON: () => { },
            };
            // TODO: inside the configs, always use the project root and not the workspace root.
            // Until then we pretend the app root is relative (``) but the same as `projectRoot`.
            karmaOptions.buildWebpack.options.root = '';
            // Assign additional karmaConfig options to the local ngapp config
            karmaOptions.configFile = karmaConfig;
            // Complete the observable once the Karma server returns.
            const karmaServer = new karma.Server(karmaOptions, () => obs.complete());
            karmaServer.start();
            // Cleanup, signal Karma to exit.
            return () => {
                // Karma does not seem to have a way to exit the server gracefully.
                // See https://github.com/karma-runner/karma/issues/2867#issuecomment-369912167
                // TODO: make a PR for karma to add `karmaServer.close(code)`, that
                // calls `disconnectBrowsers(code);`
                // karmaServer.close();
            };
        })));
    }
    _buildWebpackConfig(root, projectRoot, sourceRoot, host, options) {
        let wco;
        const tsConfigPath = core_1.getSystemPath(core_1.resolve(root, core_1.normalize(options.tsConfig)));
        const tsConfig = read_tsconfig_1.readTsconfig(tsConfigPath);
        const projectTs = require_project_module_1.requireProjectModule(core_1.getSystemPath(projectRoot), 'typescript');
        const supportES2015 = tsConfig.options.target !== projectTs.ScriptTarget.ES3
            && tsConfig.options.target !== projectTs.ScriptTarget.ES5;
        const compatOptions = Object.assign({}, options, { 
            // Some asset logic inside getCommonConfig needs outputPath to be set.
            outputPath: '' });
        wco = {
            root: core_1.getSystemPath(root),
            logger: this.context.logger,
            projectRoot: core_1.getSystemPath(projectRoot),
            sourceRoot: sourceRoot && core_1.getSystemPath(sourceRoot),
            // TODO: use only this.options, it contains all flags and configs items already.
            buildOptions: compatOptions,
            tsConfig,
            tsConfigPath,
            supportES2015,
        };
        wco.buildOptions.progress = utils_1.defaultProgress(wco.buildOptions.progress);
        const webpackConfigs = [
            webpack_configs_1.getCommonConfig(wco),
            webpack_configs_1.getStylesConfig(wco),
            webpack_configs_1.getNonAotTestConfig(wco, host),
            webpack_configs_1.getTestConfig(wco),
        ];
        return webpackMerge(webpackConfigs);
    }
}
exports.KarmaBuilder = KarmaBuilder;
exports.default = KarmaBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2thcm1hL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBUUgsK0NBQTBGO0FBRTFGLCtCQUFzQztBQUN0Qyw4Q0FBZ0Q7QUFHaEQsaUZBS3FEO0FBQ3JELGdGQUE0RTtBQUM1RSxrR0FBNkY7QUFFN0Ysb0NBQThGO0FBRTlGLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQVE5QyxNQUFhLFlBQVk7SUFDdkIsWUFBbUIsT0FBdUI7UUFBdkIsWUFBTyxHQUFQLE9BQU8sQ0FBZ0I7SUFBSSxDQUFDO0lBRS9DLEdBQUcsQ0FBQyxhQUF1RDtRQUN6RCxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDO1FBQ3RDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztRQUN6QyxNQUFNLFdBQVcsR0FBRyxjQUFPLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0RCxNQUFNLElBQUksR0FBRyxJQUFJLGdCQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBZ0MsQ0FBQyxDQUFDO1FBRXBGLE9BQU8sU0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDbEIscUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxpQ0FBeUIsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQ2hGLGVBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDLEVBQ3BFLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsOEJBQXNCLENBQ3BDLE9BQU8sQ0FBQyxN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LFVBQVUsRUFBRSxVQUFVLElBQUksb0JBQWEsQ0FBQyxVQUFVLENBQUM7WUFDbkQsZ0ZBQWdGO1lBQ2hGLFlBQVksRUFBRSxhQUFhO1lBQzNCLFFBQVE7WUFDUixZQUFZO1lBQ1osYUFBYTtTQUNkLENBQUM7UUFFRixHQUFHLENBQUMsWUFBWSxDQUFDLFFBQVEsR0FBRyx1QkFBZSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFdkUsTUFBTSxjQUFjLEdBQVM7WUFDM0IsaUNBQWUsQ0FBQyxHQUFHLENBQUM7WUFDcEIsaUNBQWUsQ0FBQyxHQUFHLENBQUM7WUFDcEIscUNBQW1CLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztZQUM5QiwrQkFBYSxDQUFDLEdBQUcsQ0FBQztTQUNuQixDQUFDO1FBRUYsT0FBTyxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDdEMsQ0FBQztDQUNGO0FBbklELG9DQW1JQztBQUVELGtCQUFlLFlBQVksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQnVpbGRFdmVudCxcbiAgQnVpbGRlcixcbiAgQnVpbGRlckNvbmZpZ3VyYXRpb24sXG4gIEJ1aWxkZXJDb250ZXh0LFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvYXJjaGl0ZWN0JztcbmltcG9ydCB7IFBhdGgsIGdldFN5c3RlbVBhdGgsIG5vcm1hbGl6ZSwgcmVzb2x2ZSwgdmlydHVhbEZzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgb2YgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNvbmNhdE1hcCwgdGFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8taW1wbGljaXQtZGVwZW5kZW5jaWVzXG5pbXBvcnQgeyBXZWJwYWNrQ29uZmlnT3B0aW9ucyB9IGZyb20gJy4uL2FuZ3VsYXItY2xpLWZpbGVzL21vZGVscy9idWlsZC1vcHRpb25zJztcbmltcG9ydCB7XG4gIGdldENvbW1vbkNvbmZpZyxcbiAgZ2V0Tm9uQW90VGVzdENvbmZpZyxcbiAgZ2V0U3R5bGVzQ29uZmlnLFxuICBnZXRUZXN0Q29uZmlnLFxufSBmcm9tICcuLi9hbmd1bGFyLWNsaS1maWxlcy9tb2RlbHMvd2VicGFjay1jb25maWdzJztcbmltcG9ydCB7IHJlYWRUc2NvbmZpZyB9IGZyb20gJy4uL2FuZ3VsYXItY2xpLWZpbGVzL3V0aWxpdGllcy9yZWFkLXRzY29uZmlnJztcbmltcG9ydCB7IHJlcXVpcmVQcm9qZWN0TW9kdWxlIH0gZnJvbSAnLi4vYW5ndWxhci1jbGktZmlsZXMvdXRpbGl0aWVzL3JlcXVpcmUtcHJvamVjdC1tb2R1bGUnO1xuaW1wb3J0IHsgQXNzZXRQYXR0ZXJuT2JqZWN0LCBDdXJyZW50RmlsZVJlcGxhY2VtZW50IH0gZnJvbSAnLi4vYnJvd3Nlci9zY2hlbWEnO1xuaW1wb3J0IHsgZGVmYXVsdFByb2dyZXNzLCBub3JtYWxpemVBc3NldFBhdHRlcm5zLCBub3JtYWxpemVGaWxlUmVwbGFjZW1lbnRzIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgS2FybWFCdWlsZGVyU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuY29uc3Qgd2VicGFja01lcmdlID0gcmVxdWlyZSgnd2VicGFjay1tZXJnZScpO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgTm9ybWFsaXplZEthcm1hQnVpbGRlclNjaGVtYSBleHRlbmRzIEthcm1hQnVpbGRlclNjaGVtYSB7XG4gIGFzc2V0czogQXNzZXRQYXR0ZXJuT2JqZWN0W107XG4gIGZpbGVSZXBsYWNlbWVudHM6IEN1cnJlbnRGaWxlUmVwbGFjZW1lbnRbXTtcbn1cblxuZXhwb3J0IGNsYXNzIEthcm1hQnVpbGRlciBpbXBsZW1lbnRzIEJ1aWxkZXI8S2FybWFCdWlsZGVyU2NoZW1hPiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCkgeyB9XG5cbiAgcnVuKGJ1aWxkZXJDb25maWc6IEJ1aWxkZXJDb25maWd1cmF0aW9uPEthcm1hQnVpbGRlclNjaGVtYT4pOiBPYnNlcnZhYmxlPEJ1aWxkRXZlbnQ+IHtcbiAgICBjb25zdCBvcHRpb25zID0gYnVpbGRlckNvbmZpZy5vcHRpb25zO1xuICAgIGNvbnN0IHJvb3QgPSB0aGlzLmNvbnRleHQud29ya3NwYWNlLnJvb3Q7XG4gICAgY29uc3QgcHJvamVjdFJvb3QgPSByZXNvbHZlKHJvb3QsIGJ1aWxkZXJDb25maWcucm9vdCk7XG4gICAgY29uc3QgaG9zdCA9IG5ldyB2aXJ0dWFsRnMuQWxpYXNIb3N0KHRoaXMuY29udGV4dC5ob3N0IGFzIHZpcnR1YWxGcy5Ib3N0PGZzLlN0YXRzPik7XG5cbiAgICByZXR1cm4gb2YobnVsbCkucGlwZShcbiAgICAgIGNvbmNhdE1hcCgoKSA9PiBub3JtYWxpemVGaWxlUmVwbGFjZW1lbnRzKG9wdGlvbnMuZmlsZVJlcGxhY2VtZW50cywgaG9zdCwgcm9vdCkpLFxuICAgICAgdGFwKGZpbGVSZXBsYWNlbWVudHMgPT4gb3B0aW9ucy5maWxlUmVwbGFjZW1lbnRzID0gZmlsZVJlcGxhY2VtZW50cyksXG4gICAgICBjb25jYXRNYXAoKCkgPT4gbm9ybWFsaXplQXNzZXRQYXR0ZXJucyhcbiAgICAgICAgb3B0aW9ucy5hc3NldHMsIGhvc3QsIHJvb3QsIHByb2plY3RSb290LCBidWlsZGVyQ29uZmlnLnNvdXJjZVJvb3QpKSxcbiAgICAgIC8vIFJlcGxhY2UgdGhlIGFzc2V0cyBpbiBvcHRpb25zIHdpdGggdGhlIG5vcm1hbGl6ZWQgdmVyc2lvbi5cbiAgICAgIHRhcCgoYXNzZXRQYXR0ZXJuT2JqZWN0cyA9PiBvcHRpb25zLmFzc2V0cyA9IGFzc2V0UGF0dGVybk9iamVjdHMpKSxcbiAgICAgIGNvbmNhdE1hcCgoKSA9PiBuZXcgT2JzZXJ2YWJsZShvYnMgPT4ge1xuICAgICAgICBjb25zdCBrYXJtYSA9IHJlcXVpcmVQcm9qZWN0TW9kdWxlKGdldFN5c3RlbVBhdGgocHJvamVjdFJvb3QpLCAna2FybWEnKTtcbiAgICAgICAgY29uc3Qga2FybWFDb25maWcgPSBnZXRTeXN0ZW1QYXRoKHJlc29sdmUocm9vdCwgbm9ybWFsaXplKG9wdGlvbnMua2FybWFDb25maWcpKSk7XG5cbiAgICAgICAgLy8gVE9ETzogYWRqdXN0IG9wdGlvbnMgdG8gYWNjb3VudCBmb3Igbm90IHBhc3NpbmcgdGhlbSBibGluZGx5IHRvIGthcm1hLlxuICAgICAgICAvLyBjb25zdCBrYXJtYU9wdGlvbnM6IGFueSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICAgIGNvbnN0IGthcm1hT3B0aW9uczogYW55ID0ge307XG5cbiAgICAgICAgaWYgKG9wdGlvbnMud2F0Y2ggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGthcm1hT3B0aW9ucy5zaW5nbGVSdW4gPSAhb3B0aW9ucy53YXRjaDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbnZlcnQgYnJvd3NlcnMgZnJvbSBhIHN0cmluZyB0byBhbiBhcnJheVxuICAgICAgICBpZiAob3B0aW9ucy5icm93c2Vycykge1xuICAgICAgICAgIGthcm1hT3B0aW9ucy5icm93c2VycyA9IG9wdGlvbnMuYnJvd3NlcnMuc3BsaXQoJywnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLnJlcG9ydGVycykge1xuICAgICAgICAgIC8vIFNwbGl0IGFsb25nIGNvbW1hcyB0byBtYWtlIGl0IG1vcmUgbmF0dXJhbCwgYW5kIHJlbW92ZSBlbXB0eSBzdHJpbmdzLlxuICAgICAgICAgIGNvbnN0IHJlcG9ydGVycyA9IG9wdGlvbnMucmVwb3J0ZXJzXG4gICAgICAgICAgICAucmVkdWNlPHN0cmluZ1tdPigoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIuc3BsaXQoLywvKSksIFtdKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheCk7XG5cbiAgICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGthcm1hT3B0aW9ucy5yZXBvcnRlcnMgPSByZXBvcnRlcnM7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc291cmNlUm9vdCA9IGJ1aWxkZXJDb25maWcuc291cmNlUm9vdCAmJiByZXNvbHZlKHJvb3QsIGJ1aWxkZXJDb25maWcuc291cmNlUm9vdCk7XG5cbiAgICAgICAga2FybWFPcHRpb25zLmJ1aWxkV2VicGFjayA9IHtcbiAgICAgICAgICByb290OiBnZXRTeXN0ZW1QYXRoKHJvb3QpLFxuICAgICAgICAgIHByb2plY3RSb290OiBnZXRTeXN0ZW1QYXRoKHByb2plY3RSb290KSxcbiAgICAgICAgICBvcHRpb25zOiBvcHRpb25zIGFzIE5vcm1hbGl6ZWRLYXJtYUJ1aWxkZXJTY2hlbWEsXG4gICAgICAgICAgd2VicGFja0NvbmZpZzogdGhpcy5fYnVpbGRXZWJwYWNrQ29uZmlnKHJvb3QsIHByb2plY3RSb290LCBzb3VyY2VSb290LCBob3N0LFxuICAgICAgICAgICAgb3B0aW9ucyBhcyBOb3JtYWxpemVkS2FybWFCdWlsZGVyU2NoZW1hKSxcbiAgICAgICAgICAvLyBQYXNzIG9udG8gS2FybWEgdG8gZW1pdCBCdWlsZEV2ZW50cy5cbiAgICAgICAgICBzdWNjZXNzQ2I6ICgpID0+IG9icy5uZXh0KHsgc3VjY2VzczogdHJ1ZSB9KSxcbiAgICAgICAgICBmYWlsdXJlQ2I6ICgpID0+IG9icy5uZXh0KHsgc3VjY2VzczogZmFsc2UgfSksXG4gICAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL2thcm1hLXJ1bm5lci9rYXJtYS9pc3N1ZXMvMzE1NFxuICAgICAgICAgIC8vIFdoZW4gdGhpcyB3b3JrYXJvdW5kIGlzIHJlbW92ZWQsIHVzZXIgcHJvamVjdHMgbmVlZCB0byBiZSB1cGRhdGVkIHRvIHVzZSBhIEthcm1hXG4gICAgICAgICAgLy8gdmVyc2lvbiB0aGF0IGhhcyBhIGZpeCBmb3IgdGhpcyBpc3N1ZS5cbiAgICAgICAgICB0b0pTT046ICgpID0+IHsgfSxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBUT0RPOiBpbnNpZGUgdGhlIGNvbmZpZ3MsIGFsd2F5cyB1c2UgdGhlIHByb2plY3Qgcm9vdCBhbmQgbm90IHRoZSB3b3Jrc3BhY2Ugcm9vdC5cbiAgICAgICAgLy8gVW50aWwgdGhlbiB3ZSBwcmV0ZW5kIHRoZSBhcHAgcm9vdCBpcyByZWxhdGl2ZSAoYGApIGJ1dCB0aGUgc2FtZSBhcyBgcHJvamVjdFJvb3RgLlxuICAgICAgICBrYXJtYU9wdGlvbnMuYnVpbGRXZWJwYWNrLm9wdGlvbnMucm9vdCA9ICcnO1xuXG4gICAgICAgIC8vIEFzc2lnbiBhZGRpdGlvbmFsIGthcm1hQ29uZmlnIG9wdGlvbnMgdG8gdGhlIGxvY2FsIG5nYXBwIGNvbmZpZ1xuICAgICAgICBrYXJtYU9wdGlvbnMuY29uZmlnRmlsZSA9IGthcm1hQ29uZmlnO1xuXG4gICAgICAgIC8vIENvbXBsZXRlIHRoZSBvYnNlcnZhYmxlIG9uY2UgdGhlIEthcm1hIHNlcnZlciByZXR1cm5zLlxuICAgICAgICBjb25zdCBrYXJtYVNlcnZlciA9IG5ldyBrYXJtYS5TZXJ2ZXIoa2FybWFPcHRpb25zLCAoKSA9PiBvYnMuY29tcGxldGUoKSk7XG4gICAgICAgIGthcm1hU2VydmVyLnN0YXJ0KCk7XG5cbiAgICAgICAgLy8gQ2xlYW51cCwgc2lnbmFsIEthcm1hIHRvIGV4aXQuXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgLy8gS2FybWEgZG9lcyBub3Qgc2VlbSB0byBoYXZlIGEgd2F5IHRvIGV4aXQgdGhlIHNlcnZlciBncmFjZWZ1bGx5LlxuICAgICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20va2FybWEtcnVubmVyL2thcm1hL2lzc3Vlcy8yODY3I2lzc3VlY29tbWVudC0zNjk5MTIxNjdcbiAgICAgICAgICAvLyBUT0RPOiBtYWtlIGEgUFIgZm9yIGthcm1hIHRvIGFkZCBga2FybWFTZXJ2ZXIuY2xvc2UoY29kZSlgLCB0aGF0XG4gICAgICAgICAgLy8gY2FsbHMgYGRpc2Nvbm5lY3RCcm93c2Vycyhjb2RlKTtgXG4gICAgICAgICAgLy8ga2FybWFTZXJ2ZXIuY2xvc2UoKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBfYnVpbGRXZWJwYWNrQ29uZmlnKFxuICAgIHJvb3Q6IFBhdGgsXG4gICAgcHJvamVjdFJvb3Q6IFBhdGgsXG4gICAgc291cmNlUm9vdDogUGF0aCB8IHVuZGVmaW5lZCxcbiAgICBob3N0OiB2aXJ0dWFsRnMuSG9zdDxmcy5TdGF0cz4sXG4gICAgb3B0aW9uczogTm9ybWFsaXplZEthcm1hQnVpbGRlclNjaGVtYSxcbiAgKSB7XG4gICAgbGV0IHdjbzogV2VicGFja0NvbmZpZ09wdGlvbnM7XG5cbiAgICBjb25zdCB0c0NvbmZpZ1BhdGggPSBnZXRTeXN0ZW1QYXRoKHJlc29sdmUocm9vdCwgbm9ybWFsaXplKG9wdGlvbnMudHNDb25maWcpKSk7XG4gICAgY29uc3QgdHNDb25maWcgPSByZWFkVHNjb25maWcodHNDb25maWdQYXRoKTtcblxuICAgIGNvbnN0IHByb2plY3RUcyA9IHJlcXVpcmVQcm9qZWN0TW9kdWxlKGdldFN5c3RlbVBhdGgocHJvamVjdFJvb3QpLCAndHlwZXNjcmlwdCcpIGFzIHR5cGVvZiB0cztcblxuICAgIGNvbnN0IHN1cHBvcnRFUzIwMTUgPSB0c0NvbmZpZy5vcHRpb25zLnRhcmdldCAhPT0gcHJvamVjdFRzLlNjcmlwdFRhcmdldC5FUzNcbiAgICAgICYmIHRzQ29uZmlnLm9wdGlvbnMudGFyZ2V0ICE9PSBwcm9qZWN0VHMuU2NyaXB0VGFyZ2V0LkVTNTtcblxuICAgIGNvbnN0IGNvbXBhdE9wdGlvbnM6IHR5cGVvZiB3Y29bJ2J1aWxkT3B0aW9ucyddID0ge1xuICAgICAgLi4ub3B0aW9ucyBhcyB7fSBhcyB0eXBlb2Ygd2NvWydidWlsZE9wdGlvbnMnXSxcbiAgICAgIC8vIFNvbWUgYXNzZXQgbG9naWMgaW5zaWRlIGdldENvbW1vbkNvbmZpZyBuZWVkcyBvdXRwdXRQYXRoIHRvIGJlIHNldC5cbiAgICAgIG91dHB1dFBhdGg6ICcnLFxuICAgIH07XG5cbiAgICB3Y28gPSB7XG4gICAgICByb290OiBnZXRTeXN0ZW1QYXRoKHJvb3QpLFxuICAgICAgbG9nZ2VyOiB0aGlzLmNvbnRleHQubG9nZ2VyLFxuICAgICAgcHJvamVjdFJvb3Q6IGdldFN5c3RlbVBhdGgocHJvamVjdFJvb3QpLFxuICAgICAgc291cmNlUm9vdDogc291cmNlUm9vdCAmJiBnZXRTeXN0ZW1QYXRoKHNvdXJjZVJvb3QpLFxuICAgICAgLy8gVE9ETzogdXNlIG9ubHkgdGhpcy5vcHRpb25zLCBpdCBjb250YWlucyBhbGwgZmxhZ3MgYW5kIGNvbmZpZ3MgaXRlbXMgYWxyZWFkeS5cbiAgICAgIGJ1aWxkT3B0aW9uczogY29tcGF0T3B0aW9ucyxcbiAgICAgIHRzQ29uZmlnLFxuICAgICAgdHNDb25maWdQYXRoLFxuICAgICAgc3VwcG9ydEVTMjAxNSxcbiAgICB9O1xuXG4gICAgd2NvLmJ1aWxkT3B0aW9ucy5wcm9ncmVzcyA9IGRlZmF1bHRQcm9ncmVzcyh3Y28uYnVpbGRPcHRpb25zLnByb2dyZXNzKTtcblxuICAgIGNvbnN0IHdlYnBhY2tDb25maWdzOiB7fVtdID0gW1xuICAgICAgZ2V0Q29tbW9uQ29uZmlnKHdjbyksXG4gICAgICBnZXRTdHlsZXNDb25maWcod2NvKSxcbiAgICAgIGdldE5vbkFvdFRlc3RDb25maWcod2NvLCBob3N0KSxcbiAgICAgIGdldFRlc3RDb25maWcod2NvKSxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHdlYnBhY2tNZXJnZSh3ZWJwYWNrQ29uZmlncyk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgS2FybWFCdWlsZGVyO1xuIl19