"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class MissingAssetSourceRootException extends core_1.BaseException {
    constructor(path) {
        super(`The ${path} asset path must start with the project source root.`);
    }
}
exports.MissingAssetSourceRootException = MissingAssetSourceRootException;
function normalizeAssetPatterns(assetPatterns, host, root, projectRoot, maybeSourceRoot) {
    // When sourceRoot is not available, we default to ${projectRoot}/src.
    const sourceRoot = maybeSourceRoot || core_1.join(projectRoot, 'src');
    const resolvedSourceRoot = core_1.resolve(root, sourceRoot);
    if (assetPatterns.length === 0) {
        // If there are no asset patterns, return an empty array.
        // It's important to do this because forkJoin with an empty array will immediately complete
        // the observable.
        return rxjs_1.of([]);
    }
    const assetPatternObjectObservables = assetPatterns
        .map(assetPattern => {
        // Normalize string asset patterns to objects.
        if (typeof assetPattern === 'string') {
            const assetPath = core_1.normalize(assetPattern);
            const resolvedAssetPath = core_1.resolve(root, assetPath);
            // Check if the string asset is within sourceRoot.
            if (!resolvedAssetPath.startsWith(resolvedSourceRoot)) {
                throw new MissingAssetSourceRootException(assetPattern);
            }
            return host.isDirectory(resolvedAssetPath).pipe(
            // If the path doesn't exist at all, pretend it is a directory.
            operators_1.catchError(() => rxjs_1.of(true)), operators_1.map(isDirectory => {
                let glob, input, output;
                if (isDirectory) {
                    // Folders get a recursive star glob.
                    glob = '**/*';
                    // Input directory is their original path.
                    input = assetPath;
                }
                else {
                    // Files are their own glob.
                    glob = core_1.basename(assetPath);
                    // Input directory is their original dirname.
                    input = core_1.dirname(assetPath);
                }
                // Output directory for both is the relative path from source root to input.
                output = core_1.relative(resolvedSourceRoot, core_1.resolve(root, input));
                // Return the asset pattern in object format.
                return { glob, input, output };
            }));
        }
        else {
            // It's already an AssetPatternObject, no need to convert.
            return rxjs_1.of(assetPattern);
        }
    });
    // Wait for all the asset patterns and return them as an array.
    return rxjs_1.forkJoin(assetPatternObjectObservables);
}
exports.normalizeAssetPatterns = normalizeAssetPatterns;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ybWFsaXplLWFzc2V0LXBhdHRlcm5zLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9ub3JtYWxpemUtYXNzZXQtcGF0dGVybnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FVOEI7QUFDOUIsK0JBQWdEO0FBQ2hELDhDQUFpRDtBQUlqRCxNQUFhLCtCQUFnQyxTQUFRLG9CQUFhO0lBQ2hFLFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsT0FBTyxJQUFJLHNEQUFzRCxDQUFDLENBQUM7SUFDM0UsQ0FBQztDQUNGO0FBSkQsMEVBSUM7QUFFRCxTQUFnQixzQkFBc0IsQ0FDcEMsYUFBNkIsRUFDN0IsSUFBb0IsRUFDcEIsSUFBVSxFQUNWLFdBQWlCLEVBQ2pCLGVBQWlDO0lBRWpDLHNFQUFzRTtJQUN0RSxNQUFNLFVBQVUsR0FBRyxlQUFlLElBQUksV0FBSSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMvRCxNQUFNLGtCQUFrQixHQUFHLGNBQU8sQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFckQsSUFBSSxhQUFhLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUM5Qix5REFBeUQ7UUFDekQsMkZBQTJGO1FBQzNGLGtCQUFrQjtRQUNsQixPQUFPLFNBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNmO0lBRUQsTUFBTSw2QkFBNkIsR0FBcUMsYUFBYTtTQUNsRixHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7UUFDbEIsOENBQThDO1FBQzlDLElBQUksT0FBTyxZQUFZLEtBQUssUUFBUSxFQUFFO1lBQ3BDLE1BQU0sU0FBUyxHQUFHLGdCQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDMUMsTUFBTSxpQkFBaUIsR0FBRyxjQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRW5ELGtEQUFrRDtZQUNsRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLEVBQUU7Z0JBQ3JELE1BQU0sSUFBSSwrQkFBK0IsQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUN6RDtZQUVELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLElBQUk7WUFDN0MsK0RBQStEO1lBQy9ELHNCQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQzFCLGVBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDaEIsSUFBSSxJQUFZLEVBQUUsS0FBVyxFQUFFLE1BQVksQ0FBQztnQkFDNUMsSUFBSSxXQUFXLEVBQUU7b0JBQ2YscUNBQXFDO29CQUNyQyxJQUFJLEdBQUcsTUFBTSxDQUFDO29CQUNkLDBDQUEwQztvQkFDMUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztpQkFDbkI7cUJBQU07b0JBQ0wsNEJBQTRCO29CQUM1QixJQUFJLEdBQUcsZUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUMzQiw2Q0FBNkM7b0JBQzdDLEtBQUssR0FBRyxjQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7aUJBQzVCO2dCQUVELDRFQUE0RTtnQkFDNUUsTUFBTSxHQUFHLGVBQVEsQ0FBQyxrQkFBa0IsRUFBRSxjQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBRTVELDZDQUE2QztnQkFDN0MsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQ0gsQ0FBQztTQUNIO2FBQU07WUFDTCwwREFBMEQ7WUFDMUQsT0FBTyxTQUFFLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDekI7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVMLCtEQUErRDtJQUMvRCxPQUFPLGVBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUE5REQsd0RBOERDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgQmFzZUV4Y2VwdGlvbixcbiAgUGF0aCxcbiAgYmFzZW5hbWUsXG4gIGRpcm5hbWUsXG4gIGpvaW4sXG4gIG5vcm1hbGl6ZSxcbiAgcmVsYXRpdmUsXG4gIHJlc29sdmUsXG4gIHZpcnR1YWxGcyxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZm9ya0pvaW4sIG9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjYXRjaEVycm9yLCBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBBc3NldFBhdHRlcm4sIEFzc2V0UGF0dGVybk9iamVjdCB9IGZyb20gJy4uL2Jyb3dzZXIvc2NoZW1hJztcblxuXG5leHBvcnQgY2xhc3MgTWlzc2luZ0Fzc2V0U291cmNlUm9vdEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihwYXRoOiBTdHJpbmcpIHtcbiAgICBzdXBlcihgVGhlICR7cGF0aH0gYXNzZXQgcGF0aCBtdXN0IHN0YXJ0IHdpdGggdGhlIHByb2plY3Qgc291cmNlIHJvb3QuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUFzc2V0UGF0dGVybnMoXG4gIGFzc2V0UGF0dGVybnM6IEFzc2V0UGF0dGVybltdLFxuICBob3N0OiB2aXJ0dWFsRnMuSG9zdCxcbiAgcm9vdDogUGF0aCxcbiAgcHJvamVjdFJvb3Q6IFBhdGgsXG4gIG1heWJlU291cmNlUm9vdDogUGF0aCB8IHVuZGVmaW5lZCxcbik6IE9ic2VydmFibGU8QXNzZXRQYXR0ZXJuT2JqZWN0W10+IHtcbiAgLy8gV2hlbiBzb3VyY2VSb290IGlzIG5vdCBhdmFpbGFibGUsIHdlIGRlZmF1bHQgdG8gJHtwcm9qZWN0Um9vdH0vc3JjLlxuICBjb25zdCBzb3VyY2VSb290ID0gbWF5YmVTb3VyY2VSb290IHx8IGpvaW4ocHJvamVjdFJvb3QsICdzcmMnKTtcbiAgY29uc3QgcmVzb2x2ZWRTb3VyY2VSb290ID0gcmVzb2x2ZShyb290LCBzb3VyY2VSb290KTtcblxuICBpZiAoYXNzZXRQYXR0ZXJucy5sZW5ndGggPT09IDApIHtcbiAgICAvLyBJZiB0aGVyZSBhcmUgbm8gYXNzZXQgcGF0dGVybnMsIHJldHVybiBhbiBlbXB0eSBhcnJheS5cbiAgICAvLyBJdCdzIGltcG9ydGFudCB0byBkbyB0aGlzIGJlY2F1c2UgZm9ya0pvaW4gd2l0aCBhbiBlbXB0eSBhcnJheSB3aWxsIGltbWVkaWF0ZWx5IGNvbXBsZXRlXG4gICAgLy8gdGhlIG9ic2VydmFibGUuXG4gICAgcmV0dXJuIG9mKFtdKTtcbiAgfVxuXG4gIGNvbnN0IGFzc2V0UGF0dGVybk9iamVjdE9ic2VydmFibGVzOiBPYnNlcnZhYmxlPEFzc2V0UGF0dGVybk9iamVjdD5bXSA9IGFzc2V0UGF0dGVybnNcbiAgICAubWFwKGFzc2V0UGF0dGVybiA9PiB7XG4gICAgICAvLyBOb3JtYWxpemUgc3RyaW5nIGFzc2V0IHBhdHRlcm5zIHRvIG9iamVjdHMuXG4gICAgICBpZiAodHlwZW9mIGFzc2V0UGF0dGVybiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgYXNzZXRQYXRoID0gbm9ybWFsaXplKGFzc2V0UGF0dGVybik7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkQXNzZXRQYXRoID0gcmVzb2x2ZShyb290LCBhc3NldFBhdGgpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBzdHJpbmcgYXNzZXQgaXMgd2l0aGluIHNvdXJjZVJvb3QuXG4gICAgICAgIGlmICghcmVzb2x2ZWRBc3NldFBhdGguc3RhcnRzV2l0aChyZXNvbHZlZFNvdXJjZVJvb3QpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1pc3NpbmdBc3NldFNvdXJjZVJvb3RFeGNlcHRpb24oYXNzZXRQYXR0ZXJuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBob3N0LmlzRGlyZWN0b3J5KHJlc29sdmVkQXNzZXRQYXRoKS5waXBlKFxuICAgICAgICAgIC8vIElmIHRoZSBwYXRoIGRvZXNuJ3QgZXhpc3QgYXQgYWxsLCBwcmV0ZW5kIGl0IGlzIGEgZGlyZWN0b3J5LlxuICAgICAgICAgIGNhdGNoRXJyb3IoKCkgPT4gb2YodHJ1ZSkpLFxuICAgICAgICAgIG1hcChpc0RpcmVjdG9yeSA9PiB7XG4gICAgICAgICAgICBsZXQgZ2xvYjogc3RyaW5nLCBpbnB1dDogUGF0aCwgb3V0cHV0OiBQYXRoO1xuICAgICAgICAgICAgaWYgKGlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgIC8vIEZvbGRlcnMgZ2V0IGEgcmVjdXJzaXZlIHN0YXIgZ2xvYi5cbiAgICAgICAgICAgICAgZ2xvYiA9ICcqKi8qJztcbiAgICAgICAgICAgICAgLy8gSW5wdXQgZGlyZWN0b3J5IGlzIHRoZWlyIG9yaWdpbmFsIHBhdGguXG4gICAgICAgICAgICAgIGlucHV0ID0gYXNzZXRQYXRoO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gRmlsZXMgYXJlIHRoZWlyIG93biBnbG9iLlxuICAgICAgICAgICAgICBnbG9iID0gYmFzZW5hbWUoYXNzZXRQYXRoKTtcbiAgICAgICAgICAgICAgLy8gSW5wdXQgZGlyZWN0b3J5IGlzIHRoZWlyIG9yaWdpbmFsIGRpcm5hbWUuXG4gICAgICAgICAgICAgIGlucHV0ID0gZGlybmFtZShhc3NldFBhdGgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBPdXRwdXQgZGlyZWN0b3J5IGZvciBib3RoIGlzIHRoZSByZWxhdGl2ZSBwYXRoIGZyb20gc291cmNlIHJvb3QgdG8gaW5wdXQuXG4gICAgICAgICAgICBvdXRwdXQgPSByZWxhdGl2ZShyZXNvbHZlZFNvdXJjZVJvb3QsIHJlc29sdmUocm9vdCwgaW5wdXQpKTtcblxuICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBhc3NldCBwYXR0ZXJuIGluIG9iamVjdCBmb3JtYXQuXG4gICAgICAgICAgICByZXR1cm4geyBnbG9iLCBpbnB1dCwgb3V0cHV0IH07XG4gICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJdCdzIGFscmVhZHkgYW4gQXNzZXRQYXR0ZXJuT2JqZWN0LCBubyBuZWVkIHRvIGNvbnZlcnQuXG4gICAgICAgIHJldHVybiBvZihhc3NldFBhdHRlcm4pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIC8vIFdhaXQgZm9yIGFsbCB0aGUgYXNzZXQgcGF0dGVybnMgYW5kIHJldHVybiB0aGVtIGFzIGFuIGFycmF5LlxuICByZXR1cm4gZm9ya0pvaW4oYXNzZXRQYXR0ZXJuT2JqZWN0T2JzZXJ2YWJsZXMpO1xufVxuIl19