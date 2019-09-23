"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../models/command");
const opn = require('opn');
class DocCommand extends command_1.Command {
    async run(options) {
        let searchUrl = `https://angular.io/api?query=${options.keyword}`;
        if (options.search) {
            searchUrl = `https://www.google.com/search?q=site%3Aangular.io+${options.keyword}`;
        }
        return opn(searchUrl, {
            wait: false,
        });
    }
}
exports.DocCommand = DocCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jLWltcGwuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL2NvbW1hbmRzL2RvYy1pbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0NBQTRDO0FBSTVDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUUzQixNQUFhLFVBQVcsU0FBUSxpQkFBeUI7SUFDaEQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFxQztRQUNwRCxJQUFJLFNBQVMsR0FBRyxnQ0FBZ0MsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2xFLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRTtZQUNsQixTQUFTLEdBQUcscURBQXFELE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNwRjtRQUVELE9BQU8sR0FBRyxDQUFDLFNBQVMsRUFBRTtZQUNwQixJQUFJLEVBQUUsS0FBSztTQUNaLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQVhELGdDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBDb21tYW5kIH0gZnJvbSAnLi4vbW9kZWxzL2NvbW1hbmQnO1xuaW1wb3J0IHsgQXJndW1lbnRzIH0gZnJvbSAnLi4vbW9kZWxzL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgRG9jQ29tbWFuZFNjaGVtYSB9IGZyb20gJy4vZG9jJztcblxuY29uc3Qgb3BuID0gcmVxdWlyZSgnb3BuJyk7XG5cbmV4cG9ydCBjbGFzcyBEb2NDb21tYW5kIGV4dGVuZHMgQ29tbWFuZDxEb2NDb21tYW5kU2NoZW1hPiB7XG4gIHB1YmxpYyBhc3luYyBydW4ob3B0aW9uczogRG9jQ29tbWFuZFNjaGVtYSAmIEFyZ3VtZW50cykge1xuICAgIGxldCBzZWFyY2hVcmwgPSBgaHR0cHM6Ly9hbmd1bGFyLmlvL2FwaT9xdWVyeT0ke29wdGlvbnMua2V5d29yZH1gO1xuICAgIGlmIChvcHRpb25zLnNlYXJjaCkge1xuICAgICAgc2VhcmNoVXJsID0gYGh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vc2VhcmNoP3E9c2l0ZSUzQWFuZ3VsYXIuaW8rJHtvcHRpb25zLmtleXdvcmR9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gb3BuKHNlYXJjaFVybCwge1xuICAgICAgd2FpdDogZmFsc2UsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==