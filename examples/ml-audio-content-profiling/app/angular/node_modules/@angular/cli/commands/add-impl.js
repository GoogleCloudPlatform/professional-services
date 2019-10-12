"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-global-tslint-disable no-any
const core_1 = require("@angular-devkit/core");
const tools_1 = require("@angular-devkit/schematics/tools");
const schematic_command_1 = require("../models/schematic-command");
const config_1 = require("../utilities/config");
class AddCommand extends schematic_command_1.SchematicCommand {
    constructor() {
        super(...arguments);
        this.allowPrivateSchematics = true;
    }
    async run(options) {
        if (!options.collection) {
            this.logger.fatal(`The "ng add" command requires a name argument to be specified eg. `
                + `${core_1.terminal.yellow('ng add [name] ')}. For more details, use "ng help".`);
            return 1;
        }
        const packageManager = config_1.getPackageManager();
        const npmInstall = require('../tasks/npm-install').default;
        const packageName = options.collection.startsWith('@')
            ? options.collection.split('/', 2).join('/')
            : options.collection.split('/', 1)[0];
        // Remove the tag/version from the package name.
        const collectionName = (packageName.startsWith('@')
            ? packageName.split('@', 2).join('@')
            : packageName.split('@', 1).join('@')) + options.collection.slice(packageName.length);
        // We don't actually add the package to package.json, that would be the work of the package
        // itself.
        await npmInstall(packageName, this.logger, packageManager, this.workspace.root);
        const runOptions = {
            schematicOptions: options['--'] || [],
            workingDir: this.workspace.root,
            collectionName,
            schematicName: 'ng-add',
            allowPrivate: true,
            dryRun: false,
            force: false,
        };
        try {
            return await this.runSchematic(runOptions);
        }
        catch (e) {
            if (e instanceof tools_1.NodePackageDoesNotSupportSchematics) {
                this.logger.error(core_1.tags.oneLine `
          The package that you are trying to add does not support schematics. You can try using
          a different version of the package or contact the package author to add ng-add support.
        `);
                return 1;
            }
            throw e;
        }
    }
}
exports.AddCommand = AddCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkLWltcGwuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL2NvbW1hbmRzL2FkZC1pbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsaURBQWlEO0FBQ2pELCtDQUFzRDtBQUN0RCw0REFBdUY7QUFFdkYsbUVBQStEO0FBRS9ELGdEQUF3RDtBQUd4RCxNQUFhLFVBQVcsU0FBUSxvQ0FBa0M7SUFBbEU7O1FBQ1csMkJBQXNCLEdBQUcsSUFBSSxDQUFDO0lBNkR6QyxDQUFDO0lBM0RDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBcUM7UUFDN0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDdkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2Ysb0VBQW9FO2tCQUNsRSxHQUFHLGVBQVEsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsb0NBQW9DLENBQzNFLENBQUM7WUFFRixPQUFPLENBQUMsQ0FBQztTQUNWO1FBRUQsTUFBTSxjQUFjLEdBQUcsMEJBQWlCLEVBQUUsQ0FBQztRQUUzQyxNQUFNLFVBQVUsR0FBZSxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFFdkUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXhDLGdEQUFnRDtRQUNoRCxNQUFNLGNBQWMsR0FBRyxDQUNyQixXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztZQUN6QixDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUNyQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUN4QyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVqRCwyRkFBMkY7UUFDM0YsVUFBVTtRQUNWLE1BQU0sVUFBVSxDQUNkLFdBQVcsRUFDWCxJQUFJLENBQUMsTUFBTSxFQUNYLGNBQWMsRUFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FDcEIsQ0FBQztRQUVGLE1BQU0sVUFBVSxHQUFHO1lBQ2pCLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ3JDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUk7WUFDL0IsY0FBYztZQUNkLGFBQWEsRUFBRSxRQUFRO1lBQ3ZCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLE1BQU0sRUFBRSxLQUFLO1lBQ2IsS0FBSyxFQUFFLEtBQUs7U0FDYixDQUFDO1FBRUYsSUFBSTtZQUNGLE9BQU8sTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzVDO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixJQUFJLENBQUMsWUFBWSwyQ0FBbUMsRUFBRTtnQkFDcEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBSSxDQUFDLE9BQU8sQ0FBQTs7O1NBRzdCLENBQUMsQ0FBQztnQkFFSCxPQUFPLENBQUMsQ0FBQzthQUNWO1lBRUQsTUFBTSxDQUFDLENBQUM7U0FDVDtJQUNILENBQUM7Q0FDRjtBQTlERCxnQ0E4REMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIHRzbGludDpkaXNhYmxlOm5vLWdsb2JhbC10c2xpbnQtZGlzYWJsZSBuby1hbnlcbmltcG9ydCB7IHRhZ3MsIHRlcm1pbmFsIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgTm9kZVBhY2thZ2VEb2VzTm90U3VwcG9ydFNjaGVtYXRpY3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90b29scyc7XG5pbXBvcnQgeyBBcmd1bWVudHMgfSBmcm9tICcuLi9tb2RlbHMvaW50ZXJmYWNlJztcbmltcG9ydCB7IFNjaGVtYXRpY0NvbW1hbmQgfSBmcm9tICcuLi9tb2RlbHMvc2NoZW1hdGljLWNvbW1hbmQnO1xuaW1wb3J0IHsgTnBtSW5zdGFsbCB9IGZyb20gJy4uL3Rhc2tzL25wbS1pbnN0YWxsJztcbmltcG9ydCB7IGdldFBhY2thZ2VNYW5hZ2VyIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2NvbmZpZyc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgQWRkQ29tbWFuZFNjaGVtYSB9IGZyb20gJy4vYWRkJztcblxuZXhwb3J0IGNsYXNzIEFkZENvbW1hbmQgZXh0ZW5kcyBTY2hlbWF0aWNDb21tYW5kPEFkZENvbW1hbmRTY2hlbWE+IHtcbiAgcmVhZG9ubHkgYWxsb3dQcml2YXRlU2NoZW1hdGljcyA9IHRydWU7XG5cbiAgYXN5bmMgcnVuKG9wdGlvbnM6IEFkZENvbW1hbmRTY2hlbWEgJiBBcmd1bWVudHMpIHtcbiAgICBpZiAoIW9wdGlvbnMuY29sbGVjdGlvbikge1xuICAgICAgdGhpcy5sb2dnZXIuZmF0YWwoXG4gICAgICAgIGBUaGUgXCJuZyBhZGRcIiBjb21tYW5kIHJlcXVpcmVzIGEgbmFtZSBhcmd1bWVudCB0byBiZSBzcGVjaWZpZWQgZWcuIGBcbiAgICAgICAgKyBgJHt0ZXJtaW5hbC55ZWxsb3coJ25nIGFkZCBbbmFtZV0gJyl9LiBGb3IgbW9yZSBkZXRhaWxzLCB1c2UgXCJuZyBoZWxwXCIuYCxcbiAgICAgICk7XG5cbiAgICAgIHJldHVybiAxO1xuICAgIH1cblxuICAgIGNvbnN0IHBhY2thZ2VNYW5hZ2VyID0gZ2V0UGFja2FnZU1hbmFnZXIoKTtcblxuICAgIGNvbnN0IG5wbUluc3RhbGw6IE5wbUluc3RhbGwgPSByZXF1aXJlKCcuLi90YXNrcy9ucG0taW5zdGFsbCcpLmRlZmF1bHQ7XG5cbiAgICBjb25zdCBwYWNrYWdlTmFtZSA9IG9wdGlvbnMuY29sbGVjdGlvbi5zdGFydHNXaXRoKCdAJylcbiAgICAgID8gb3B0aW9ucy5jb2xsZWN0aW9uLnNwbGl0KCcvJywgMikuam9pbignLycpXG4gICAgICA6IG9wdGlvbnMuY29sbGVjdGlvbi5zcGxpdCgnLycsIDEpWzBdO1xuXG4gICAgLy8gUmVtb3ZlIHRoZSB0YWcvdmVyc2lvbiBmcm9tIHRoZSBwYWNrYWdlIG5hbWUuXG4gICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSAoXG4gICAgICBwYWNrYWdlTmFtZS5zdGFydHNXaXRoKCdAJylcbiAgICAgICAgPyBwYWNrYWdlTmFtZS5zcGxpdCgnQCcsIDIpLmpvaW4oJ0AnKVxuICAgICAgICA6IHBhY2thZ2VOYW1lLnNwbGl0KCdAJywgMSkuam9pbignQCcpXG4gICAgKSArIG9wdGlvbnMuY29sbGVjdGlvbi5zbGljZShwYWNrYWdlTmFtZS5sZW5ndGgpO1xuXG4gICAgLy8gV2UgZG9uJ3QgYWN0dWFsbHkgYWRkIHRoZSBwYWNrYWdlIHRvIHBhY2thZ2UuanNvbiwgdGhhdCB3b3VsZCBiZSB0aGUgd29yayBvZiB0aGUgcGFja2FnZVxuICAgIC8vIGl0c2VsZi5cbiAgICBhd2FpdCBucG1JbnN0YWxsKFxuICAgICAgcGFja2FnZU5hbWUsXG4gICAgICB0aGlzLmxvZ2dlcixcbiAgICAgIHBhY2thZ2VNYW5hZ2VyLFxuICAgICAgdGhpcy53b3Jrc3BhY2Uucm9vdCxcbiAgICApO1xuXG4gICAgY29uc3QgcnVuT3B0aW9ucyA9IHtcbiAgICAgIHNjaGVtYXRpY09wdGlvbnM6IG9wdGlvbnNbJy0tJ10gfHwgW10sXG4gICAgICB3b3JraW5nRGlyOiB0aGlzLndvcmtzcGFjZS5yb290LFxuICAgICAgY29sbGVjdGlvbk5hbWUsXG4gICAgICBzY2hlbWF0aWNOYW1lOiAnbmctYWRkJyxcbiAgICAgIGFsbG93UHJpdmF0ZTogdHJ1ZSxcbiAgICAgIGRyeVJ1bjogZmFsc2UsXG4gICAgICBmb3JjZTogZmFsc2UsXG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5ydW5TY2hlbWF0aWMocnVuT3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBOb2RlUGFja2FnZURvZXNOb3RTdXBwb3J0U2NoZW1hdGljcykge1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcih0YWdzLm9uZUxpbmVgXG4gICAgICAgICAgVGhlIHBhY2thZ2UgdGhhdCB5b3UgYXJlIHRyeWluZyB0byBhZGQgZG9lcyBub3Qgc3VwcG9ydCBzY2hlbWF0aWNzLiBZb3UgY2FuIHRyeSB1c2luZ1xuICAgICAgICAgIGEgZGlmZmVyZW50IHZlcnNpb24gb2YgdGhlIHBhY2thZ2Ugb3IgY29udGFjdCB0aGUgcGFja2FnZSBhdXRob3IgdG8gYWRkIG5nLWFkZCBzdXBwb3J0LlxuICAgICAgICBgKTtcblxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==