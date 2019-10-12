/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { DirectiveResolver } from '@angular/compiler';
/**
 * An implementation of {\@link DirectiveResolver} that allows overriding
 * various properties of directives.
 */
export class MockDirectiveResolver extends DirectiveResolver {
    /**
     * @param {?} reflector
     */
    constructor(reflector) {
        super(reflector);
        this._directives = new Map();
    }
    /**
     * @param {?} type
     * @param {?=} throwIfNotFound
     * @return {?}
     */
    resolve(type, throwIfNotFound = true) {
        return this._directives.get(type) || super.resolve(type, throwIfNotFound);
    }
    /**
     * Overrides the {\@link core.Directive} for a directive.
     * @param {?} type
     * @param {?} metadata
     * @return {?}
     */
    setDirective(type, metadata) {
        this._directives.set(type, metadata);
    }
}
if (false) {
    /** @type {?} */
    MockDirectiveResolver.prototype._directives;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlX3Jlc29sdmVyX21vY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci90ZXN0aW5nL3NyYy9kaXJlY3RpdmVfcmVzb2x2ZXJfbW9jay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBT0EsT0FBTyxFQUFtQixpQkFBaUIsRUFBTyxNQUFNLG1CQUFtQixDQUFDOzs7OztBQU01RSxNQUFNLE9BQU8scUJBQXNCLFNBQVEsaUJBQWlCOzs7O0lBRzFELFlBQVksU0FBMkI7UUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7MkJBRnRDLElBQUksR0FBRyxFQUE2QjtLQUVJOzs7Ozs7SUFLOUQsT0FBTyxDQUFDLElBQWUsRUFBRSxlQUFlLEdBQUcsSUFBSTtRQUM3QyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0tBQzNFOzs7Ozs7O0lBS0QsWUFBWSxDQUFDLElBQWUsRUFBRSxRQUF3QjtRQUNwRCxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDdEM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7Q29tcGlsZVJlZmxlY3RvciwgRGlyZWN0aXZlUmVzb2x2ZXIsIGNvcmV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgRGlyZWN0aXZlUmVzb2x2ZXJ9IHRoYXQgYWxsb3dzIG92ZXJyaWRpbmdcbiAqIHZhcmlvdXMgcHJvcGVydGllcyBvZiBkaXJlY3RpdmVzLlxuICovXG5leHBvcnQgY2xhc3MgTW9ja0RpcmVjdGl2ZVJlc29sdmVyIGV4dGVuZHMgRGlyZWN0aXZlUmVzb2x2ZXIge1xuICBwcml2YXRlIF9kaXJlY3RpdmVzID0gbmV3IE1hcDxjb3JlLlR5cGUsIGNvcmUuRGlyZWN0aXZlPigpO1xuXG4gIGNvbnN0cnVjdG9yKHJlZmxlY3RvcjogQ29tcGlsZVJlZmxlY3RvcikgeyBzdXBlcihyZWZsZWN0b3IpOyB9XG5cbiAgcmVzb2x2ZSh0eXBlOiBjb3JlLlR5cGUpOiBjb3JlLkRpcmVjdGl2ZTtcbiAgcmVzb2x2ZSh0eXBlOiBjb3JlLlR5cGUsIHRocm93SWZOb3RGb3VuZDogdHJ1ZSk6IGNvcmUuRGlyZWN0aXZlO1xuICByZXNvbHZlKHR5cGU6IGNvcmUuVHlwZSwgdGhyb3dJZk5vdEZvdW5kOiBib29sZWFuKTogY29yZS5EaXJlY3RpdmV8bnVsbDtcbiAgcmVzb2x2ZSh0eXBlOiBjb3JlLlR5cGUsIHRocm93SWZOb3RGb3VuZCA9IHRydWUpOiBjb3JlLkRpcmVjdGl2ZXxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fZGlyZWN0aXZlcy5nZXQodHlwZSkgfHwgc3VwZXIucmVzb2x2ZSh0eXBlLCB0aHJvd0lmTm90Rm91bmQpO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUge0BsaW5rIGNvcmUuRGlyZWN0aXZlfSBmb3IgYSBkaXJlY3RpdmUuXG4gICAqL1xuICBzZXREaXJlY3RpdmUodHlwZTogY29yZS5UeXBlLCBtZXRhZGF0YTogY29yZS5EaXJlY3RpdmUpOiB2b2lkIHtcbiAgICB0aGlzLl9kaXJlY3RpdmVzLnNldCh0eXBlLCBtZXRhZGF0YSk7XG4gIH1cbn1cbiJdfQ==