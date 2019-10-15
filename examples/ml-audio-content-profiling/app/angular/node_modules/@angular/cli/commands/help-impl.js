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
const command_1 = require("../models/command");
class HelpCommand extends command_1.Command {
    async run() {
        this.logger.info(`Available Commands:`);
        for (const name of Object.keys(command_1.Command.commandMap)) {
            const cmd = command_1.Command.commandMap[name];
            if (cmd.hidden) {
                continue;
            }
            const aliasInfo = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
            this.logger.info(`  ${core_1.terminal.cyan(cmd.name)}${aliasInfo} ${cmd.description}`);
        }
        this.logger.info(`\nFor more detailed help run "ng [command name] --help"`);
    }
}
exports.HelpCommand = HelpCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscC1pbXBsLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyL2NsaS9jb21tYW5kcy9oZWxwLWltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FBZ0Q7QUFDaEQsK0NBQTRDO0FBRzVDLE1BQWEsV0FBWSxTQUFRLGlCQUEwQjtJQUN6RCxLQUFLLENBQUMsR0FBRztRQUNQLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFFeEMsS0FBSyxNQUFNLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDbEQsTUFBTSxHQUFHLEdBQUcsaUJBQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFckMsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFO2dCQUNkLFNBQVM7YUFDVjtZQUVELE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDL0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxlQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLElBQUksR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7U0FDakY7UUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO0lBQzlFLENBQUM7Q0FDRjtBQWhCRCxrQ0FnQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyB0ZXJtaW5hbCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IENvbW1hbmQgfSBmcm9tICcuLi9tb2RlbHMvY29tbWFuZCc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgSGVscENvbW1hbmRTY2hlbWEgfSBmcm9tICcuL2hlbHAnO1xuXG5leHBvcnQgY2xhc3MgSGVscENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kPEhlbHBDb21tYW5kU2NoZW1hPiB7XG4gIGFzeW5jIHJ1bigpIHtcbiAgICB0aGlzLmxvZ2dlci5pbmZvKGBBdmFpbGFibGUgQ29tbWFuZHM6YCk7XG5cbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXMoQ29tbWFuZC5jb21tYW5kTWFwKSkge1xuICAgICAgY29uc3QgY21kID0gQ29tbWFuZC5jb21tYW5kTWFwW25hbWVdO1xuXG4gICAgICBpZiAoY21kLmhpZGRlbikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYWxpYXNJbmZvID0gY21kLmFsaWFzZXMubGVuZ3RoID4gMCA/IGAgKCR7Y21kLmFsaWFzZXMuam9pbignLCAnKX0pYCA6ICcnO1xuICAgICAgdGhpcy5sb2dnZXIuaW5mbyhgICAke3Rlcm1pbmFsLmN5YW4oY21kLm5hbWUpfSR7YWxpYXNJbmZvfSAke2NtZC5kZXNjcmlwdGlvbn1gKTtcbiAgICB9XG4gICAgdGhpcy5sb2dnZXIuaW5mbyhgXFxuRm9yIG1vcmUgZGV0YWlsZWQgaGVscCBydW4gXCJuZyBbY29tbWFuZCBuYW1lXSAtLWhlbHBcImApO1xuICB9XG59XG4iXX0=