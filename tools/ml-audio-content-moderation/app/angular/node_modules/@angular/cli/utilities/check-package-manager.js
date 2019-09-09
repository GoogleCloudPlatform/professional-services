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
const child_process_1 = require("child_process");
const util_1 = require("util");
const config_1 = require("./config");
const execPromise = util_1.promisify(child_process_1.exec);
const packageManager = config_1.getPackageManager();
function checkYarnOrCNPM() {
    // Don't show messages if user has already changed the default.
    if (packageManager !== 'default') {
        return Promise.resolve();
    }
    return Promise
        .all([checkYarn(), checkCNPM()])
        .then((data) => {
        const [isYarnInstalled, isCNPMInstalled] = data;
        if (isYarnInstalled && isCNPMInstalled) {
            console.error(core_1.terminal.yellow('You can `ng config -g cli.packageManager yarn` '
                + 'or `ng config -g cli.packageManager cnpm`.'));
        }
        else if (isYarnInstalled) {
            console.error(core_1.terminal.yellow('You can `ng config -g cli.packageManager yarn`.'));
        }
        else if (isCNPMInstalled) {
            console.error(core_1.terminal.yellow('You can `ng config -g cli.packageManager cnpm`.'));
        }
        else {
            if (packageManager !== 'default' && packageManager !== 'npm') {
                console.error(core_1.terminal.yellow(`Seems that ${packageManager} is not installed.`));
                console.error(core_1.terminal.yellow('You can `ng config -g cli.packageManager npm`.'));
            }
        }
    });
}
exports.checkYarnOrCNPM = checkYarnOrCNPM;
function checkYarn() {
    return execPromise('yarn --version')
        .then(() => true, () => false);
}
function checkCNPM() {
    return execPromise('cnpm --version')
        .then(() => true, () => false);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2stcGFja2FnZS1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyL2NsaS91dGlsaXRpZXMvY2hlY2stcGFja2FnZS1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0NBQWdEO0FBQ2hELGlEQUFxQztBQUNyQywrQkFBaUM7QUFDakMscUNBQTZDO0FBRTdDLE1BQU0sV0FBVyxHQUFHLGdCQUFTLENBQUMsb0JBQUksQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sY0FBYyxHQUFHLDBCQUFpQixFQUFFLENBQUM7QUFHM0MsU0FBZ0IsZUFBZTtJQUU3QiwrREFBK0Q7SUFDL0QsSUFBSSxjQUFjLEtBQUssU0FBUyxFQUFFO1FBQ2hDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQzFCO0lBRUQsT0FBTyxPQUFPO1NBQ1QsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztTQUMvQixJQUFJLENBQUMsQ0FBQyxJQUFvQixFQUFFLEVBQUU7UUFDN0IsTUFBTSxDQUFDLGVBQWUsRUFBRSxlQUFlLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDaEQsSUFBSSxlQUFlLElBQUksZUFBZSxFQUFFO1lBQ3RDLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBUSxDQUFDLE1BQU0sQ0FBQyxpREFBaUQ7a0JBQzNFLDRDQUE0QyxDQUFDLENBQUMsQ0FBQztTQUNwRDthQUFNLElBQUksZUFBZSxFQUFFO1lBQzFCLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBUSxDQUFDLE1BQU0sQ0FBQyxpREFBaUQsQ0FBQyxDQUFDLENBQUM7U0FDbkY7YUFBTSxJQUFJLGVBQWUsRUFBRTtZQUMxQixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQVEsQ0FBQyxNQUFNLENBQUMsaURBQWlELENBQUMsQ0FBQyxDQUFDO1NBQ25GO2FBQU87WUFDTixJQUFJLGNBQWMsS0FBSyxTQUFTLElBQUksY0FBYyxLQUFLLEtBQUssRUFBRTtnQkFDNUQsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFRLENBQUMsTUFBTSxDQUFDLGNBQWMsY0FBYyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pGLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBUSxDQUFDLE1BQU0sQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDLENBQUM7YUFDbEY7U0FDRjtJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ1QsQ0FBQztBQXpCRCwwQ0F5QkM7QUFFRCxTQUFTLFNBQVM7SUFDaEIsT0FBTyxXQUFXLENBQUMsZ0JBQWdCLENBQUM7U0FDakMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNuQyxDQUFDO0FBRUQsU0FBUyxTQUFTO0lBQ2hCLE9BQU8sV0FBVyxDQUFDLGdCQUFnQixDQUFDO1NBQ2pDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbkMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgdGVybWluYWwgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJztcbmltcG9ydCB7IGdldFBhY2thZ2VNYW5hZ2VyIH0gZnJvbSAnLi9jb25maWcnO1xuXG5jb25zdCBleGVjUHJvbWlzZSA9IHByb21pc2lmeShleGVjKTtcbmNvbnN0IHBhY2thZ2VNYW5hZ2VyID0gZ2V0UGFja2FnZU1hbmFnZXIoKTtcblxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tZYXJuT3JDTlBNKCkge1xuXG4gIC8vIERvbid0IHNob3cgbWVzc2FnZXMgaWYgdXNlciBoYXMgYWxyZWFkeSBjaGFuZ2VkIHRoZSBkZWZhdWx0LlxuICBpZiAocGFja2FnZU1hbmFnZXIgIT09ICdkZWZhdWx0Jykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHJldHVybiBQcm9taXNlXG4gICAgICAuYWxsKFtjaGVja1lhcm4oKSwgY2hlY2tDTlBNKCldKVxuICAgICAgLnRoZW4oKGRhdGE6IEFycmF5PGJvb2xlYW4+KSA9PiB7XG4gICAgICAgIGNvbnN0IFtpc1lhcm5JbnN0YWxsZWQsIGlzQ05QTUluc3RhbGxlZF0gPSBkYXRhO1xuICAgICAgICBpZiAoaXNZYXJuSW5zdGFsbGVkICYmIGlzQ05QTUluc3RhbGxlZCkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGVybWluYWwueWVsbG93KCdZb3UgY2FuIGBuZyBjb25maWcgLWcgY2xpLnBhY2thZ2VNYW5hZ2VyIHlhcm5gICdcbiAgICAgICAgICAgICsgJ29yIGBuZyBjb25maWcgLWcgY2xpLnBhY2thZ2VNYW5hZ2VyIGNucG1gLicpKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1lhcm5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKHRlcm1pbmFsLnllbGxvdygnWW91IGNhbiBgbmcgY29uZmlnIC1nIGNsaS5wYWNrYWdlTWFuYWdlciB5YXJuYC4nKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNDTlBNSW5zdGFsbGVkKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcih0ZXJtaW5hbC55ZWxsb3coJ1lvdSBjYW4gYG5nIGNvbmZpZyAtZyBjbGkucGFja2FnZU1hbmFnZXIgY25wbWAuJykpO1xuICAgICAgICB9IGVsc2UgIHtcbiAgICAgICAgICBpZiAocGFja2FnZU1hbmFnZXIgIT09ICdkZWZhdWx0JyAmJiBwYWNrYWdlTWFuYWdlciAhPT0gJ25wbScpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGVybWluYWwueWVsbG93KGBTZWVtcyB0aGF0ICR7cGFja2FnZU1hbmFnZXJ9IGlzIG5vdCBpbnN0YWxsZWQuYCkpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcih0ZXJtaW5hbC55ZWxsb3coJ1lvdSBjYW4gYG5nIGNvbmZpZyAtZyBjbGkucGFja2FnZU1hbmFnZXIgbnBtYC4nKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbn1cblxuZnVuY3Rpb24gY2hlY2tZYXJuKCkge1xuICByZXR1cm4gZXhlY1Byb21pc2UoJ3lhcm4gLS12ZXJzaW9uJylcbiAgICAudGhlbigoKSA9PiB0cnVlLCAoKSA9PiBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIGNoZWNrQ05QTSgpIHtcbiAgcmV0dXJuIGV4ZWNQcm9taXNlKCdjbnBtIC0tdmVyc2lvbicpXG4gICAgLnRoZW4oKCkgPT4gdHJ1ZSwgKCkgPT4gZmFsc2UpO1xufVxuIl19