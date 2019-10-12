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
const node_1 = require("@angular-devkit/core/node");
const child_process_1 = require("child_process");
async function default_1(packageName, logger, packageManager, projectRoot, save = true) {
    const installArgs = [];
    switch (packageManager) {
        case 'cnpm':
        case 'npm':
            installArgs.push('install', '--quiet');
            break;
        case 'yarn':
            installArgs.push('add');
            break;
        default:
            packageManager = 'npm';
            installArgs.push('install', '--quiet');
            break;
    }
    logger.info(core_1.terminal.green(`Installing packages for tooling via ${packageManager}.`));
    if (packageName) {
        try {
            // Verify if we need to install the package (it might already be there).
            // If it's available and we shouldn't save, simply return. Nothing to be done.
            node_1.resolve(packageName, { checkLocal: true, basedir: projectRoot });
            return;
        }
        catch (e) {
            if (!(e instanceof node_1.ModuleNotFoundException)) {
                throw e;
            }
        }
        installArgs.push(packageName);
    }
    if (!save) {
        installArgs.push('--no-save');
    }
    const installOptions = {
        stdio: 'inherit',
        shell: true,
    };
    await new Promise((resolve, reject) => {
        child_process_1.spawn(packageManager, installArgs, installOptions)
            .on('close', (code) => {
            if (code === 0) {
                logger.info(core_1.terminal.green(`Installed packages for tooling via ${packageManager}.`));
                resolve();
            }
            else {
                const message = 'Package install failed, see above.';
                logger.info(core_1.terminal.red(message));
                reject(message);
            }
        });
    });
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnBtLWluc3RhbGwuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL3Rhc2tzL25wbS1pbnN0YWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0NBQXlEO0FBQ3pELG9EQUE2RTtBQUM3RSxpREFBc0M7QUFTdkIsS0FBSyxvQkFBVyxXQUFtQixFQUNuQixNQUFzQixFQUN0QixjQUFzQixFQUN0QixXQUFtQixFQUNuQixJQUFJLEdBQUcsSUFBSTtJQUN4QyxNQUFNLFdBQVcsR0FBYSxFQUFFLENBQUM7SUFDakMsUUFBUSxjQUFjLEVBQUU7UUFDdEIsS0FBSyxNQUFNLENBQUM7UUFDWixLQUFLLEtBQUs7WUFDUixXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN2QyxNQUFNO1FBRVIsS0FBSyxNQUFNO1lBQ1QsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QixNQUFNO1FBRVI7WUFDRSxjQUFjLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU07S0FDVDtJQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBUSxDQUFDLEtBQUssQ0FBQyx1Q0FBdUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRXRGLElBQUksV0FBVyxFQUFFO1FBQ2YsSUFBSTtZQUNGLHdFQUF3RTtZQUN4RSw4RUFBOEU7WUFDOUUsY0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFFakUsT0FBTztTQUNSO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixJQUFJLENBQUMsQ0FBQyxDQUFDLFlBQVksOEJBQXVCLENBQUMsRUFBRTtnQkFDM0MsTUFBTSxDQUFDLENBQUM7YUFDVDtTQUNGO1FBQ0QsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUMvQjtJQUVELElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDVCxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQy9CO0lBQ0QsTUFBTSxjQUFjLEdBQUc7UUFDckIsS0FBSyxFQUFFLFNBQVM7UUFDaEIsS0FBSyxFQUFFLElBQUk7S0FDWixDQUFDO0lBRUYsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNwQyxxQkFBSyxDQUFDLGNBQWMsRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDO2FBQy9DLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtZQUM1QixJQUFJLElBQUksS0FBSyxDQUFDLEVBQUU7Z0JBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFRLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxjQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JGLE9BQU8sRUFBRSxDQUFDO2FBQ1g7aUJBQU07Z0JBQ0wsTUFBTSxPQUFPLEdBQUcsb0NBQW9DLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDakI7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQTVERCw0QkE0REMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGxvZ2dpbmcsIHRlcm1pbmFsIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgTW9kdWxlTm90Rm91bmRFeGNlcHRpb24sIHJlc29sdmUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCB7IHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cblxuZXhwb3J0IHR5cGUgTnBtSW5zdGFsbCA9IChwYWNrYWdlTmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwYWNrYWdlTWFuYWdlcjogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzYXZlPzogYm9vbGVhbikgPT4gUHJvbWlzZTx2b2lkPjtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gKHBhY2thZ2VOYW1lOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWNrYWdlTWFuYWdlcjogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RSb290OiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZSA9IHRydWUpIHtcbiAgY29uc3QgaW5zdGFsbEFyZ3M6IHN0cmluZ1tdID0gW107XG4gIHN3aXRjaCAocGFja2FnZU1hbmFnZXIpIHtcbiAgICBjYXNlICdjbnBtJzpcbiAgICBjYXNlICducG0nOlxuICAgICAgaW5zdGFsbEFyZ3MucHVzaCgnaW5zdGFsbCcsICctLXF1aWV0Jyk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ3lhcm4nOlxuICAgICAgaW5zdGFsbEFyZ3MucHVzaCgnYWRkJyk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgICBwYWNrYWdlTWFuYWdlciA9ICducG0nO1xuICAgICAgaW5zdGFsbEFyZ3MucHVzaCgnaW5zdGFsbCcsICctLXF1aWV0Jyk7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIGxvZ2dlci5pbmZvKHRlcm1pbmFsLmdyZWVuKGBJbnN0YWxsaW5nIHBhY2thZ2VzIGZvciB0b29saW5nIHZpYSAke3BhY2thZ2VNYW5hZ2VyfS5gKSk7XG5cbiAgaWYgKHBhY2thZ2VOYW1lKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFZlcmlmeSBpZiB3ZSBuZWVkIHRvIGluc3RhbGwgdGhlIHBhY2thZ2UgKGl0IG1pZ2h0IGFscmVhZHkgYmUgdGhlcmUpLlxuICAgICAgLy8gSWYgaXQncyBhdmFpbGFibGUgYW5kIHdlIHNob3VsZG4ndCBzYXZlLCBzaW1wbHkgcmV0dXJuLiBOb3RoaW5nIHRvIGJlIGRvbmUuXG4gICAgICByZXNvbHZlKHBhY2thZ2VOYW1lLCB7IGNoZWNrTG9jYWw6IHRydWUsIGJhc2VkaXI6IHByb2plY3RSb290IH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIE1vZHVsZU5vdEZvdW5kRXhjZXB0aW9uKSkge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgICBpbnN0YWxsQXJncy5wdXNoKHBhY2thZ2VOYW1lKTtcbiAgfVxuXG4gIGlmICghc2F2ZSkge1xuICAgIGluc3RhbGxBcmdzLnB1c2goJy0tbm8tc2F2ZScpO1xuICB9XG4gIGNvbnN0IGluc3RhbGxPcHRpb25zID0ge1xuICAgIHN0ZGlvOiAnaW5oZXJpdCcsXG4gICAgc2hlbGw6IHRydWUsXG4gIH07XG5cbiAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHNwYXduKHBhY2thZ2VNYW5hZ2VyLCBpbnN0YWxsQXJncywgaW5zdGFsbE9wdGlvbnMpXG4gICAgICAub24oJ2Nsb3NlJywgKGNvZGU6IG51bWJlcikgPT4ge1xuICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgICAgIGxvZ2dlci5pbmZvKHRlcm1pbmFsLmdyZWVuKGBJbnN0YWxsZWQgcGFja2FnZXMgZm9yIHRvb2xpbmcgdmlhICR7cGFja2FnZU1hbmFnZXJ9LmApKTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9ICdQYWNrYWdlIGluc3RhbGwgZmFpbGVkLCBzZWUgYWJvdmUuJztcbiAgICAgICAgICBsb2dnZXIuaW5mbyh0ZXJtaW5hbC5yZWQobWVzc2FnZSkpO1xuICAgICAgICAgIHJlamVjdChtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH0pO1xufVxuIl19