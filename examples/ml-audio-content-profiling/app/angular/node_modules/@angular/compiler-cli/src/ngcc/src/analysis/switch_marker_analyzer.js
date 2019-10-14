(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngcc/src/analysis/switch_marker_analyzer", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SwitchMarkerAnalyses = Map;
    /**
     * This Analyzer will analyse the files that have an NGCC switch marker in them
     * that will be replaced.
     */
    var SwitchMarkerAnalyzer = /** @class */ (function () {
        function SwitchMarkerAnalyzer(host) {
            this.host = host;
        }
        /**
         * Analyze the files in the program to identify declarations that contain NGCC
         * switch markers.
         * @param program The program to analyze.
         * @return A map of source files to analysis objects. The map will contain only the
         * source files that had switch markers, and the analysis will contain an array of
         * the declarations in that source file that contain the marker.
         */
        SwitchMarkerAnalyzer.prototype.analyzeProgram = function (program) {
            var _this = this;
            var analyzedFiles = new exports.SwitchMarkerAnalyses();
            program.getSourceFiles().forEach(function (sourceFile) {
                var declarations = _this.host.getSwitchableDeclarations(sourceFile);
                if (declarations.length) {
                    analyzedFiles.set(sourceFile, { sourceFile: sourceFile, declarations: declarations });
                }
            });
            return analyzedFiles;
        };
        return SwitchMarkerAnalyzer;
    }());
    exports.SwitchMarkerAnalyzer = SwitchMarkerAnalyzer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3dpdGNoX21hcmtlcl9hbmFseXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmdjYy9zcmMvYW5hbHlzaXMvc3dpdGNoX21hcmtlcl9hbmFseXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQWdCYSxRQUFBLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztJQUV4Qzs7O09BR0c7SUFDSDtRQUNFLDhCQUFvQixJQUF3QjtZQUF4QixTQUFJLEdBQUosSUFBSSxDQUFvQjtRQUFHLENBQUM7UUFDaEQ7Ozs7Ozs7V0FPRztRQUNILDZDQUFjLEdBQWQsVUFBZSxPQUFtQjtZQUFsQyxpQkFTQztZQVJDLElBQU0sYUFBYSxHQUFHLElBQUksNEJBQW9CLEVBQUUsQ0FBQztZQUNqRCxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQUEsVUFBVTtnQkFDekMsSUFBTSxZQUFZLEdBQUcsS0FBSSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDckUsSUFBSSxZQUFZLENBQUMsTUFBTSxFQUFFO29CQUN2QixhQUFhLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxFQUFDLFVBQVUsWUFBQSxFQUFFLFlBQVksY0FBQSxFQUFDLENBQUMsQ0FBQztpQkFDM0Q7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sYUFBYSxDQUFDO1FBQ3ZCLENBQUM7UUFDSCwyQkFBQztJQUFELENBQUMsQUFwQkQsSUFvQkM7SUFwQlksb0RBQW9CIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge05nY2NSZWZsZWN0aW9uSG9zdCwgU3dpdGNoYWJsZVZhcmlhYmxlRGVjbGFyYXRpb259IGZyb20gJy4uL2hvc3QvbmdjY19ob3N0JztcblxuZXhwb3J0IGludGVyZmFjZSBTd2l0Y2hNYXJrZXJBbmFseXNpcyB7XG4gIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGU7XG4gIGRlY2xhcmF0aW9uczogU3dpdGNoYWJsZVZhcmlhYmxlRGVjbGFyYXRpb25bXTtcbn1cblxuZXhwb3J0IHR5cGUgU3dpdGNoTWFya2VyQW5hbHlzZXMgPSBNYXA8dHMuU291cmNlRmlsZSwgU3dpdGNoTWFya2VyQW5hbHlzaXM+O1xuZXhwb3J0IGNvbnN0IFN3aXRjaE1hcmtlckFuYWx5c2VzID0gTWFwO1xuXG4vKipcbiAqIFRoaXMgQW5hbHl6ZXIgd2lsbCBhbmFseXNlIHRoZSBmaWxlcyB0aGF0IGhhdmUgYW4gTkdDQyBzd2l0Y2ggbWFya2VyIGluIHRoZW1cbiAqIHRoYXQgd2lsbCBiZSByZXBsYWNlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFN3aXRjaE1hcmtlckFuYWx5emVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBob3N0OiBOZ2NjUmVmbGVjdGlvbkhvc3QpIHt9XG4gIC8qKlxuICAgKiBBbmFseXplIHRoZSBmaWxlcyBpbiB0aGUgcHJvZ3JhbSB0byBpZGVudGlmeSBkZWNsYXJhdGlvbnMgdGhhdCBjb250YWluIE5HQ0NcbiAgICogc3dpdGNoIG1hcmtlcnMuXG4gICAqIEBwYXJhbSBwcm9ncmFtIFRoZSBwcm9ncmFtIHRvIGFuYWx5emUuXG4gICAqIEByZXR1cm4gQSBtYXAgb2Ygc291cmNlIGZpbGVzIHRvIGFuYWx5c2lzIG9iamVjdHMuIFRoZSBtYXAgd2lsbCBjb250YWluIG9ubHkgdGhlXG4gICAqIHNvdXJjZSBmaWxlcyB0aGF0IGhhZCBzd2l0Y2ggbWFya2VycywgYW5kIHRoZSBhbmFseXNpcyB3aWxsIGNvbnRhaW4gYW4gYXJyYXkgb2ZcbiAgICogdGhlIGRlY2xhcmF0aW9ucyBpbiB0aGF0IHNvdXJjZSBmaWxlIHRoYXQgY29udGFpbiB0aGUgbWFya2VyLlxuICAgKi9cbiAgYW5hbHl6ZVByb2dyYW0ocHJvZ3JhbTogdHMuUHJvZ3JhbSk6IFN3aXRjaE1hcmtlckFuYWx5c2VzIHtcbiAgICBjb25zdCBhbmFseXplZEZpbGVzID0gbmV3IFN3aXRjaE1hcmtlckFuYWx5c2VzKCk7XG4gICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZvckVhY2goc291cmNlRmlsZSA9PiB7XG4gICAgICBjb25zdCBkZWNsYXJhdGlvbnMgPSB0aGlzLmhvc3QuZ2V0U3dpdGNoYWJsZURlY2xhcmF0aW9ucyhzb3VyY2VGaWxlKTtcbiAgICAgIGlmIChkZWNsYXJhdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgIGFuYWx5emVkRmlsZXMuc2V0KHNvdXJjZUZpbGUsIHtzb3VyY2VGaWxlLCBkZWNsYXJhdGlvbnN9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gYW5hbHl6ZWRGaWxlcztcbiAgfVxufVxuIl19