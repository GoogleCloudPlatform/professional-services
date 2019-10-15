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
const operators_1 = require("rxjs/operators");
const command_runner_1 = require("../../models/command-runner");
const config_1 = require("../../utilities/config");
const project_1 = require("../../utilities/project");
async function default_1(options) {
    const logger = new core_1.logging.IndentLogger('cling');
    let loggingSubscription;
    if (!options.testing) {
        loggingSubscription = initializeLogging(logger);
    }
    let projectDetails = project_1.getWorkspaceDetails();
    if (projectDetails === null) {
        const [, localPath] = config_1.getWorkspaceRaw('local');
        if (localPath !== null) {
            logger.fatal(`An invalid configuration file was found ['${localPath}'].`
                + ' Please delete the file before running the command.');
            return 1;
        }
        projectDetails = { root: process.cwd() };
    }
    try {
        const maybeExitCode = await command_runner_1.runCommand(options.cliArgs, logger, projectDetails);
        if (typeof maybeExitCode === 'number') {
            console.assert(Number.isInteger(maybeExitCode));
            return maybeExitCode;
        }
        return 0;
    }
    catch (err) {
        if (err instanceof Error) {
            logger.fatal(err.message);
            if (err.stack) {
                logger.fatal(err.stack);
            }
        }
        else if (typeof err === 'string') {
            logger.fatal(err);
        }
        else if (typeof err === 'number') {
            // Log nothing.
        }
        else {
            logger.fatal('An unexpected error occurred: ' + JSON.stringify(err));
        }
        if (options.testing) {
            debugger;
            throw err;
        }
        if (loggingSubscription) {
            loggingSubscription.unsubscribe();
        }
        return 1;
    }
}
exports.default = default_1;
// Initialize logging.
function initializeLogging(logger) {
    return logger
        .pipe(operators_1.filter(entry => (entry.level != 'debug')))
        .subscribe(entry => {
        let color = (x) => core_1.terminal.dim(core_1.terminal.white(x));
        let output = process.stdout;
        switch (entry.level) {
            case 'info':
                color = core_1.terminal.white;
                break;
            case 'warn':
                color = (x) => core_1.terminal.bold(core_1.terminal.yellow(x));
                output = process.stderr;
                break;
            case 'fatal':
            case 'error':
                color = (x) => core_1.terminal.bold(core_1.terminal.red(x));
                output = process.stderr;
                break;
        }
        // If we do console.log(message) or process.stdout.write(message + '\n'), the process might
        // stop before the whole message is written and the stream is flushed. This happens when
        // streams are asynchronous.
        //
        // NodeJS IO streams are different depending on platform and usage. In POSIX environment,
        // for example, they're asynchronous when writing to a pipe, but synchronous when writing
        // to a TTY. In windows, it's the other way around. You can verify which is which with
        // stream.isTTY and platform, but this is not good enough.
        // In the async case, one should wait for the callback before sending more data or
        // continuing the process. In our case it would be rather hard to do (but not impossible).
        //
        // Instead we take the easy way out and simply chunk the message and call the write
        // function while the buffer drain itself asynchronously. With a smaller chunk size than
        // the buffer, we are mostly certain that it works. In this case, the chunk has been picked
        // as half a page size (4096/2 = 2048), minus some bytes for the color formatting.
        // On POSIX it seems the buffer is 2 pages (8192), but just to be sure (could be different
        // by platform).
        //
        // For more details, see https://nodejs.org/api/process.html#process_a_note_on_process_i_o
        const chunkSize = 2000; // Small chunk.
        let message = entry.message;
        while (message) {
            const chunk = message.slice(0, chunkSize);
            message = message.slice(chunkSize);
            output.write(color(chunk));
        }
        output.write('\n');
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL2xpYi9jbGkvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQ0FBeUQ7QUFDekQsOENBQXdDO0FBQ3hDLGdFQUF5RDtBQUN6RCxtREFBeUQ7QUFDekQscURBQThEO0FBRy9DLEtBQUssb0JBQVUsT0FBaUQ7SUFDN0UsTUFBTSxNQUFNLEdBQUcsSUFBSSxjQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pELElBQUksbUJBQW1CLENBQUM7SUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7UUFDcEIsbUJBQW1CLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDakQ7SUFFRCxJQUFJLGNBQWMsR0FBRyw2QkFBbUIsRUFBRSxDQUFDO0lBQzNDLElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtRQUMzQixNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsR0FBRyx3QkFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQy9DLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtZQUN0QixNQUFNLENBQUMsS0FBSyxDQUFDLDZDQUE2QyxTQUFTLEtBQUs7a0JBQzNELHFEQUFxRCxDQUFDLENBQUM7WUFFcEUsT0FBTyxDQUFDLENBQUM7U0FDVjtRQUVELGNBQWMsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztLQUMxQztJQUVELElBQUk7UUFDRixNQUFNLGFBQWEsR0FBRyxNQUFNLDJCQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDaEYsSUFBSSxPQUFPLGFBQWEsS0FBSyxRQUFRLEVBQUU7WUFDckMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FB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LENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMxQyxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGxvZ2dpbmcsIHRlcm1pbmFsIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgZmlsdGVyIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgcnVuQ29tbWFuZCB9IGZyb20gJy4uLy4uL21vZGVscy9jb21tYW5kLXJ1bm5lcic7XG5pbXBvcnQgeyBnZXRXb3Jrc3BhY2VSYXcgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvY29uZmlnJztcbmltcG9ydCB7IGdldFdvcmtzcGFjZURldGFpbHMgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvcHJvamVjdCc7XG5cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24ob3B0aW9uczogeyB0ZXN0aW5nPzogYm9vbGVhbiwgY2xpQXJnczogc3RyaW5nW10gfSkge1xuICBjb25zdCBsb2dnZXIgPSBuZXcgbG9nZ2luZy5JbmRlbnRMb2dnZXIoJ2NsaW5nJyk7XG4gIGxldCBsb2dnaW5nU3Vic2NyaXB0aW9uO1xuICBpZiAoIW9wdGlvbnMudGVzdGluZykge1xuICAgIGxvZ2dpbmdTdWJzY3JpcHRpb24gPSBpbml0aWFsaXplTG9nZ2luZyhsb2dnZXIpO1xuICB9XG5cbiAgbGV0IHByb2plY3REZXRhaWxzID0gZ2V0V29ya3NwYWNlRGV0YWlscygpO1xuICBpZiAocHJvamVjdERldGFpbHMgPT09IG51bGwpIHtcbiAgICBjb25zdCBbLCBsb2NhbFBhdGhdID0gZ2V0V29ya3NwYWNlUmF3KCdsb2NhbCcpO1xuICAgIGlmIChsb2NhbFBhdGggIT09IG51bGwpIHtcbiAgICAgIGxvZ2dlci5mYXRhbChgQW4gaW52YWxpZCBjb25maWd1cmF0aW9uIGZpbGUgd2FzIGZvdW5kIFsnJHtsb2NhbFBhdGh9J10uYFxuICAgICAgICAgICAgICAgICArICcgUGxlYXNlIGRlbGV0ZSB0aGUgZmlsZSBiZWZvcmUgcnVubmluZyB0aGUgY29tbWFuZC4nKTtcblxuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuXG4gICAgcHJvamVjdERldGFpbHMgPSB7IHJvb3Q6IHByb2Nlc3MuY3dkKCkgfTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgbWF5YmVFeGl0Q29kZSA9IGF3YWl0IHJ1bkNvbW1hbmQob3B0aW9ucy5jbGlBcmdzLCBsb2dnZXIsIHByb2plY3REZXRhaWxzKTtcbiAgICBpZiAodHlwZW9mIG1heWJlRXhpdENvZGUgPT09ICdudW1iZXInKSB7XG4gICAgICBjb25zb2xlLmFzc2VydChOdW1iZXIuaXNJbnRlZ2VyKG1heWJlRXhpdENvZGUpKTtcblxuICAgICAgcmV0dXJuIG1heWJlRXhpdENvZGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIDA7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgbG9nZ2VyLmZhdGFsKGVyci5tZXNzYWdlKTtcbiAgICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgICAgbG9nZ2VyLmZhdGFsKGVyci5zdGFjayk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXJyID09PSAnc3RyaW5nJykge1xuICAgICAgbG9nZ2VyLmZhdGFsKGVycik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXJyID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gTG9nIG5vdGhpbmcuXG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ2dlci5mYXRhbCgnQW4gdW5leHBlY3RlZCBlcnJvciBvY2N1cnJlZDogJyArIEpTT04uc3RyaW5naWZ5KGVycikpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnRlc3RpbmcpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cblxuICAgIGlmIChsb2dnaW5nU3Vic2NyaXB0aW9uKSB7XG4gICAgICBsb2dnaW5nU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIDE7XG4gIH1cbn1cblxuLy8gSW5pdGlhbGl6ZSBsb2dnaW5nLlxuZnVuY3Rpb24gaW5pdGlhbGl6ZUxvZ2dpbmcobG9nZ2VyOiBsb2dnaW5nLkxvZ2dlcikge1xuICByZXR1cm4gbG9nZ2VyXG4gICAgLnBpcGUoZmlsdGVyKGVudHJ5ID0+IChlbnRyeS5sZXZlbCAhPSAnZGVidWcnKSkpXG4gICAgLnN1YnNjcmliZShlbnRyeSA9PiB7XG4gICAgICBsZXQgY29sb3IgPSAoeDogc3RyaW5nKSA9PiB0ZXJtaW5hbC5kaW0odGVybWluYWwud2hpdGUoeCkpO1xuICAgICAgbGV0IG91dHB1dCA9IHByb2Nlc3Muc3Rkb3V0O1xuICAgICAgc3dpdGNoIChlbnRyeS5sZXZlbCkge1xuICAgICAgICBjYXNlICdpbmZvJzpcbiAgICAgICAgICBjb2xvciA9IHRlcm1pbmFsLndoaXRlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd3YXJuJzpcbiAgICAgICAgICBjb2xvciA9ICh4OiBzdHJpbmcpID0+IHRlcm1pbmFsLmJvbGQodGVybWluYWwueWVsbG93KHgpKTtcbiAgICAgICAgICBvdXRwdXQgPSBwcm9jZXNzLnN0ZGVycjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZmF0YWwnOlxuICAgICAgICBjYXNlICdlcnJvcic6XG4gICAgICAgICAgY29sb3IgPSAoeDogc3RyaW5nKSA9PiB0ZXJtaW5hbC5ib2xkKHRlcm1pbmFsLnJlZCh4KSk7XG4gICAgICAgICAgb3V0cHV0ID0gcHJvY2Vzcy5zdGRlcnI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cblxuICAgICAgLy8gSWYgd2UgZG8gY29uc29sZS5sb2cobWVzc2FnZSkgb3IgcHJvY2Vzcy5zdGRvdXQud3JpdGUobWVzc2FnZSArICdcXG4nKSwgdGhlIHByb2Nlc3MgbWlnaHRcbiAgICAgIC8vIHN0b3AgYmVmb3JlIHRoZSB3aG9sZSBtZXNzYWdlIGlzIHdyaXR0ZW4gYW5kIHRoZSBzdHJlYW0gaXMgZmx1c2hlZC4gVGhpcyBoYXBwZW5zIHdoZW5cbiAgICAgIC8vIHN0cmVhbXMgYXJlIGFzeW5jaHJvbm91cy5cbiAgICAgIC8vXG4gICAgICAvLyBOb2RlSlMgSU8gc3RyZWFtcyBhcmUgZGlmZmVyZW50IGRlcGVuZGluZyBvbiBwbGF0Zm9ybSBhbmQgdXNhZ2UuIEluIFBPU0lYIGVudmlyb25tZW50LFxuICAgICAgLy8gZm9yIGV4YW1wbGUsIHRoZXkncmUgYXN5bmNocm9ub3VzIHdoZW4gd3JpdGluZyB0byBhIHBpcGUsIGJ1dCBzeW5jaHJvbm91cyB3aGVuIHdyaXRpbmdcbiAgICAgIC8vIHRvIGEgVFRZLiBJbiB3aW5kb3dzLCBpdCdzIHRoZSBvdGhlciB3YXkgYXJvdW5kLiBZb3UgY2FuIHZlcmlmeSB3aGljaCBpcyB3aGljaCB3aXRoXG4gICAgICAvLyBzdHJlYW0uaXNUVFkgYW5kIHBsYXRmb3JtLCBidXQgdGhpcyBpcyBub3QgZ29vZCBlbm91Z2guXG4gICAgICAvLyBJbiB0aGUgYXN5bmMgY2FzZSwgb25lIHNob3VsZCB3YWl0IGZvciB0aGUgY2FsbGJhY2sgYmVmb3JlIHNlbmRpbmcgbW9yZSBkYXRhIG9yXG4gICAgICAvLyBjb250aW51aW5nIHRoZSBwcm9jZXNzLiBJbiBvdXIgY2FzZSBpdCB3b3VsZCBiZSByYXRoZXIgaGFyZCB0byBkbyAoYnV0IG5vdCBpbXBvc3NpYmxlKS5cbiAgICAgIC8vXG4gICAgICAvLyBJbnN0ZWFkIHdlIHRha2UgdGhlIGVhc3kgd2F5IG91dCBhbmQgc2ltcGx5IGNodW5rIHRoZSBtZXNzYWdlIGFuZCBjYWxsIHRoZSB3cml0ZVxuICAgICAgLy8gZnVuY3Rpb24gd2hpbGUgdGhlIGJ1ZmZlciBkcmFpbiBpdHNlbGYgYXN5bmNocm9ub3VzbHkuIFdpdGggYSBzbWFsbGVyIGNodW5rIHNpemUgdGhhblxuICAgICAgLy8gdGhlIGJ1ZmZlciwgd2UgYXJlIG1vc3RseSBjZXJ0YWluIHRoYXQgaXQgd29ya3MuIEluIHRoaXMgY2FzZSwgdGhlIGNodW5rIGhhcyBiZWVuIHBpY2tlZFxuICAgICAgLy8gYXMgaGFsZiBhIHBhZ2Ugc2l6ZSAoNDA5Ni8yID0gMjA0OCksIG1pbnVzIHNvbWUgYnl0ZXMgZm9yIHRoZSBjb2xvciBmb3JtYXR0aW5nLlxuICAgICAgLy8gT24gUE9TSVggaXQgc2VlbXMgdGhlIGJ1ZmZlciBpcyAyIHBhZ2VzICg4MTkyKSwgYnV0IGp1c3QgdG8gYmUgc3VyZSAoY291bGQgYmUgZGlmZmVyZW50XG4gICAgICAvLyBieSBwbGF0Zm9ybSkuXG4gICAgICAvL1xuICAgICAgLy8gRm9yIG1vcmUgZGV0YWlscywgc2VlIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvcHJvY2Vzcy5odG1sI3Byb2Nlc3NfYV9ub3RlX29uX3Byb2Nlc3NfaV9vXG4gICAgICBjb25zdCBjaHVua1NpemUgPSAyMDAwOyAgLy8gU21hbGwgY2h1bmsuXG4gICAgICBsZXQgbWVzc2FnZSA9IGVudHJ5Lm1lc3NhZ2U7XG4gICAgICB3aGlsZSAobWVzc2FnZSkge1xuICAgICAgICBjb25zdCBjaHVuayA9IG1lc3NhZ2Uuc2xpY2UoMCwgY2h1bmtTaXplKTtcbiAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2Uuc2xpY2UoY2h1bmtTaXplKTtcbiAgICAgICAgb3V0cHV0LndyaXRlKGNvbG9yKGNodW5rKSk7XG4gICAgICB9XG4gICAgICBvdXRwdXQud3JpdGUoJ1xcbicpO1xuICAgIH0pO1xufVxuIl19