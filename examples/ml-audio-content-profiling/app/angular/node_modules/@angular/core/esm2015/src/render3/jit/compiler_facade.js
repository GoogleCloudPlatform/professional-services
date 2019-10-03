/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { global } from '../../util';
export { R3ResolvedDependencyType } from './compiler_facade_interface';
/**
 * @return {?}
 */
export function getCompilerFacade() {
    /** @type {?} */
    const globalNg = global["ng"];
    if (!globalNg || !globalNg.ɵcompilerFacade) {
        throw new Error(`Angular JIT compilation failed: '@angular/compiler' not loaded!\n` +
            `  - JIT compilation is discouraged for production use-cases! Consider AOT mode instead.\n` +
            `  - Did you bootstrap using '@angular/platform-browser-dynamic' or '@angular/platform-server'?\n` +
            `  - Alternatively provide the compiler with 'import "@angular/compiler";' before bootstrapping.`);
    }
    return globalNg.ɵcompilerFacade;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJfZmFjYWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvY29tcGlsZXJfZmFjYWRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFPQSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRWxDLHlDQUFjLDZCQUE2QixDQUFDOzs7O0FBRTVDLE1BQU0sVUFBVSxpQkFBaUI7O0lBQy9CLE1BQU0sUUFBUSxHQUEyQixNQUFNLE9BQUk7SUFDbkQsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUU7UUFDMUMsTUFBTSxJQUFJLEtBQUssQ0FDWCxtRUFBbUU7WUFDbkUsMkZBQTJGO1lBQzNGLGtHQUFrRztZQUNsRyxpR0FBaUcsQ0FBQyxDQUFDO0tBQ3hHO0lBQ0QsT0FBTyxRQUFRLENBQUMsZUFBZSxDQUFDO0NBQ2pDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uLy4uL3V0aWwnO1xuaW1wb3J0IHtDb21waWxlckZhY2FkZSwgRXhwb3J0ZWRDb21waWxlckZhY2FkZX0gZnJvbSAnLi9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlJztcbmV4cG9ydCAqIGZyb20gJy4vY29tcGlsZXJfZmFjYWRlX2ludGVyZmFjZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21waWxlckZhY2FkZSgpOiBDb21waWxlckZhY2FkZSB7XG4gIGNvbnN0IGdsb2JhbE5nOiBFeHBvcnRlZENvbXBpbGVyRmFjYWRlID0gZ2xvYmFsLm5nO1xuICBpZiAoIWdsb2JhbE5nIHx8ICFnbG9iYWxOZy7JtWNvbXBpbGVyRmFjYWRlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQW5ndWxhciBKSVQgY29tcGlsYXRpb24gZmFpbGVkOiAnQGFuZ3VsYXIvY29tcGlsZXInIG5vdCBsb2FkZWQhXFxuYCArXG4gICAgICAgIGAgIC0gSklUIGNvbXBpbGF0aW9uIGlzIGRpc2NvdXJhZ2VkIGZvciBwcm9kdWN0aW9uIHVzZS1jYXNlcyEgQ29uc2lkZXIgQU9UIG1vZGUgaW5zdGVhZC5cXG5gICtcbiAgICAgICAgYCAgLSBEaWQgeW91IGJvb3RzdHJhcCB1c2luZyAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljJyBvciAnQGFuZ3VsYXIvcGxhdGZvcm0tc2VydmVyJz9cXG5gICtcbiAgICAgICAgYCAgLSBBbHRlcm5hdGl2ZWx5IHByb3ZpZGUgdGhlIGNvbXBpbGVyIHdpdGggJ2ltcG9ydCBcIkBhbmd1bGFyL2NvbXBpbGVyXCI7JyBiZWZvcmUgYm9vdHN0cmFwcGluZy5gKTtcbiAgfVxuICByZXR1cm4gZ2xvYmFsTmcuybVjb21waWxlckZhY2FkZTtcbn1cbiJdfQ==