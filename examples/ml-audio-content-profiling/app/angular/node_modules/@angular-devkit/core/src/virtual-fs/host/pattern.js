"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resolver_1 = require("./resolver");
/**
 */
class PatternMatchingHost extends resolver_1.ResolverHost {
    constructor() {
        super(...arguments);
        this._patterns = new Map();
    }
    addPattern(pattern, replacementFn) {
        // Simple GLOB pattern replacement.
        const reString = '^('
            + (Array.isArray(pattern) ? pattern : [pattern])
                .map(ex => '('
                + ex.split(/[\/\\]/g).map(f => f
                    .replace(/[\-\[\]{}()+?.^$|]/g, '\\$&')
                    .replace(/^\*\*/g, '(.+?)?')
                    .replace(/\*/g, '[^/\\\\]*'))
                    .join('[\/\\\\]')
                + ')')
                .join('|')
            + ')($|/|\\\\)';
        this._patterns.set(new RegExp(reString), replacementFn);
    }
    _resolve(path) {
        let newPath = path;
        this._patterns.forEach((fn, re) => {
            if (re.test(path)) {
                newPath = fn(newPath);
            }
        });
        return newPath;
    }
}
exports.PatternMatchingHost = PatternMatchingHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0dGVybi5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvdmlydHVhbC1mcy9ob3N0L3BhdHRlcm4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSx5Q0FBMEM7QUFNMUM7R0FDRztBQUNILE1BQWEsbUJBQWdELFNBQVEsdUJBQW9CO0lBQXpGOztRQUNZLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBK0IsQ0FBQztJQTZCL0QsQ0FBQztJQTNCQyxVQUFVLENBQUMsT0FBMEIsRUFBRSxhQUFrQztRQUN2RSxtQ0FBbUM7UUFDbkMsTUFBTSxRQUFRLEdBQUcsSUFBSTtjQUNqQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDN0MsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRztrQkFDVixFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7cUJBQzdCLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxNQUFNLENBQUM7cUJBQ3RDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO3FCQUMzQixPQUFPLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO3FCQUM1QixJQUFJLENBQUMsVUFBVSxDQUFDO2tCQUNqQixHQUFHLENBQUM7aUJBQ1AsSUFBSSxDQUFDLEdBQUcsQ0FBQztjQUNWLGFBQWEsQ0FBQztRQUVsQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRVMsUUFBUSxDQUFDLElBQVU7UUFDM0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO1lBQ2hDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDakIsT0FBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUN2QjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBOUJELGtEQThCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IFBhdGggfSBmcm9tICcuLi9wYXRoJztcbmltcG9ydCB7IFJlc29sdmVySG9zdCB9IGZyb20gJy4vcmVzb2x2ZXInO1xuXG5cbmV4cG9ydCB0eXBlIFJlcGxhY2VtZW50RnVuY3Rpb24gPSAocGF0aDogUGF0aCkgPT4gUGF0aDtcblxuXG4vKipcbiAqL1xuZXhwb3J0IGNsYXNzIFBhdHRlcm5NYXRjaGluZ0hvc3Q8U3RhdHNUIGV4dGVuZHMgb2JqZWN0ID0ge30+IGV4dGVuZHMgUmVzb2x2ZXJIb3N0PFN0YXRzVD4ge1xuICBwcm90ZWN0ZWQgX3BhdHRlcm5zID0gbmV3IE1hcDxSZWdFeHAsIFJlcGxhY2VtZW50RnVuY3Rpb24+KCk7XG5cbiAgYWRkUGF0dGVybihwYXR0ZXJuOiBzdHJpbmcgfCBzdHJpbmdbXSwgcmVwbGFjZW1lbnRGbjogUmVwbGFjZW1lbnRGdW5jdGlvbikge1xuICAgIC8vIFNpbXBsZSBHTE9CIHBhdHRlcm4gcmVwbGFjZW1lbnQuXG4gICAgY29uc3QgcmVTdHJpbmcgPSAnXignXG4gICAgICArIChBcnJheS5pc0FycmF5KHBhdHRlcm4pID8gcGF0dGVybiA6IFtwYXR0ZXJuXSlcbiAgICAgICAgLm1hcChleCA9PiAnKCdcbiAgICAgICAgICArIGV4LnNwbGl0KC9bXFwvXFxcXF0vZykubWFwKGYgPT4gZlxuICAgICAgICAgICAgLnJlcGxhY2UoL1tcXC1cXFtcXF17fSgpKz8uXiR8XS9nLCAnXFxcXCQmJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9eXFwqXFwqL2csICcoLis/KT8nKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcKi9nLCAnW14vXFxcXFxcXFxdKicpKVxuICAgICAgICAgICAgLmpvaW4oJ1tcXC9cXFxcXFxcXF0nKVxuICAgICAgICAgICsgJyknKVxuICAgICAgICAuam9pbignfCcpXG4gICAgICArICcpKCR8L3xcXFxcXFxcXCknO1xuXG4gICAgdGhpcy5fcGF0dGVybnMuc2V0KG5ldyBSZWdFeHAocmVTdHJpbmcpLCByZXBsYWNlbWVudEZuKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfcmVzb2x2ZShwYXRoOiBQYXRoKSB7XG4gICAgbGV0IG5ld1BhdGggPSBwYXRoO1xuICAgIHRoaXMuX3BhdHRlcm5zLmZvckVhY2goKGZuLCByZSkgPT4ge1xuICAgICAgaWYgKHJlLnRlc3QocGF0aCkpIHtcbiAgICAgICAgbmV3UGF0aCA9IGZuKG5ld1BhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ld1BhdGg7XG4gIH1cbn1cbiJdfQ==