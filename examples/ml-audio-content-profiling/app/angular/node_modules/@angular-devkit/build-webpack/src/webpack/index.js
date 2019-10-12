"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const webpack = require("webpack");
exports.defaultLoggingCb = (stats, config, logger) => logger.info(stats.toString(config.stats));
class WebpackBuilder {
    constructor(context) {
        this.context = context;
    }
    run(builderConfig) {
        const configPath = core_1.resolve(this.context.workspace.root, core_1.normalize(builderConfig.options.webpackConfig));
        return this.loadWebpackConfig(core_1.getSystemPath(configPath)).pipe(operators_1.concatMap(config => this.runWebpack(config)));
    }
    loadWebpackConfig(webpackConfigPath) {
        return rxjs_1.from(Promise.resolve().then(() => require(webpackConfigPath)));
    }
    runWebpack(config, loggingCb = exports.defaultLoggingCb) {
        return new rxjs_1.Observable(obs => {
            const webpackCompiler = webpack(config);
            const callback = (err, stats) => {
                if (err) {
                    return obs.error(err);
                }
                // Log stats.
                loggingCb(stats, config, this.context.logger);
                obs.next({ success: !stats.hasErrors() });
                if (!config.watch) {
                    obs.complete();
                }
            };
            try {
                if (config.watch) {
                    const watchOptions = config.watchOptions || {};
                    const watching = webpackCompiler.watch(watchOptions, callback);
                    // Teardown logic. Close the watcher when unsubscribed from.
                    return () => watching.close(() => { });
                }
                else {
                    webpackCompiler.run(callback);
                }
            }
            catch (err) {
                if (err) {
                    this.context.logger.error('\nAn error occured during the build:\n' + ((err && err.stack) || err));
                }
                throw err;
            }
        });
    }
}
exports.WebpackBuilder = WebpackBuilder;
exports.default = WebpackBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX3dlYnBhY2svc3JjL3dlYnBhY2svaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFhQSwrQ0FBd0Y7QUFDeEYsK0JBQXdDO0FBQ3hDLDhDQUEyQztBQUMzQyxtQ0FBbUM7QUFRdEIsUUFBQSxnQkFBZ0IsR0FBb0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQ3pFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUU1QyxNQUFhLGNBQWM7SUFFekIsWUFBbUIsT0FBdUI7UUFBdkIsWUFBTyxHQUFQLE9BQU8sQ0FBZ0I7SUFBSSxDQUFDO0lBRS9DLEdBQUcsQ0FBQyxhQUF5RDtRQUMzRCxNQUFNLFVBQVUsR0FBRyxjQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUNwRCxnQkFBUyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUVsRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUMzRCxxQkFBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUM3QyxDQUFDO0lBQ0osQ0FBQztJQUVNLGlCQUFpQixDQUFDLGlCQUF5QjtRQUNoRCxPQUFPLFdBQUksc0NBQVEsaUJBQWlCLEdBQUUsQ0FBQztJQUN6QyxDQUFDO0lBRU0sVUFBVSxDQUNmLE1BQTZCLEVBQUUsU0FBUyxHQUFHLHdCQUFnQjtRQUUzRCxPQUFPLElBQUksaUJBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMxQixNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFeEMsTUFBTSxRQUFRLEdBQXNDLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNqRSxJQUFJLEdBQUcsRUFBRTtvQkFDUCxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ3ZCO2dCQUVELGFBQWE7Z0JBQ2IsU0FBUyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFOUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRTFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO29CQUNqQixHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7aUJBQ2hCO1lBQ0gsQ0FBQyxDQUFDO1lBRUYsSUFBSTtnQkFDRixJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUU7b0JBQ2hCLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDO29CQUMvQyxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFFL0QsNERBQTREO29CQUM1RCxPQUFPLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQ3hDO3FCQUFNO29CQUNMLGVBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQy9CO2FBQ0Y7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFJLEdBQUcsRUFBRTtvQkFDUCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ3ZCLHdDQUF3QyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQzNFO2dCQUNELE1BQU0sR0FBRyxDQUFDO2FBQ1g7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXpERCx3Q0F5REM7QUFFRCxrQkFBZSxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBCdWlsZEV2ZW50LFxuICBCdWlsZGVyLFxuICBCdWlsZGVyQ29uZmlndXJhdGlvbixcbiAgQnVpbGRlckNvbnRleHQsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9hcmNoaXRlY3QnO1xuaW1wb3J0IHsgUGF0aCwgZ2V0U3lzdGVtUGF0aCwgbG9nZ2luZywgbm9ybWFsaXplLCByZXNvbHZlIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY29uY2F0TWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0ICogYXMgd2VicGFjayBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IFdlYnBhY2tCdWlsZGVyU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9nZ2luZ0NhbGxiYWNrIHtcbiAgKHN0YXRzOiB3ZWJwYWNrLlN0YXRzLCBjb25maWc6IHdlYnBhY2suQ29uZmlndXJhdGlvbiwgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlcik6IHZvaWQ7XG59XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0TG9nZ2luZ0NiOiBMb2dnaW5nQ2FsbGJhY2sgPSAoc3RhdHMsIGNvbmZpZywgbG9nZ2VyKSA9PlxuICBsb2dnZXIuaW5mbyhzdGF0cy50b1N0cmluZyhjb25maWcuc3RhdHMpKTtcblxuZXhwb3J0IGNsYXNzIFdlYnBhY2tCdWlsZGVyIGltcGxlbWVudHMgQnVpbGRlcjxXZWJwYWNrQnVpbGRlclNjaGVtYT4ge1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCkgeyB9XG5cbiAgcnVuKGJ1aWxkZXJDb25maWc6IEJ1aWxkZXJDb25maWd1cmF0aW9uPFdlYnBhY2tCdWlsZGVyU2NoZW1hPik6IE9ic2VydmFibGU8QnVpbGRFdmVudD4ge1xuICAgIGNvbnN0IGNvbmZpZ1BhdGggPSByZXNvbHZlKHRoaXMuY29udGV4dC53b3Jrc3BhY2Uucm9vdCxcbiAgICAgIG5vcm1hbGl6ZShidWlsZGVyQ29uZmlnLm9wdGlvbnMud2VicGFja0NvbmZpZykpO1xuXG4gICAgcmV0dXJuIHRoaXMubG9hZFdlYnBhY2tDb25maWcoZ2V0U3lzdGVtUGF0aChjb25maWdQYXRoKSkucGlwZShcbiAgICAgIGNvbmNhdE1hcChjb25maWcgPT4gdGhpcy5ydW5XZWJwYWNrKGNvbmZpZykpLFxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgbG9hZFdlYnBhY2tDb25maWcod2VicGFja0NvbmZpZ1BhdGg6IHN0cmluZyk6IE9ic2VydmFibGU8d2VicGFjay5Db25maWd1cmF0aW9uPiB7XG4gICAgcmV0dXJuIGZyb20oaW1wb3J0KHdlYnBhY2tDb25maWdQYXRoKSk7XG4gIH1cblxuICBwdWJsaWMgcnVuV2VicGFjayhcbiAgICBjb25maWc6IHdlYnBhY2suQ29uZmlndXJhdGlvbiwgbG9nZ2luZ0NiID0gZGVmYXVsdExvZ2dpbmdDYixcbiAgKTogT2JzZXJ2YWJsZTxCdWlsZEV2ZW50PiB7XG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKG9icyA9PiB7XG4gICAgICBjb25zdCB3ZWJwYWNrQ29tcGlsZXIgPSB3ZWJwYWNrKGNvbmZpZyk7XG5cbiAgICAgIGNvbnN0IGNhbGxiYWNrOiB3ZWJwYWNrLmNvbXBpbGVyLkNvbXBpbGVyQ2FsbGJhY2sgPSAoZXJyLCBzdGF0cykgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIG9icy5lcnJvcihlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTG9nIHN0YXRzLlxuICAgICAgICBsb2dnaW5nQ2Ioc3RhdHMsIGNvbmZpZywgdGhpcy5jb250ZXh0LmxvZ2dlcik7XG5cbiAgICAgICAgb2JzLm5leHQoeyBzdWNjZXNzOiAhc3RhdHMuaGFzRXJyb3JzKCkgfSk7XG5cbiAgICAgICAgaWYgKCFjb25maWcud2F0Y2gpIHtcbiAgICAgICAgICBvYnMuY29tcGxldGUoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKGNvbmZpZy53YXRjaCkge1xuICAgICAgICAgIGNvbnN0IHdhdGNoT3B0aW9ucyA9IGNvbmZpZy53YXRjaE9wdGlvbnMgfHwge307XG4gICAgICAgICAgY29uc3Qgd2F0Y2hpbmcgPSB3ZWJwYWNrQ29tcGlsZXIud2F0Y2god2F0Y2hPcHRpb25zLCBjYWxsYmFjayk7XG5cbiAgICAgICAgICAvLyBUZWFyZG93biBsb2dpYy4gQ2xvc2UgdGhlIHdhdGNoZXIgd2hlbiB1bnN1YnNjcmliZWQgZnJvbS5cbiAgICAgICAgICByZXR1cm4gKCkgPT4gd2F0Y2hpbmcuY2xvc2UoKCkgPT4geyB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB3ZWJwYWNrQ29tcGlsZXIucnVuKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICB0aGlzLmNvbnRleHQubG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgJ1xcbkFuIGVycm9yIG9jY3VyZWQgZHVyaW5nIHRoZSBidWlsZDpcXG4nICsgKChlcnIgJiYgZXJyLnN0YWNrKSB8fCBlcnIpKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgV2VicGFja0J1aWxkZXI7XG4iXX0=