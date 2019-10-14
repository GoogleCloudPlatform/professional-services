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
function default_1() {
    return (tree, context) => {
        let content = tree.read('/migrations');
        // Append the information to migration file. We then verify the order of execution.
        if (!content) {
            tree.create('/migrations', '[]');
            content = tree.read('/migrations');
            if (!content) {
                throw new schematics_1.SchematicsException();
            }
        }
        const json = JSON.parse(content.toString('utf-8'));
        json.push(context.schematic.description.name);
        tree.overwrite('/migrations', JSON.stringify(json));
        return tree;
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidDEuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL3NjaGVtYXRpY3MvdXBkYXRlL21pZ3JhdGUvdGVzdC90MS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILDJEQUF1RTtBQUV2RTtJQUNJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUU7UUFDckIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUV2QyxtRkFBbUY7UUFDbkYsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNWLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRW5DLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ1YsTUFBTSxJQUFJLGdDQUFtQixFQUFFLENBQUM7YUFDbkM7U0FDSjtRQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFOUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRXBELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUMsQ0FBQztBQUNOLENBQUM7QUFyQkQsNEJBcUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgUnVsZSwgU2NoZW1hdGljc0V4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gICAgcmV0dXJuICh0cmVlLCBjb250ZXh0KSA9PiB7XG4gICAgICAgIGxldCBjb250ZW50ID0gdHJlZS5yZWFkKCcvbWlncmF0aW9ucycpO1xuXG4gICAgICAgIC8vIEFwcGVuZCB0aGUgaW5mb3JtYXRpb24gdG8gbWlncmF0aW9uIGZpbGUuIFdlIHRoZW4gdmVyaWZ5IHRoZSBvcmRlciBvZiBleGVjdXRpb24uXG4gICAgICAgIGlmICghY29udGVudCkge1xuICAgICAgICAgICAgdHJlZS5jcmVhdGUoJy9taWdyYXRpb25zJywgJ1tdJyk7XG4gICAgICAgICAgICBjb250ZW50ID0gdHJlZS5yZWFkKCcvbWlncmF0aW9ucycpO1xuXG4gICAgICAgICAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoY29udGVudC50b1N0cmluZygndXRmLTgnKSk7XG4gICAgICAgIGpzb24ucHVzaChjb250ZXh0LnNjaGVtYXRpYy5kZXNjcmlwdGlvbi5uYW1lKTtcblxuICAgICAgICB0cmVlLm92ZXJ3cml0ZSgnL21pZ3JhdGlvbnMnLCBKU09OLnN0cmluZ2lmeShqc29uKSk7XG5cbiAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgfTtcbn1cbiJdfQ==