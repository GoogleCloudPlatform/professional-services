"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const child_process_1 = require("child_process");
const path = require("path");
function default_1(factoryOptions = {}) {
    const rootDirectory = factoryOptions.rootDirectory || process.cwd();
    return async (options, context) => {
        const authorName = options.authorName;
        const authorEmail = options.authorEmail;
        const execute = (args, ignoreErrorStream) => {
            const outputStream = 'ignore';
            const errorStream = ignoreErrorStream ? 'ignore' : process.stderr;
            const spawnOptions = {
                stdio: [process.stdin, outputStream, errorStream],
                shell: true,
                cwd: path.join(rootDirectory, options.workingDirectory || ''),
                env: Object.assign({}, process.env, (authorName
                    ? { GIT_AUTHOR_NAME: authorName, GIT_COMMITTER_NAME: authorName }
                    : {}), (authorEmail
                    ? { GIT_AUTHOR_EMAIL: authorEmail, GIT_COMMITTER_EMAIL: authorEmail }
                    : {})),
            };
            return new Promise((resolve, reject) => {
                child_process_1.spawn('git', args, spawnOptions)
                    .on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    }
                    else {
                        reject(code);
                    }
                });
            });
        };
        const hasCommand = await execute(['--version'])
            .then(() => true, () => false);
        if (!hasCommand) {
            return;
        }
        const insideRepo = await execute(['rev-parse', '--is-inside-work-tree'], true)
            .then(() => true, () => false);
        if (insideRepo) {
            context.logger.info(core_1.tags.oneLine `
        Directory is already under version control.
        Skipping initialization of git.
      `);
            return;
        }
        // if git is not found or an error was thrown during the `git`
        // init process just swallow any errors here
        // NOTE: This will be removed once task error handling is implemented
        try {
            await execute(['init']);
            await execute(['add', '.']);
            if (options.commit) {
                const message = options.message || 'initial commit';
                await execute(['commit', `-m "${message}"`]);
            }
            context.logger.info('Successfully initialized git.');
        }
        catch (_a) { }
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MvcmVwby1pbml0L2V4ZWN1dG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQTRDO0FBQzVDLGlEQUFvRDtBQUNwRCw2QkFBNkI7QUFRN0IsbUJBQ0UsaUJBQTBELEVBQUU7SUFFNUQsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLGFBQWEsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFcEUsT0FBTyxLQUFLLEVBQUUsT0FBeUMsRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDcEYsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUN0QyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDO1FBRXhDLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBYyxFQUFFLGlCQUEyQixFQUFFLEVBQUU7WUFDOUQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDO1lBQzlCLE1BQU0sV0FBVyxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDbEUsTUFBTSxZQUFZLEdBQWlCO2dCQUNqQyxLQUFLLEVBQUcsQ0FBRSxPQUFPLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUU7Z0JBQ3BELEtBQUssRUFBRSxJQUFJO2dCQUNYLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsZ0JBQWdCLElBQUksRUFBRSxDQUFDO2dCQUM3RCxHQUFHLG9CQUNFLE9BQU8sQ0FBQyxHQUFHLEVBQ1gsQ0FBQyxVQUFVO29CQUNaLENBQUMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFFO29CQUNqRSxDQUFDLENBQUMsRUFBRSxDQUNMLEVBQ0UsQ0FBQyxXQUFXO29CQUNiLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUU7b0JBQ3JFLENBQUMsQ0FBQyxFQUFFLENBQ0wsQ0FDRjthQUNGLENBQUM7WUFFRixPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUMzQyxxQkFBSyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDO3FCQUM3QixFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7b0JBQzVCLElBQUksSUFBSSxLQUFLLENBQUMsRUFBRTt3QkFDZCxPQUFPLEVBQUUsQ0FBQztxQkFDWDt5QkFBTTt3QkFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQ2Q7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztRQUVGLE1BQU0sVUFBVSxHQUFHLE1BQU0sT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDNUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2YsT0FBTztTQUNSO1FBRUQsTUFBTSxVQUFVLEdBQUcsTUFBTSxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsdUJBQXVCLENBQUMsRUFBRSxJQUFJLENBQUM7YUFDM0UsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxJQUFJLFVBQVUsRUFBRTtZQUNkLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQUksQ0FBQyxPQUFPLENBQUE7OztPQUcvQixDQUFDLENBQUM7WUFFSCxPQUFPO1NBQ1I7UUFFRCw4REFBOEQ7UUFDOUQsNENBQTRDO1FBQzVDLHFFQUFxRTtRQUNyRSxJQUFJO1lBQ0YsTUFBTSxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFNUIsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFO2dCQUNsQixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLGdCQUFnQixDQUFDO2dCQUVwRCxNQUFNLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQzthQUM5QztZQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLCtCQUErQixDQUFDLENBQUM7U0FDdEQ7UUFBQyxXQUFNLEdBQUU7SUFDWixDQUFDLENBQUM7QUFDSixDQUFDO0FBMUVELDRCQTBFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IHRhZ3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBTcGF3bk9wdGlvbnMsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgU2NoZW1hdGljQ29udGV4dCwgVGFza0V4ZWN1dG9yIH0gZnJvbSAnLi4vLi4vc3JjJztcbmltcG9ydCB7XG4gIFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tGYWN0b3J5T3B0aW9ucyxcbiAgUmVwb3NpdG9yeUluaXRpYWxpemVyVGFza09wdGlvbnMsXG59IGZyb20gJy4vb3B0aW9ucyc7XG5cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oXG4gIGZhY3RvcnlPcHRpb25zOiBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrRmFjdG9yeU9wdGlvbnMgPSB7fSxcbik6IFRhc2tFeGVjdXRvcjxSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrT3B0aW9ucz4ge1xuICBjb25zdCByb290RGlyZWN0b3J5ID0gZmFjdG9yeU9wdGlvbnMucm9vdERpcmVjdG9yeSB8fCBwcm9jZXNzLmN3ZCgpO1xuXG4gIHJldHVybiBhc3luYyAob3B0aW9uczogUmVwb3NpdG9yeUluaXRpYWxpemVyVGFza09wdGlvbnMsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBhdXRob3JOYW1lID0gb3B0aW9ucy5hdXRob3JOYW1lO1xuICAgIGNvbnN0IGF1dGhvckVtYWlsID0gb3B0aW9ucy5hdXRob3JFbWFpbDtcblxuICAgIGNvbnN0IGV4ZWN1dGUgPSAoYXJnczogc3RyaW5nW10sIGlnbm9yZUVycm9yU3RyZWFtPzogYm9vbGVhbikgPT4ge1xuICAgICAgY29uc3Qgb3V0cHV0U3RyZWFtID0gJ2lnbm9yZSc7XG4gICAgICBjb25zdCBlcnJvclN0cmVhbSA9IGlnbm9yZUVycm9yU3RyZWFtID8gJ2lnbm9yZScgOiBwcm9jZXNzLnN0ZGVycjtcbiAgICAgIGNvbnN0IHNwYXduT3B0aW9uczogU3Bhd25PcHRpb25zID0ge1xuICAgICAgICBzdGRpbzogIFsgcHJvY2Vzcy5zdGRpbiwgb3V0cHV0U3RyZWFtLCBlcnJvclN0cmVhbSBdLFxuICAgICAgICBzaGVsbDogdHJ1ZSxcbiAgICAgICAgY3dkOiBwYXRoLmpvaW4ocm9vdERpcmVjdG9yeSwgb3B0aW9ucy53b3JraW5nRGlyZWN0b3J5IHx8ICcnKSxcbiAgICAgICAgZW52OiB7XG4gICAgICAgICAgLi4ucHJvY2Vzcy5lbnYsXG4gICAgICAgICAgLi4uKGF1dGhvck5hbWVcbiAgICAgICAgICAgID8geyBHSVRfQVVUSE9SX05BTUU6IGF1dGhvck5hbWUsIEdJVF9DT01NSVRURVJfTkFNRTogYXV0aG9yTmFtZSB9XG4gICAgICAgICAgICA6IHt9XG4gICAgICAgICAgKSxcbiAgICAgICAgICAuLi4oYXV0aG9yRW1haWxcbiAgICAgICAgICAgID8geyBHSVRfQVVUSE9SX0VNQUlMOiBhdXRob3JFbWFpbCwgR0lUX0NPTU1JVFRFUl9FTUFJTDogYXV0aG9yRW1haWwgfVxuICAgICAgICAgICAgOiB7fVxuICAgICAgICAgICksXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBzcGF3bignZ2l0JywgYXJncywgc3Bhd25PcHRpb25zKVxuICAgICAgICAgIC5vbignY2xvc2UnLCAoY29kZTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZWplY3QoY29kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhc0NvbW1hbmQgPSBhd2FpdCBleGVjdXRlKFsnLS12ZXJzaW9uJ10pXG4gICAgICAudGhlbigoKSA9PiB0cnVlLCAoKSA9PiBmYWxzZSk7XG4gICAgaWYgKCFoYXNDb21tYW5kKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaW5zaWRlUmVwbyA9IGF3YWl0IGV4ZWN1dGUoWydyZXYtcGFyc2UnLCAnLS1pcy1pbnNpZGUtd29yay10cmVlJ10sIHRydWUpXG4gICAgICAudGhlbigoKSA9PiB0cnVlLCAoKSA9PiBmYWxzZSk7XG4gICAgaWYgKGluc2lkZVJlcG8pIHtcbiAgICAgIGNvbnRleHQubG9nZ2VyLmluZm8odGFncy5vbmVMaW5lYFxuICAgICAgICBEaXJlY3RvcnkgaXMgYWxyZWFkeSB1bmRlciB2ZXJzaW9uIGNvbnRyb2wuXG4gICAgICAgIFNraXBwaW5nIGluaXRpYWxpemF0aW9uIG9mIGdpdC5cbiAgICAgIGApO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gaWYgZ2l0IGlzIG5vdCBmb3VuZCBvciBhbiBlcnJvciB3YXMgdGhyb3duIGR1cmluZyB0aGUgYGdpdGBcbiAgICAvLyBpbml0IHByb2Nlc3MganVzdCBzd2FsbG93IGFueSBlcnJvcnMgaGVyZVxuICAgIC8vIE5PVEU6IFRoaXMgd2lsbCBiZSByZW1vdmVkIG9uY2UgdGFzayBlcnJvciBoYW5kbGluZyBpcyBpbXBsZW1lbnRlZFxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBleGVjdXRlKFsnaW5pdCddKTtcbiAgICAgIGF3YWl0IGV4ZWN1dGUoWydhZGQnLCAnLiddKTtcblxuICAgICAgaWYgKG9wdGlvbnMuY29tbWl0KSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgJ2luaXRpYWwgY29tbWl0JztcblxuICAgICAgICBhd2FpdCBleGVjdXRlKFsnY29tbWl0JywgYC1tIFwiJHttZXNzYWdlfVwiYF0pO1xuICAgICAgfVxuXG4gICAgICBjb250ZXh0LmxvZ2dlci5pbmZvKCdTdWNjZXNzZnVsbHkgaW5pdGlhbGl6ZWQgZ2l0LicpO1xuICAgIH0gY2F0Y2gge31cbiAgfTtcbn1cbiJdfQ==