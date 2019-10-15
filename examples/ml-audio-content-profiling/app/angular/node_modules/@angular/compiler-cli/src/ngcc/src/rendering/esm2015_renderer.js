(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngcc/src/rendering/esm2015_renderer", ["require", "exports", "tslib", "canonical-path", "fs", "@angular/compiler-cli/src/ngtsc/transform", "@angular/compiler-cli/src/ngcc/src/constants", "@angular/compiler-cli/src/ngcc/src/rendering/fesm2015_renderer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var canonical_path_1 = require("canonical-path");
    var fs_1 = require("fs");
    var transform_1 = require("@angular/compiler-cli/src/ngtsc/transform");
    var constants_1 = require("@angular/compiler-cli/src/ngcc/src/constants");
    var fesm2015_renderer_1 = require("@angular/compiler-cli/src/ngcc/src/rendering/fesm2015_renderer");
    var Esm2015Renderer = /** @class */ (function (_super) {
        tslib_1.__extends(Esm2015Renderer, _super);
        function Esm2015Renderer(host, isCore, rewriteCoreImportsTo, sourcePath, targetPath, dtsMapper) {
            var _this = _super.call(this, host, isCore, rewriteCoreImportsTo, sourcePath, targetPath) || this;
            _this.host = host;
            _this.isCore = isCore;
            _this.rewriteCoreImportsTo = rewriteCoreImportsTo;
            _this.sourcePath = sourcePath;
            _this.targetPath = targetPath;
            _this.dtsMapper = dtsMapper;
            return _this;
        }
        Esm2015Renderer.prototype.renderFile = function (sourceFile, decorationAnalysis, switchMarkerAnalysis, targetPath) {
            var renderedFiles = _super.prototype.renderFile.call(this, sourceFile, decorationAnalysis, switchMarkerAnalysis, targetPath);
            // Transform the `.d.ts` files.
            // TODO(gkalpak): What about `.d.ts` source maps? (See
            // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-9.html#new---declarationmap.)
            if (decorationAnalysis) {
                // Create a `DtsFileTransformer` for the source file and record the generated fields, which
                // will allow the corresponding `.d.ts` file to be transformed later.
                var dtsTransformer_1 = new transform_1.DtsFileTransformer(this.rewriteCoreImportsTo, constants_1.IMPORT_PREFIX);
                decorationAnalysis.analyzedClasses.forEach(function (analyzedClass) {
                    return dtsTransformer_1.recordStaticField(analyzedClass.name, analyzedClass.compilation);
                });
                // Find the corresponding `.d.ts` file.
                var sourceFileName = sourceFile.fileName;
                var originalDtsFileName = this.dtsMapper.getDtsFileNameFor(sourceFileName);
                var originalDtsContents = fs_1.readFileSync(originalDtsFileName, 'utf8');
                // Transform the `.d.ts` file based on the recorded source file changes.
                var transformedDtsFileName = canonical_path_1.resolve(this.targetPath, canonical_path_1.relative(this.sourcePath, originalDtsFileName));
                var transformedDtsContents = dtsTransformer_1.transform(originalDtsContents, sourceFileName);
                // Add the transformed `.d.ts` file to the list of output files.
                renderedFiles.push({ path: transformedDtsFileName, contents: transformedDtsContents });
            }
            return renderedFiles;
        };
        return Esm2015Renderer;
    }(fesm2015_renderer_1.Fesm2015Renderer));
    exports.Esm2015Renderer = Esm2015Renderer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNtMjAxNV9yZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmdjYy9zcmMvcmVuZGVyaW5nL2VzbTIwMTVfcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0lBQUE7Ozs7OztPQU1HO0lBQ0gsaURBQWlEO0lBQ2pELHlCQUFnQztJQUdoQyx1RUFBNEQ7SUFHNUQsMEVBQTJDO0lBSTNDLG9HQUFxRDtJQUdyRDtRQUFxQywyQ0FBZ0I7UUFDbkQseUJBQ2MsSUFBd0IsRUFBWSxNQUFlLEVBQ25ELG9CQUF3QyxFQUFZLFVBQWtCLEVBQ3RFLFVBQWtCLEVBQVksU0FBb0I7WUFIaEUsWUFJRSxrQkFBTSxJQUFJLEVBQUUsTUFBTSxFQUFFLG9CQUFvQixFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsU0FDbEU7WUFKYSxVQUFJLEdBQUosSUFBSSxDQUFvQjtZQUFZLFlBQU0sR0FBTixNQUFNLENBQVM7WUFDbkQsMEJBQW9CLEdBQXBCLG9CQUFvQixDQUFvQjtZQUFZLGdCQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ3RFLGdCQUFVLEdBQVYsVUFBVSxDQUFRO1lBQVksZUFBUyxHQUFULFNBQVMsQ0FBVzs7UUFFaEUsQ0FBQztRQUVELG9DQUFVLEdBQVYsVUFDSSxVQUF5QixFQUFFLGtCQUFnRCxFQUMzRSxvQkFBb0QsRUFBRSxVQUFrQjtZQUMxRSxJQUFNLGFBQWEsR0FDZixpQkFBTSxVQUFVLFlBQUMsVUFBVSxFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRXZGLCtCQUErQjtZQUMvQixzREFBc0Q7WUFDdEQsd0dBQXdHO1lBQ3hHLElBQUksa0JBQWtCLEVBQUU7Z0JBQ3RCLDJGQUEyRjtnQkFDM0YscUVBQXFFO2dCQUNyRSxJQUFNLGdCQUFjLEdBQUcsSUFBSSw4QkFBa0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUseUJBQWEsQ0FBQyxDQUFDO2dCQUN4RixrQkFBa0IsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUN0QyxVQUFBLGFBQWE7b0JBQ1QsT0FBQSxnQkFBYyxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLFdBQVcsQ0FBQztnQkFBL0UsQ0FBK0UsQ0FBQyxDQUFDO2dCQUV6Rix1Q0FBdUM7Z0JBQ3ZDLElBQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUM7Z0JBQzNDLElBQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDN0UsSUFBTSxtQkFBbUIsR0FBRyxpQkFBWSxDQUFDLG1CQUFtQixFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUV0RSx3RUFBd0U7Z0JBQ3hFLElBQU0sc0JBQXNCLEdBQ3hCLHdCQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSx5QkFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO2dCQUM3RSxJQUFNLHNCQUFzQixHQUFHLGdCQUFjLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUU3RixnRUFBZ0U7Z0JBQ2hFLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsUUFBUSxFQUFFLHNCQUFzQixFQUFDLENBQUMsQ0FBQzthQUN0RjtZQUVELE9BQU8sYUFBYSxDQUFDO1FBQ3ZCLENBQUM7UUFDSCxzQkFBQztJQUFELENBQUMsQUF6Q0QsQ0FBcUMsb0NBQWdCLEdBeUNwRDtJQXpDWSwwQ0FBZSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7cmVsYXRpdmUsIHJlc29sdmV9IGZyb20gJ2Nhbm9uaWNhbC1wYXRoJztcbmltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtEdHNGaWxlVHJhbnNmb3JtZXJ9IGZyb20gJy4uLy4uLy4uL25ndHNjL3RyYW5zZm9ybSc7XG5pbXBvcnQge0RlY29yYXRpb25BbmFseXNpc30gZnJvbSAnLi4vYW5hbHlzaXMvZGVjb3JhdGlvbl9hbmFseXplcic7XG5pbXBvcnQge1N3aXRjaE1hcmtlckFuYWx5c2lzfSBmcm9tICcuLi9hbmFseXNpcy9zd2l0Y2hfbWFya2VyX2FuYWx5emVyJztcbmltcG9ydCB7SU1QT1JUX1BSRUZJWH0gZnJvbSAnLi4vY29uc3RhbnRzJztcbmltcG9ydCB7RHRzTWFwcGVyfSBmcm9tICcuLi9ob3N0L2R0c19tYXBwZXInO1xuaW1wb3J0IHtOZ2NjUmVmbGVjdGlvbkhvc3R9IGZyb20gJy4uL2hvc3QvbmdjY19ob3N0JztcblxuaW1wb3J0IHtGZXNtMjAxNVJlbmRlcmVyfSBmcm9tICcuL2Zlc20yMDE1X3JlbmRlcmVyJztcbmltcG9ydCB7RmlsZUluZm99IGZyb20gJy4vcmVuZGVyZXInO1xuXG5leHBvcnQgY2xhc3MgRXNtMjAxNVJlbmRlcmVyIGV4dGVuZHMgRmVzbTIwMTVSZW5kZXJlciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJvdGVjdGVkIGhvc3Q6IE5nY2NSZWZsZWN0aW9uSG9zdCwgcHJvdGVjdGVkIGlzQ29yZTogYm9vbGVhbixcbiAgICAgIHByb3RlY3RlZCByZXdyaXRlQ29yZUltcG9ydHNUbzogdHMuU291cmNlRmlsZXxudWxsLCBwcm90ZWN0ZWQgc291cmNlUGF0aDogc3RyaW5nLFxuICAgICAgcHJvdGVjdGVkIHRhcmdldFBhdGg6IHN0cmluZywgcHJvdGVjdGVkIGR0c01hcHBlcjogRHRzTWFwcGVyKSB7XG4gICAgc3VwZXIoaG9zdCwgaXNDb3JlLCByZXdyaXRlQ29yZUltcG9ydHNUbywgc291cmNlUGF0aCwgdGFyZ2V0UGF0aCk7XG4gIH1cblxuICByZW5kZXJGaWxlKFxuICAgICAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgZGVjb3JhdGlvbkFuYWx5c2lzOiBEZWNvcmF0aW9uQW5hbHlzaXN8dW5kZWZpbmVkLFxuICAgICAgc3dpdGNoTWFya2VyQW5hbHlzaXM6IFN3aXRjaE1hcmtlckFuYWx5c2lzfHVuZGVmaW5lZCwgdGFyZ2V0UGF0aDogc3RyaW5nKTogRmlsZUluZm9bXSB7XG4gICAgY29uc3QgcmVuZGVyZWRGaWxlcyA9XG4gICAgICAgIHN1cGVyLnJlbmRlckZpbGUoc291cmNlRmlsZSwgZGVjb3JhdGlvbkFuYWx5c2lzLCBzd2l0Y2hNYXJrZXJBbmFseXNpcywgdGFyZ2V0UGF0aCk7XG5cbiAgICAvLyBUcmFuc2Zvcm0gdGhlIGAuZC50c2AgZmlsZXMuXG4gICAgLy8gVE9ETyhna2FscGFrKTogV2hhdCBhYm91dCBgLmQudHNgIHNvdXJjZSBtYXBzPyAoU2VlXG4gICAgLy8gaHR0cHM6Ly93d3cudHlwZXNjcmlwdGxhbmcub3JnL2RvY3MvaGFuZGJvb2svcmVsZWFzZS1ub3Rlcy90eXBlc2NyaXB0LTItOS5odG1sI25ldy0tLWRlY2xhcmF0aW9ubWFwLilcbiAgICBpZiAoZGVjb3JhdGlvbkFuYWx5c2lzKSB7XG4gICAgICAvLyBDcmVhdGUgYSBgRHRzRmlsZVRyYW5zZm9ybWVyYCBmb3IgdGhlIHNvdXJjZSBmaWxlIGFuZCByZWNvcmQgdGhlIGdlbmVyYXRlZCBmaWVsZHMsIHdoaWNoXG4gICAgICAvLyB3aWxsIGFsbG93IHRoZSBjb3JyZXNwb25kaW5nIGAuZC50c2AgZmlsZSB0byBiZSB0cmFuc2Zvcm1lZCBsYXRlci5cbiAgICAgIGNvbnN0IGR0c1RyYW5zZm9ybWVyID0gbmV3IER0c0ZpbGVUcmFuc2Zvcm1lcih0aGlzLnJld3JpdGVDb3JlSW1wb3J0c1RvLCBJTVBPUlRfUFJFRklYKTtcbiAgICAgIGRlY29yYXRpb25BbmFseXNpcy5hbmFseXplZENsYXNzZXMuZm9yRWFjaChcbiAgICAgICAgICBhbmFseXplZENsYXNzID0+XG4gICAgICAgICAgICAgIGR0c1RyYW5zZm9ybWVyLnJlY29yZFN0YXRpY0ZpZWxkKGFuYWx5emVkQ2xhc3MubmFtZSwgYW5hbHl6ZWRDbGFzcy5jb21waWxhdGlvbikpO1xuXG4gICAgICAvLyBGaW5kIHRoZSBjb3JyZXNwb25kaW5nIGAuZC50c2AgZmlsZS5cbiAgICAgIGNvbnN0IHNvdXJjZUZpbGVOYW1lID0gc291cmNlRmlsZS5maWxlTmFtZTtcbiAgICAgIGNvbnN0IG9yaWdpbmFsRHRzRmlsZU5hbWUgPSB0aGlzLmR0c01hcHBlci5nZXREdHNGaWxlTmFtZUZvcihzb3VyY2VGaWxlTmFtZSk7XG4gICAgICBjb25zdCBvcmlnaW5hbER0c0NvbnRlbnRzID0gcmVhZEZpbGVTeW5jKG9yaWdpbmFsRHRzRmlsZU5hbWUsICd1dGY4Jyk7XG5cbiAgICAgIC8vIFRyYW5zZm9ybSB0aGUgYC5kLnRzYCBmaWxlIGJhc2VkIG9uIHRoZSByZWNvcmRlZCBzb3VyY2UgZmlsZSBjaGFuZ2VzLlxuICAgICAgY29uc3QgdHJhbnNmb3JtZWREdHNGaWxlTmFtZSA9XG4gICAgICAgICAgcmVzb2x2ZSh0aGlzLnRhcmdldFBhdGgsIHJlbGF0aXZlKHRoaXMuc291cmNlUGF0aCwgb3JpZ2luYWxEdHNGaWxlTmFtZSkpO1xuICAgICAgY29uc3QgdHJhbnNmb3JtZWREdHNDb250ZW50cyA9IGR0c1RyYW5zZm9ybWVyLnRyYW5zZm9ybShvcmlnaW5hbER0c0NvbnRlbnRzLCBzb3VyY2VGaWxlTmFtZSk7XG5cbiAgICAgIC8vIEFkZCB0aGUgdHJhbnNmb3JtZWQgYC5kLnRzYCBmaWxlIHRvIHRoZSBsaXN0IG9mIG91dHB1dCBmaWxlcy5cbiAgICAgIHJlbmRlcmVkRmlsZXMucHVzaCh7cGF0aDogdHJhbnNmb3JtZWREdHNGaWxlTmFtZSwgY29udGVudHM6IHRyYW5zZm9ybWVkRHRzQ29udGVudHN9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVuZGVyZWRGaWxlcztcbiAgfVxufVxuIl19