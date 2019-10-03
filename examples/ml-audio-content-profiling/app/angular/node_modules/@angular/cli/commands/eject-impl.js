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
const command_1 = require("../models/command");
class EjectCommand extends command_1.Command {
    async run() {
        this.logger.error(core_1.tags.stripIndents `
      The 'eject' command has been disabled and will be removed completely in 8.0.
      The new configuration format provides increased flexibility to modify the
      configuration of your workspace without ejecting.

      There are several projects that can be used in conjuction with the new
      configuration format that provide the benefits of ejecting without the maintenance
      overhead.  One such project is ngx-build-plus found here:
      https://github.com/manfredsteyer/ngx-build-plus
    `);
        return 1;
    }
}
exports.EjectCommand = EjectCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWplY3QtaW1wbC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhci9jbGkvY29tbWFuZHMvZWplY3QtaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtDQUE0QztBQUM1QywrQ0FBNEM7QUFHNUMsTUFBYSxZQUFhLFNBQVEsaUJBQTJCO0lBQzNELEtBQUssQ0FBQyxHQUFHO1FBQ1AsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBSSxDQUFDLFlBQVksQ0FBQTs7Ozs7Ozs7O0tBU2xDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxDQUFDO0lBQ1gsQ0FBQztDQUNGO0FBZkQsb0NBZUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IHRhZ3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBDb21tYW5kIH0gZnJvbSAnLi4vbW9kZWxzL2NvbW1hbmQnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIEVqZWN0Q29tbWFuZFNjaGVtYSB9IGZyb20gJy4vZWplY3QnO1xuXG5leHBvcnQgY2xhc3MgRWplY3RDb21tYW5kIGV4dGVuZHMgQ29tbWFuZDxFamVjdENvbW1hbmRTY2hlbWE+IHtcbiAgYXN5bmMgcnVuKCkge1xuICAgIHRoaXMubG9nZ2VyLmVycm9yKHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgICAgVGhlICdlamVjdCcgY29tbWFuZCBoYXMgYmVlbiBkaXNhYmxlZCBhbmQgd2lsbCBiZSByZW1vdmVkIGNvbXBsZXRlbHkgaW4gOC4wLlxuICAgICAgVGhlIG5ldyBjb25maWd1cmF0aW9uIGZvcm1hdCBwcm92aWRlcyBpbmNyZWFzZWQgZmxleGliaWxpdHkgdG8gbW9kaWZ5IHRoZVxuICAgICAgY29uZmlndXJhdGlvbiBvZiB5b3VyIHdvcmtzcGFjZSB3aXRob3V0IGVqZWN0aW5nLlxuXG4gICAgICBUaGVyZSBhcmUgc2V2ZXJhbCBwcm9qZWN0cyB0aGF0IGNhbiBiZSB1c2VkIGluIGNvbmp1Y3Rpb24gd2l0aCB0aGUgbmV3XG4gICAgICBjb25maWd1cmF0aW9uIGZvcm1hdCB0aGF0IHByb3ZpZGUgdGhlIGJlbmVmaXRzIG9mIGVqZWN0aW5nIHdpdGhvdXQgdGhlIG1haW50ZW5hbmNlXG4gICAgICBvdmVyaGVhZC4gIE9uZSBzdWNoIHByb2plY3QgaXMgbmd4LWJ1aWxkLXBsdXMgZm91bmQgaGVyZTpcbiAgICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9tYW5mcmVkc3RleWVyL25neC1idWlsZC1wbHVzXG4gICAgYCk7XG5cbiAgICByZXR1cm4gMTtcbiAgfVxufVxuIl19