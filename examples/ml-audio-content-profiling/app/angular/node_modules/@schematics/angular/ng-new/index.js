"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
function default_1(options) {
    if (!options.name) {
        throw new schematics_1.SchematicsException(`Invalid options, "name" is required.`);
    }
    if (!options.directory) {
        options.directory = options.name;
    }
    const workspaceOptions = {
        name: options.name,
        version: options.version,
        newProjectRoot: options.newProjectRoot || 'projects',
        minimal: options.minimal,
    };
    const applicationOptions = {
        projectRoot: '',
        name: options.name,
        experimentalIvy: options.experimentalIvy,
        inlineStyle: options.inlineStyle,
        inlineTemplate: options.inlineTemplate,
        prefix: options.prefix,
        viewEncapsulation: options.viewEncapsulation,
        routing: options.routing,
        style: options.style,
        skipTests: options.skipTests,
        skipPackageJson: false,
        minimal: options.minimal,
    };
    return schematics_1.chain([
        schematics_1.mergeWith(schematics_1.apply(schematics_1.empty(), [
            schematics_1.schematic('workspace', workspaceOptions),
            options.createApplication ? schematics_1.schematic('application', applicationOptions) : schematics_1.noop,
            schematics_1.move(options.directory || options.name),
        ])),
        (_host, context) => {
            let packageTask;
            if (!options.skipInstall) {
                packageTask = context.addTask(new tasks_1.NodePackageInstallTask(options.directory));
                if (options.linkCli) {
                    packageTask = context.addTask(new tasks_1.NodePackageLinkTask('@angular/cli', options.directory), [packageTask]);
                }
            }
            if (!options.skipGit) {
                const commit = typeof options.commit == 'object'
                    ? options.commit
                    : (!!options.commit ? {} : false);
                context.addTask(new tasks_1.RepositoryInitializerTask(options.directory, commit), packageTask ? [packageTask] : []);
            }
        },
    ]);
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci9uZy1uZXcvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwyREFZb0M7QUFDcEMsNERBSTBDO0FBTTFDLG1CQUF5QixPQUFxQjtJQUM1QyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRTtRQUNqQixNQUFNLElBQUksZ0NBQW1CLENBQUMsc0NBQXNDLENBQUMsQ0FBQztLQUN2RTtJQUVELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1FBQ3RCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztLQUNsQztJQUVELE1BQU0sZ0JBQWdCLEdBQXFCO1FBQ3pDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtRQUNsQixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87UUFDeEIsY0FBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjLElBQUksVUFBVTtRQUNwRCxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87S0FDekIsQ0FBQztJQUNGLE1BQU0sa0JBQWtCLEdBQXVCO1FBQzdDLFdBQVcsRUFBRSxFQUFFO1FBQ2YsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1FBQ2xCLGVBQWUsRUFBRSxPQUFPLENBQUMsZUFBZTtRQUN4QyxXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVc7UUFDaEMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjO1FBQ3RDLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtRQUN0QixpQkFBaUIsRUFBRSxPQUFPLENBQUMsaUJBQWlCO1FBQzVDLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztRQUN4QixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7UUFDcEIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTO1FBQzVCLGVBQWUsRUFBRSxLQUFLO1FBQ3RCLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztLQUN6QixDQUFDO0lBRUYsT0FBTyxrQkFBSyxDQUFDO1FBQ1gsc0JBQVMsQ0FDUCxrQkFBSyxDQUFDLGtCQUFLLEVBQUUsRUFBRTtZQUNiLHNCQUFTLENBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDO1lBQ3hDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsc0JBQVMsQ0FBQyxhQUFhLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQUk7WUFDL0UsaUJBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUM7U0FDeEMsQ0FBQyxDQUNIO1FBQ0QsQ0FBQyxLQUFXLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQ3pDLElBQUksV0FBVyxDQUFDO1lBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFO2dCQUN4QixXQUFXLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLDhCQUFzQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7b0JBQ25CLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUMzQixJQUFJLDJCQUFtQixDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQzFELENBQUMsV0FBVyxDQUFDLENBQ2QsQ0FBQztpQkFDSDthQUNGO1lBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7Z0JBQ3BCLE1BQU0sTUFBTSxHQUFHLE9BQU8sT0FBTyxDQUFDLE1BQU0sSUFBSSxRQUFRO29CQUM5QyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU07b0JBQ2hCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUVwQyxPQUFPLENBQUMsT0FBTyxDQUNiLElBQUksaUNBQXlCLENBQzNCLE9BQU8sQ0FBQyxTQUFTLEVBQ2pCLE1BQU0sQ0FDUCxFQUNELFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUNqQyxDQUFDO2FBQ0g7UUFDSCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQWhFRCw0QkFnRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBSdWxlLFxuICBTY2hlbWF0aWNDb250ZXh0LFxuICBTY2hlbWF0aWNzRXhjZXB0aW9uLFxuICBUcmVlLFxuICBhcHBseSxcbiAgY2hhaW4sXG4gIGVtcHR5LFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIG5vb3AsXG4gIHNjaGVtYXRpYyxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtcbiAgTm9kZVBhY2thZ2VJbnN0YWxsVGFzayxcbiAgTm9kZVBhY2thZ2VMaW5rVGFzayxcbiAgUmVwb3NpdG9yeUluaXRpYWxpemVyVGFzayxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIEFwcGxpY2F0aW9uT3B0aW9ucyB9IGZyb20gJy4uL2FwcGxpY2F0aW9uL3NjaGVtYSc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgV29ya3NwYWNlT3B0aW9ucyB9IGZyb20gJy4uL3dvcmtzcGFjZS9zY2hlbWEnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIE5nTmV3T3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9uczogTmdOZXdPcHRpb25zKTogUnVsZSB7XG4gIGlmICghb3B0aW9ucy5uYW1lKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYEludmFsaWQgb3B0aW9ucywgXCJuYW1lXCIgaXMgcmVxdWlyZWQuYCk7XG4gIH1cblxuICBpZiAoIW9wdGlvbnMuZGlyZWN0b3J5KSB7XG4gICAgb3B0aW9ucy5kaXJlY3RvcnkgPSBvcHRpb25zLm5hbWU7XG4gIH1cblxuICBjb25zdCB3b3Jrc3BhY2VPcHRpb25zOiBXb3Jrc3BhY2VPcHRpb25zID0ge1xuICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcbiAgICB2ZXJzaW9uOiBvcHRpb25zLnZlcnNpb24sXG4gICAgbmV3UHJvamVjdFJvb3Q6IG9wdGlvbnMubmV3UHJvamVjdFJvb3QgfHwgJ3Byb2plY3RzJyxcbiAgICBtaW5pbWFsOiBvcHRpb25zLm1pbmltYWwsXG4gIH07XG4gIGNvbnN0IGFwcGxpY2F0aW9uT3B0aW9uczogQXBwbGljYXRpb25PcHRpb25zID0ge1xuICAgIHByb2plY3RSb290OiAnJyxcbiAgICBuYW1lOiBvcHRpb25zLm5hbWUsXG4gICAgZXhwZXJpbWVudGFsSXZ5OiBvcHRpb25zLmV4cGVyaW1lbnRhbEl2eSxcbiAgICBpbmxpbmVTdHlsZTogb3B0aW9ucy5pbmxpbmVTdHlsZSxcbiAgICBpbmxpbmVUZW1wbGF0ZTogb3B0aW9ucy5pbmxpbmVUZW1wbGF0ZSxcbiAgICBwcmVmaXg6IG9wdGlvbnMucHJlZml4LFxuICAgIHZpZXdFbmNhcHN1bGF0aW9uOiBvcHRpb25zLnZpZXdFbmNhcHN1bGF0aW9uLFxuICAgIHJvdXRpbmc6IG9wdGlvbnMucm91dGluZyxcbiAgICBzdHlsZTogb3B0aW9ucy5zdHlsZSxcbiAgICBza2lwVGVzdHM6IG9wdGlvbnMuc2tpcFRlc3RzLFxuICAgIHNraXBQYWNrYWdlSnNvbjogZmFsc2UsXG4gICAgbWluaW1hbDogb3B0aW9ucy5taW5pbWFsLFxuICB9O1xuXG4gIHJldHVybiBjaGFpbihbXG4gICAgbWVyZ2VXaXRoKFxuICAgICAgYXBwbHkoZW1wdHkoKSwgW1xuICAgICAgICBzY2hlbWF0aWMoJ3dvcmtzcGFjZScsIHdvcmtzcGFjZU9wdGlvbnMpLFxuICAgICAgICBvcHRpb25zLmNyZWF0ZUFwcGxpY2F0aW9uID8gc2NoZW1hdGljKCdhcHBsaWNhdGlvbicsIGFwcGxpY2F0aW9uT3B0aW9ucykgOiBub29wLFxuICAgICAgICBtb3ZlKG9wdGlvbnMuZGlyZWN0b3J5IHx8IG9wdGlvbnMubmFtZSksXG4gICAgICBdKSxcbiAgICApLFxuICAgIChfaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgICAgbGV0IHBhY2thZ2VUYXNrO1xuICAgICAgaWYgKCFvcHRpb25zLnNraXBJbnN0YWxsKSB7XG4gICAgICAgIHBhY2thZ2VUYXNrID0gY29udGV4dC5hZGRUYXNrKG5ldyBOb2RlUGFja2FnZUluc3RhbGxUYXNrKG9wdGlvbnMuZGlyZWN0b3J5KSk7XG4gICAgICAgIGlmIChvcHRpb25zLmxpbmtDbGkpIHtcbiAgICAgICAgICBwYWNrYWdlVGFzayA9IGNvbnRleHQuYWRkVGFzayhcbiAgICAgICAgICAgIG5ldyBOb2RlUGFja2FnZUxpbmtUYXNrKCdAYW5ndWxhci9jbGknLCBvcHRpb25zLmRpcmVjdG9yeSksXG4gICAgICAgICAgICBbcGFja2FnZVRhc2tdLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghb3B0aW9ucy5za2lwR2l0KSB7XG4gICAgICAgIGNvbnN0IGNvbW1pdCA9IHR5cGVvZiBvcHRpb25zLmNvbW1pdCA9PSAnb2JqZWN0J1xuICAgICAgICAgID8gb3B0aW9ucy5jb21taXRcbiAgICAgICAgICA6ICghIW9wdGlvbnMuY29tbWl0ID8ge30gOiBmYWxzZSk7XG5cbiAgICAgICAgY29udGV4dC5hZGRUYXNrKFxuICAgICAgICAgIG5ldyBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrKFxuICAgICAgICAgICAgb3B0aW9ucy5kaXJlY3RvcnksXG4gICAgICAgICAgICBjb21taXQsXG4gICAgICAgICAgKSxcbiAgICAgICAgICBwYWNrYWdlVGFzayA/IFtwYWNrYWdlVGFza10gOiBbXSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9LFxuICBdKTtcbn1cbiJdfQ==