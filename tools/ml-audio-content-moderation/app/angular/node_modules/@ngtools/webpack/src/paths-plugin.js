"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const path = require("path");
const getInnerRequest = require('enhanced-resolve/lib/getInnerRequest');
class TypeScriptPathsPlugin {
    constructor(_options) {
        this._options = _options;
    }
    // tslint:disable-next-line:no-any
    apply(resolver) {
        if (!this._options.paths || Object.keys(this._options.paths).length === 0) {
            return;
        }
        const target = resolver.ensureHook('resolve');
        const resolveAsync = (request, requestContext) => {
            return new Promise((resolve, reject) => {
                resolver.doResolve(target, request, '', requestContext, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                });
            });
        };
        resolver.getHook('described-resolve').tapPromise('TypeScriptPathsPlugin', async (request, resolveContext) => {
            if (!request || request.typescriptPathMapped) {
                return;
            }
            const originalRequest = getInnerRequest(resolver, request);
            if (!originalRequest) {
                return;
            }
            // Only work on Javascript/TypeScript issuers.
            if (!request.context.issuer || !request.context.issuer.match(/\.[jt]sx?$/)) {
                return;
            }
            // Relative or absolute requests are not mapped
            if (originalRequest.startsWith('.') || originalRequest.startsWith('/')) {
                return;
            }
            // Amd requests are not mapped
            if (originalRequest.startsWith('!!webpack amd')) {
                return;
            }
            const replacements = findReplacements(originalRequest, this._options.paths || {});
            for (const potential of replacements) {
                const potentialRequest = Object.assign({}, request, { request: path.resolve(this._options.baseUrl || '', potential), typescriptPathMapped: true });
                const result = await resolveAsync(potentialRequest, resolveContext);
                if (result) {
                    return result;
                }
            }
        });
    }
}
exports.TypeScriptPathsPlugin = TypeScriptPathsPlugin;
function findReplacements(originalRequest, paths) {
    // check if any path mapping rules are relevant
    const pathMapOptions = [];
    for (const pattern in paths) {
        // get potentials and remove duplicates; JS Set maintains insertion order
        const potentials = Array.from(new Set(paths[pattern]));
        if (potentials.length === 0) {
            // no potential replacements so skip
            continue;
        }
        // can only contain zero or one
        const starIndex = pattern.indexOf('*');
        if (starIndex === -1) {
            if (pattern === originalRequest) {
                pathMapOptions.push({
                    starIndex,
                    partial: '',
                    potentials,
                });
            }
        }
        else if (starIndex === 0 && pattern.length === 1) {
            pathMapOptions.push({
                starIndex,
                partial: originalRequest,
                potentials,
            });
        }
        else if (starIndex === pattern.length - 1) {
            if (originalRequest.startsWith(pattern.slice(0, -1))) {
                pathMapOptions.push({
                    starIndex,
                    partial: originalRequest.slice(pattern.length - 1),
                    potentials,
                });
            }
        }
        else {
            const [prefix, suffix] = pattern.split('*');
            if (originalRequest.startsWith(prefix) && originalRequest.endsWith(suffix)) {
                pathMapOptions.push({
                    starIndex,
                    partial: originalRequest.slice(prefix.length).slice(0, -suffix.length),
                    potentials,
                });
            }
        }
    }
    if (pathMapOptions.length === 0) {
        return [];
    }
    // exact matches take priority then largest prefix match
    pathMapOptions.sort((a, b) => {
        if (a.starIndex === -1) {
            return -1;
        }
        else if (b.starIndex === -1) {
            return 1;
        }
        else {
            return b.starIndex - a.starIndex;
        }
    });
    const replacements = [];
    pathMapOptions.forEach(option => {
        for (const potential of option.potentials) {
            let replacement;
            const starIndex = potential.indexOf('*');
            if (starIndex === -1) {
                replacement = potential;
            }
            else if (starIndex === potential.length - 1) {
                replacement = potential.slice(0, -1) + option.partial;
            }
            else {
                const [prefix, suffix] = potential.split('*');
                replacement = prefix + option.partial + suffix;
            }
            replacements.push(replacement);
        }
    });
    return replacements;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aHMtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9uZ3Rvb2xzL3dlYnBhY2svc3JjL3BhdGhzLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILDZCQUE2QjtBQUk3QixNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsc0NBQXNDLENBQUMsQ0FBQztBQU14RSxNQUFhLHFCQUFxQjtJQUNoQyxZQUFvQixRQUFzQztRQUF0QyxhQUFRLEdBQVIsUUFBUSxDQUE4QjtJQUFJLENBQUM7SUFFL0Qsa0NBQWtDO0lBQ2xDLEtBQUssQ0FBQyxRQUFhO1FBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUN6RSxPQUFPO1NBQ1I7UUFFRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzlDLE1BQU0sWUFBWSxHQUFHLENBQUMsT0FBbUMsRUFBRSxjQUFrQixFQUFFLEVBQUU7WUFDL0UsT0FBTyxJQUFJLE9BQU8sQ0FBeUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQzdFLFFBQVEsQ0FBQyxTQUFTLENBQ2hCLE1BQU0sRUFDTixPQUFPLEVBQ1AsRUFBRSxFQUNGLGNBQWMsRUFDZCxDQUFDLEtBQW1CLEVBQUUsTUFBOEMsRUFBRSxFQUFFO29CQUN0RSxJQUFJLEtBQUssRUFBRTt3QkFDVCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQ2Y7eUJBQU07d0JBQ0wsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUNqQjtnQkFDSCxDQUFDLENBQ0YsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBRUYsUUFBUSxDQUFDLE9B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LENBQUM7SUFDbEMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUM5QixLQUFLLE1BQU0sU0FBUyxJQUFJLE1BQU0sQ0FBQyxVQUFVLEVBQUU7WUFDekMsSUFBSSxXQUFXLENBQUM7WUFDaEIsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QyxJQUFJLFNBQVMsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDcEIsV0FBVyxHQUFHLFNBQVMsQ0FBQzthQUN6QjtpQkFBTSxJQUFJLFNBQVMsS0FBSyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDN0MsV0FBVyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQzthQUN2RDtpQkFBTTtnQkFDTCxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzlDLFdBQVcsR0FBRyxNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7YUFDaEQ7WUFFRCxZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ2hDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IENvbXBpbGVyT3B0aW9ucywgTWFwTGlrZSB9IGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgTm9ybWFsTW9kdWxlRmFjdG9yeVJlcXVlc3QgfSBmcm9tICcuL3dlYnBhY2snO1xuXG5jb25zdCBnZXRJbm5lclJlcXVlc3QgPSByZXF1aXJlKCdlbmhhbmNlZC1yZXNvbHZlL2xpYi9nZXRJbm5lclJlcXVlc3QnKTtcblxuZXhwb3J0IGludGVyZmFjZSBUeXBlU2NyaXB0UGF0aHNQbHVnaW5PcHRpb25zIGV4dGVuZHMgUGljazxDb21waWxlck9wdGlvbnMsICdwYXRocycgfCAnYmFzZVVybCc+IHtcblxufVxuXG5leHBvcnQgY2xhc3MgVHlwZVNjcmlwdFBhdGhzUGx1Z2luIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfb3B0aW9uczogVHlwZVNjcmlwdFBhdGhzUGx1Z2luT3B0aW9ucykgeyB9XG5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICBhcHBseShyZXNvbHZlcjogYW55KSB7XG4gICAgaWYgKCF0aGlzLl9vcHRpb25zLnBhdGhzIHx8IE9iamVjdC5rZXlzKHRoaXMuX29wdGlvbnMucGF0aHMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldCA9IHJlc29sdmVyLmVuc3VyZUhvb2soJ3Jlc29sdmUnKTtcbiAgICBjb25zdCByZXNvbHZlQXN5bmMgPSAocmVxdWVzdDogTm9ybWFsTW9kdWxlRmFjdG9yeVJlcXVlc3QsIHJlcXVlc3RDb250ZXh0OiB7fSkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPE5vcm1hbE1vZHVsZUZhY3RvcnlSZXF1ZXN0IHwgdW5kZWZpbmVkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHJlc29sdmVyLmRvUmVzb2x2ZShcbiAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgcmVxdWVzdCxcbiAgICAgICAgICAnJyxcbiAgICAgICAgICByZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgICAoZXJyb3I6IEVycm9yIHwgbnVsbCwgcmVzdWx0OiBOb3JtYWxNb2R1bGVGYWN0b3J5UmVxdWVzdCB8IHVuZGVmaW5lZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXNvbHZlci5nZXRIb29rKCdkZXNjcmliZWQtcmVzb2x2ZScpLnRhcFByb21pc2UoXG4gICAgICAnVHlwZVNjcmlwdFBhdGhzUGx1Z2luJyxcbiAgICAgIGFzeW5jIChyZXF1ZXN0OiBOb3JtYWxNb2R1bGVGYWN0b3J5UmVxdWVzdCwgcmVzb2x2ZUNvbnRleHQ6IHt9KSA9PiB7XG4gICAgICAgIGlmICghcmVxdWVzdCB8fCByZXF1ZXN0LnR5cGVzY3JpcHRQYXRoTWFwcGVkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3JpZ2luYWxSZXF1ZXN0ID0gZ2V0SW5uZXJSZXF1ZXN0KHJlc29sdmVyLCByZXF1ZXN0KTtcbiAgICAgICAgaWYgKCFvcmlnaW5hbFJlcXVlc3QpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPbmx5IHdvcmsgb24gSmF2YXNjcmlwdC9UeXBlU2NyaXB0IGlzc3VlcnMuXG4gICAgICAgIGlmICghcmVxdWVzdC5jb250ZXh0Lmlzc3VlciB8fCAhcmVxdWVzdC5jb250ZXh0Lmlzc3Vlci5tYXRjaCgvXFwuW2p0XXN4PyQvKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbGF0aXZlIG9yIGFic29sdXRlIHJlcXVlc3RzIGFyZSBub3QgbWFwcGVkXG4gICAgICAgIGlmIChvcmlnaW5hbFJlcXVlc3Quc3RhcnRzV2l0aCgnLicpIHx8IG9yaWdpbmFsUmVxdWVzdC5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbWQgcmVxdWVzdHMgYXJlIG5vdCBtYXBwZWRcbiAgICAgICAgaWYgKG9yaWdpbmFsUmVxdWVzdC5zdGFydHNXaXRoKCchIXdlYnBhY2sgYW1kJykpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXBsYWNlbWVudHMgPSBmaW5kUmVwbGFjZW1lbnRzKG9yaWdpbmFsUmVxdWVzdCwgdGhpcy5fb3B0aW9ucy5wYXRocyB8fCB7fSk7XG4gICAgICAgIGZvciAoY29uc3QgcG90ZW50aWFsIG9mIHJlcGxhY2VtZW50cykge1xuICAgICAgICAgIGNvbnN0IHBvdGVudGlhbFJlcXVlc3QgPSB7XG4gICAgICAgICAgICAuLi5yZXF1ZXN0LFxuICAgICAgICAgICAgcmVxdWVzdDogcGF0aC5yZXNvbHZlKHRoaXMuX29wdGlvbnMuYmFzZVVybCB8fCAnJywgcG90ZW50aWFsKSxcbiAgICAgICAgICAgIHR5cGVzY3JpcHRQYXRoTWFwcGVkOiB0cnVlLFxuICAgICAgICAgIH07XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzb2x2ZUFzeW5jKHBvdGVudGlhbFJlcXVlc3QsIHJlc29sdmVDb250ZXh0KTtcblxuICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZFJlcGxhY2VtZW50cyhcbiAgb3JpZ2luYWxSZXF1ZXN0OiBzdHJpbmcsXG4gIHBhdGhzOiBNYXBMaWtlPHN0cmluZ1tdPixcbik6IEl0ZXJhYmxlPHN0cmluZz4ge1xuICAvLyBjaGVjayBpZiBhbnkgcGF0aCBtYXBwaW5nIHJ1bGVzIGFyZSByZWxldmFudFxuICBjb25zdCBwYXRoTWFwT3B0aW9ucyA9IFtdO1xuICBmb3IgKGNvbnN0IHBhdHRlcm4gaW4gcGF0aHMpIHtcbiAgICAvLyBnZXQgcG90ZW50aWFscyBhbmQgcmVtb3ZlIGR1cGxpY2F0ZXM7IEpTIFNldCBtYWludGFpbnMgaW5zZXJ0aW9uIG9yZGVyXG4gICAgY29uc3QgcG90ZW50aWFscyA9IEFycmF5LmZyb20obmV3IFNldChwYXRoc1twYXR0ZXJuXSkpO1xuICAgIGlmIChwb3RlbnRpYWxzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gbm8gcG90ZW50aWFsIHJlcGxhY2VtZW50cyBzbyBza2lwXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBjYW4gb25seSBjb250YWluIHplcm8gb3Igb25lXG4gICAgY29uc3Qgc3RhckluZGV4ID0gcGF0dGVybi5pbmRleE9mKCcqJyk7XG4gICAgaWYgKHN0YXJJbmRleCA9PT0gLTEpIHtcbiAgICAgIGlmIChwYXR0ZXJuID09PSBvcmlnaW5hbFJlcXVlc3QpIHtcbiAgICAgICAgcGF0aE1hcE9wdGlvbnMucHVzaCh7XG4gICAgICAgICAgc3RhckluZGV4LFxuICAgICAgICAgIHBhcnRpYWw6ICcnLFxuICAgICAgICAgIHBvdGVudGlhbHMsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoc3RhckluZGV4ID09PSAwICYmIHBhdHRlcm4ubGVuZ3RoID09PSAxKSB7XG4gICAgICBwYXRoTWFwT3B0aW9ucy5wdXNoKHtcbiAgICAgICAgc3RhckluZGV4LFxuICAgICAgICBwYXJ0aWFsOiBvcmlnaW5hbFJlcXVlc3QsXG4gICAgICAgIHBvdGVudGlhbHMsXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHN0YXJJbmRleCA9PT0gcGF0dGVybi5sZW5ndGggLSAxKSB7XG4gICAgICBpZiAob3JpZ2luYWxSZXF1ZXN0LnN0YXJ0c1dpdGgocGF0dGVybi5zbGljZSgwLCAtMSkpKSB7XG4gICAgICAgIHBhdGhNYXBPcHRpb25zLnB1c2goe1xuICAgICAgICAgIHN0YXJJbmRleCxcbiAgICAgICAgICBwYXJ0aWFsOiBvcmlnaW5hbFJlcXVlc3Quc2xpY2UocGF0dGVybi5sZW5ndGggLSAxKSxcbiAgICAgICAgICBwb3RlbnRpYWxzLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgW3ByZWZpeCwgc3VmZml4XSA9IHBhdHRlcm4uc3BsaXQoJyonKTtcbiAgICAgIGlmIChvcmlnaW5hbFJlcXVlc3Quc3RhcnRzV2l0aChwcmVmaXgpICYmIG9yaWdpbmFsUmVxdWVzdC5lbmRzV2l0aChzdWZmaXgpKSB7XG4gICAgICAgIHBhdGhNYXBPcHRpb25zLnB1c2goe1xuICAgICAgICAgIHN0YXJJbmRleCxcbiAgICAgICAgICBwYXJ0aWFsOiBvcmlnaW5hbFJlcXVlc3Quc2xpY2UocHJlZml4Lmxlbmd0aCkuc2xpY2UoMCwgLXN1ZmZpeC5sZW5ndGgpLFxuICAgICAgICAgIHBvdGVudGlhbHMsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChwYXRoTWFwT3B0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvLyBleGFjdCBtYXRjaGVzIHRha2UgcHJpb3JpdHkgdGhlbiBsYXJnZXN0IHByZWZpeCBtYXRjaFxuICBwYXRoTWFwT3B0aW9ucy5zb3J0KChhLCBiKSA9PiB7XG4gICAgaWYgKGEuc3RhckluZGV4ID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH0gZWxzZSBpZiAoYi5zdGFySW5kZXggPT09IC0xKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGIuc3RhckluZGV4IC0gYS5zdGFySW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCByZXBsYWNlbWVudHM6IHN0cmluZ1tdID0gW107XG4gIHBhdGhNYXBPcHRpb25zLmZvckVhY2gob3B0aW9uID0+IHtcbiAgICBmb3IgKGNvbnN0IHBvdGVudGlhbCBvZiBvcHRpb24ucG90ZW50aWFscykge1xuICAgICAgbGV0IHJlcGxhY2VtZW50O1xuICAgICAgY29uc3Qgc3RhckluZGV4ID0gcG90ZW50aWFsLmluZGV4T2YoJyonKTtcbiAgICAgIGlmIChzdGFySW5kZXggPT09IC0xKSB7XG4gICAgICAgIHJlcGxhY2VtZW50ID0gcG90ZW50aWFsO1xuICAgICAgfSBlbHNlIGlmIChzdGFySW5kZXggPT09IHBvdGVudGlhbC5sZW5ndGggLSAxKSB7XG4gICAgICAgIHJlcGxhY2VtZW50ID0gcG90ZW50aWFsLnNsaWNlKDAsIC0xKSArIG9wdGlvbi5wYXJ0aWFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgW3ByZWZpeCwgc3VmZml4XSA9IHBvdGVudGlhbC5zcGxpdCgnKicpO1xuICAgICAgICByZXBsYWNlbWVudCA9IHByZWZpeCArIG9wdGlvbi5wYXJ0aWFsICsgc3VmZml4O1xuICAgICAgfVxuXG4gICAgICByZXBsYWNlbWVudHMucHVzaChyZXBsYWNlbWVudCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcmVwbGFjZW1lbnRzO1xufVxuIl19