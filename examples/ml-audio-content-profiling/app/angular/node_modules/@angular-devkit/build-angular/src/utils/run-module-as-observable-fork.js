"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const treeKill = require('tree-kill');
function runModuleAsObservableFork(cwd, modulePath, exportName, 
// tslint:disable-next-line:no-any
args) {
    return new rxjs_1.Observable(obs => {
        const workerPath = path_1.resolve(__dirname, './run-module-worker.js');
        const debugArgRegex = /--inspect(?:-brk|-port)?|--debug(?:-brk|-port)/;
        const execArgv = process.execArgv.filter((arg) => {
            // Remove debug args.
            // Workaround for https://github.com/nodejs/node/issues/9435
            return !debugArgRegex.test(arg);
        });
        const forkOptions = {
            cwd,
            execArgv,
        };
        // TODO: support passing in a logger to use as stdio streams
        // if (logger) {
        //   (forkOptions as any).stdio = [
        //     'ignore',
        //     logger.info, // make it a stream
        //     logger.error, // make it a stream
        //   ];
        // }
        const forkedProcess = child_process_1.fork(workerPath, undefined, forkOptions);
        // Cleanup.
        const killForkedProcess = () => {
            if (forkedProcess && forkedProcess.pid) {
                treeKill(forkedProcess.pid, 'SIGTERM');
            }
        };
        // Handle child process exit.
        const handleChildProcessExit = (code) => {
            killForkedProcess();
            if (code && code !== 0) {
                obs.error();
            }
            obs.next({ success: true });
            obs.complete();
        };
        forkedProcess.once('exit', handleChildProcessExit);
        forkedProcess.once('SIGINT', handleChildProcessExit);
        forkedProcess.once('uncaughtException', handleChildProcessExit);
        // Handle parent process exit.
        const handleParentProcessExit = () => {
            killForkedProcess();
        };
        process.once('exit', handleParentProcessExit);
        process.once('SIGINT', handleParentProcessExit);
        process.once('uncaughtException', handleParentProcessExit);
        // Run module.
        forkedProcess.send({
            hash: '5d4b9a5c0a4e0f9977598437b0e85bcc',
            modulePath,
            exportName,
            args,
        });
        // Teardown logic. When unsubscribing, kill the forked process.
        return killForkedProcess;
    });
}
exports.runModuleAsObservableFork = runModuleAsObservableFork;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLW1vZHVsZS1hcy1vYnNlcnZhYmxlLWZvcmsuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL3J1bi1tb2R1bGUtYXMtb2JzZXJ2YWJsZS1mb3JrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBUUEsaURBQWtEO0FBQ2xELCtCQUErQjtBQUMvQiwrQkFBa0M7QUFDbEMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBR3RDLFNBQWdCLHlCQUF5QixDQUN2QyxHQUFXLEVBQ1gsVUFBa0IsRUFDbEIsVUFBOEI7QUFDOUIsa0NBQWtDO0FBQ2xDLElBQVc7SUFFWCxPQUFPLElBQUksaUJBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUMxQixNQUFNLFVBQVUsR0FBVyxjQUFPLENBQUMsU0FBUyxFQUFFLHdCQUF3QixDQUFDLENBQUM7UUFFeEUsTUFBTSxhQUFhLEdBQUcsZ0RBQWdELENBQUM7UUFDdkUsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUMvQyxxQkFBcUI7WUFDckIsNERBQTREO1lBQzVELE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxXQUFXLEdBQWdCO1lBQy9CLEdBQUc7WUFDSCxRQUFRO1NBQ1ksQ0FBQztRQUV2Qiw0REFBNEQ7UUFDNUQsZ0JBQWdCO1FBQ2hCLG1DQUFtQztRQUNuQyxnQkFBZ0I7UUFDaEIsdUNBQXVDO1FBQ3ZDLHdDQUF3QztRQUN4QyxPQUFPO1FBQ1AsSUFBSTtRQUVKLE1BQU0sYUFBYSxHQUFHLG9CQUFJLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUUvRCxXQUFXO1FBQ1gsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLEVBQUU7WUFDN0IsSUFBSSxhQUFhLElBQUksYUFBYSxDQUFDLEdBQUcsRUFBRTtnQkFDdEMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDeEM7UUFDSCxDQUFDLENBQUM7UUFFRiw2QkFBNkI7UUFDN0IsTUFBTSxzQkFBc0IsR0FBRyxDQUFDLElBQWEsRUFBRSxFQUFFO1lBQy9DLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsRUFBRTtnQkFDdEIsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2I7WUFDRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDNUIsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQztRQUNGLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFDbkQsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztRQUNyRCxhQUFhLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFFaEUsOEJBQThCO1FBQzlCLE1BQU0sdUJBQXVCLEdBQUcsR0FBRyxFQUFFO1lBQ25DLGlCQUFpQixFQUFFLENBQUM7UUFDdEIsQ0FBQyxDQUFDO1FBQ0YsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztRQUM5QyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1FBQ2hELE9BQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztRQUUzRCxjQUFjO1FBQ2QsYUFBYSxDQUFDLElBQUksQ0FBQztZQUNqQixJQUFJLEVBQUUsa0NBQWtDO1lBQ3hDLFVBQVU7WUFDVixVQUFVO1lBQ1YsSUFBSTtTQUNMLENBQUMsQ0FBQztRQUVILCtEQUErRDtRQUMvRCxPQUFPLGlCQUFpQixDQUFDO0lBQzNCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQXZFRCw4REF1RUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCdWlsZEV2ZW50IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQgeyBGb3JrT3B0aW9ucywgZm9yayB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuY29uc3QgdHJlZUtpbGwgPSByZXF1aXJlKCd0cmVlLWtpbGwnKTtcblxuXG5leHBvcnQgZnVuY3Rpb24gcnVuTW9kdWxlQXNPYnNlcnZhYmxlRm9yayhcbiAgY3dkOiBzdHJpbmcsXG4gIG1vZHVsZVBhdGg6IHN0cmluZyxcbiAgZXhwb3J0TmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gIGFyZ3M6IGFueVtdLFxuKTogT2JzZXJ2YWJsZTxCdWlsZEV2ZW50PiB7XG4gIHJldHVybiBuZXcgT2JzZXJ2YWJsZShvYnMgPT4ge1xuICAgIGNvbnN0IHdvcmtlclBhdGg6IHN0cmluZyA9IHJlc29sdmUoX19kaXJuYW1lLCAnLi9ydW4tbW9kdWxlLXdvcmtlci5qcycpO1xuXG4gICAgY29uc3QgZGVidWdBcmdSZWdleCA9IC8tLWluc3BlY3QoPzotYnJrfC1wb3J0KT98LS1kZWJ1Zyg/Oi1icmt8LXBvcnQpLztcbiAgICBjb25zdCBleGVjQXJndiA9IHByb2Nlc3MuZXhlY0FyZ3YuZmlsdGVyKChhcmcpID0+IHtcbiAgICAgIC8vIFJlbW92ZSBkZWJ1ZyBhcmdzLlxuICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2lzc3Vlcy85NDM1XG4gICAgICByZXR1cm4gIWRlYnVnQXJnUmVnZXgudGVzdChhcmcpO1xuICAgIH0pO1xuICAgIGNvbnN0IGZvcmtPcHRpb25zOiBGb3JrT3B0aW9ucyA9IHtcbiAgICAgIGN3ZCxcbiAgICAgIGV4ZWNBcmd2LFxuICAgIH0gYXMge30gYXMgRm9ya09wdGlvbnM7XG5cbiAgICAvLyBUT0RPOiBzdXBwb3J0IHBhc3NpbmcgaW4gYSBsb2dnZXIgdG8gdXNlIGFzIHN0ZGlvIHN0cmVhbXNcbiAgICAvLyBpZiAobG9nZ2VyKSB7XG4gICAgLy8gICAoZm9ya09wdGlvbnMgYXMgYW55KS5zdGRpbyA9IFtcbiAgICAvLyAgICAgJ2lnbm9yZScsXG4gICAgLy8gICAgIGxvZ2dlci5pbmZvLCAvLyBtYWtlIGl0IGEgc3RyZWFtXG4gICAgLy8gICAgIGxvZ2dlci5lcnJvciwgLy8gbWFrZSBpdCBhIHN0cmVhbVxuICAgIC8vICAgXTtcbiAgICAvLyB9XG5cbiAgICBjb25zdCBmb3JrZWRQcm9jZXNzID0gZm9yayh3b3JrZXJQYXRoLCB1bmRlZmluZWQsIGZvcmtPcHRpb25zKTtcblxuICAgIC8vIENsZWFudXAuXG4gICAgY29uc3Qga2lsbEZvcmtlZFByb2Nlc3MgPSAoKSA9PiB7XG4gICAgICBpZiAoZm9ya2VkUHJvY2VzcyAmJiBmb3JrZWRQcm9jZXNzLnBpZCkge1xuICAgICAgICB0cmVlS2lsbChmb3JrZWRQcm9jZXNzLnBpZCwgJ1NJR1RFUk0nKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gSGFuZGxlIGNoaWxkIHByb2Nlc3MgZXhpdC5cbiAgICBjb25zdCBoYW5kbGVDaGlsZFByb2Nlc3NFeGl0ID0gKGNvZGU/OiBudW1iZXIpID0+IHtcbiAgICAgIGtpbGxGb3JrZWRQcm9jZXNzKCk7XG4gICAgICBpZiAoY29kZSAmJiBjb2RlICE9PSAwKSB7XG4gICAgICAgIG9icy5lcnJvcigpO1xuICAgICAgfVxuICAgICAgb2JzLm5leHQoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgfTtcbiAgICBmb3JrZWRQcm9jZXNzLm9uY2UoJ2V4aXQnLCBoYW5kbGVDaGlsZFByb2Nlc3NFeGl0KTtcbiAgICBmb3JrZWRQcm9jZXNzLm9uY2UoJ1NJR0lOVCcsIGhhbmRsZUNoaWxkUHJvY2Vzc0V4aXQpO1xuICAgIGZvcmtlZFByb2Nlc3Mub25jZSgndW5jYXVnaHRFeGNlcHRpb24nLCBoYW5kbGVDaGlsZFByb2Nlc3NFeGl0KTtcblxuICAgIC8vIEhhbmRsZSBwYXJlbnQgcHJvY2VzcyBleGl0LlxuICAgIGNvbnN0IGhhbmRsZVBhcmVudFByb2Nlc3NFeGl0ID0gKCkgPT4ge1xuICAgICAga2lsbEZvcmtlZFByb2Nlc3MoKTtcbiAgICB9O1xuICAgIHByb2Nlc3Mub25jZSgnZXhpdCcsIGhhbmRsZVBhcmVudFByb2Nlc3NFeGl0KTtcbiAgICBwcm9jZXNzLm9uY2UoJ1NJR0lOVCcsIGhhbmRsZVBhcmVudFByb2Nlc3NFeGl0KTtcbiAgICBwcm9jZXNzLm9uY2UoJ3VuY2F1Z2h0RXhjZXB0aW9uJywgaGFuZGxlUGFyZW50UHJvY2Vzc0V4aXQpO1xuXG4gICAgLy8gUnVuIG1vZHVsZS5cbiAgICBmb3JrZWRQcm9jZXNzLnNlbmQoe1xuICAgICAgaGFzaDogJzVkNGI5YTVjMGE0ZTBmOTk3NzU5ODQzN2IwZTg1YmNjJyxcbiAgICAgIG1vZHVsZVBhdGgsXG4gICAgICBleHBvcnROYW1lLFxuICAgICAgYXJncyxcbiAgICB9KTtcblxuICAgIC8vIFRlYXJkb3duIGxvZ2ljLiBXaGVuIHVuc3Vic2NyaWJpbmcsIGtpbGwgdGhlIGZvcmtlZCBwcm9jZXNzLlxuICAgIHJldHVybiBraWxsRm9ya2VkUHJvY2VzcztcbiAgfSk7XG59XG4iXX0=