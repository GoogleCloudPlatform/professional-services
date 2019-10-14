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
        define("@angular/compiler-cli/src/ngtsc/diagnostics/src/error", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ts = require("typescript");
    var FatalDiagnosticError = /** @class */ (function () {
        function FatalDiagnosticError(code, node, message) {
            this.code = code;
            this.node = node;
            this.message = message;
            /**
             * @internal
             */
            this._isFatalDiagnosticError = true;
        }
        FatalDiagnosticError.prototype.toDiagnostic = function () {
            var node = ts.getOriginalNode(this.node);
            return {
                category: ts.DiagnosticCategory.Error,
                code: Number('-99' + this.code.valueOf()),
                file: ts.getOriginalNode(this.node).getSourceFile(),
                start: node.getStart(undefined, false),
                length: node.getWidth(),
                messageText: this.message,
            };
        };
        return FatalDiagnosticError;
    }());
    exports.FatalDiagnosticError = FatalDiagnosticError;
    function isFatalDiagnosticError(err) {
        return err._isFatalDiagnosticError === true;
    }
    exports.isFatalDiagnosticError = isFatalDiagnosticError;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL2RpYWdub3N0aWNzL3NyYy9lcnJvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILCtCQUFpQztJQUlqQztRQUNFLDhCQUFxQixJQUFlLEVBQVcsSUFBYSxFQUFXLE9BQWU7WUFBakUsU0FBSSxHQUFKLElBQUksQ0FBVztZQUFXLFNBQUksR0FBSixJQUFJLENBQVM7WUFBVyxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBRXRGOztlQUVHO1lBQ0gsNEJBQXVCLEdBQUcsSUFBSSxDQUFDO1FBTDBELENBQUM7UUFPMUYsMkNBQVksR0FBWjtZQUNFLElBQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNDLE9BQU87Z0JBQ0wsUUFBUSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLO2dCQUNyQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN6QyxJQUFJLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsYUFBYSxFQUFFO2dCQUNuRCxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDO2dCQUN0QyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDdkIsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPO2FBQzFCLENBQUM7UUFDSixDQUFDO1FBQ0gsMkJBQUM7SUFBRCxDQUFDLEFBbkJELElBbUJDO0lBbkJZLG9EQUFvQjtJQXFCakMsU0FBZ0Isc0JBQXNCLENBQUMsR0FBUTtRQUM3QyxPQUFPLEdBQUcsQ0FBQyx1QkFBdUIsS0FBSyxJQUFJLENBQUM7SUFDOUMsQ0FBQztJQUZELHdEQUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtFcnJvckNvZGV9IGZyb20gJy4vY29kZSc7XG5cbmV4cG9ydCBjbGFzcyBGYXRhbERpYWdub3N0aWNFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IGNvZGU6IEVycm9yQ29kZSwgcmVhZG9ubHkgbm9kZTogdHMuTm9kZSwgcmVhZG9ubHkgbWVzc2FnZTogc3RyaW5nKSB7fVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9pc0ZhdGFsRGlhZ25vc3RpY0Vycm9yID0gdHJ1ZTtcblxuICB0b0RpYWdub3N0aWMoKTogdHMuRGlhZ25vc3RpY1dpdGhMb2NhdGlvbiB7XG4gICAgY29uc3Qgbm9kZSA9IHRzLmdldE9yaWdpbmFsTm9kZSh0aGlzLm5vZGUpO1xuICAgIHJldHVybiB7XG4gICAgICBjYXRlZ29yeTogdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yLFxuICAgICAgY29kZTogTnVtYmVyKCctOTknICsgdGhpcy5jb2RlLnZhbHVlT2YoKSksXG4gICAgICBmaWxlOiB0cy5nZXRPcmlnaW5hbE5vZGUodGhpcy5ub2RlKS5nZXRTb3VyY2VGaWxlKCksXG4gICAgICBzdGFydDogbm9kZS5nZXRTdGFydCh1bmRlZmluZWQsIGZhbHNlKSxcbiAgICAgIGxlbmd0aDogbm9kZS5nZXRXaWR0aCgpLFxuICAgICAgbWVzc2FnZVRleHQ6IHRoaXMubWVzc2FnZSxcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ZhdGFsRGlhZ25vc3RpY0Vycm9yKGVycjogYW55KTogZXJyIGlzIEZhdGFsRGlhZ25vc3RpY0Vycm9yIHtcbiAgcmV0dXJuIGVyci5faXNGYXRhbERpYWdub3N0aWNFcnJvciA9PT0gdHJ1ZTtcbn1cbiJdfQ==