/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Component, Directive, NgModule, Pipe, ɵReflectionCapabilities as ReflectionCapabilities } from '@angular/core';
import { MetadataOverrider } from './metadata_overrider';
var reflection = new ReflectionCapabilities();
/**
 * Allows to override ivy metadata for tests (via the `TestBed`).
 */
var OverrideResolver = /** @class */ (function () {
    function OverrideResolver() {
        this.overrides = new Map();
        this.resolved = new Map();
    }
    OverrideResolver.prototype.setOverrides = function (overrides) {
        var _this = this;
        this.overrides.clear();
        overrides.forEach(function (_a) {
            var _b = tslib_1.__read(_a, 2), type = _b[0], override = _b[1];
            return _this.overrides.set(type, override);
        });
    };
    OverrideResolver.prototype.getAnnotation = function (type) {
        var _this = this;
        return reflection.annotations(type).find(function (a) { return a instanceof _this.type; }) || null;
    };
    OverrideResolver.prototype.resolve = function (type) {
        var resolved = this.resolved.get(type) || null;
        if (!resolved) {
            resolved = this.getAnnotation(type);
            if (resolved) {
                var override = this.overrides.get(type);
                if (override) {
                    var overrider = new MetadataOverrider();
                    resolved = overrider.overrideMetadata(this.type, resolved, override);
                }
            }
            this.resolved.set(type, resolved);
        }
        return resolved;
    };
    return OverrideResolver;
}());
var DirectiveResolver = /** @class */ (function (_super) {
    tslib_1.__extends(DirectiveResolver, _super);
    function DirectiveResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DirectiveResolver.prototype, "type", {
        get: function () { return Directive; },
        enumerable: true,
        configurable: true
    });
    return DirectiveResolver;
}(OverrideResolver));
export { DirectiveResolver };
var ComponentResolver = /** @class */ (function (_super) {
    tslib_1.__extends(ComponentResolver, _super);
    function ComponentResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ComponentResolver.prototype, "type", {
        get: function () { return Component; },
        enumerable: true,
        configurable: true
    });
    return ComponentResolver;
}(OverrideResolver));
export { ComponentResolver };
var PipeResolver = /** @class */ (function (_super) {
    tslib_1.__extends(PipeResolver, _super);
    function PipeResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(PipeResolver.prototype, "type", {
        get: function () { return Pipe; },
        enumerable: true,
        configurable: true
    });
    return PipeResolver;
}(OverrideResolver));
export { PipeResolver };
var NgModuleResolver = /** @class */ (function (_super) {
    tslib_1.__extends(NgModuleResolver, _super);
    function NgModuleResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(NgModuleResolver.prototype, "type", {
        get: function () { return NgModule; },
        enumerable: true,
        configurable: true
    });
    return NgModuleResolver;
}(OverrideResolver));
export { NgModuleResolver };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9yZXNvbHZlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQVEsdUJBQXVCLElBQUksc0JBQXNCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHNUgsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFdkQsSUFBTSxVQUFVLEdBQUcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO0FBT2hEOztHQUVHO0FBQ0g7SUFBQTtRQUNVLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBa0MsQ0FBQztRQUN0RCxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7SUE4QmxELENBQUM7SUExQkMsdUNBQVksR0FBWixVQUFhLFNBQWtEO1FBQS9ELGlCQUdDO1FBRkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2QixTQUFTLENBQUMsT0FBTyxDQUFDLFVBQUMsRUFBZ0I7Z0JBQWhCLDBCQUFnQixFQUFmLFlBQUksRUFBRSxnQkFBUTtZQUFNLE9BQUEsS0FBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztRQUFsQyxDQUFrQyxDQUFDLENBQUM7SUFDOUUsQ0FBQztJQUVELHdDQUFhLEdBQWIsVUFBYyxJQUFlO1FBQTdCLGlCQUVDO1FBREMsT0FBTyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsWUFBWSxLQUFJLENBQUMsSUFBSSxFQUF0QixDQUFzQixDQUFDLElBQUksSUFBSSxDQUFDO0lBQ2hGLENBQUM7SUFFRCxrQ0FBTyxHQUFQLFVBQVEsSUFBZTtRQUNyQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUM7UUFFL0MsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNiLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLElBQUksUUFBUSxFQUFFO2dCQUNaLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxQyxJQUFJLFFBQVEsRUFBRTtvQkFDWixJQUFNLFNBQVMsR0FBRyxJQUFJLGlCQUFpQixFQUFFLENBQUM7b0JBQzFDLFFBQVEsR0FBRyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7aUJBQ3RFO2FBQ0Y7WUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDbkM7UUFFRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQ0gsdUJBQUM7QUFBRCxDQUFDLEFBaENELElBZ0NDO0FBR0Q7SUFBdUMsNkNBQTJCO0lBQWxFOztJQUVBLENBQUM7SUFEQyxzQkFBSSxtQ0FBSTthQUFSLGNBQWEsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUNsQyx3QkFBQztBQUFELENBQUMsQUFGRCxDQUF1QyxnQkFBZ0IsR0FFdEQ7O0FBRUQ7SUFBdUMsNkNBQTJCO0lBQWxFOztJQUVBLENBQUM7SUFEQyxzQkFBSSxtQ0FBSTthQUFSLGNBQWEsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUNsQyx3QkFBQztBQUFELENBQUMsQUFGRCxDQUF1QyxnQkFBZ0IsR0FFdEQ7O0FBRUQ7SUFBa0Msd0NBQXNCO0lBQXhEOztJQUVBLENBQUM7SUFEQyxzQkFBSSw4QkFBSTthQUFSLGNBQWEsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUM3QixtQkFBQztBQUFELENBQUMsQUFGRCxDQUFrQyxnQkFBZ0IsR0FFakQ7O0FBRUQ7SUFBc0MsNENBQTBCO0lBQWhFOztJQUVBLENBQUM7SUFEQyxzQkFBSSxrQ0FBSTthQUFSLGNBQWEsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUNqQyx1QkFBQztBQUFELENBQUMsQUFGRCxDQUFzQyxnQkFBZ0IsR0FFckQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50LCBEaXJlY3RpdmUsIE5nTW9kdWxlLCBQaXBlLCBUeXBlLCDJtVJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgYXMgUmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGVyfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlcic7XG5cbmNvbnN0IHJlZmxlY3Rpb24gPSBuZXcgUmVmbGVjdGlvbkNhcGFiaWxpdGllcygpO1xuXG4vKipcbiAqIEJhc2UgaW50ZXJmYWNlIHRvIHJlc29sdmUgYEBDb21wb25lbnRgLCBgQERpcmVjdGl2ZWAsIGBAUGlwZWAgYW5kIGBATmdNb2R1bGVgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVyPFQ+IHsgcmVzb2x2ZSh0eXBlOiBUeXBlPGFueT4pOiBUfG51bGw7IH1cblxuLyoqXG4gKiBBbGxvd3MgdG8gb3ZlcnJpZGUgaXZ5IG1ldGFkYXRhIGZvciB0ZXN0cyAodmlhIHRoZSBgVGVzdEJlZGApLlxuICovXG5hYnN0cmFjdCBjbGFzcyBPdmVycmlkZVJlc29sdmVyPFQ+IGltcGxlbWVudHMgUmVzb2x2ZXI8VD4ge1xuICBwcml2YXRlIG92ZXJyaWRlcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPFQ+PigpO1xuICBwcml2YXRlIHJlc29sdmVkID0gbmV3IE1hcDxUeXBlPGFueT4sIFR8bnVsbD4oKTtcblxuICBhYnN0cmFjdCBnZXQgdHlwZSgpOiBhbnk7XG5cbiAgc2V0T3ZlcnJpZGVzKG92ZXJyaWRlczogQXJyYXk8W1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxUPl0+KSB7XG4gICAgdGhpcy5vdmVycmlkZXMuY2xlYXIoKTtcbiAgICBvdmVycmlkZXMuZm9yRWFjaCgoW3R5cGUsIG92ZXJyaWRlXSkgPT4gdGhpcy5vdmVycmlkZXMuc2V0KHR5cGUsIG92ZXJyaWRlKSk7XG4gIH1cblxuICBnZXRBbm5vdGF0aW9uKHR5cGU6IFR5cGU8YW55Pik6IFR8bnVsbCB7XG4gICAgcmV0dXJuIHJlZmxlY3Rpb24uYW5ub3RhdGlvbnModHlwZSkuZmluZChhID0+IGEgaW5zdGFuY2VvZiB0aGlzLnR5cGUpIHx8IG51bGw7XG4gIH1cblxuICByZXNvbHZlKHR5cGU6IFR5cGU8YW55Pik6IFR8bnVsbCB7XG4gICAgbGV0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlZC5nZXQodHlwZSkgfHwgbnVsbDtcblxuICAgIGlmICghcmVzb2x2ZWQpIHtcbiAgICAgIHJlc29sdmVkID0gdGhpcy5nZXRBbm5vdGF0aW9uKHR5cGUpO1xuICAgICAgaWYgKHJlc29sdmVkKSB7XG4gICAgICAgIGNvbnN0IG92ZXJyaWRlID0gdGhpcy5vdmVycmlkZXMuZ2V0KHR5cGUpO1xuICAgICAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgICBjb25zdCBvdmVycmlkZXIgPSBuZXcgTWV0YWRhdGFPdmVycmlkZXIoKTtcbiAgICAgICAgICByZXNvbHZlZCA9IG92ZXJyaWRlci5vdmVycmlkZU1ldGFkYXRhKHRoaXMudHlwZSwgcmVzb2x2ZWQsIG92ZXJyaWRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5yZXNvbHZlZC5zZXQodHlwZSwgcmVzb2x2ZWQpO1xuICAgIH1cblxuICAgIHJldHVybiByZXNvbHZlZDtcbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBEaXJlY3RpdmVSZXNvbHZlciBleHRlbmRzIE92ZXJyaWRlUmVzb2x2ZXI8RGlyZWN0aXZlPiB7XG4gIGdldCB0eXBlKCkgeyByZXR1cm4gRGlyZWN0aXZlOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZXNvbHZlciBleHRlbmRzIE92ZXJyaWRlUmVzb2x2ZXI8Q29tcG9uZW50PiB7XG4gIGdldCB0eXBlKCkgeyByZXR1cm4gQ29tcG9uZW50OyB9XG59XG5cbmV4cG9ydCBjbGFzcyBQaXBlUmVzb2x2ZXIgZXh0ZW5kcyBPdmVycmlkZVJlc29sdmVyPFBpcGU+IHtcbiAgZ2V0IHR5cGUoKSB7IHJldHVybiBQaXBlOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBOZ01vZHVsZVJlc29sdmVyIGV4dGVuZHMgT3ZlcnJpZGVSZXNvbHZlcjxOZ01vZHVsZT4ge1xuICBnZXQgdHlwZSgpIHsgcmV0dXJuIE5nTW9kdWxlOyB9XG59XG4iXX0=