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
        define("@angular/compiler-cli/src/ngtsc/annotations", ["require", "exports", "@angular/compiler-cli/src/ngtsc/annotations/src/base_def", "@angular/compiler-cli/src/ngtsc/annotations/src/component", "@angular/compiler-cli/src/ngtsc/annotations/src/directive", "@angular/compiler-cli/src/ngtsc/annotations/src/injectable", "@angular/compiler-cli/src/ngtsc/annotations/src/ng_module", "@angular/compiler-cli/src/ngtsc/annotations/src/pipe", "@angular/compiler-cli/src/ngtsc/annotations/src/selector_scope"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var base_def_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/base_def");
    exports.BaseDefDecoratorHandler = base_def_1.BaseDefDecoratorHandler;
    var component_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/component");
    exports.ComponentDecoratorHandler = component_1.ComponentDecoratorHandler;
    var directive_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/directive");
    exports.DirectiveDecoratorHandler = directive_1.DirectiveDecoratorHandler;
    var injectable_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/injectable");
    exports.InjectableDecoratorHandler = injectable_1.InjectableDecoratorHandler;
    var ng_module_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/ng_module");
    exports.NgModuleDecoratorHandler = ng_module_1.NgModuleDecoratorHandler;
    var pipe_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/pipe");
    exports.PipeDecoratorHandler = pipe_1.PipeDecoratorHandler;
    var selector_scope_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/selector_scope");
    exports.SelectorScopeRegistry = selector_scope_1.SelectorScopeRegistry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL2Fubm90YXRpb25zL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBS0gscUZBQXVEO0lBQS9DLDZDQUFBLHVCQUF1QixDQUFBO0lBQy9CLHVGQUEwRDtJQUFsRCxnREFBQSx5QkFBeUIsQ0FBQTtJQUNqQyx1RkFBMEQ7SUFBbEQsZ0RBQUEseUJBQXlCLENBQUE7SUFDakMseUZBQTREO0lBQXBELGtEQUFBLDBCQUEwQixDQUFBO0lBQ2xDLHVGQUF5RDtJQUFqRCwrQ0FBQSx3QkFBd0IsQ0FBQTtJQUNoQyw2RUFBZ0Q7SUFBeEMsc0NBQUEsb0JBQW9CLENBQUE7SUFDNUIsaUdBQTZFO0lBQW5ELGlEQUFBLHFCQUFxQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLy8gPHJlZmVyZW5jZSB0eXBlcz1cIm5vZGVcIiAvPlxuXG5leHBvcnQge1Jlc291cmNlTG9hZGVyfSBmcm9tICcuL3NyYy9hcGknO1xuZXhwb3J0IHtCYXNlRGVmRGVjb3JhdG9ySGFuZGxlcn0gZnJvbSAnLi9zcmMvYmFzZV9kZWYnO1xuZXhwb3J0IHtDb21wb25lbnREZWNvcmF0b3JIYW5kbGVyfSBmcm9tICcuL3NyYy9jb21wb25lbnQnO1xuZXhwb3J0IHtEaXJlY3RpdmVEZWNvcmF0b3JIYW5kbGVyfSBmcm9tICcuL3NyYy9kaXJlY3RpdmUnO1xuZXhwb3J0IHtJbmplY3RhYmxlRGVjb3JhdG9ySGFuZGxlcn0gZnJvbSAnLi9zcmMvaW5qZWN0YWJsZSc7XG5leHBvcnQge05nTW9kdWxlRGVjb3JhdG9ySGFuZGxlcn0gZnJvbSAnLi9zcmMvbmdfbW9kdWxlJztcbmV4cG9ydCB7UGlwZURlY29yYXRvckhhbmRsZXJ9IGZyb20gJy4vc3JjL3BpcGUnO1xuZXhwb3J0IHtDb21waWxhdGlvblNjb3BlLCBTZWxlY3RvclNjb3BlUmVnaXN0cnl9IGZyb20gJy4vc3JjL3NlbGVjdG9yX3Njb3BlJztcbiJdfQ==