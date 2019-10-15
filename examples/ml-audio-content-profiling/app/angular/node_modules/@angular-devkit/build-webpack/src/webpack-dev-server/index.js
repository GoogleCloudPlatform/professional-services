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
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const webpack_1 = require("../webpack");
class WebpackDevServerBuilder {
    constructor(context) {
        this.context = context;
    }
    run(builderConfig) {
        const configPath = core_1.resolve(this.context.workspace.root, core_1.normalize(builderConfig.options.webpackConfig));
        return this.loadWebpackConfig(core_1.getSystemPath(configPath)).pipe(operators_1.concatMap(config => this.runWebpackDevServer(config)));
    }
    loadWebpackConfig(webpackConfigPath) {
        return rxjs_1.from(Promise.resolve().then(() => require(webpackConfigPath)));
    }
    runWebpackDevServer(webpackConfig, devServerCfg, loggingCb = webpack_1.defaultLoggingCb) {
        return new rxjs_1.Observable(obs => {
            const devServerConfig = devServerCfg || webpackConfig.devServer || {};
            devServerConfig.host = devServerConfig.host || 'localhost';
            devServerConfig.port = devServerConfig.port || 8080;
            if (devServerConfig.stats) {
                webpackConfig.stats = devServerConfig.stats;
            }
            // Disable stats reporting by the devserver, we have our own logger.
            devServerConfig.stats = false;
            const webpackCompiler = webpack(webpackConfig);
            const server = new WebpackDevServer(webpackCompiler, devServerConfig);
            webpackCompiler.hooks.done.tap('build-webpack', (stats) => {
                // Log stats.
                loggingCb(stats, webpackConfig, this.context.logger);
                obs.next({ success: !stats.hasErrors() });
            });
            server.listen(devServerConfig.port, devServerConfig.host, (err) => {
                if (err) {
                    obs.error(err);
                }
            });
            // Teardown logic. Close the server when unsubscribed from.
            return () => server.close();
        });
    }
}
exports.WebpackDevServerBuilder = WebpackDevServerBuilder;
exports.default = WebpackDevServerBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX3dlYnBhY2svc3JjL3dlYnBhY2stZGV2LXNlcnZlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQVFILCtDQUErRTtBQUMvRSwrQkFBd0M7QUFDeEMsOENBQTJDO0FBQzNDLG1DQUFtQztBQUNuQyx1REFBdUQ7QUFDdkQsd0NBQStEO0FBSS9ELE1BQWEsdUJBQXVCO0lBRWxDLFlBQW1CLE9BQXVCO1FBQXZCLFlBQU8sR0FBUCxPQUFPLENBQWdCO0lBQUksQ0FBQztJQUUvQyxHQUFHLENBQUMsYUFBa0U7UUFDcEUsTUFBTSxVQUFVLEdBQUcsY0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksRUFDcEQsZ0JBQVMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFFbEQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsb0JBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDM0QscUJBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUN0RCxDQUFDO0lBQ0osQ0FBQztJQUVNLGlCQUFpQixDQUFDLGlCQUF5QjtRQUNoRCxPQUFPLFdBQUksc0NBQVEsaUJBQWlCLEdBQUUsQ0FBQztJQUN6QyxDQUFDO0lBRU0sbUJBQW1CLENBQ3hCLGFBQW9DLEVBQ3BDLFlBQTZDLEVBQzdDLFlBQTZCLDBCQUFnQjtRQUU3QyxPQUFPLElBQUksaUJBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMxQixNQUFNLGVBQWUsR0FBRyxZQUFZLElBQUksYUFBYSxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUM7WUFDdEUsZUFBZSxDQUFDLElBQUksR0FBRyxlQUFlLENBQUMsSUFBSSxJQUFJLFdBQVcsQ0FBQztZQUMzRCxlQUFlLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO1lBRXBELElBQUksZUFBZSxDQUFDLEtBQUssRUFBRTtnQkFDekIsYUFBYSxDQUFDLEtBQUssR0FBRyxlQUFlLENBQUMsS0FBNEMsQ0FBQzthQUNwRjtZQUNELG9FQUFvRTtZQUNwRSxlQUFlLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUU5QixNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDL0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFdEUsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUN4RCxhQUFhO2dCQUNiLFNBQVMsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXJELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLE1BQU0sQ0FDWCxlQUFlLENBQUMsSUFBSSxFQUNwQixlQUFlLENBQUMsSUFBSSxFQUNwQixDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNOLElBQUksR0FBRyxFQUFFO29CQUNQLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ2hCO1lBQ0gsQ0FBQyxDQUNGLENBQUM7WUFFRiwyREFBMkQ7WUFDM0QsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDOUIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF6REQsMERBeURDO0FBR0Qsa0JBQWUsdUJBQXVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEJ1aWxkRXZlbnQsXG4gIEJ1aWxkZXIsXG4gIEJ1aWxkZXJDb25maWd1cmF0aW9uLFxuICBCdWlsZGVyQ29udGV4dCxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQgeyBQYXRoLCBnZXRTeXN0ZW1QYXRoLCBub3JtYWxpemUsIHJlc29sdmUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBmcm9tIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgKiBhcyB3ZWJwYWNrIGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0ICogYXMgV2VicGFja0RldlNlcnZlciBmcm9tICd3ZWJwYWNrLWRldi1zZXJ2ZXInO1xuaW1wb3J0IHsgTG9nZ2luZ0NhbGxiYWNrLCBkZWZhdWx0TG9nZ2luZ0NiIH0gZnJvbSAnLi4vd2VicGFjayc7XG5pbXBvcnQgeyBXZWJwYWNrRGV2U2VydmVyQnVpbGRlclNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcblxuXG5leHBvcnQgY2xhc3MgV2VicGFja0RldlNlcnZlckJ1aWxkZXIgaW1wbGVtZW50cyBCdWlsZGVyPFdlYnBhY2tEZXZTZXJ2ZXJCdWlsZGVyU2NoZW1hPiB7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0KSB7IH1cblxuICBydW4oYnVpbGRlckNvbmZpZzogQnVpbGRlckNvbmZpZ3VyYXRpb248V2VicGFja0RldlNlcnZlckJ1aWxkZXJTY2hlbWE+KTogT2JzZXJ2YWJsZTxCdWlsZEV2ZW50PiB7XG4gICAgY29uc3QgY29uZmlnUGF0aCA9IHJlc29sdmUodGhpcy5jb250ZXh0LndvcmtzcGFjZS5yb290LFxuICAgICAgbm9ybWFsaXplKGJ1aWxkZXJDb25maWcub3B0aW9ucy53ZWJwYWNrQ29uZmlnKSk7XG5cbiAgICByZXR1cm4gdGhpcy5sb2FkV2VicGFja0NvbmZpZyhnZXRTeXN0ZW1QYXRoKGNvbmZpZ1BhdGgpKS5waXBlKFxuICAgICAgY29uY2F0TWFwKGNvbmZpZyA9PiB0aGlzLnJ1bldlYnBhY2tEZXZTZXJ2ZXIoY29uZmlnKSksXG4gICAgKTtcbiAgfVxuXG4gIHB1YmxpYyBsb2FkV2VicGFja0NvbmZpZyh3ZWJwYWNrQ29uZmlnUGF0aDogc3RyaW5nKTogT2JzZXJ2YWJsZTx3ZWJwYWNrLkNvbmZpZ3VyYXRpb24+IHtcbiAgICByZXR1cm4gZnJvbShpbXBvcnQod2VicGFja0NvbmZpZ1BhdGgpKTtcbiAgfVxuXG4gIHB1YmxpYyBydW5XZWJwYWNrRGV2U2VydmVyKFxuICAgIHdlYnBhY2tDb25maWc6IHdlYnBhY2suQ29uZmlndXJhdGlvbixcbiAgICBkZXZTZXJ2ZXJDZmc/OiBXZWJwYWNrRGV2U2VydmVyLkNvbmZpZ3VyYXRpb24sXG4gICAgbG9nZ2luZ0NiOiBMb2dnaW5nQ2FsbGJhY2sgPSBkZWZhdWx0TG9nZ2luZ0NiLFxuICApOiBPYnNlcnZhYmxlPEJ1aWxkRXZlbnQ+IHtcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUob2JzID0+IHtcbiAgICAgIGNvbnN0IGRldlNlcnZlckNvbmZpZyA9IGRldlNlcnZlckNmZyB8fCB3ZWJwYWNrQ29uZmlnLmRldlNlcnZlciB8fCB7fTtcbiAgICAgIGRldlNlcnZlckNvbmZpZy5ob3N0ID0gZGV2U2VydmVyQ29uZmlnLmhvc3QgfHwgJ2xvY2FsaG9zdCc7XG4gICAgICBkZXZTZXJ2ZXJDb25maWcucG9ydCA9IGRldlNlcnZlckNvbmZpZy5wb3J0IHx8IDgwODA7XG5cbiAgICAgIGlmIChkZXZTZXJ2ZXJDb25maWcuc3RhdHMpIHtcbiAgICAgICAgd2VicGFja0NvbmZpZy5zdGF0cyA9IGRldlNlcnZlckNvbmZpZy5zdGF0cyBhcyB3ZWJwYWNrLlN0YXRzLlRvU3RyaW5nT3B0aW9uc09iamVjdDtcbiAgICAgIH1cbiAgICAgIC8vIERpc2FibGUgc3RhdHMgcmVwb3J0aW5nIGJ5IHRoZSBkZXZzZXJ2ZXIsIHdlIGhhdmUgb3VyIG93biBsb2dnZXIuXG4gICAgICBkZXZTZXJ2ZXJDb25maWcuc3RhdHMgPSBmYWxzZTtcblxuICAgICAgY29uc3Qgd2VicGFja0NvbXBpbGVyID0gd2VicGFjayh3ZWJwYWNrQ29uZmlnKTtcbiAgICAgIGNvbnN0IHNlcnZlciA9IG5ldyBXZWJwYWNrRGV2U2VydmVyKHdlYnBhY2tDb21waWxlciwgZGV2U2VydmVyQ29uZmlnKTtcblxuICAgICAgd2VicGFja0NvbXBpbGVyLmhvb2tzLmRvbmUudGFwKCdidWlsZC13ZWJwYWNrJywgKHN0YXRzKSA9PiB7XG4gICAgICAgIC8vIExvZyBzdGF0cy5cbiAgICAgICAgbG9nZ2luZ0NiKHN0YXRzLCB3ZWJwYWNrQ29uZmlnLCB0aGlzLmNvbnRleHQubG9nZ2VyKTtcblxuICAgICAgICBvYnMubmV4dCh7IHN1Y2Nlc3M6ICFzdGF0cy5oYXNFcnJvcnMoKSB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBzZXJ2ZXIubGlzdGVuKFxuICAgICAgICBkZXZTZXJ2ZXJDb25maWcucG9ydCxcbiAgICAgICAgZGV2U2VydmVyQ29uZmlnLmhvc3QsXG4gICAgICAgIChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBvYnMuZXJyb3IoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICApO1xuXG4gICAgICAvLyBUZWFyZG93biBsb2dpYy4gQ2xvc2UgdGhlIHNlcnZlciB3aGVuIHVuc3Vic2NyaWJlZCBmcm9tLlxuICAgICAgcmV0dXJuICgpID0+IHNlcnZlci5jbG9zZSgpO1xuICAgIH0pO1xuICB9XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgV2VicGFja0RldlNlcnZlckJ1aWxkZXI7XG4iXX0=