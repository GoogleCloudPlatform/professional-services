"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const http = require("http");
const https = require("https");
const Url = require("url");
function request(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const u = Url.parse(url);
        const options = {
            hostname: u.hostname,
            protocol: u.protocol,
            host: u.host,
            port: u.port,
            path: u.path,
            headers: Object.assign({ 'Accept': 'text/html' }, headers),
        };
        function _callback(res) {
            if (!res.statusCode || res.statusCode >= 400) {
                // Consume the rest of the data to free memory.
                res.resume();
                reject(new Error(`Requesting "${url}" returned status code ${res.statusCode}.`));
            }
            else {
                res.setEncoding('utf8');
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        resolve(data);
                    }
                    catch (err) {
                        reject(err);
                    }
                });
            }
        }
        if (u.protocol == 'https:') {
            options.agent = new https.Agent({ rejectUnauthorized: false });
            https.get(options, _callback);
        }
        else if (u.protocol == 'http:') {
            http.get(options, _callback);
        }
        else {
            throw new Error(`Unknown protocol: ${JSON.stringify(u.protocol)}.`);
        }
    });
}
exports.request = request;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYXJjaGl0ZWN0L3Rlc3RpbmcvcmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILDZCQUE2QjtBQUM3QiwrQkFBK0I7QUFDL0IsMkJBQTJCO0FBRTNCLFNBQWdCLE9BQU8sQ0FBQyxHQUFXLEVBQUUsT0FBTyxHQUFHLEVBQUU7SUFDL0MsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLE1BQU0sT0FBTyxHQUF3QjtZQUNuQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVE7WUFDcEIsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRO1lBQ3BCLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTtZQUNaLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTtZQUNaLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTtZQUNaLE9BQU8sa0JBQUksUUFBUSxFQUFFLFdBQVcsSUFBSyxPQUFPLENBQUU7U0FDL0MsQ0FBQztRQUVGLFNBQVMsU0FBUyxDQUFDLEdBQXlCO1lBQzFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLEdBQUcsQ0FBQyxVQUFVLElBQUksR0FBRyxFQUFFO2dCQUM1QywrQ0FBK0M7Z0JBQy9DLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsZUFBZSxHQUFHLDBCQUEwQixHQUFHLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ2xGO2lCQUFNO2dCQUNMLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3hCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDZCxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRTtvQkFDckIsSUFBSSxJQUFJLEtBQUssQ0FBQztnQkFDaEIsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO29CQUNqQixJQUFJO3dCQUNGLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztxQkFDZjtvQkFBQyxPQUFPLEdBQUcsRUFBRTt3QkFDWixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7cUJBQ2I7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7YUFDSjtRQUNILENBQUM7UUFFRCxJQUFJLENBQUMsQ0FBQyxRQUFRLElBQUksUUFBUSxFQUFFO1lBQzFCLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUMvRCxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztTQUMvQjthQUFNLElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxPQUFPLEVBQUU7WUFDaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDOUI7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNyRTtJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQTFDRCwwQkEwQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgVXJsIGZyb20gJ3VybCc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0KHVybDogc3RyaW5nLCBoZWFkZXJzID0ge30pOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IHUgPSBVcmwucGFyc2UodXJsKTtcbiAgICBjb25zdCBvcHRpb25zOiBodHRwLlJlcXVlc3RPcHRpb25zID0ge1xuICAgICAgaG9zdG5hbWU6IHUuaG9zdG5hbWUsXG4gICAgICBwcm90b2NvbDogdS5wcm90b2NvbCxcbiAgICAgIGhvc3Q6IHUuaG9zdCxcbiAgICAgIHBvcnQ6IHUucG9ydCxcbiAgICAgIHBhdGg6IHUucGF0aCxcbiAgICAgIGhlYWRlcnM6IHsgJ0FjY2VwdCc6ICd0ZXh0L2h0bWwnLCAuLi5oZWFkZXJzIH0sXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9jYWxsYmFjayhyZXM6IGh0dHAuSW5jb21pbmdNZXNzYWdlKSB7XG4gICAgICBpZiAoIXJlcy5zdGF0dXNDb2RlIHx8IHJlcy5zdGF0dXNDb2RlID49IDQwMCkge1xuICAgICAgICAvLyBDb25zdW1lIHRoZSByZXN0IG9mIHRoZSBkYXRhIHRvIGZyZWUgbWVtb3J5LlxuICAgICAgICByZXMucmVzdW1lKCk7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoYFJlcXVlc3RpbmcgXCIke3VybH1cIiByZXR1cm5lZCBzdGF0dXMgY29kZSAke3Jlcy5zdGF0dXNDb2RlfS5gKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXMuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICAgICAgbGV0IGRhdGEgPSAnJztcbiAgICAgICAgcmVzLm9uKCdkYXRhJywgY2h1bmsgPT4ge1xuICAgICAgICAgIGRhdGEgKz0gY2h1bms7XG4gICAgICAgIH0pO1xuICAgICAgICByZXMub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHUucHJvdG9jb2wgPT0gJ2h0dHBzOicpIHtcbiAgICAgIG9wdGlvbnMuYWdlbnQgPSBuZXcgaHR0cHMuQWdlbnQoeyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlIH0pO1xuICAgICAgaHR0cHMuZ2V0KG9wdGlvbnMsIF9jYWxsYmFjayk7XG4gICAgfSBlbHNlIGlmICh1LnByb3RvY29sID09ICdodHRwOicpIHtcbiAgICAgIGh0dHAuZ2V0KG9wdGlvbnMsIF9jYWxsYmFjayk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwcm90b2NvbDogJHtKU09OLnN0cmluZ2lmeSh1LnByb3RvY29sKX0uYCk7XG4gICAgfVxuICB9KTtcbn1cbiJdfQ==