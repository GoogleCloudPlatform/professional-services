"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematic_command_1 = require("../models/schematic-command");
class NewCommand extends schematic_command_1.SchematicCommand {
    constructor() {
        super(...arguments);
        this.allowMissingWorkspace = true;
        this.schematicName = 'ng-new';
    }
    async run(options) {
        let collectionName;
        if (options.collection) {
            collectionName = options.collection;
        }
        else {
            collectionName = this.parseCollectionName(options);
        }
        // Register the version of the CLI in the registry.
        const packageJson = require('../package.json');
        const version = packageJson.version;
        this._workflow.registry.addSmartDefaultProvider('ng-cli-version', () => version);
        return this.runSchematic({
            collectionName: collectionName,
            schematicName: this.schematicName,
            schematicOptions: options['--'] || [],
            debug: !!options.debug,
            dryRun: !!options.dryRun,
            force: !!options.force,
        });
    }
    parseCollectionName(options) {
        return options.collection || this.getDefaultSchematicCollection();
    }
}
exports.NewCommand = NewCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV3LWltcGwuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL2NvbW1hbmRzL25ldy1pbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBSUgsbUVBQStEO0FBSS9ELE1BQWEsVUFBVyxTQUFRLG9DQUFrQztJQUFsRTs7UUFDa0IsMEJBQXFCLEdBQUcsSUFBSSxDQUFDO1FBQzdDLGtCQUFhLEdBQUcsUUFBUSxDQUFDO0lBNkIzQixDQUFDO0lBM0JRLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBcUM7UUFDcEQsSUFBSSxjQUFzQixDQUFDO1FBQzNCLElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUN0QixjQUFjLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztTQUNyQzthQUFNO1lBQ0wsY0FBYyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNwRDtRQUVELG1EQUFtRDtRQUNuRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMvQyxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBRXBDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWpGLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztZQUN2QixjQUFjLEVBQUUsY0FBYztZQUM5QixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7WUFDakMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDckMsS0FBSyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSztZQUN0QixNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNO1lBQ3hCLEtBQUssRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUs7U0FDdkIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVPLG1CQUFtQixDQUFDLE9BQVk7UUFDdEMsT0FBTyxPQUFPLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO0lBQ3BFLENBQUM7Q0FDRjtBQS9CRCxnQ0ErQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIHRzbGludDpkaXNhYmxlOm5vLWdsb2JhbC10c2xpbnQtZGlzYWJsZSBuby1hbnlcbmltcG9ydCB7IEFyZ3VtZW50cyB9IGZyb20gJy4uL21vZGVscy9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgU2NoZW1hdGljQ29tbWFuZCB9IGZyb20gJy4uL21vZGVscy9zY2hlbWF0aWMtY29tbWFuZCc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgTmV3Q29tbWFuZFNjaGVtYSB9IGZyb20gJy4vbmV3JztcblxuXG5leHBvcnQgY2xhc3MgTmV3Q29tbWFuZCBleHRlbmRzIFNjaGVtYXRpY0NvbW1hbmQ8TmV3Q29tbWFuZFNjaGVtYT4ge1xuICBwdWJsaWMgcmVhZG9ubHkgYWxsb3dNaXNzaW5nV29ya3NwYWNlID0gdHJ1ZTtcbiAgc2NoZW1hdGljTmFtZSA9ICduZy1uZXcnO1xuXG4gIHB1YmxpYyBhc3luYyBydW4ob3B0aW9uczogTmV3Q29tbWFuZFNjaGVtYSAmIEFyZ3VtZW50cykge1xuICAgIGxldCBjb2xsZWN0aW9uTmFtZTogc3RyaW5nO1xuICAgIGlmIChvcHRpb25zLmNvbGxlY3Rpb24pIHtcbiAgICAgIGNvbGxlY3Rpb25OYW1lID0gb3B0aW9ucy5jb2xsZWN0aW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2xsZWN0aW9uTmFtZSA9IHRoaXMucGFyc2VDb2xsZWN0aW9uTmFtZShvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBSZWdpc3RlciB0aGUgdmVyc2lvbiBvZiB0aGUgQ0xJIGluIHRoZSByZWdpc3RyeS5cbiAgICBjb25zdCBwYWNrYWdlSnNvbiA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpO1xuICAgIGNvbnN0IHZlcnNpb24gPSBwYWNrYWdlSnNvbi52ZXJzaW9uO1xuXG4gICAgdGhpcy5fd29ya2Zsb3cucmVnaXN0cnkuYWRkU21hcnREZWZhdWx0UHJvdmlkZXIoJ25nLWNsaS12ZXJzaW9uJywgKCkgPT4gdmVyc2lvbik7XG5cbiAgICByZXR1cm4gdGhpcy5ydW5TY2hlbWF0aWMoe1xuICAgICAgY29sbGVjdGlvbk5hbWU6IGNvbGxlY3Rpb25OYW1lLFxuICAgICAgc2NoZW1hdGljTmFtZTogdGhpcy5zY2hlbWF0aWNOYW1lLFxuICAgICAgc2NoZW1hdGljT3B0aW9uczogb3B0aW9uc1snLS0nXSB8fCBbXSxcbiAgICAgIGRlYnVnOiAhIW9wdGlvbnMuZGVidWcsXG4gICAgICBkcnlSdW46ICEhb3B0aW9ucy5kcnlSdW4sXG4gICAgICBmb3JjZTogISFvcHRpb25zLmZvcmNlLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUNvbGxlY3Rpb25OYW1lKG9wdGlvbnM6IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG9wdGlvbnMuY29sbGVjdGlvbiB8fCB0aGlzLmdldERlZmF1bHRTY2hlbWF0aWNDb2xsZWN0aW9uKCk7XG4gIH1cbn1cbiJdfQ==