"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const crypto_1 = require("crypto");
const webpack_sources_1 = require("webpack-sources");
const parse5 = require('parse5');
function readFile(filename, compilation) {
    return new Promise((resolve, reject) => {
        compilation.inputFileSystem.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            let content;
            if (data.length >= 3 && data[0] === 0xEF && data[1] === 0xBB && data[2] === 0xBF) {
                // Strip UTF-8 BOM
                content = data.toString('utf8', 3);
            }
            else if (data.length >= 2 && data[0] === 0xFF && data[1] === 0xFE) {
                // Strip UTF-16 LE BOM
                content = data.toString('utf16le', 2);
            }
            else {
                content = data.toString();
            }
            resolve(content);
        });
    });
}
class IndexHtmlWebpackPlugin {
    constructor(options) {
        this._options = Object.assign({ input: 'index.html', output: 'index.html', entrypoints: ['polyfills', 'main'], sri: false }, options);
    }
    apply(compiler) {
        compiler.hooks.emit.tapPromise('index-html-webpack-plugin', async (compilation) => {
            // Get input html file
            const inputContent = await readFile(this._options.input, compilation);
            compilation
                .fileDependencies.add(this._options.input);
            // Get all files for selected entrypoints
            let unfilteredSortedFiles = [];
            for (const entryName of this._options.entrypoints) {
                const entrypoint = compilation.entrypoints.get(entryName);
                if (entrypoint && entrypoint.getFiles) {
                    unfilteredSortedFiles = unfilteredSortedFiles.concat(entrypoint.getFiles() || []);
                }
            }
            // Filter files
            const existingFiles = new Set();
            const stylesheets = [];
            const scripts = [];
            for (const file of unfilteredSortedFiles) {
                if (existingFiles.has(file)) {
                    continue;
                }
                existingFiles.add(file);
                if (file.endsWith('.js')) {
                    scripts.push(file);
                }
                else if (file.endsWith('.css')) {
                    stylesheets.push(file);
                }
            }
            // Find the head and body elements
            const treeAdapter = parse5.treeAdapters.default;
            const document = parse5.parse(inputContent, { treeAdapter, locationInfo: true });
            let headElement;
            let bodyElement;
            for (const docChild of document.childNodes) {
                if (docChild.tagName === 'html') {
                    for (const htmlChild of docChild.childNodes) {
                        if (htmlChild.tagName === 'head') {
                            headElement = htmlChild;
                        }
                        if (htmlChild.tagName === 'body') {
                            bodyElement = htmlChild;
                        }
                    }
                }
            }
            if (!headElement || !bodyElement) {
                throw new Error('Missing head and/or body elements');
            }
            // Determine script insertion point
            let scriptInsertionPoint;
            if (bodyElement.__location && bodyElement.__location.endTag) {
                scriptInsertionPoint = bodyElement.__location.endTag.startOffset;
            }
            else {
                // Less accurate fallback
                // parse5 4.x does not provide locations if malformed html is present
                scriptInsertionPoint = inputContent.indexOf('</body>');
            }
            let styleInsertionPoint;
            if (headElement.__location && headElement.__location.endTag) {
                styleInsertionPoint = headElement.__location.endTag.startOffset;
            }
            else {
                // Less accurate fallback
                // parse5 4.x does not provide locations if malformed html is present
                styleInsertionPoint = inputContent.indexOf('</head>');
            }
            // Inject into the html
            const indexSource = new webpack_sources_1.ReplaceSource(new webpack_sources_1.RawSource(inputContent), this._options.input);
            const scriptElements = treeAdapter.createDocumentFragment();
            for (const script of scripts) {
                const attrs = [
                    { name: 'type', value: 'text/javascript' },
                    { name: 'src', value: (this._options.deployUrl || '') + script },
                ];
                if (this._options.sri) {
                    const content = compilation.assets[script].source();
                    attrs.push(...this._generateSriAttributes(content));
                }
                const element = treeAdapter.createElement('script', undefined, attrs);
                treeAdapter.appendChild(scriptElements, element);
            }
            indexSource.insert(scriptInsertionPoint, parse5.serialize(scriptElements, { treeAdapter }));
            // Adjust base href if specified
            if (typeof this._options.baseHref == 'string') {
                let baseElement;
                for (const headChild of headElement.childNodes) {
                    if (headChild.tagName === 'base') {
                        baseElement = headChild;
                    }
                }
                const baseFragment = treeAdapter.createDocumentFragment();
                if (!baseElement) {
                    baseElement = treeAdapter.createElement('base', undefined, [
                        { name: 'href', value: this._options.baseHref },
                    ]);
                    treeAdapter.appendChild(baseFragment, baseElement);
                    indexSource.insert(headElement.__location.startTag.endOffset + 1, parse5.serialize(baseFragment, { treeAdapter }));
                }
                else {
                    let hrefAttribute;
                    for (const attribute of baseElement.attrs) {
                        if (attribute.name === 'href') {
                            hrefAttribute = attribute;
                        }
                    }
                    if (hrefAttribute) {
                        hrefAttribute.value = this._options.baseHref;
                    }
                    else {
                        baseElement.attrs.push({ name: 'href', value: this._options.baseHref });
                    }
                    treeAdapter.appendChild(baseFragment, baseElement);
                    indexSource.replace(baseElement.__location.startOffset, baseElement.__location.endOffset, parse5.serialize(baseFragment, { treeAdapter }));
                }
            }
            const styleElements = treeAdapter.createDocumentFragment();
            for (const stylesheet of stylesheets) {
                const attrs = [
                    { name: 'rel', value: 'stylesheet' },
                    { name: 'href', value: (this._options.deployUrl || '') + stylesheet },
                ];
                if (this._options.sri) {
                    const content = compilation.assets[stylesheet].source();
                    attrs.push(...this._generateSriAttributes(content));
                }
                const element = treeAdapter.createElement('link', undefined, attrs);
                treeAdapter.appendChild(styleElements, element);
            }
            indexSource.insert(styleInsertionPoint, parse5.serialize(styleElements, { treeAdapter }));
            // Add to compilation assets
            compilation.assets[this._options.output] = indexSource;
        });
    }
    _generateSriAttributes(content) {
        const algo = 'sha384';
        const hash = crypto_1.createHash(algo)
            .update(content, 'utf8')
            .digest('base64');
        return [
            { name: 'integrity', value: `${algo}-${hash}` },
            { name: 'crossorigin', value: 'anonymous' },
        ];
    }
}
exports.IndexHtmlWebpackPlugin = IndexHtmlWebpackPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgtaHRtbC13ZWJwYWNrLXBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYW5ndWxhci1jbGktZmlsZXMvcGx1Z2lucy9pbmRleC1odG1sLXdlYnBhY2stcGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsbUNBQW9DO0FBRXBDLHFEQUEyRDtBQUUzRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFXakMsU0FBUyxRQUFRLENBQUMsUUFBZ0IsRUFBRSxXQUFvQztJQUN0RSxPQUFPLElBQUksT0FBTyxDQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQzdDLFdBQVcsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQVUsRUFBRSxJQUFZLEVBQUUsRUFBRTtZQUMxRSxJQUFJLEdBQUcsRUFBRTtnQkFDUCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBRVosT0FBTzthQUNSO1lBRUQsSUFBSSxPQUFPLENBQUM7WUFDWixJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNoRixrQkFBa0I7Z0JBQ2xCLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQzthQUNwQztpQkFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDbkUsc0JBQXNC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USxDQUFDO1FBQ3RCLE1BQU0sSUFBSSxHQUFHLG1CQUFVLENBQUMsSUFBSSxDQUFDO2FBQzFCLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDO2FBQ3ZCLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVwQixPQUFPO1lBQ0wsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksSUFBSSxJQUFJLEVBQUUsRUFBRTtZQUMvQyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTtTQUM1QyxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBck1ELHdEQXFNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IGNyZWF0ZUhhc2ggfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0IHsgQ29tcGlsZXIsIGNvbXBpbGF0aW9uIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBSYXdTb3VyY2UsIFJlcGxhY2VTb3VyY2UgfSBmcm9tICd3ZWJwYWNrLXNvdXJjZXMnO1xuXG5jb25zdCBwYXJzZTUgPSByZXF1aXJlKCdwYXJzZTUnKTtcblxuZXhwb3J0IGludGVyZmFjZSBJbmRleEh0bWxXZWJwYWNrUGx1Z2luT3B0aW9ucyB7XG4gIGlucHV0OiBzdHJpbmc7XG4gIG91dHB1dDogc3RyaW5nO1xuICBiYXNlSHJlZj86IHN0cmluZztcbiAgZW50cnlwb2ludHM6IHN0cmluZ1tdO1xuICBkZXBsb3lVcmw/OiBzdHJpbmc7XG4gIHNyaTogYm9vbGVhbjtcbn1cblxuZnVuY3Rpb24gcmVhZEZpbGUoZmlsZW5hbWU6IHN0cmluZywgY29tcGlsYXRpb246IGNvbXBpbGF0aW9uLkNvbXBpbGF0aW9uKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbXBpbGF0aW9uLmlucHV0RmlsZVN5c3RlbS5yZWFkRmlsZShmaWxlbmFtZSwgKGVycjogRXJyb3IsIGRhdGE6IEJ1ZmZlcikgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZWplY3QoZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGxldCBjb250ZW50O1xuICAgICAgaWYgKGRhdGEubGVuZ3RoID49IDMgJiYgZGF0YVswXSA9PT0gMHhFRiAmJiBkYXRhWzFdID09PSAweEJCICYmIGRhdGFbMl0gPT09IDB4QkYpIHtcbiAgICAgICAgLy8gU3RyaXAgVVRGLTggQk9NXG4gICAgICAgIGNvbnRlbnQgPSBkYXRhLnRvU3RyaW5nKCd1dGY4JywgMyk7XG4gICAgICB9IGVsc2UgaWYgKGRhdGEubGVuZ3RoID49IDIgJiYgZGF0YVswXSA9PT0gMHhGRiAmJiBkYXRhWzFdID09PSAweEZFKSB7XG4gICAgICAgIC8vIFN0cmlwIFVURi0xNiBMRSBCT01cbiAgICAgICAgY29udGVudCA9IGRhdGEudG9TdHJpbmcoJ3V0ZjE2bGUnLCAyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRlbnQgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoY29udGVudCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgSW5kZXhIdG1sV2VicGFja1BsdWdpbiB7XG4gIHByaXZhdGUgX29wdGlvbnM6IEluZGV4SHRtbFdlYnBhY2tQbHVnaW5PcHRpb25zO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBQYXJ0aWFsPEluZGV4SHRtbFdlYnBhY2tQbHVnaW5PcHRpb25zPikge1xuICAgIHRoaXMuX29wdGlvbnMgPSB7XG4gICAgICBpbnB1dDogJ2luZGV4Lmh0bWwnLFxuICAgICAgb3V0cHV0OiAnaW5kZXguaHRtbCcsXG4gICAgICBlbnRyeXBvaW50czogWydwb2x5ZmlsbHMnLCAnbWFpbiddLFxuICAgICAgc3JpOiBmYWxzZSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfTtcbiAgfVxuXG4gIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgIGNvbXBpbGVyLmhvb2tzLmVtaXQudGFwUHJvbWlzZSgnaW5kZXgtaHRtbC13ZWJwYWNrLXBsdWdpbicsIGFzeW5jIGNvbXBpbGF0aW9uID0+IHtcbiAgICAgIC8vIEdldCBpbnB1dCBodG1sIGZpbGVcbiAgICAgIGNvbnN0IGlucHV0Q29udGVudCA9IGF3YWl0IHJlYWRGaWxlKHRoaXMuX29wdGlvbnMuaW5wdXQsIGNvbXBpbGF0aW9uKTtcbiAgICAgIChjb21waWxhdGlvbiBhcyBjb21waWxhdGlvbi5Db21waWxhdGlvbiAmIHsgZmlsZURlcGVuZGVuY2llczogU2V0PHN0cmluZz4gfSlcbiAgICAgICAgLmZpbGVEZXBlbmRlbmNpZXMuYWRkKHRoaXMuX29wdGlvbnMuaW5wdXQpO1xuXG5cbiAgICAgIC8vIEdldCBhbGwgZmlsZXMgZm9yIHNlbGVjdGVkIGVudHJ5cG9pbnRzXG4gICAgICBsZXQgdW5maWx0ZXJlZFNvcnRlZEZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgZm9yIChjb25zdCBlbnRyeU5hbWUgb2YgdGhpcy5fb3B0aW9ucy5lbnRyeXBvaW50cykge1xuICAgICAgICBjb25zdCBlbnRyeXBvaW50ID0gY29tcGlsYXRpb24uZW50cnlwb2ludHMuZ2V0KGVudHJ5TmFtZSk7XG4gICAgICAgIGlmIChlbnRyeXBvaW50ICYmIGVudHJ5cG9pbnQuZ2V0RmlsZXMpIHtcbiAgICAgICAgICB1bmZpbHRlcmVkU29ydGVkRmlsZXMgPSB1bmZpbHRlcmVkU29ydGVkRmlsZXMuY29uY2F0KGVudHJ5cG9pbnQuZ2V0RmlsZXMoKSB8fCBbXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRmlsdGVyIGZpbGVzXG4gICAgICBjb25zdCBleGlzdGluZ0ZpbGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBjb25zdCBzdHlsZXNoZWV0czogc3RyaW5nW10gPSBbXTtcbiAgICAgIGNvbnN0IHNjcmlwdHM6IHN0cmluZ1tdID0gW107XG4gICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgdW5maWx0ZXJlZFNvcnRlZEZpbGVzKSB7XG4gICAgICAgIGlmIChleGlzdGluZ0ZpbGVzLmhhcyhmaWxlKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGV4aXN0aW5nRmlsZXMuYWRkKGZpbGUpO1xuXG4gICAgICAgIGlmIChmaWxlLmVuZHNXaXRoKCcuanMnKSkge1xuICAgICAgICAgIHNjcmlwdHMucHVzaChmaWxlKTtcbiAgICAgICAgfSBlbHNlIGlmIChmaWxlLmVuZHNXaXRoKCcuY3NzJykpIHtcbiAgICAgICAgICBzdHlsZXNoZWV0cy5wdXNoKGZpbGUpO1xuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgLy8gRmluZCB0aGUgaGVhZCBhbmQgYm9keSBlbGVtZW50c1xuICAgICAgY29uc3QgdHJlZUFkYXB0ZXIgPSBwYXJzZTUudHJlZUFkYXB0ZXJzLmRlZmF1bHQ7XG4gICAgICBjb25zdCBkb2N1bWVudCA9IHBhcnNlNS5wYXJzZShpbnB1dENvbnRlbnQsIHsgdHJlZUFkYXB0ZXIsIGxvY2F0aW9uSW5mbzogdHJ1ZSB9KTtcbiAgICAgIGxldCBoZWFkRWxlbWVudDtcbiAgICAgIGxldCBib2R5RWxlbWVudDtcbiAgICAgIGZvciAoY29uc3QgZG9jQ2hpbGQgb2YgZG9jdW1lbnQuY2hpbGROb2Rlcykge1xuICAgICAgICBpZiAoZG9jQ2hpbGQudGFnTmFtZSA9PT0gJ2h0bWwnKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBodG1sQ2hpbGQgb2YgZG9jQ2hpbGQuY2hpbGROb2Rlcykge1xuICAgICAgICAgICAgaWYgKGh0bWxDaGlsZC50YWdOYW1lID09PSAnaGVhZCcpIHtcbiAgICAgICAgICAgICAgaGVhZEVsZW1lbnQgPSBodG1sQ2hpbGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaHRtbENoaWxkLnRhZ05hbWUgPT09ICdib2R5Jykge1xuICAgICAgICAgICAgICBib2R5RWxlbWVudCA9IGh0bWxDaGlsZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFoZWFkRWxlbWVudCB8fCAhYm9keUVsZW1lbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIGhlYWQgYW5kL29yIGJvZHkgZWxlbWVudHMnKTtcbiAgICAgIH1cblxuICAgICAgLy8gRGV0ZXJtaW5lIHNjcmlwdCBpbnNlcnRpb24gcG9pbnRcbiAgICAgIGxldCBzY3JpcHRJbnNlcnRpb25Qb2ludDtcbiAgICAgIGlmIChib2R5RWxlbWVudC5fX2xvY2F0aW9uICYmIGJvZHlFbGVtZW50Ll9fbG9jYXRpb24uZW5kVGFnKSB7XG4gICAgICAgIHNjcmlwdEluc2VydGlvblBvaW50ID0gYm9keUVsZW1lbnQuX19sb2NhdGlvbi5lbmRUYWcuc3RhcnRPZmZzZXQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBMZXNzIGFjY3VyYXRlIGZhbGxiYWNrXG4gICAgICAgIC8vIHBhcnNlNSA0LnggZG9lcyBub3QgcHJvdmlkZSBsb2NhdGlvbnMgaWYgbWFsZm9ybWVkIGh0bWwgaXMgcHJlc2VudFxuICAgICAgICBzY3JpcHRJbnNlcnRpb25Qb2ludCA9IGlucHV0Q29udGVudC5pbmRleE9mKCc8L2JvZHk+Jyk7XG4gICAgICB9XG5cbiAgICAgIGxldCBzdHlsZUluc2VydGlvblBvaW50O1xuICAgICAgaWYgKGhlYWRFbGVtZW50Ll9fbG9jYXRpb24gJiYgaGVhZEVsZW1lbnQuX19sb2NhdGlvbi5lbmRUYWcpIHtcbiAgICAgICAgc3R5bGVJbnNlcnRpb25Qb2ludCA9IGhlYWRFbGVtZW50Ll9fbG9jYXRpb24uZW5kVGFnLnN0YXJ0T2Zmc2V0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTGVzcyBhY2N1cmF0ZSBmYWxsYmFja1xuICAgICAgICAvLyBwYXJzZTUgNC54IGRvZXMgbm90IHByb3ZpZGUgbG9jYXRpb25zIGlmIG1hbGZvcm1lZCBodG1sIGlzIHByZXNlbnRcbiAgICAgICAgc3R5bGVJbnNlcnRpb25Qb2ludCA9IGlucHV0Q29udGVudC5pbmRleE9mKCc8L2hlYWQ+Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEluamVjdCBpbnRvIHRoZSBodG1sXG4gICAgICBjb25zdCBpbmRleFNvdXJjZSA9IG5ldyBSZXBsYWNlU291cmNlKG5ldyBSYXdTb3VyY2UoaW5wdXRDb250ZW50KSwgdGhpcy5fb3B0aW9ucy5pbnB1dCk7XG5cbiAgICAgIGNvbnN0IHNjcmlwdEVsZW1lbnRzID0gdHJlZUFkYXB0ZXIuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgZm9yIChjb25zdCBzY3JpcHQgb2Ygc2NyaXB0cykge1xuICAgICAgICBjb25zdCBhdHRycyA9IFtcbiAgICAgICAgICB7IG5hbWU6ICd0eXBlJywgdmFsdWU6ICd0ZXh0L2phdmFzY3JpcHQnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnc3JjJywgdmFsdWU6ICh0aGlzLl9vcHRpb25zLmRlcGxveVVybCB8fCAnJykgKyBzY3JpcHQgfSxcbiAgICAgICAgXTtcblxuICAgICAgICBpZiAodGhpcy5fb3B0aW9ucy5zcmkpIHtcbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gY29tcGlsYXRpb24uYXNzZXRzW3NjcmlwdF0uc291cmNlKCk7XG4gICAgICAgICAgYXR0cnMucHVzaCguLi50aGlzLl9nZW5lcmF0ZVNyaUF0dHJpYnV0ZXMoY29udGVudCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZWxlbWVudCA9IHRyZWVBZGFwdGVyLmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcsIHVuZGVmaW5lZCwgYXR0cnMpO1xuICAgICAgICB0cmVlQWRhcHRlci5hcHBlbmRDaGlsZChzY3JpcHRFbGVtZW50cywgZWxlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIGluZGV4U291cmNlLmluc2VydChcbiAgICAgICAgc2NyaXB0SW5zZXJ0aW9uUG9pbnQsXG4gICAgICAgIHBhcnNlNS5zZXJpYWxpemUoc2NyaXB0RWxlbWVudHMsIHsgdHJlZUFkYXB0ZXIgfSksXG4gICAgICApO1xuXG4gICAgICAvLyBBZGp1c3QgYmFzZSBocmVmIGlmIHNwZWNpZmllZFxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9vcHRpb25zLmJhc2VIcmVmID09ICdzdHJpbmcnKSB7XG4gICAgICAgIGxldCBiYXNlRWxlbWVudDtcbiAgICAgICAgZm9yIChjb25zdCBoZWFkQ2hpbGQgb2YgaGVhZEVsZW1lbnQuY2hpbGROb2Rlcykge1xuICAgICAgICAgIGlmIChoZWFkQ2hpbGQudGFnTmFtZSA9PT0gJ2Jhc2UnKSB7XG4gICAgICAgICAgICBiYXNlRWxlbWVudCA9IGhlYWRDaGlsZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBiYXNlRnJhZ21lbnQgPSB0cmVlQWRhcHRlci5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICAgICAgaWYgKCFiYXNlRWxlbWVudCkge1xuICAgICAgICAgIGJhc2VFbGVtZW50ID0gdHJlZUFkYXB0ZXIuY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICdiYXNlJyxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgeyBuYW1lOiAnaHJlZicsIHZhbHVlOiB0aGlzLl9vcHRpb25zLmJhc2VIcmVmIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICB0cmVlQWRhcHRlci5hcHBlbmRDaGlsZChiYXNlRnJhZ21lbnQsIGJhc2VFbGVtZW50KTtcbiAgICAgICAgICBpbmRleFNvdXJjZS5pbnNlcnQoXG4gICAgICAgICAgICBoZWFkRWxlbWVudC5fX2xvY2F0aW9uLnN0YXJ0VGFnLmVuZE9mZnNldCArIDEsXG4gICAgICAgICAgICBwYXJzZTUuc2VyaWFsaXplKGJhc2VGcmFnbWVudCwgeyB0cmVlQWRhcHRlciB9KSxcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBocmVmQXR0cmlidXRlO1xuICAgICAgICAgIGZvciAoY29uc3QgYXR0cmlidXRlIG9mIGJhc2VFbGVtZW50LmF0dHJzKSB7XG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlLm5hbWUgPT09ICdocmVmJykge1xuICAgICAgICAgICAgICBocmVmQXR0cmlidXRlID0gYXR0cmlidXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaHJlZkF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgaHJlZkF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuX29wdGlvbnMuYmFzZUhyZWY7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJhc2VFbGVtZW50LmF0dHJzLnB1c2goeyBuYW1lOiAnaHJlZicsIHZhbHVlOiB0aGlzLl9vcHRpb25zLmJhc2VIcmVmIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyZWVBZGFwdGVyLmFwcGVuZENoaWxkKGJhc2VGcmFnbWVudCwgYmFzZUVsZW1lbnQpO1xuICAgICAgICAgIGluZGV4U291cmNlLnJlcGxhY2UoXG4gICAgICAgICAgICBiYXNlRWxlbWVudC5fX2xvY2F0aW9uLnN0YXJ0T2Zmc2V0LFxuICAgICAgICAgICAgYmFzZUVsZW1lbnQuX19sb2NhdGlvbi5lbmRPZmZzZXQsXG4gICAgICAgICAgICBwYXJzZTUuc2VyaWFsaXplKGJhc2VGcmFnbWVudCwgeyB0cmVlQWRhcHRlciB9KSxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0eWxlRWxlbWVudHMgPSB0cmVlQWRhcHRlci5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICBmb3IgKGNvbnN0IHN0eWxlc2hlZXQgb2Ygc3R5bGVzaGVldHMpIHtcbiAgICAgICAgY29uc3QgYXR0cnMgPSBbXG4gICAgICAgICAgeyBuYW1lOiAncmVsJywgdmFsdWU6ICdzdHlsZXNoZWV0JyB9LFxuICAgICAgICAgIHsgbmFtZTogJ2hyZWYnLCB2YWx1ZTogKHRoaXMuX29wdGlvbnMuZGVwbG95VXJsIHx8ICcnKSArIHN0eWxlc2hlZXQgfSxcbiAgICAgICAgXTtcblxuICAgICAgICBpZiAodGhpcy5fb3B0aW9ucy5zcmkpIHtcbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gY29tcGlsYXRpb24uYXNzZXRzW3N0eWxlc2hlZXRdLnNvdXJjZSgpO1xuICAgICAgICAgIGF0dHJzLnB1c2goLi4udGhpcy5fZ2VuZXJhdGVTcmlBdHRyaWJ1dGVzKGNvbnRlbnQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0cmVlQWRhcHRlci5jcmVhdGVFbGVtZW50KCdsaW5rJywgdW5kZWZpbmVkLCBhdHRycyk7XG4gICAgICAgIHRyZWVBZGFwdGVyLmFwcGVuZENoaWxkKHN0eWxlRWxlbWVudHMsIGVsZW1lbnQpO1xuICAgICAgfVxuXG4gICAgICBpbmRleFNvdXJjZS5pbnNlcnQoXG4gICAgICAgIHN0eWxlSW5zZXJ0aW9uUG9pbnQsXG4gICAgICAgIHBhcnNlNS5zZXJpYWxpemUoc3R5bGVFbGVtZW50cywgeyB0cmVlQWRhcHRlciB9KSxcbiAgICAgICk7XG5cbiAgICAgIC8vIEFkZCB0byBjb21waWxhdGlvbiBhc3NldHNcbiAgICAgIGNvbXBpbGF0aW9uLmFzc2V0c1t0aGlzLl9vcHRpb25zLm91dHB1dF0gPSBpbmRleFNvdXJjZTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX2dlbmVyYXRlU3JpQXR0cmlidXRlcyhjb250ZW50OiBzdHJpbmcpIHtcbiAgICBjb25zdCBhbGdvID0gJ3NoYTM4NCc7XG4gICAgY29uc3QgaGFzaCA9IGNyZWF0ZUhhc2goYWxnbylcbiAgICAgIC51cGRhdGUoY29udGVudCwgJ3V0ZjgnKVxuICAgICAgLmRpZ2VzdCgnYmFzZTY0Jyk7XG5cbiAgICByZXR1cm4gW1xuICAgICAgeyBuYW1lOiAnaW50ZWdyaXR5JywgdmFsdWU6IGAke2FsZ299LSR7aGFzaH1gIH0sXG4gICAgICB7IG5hbWU6ICdjcm9zc29yaWdpbicsIHZhbHVlOiAnYW5vbnltb3VzJyB9LFxuICAgIF07XG4gIH1cbn1cbiJdfQ==