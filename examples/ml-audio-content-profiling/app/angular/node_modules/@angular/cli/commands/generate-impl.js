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
const schematic_command_1 = require("../models/schematic-command");
const json_schema_1 = require("../utilities/json-schema");
class GenerateCommand extends schematic_command_1.SchematicCommand {
    async initialize(options) {
        await super.initialize(options);
        // Fill up the schematics property of the command description.
        const [collectionName, schematicName] = this.parseSchematicInfo(options);
        const collection = this.getCollection(collectionName);
        const subcommands = {};
        const schematicNames = schematicName ? [schematicName] : collection.listSchematicNames();
        // Sort as a courtesy for the user.
        schematicNames.sort();
        for (const name of schematicNames) {
            const schematic = this.getSchematic(collection, name, true);
            let subcommand;
            if (schematic.description.schemaJson) {
                subcommand = await json_schema_1.parseJsonSchemaToSubCommandDescription(name, schematic.description.path, this._workflow.registry, schematic.description.schemaJson);
            }
            else {
                continue;
            }
            if (this.getDefaultSchematicCollection() == collectionName) {
                subcommands[name] = subcommand;
            }
            else {
                subcommands[`${collectionName}:${name}`] = subcommand;
            }
        }
        this.description.options.forEach(option => {
            if (option.name == 'schematic') {
                option.subcommands = subcommands;
            }
        });
    }
    async run(options) {
        const [collectionName, schematicName] = this.parseSchematicInfo(options);
        if (!schematicName || !collectionName) {
            return this.printHelp(options);
        }
        return this.runSchematic({
            collectionName,
            schematicName,
            schematicOptions: options['--'] || [],
            debug: !!options.debug || false,
            dryRun: !!options.dryRun || false,
            force: !!options.force || false,
        });
    }
    parseSchematicInfo(options) {
        let collectionName = this.getDefaultSchematicCollection();
        let schematicName = options.schematic;
        if (schematicName) {
            if (schematicName.includes(':')) {
                [collectionName, schematicName] = schematicName.split(':', 2);
            }
        }
        return [collectionName, schematicName];
    }
    async printHelp(options) {
        await super.printHelp(options);
        this.logger.info('');
        // Find the generate subcommand.
        const subcommand = this.description.options.filter(x => x.subcommands)[0];
        if (Object.keys((subcommand && subcommand.subcommands) || {}).length == 1) {
            this.logger.info(`\nTo see help for a schematic run:`);
            this.logger.info(core_1.terminal.cyan(`  ng generate <schematic> --help`));
        }
        return 0;
    }
}
exports.GenerateCommand = GenerateCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtaW1wbC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhci9jbGkvY29tbWFuZHMvZ2VuZXJhdGUtaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILGlEQUFpRDtBQUNqRCwrQ0FBZ0Q7QUFFaEQsbUVBQStEO0FBQy9ELDBEQUFrRjtBQUdsRixNQUFhLGVBQWdCLFNBQVEsb0NBQXVDO0lBQzFFLEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBMEM7UUFDekQsTUFBTSxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWhDLDhEQUE4RDtRQUM5RCxNQUFNLENBQUMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUV6RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sV0FBVyxHQUE4QyxFQUFFLENBQUM7UUFFbEUsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUN6RixtQ0FBbUM7UUFDbkMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRXRCLEtBQUssTUFBTSxJQUFJLElBQUksY0FBYyxFQUFFO1lBQ2pDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1RCxJQUFJLFVBQWlDLENBQUM7WUFDdEMsSUFBSSxTQUFTLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRTtnQkFDcEMsVUFBVSxHQUFHLE1BQU0sb0RBQXNDLENBQ3ZELElBQUksRUFDSixTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksRUFDMUIsSUFBSSxDQUFDLFNB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IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gdHNsaW50OmRpc2FibGU6bm8tZ2xvYmFsLXRzbGludC1kaXNhYmxlIG5vLWFueVxuaW1wb3J0IHsgdGVybWluYWwgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBBcmd1bWVudHMsIFN1YkNvbW1hbmREZXNjcmlwdGlvbiB9IGZyb20gJy4uL21vZGVscy9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgU2NoZW1hdGljQ29tbWFuZCB9IGZyb20gJy4uL21vZGVscy9zY2hlbWF0aWMtY29tbWFuZCc7XG5pbXBvcnQgeyBwYXJzZUpzb25TY2hlbWFUb1N1YkNvbW1hbmREZXNjcmlwdGlvbiB9IGZyb20gJy4uL3V0aWxpdGllcy9qc29uLXNjaGVtYSc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgR2VuZXJhdGVDb21tYW5kU2NoZW1hIH0gZnJvbSAnLi9nZW5lcmF0ZSc7XG5cbmV4cG9ydCBjbGFzcyBHZW5lcmF0ZUNvbW1hbmQgZXh0ZW5kcyBTY2hlbWF0aWNDb21tYW5kPEdlbmVyYXRlQ29tbWFuZFNjaGVtYT4ge1xuICBhc3luYyBpbml0aWFsaXplKG9wdGlvbnM6IEdlbmVyYXRlQ29tbWFuZFNjaGVtYSAmIEFyZ3VtZW50cykge1xuICAgIGF3YWl0IHN1cGVyLmluaXRpYWxpemUob3B0aW9ucyk7XG5cbiAgICAvLyBGaWxsIHVwIHRoZSBzY2hlbWF0aWNzIHByb3BlcnR5IG9mIHRoZSBjb21tYW5kIGRlc2NyaXB0aW9uLlxuICAgIGNvbnN0IFtjb2xsZWN0aW9uTmFtZSwgc2NoZW1hdGljTmFtZV0gPSB0aGlzLnBhcnNlU2NoZW1hdGljSW5mbyhvcHRpb25zKTtcblxuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSB0aGlzLmdldENvbGxlY3Rpb24oY29sbGVjdGlvbk5hbWUpO1xuICAgIGNvbnN0IHN1YmNvbW1hbmRzOiB7IFtuYW1lOiBzdHJpbmddOiBTdWJDb21tYW5kRGVzY3JpcHRpb24gfSA9IHt9O1xuXG4gICAgY29uc3Qgc2NoZW1hdGljTmFtZXMgPSBzY2hlbWF0aWNOYW1lID8gW3NjaGVtYXRpY05hbWVdIDogY29sbGVjdGlvbi5saXN0U2NoZW1hdGljTmFtZXMoKTtcbiAgICAvLyBTb3J0IGFzIGEgY291cnRlc3kgZm9yIHRoZSB1c2VyLlxuICAgIHNjaGVtYXRpY05hbWVzLnNvcnQoKTtcblxuICAgIGZvciAoY29uc3QgbmFtZSBvZiBzY2hlbWF0aWNOYW1lcykge1xuICAgICAgY29uc3Qgc2NoZW1hdGljID0gdGhpcy5nZXRTY2hlbWF0aWMoY29sbGVjdGlvbiwgbmFtZSwgdHJ1ZSk7XG4gICAgICBsZXQgc3ViY29tbWFuZDogU3ViQ29tbWFuZERlc2NyaXB0aW9uO1xuICAgICAgaWYgKHNjaGVtYXRpYy5kZXNjcmlwdGlvbi5zY2hlbWFKc29uKSB7XG4gICAgICAgIHN1YmNvbW1hbmQgPSBhd2FpdCBwYXJzZUpzb25TY2hlbWFUb1N1YkNvbW1hbmREZXNjcmlwdGlvbihcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIHNjaGVtYXRpYy5kZXNjcmlwdGlvbi5wYXRoLFxuICAgICAgICAgIHRoaXMuX3dvcmtmbG93LnJlZ2lzdHJ5LFxuICAgICAgICAgIHNjaGVtYXRpYy5kZXNjcmlwdGlvbi5zY2hlbWFKc29uLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmdldERlZmF1bHRTY2hlbWF0aWNDb2xsZWN0aW9uKCkgPT0gY29sbGVjdGlvbk5hbWUpIHtcbiAgICAgICAgc3ViY29tbWFuZHNbbmFtZV0gPSBzdWJjb21tYW5kO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3ViY29tbWFuZHNbYCR7Y29sbGVjdGlvbk5hbWV9OiR7bmFtZX1gXSA9IHN1YmNvbW1hbmQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5kZXNjcmlwdGlvbi5vcHRpb25zLmZvckVhY2gob3B0aW9uID0+IHtcbiAgICAgIGlmIChvcHRpb24ubmFtZSA9PSAnc2NoZW1hdGljJykge1xuICAgICAgICBvcHRpb24uc3ViY29tbWFuZHMgPSBzdWJjb21tYW5kcztcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBydW4ob3B0aW9uczogR2VuZXJhdGVDb21tYW5kU2NoZW1hICYgQXJndW1lbnRzKSB7XG4gICAgY29uc3QgW2NvbGxlY3Rpb25OYW1lLCBzY2hlbWF0aWNOYW1lXSA9IHRoaXMucGFyc2VTY2hlbWF0aWNJbmZvKG9wdGlvbnMpO1xuXG4gICAgaWYgKCFzY2hlbWF0aWNOYW1lIHx8ICFjb2xsZWN0aW9uTmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXMucHJpbnRIZWxwKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnJ1blNjaGVtYXRpYyh7XG4gICAgICBjb2xsZWN0aW9uTmFtZSxcbiAgICAgIHNjaGVtYXRpY05hbWUsXG4gICAgICBzY2hlbWF0aWNPcHRpb25zOiBvcHRpb25zWyctLSddIHx8IFtdLFxuICAgICAgZGVidWc6ICEhb3B0aW9ucy5kZWJ1ZyB8fCBmYWxzZSxcbiAgICAgIGRyeVJ1bjogISFvcHRpb25zLmRyeVJ1biB8fCBmYWxzZSxcbiAgICAgIGZvcmNlOiAhIW9wdGlvbnMuZm9yY2UgfHwgZmFsc2UsXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHBhcnNlU2NoZW1hdGljSW5mbyhvcHRpb25zOiB7IHNjaGVtYXRpYz86IHN0cmluZyB9KTogW3N0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkXSB7XG4gICAgbGV0IGNvbGxlY3Rpb25OYW1lID0gdGhpcy5nZXREZWZhdWx0U2NoZW1hdGljQ29sbGVjdGlvbigpO1xuXG4gICAgbGV0IHNjaGVtYXRpY05hbWUgPSBvcHRpb25zLnNjaGVtYXRpYztcblxuICAgIGlmIChzY2hlbWF0aWNOYW1lKSB7XG4gICAgICBpZiAoc2NoZW1hdGljTmFtZS5pbmNsdWRlcygnOicpKSB7XG4gICAgICAgIFtjb2xsZWN0aW9uTmFtZSwgc2NoZW1hdGljTmFtZV0gPSBzY2hlbWF0aWNOYW1lLnNwbGl0KCc6JywgMik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFtjb2xsZWN0aW9uTmFtZSwgc2NoZW1hdGljTmFtZV07XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcHJpbnRIZWxwKG9wdGlvbnM6IEdlbmVyYXRlQ29tbWFuZFNjaGVtYSAmIEFyZ3VtZW50cykge1xuICAgIGF3YWl0IHN1cGVyLnByaW50SGVscChvcHRpb25zKTtcblxuICAgIHRoaXMubG9nZ2VyLmluZm8oJycpO1xuICAgIC8vIEZpbmQgdGhlIGdlbmVyYXRlIHN1YmNvbW1hbmQuXG4gICAgY29uc3Qgc3ViY29tbWFuZCA9IHRoaXMuZGVzY3JpcHRpb24ub3B0aW9ucy5maWx0ZXIoeCA9PiB4LnN1YmNvbW1hbmRzKVswXTtcbiAgICBpZiAoT2JqZWN0LmtleXMoKHN1YmNvbW1hbmQgJiYgc3ViY29tbWFuZC5zdWJjb21tYW5kcykgfHwge30pLmxlbmd0aCA9PSAxKSB7XG4gICAgICB0aGlzLmxvZ2dlci5pbmZvKGBcXG5UbyBzZWUgaGVscCBmb3IgYSBzY2hlbWF0aWMgcnVuOmApO1xuICAgICAgdGhpcy5sb2dnZXIuaW5mbyh0ZXJtaW5hbC5jeWFuKGAgIG5nIGdlbmVyYXRlIDxzY2hlbWF0aWM+IC0taGVscGApKTtcbiAgICB9XG5cbiAgICByZXR1cm4gMDtcbiAgfVxufVxuIl19