/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Component, Directive, NgModule, Pipe, ɵReflectionCapabilities as ReflectionCapabilities } from '@angular/core';
import { MetadataOverrider } from './metadata_overrider';
/** @type {?} */
const reflection = new ReflectionCapabilities();
/**
 * Base interface to resolve `\@Component`, `\@Directive`, `\@Pipe` and `\@NgModule`.
 * @record
 * @template T
 */
export function Resolver() { }
/** @type {?} */
Resolver.prototype.resolve;
/**
 * Allows to override ivy metadata for tests (via the `TestBed`).
 * @abstract
 * @template T
 */
class OverrideResolver {
    constructor() {
        this.overrides = new Map();
        this.resolved = new Map();
    }
    /**
     * @param {?} overrides
     * @return {?}
     */
    setOverrides(overrides) {
        this.overrides.clear();
        overrides.forEach(([type, override]) => this.overrides.set(type, override));
    }
    /**
     * @param {?} type
     * @return {?}
     */
    getAnnotation(type) {
        return reflection.annotations(type).find(a => a instanceof this.type) || null;
    }
    /**
     * @param {?} type
     * @return {?}
     */
    resolve(type) {
        /** @type {?} */
        let resolved = this.resolved.get(type) || null;
        if (!resolved) {
            resolved = this.getAnnotation(type);
            if (resolved) {
                /** @type {?} */
                const override = this.overrides.get(type);
                if (override) {
                    /** @type {?} */
                    const overrider = new MetadataOverrider();
                    resolved = overrider.overrideMetadata(this.type, resolved, override);
                }
            }
            this.resolved.set(type, resolved);
        }
        return resolved;
    }
}
if (false) {
    /** @type {?} */
    OverrideResolver.prototype.overrides;
    /** @type {?} */
    OverrideResolver.prototype.resolved;
    /**
     * @abstract
     * @return {?}
     */
    OverrideResolver.prototype.type = function () { };
}
export class DirectiveResolver extends OverrideResolver {
    /**
     * @return {?}
     */
    get type() { return Directive; }
}
export class ComponentResolver extends OverrideResolver {
    /**
     * @return {?}
     */
    get type() { return Component; }
}
export class PipeResolver extends OverrideResolver {
    /**
     * @return {?}
     */
    get type() { return Pipe; }
}
export class NgModuleResolver extends OverrideResolver {
    /**
     * @return {?}
     */
    get type() { return NgModule; }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9yZXNvbHZlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFRLHVCQUF1QixJQUFJLHNCQUFzQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRzVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDOztBQUV2RCxNQUFNLFVBQVUsR0FBRyxJQUFJLHNCQUFzQixFQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBVWhELE1BQWUsZ0JBQWdCOzt5QkFDVCxJQUFJLEdBQUcsRUFBa0M7d0JBQzFDLElBQUksR0FBRyxFQUFxQjs7Ozs7O0lBSS9DLFlBQVksQ0FBQyxTQUFrRDtRQUM3RCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZCLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7S0FDN0U7Ozs7O0lBRUQsYUFBYSxDQUFDLElBQWU7UUFDM0IsT0FBTyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDO0tBQy9FOzs7OztJQUVELE9BQU8sQ0FBQyxJQUFlOztRQUNyQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUM7UUFFL0MsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNiLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLElBQUksUUFBUSxFQUFFOztnQkFDWixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxRQUFRLEVBQUU7O29CQUNaLE1BQU0sU0FBUyxHQUFHLElBQUksaUJBQWlCLEVBQUUsQ0FBQztvQkFDMUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztpQkFDdEU7YUFDRjtZQUNELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztTQUNuQztRQUVELE9BQU8sUUFBUSxDQUFDO0tBQ2pCO0NBQ0Y7Ozs7Ozs7Ozs7OztBQUdELE1BQU0sT0FBTyxpQkFBa0IsU0FBUSxnQkFBMkI7Ozs7SUFDaEUsSUFBSSxJQUFJLEtBQUssT0FBTyxTQUFTLENBQUMsRUFBRTtDQUNqQztBQUVELE1BQU0sT0FBTyxpQkFBa0IsU0FBUSxnQkFBMkI7Ozs7SUFDaEUsSUFBSSxJQUFJLEtBQUssT0FBTyxTQUFTLENBQUMsRUFBRTtDQUNqQztBQUVELE1BQU0sT0FBTyxZQUFhLFNBQVEsZ0JBQXNCOzs7O0lBQ3RELElBQUksSUFBSSxLQUFLLE9BQU8sSUFBSSxDQUFDLEVBQUU7Q0FDNUI7QUFFRCxNQUFNLE9BQU8sZ0JBQWlCLFNBQVEsZ0JBQTBCOzs7O0lBQzlELElBQUksSUFBSSxLQUFLLE9BQU8sUUFBUSxDQUFDLEVBQUU7Q0FDaEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50LCBEaXJlY3RpdmUsIE5nTW9kdWxlLCBQaXBlLCBUeXBlLCDJtVJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgYXMgUmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGVyfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlcic7XG5cbmNvbnN0IHJlZmxlY3Rpb24gPSBuZXcgUmVmbGVjdGlvbkNhcGFiaWxpdGllcygpO1xuXG4vKipcbiAqIEJhc2UgaW50ZXJmYWNlIHRvIHJlc29sdmUgYEBDb21wb25lbnRgLCBgQERpcmVjdGl2ZWAsIGBAUGlwZWAgYW5kIGBATmdNb2R1bGVgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVyPFQ+IHsgcmVzb2x2ZSh0eXBlOiBUeXBlPGFueT4pOiBUfG51bGw7IH1cblxuLyoqXG4gKiBBbGxvd3MgdG8gb3ZlcnJpZGUgaXZ5IG1ldGFkYXRhIGZvciB0ZXN0cyAodmlhIHRoZSBgVGVzdEJlZGApLlxuICovXG5hYnN0cmFjdCBjbGFzcyBPdmVycmlkZVJlc29sdmVyPFQ+IGltcGxlbWVudHMgUmVzb2x2ZXI8VD4ge1xuICBwcml2YXRlIG92ZXJyaWRlcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPFQ+PigpO1xuICBwcml2YXRlIHJlc29sdmVkID0gbmV3IE1hcDxUeXBlPGFueT4sIFR8bnVsbD4oKTtcblxuICBhYnN0cmFjdCBnZXQgdHlwZSgpOiBhbnk7XG5cbiAgc2V0T3ZlcnJpZGVzKG92ZXJyaWRlczogQXJyYXk8W1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxUPl0+KSB7XG4gICAgdGhpcy5vdmVycmlkZXMuY2xlYXIoKTtcbiAgICBvdmVycmlkZXMuZm9yRWFjaCgoW3R5cGUsIG92ZXJyaWRlXSkgPT4gdGhpcy5vdmVycmlkZXMuc2V0KHR5cGUsIG92ZXJyaWRlKSk7XG4gIH1cblxuICBnZXRBbm5vdGF0aW9uKHR5cGU6IFR5cGU8YW55Pik6IFR8bnVsbCB7XG4gICAgcmV0dXJuIHJlZmxlY3Rpb24uYW5ub3RhdGlvbnModHlwZSkuZmluZChhID0+IGEgaW5zdGFuY2VvZiB0aGlzLnR5cGUpIHx8IG51bGw7XG4gIH1cblxuICByZXNvbHZlKHR5cGU6IFR5cGU8YW55Pik6IFR8bnVsbCB7XG4gICAgbGV0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlZC5nZXQodHlwZSkgfHwgbnVsbDtcblxuICAgIGlmICghcmVzb2x2ZWQpIHtcbiAgICAgIHJlc29sdmVkID0gdGhpcy5nZXRBbm5vdGF0aW9uKHR5cGUpO1xuICAgICAgaWYgKHJlc29sdmVkKSB7XG4gICAgICAgIGNvbnN0IG92ZXJyaWRlID0gdGhpcy5vdmVycmlkZXMuZ2V0KHR5cGUpO1xuICAgICAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgICBjb25zdCBvdmVycmlkZXIgPSBuZXcgTWV0YWRhdGFPdmVycmlkZXIoKTtcbiAgICAgICAgICByZXNvbHZlZCA9IG92ZXJyaWRlci5vdmVycmlkZU1ldGFkYXRhKHRoaXMudHlwZSwgcmVzb2x2ZWQsIG92ZXJyaWRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5yZXNvbHZlZC5zZXQodHlwZSwgcmVzb2x2ZWQpO1xuICAgIH1cblxuICAgIHJldHVybiByZXNvbHZlZDtcbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBEaXJlY3RpdmVSZXNvbHZlciBleHRlbmRzIE92ZXJyaWRlUmVzb2x2ZXI8RGlyZWN0aXZlPiB7XG4gIGdldCB0eXBlKCkgeyByZXR1cm4gRGlyZWN0aXZlOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZXNvbHZlciBleHRlbmRzIE92ZXJyaWRlUmVzb2x2ZXI8Q29tcG9uZW50PiB7XG4gIGdldCB0eXBlKCkgeyByZXR1cm4gQ29tcG9uZW50OyB9XG59XG5cbmV4cG9ydCBjbGFzcyBQaXBlUmVzb2x2ZXIgZXh0ZW5kcyBPdmVycmlkZVJlc29sdmVyPFBpcGU+IHtcbiAgZ2V0IHR5cGUoKSB7IHJldHVybiBQaXBlOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBOZ01vZHVsZVJlc29sdmVyIGV4dGVuZHMgT3ZlcnJpZGVSZXNvbHZlcjxOZ01vZHVsZT4ge1xuICBnZXQgdHlwZSgpIHsgcmV0dXJuIE5nTW9kdWxlOyB9XG59XG4iXX0=