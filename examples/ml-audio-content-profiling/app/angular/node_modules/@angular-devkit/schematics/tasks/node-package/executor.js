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
const rxjs_1 = require("rxjs");
const packageManagers = {
    'npm': {
        quietArgument: '--quiet',
        commands: {
            installAll: 'install',
            installPackage: 'install',
        },
    },
    'cnpm': {
        commands: {
            installAll: 'install',
            installPackage: 'install',
        },
    },
    'yarn': {
        quietArgument: '--silent',
        commands: {
            installPackage: 'add',
        },
    },
};
class UnknownPackageManagerException extends core_1.BaseException {
    constructor(name) {
        super(`Unknown package manager "${name}".`);
    }
}
exports.UnknownPackageManagerException = UnknownPackageManagerException;
function default_1(factoryOptions = {}) {
    const packageManagerName = factoryOptions.packageManager || 'npm';
    const packageManagerProfile = packageManagers[packageManagerName];
    if (!packageManagerProfile) {
        throw new UnknownPackageManagerException(packageManagerName);
    }
    const rootDirectory = factoryOptions.rootDirectory || process.cwd();
    return (options) => {
        let taskPackageManagerProfile = packageManagerProfile;
        let taskPackageManagerName = packageManagerName;
        if (factoryOptions.allowPackageManagerOverride && options.packageManager) {
            taskPackageManagerProfile = packageManagers[options.packageManager];
            if (!taskPackageManagerProfile) {
                throw new UnknownPackageManagerException(options.packageManager);
            }
            taskPackageManagerName = options.packageManager;
        }
        const outputStream = process.stdout;
        const errorStream = process.stderr;
        const spawnOptions = {
            stdio: [process.stdin, outputStream, errorStream],
            shell: true,
            cwd: path.join(rootDirectory, options.workingDirectory || ''),
        };
        const args = [];
        if (options.packageName) {
            if (options.command === 'install') {
                args.push(packageManagerProfile.commands.installPackage);
            }
            args.push(options.packageName);
        }
        else if (options.command === 'install' && packageManagerProfile.commands.installAll) {
            args.push(packageManagerProfile.commands.installAll);
        }
        if (options.quiet && taskPackageManagerProfile.quietArgument) {
            args.push(taskPackageManagerProfile.quietArgument);
        }
        return new rxjs_1.Observable(obs => {
            child_process_1.spawn(taskPackageManagerName, args, spawnOptions)
                .on('close', (code) => {
                if (code === 0) {
                    obs.next();
                    obs.complete();
                }
                else {
                    const message = 'Package install failed, see above.';
                    obs.error(new Error(message));
                }
            });
        });
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3Mvbm9kZS1wYWNrYWdlL2V4ZWN1dG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXFEO0FBQ3JELGlEQUFvRDtBQUNwRCw2QkFBNkI7QUFDN0IsK0JBQWtDO0FBWWxDLE1BQU0sZUFBZSxHQUE4QztJQUNqRSxLQUFLLEVBQUU7UUFDTCxhQUFhLEVBQUUsU0FBUztRQUN4QixRQUFRLEVBQUU7WUFDUixVQUFVLEVBQUUsU0FBUztZQUNyQixjQUFjLEVBQUUsU0FBUztTQUMxQjtLQUNGO0lBQ0QsTUFBTSxFQUFFO1FBQ04sUUFBUSxFQUFFO1lBQ1IsVUFBVSxFQUFFLFNBQVM7WUFDckIsY0FBYyxFQUFFLFNBQVM7U0FDMUI7S0FDRDtJQUNGLE1BQU0sRUFBRTtRQUNOLGFBQWEsRUFBRSxVQUFVO1FBQ3pCLFFBQVEsRUFBRTtZQUNSLGNBQWMsRUFBRSxLQUFLO1NBQ3RCO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsTUFBYSw4QkFBK0IsU0FBUSxvQkFBYTtJQUMvRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLDRCQUE0QixJQUFJLElBQUksQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FDRjtBQUpELHdFQUlDO0FBRUQsbUJBQ0UsaUJBQWdELEVBQUU7SUFFbEQsTUFBTSxrQkFBa0IsR0FBRyxjQUFjLENBQUMsY0FBYyxJQUFJLEtBQUssQ0FBQztJQUNsRSxNQUFNLHFCQUFxQixHQUFHLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ2xFLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtRQUMxQixNQUFNLElBQUksOEJBQThCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztLQUM5RDtJQUVELE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxhQUFhLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRXBFLE9BQU8sQ0FBQyxPQUErQixFQUFFLEVBQUU7UUFDekMsSUFBSSx5QkFBeUIsR0FBRyxxQkFBcUIsQ0FBQztRQUN0RCxJQUFJLHNCQUFzQixHQUFHLGtCQUFrQixDQUFDO1FBQ2hELElBQUksY0FBYyxDQUFDLDJCQUEyQixJQUFJLE9BQU8sQ0FBQyxjQUFjLEVBQUU7WUFDeEUseUJBQXlCLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMseUJBQXlCLEVBQUU7Z0JBQzlCLE1BQU0sSUFBSSw4QkFBOEIsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7YUFDbEU7WUFDRCxzQkFBc0IsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO1NBQ2pEO1FBRUQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNwQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ25DLE1BQU0sWUFBWSxHQUFpQjtZQUNqQyxLQUFLLEVBQUcsQ0FBRSxPQUFPLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUU7WUFDcEQsS0FBSyxFQUFFLElBQUk7WUFDWCxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQztTQUM5RCxDQUFDO1FBQ0YsTUFBTSxJQUFJLEdBQWEsRUFBRSxDQUFDO1FBRTFCLElBQUksT0FBTyxDQUFDLFdBQVcsRUFBRTtZQUN2QixJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFO2dCQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUMxRDtZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ2hDO2FBQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxLQUFLLFNBQVMsSUFBSSxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO1lBQ3JGLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3REO1FBRUQsSUFBSSxPQUFPLENBQUMsS0FBSyxJQUFJLHlCQUF5QixDQUFDLGFBQWEsRUFBRTtZQUM1RCxJQUFJLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQ3BEO1FBRUQsT0FBTyxJQUFJLGlCQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDMUIscUJBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDO2lCQUM5QyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7Z0JBQzVCLElBQUksSUFBSSxLQUFLLENBQUMsRUFBRTtvQkFDZCxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1gsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO2lCQUNoQjtxQkFBTTtvQkFDTCxNQUFNLE9BQU8sR0FBRyxvQ0FBb0MsQ0FBQztvQkFDckQsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUMvQjtZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUM7QUFDSixDQUFDO0FBMURELDRCQTBEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBTcGF3bk9wdGlvbnMsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgVGFza0V4ZWN1dG9yIH0gZnJvbSAnLi4vLi4vc3JjJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlVGFza0ZhY3RvcnlPcHRpb25zLCBOb2RlUGFja2FnZVRhc2tPcHRpb25zIH0gZnJvbSAnLi9vcHRpb25zJztcblxudHlwZSBQYWNrYWdlTWFuYWdlclByb2ZpbGUgPSB7XG4gIHF1aWV0QXJndW1lbnQ/OiBzdHJpbmc7XG4gIGNvbW1hbmRzOiB7XG4gICAgaW5zdGFsbEFsbD86IHN0cmluZztcbiAgICBpbnN0YWxsUGFja2FnZTogc3RyaW5nO1xuICB9LFxufTtcblxuY29uc3QgcGFja2FnZU1hbmFnZXJzOiB7IFtuYW1lOiBzdHJpbmddOiBQYWNrYWdlTWFuYWdlclByb2ZpbGUgfSA9IHtcbiAgJ25wbSc6IHtcbiAgICBxdWlldEFyZ3VtZW50OiAnLS1xdWlldCcsXG4gICAgY29tbWFuZHM6IHtcbiAgICAgIGluc3RhbGxBbGw6ICdpbnN0YWxsJyxcbiAgICAgIGluc3RhbGxQYWNrYWdlOiAnaW5zdGFsbCcsXG4gICAgfSxcbiAgfSxcbiAgJ2NucG0nOiB7XG4gICAgY29tbWFuZHM6IHtcbiAgICAgIGluc3RhbGxBbGw6ICdpbnN0YWxsJyxcbiAgICAgIGluc3RhbGxQYWNrYWdlOiAnaW5zdGFsbCcsXG4gICAgfSxcbiAgIH0sXG4gICd5YXJuJzoge1xuICAgIHF1aWV0QXJndW1lbnQ6ICctLXNpbGVudCcsXG4gICAgY29tbWFuZHM6IHtcbiAgICAgIGluc3RhbGxQYWNrYWdlOiAnYWRkJyxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGNsYXNzIFVua25vd25QYWNrYWdlTWFuYWdlckV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgVW5rbm93biBwYWNrYWdlIG1hbmFnZXIgXCIke25hbWV9XCIuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oXG4gIGZhY3RvcnlPcHRpb25zOiBOb2RlUGFja2FnZVRhc2tGYWN0b3J5T3B0aW9ucyA9IHt9LFxuKTogVGFza0V4ZWN1dG9yPE5vZGVQYWNrYWdlVGFza09wdGlvbnM+IHtcbiAgY29uc3QgcGFja2FnZU1hbmFnZXJOYW1lID0gZmFjdG9yeU9wdGlvbnMucGFja2FnZU1hbmFnZXIgfHwgJ25wbSc7XG4gIGNvbnN0IHBhY2thZ2VNYW5hZ2VyUHJvZmlsZSA9IHBhY2thZ2VNYW5hZ2Vyc1twYWNrYWdlTWFuYWdlck5hbWVdO1xuICBpZiAoIXBhY2thZ2VNYW5hZ2VyUHJvZmlsZSkge1xuICAgIHRocm93IG5ldyBVbmtub3duUGFja2FnZU1hbmFnZXJFeGNlcHRpb24ocGFja2FnZU1hbmFnZXJOYW1lKTtcbiAgfVxuXG4gIGNvbnN0IHJvb3REaXJlY3RvcnkgPSBmYWN0b3J5T3B0aW9ucy5yb290RGlyZWN0b3J5IHx8IHByb2Nlc3MuY3dkKCk7XG5cbiAgcmV0dXJuIChvcHRpb25zOiBOb2RlUGFja2FnZVRhc2tPcHRpb25zKSA9PiB7XG4gICAgbGV0IHRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUgPSBwYWNrYWdlTWFuYWdlclByb2ZpbGU7XG4gICAgbGV0IHRhc2tQYWNrYWdlTWFuYWdlck5hbWUgPSBwYWNrYWdlTWFuYWdlck5hbWU7XG4gICAgaWYgKGZhY3RvcnlPcHRpb25zLmFsbG93UGFja2FnZU1hbmFnZXJPdmVycmlkZSAmJiBvcHRpb25zLnBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgICB0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlID0gcGFja2FnZU1hbmFnZXJzW29wdGlvbnMucGFja2FnZU1hbmFnZXJdO1xuICAgICAgaWYgKCF0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlKSB7XG4gICAgICAgIHRocm93IG5ldyBVbmtub3duUGFja2FnZU1hbmFnZXJFeGNlcHRpb24ob3B0aW9ucy5wYWNrYWdlTWFuYWdlcik7XG4gICAgICB9XG4gICAgICB0YXNrUGFja2FnZU1hbmFnZXJOYW1lID0gb3B0aW9ucy5wYWNrYWdlTWFuYWdlcjtcbiAgICB9XG5cbiAgICBjb25zdCBvdXRwdXRTdHJlYW0gPSBwcm9jZXNzLnN0ZG91dDtcbiAgICBjb25zdCBlcnJvclN0cmVhbSA9IHByb2Nlc3Muc3RkZXJyO1xuICAgIGNvbnN0IHNwYXduT3B0aW9uczogU3Bhd25PcHRpb25zID0ge1xuICAgICAgc3RkaW86ICBbIHByb2Nlc3Muc3RkaW4sIG91dHB1dFN0cmVhbSwgZXJyb3JTdHJlYW0gXSxcbiAgICAgIHNoZWxsOiB0cnVlLFxuICAgICAgY3dkOiBwYXRoLmpvaW4ocm9vdERpcmVjdG9yeSwgb3B0aW9ucy53b3JraW5nRGlyZWN0b3J5IHx8ICcnKSxcbiAgICB9O1xuICAgIGNvbnN0IGFyZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAob3B0aW9ucy5wYWNrYWdlTmFtZSkge1xuICAgICAgaWYgKG9wdGlvbnMuY29tbWFuZCA9PT0gJ2luc3RhbGwnKSB7XG4gICAgICAgIGFyZ3MucHVzaChwYWNrYWdlTWFuYWdlclByb2ZpbGUuY29tbWFuZHMuaW5zdGFsbFBhY2thZ2UpO1xuICAgICAgfVxuICAgICAgYXJncy5wdXNoKG9wdGlvbnMucGFja2FnZU5hbWUpO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5jb21tYW5kID09PSAnaW5zdGFsbCcgJiYgcGFja2FnZU1hbmFnZXJQcm9maWxlLmNvbW1hbmRzLmluc3RhbGxBbGwpIHtcbiAgICAgIGFyZ3MucHVzaChwYWNrYWdlTWFuYWdlclByb2ZpbGUuY29tbWFuZHMuaW5zdGFsbEFsbCk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMucXVpZXQgJiYgdGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZS5xdWlldEFyZ3VtZW50KSB7XG4gICAgICBhcmdzLnB1c2godGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZS5xdWlldEFyZ3VtZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUob2JzID0+IHtcbiAgICAgIHNwYXduKHRhc2tQYWNrYWdlTWFuYWdlck5hbWUsIGFyZ3MsIHNwYXduT3B0aW9ucylcbiAgICAgICAgLm9uKCdjbG9zZScsIChjb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgb2JzLm5leHQoKTtcbiAgICAgICAgICAgIG9icy5jb21wbGV0ZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gJ1BhY2thZ2UgaW5zdGFsbCBmYWlsZWQsIHNlZSBhYm92ZS4nO1xuICAgICAgICAgICAgb2JzLmVycm9yKG5ldyBFcnJvcihtZXNzYWdlKSk7XG4gICAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgfTtcbn1cbiJdfQ==