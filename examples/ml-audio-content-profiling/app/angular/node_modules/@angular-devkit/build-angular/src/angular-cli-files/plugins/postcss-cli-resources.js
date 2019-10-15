"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const loader_utils_1 = require("loader-utils");
const path = require("path");
const postcss = require("postcss");
const url = require("url");
function wrapUrl(url) {
    let wrappedUrl;
    const hasSingleQuotes = url.indexOf('\'') >= 0;
    if (hasSingleQuotes) {
        wrappedUrl = `"${url}"`;
    }
    else {
        wrappedUrl = `'${url}'`;
    }
    return `url(${wrappedUrl})`;
}
async function resolve(file, base, resolver) {
    try {
        return await resolver('./' + file, base);
    }
    catch (_a) {
        return resolver(file, base);
    }
}
exports.default = postcss.plugin('postcss-cli-resources', (options) => {
    const { deployUrl = '', baseHref = '', filename, loader, } = options;
    const dedupeSlashes = (url) => url.replace(/\/\/+/g, '/');
    const process = async (inputUrl, context, resourceCache) => {
        // If root-relative, absolute or protocol relative url, leave as is
        if (/^((?:\w+:)?\/\/|data:|chrome:|#)/.test(inputUrl)) {
            return inputUrl;
        }
        // If starts with a caret, remove and return remainder
        // this supports bypassing asset processing
        if (inputUrl.startsWith('^')) {
            return inputUrl.substr(1);
        }
        const cacheKey = path.resolve(context, inputUrl);
        const cachedUrl = resourceCache.get(cacheKey);
        if (cachedUrl) {
            return cachedUrl;
        }
        if (inputUrl.startsWith('~')) {
            inputUrl = inputUrl.substr(1);
        }
        if (inputUrl.startsWith('/')) {
            let outputUrl = '';
            if (deployUrl.match(/:\/\//) || deployUrl.startsWith('/')) {
                // If deployUrl is absolute or root relative, ignore baseHref & use deployUrl as is.
                outputUrl = `${deployUrl.replace(/\/$/, '')}${inputUrl}`;
            }
            else if (baseHref.match(/:\/\//)) {
                // If baseHref contains a scheme, include it as is.
                outputUrl = baseHref.replace(/\/$/, '') + dedupeSlashes(`/${deployUrl}/${inputUrl}`);
            }
            else {
                // Join together base-href, deploy-url and the original URL.
                outputUrl = dedupeSlashes(`/${baseHref}/${deployUrl}/${inputUrl}`);
            }
            resourceCache.set(cacheKey, outputUrl);
            return outputUrl;
        }
        const { pathname, hash, search } = url.parse(inputUrl.replace(/\\/g, '/'));
        const resolver = (file, base) => new Promise((resolve, reject) => {
            loader.resolve(base, file, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
        const result = await resolve(pathname, context, resolver);
        return new Promise((resolve, reject) => {
            loader.fs.readFile(result, (err, content) => {
                if (err) {
                    reject(err);
                    return;
                }
                const outputPath = loader_utils_1.interpolateName({ resourcePath: result }, filename, { content });
                loader.addDependency(result);
                loader.emitFile(outputPath, content, undefined);
                let outputUrl = outputPath.replace(/\\/g, '/');
                if (hash || search) {
                    outputUrl = url.format({ pathname: outputUrl, hash, search });
                }
                if (deployUrl && loader.loaders[loader.loaderIndex].options.ident !== 'extracted') {
                    outputUrl = url.resolve(deployUrl, outputUrl);
                }
                resourceCache.set(cacheKey, outputUrl);
                resolve(outputUrl);
            });
        });
    };
    return (root) => {
        const urlDeclarations = [];
        root.walkDecls(decl => {
            if (decl.value && decl.value.includes('url')) {
                urlDeclarations.push(decl);
            }
        });
        if (urlDeclarations.length === 0) {
            return;
        }
        const resourceCache = new Map();
        return Promise.all(urlDeclarations.map(async (decl) => {
            const value = decl.value;
            const urlRegex = /url\(\s*(?:"([^"]+)"|'([^']+)'|(.+?))\s*\)/g;
            const segments = [];
            let match;
            let lastIndex = 0;
            let modified = false;
            // We want to load it relative to the file that imports
            const context = path.dirname(decl.source.input.file);
            // tslint:disable-next-line:no-conditional-assignment
            while (match = urlRegex.exec(value)) {
                const originalUrl = match[1] || match[2] || match[3];
                let processedUrl;
                try {
                    processedUrl = await process(originalUrl, context, resourceCache);
                }
                catch (err) {
                    loader.emitError(decl.error(err.message, { word: originalUrl }).toString());
                    continue;
                }
                if (lastIndex < match.index) {
                    segments.push(value.slice(lastIndex, match.index));
                }
                if (!processedUrl || originalUrl === processedUrl) {
                    segments.push(match[0]);
                }
                else {
                    segments.push(wrapUrl(processedUrl));
                    modified = true;
                }
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < value.length) {
                segments.push(value.slice(lastIndex));
            }
            if (modified) {
                decl.value = segments.join('');
            }
        }));
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGNzcy1jbGktcmVzb3VyY2VzLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9hbmd1bGFyLWNsaS1maWxlcy9wbHVnaW5zL3Bvc3Rjc3MtY2xpLXJlc291cmNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUErQztBQUMvQyw2QkFBNkI7QUFDN0IsbUNBQW1DO0FBQ25DLDJCQUEyQjtBQUczQixTQUFTLE9BQU8sQ0FBQyxHQUFXO0lBQzFCLElBQUksVUFBVSxDQUFDO0lBQ2YsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFL0MsSUFBSSxlQUFlLEVBQUU7UUFDbkIsVUFBVSxHQUFHLElBQUksR0FBRyxHQUFHLENBQUM7S0FDekI7U0FBTTtRQUNMLFVBQVUsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDO0tBQ3pCO0lBRUQsT0FBTyxPQUFPLFVBQVUsR0FBRyxDQUFDO0FBQzlCLENBQUM7QUFTRCxLQUFLLFVBQVUsT0FBTyxDQUNwQixJQUFZLEVBQ1osSUFBWSxFQUNaLFFBQXlEO0lBRXpELElBQUk7UUFDRixPQUFPLE1BQU0sUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDMUM7SUFBQyxXQUFNO1FBQ04sT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzdCO0FBQ0gsQ0FBQztBQUVELGtCQUFlLE9BQU8sQ0FBQyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxPQUFtQyxFQUFFLEVBQUU7SUFDN0YsTUFBTSxFQUNKLFNBQVMsR0FBRyxFQUFFLEVBQ2QsUUFBUSxHQUFHLEVBQUUsRUFDYixRQUFRLEVBQ1IsTUFBTSxHQUNQLEdBQUcsT0FBTyxDQUFDO0lBRVosTUFBTSxhQUFhLEdBQUcs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b3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBpbnRlcnBvbGF0ZU5hbWUgfSBmcm9tICdsb2FkZXItdXRpbHMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHBvc3Rjc3MgZnJvbSAncG9zdGNzcyc7XG5pbXBvcnQgKiBhcyB1cmwgZnJvbSAndXJsJztcbmltcG9ydCAqIGFzIHdlYnBhY2sgZnJvbSAnd2VicGFjayc7XG5cbmZ1bmN0aW9uIHdyYXBVcmwodXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgd3JhcHBlZFVybDtcbiAgY29uc3QgaGFzU2luZ2xlUXVvdGVzID0gdXJsLmluZGV4T2YoJ1xcJycpID49IDA7XG5cbiAgaWYgKGhhc1NpbmdsZVF1b3Rlcykge1xuICAgIHdyYXBwZWRVcmwgPSBgXCIke3VybH1cImA7XG4gIH0gZWxzZSB7XG4gICAgd3JhcHBlZFVybCA9IGAnJHt1cmx9J2A7XG4gIH1cblxuICByZXR1cm4gYHVybCgke3dyYXBwZWRVcmx9KWA7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUG9zdGNzc0NsaVJlc291cmNlc09wdGlvbnMge1xuICBiYXNlSHJlZj86IHN0cmluZztcbiAgZGVwbG95VXJsPzogc3RyaW5nO1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICBsb2FkZXI6IHdlYnBhY2subG9hZGVyLkxvYWRlckNvbnRleHQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmUoXG4gIGZpbGU6IHN0cmluZyxcbiAgYmFzZTogc3RyaW5nLFxuICByZXNvbHZlcjogKGZpbGU6IHN0cmluZywgYmFzZTogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4sXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCByZXNvbHZlcignLi8nICsgZmlsZSwgYmFzZSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiByZXNvbHZlcihmaWxlLCBiYXNlKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBwb3N0Y3NzLnBsdWdpbigncG9zdGNzcy1jbGktcmVzb3VyY2VzJywgKG9wdGlvbnM6IFBvc3Rjc3NDbGlSZXNvdXJjZXNPcHRpb25zKSA9PiB7XG4gIGNvbnN0IHtcbiAgICBkZXBsb3lVcmwgPSAnJyxcbiAgICBiYXNlSHJlZiA9ICcnLFxuICAgIGZpbGVuYW1lLFxuICAgIGxvYWRlcixcbiAgfSA9IG9wdGlvbnM7XG5cbiAgY29uc3QgZGVkdXBlU2xhc2hlcyA9ICh1cmw6IHN0cmluZykgPT4gdXJsLnJlcGxhY2UoL1xcL1xcLysvZywgJy8nKTtcblxuICBjb25zdCBwcm9jZXNzID0gYXN5bmMgKGlucHV0VXJsOiBzdHJpbmcsIGNvbnRleHQ6IHN0cmluZywgcmVzb3VyY2VDYWNoZTogTWFwPHN0cmluZywgc3RyaW5nPikgPT4ge1xuICAgIC8vIElmIHJvb3QtcmVsYXRpdmUsIGFic29sdXRlIG9yIHByb3RvY29sIHJlbGF0aXZlIHVybCwgbGVhdmUgYXMgaXNcbiAgICBpZiAoL14oKD86XFx3KzopP1xcL1xcL3xkYXRhOnxjaHJvbWU6fCMpLy50ZXN0KGlucHV0VXJsKSkge1xuICAgICAgcmV0dXJuIGlucHV0VXJsO1xuICAgIH1cblxuICAgIC8vIElmIHN0YXJ0cyB3aXRoIGEgY2FyZXQsIHJlbW92ZSBhbmQgcmV0dXJuIHJlbWFpbmRlclxuICAgIC8vIHRoaXMgc3VwcG9ydHMgYnlwYXNzaW5nIGFzc2V0IHByb2Nlc3NpbmdcbiAgICBpZiAoaW5wdXRVcmwuc3RhcnRzV2l0aCgnXicpKSB7XG4gICAgICByZXR1cm4gaW5wdXRVcmwuc3Vic3RyKDEpO1xuICAgIH1cblxuICAgIGNvbnN0IGNhY2hlS2V5ID0gcGF0aC5yZXNvbHZlKGNvbnRleHQsIGlucHV0VXJsKTtcbiAgICBjb25zdCBjYWNoZWRVcmwgPSByZXNvdXJjZUNhY2hlLmdldChjYWNoZUtleSk7XG4gICAgaWYgKGNhY2hlZFVybCkge1xuICAgICAgcmV0dXJuIGNhY2hlZFVybDtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXRVcmwuc3RhcnRzV2l0aCgnficpKSB7XG4gICAgICBpbnB1dFVybCA9IGlucHV0VXJsLnN1YnN0cigxKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXRVcmwuc3RhcnRzV2l0aCgnLycpKSB7XG4gICAgICBsZXQgb3V0cHV0VXJsID0gJyc7XG4gICAgICBpZiAoZGVwbG95VXJsLm1hdGNoKC86XFwvXFwvLykgfHwgZGVwbG95VXJsLnN0YXJ0c1dpdGgoJy8nKSkge1xuICAgICAgICAvLyBJZiBkZXBsb3lVcmwgaXMgYWJzb2x1dGUgb3Igcm9vdCByZWxhdGl2ZSwgaWdub3JlIGJhc2VIcmVmICYgdXNlIGRlcGxveVVybCBhcyBpcy5cbiAgICAgICAgb3V0cHV0VXJsID0gYCR7ZGVwbG95VXJsLnJlcGxhY2UoL1xcLyQvLCAnJyl9JHtpbnB1dFVybH1gO1xuICAgICAgfSBlbHNlIGlmIChiYXNlSHJlZi5tYXRjaCgvOlxcL1xcLy8pKSB7XG4gICAgICAgIC8vIElmIGJhc2VIcmVmIGNvbnRhaW5zIGEgc2NoZW1lLCBpbmNsdWRlIGl0IGFzIGlzLlxuICAgICAgICBvdXRwdXRVcmwgPSBiYXNlSHJlZi5yZXBsYWNlKC9cXC8kLywgJycpICsgZGVkdXBlU2xhc2hlcyhgLyR7ZGVwbG95VXJsfS8ke2lucHV0VXJsfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSm9pbiB0b2dldGhlciBiYXNlLWhyZWYsIGRlcGxveS11cmwgYW5kIHRoZSBvcmlnaW5hbCBVUkwuXG4gICAgICAgIG91dHB1dFVybCA9IGRlZHVwZVNsYXNoZXMoYC8ke2Jhc2VIcmVmfS8ke2RlcGxveVVybH0vJHtpbnB1dFVybH1gKTtcbiAgICAgIH1cblxuICAgICAgcmVzb3VyY2VDYWNoZS5zZXQoY2FjaGVLZXksIG91dHB1dFVybCk7XG5cbiAgICAgIHJldHVybiBvdXRwdXRVcmw7XG4gICAgfVxuXG4gICAgY29uc3QgeyBwYXRobmFtZSwgaGFzaCwgc2VhcmNoIH0gPSB1cmwucGFyc2UoaW5wdXRVcmwucmVwbGFjZSgvXFxcXC9nLCAnLycpKTtcbiAgICBjb25zdCByZXNvbHZlciA9IChmaWxlOiBzdHJpbmcsIGJhc2U6IHN0cmluZykgPT4gbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsb2FkZXIucmVzb2x2ZShiYXNlLCBmaWxlLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzb2x2ZShwYXRobmFtZSBhcyBzdHJpbmcsIGNvbnRleHQsIHJlc29sdmVyKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxvYWRlci5mcy5yZWFkRmlsZShyZXN1bHQsIChlcnI6IEVycm9yLCBjb250ZW50OiBCdWZmZXIpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3V0cHV0UGF0aCA9IGludGVycG9sYXRlTmFtZShcbiAgICAgICAgICB7IHJlc291cmNlUGF0aDogcmVzdWx0IH0gYXMgd2VicGFjay5sb2FkZXIuTG9hZGVyQ29udGV4dCxcbiAgICAgICAgICBmaWxlbmFtZSxcbiAgICAgICAgICB7IGNvbnRlbnQgfSxcbiAgICAgICAgKTtcblxuICAgICAgICBsb2FkZXIuYWRkRGVwZW5kZW5jeShyZXN1bHQpO1xuICAgICAgICBsb2FkZXIuZW1pdEZpbGUob3V0cHV0UGF0aCwgY29udGVudCwgdW5kZWZpbmVkKTtcblxuICAgICAgICBsZXQgb3V0cHV0VXJsID0gb3V0cHV0UGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgICAgIGlmIChoYXNoIHx8IHNlYXJjaCkge1xuICAgICAgICAgIG91dHB1dFVybCA9IHVybC5mb3JtYXQoeyBwYXRobmFtZTogb3V0cHV0VXJsLCBoYXNoLCBzZWFyY2ggfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVwbG95VXJsICYmIGxvYWRlci5sb2FkZXJzW2xvYWRlci5sb2FkZXJJbmRleF0ub3B0aW9ucy5pZGVudCAhPT0gJ2V4dHJhY3RlZCcpIHtcbiAgICAgICAgICBvdXRwdXRVcmwgPSB1cmwucmVzb2x2ZShkZXBsb3lVcmwsIG91dHB1dFVybCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNvdXJjZUNhY2hlLnNldChjYWNoZUtleSwgb3V0cHV0VXJsKTtcbiAgICAgICAgcmVzb2x2ZShvdXRwdXRVcmwpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIChyb290KSA9PiB7XG4gICAgY29uc3QgdXJsRGVjbGFyYXRpb25zOiBBcnJheTxwb3N0Y3NzLkRlY2xhcmF0aW9uPiA9IFtdO1xuICAgIHJvb3Qud2Fsa0RlY2xzKGRlY2wgPT4ge1xuICAgICAgaWYgKGRlY2wudmFsdWUgJiYgZGVjbC52YWx1ZS5pbmNsdWRlcygndXJsJykpIHtcbiAgICAgICAgdXJsRGVjbGFyYXRpb25zLnB1c2goZGVjbCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAodXJsRGVjbGFyYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc291cmNlQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHVybERlY2xhcmF0aW9ucy5tYXAoYXN5bmMgZGVjbCA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGRlY2wudmFsdWU7XG4gICAgICBjb25zdCB1cmxSZWdleCA9IC91cmxcXChcXHMqKD86XCIoW15cIl0rKVwifCcoW14nXSspJ3woLis/KSlcXHMqXFwpL2c7XG4gICAgICBjb25zdCBzZWdtZW50czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgbGV0IG1hdGNoO1xuICAgICAgbGV0IGxhc3RJbmRleCA9IDA7XG4gICAgICBsZXQgbW9kaWZpZWQgPSBmYWxzZTtcblxuICAgICAgLy8gV2Ugd2FudCB0byBsb2FkIGl0IHJlbGF0aXZlIHRvIHRoZSBmaWxlIHRoYXQgaW1wb3J0c1xuICAgICAgY29uc3QgY29udGV4dCA9IHBhdGguZGlybmFtZShkZWNsLnNvdXJjZS5pbnB1dC5maWxlKTtcblxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbmRpdGlvbmFsLWFzc2lnbm1lbnRcbiAgICAgIHdoaWxlIChtYXRjaCA9IHVybFJlZ2V4LmV4ZWModmFsdWUpKSB7XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsVXJsID0gbWF0Y2hbMV0gfHwgbWF0Y2hbMl0gfHwgbWF0Y2hbM107XG4gICAgICAgIGxldCBwcm9jZXNzZWRVcmw7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcHJvY2Vzc2VkVXJsID0gYXdhaXQgcHJvY2VzcyhvcmlnaW5hbFVybCwgY29udGV4dCwgcmVzb3VyY2VDYWNoZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGxvYWRlci5lbWl0RXJyb3IoZGVjbC5lcnJvcihlcnIubWVzc2FnZSwgeyB3b3JkOiBvcmlnaW5hbFVybCB9KS50b1N0cmluZygpKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsYXN0SW5kZXggPCBtYXRjaC5pbmRleCkge1xuICAgICAgICAgIHNlZ21lbnRzLnB1c2godmFsdWUuc2xpY2UobGFzdEluZGV4LCBtYXRjaC5pbmRleCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwcm9jZXNzZWRVcmwgfHwgb3JpZ2luYWxVcmwgPT09IHByb2Nlc3NlZFVybCkge1xuICAgICAgICAgIHNlZ21lbnRzLnB1c2gobWF0Y2hbMF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlZ21lbnRzLnB1c2god3JhcFVybChwcm9jZXNzZWRVcmwpKTtcbiAgICAgICAgICBtb2RpZmllZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBsYXN0SW5kZXggPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgaWYgKGxhc3RJbmRleCA8IHZhbHVlLmxlbmd0aCkge1xuICAgICAgICBzZWdtZW50cy5wdXNoKHZhbHVlLnNsaWNlKGxhc3RJbmRleCkpO1xuICAgICAgfVxuXG4gICAgICBpZiAobW9kaWZpZWQpIHtcbiAgICAgICAgZGVjbC52YWx1ZSA9IHNlZ21lbnRzLmpvaW4oJycpO1xuICAgICAgfVxuICAgIH0pKTtcbiAgfTtcbn0pO1xuIl19