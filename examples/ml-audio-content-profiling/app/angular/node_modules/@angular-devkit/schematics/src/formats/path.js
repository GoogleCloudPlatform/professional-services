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
exports.pathFormat = {
    name: 'path',
    formatter: {
        async: false,
        validate: (path) => {
            // Check path is normalized already.
            return path === core_1.normalize(path);
            // TODO: check if path is valid (is that just checking if it's normalized?)
            // TODO: check path is from root of schematics even if passed absolute
            // TODO: error out if path is outside of host
        },
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvZm9ybWF0cy9wYXRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0NBQXlEO0FBRzVDLFFBQUEsVUFBVSxHQUF3QjtJQUM3QyxJQUFJLEVBQUUsTUFBTTtJQUNaLFNBQVMsRUFBRTtRQUNULEtBQUssRUFBRSxLQUFLO1FBQ1osUUFBUSxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDekIsb0NBQW9DO1lBQ3BDLE9BQU8sSUFBSSxLQUFLLGdCQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEMsMkVBQTJFO1lBQzNFLHNFQUFzRTtZQUN0RSw2Q0FBNkM7UUFDL0MsQ0FBQztLQUNGO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgbm9ybWFsaXplLCBzY2hlbWEgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5cblxuZXhwb3J0IGNvbnN0IHBhdGhGb3JtYXQ6IHNjaGVtYS5TY2hlbWFGb3JtYXQgPSB7XG4gIG5hbWU6ICdwYXRoJyxcbiAgZm9ybWF0dGVyOiB7XG4gICAgYXN5bmM6IGZhbHNlLFxuICAgIHZhbGlkYXRlOiAocGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICAvLyBDaGVjayBwYXRoIGlzIG5vcm1hbGl6ZWQgYWxyZWFkeS5cbiAgICAgIHJldHVybiBwYXRoID09PSBub3JtYWxpemUocGF0aCk7XG4gICAgICAvLyBUT0RPOiBjaGVjayBpZiBwYXRoIGlzIHZhbGlkIChpcyB0aGF0IGp1c3QgY2hlY2tpbmcgaWYgaXQncyBub3JtYWxpemVkPylcbiAgICAgIC8vIFRPRE86IGNoZWNrIHBhdGggaXMgZnJvbSByb290IG9mIHNjaGVtYXRpY3MgZXZlbiBpZiBwYXNzZWQgYWJzb2x1dGVcbiAgICAgIC8vIFRPRE86IGVycm9yIG91dCBpZiBwYXRoIGlzIG91dHNpZGUgb2YgaG9zdFxuICAgIH0sXG4gIH0sXG59O1xuIl19