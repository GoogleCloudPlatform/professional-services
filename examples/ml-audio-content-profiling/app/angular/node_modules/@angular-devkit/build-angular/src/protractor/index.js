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
const url = require("url");
const require_project_module_1 = require("../angular-cli-files/utilities/require-project-module");
const utils_1 = require("../utils");
class ProtractorBuilder {
    constructor(context) {
        this.context = context;
    }
    run(builderConfig) {
        const options = builderConfig.options;
        const root = this.context.workspace.root;
        const projectRoot = core_1.resolve(root, builderConfig.root);
        // const projectSystemRoot = getSystemPath(projectRoot);
        // TODO: verify using of(null) to kickstart things is a pattern.
        return rxjs_1.of(null).pipe(operators_1.concatMap(() => options.devServerTarget ? this._startDevServer(options) : rxjs_1.of(null)), operators_1.concatMap(() => options.webdriverUpdate ? this._updateWebdriver(projectRoot) : rxjs_1.of(null)), operators_1.concatMap(() => this._runProtractor(root, options)), operators_1.take(1));
    }
    // Note: this method mutates the options argument.
    _startDevServer(options) {
        const architect = this.context.architect;
        const [project, targetName, configuration] = options.devServerTarget.split(':');
        // Override dev server watch setting.
        const overrides = { watch: false };
        // Also override the port and host if they are defined in protractor options.
        if (options.host !== undefined) {
            overrides.host = options.host;
        }
        if (options.port !== undefined) {
            overrides.port = options.port;
        }
        const targetSpec = { project, target: targetName, configuration, overrides };
        const builderConfig = architect.getBuilderConfiguration(targetSpec);
        let devServerDescription;
        let baseUrl;
        return architect.getBuilderDescription(builderConfig).pipe(operators_1.tap(description => devServerDescription = description), operators_1.concatMap(devServerDescription => architect.validateBuilderOptions(builderConfig, devServerDescription)), operators_1.concatMap(() => {
            // Compute baseUrl from devServerOptions.
            if (options.devServerTarget && builderConfig.options.publicHost) {
                let publicHost = builderConfig.options.publicHost;
                if (!/^\w+:\/\//.test(publicHost)) {
                    publicHost = `${builderConfig.options.ssl
                        ? 'https'
                        : 'http'}://${publicHost}`;
                }
                const clientUrl = url.parse(publicHost);
                baseUrl = url.format(clientUrl);
            }
            else if (options.devServerTarget) {
                baseUrl = url.format({
                    protocol: builderConfig.options.ssl ? 'https' : 'http',
                    hostname: options.host,
                    port: builderConfig.options.port.toString(),
                });
            }
            // Save the computed baseUrl back so that Protractor can use it.
            options.baseUrl = baseUrl;
            return rxjs_1.of(this.context.architect.getBuilder(devServerDescription, this.context));
        }), operators_1.concatMap(builder => builder.run(builderConfig)));
    }
    _updateWebdriver(projectRoot) {
        // The webdriver-manager update command can only be accessed via a deep import.
        const webdriverDeepImport = 'webdriver-manager/built/lib/cmds/update';
        let webdriverUpdate; // tslint:disable-line:no-any
        try {
            // When using npm, webdriver is within protractor/node_modules.
            webdriverUpdate = require_project_module_1.requireProjectModule(core_1.getSystemPath(projectRoot), `protractor/node_modules/${webdriverDeepImport}`);
        }
        catch (_a) {
            try {
                // When using yarn, webdriver is found as a root module.
                webdriverUpdate = require_project_module_1.requireProjectModule(core_1.getSystemPath(projectRoot), webdriverDeepImport);
            }
            catch (_b) {
                throw new Error(core_1.tags.stripIndents `
          Cannot automatically find webdriver-manager to update.
          Update webdriver-manager manually and run 'ng e2e --no-webdriver-update' instead.
        `);
            }
        }
        // run `webdriver-manager update --standalone false --gecko false --quiet`
        // if you change this, update the command comment in prev line, and in `eject` task
        return rxjs_1.from(webdriverUpdate.program.run({
            standalone: false,
            gecko: false,
            quiet: true,
        }));
    }
    _runProtractor(root, options) {
        const additionalProtractorConfig = {
            elementExplorer: options.elementExplorer,
            baseUrl: options.baseUrl,
            specs: options.specs.length ? options.specs : undefined,
            suite: options.suite,
        };
        // TODO: Protractor manages process.exit itself, so this target will allways quit the
        // process. To work around this we run it in a subprocess.
        // https://github.com/angular/protractor/issues/4160
        return utils_1.runModuleAsObservableFork(root, 'protractor/built/launcher', 'init', [
            core_1.getSystemPath(core_1.resolve(root, core_1.normalize(options.protractorConfig))),
            additionalProtractorConfig,
        ]);
    }
}
exports.ProtractorBuilder = ProtractorBuilder;
exports.default = ProtractorBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Byb3RyYWN0b3IvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFTSCwrQ0FBcUY7QUFDckYsK0JBQTRDO0FBQzVDLDhDQUFzRDtBQUN0RCwyQkFBMkI7QUFDM0Isa0dBQTZGO0FBRTdGLG9DQUFxRDtBQWVyRCxNQUFhLGlCQUFpQjtJQUU1QixZQUFtQixPQUF1QjtRQUF2QixZQUFPLEdBQVAsT0FBTyxDQUFnQjtJQUFJLENBQUM7SUFFL0MsR0FBRyxDQUFDLGFBQTZEO1FBRS9ELE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1FBQ3pDLE1BQU0sV0FBVyxHQUFHLGNBQU8sQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RELHdEQUF3RDtRQUV4RCxnRUFBZ0U7UUFDaEUsT0FBTyxTQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUNsQixxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUNuRixxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQ3hGLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUs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QUMxRCxvREFBb0Q7UUFDcEQsT0FBTyxpQ0FBeUIsQ0FDOUIsSUFBSSxFQUNKLDJCQUEyQixFQUMzQixNQUFNLEVBQ047WUFDRSxvQkFBYSxDQUFDLGNBQU8sQ0FBQyxJQUFJLEVBQUUsZ0JBQVMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLDBCQUEwQjtTQUMzQixDQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFySEQsOENBcUhDO0FBRUQsa0JBQWUsaUJBQWlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEJ1aWxkRXZlbnQsXG4gIEJ1aWxkZXIsXG4gIEJ1aWxkZXJDb25maWd1cmF0aW9uLFxuICBCdWlsZGVyQ29udGV4dCxcbiAgQnVpbGRlckRlc2NyaXB0aW9uLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvYXJjaGl0ZWN0JztcbmltcG9ydCB7IFBhdGgsIGdldFN5c3RlbVBhdGgsIG5vcm1hbGl6ZSwgcmVzb2x2ZSwgdGFncyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIGZyb20sIG9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAsIHRha2UsIHRhcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCAqIGFzIHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IHsgcmVxdWlyZVByb2plY3RNb2R1bGUgfSBmcm9tICcuLi9hbmd1bGFyLWNsaS1maWxlcy91dGlsaXRpZXMvcmVxdWlyZS1wcm9qZWN0LW1vZHVsZSc7XG5pbXBvcnQgeyBEZXZTZXJ2ZXJCdWlsZGVyT3B0aW9ucyB9IGZyb20gJy4uL2Rldi1zZXJ2ZXInO1xuaW1wb3J0IHsgcnVuTW9kdWxlQXNPYnNlcnZhYmxlRm9yayB9IGZyb20gJy4uL3V0aWxzJztcblxuXG5leHBvcnQgaW50ZXJmYWNlIFByb3RyYWN0b3JCdWlsZGVyT3B0aW9ucyB7XG4gIHByb3RyYWN0b3JDb25maWc6IHN0cmluZztcbiAgZGV2U2VydmVyVGFyZ2V0Pzogc3RyaW5nO1xuICBzcGVjczogc3RyaW5nW107XG4gIHN1aXRlPzogc3RyaW5nO1xuICBlbGVtZW50RXhwbG9yZXI6IGJvb2xlYW47XG4gIHdlYmRyaXZlclVwZGF0ZTogYm9vbGVhbjtcbiAgcG9ydD86IG51bWJlcjtcbiAgaG9zdDogc3RyaW5nO1xuICBiYXNlVXJsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBQcm90cmFjdG9yQnVpbGRlciBpbXBsZW1lbnRzIEJ1aWxkZXI8UHJvdHJhY3RvckJ1aWxkZXJPcHRpb25zPiB7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0KSB7IH1cblxuICBydW4oYnVpbGRlckNvbmZpZzogQnVpbGRlckNvbmZpZ3VyYXRpb248UHJvdHJhY3RvckJ1aWxkZXJPcHRpb25zPik6IE9ic2VydmFibGU8QnVpbGRFdmVudD4ge1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IGJ1aWxkZXJDb25maWcub3B0aW9ucztcbiAgICBjb25zdCByb290ID0gdGhpcy5jb250ZXh0LndvcmtzcGFjZS5yb290O1xuICAgIGNvbnN0IHByb2plY3RSb290ID0gcmVzb2x2ZShyb290LCBidWlsZGVyQ29uZmlnLnJvb3QpO1xuICAgIC8vIGNvbnN0IHByb2plY3RTeXN0ZW1Sb290ID0gZ2V0U3lzdGVtUGF0aChwcm9qZWN0Um9vdCk7XG5cbiAgICAvLyBUT0RPOiB2ZXJpZnkgdXNpbmcgb2YobnVsbCkgdG8ga2lja3N0YXJ0IHRoaW5ncyBpcyBhIHBhdHRlcm4uXG4gICAgcmV0dXJuIG9mKG51bGwpLnBpcGUoXG4gICAgICBjb25jYXRNYXAoKCkgPT4gb3B0aW9ucy5kZXZTZXJ2ZXJUYXJnZXQgPyB0aGlzLl9zdGFydERldlNlcnZlcihvcHRpb25zKSA6IG9mKG51bGwpKSxcbiAgICAgIGNvbmNhdE1hcCgoKSA9PiBvcHRpb25zLndlYmRyaXZlclVwZGF0ZSA/IHRoaXMuX3VwZGF0ZVdlYmRyaXZlcihwcm9qZWN0Um9vdCkgOiBvZihudWxsKSksXG4gICAgICBjb25jYXRNYXAoKCkgPT4gdGhpcy5fcnVuUHJvdHJhY3Rvcihyb290LCBvcHRpb25zKSksXG4gICAgICB0YWtlKDEpLFxuICAgICk7XG4gIH1cblxuICAvLyBOb3RlOiB0aGlzIG1ldGhvZCBtdXRhdGVzIHRoZSBvcHRpb25zIGFyZ3VtZW50LlxuICBwcml2YXRlIF9zdGFydERldlNlcnZlcihvcHRpb25zOiBQcm90cmFjdG9yQnVpbGRlck9wdGlvbnMpIHtcbiAgICBjb25zdCBhcmNoaXRlY3QgPSB0aGlzLmNvbnRleHQuYXJjaGl0ZWN0O1xuICAgIGNvbnN0IFtwcm9qZWN0LCB0YXJnZXROYW1lLCBjb25maWd1cmF0aW9uXSA9IChvcHRpb25zLmRldlNlcnZlclRhcmdldCBhcyBzdHJpbmcpLnNwbGl0KCc6Jyk7XG4gICAgLy8gT3ZlcnJpZGUgZGV2IHNlcnZlciB3YXRjaCBzZXR0aW5nLlxuICAgIGNvbnN0IG92ZXJyaWRlczogUGFydGlhbDxEZXZTZXJ2ZXJCdWlsZGVyT3B0aW9ucz4gPSB7IHdhdGNoOiBmYWxzZSB9O1xuICAgIC8vIEFsc28gb3ZlcnJpZGUgdGhlIHBvcnQgYW5kIGhvc3QgaWYgdGhleSBhcmUgZGVmaW5lZCBpbiBwcm90cmFjdG9yIG9wdGlvbnMuXG4gICAgaWYgKG9wdGlvbnMuaG9zdCAhPT0gdW5kZWZpbmVkKSB7IG92ZXJyaWRlcy5ob3N0ID0gb3B0aW9ucy5ob3N0OyB9XG4gICAgaWYgKG9wdGlvbnMucG9ydCAhPT0gdW5kZWZpbmVkKSB7IG92ZXJyaWRlcy5wb3J0ID0gb3B0aW9ucy5wb3J0OyB9XG4gICAgY29uc3QgdGFyZ2V0U3BlYyA9IHsgcHJvamVjdCwgdGFyZ2V0OiB0YXJnZXROYW1lLCBjb25maWd1cmF0aW9uLCBvdmVycmlkZXMgfTtcbiAgICBjb25zdCBidWlsZGVyQ29uZmlnID0gYXJjaGl0ZWN0LmdldEJ1aWxkZXJDb25maWd1cmF0aW9uPERldlNlcnZlckJ1aWxkZXJPcHRpb25zPih0YXJnZXRTcGVjKTtcbiAgICBsZXQgZGV2U2VydmVyRGVzY3JpcHRpb246IEJ1aWxkZXJEZXNjcmlwdGlvbjtcbiAgICBsZXQgYmFzZVVybDogc3RyaW5nO1xuXG4gICAgcmV0dXJuIGFyY2hpdGVjdC5nZXRCdWlsZGVyRGVzY3JpcHRpb24oYnVpbGRlckNvbmZpZykucGlwZShcbiAgICAgIHRhcChkZXNjcmlwdGlvbiA9PiBkZXZTZXJ2ZXJEZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uKSxcbiAgICAgIGNvbmNhdE1hcChkZXZTZXJ2ZXJEZXNjcmlwdGlvbiA9PiBhcmNoaXRlY3QudmFsaWRhdGVCdWlsZGVyT3B0aW9ucyhcbiAgICAgICAgYnVpbGRlckNvbmZpZywgZGV2U2VydmVyRGVzY3JpcHRpb24pKSxcbiAgICAgIGNvbmNhdE1hcCgoKSA9PiB7XG4gICAgICAgIC8vIENvbXB1dGUgYmFzZVVybCBmcm9tIGRldlNlcnZlck9wdGlvbnMuXG4gICAgICAgIGlmIChvcHRpb25zLmRldlNlcnZlclRhcmdldCAmJiBidWlsZGVyQ29uZmlnLm9wdGlvbnMucHVibGljSG9zdCkge1xuICAgICAgICAgIGxldCBwdWJsaWNIb3N0ID0gYnVpbGRlckNvbmZpZy5vcHRpb25zLnB1YmxpY0hvc3Q7XG4gICAgICAgICAgaWYgKCEvXlxcdys6XFwvXFwvLy50ZXN0KHB1YmxpY0hvc3QpKSB7XG4gICAgICAgICAgICBwdWJsaWNIb3N0ID0gYCR7YnVpbGRlckNvbmZpZy5vcHRpb25zLnNzbFxuICAgICAgICAgICAgICA/ICdodHRwcydcbiAgICAgICAgICAgICAgOiAnaHR0cCd9Oi8vJHtwdWJsaWNIb3N0fWA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGNsaWVudFVybCA9IHVybC5wYXJzZShwdWJsaWNIb3N0KTtcbiAgICAgICAgICBiYXNlVXJsID0gdXJsLmZvcm1hdChjbGllbnRVcmwpO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZGV2U2VydmVyVGFyZ2V0KSB7XG4gICAgICAgICAgYmFzZVVybCA9IHVybC5mb3JtYXQoe1xuICAgICAgICAgICAgcHJvdG9jb2w6IGJ1aWxkZXJDb25maWcub3B0aW9ucy5zc2wgPyAnaHR0cHMnIDogJ2h0dHAnLFxuICAgICAgICAgICAgaG9zdG5hbWU6IG9wdGlvbnMuaG9zdCxcbiAgICAgICAgICAgIHBvcnQ6IGJ1aWxkZXJDb25maWcub3B0aW9ucy5wb3J0LnRvU3RyaW5nKCksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTYXZlIHRoZSBjb21wdXRlZCBiYXNlVXJsIGJhY2sgc28gdGhhdCBQcm90cmFjdG9yIGNhbiB1c2UgaXQuXG4gICAgICAgIG9wdGlvbnMuYmFzZVVybCA9IGJhc2VVcmw7XG5cbiAgICAgICAgcmV0dXJuIG9mKHRoaXMuY29udGV4dC5hcmNoaXRlY3QuZ2V0QnVpbGRlcihkZXZTZXJ2ZXJEZXNjcmlwdGlvbiwgdGhpcy5jb250ZXh0KSk7XG4gICAgICB9KSxcbiAgICAgIGNvbmNhdE1hcChidWlsZGVyID0+IGJ1aWxkZXIucnVuKGJ1aWxkZXJDb25maWcpKSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlV2ViZHJpdmVyKHByb2plY3RSb290OiBQYXRoKSB7XG4gICAgLy8gVGhlIHdlYmRyaXZlci1tYW5hZ2VyIHVwZGF0ZSBjb21tYW5kIGNhbiBvbmx5IGJlIGFjY2Vzc2VkIHZpYSBhIGRlZXAgaW1wb3J0LlxuICAgIGNvbnN0IHdlYmRyaXZlckRlZXBJbXBvcnQgPSAnd2ViZHJpdmVyLW1hbmFnZXIvYnVpbHQvbGliL2NtZHMvdXBkYXRlJztcbiAgICBsZXQgd2ViZHJpdmVyVXBkYXRlOiBhbnk7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tYW55XG5cbiAgICB0cnkge1xuICAgICAgLy8gV2hlbiB1c2luZyBucG0sIHdlYmRyaXZlciBpcyB3aXRoaW4gcHJvdHJhY3Rvci9ub2RlX21vZHVsZXMuXG4gICAgICB3ZWJkcml2ZXJVcGRhdGUgPSByZXF1aXJlUHJvamVjdE1vZHVsZShnZXRTeXN0ZW1QYXRoKHByb2plY3RSb290KSxcbiAgICAgICAgYHByb3RyYWN0b3Ivbm9kZV9tb2R1bGVzLyR7d2ViZHJpdmVyRGVlcEltcG9ydH1gKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFdoZW4gdXNpbmcgeWFybiwgd2ViZHJpdmVyIGlzIGZvdW5kIGFzIGEgcm9vdCBtb2R1bGUuXG4gICAgICAgIHdlYmRyaXZlclVwZGF0ZSA9IHJlcXVpcmVQcm9qZWN0TW9kdWxlKGdldFN5c3RlbVBhdGgocHJvamVjdFJvb3QpLCB3ZWJkcml2ZXJEZWVwSW1wb3J0KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGFncy5zdHJpcEluZGVudHNgXG4gICAgICAgICAgQ2Fubm90IGF1dG9tYXRpY2FsbHkgZmluZCB3ZWJkcml2ZXItbWFuYWdlciB0byB1cGRhdGUuXG4gICAgICAgICAgVXBkYXRlIHdlYmRyaXZlci1tYW5hZ2VyIG1hbnVhbGx5IGFuZCBydW4gJ25nIGUyZSAtLW5vLXdlYmRyaXZlci11cGRhdGUnIGluc3RlYWQuXG4gICAgICAgIGApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJ1biBgd2ViZHJpdmVyLW1hbmFnZXIgdXBkYXRlIC0tc3RhbmRhbG9uZSBmYWxzZSAtLWdlY2tvIGZhbHNlIC0tcXVpZXRgXG4gICAgLy8gaWYgeW91IGNoYW5nZSB0aGlzLCB1cGRhdGUgdGhlIGNvbW1hbmQgY29tbWVudCBpbiBwcmV2IGxpbmUsIGFuZCBpbiBgZWplY3RgIHRhc2tcbiAgICByZXR1cm4gZnJvbSh3ZWJkcml2ZXJVcGRhdGUucHJvZ3JhbS5ydW4oe1xuICAgICAgc3RhbmRhbG9uZTogZmFsc2UsXG4gICAgICBnZWNrbzogZmFsc2UsXG4gICAgICBxdWlldDogdHJ1ZSxcbiAgICB9KSk7XG4gIH1cblxuICBwcml2YXRlIF9ydW5Qcm90cmFjdG9yKHJvb3Q6IFBhdGgsIG9wdGlvbnM6IFByb3RyYWN0b3JCdWlsZGVyT3B0aW9ucyk6IE9ic2VydmFibGU8QnVpbGRFdmVudD4ge1xuICAgIGNvbnN0IGFkZGl0aW9uYWxQcm90cmFjdG9yQ29uZmlnOiBQYXJ0aWFsPFByb3RyYWN0b3JCdWlsZGVyT3B0aW9ucz4gPSB7XG4gICAgICBlbGVtZW50RXhwbG9yZXI6IG9wdGlvbnMuZWxlbWVudEV4cGxvcmVyLFxuICAgICAgYmFzZVVybDogb3B0aW9ucy5iYXNlVXJsLFxuICAgICAgc3BlY3M6IG9wdGlvbnMuc3BlY3MubGVuZ3RoID8gb3B0aW9ucy5zcGVjcyA6IHVuZGVmaW5lZCxcbiAgICAgIHN1aXRlOiBvcHRpb25zLnN1aXRlLFxuICAgIH07XG5cbiAgICAvLyBUT0RPOiBQcm90cmFjdG9yIG1hbmFnZXMgcHJvY2Vzcy5leGl0IGl0c2VsZiwgc28gdGhpcyB0YXJnZXQgd2lsbCBhbGx3YXlzIHF1aXQgdGhlXG4gICAgLy8gcHJvY2Vzcy4gVG8gd29yayBhcm91bmQgdGhpcyB3ZSBydW4gaXQgaW4gYSBzdWJwcm9jZXNzLlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3Byb3RyYWN0b3IvaXNzdWVzLzQxNjBcbiAgICByZXR1cm4gcnVuTW9kdWxlQXNPYnNlcnZhYmxlRm9yayhcbiAgICAgIHJvb3QsXG4gICAgICAncHJvdHJhY3Rvci9idWlsdC9sYXVuY2hlcicsXG4gICAgICAnaW5pdCcsXG4gICAgICBbXG4gICAgICAgIGdldFN5c3RlbVBhdGgocmVzb2x2ZShyb290LCBub3JtYWxpemUob3B0aW9ucy5wcm90cmFjdG9yQ29uZmlnKSkpLFxuICAgICAgICBhZGRpdGlvbmFsUHJvdHJhY3RvckNvbmZpZyxcbiAgICAgIF0sXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQcm90cmFjdG9yQnVpbGRlcjtcbiJdfQ==