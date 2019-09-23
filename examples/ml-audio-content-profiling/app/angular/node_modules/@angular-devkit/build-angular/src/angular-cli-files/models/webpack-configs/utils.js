"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable
// TODO: cleanup this file, it's copied as is from Angular CLI.
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const core_1 = require("@angular-devkit/core");
exports.ngAppResolve = (resolvePath) => {
    return path.resolve(process.cwd(), resolvePath);
};
function getOutputHashFormat(option, length = 20) {
    /* tslint:disable:max-line-length */
    const hashFormats = {
        none: { chunk: '', extract: '', file: '', script: '' },
        media: { chunk: '', extract: '', file: `.[hash:${length}]`, script: '' },
        bundles: { chunk: `.[chunkhash:${length}]`, extract: `.[contenthash:${length}]`, file: '', script: `.[hash:${length}]` },
        all: { chunk: `.[chunkhash:${length}]`, extract: `.[contenthash:${length}]`, file: `.[hash:${length}]`, script: `.[hash:${length}]` },
    };
    /* tslint:enable:max-line-length */
    return hashFormats[option] || hashFormats['none'];
}
exports.getOutputHashFormat = getOutputHashFormat;
function normalizeExtraEntryPoints(extraEntryPoints, defaultBundleName) {
    return extraEntryPoints.map(entry => {
        let normalizedEntry;
        if (typeof entry === 'string') {
            normalizedEntry = { input: entry, lazy: false, bundleName: defaultBundleName };
        }
        else {
            let bundleName;
            if (entry.bundleName) {
                bundleName = entry.bundleName;
            }
            else if (entry.lazy) {
                // Lazy entry points use the file name as bundle name.
                bundleName = core_1.basename(core_1.normalize(entry.input.replace(/\.(js|css|scss|sass|less|styl)$/i, '')));
            }
            else {
                bundleName = defaultBundleName;
            }
            normalizedEntry = Object.assign({}, entry, { bundleName });
        }
        return normalizedEntry;
    });
}
exports.normalizeExtraEntryPoints = normalizeExtraEntryPoints;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2FuZ3VsYXItY2xpLWZpbGVzL21vZGVscy93ZWJwYWNrLWNvbmZpZ3MvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUNILGlCQUFpQjtBQUNqQiwrREFBK0Q7O0FBRS9ELDZCQUE2QjtBQUM3QiwrQ0FBMkQ7QUFHOUMsUUFBQSxZQUFZLEdBQUcsQ0FBQyxXQUFtQixFQUFVLEVBQUU7SUFDMUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUNsRCxDQUFDLENBQUM7QUFTRixTQUFnQixtQkFBbUIsQ0FBQyxNQUFjLEVBQUUsTUFBTSxHQUFHLEVBQUU7SUFDN0Qsb0NBQW9DO0lBQ3BDLE1BQU0sV0FBVyxHQUFxQztRQUNwRCxJQUFJLEVBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUF3QixPQUFPLEVBQUUsRUFBRSxFQUEwQixJQUFJLEVBQUUsRUFBRSxFQUFtQixNQUFNLEVBQUUsRUFBRSxFQUFFO1FBQ3hILEtBQUssRUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQXdCLE9BQU8sRUFBRSxFQUFFLEVBQTBCLElBQUksRUFBRSxVQUFVLE1BQU0sR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUc7UUFDekgsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLGVBQWUsTUFBTSxHQUFHLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixNQUFNLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFtQixNQUFNLEVBQUUsVUFBVSxNQUFNLEdBQUcsRUFBRztRQUMxSSxHQUFHLEVBQU0sRUFBRSxLQUFLLEVBQUUsZUFBZSxNQUFNLEdBQUcsRUFBRSxPQUFPLEVBQUUsaUJBQWlCLE1BQU0sR0FBRyxFQUFFLElBQUksRUFBRSxVQUFVLE1BQU0sR0FBRyxFQUFFLE1BQU0sRUFBRSxVQUFVLE1BQU0sR0FBRyxFQUFHO0tBQzNJLENBQUM7SUFDRixtQ0FBbUM7SUFDbkMsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BELENBQUM7QUFWRCxrREFVQztBQUlELFNBQWdCLHlCQUF5QixDQUN2QyxnQkFBbUMsRUFDbkMsaUJBQXlCO0lBRXpCLE9BQU8sZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ2xDLElBQUksZUFBZSxDQUFDO1FBRXBCLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzdCLGVBQWUsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQztTQUNoRjthQUFNO1lBQ0wsSUFBSSxVQUFVLENBQUM7WUFFZixJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7Z0JBQ3BCLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO2FBQy9CO2lCQUFNLElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtnQkFDckIsc0RBQXNEO2dCQUN0RCxVQUFVLEdBQUcsZUFBUSxDQUNuQixnQkFBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGtDQUFrQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQ3ZFLENBQUM7YUFDSDtpQkFBTTtnQkFDTCxVQUFVLEdBQUcsaUJBQWlCLENBQUM7YUFDaEM7WUFFRCxlQUFlLHFCQUFPLEtBQUssSUFBRSxVQUFVLEdBQUMsQ0FBQztTQUMxQztRQUVELE9BQU8sZUFBZSxDQUFDO0lBQ3pCLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQztBQTVCRCw4REE0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG4vLyB0c2xpbnQ6ZGlzYWJsZVxuLy8gVE9ETzogY2xlYW51cCB0aGlzIGZpbGUsIGl0J3MgY29waWVkIGFzIGlzIGZyb20gQW5ndWxhciBDTEkuXG5cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgbm9ybWFsaXplIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgRXh0cmFFbnRyeVBvaW50LCBFeHRyYUVudHJ5UG9pbnRPYmplY3QgfSBmcm9tICcuLi8uLi8uLi9icm93c2VyL3NjaGVtYSc7XG5cbmV4cG9ydCBjb25zdCBuZ0FwcFJlc29sdmUgPSAocmVzb2x2ZVBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIHJldHVybiBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgcmVzb2x2ZVBhdGgpO1xufTtcblxuZXhwb3J0IGludGVyZmFjZSBIYXNoRm9ybWF0IHtcbiAgY2h1bms6IHN0cmluZztcbiAgZXh0cmFjdDogc3RyaW5nO1xuICBmaWxlOiBzdHJpbmc7XG4gIHNjcmlwdDogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3V0cHV0SGFzaEZvcm1hdChvcHRpb246IHN0cmluZywgbGVuZ3RoID0gMjApOiBIYXNoRm9ybWF0IHtcbiAgLyogdHNsaW50OmRpc2FibGU6bWF4LWxpbmUtbGVuZ3RoICovXG4gIGNvbnN0IGhhc2hGb3JtYXRzOiB7IFtvcHRpb246IHN0cmluZ106IEhhc2hGb3JtYXQgfSA9IHtcbiAgICBub25lOiAgICB7IGNodW5rOiAnJywgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3Q6ICcnLCAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiAnJyAgICAgICAgICAgICAgICAgLCBzY3JpcHQ6ICcnIH0sXG4gICAgbWVkaWE6ICAgeyBjaHVuazogJycsICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0OiAnJywgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogYC5baGFzaDoke2xlbmd0aH1dYCwgc2NyaXB0OiAnJyAgfSxcbiAgICBidW5kbGVzOiB7IGNodW5rOiBgLltjaHVua2hhc2g6JHtsZW5ndGh9XWAsIGV4dHJhY3Q6IGAuW2NvbnRlbnRoYXNoOiR7bGVuZ3RofV1gLCBmaWxlOiAnJyAgICAgICAgICAgICAgICAgLCBzY3JpcHQ6IGAuW2hhc2g6JHtsZW5ndGh9XWAgIH0sXG4gICAgYWxsOiAgICAgeyBjaHVuazogYC5bY2h1bmtoYXNoOiR7bGVuZ3RofV1gLCBleHRyYWN0OiBgLltjb250ZW50aGFzaDoke2xlbmd0aH1dYCwgZmlsZTogYC5baGFzaDoke2xlbmd0aH1dYCwgc2NyaXB0OiBgLltoYXNoOiR7bGVuZ3RofV1gICB9LFxuICB9O1xuICAvKiB0c2xpbnQ6ZW5hYmxlOm1heC1saW5lLWxlbmd0aCAqL1xuICByZXR1cm4gaGFzaEZvcm1hdHNbb3B0aW9uXSB8fCBoYXNoRm9ybWF0c1snbm9uZSddO1xufVxuXG5leHBvcnQgdHlwZSBOb3JtYWxpemVkRW50cnlQb2ludCA9IEV4dHJhRW50cnlQb2ludE9iamVjdCAmIHsgYnVuZGxlTmFtZTogc3RyaW5nIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVFeHRyYUVudHJ5UG9pbnRzKFxuICBleHRyYUVudHJ5UG9pbnRzOiBFeHRyYUVudHJ5UG9pbnRbXSxcbiAgZGVmYXVsdEJ1bmRsZU5hbWU6IHN0cmluZ1xuKTogTm9ybWFsaXplZEVudHJ5UG9pbnRbXSB7XG4gIHJldHVybiBleHRyYUVudHJ5UG9pbnRzLm1hcChlbnRyeSA9PiB7XG4gICAgbGV0IG5vcm1hbGl6ZWRFbnRyeTtcblxuICAgIGlmICh0eXBlb2YgZW50cnkgPT09ICdzdHJpbmcnKSB7XG4gICAgICBub3JtYWxpemVkRW50cnkgPSB7IGlucHV0OiBlbnRyeSwgbGF6eTogZmFsc2UsIGJ1bmRsZU5hbWU6IGRlZmF1bHRCdW5kbGVOYW1lIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBidW5kbGVOYW1lO1xuXG4gICAgICBpZiAoZW50cnkuYnVuZGxlTmFtZSkge1xuICAgICAgICBidW5kbGVOYW1lID0gZW50cnkuYnVuZGxlTmFtZTtcbiAgICAgIH0gZWxzZSBpZiAoZW50cnkubGF6eSkge1xuICAgICAgICAvLyBMYXp5IGVudHJ5IHBvaW50cyB1c2UgdGhlIGZpbGUgbmFtZSBhcyBidW5kbGUgbmFtZS5cbiAgICAgICAgYnVuZGxlTmFtZSA9IGJhc2VuYW1lKFxuICAgICAgICAgIG5vcm1hbGl6ZShlbnRyeS5pbnB1dC5yZXBsYWNlKC9cXC4oanN8Y3NzfHNjc3N8c2Fzc3xsZXNzfHN0eWwpJC9pLCAnJykpLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnVuZGxlTmFtZSA9IGRlZmF1bHRCdW5kbGVOYW1lO1xuICAgICAgfVxuXG4gICAgICBub3JtYWxpemVkRW50cnkgPSB7Li4uZW50cnksIGJ1bmRsZU5hbWV9O1xuICAgIH1cblxuICAgIHJldHVybiBub3JtYWxpemVkRW50cnk7XG4gIH0pXG59XG4iXX0=