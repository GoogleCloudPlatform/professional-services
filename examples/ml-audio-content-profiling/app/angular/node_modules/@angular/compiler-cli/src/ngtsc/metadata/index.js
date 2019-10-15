/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/metadata", ["require", "exports", "@angular/compiler-cli/src/ngtsc/metadata/src/reflector", "@angular/compiler-cli/src/ngtsc/metadata/src/resolver"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <reference types="node" />
    var reflector_1 = require("@angular/compiler-cli/src/ngtsc/metadata/src/reflector");
    exports.TypeScriptReflectionHost = reflector_1.TypeScriptReflectionHost;
    exports.filterToMembersWithDecorator = reflector_1.filterToMembersWithDecorator;
    exports.findMember = reflector_1.findMember;
    exports.reflectObjectLiteral = reflector_1.reflectObjectLiteral;
    exports.reflectTypeEntityToDeclaration = reflector_1.reflectTypeEntityToDeclaration;
    var resolver_1 = require("@angular/compiler-cli/src/ngtsc/metadata/src/resolver");
    exports.AbsoluteReference = resolver_1.AbsoluteReference;
    exports.EnumValue = resolver_1.EnumValue;
    exports.ImportMode = resolver_1.ImportMode;
    exports.Reference = resolver_1.Reference;
    exports.ResolvedReference = resolver_1.ResolvedReference;
    exports.isDynamicValue = resolver_1.isDynamicValue;
    exports.staticallyResolve = resolver_1.staticallyResolve;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL21ldGFkYXRhL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsOEJBQThCO0lBRTlCLG9GQUF5SjtJQUFqSiwrQ0FBQSx3QkFBd0IsQ0FBQTtJQUFFLG1EQUFBLDRCQUE0QixDQUFBO0lBQUUsaUNBQUEsVUFBVSxDQUFBO0lBQUUsMkNBQUEsb0JBQW9CLENBQUE7SUFBRSxxREFBQSw4QkFBOEIsQ0FBQTtJQUNoSSxrRkFBd0o7SUFBaEosdUNBQUEsaUJBQWlCLENBQUE7SUFBRSwrQkFBQSxTQUFTLENBQUE7SUFBRSxnQ0FBQSxVQUFVLENBQUE7SUFBRSwrQkFBQSxTQUFTLENBQUE7SUFBRSx1Q0FBQSxpQkFBaUIsQ0FBQTtJQUFpQixvQ0FBQSxjQUFjLENBQUE7SUFBRSx1Q0FBQSxpQkFBaUIsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJub2RlXCIgLz5cblxuZXhwb3J0IHtUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3QsIGZpbHRlclRvTWVtYmVyc1dpdGhEZWNvcmF0b3IsIGZpbmRNZW1iZXIsIHJlZmxlY3RPYmplY3RMaXRlcmFsLCByZWZsZWN0VHlwZUVudGl0eVRvRGVjbGFyYXRpb259IGZyb20gJy4vc3JjL3JlZmxlY3Rvcic7XG5leHBvcnQge0Fic29sdXRlUmVmZXJlbmNlLCBFbnVtVmFsdWUsIEltcG9ydE1vZGUsIFJlZmVyZW5jZSwgUmVzb2x2ZWRSZWZlcmVuY2UsIFJlc29sdmVkVmFsdWUsIGlzRHluYW1pY1ZhbHVlLCBzdGF0aWNhbGx5UmVzb2x2ZX0gZnJvbSAnLi9zcmMvcmVzb2x2ZXInO1xuIl19