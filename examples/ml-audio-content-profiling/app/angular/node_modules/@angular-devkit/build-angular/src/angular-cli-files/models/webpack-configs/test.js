"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const glob = require("glob");
const path = require("path");
/**
 * Enumerate loaders and their dependencies from this file to let the dependency validator
 * know they are used.
 *
 * require('istanbul-instrumenter-loader')
 *
 */
function getTestConfig(wco) {
    const { root, buildOptions, sourceRoot: include } = wco;
    const extraRules = [];
    const extraPlugins = [];
    // if (buildOptions.codeCoverage && CliConfig.fromProject()) {
    if (buildOptions.codeCoverage) {
        const codeCoverageExclude = buildOptions.codeCoverageExclude;
        const exclude = [
            /\.(e2e|spec)\.ts$/,
            /node_modules/,
        ];
        if (codeCoverageExclude) {
            codeCoverageExclude.forEach((excludeGlob) => {
                const excludeFiles = glob
                    .sync(path.join(root, excludeGlob), { nodir: true })
                    .map(file => path.normalize(file));
                exclude.push(...excludeFiles);
            });
        }
        extraRules.push({
            test: /\.(js|ts)$/,
            loader: 'istanbul-instrumenter-loader',
            options: { esModules: true },
            enforce: 'post',
            exclude,
            include,
        });
    }
    return {
        mode: 'development',
        resolve: {
            mainFields: [
                ...(wco.supportES2015 ? ['es2015'] : []),
                'browser', 'module', 'main',
            ],
        },
        devtool: buildOptions.sourceMap ? 'inline-source-map' : 'eval',
        entry: {
            main: path.resolve(root, buildOptions.main),
        },
        module: {
            rules: extraRules,
        },
        plugins: extraPlugins,
        optimization: {
            splitChunks: {
                chunks: ((chunk) => chunk.name !== 'polyfills'),
                cacheGroups: {
                    vendors: false,
                    vendor: {
                        name: 'vendor',
                        chunks: 'initial',
                        test: (module, chunks) => {
                            const moduleName = module.nameForCondition ? module.nameForCondition() : '';
                            return /[\\/]node_modules[\\/]/.test(moduleName)
                                && !chunks.some(({ name }) => name === 'polyfills');
                        },
                    },
                },
            },
        },
    };
}
exports.getTestConfig = getTestConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYW5ndWxhci1jbGktZmlsZXMvbW9kZWxzL3dlYnBhY2stY29uZmlncy90ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsNkJBQTZCO0FBQzdCLDZCQUE2QjtBQUs3Qjs7Ozs7O0dBTUc7QUFFSCxTQUFnQixhQUFhLENBQzNCLEdBQTZDO0lBRTdDLE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsR0FBRyxHQUFHLENBQUM7SUFFeEQsTUFBTSxVQUFVLEdBQW1CLEVBQUUsQ0FBQztJQUN0QyxNQUFNLFlBQVksR0FBcUIsRUFBRSxDQUFDO0lBRTFDLDhEQUE4RDtJQUM5RCxJQUFJLFlBQVksQ0FBQyxZQUFZLEVBQUU7UUFDN0IsTUFBTSxtQkFBbUIsR0FBRyxZQUFZLENBQUMsbUJBQW1CLENBQUM7UUFDN0QsTUFBTSxPQUFPLEdBQXdCO1lBQ25DLG1CQUFtQjtZQUNuQixjQUFjO1NBQ2YsQ0FBQztRQUVGLElBQUksbUJBQW1CLEVBQUU7WUFDdkIsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBbUIsRUFBRSxFQUFFO2dCQUNsRCxNQUFNLFlBQVksR0FBRyxJQUFJO3FCQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7cUJBQ25ELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxVQUFVLENBQUMsSUFBSSxDQUFDO1lBQ2QsSUFBSSxFQUFFLFlBQVk7WUFDbEIsTUFBTSxFQUFFLDhCQUE4QjtZQUN0QyxPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO1lBQzVCLE9BQU8sRUFBRSxNQUFNO1lBQ2YsT0FBTztZQUNQLE9BQU87U0FDUixDQUFDLENBQUM7S0FDSjtJQUVELE9BQU87UUFDTCxJQUFJLEVBQUUsYUFBYTtRQUNuQixPQUFPLEVBQUU7WUFDUCxVQUFVLEVBQUU7Z0JBQ1YsR0FBRyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNO2FBQzVCO1NBQ0Y7UUFDRCxPQUFPLEVBQUUsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDOUQsS0FBSyxFQUFFO1lBQ0wsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUM7U0FDNUM7UUFDRCxNQUFNLEVBQUU7WUFDTixLQUFLLEVBQUUsVUFBVTtTQUNsQjtRQUNELE9BQU8sRUFBRSxZQUFZO1FBQ3JCLFlBQVksRUFBRTtZQUNaLFdBQVcsRUFBRTtnQkFDWCxNQUFNLEVBQUUsQ0FBQyxDQUFDLEtBQXVCLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssV0FBVyxDQUFDO2dCQUNqRSxXQUFXLEVBQUU7b0JBQ1gsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsTUFBTSxFQUFFO3dCQUNOLElBQUksRUFBRSxRQUFRO3dCQUNkLE1BQU0sRUFBRSxTQUFTO3dCQUNqQixJQUFJLEVBQUUsQ0FBQyxNQUEyQyxFQUFFLE1BQTBCLEVBQUUsRUFBRTs0QkFDaEYsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUU1RSxPQUFPLHdCQUF3QixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7bUNBQzNDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksS0FBSyxXQUFXLENBQUMsQ0FBQzt3QkFDeEQsQ0FBQztxQkFDRjtpQkFDRjthQUNGO1NBQ0Y7S0FHNkIsQ0FBQztBQUNuQyxDQUFDO0FBeEVELHNDQXdFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgZ2xvYiBmcm9tICdnbG9iJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB3ZWJwYWNrIGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgV2VicGFja0NvbmZpZ09wdGlvbnMsIFdlYnBhY2tUZXN0T3B0aW9ucyB9IGZyb20gJy4uL2J1aWxkLW9wdGlvbnMnO1xuXG5cbi8qKlxuICogRW51bWVyYXRlIGxvYWRlcnMgYW5kIHRoZWlyIGRlcGVuZGVuY2llcyBmcm9tIHRoaXMgZmlsZSB0byBsZXQgdGhlIGRlcGVuZGVuY3kgdmFsaWRhdG9yXG4gKiBrbm93IHRoZXkgYXJlIHVzZWQuXG4gKlxuICogcmVxdWlyZSgnaXN0YW5idWwtaW5zdHJ1bWVudGVyLWxvYWRlcicpXG4gKlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXN0Q29uZmlnKFxuICB3Y286IFdlYnBhY2tDb25maWdPcHRpb25zPFdlYnBhY2tUZXN0T3B0aW9ucz4sXG4pOiB3ZWJwYWNrLkNvbmZpZ3VyYXRpb24ge1xuICBjb25zdCB7IHJvb3QsIGJ1aWxkT3B0aW9ucywgc291cmNlUm9vdDogaW5jbHVkZSB9ID0gd2NvO1xuXG4gIGNvbnN0IGV4dHJhUnVsZXM6IHdlYnBhY2suUnVsZVtdID0gW107XG4gIGNvbnN0IGV4dHJhUGx1Z2luczogd2VicGFjay5QbHVnaW5bXSA9IFtdO1xuXG4gIC8vIGlmIChidWlsZE9wdGlvbnMuY29kZUNvdmVyYWdlICYmIENsaUNvbmZpZy5mcm9tUHJvamVjdCgpKSB7XG4gIGlmIChidWlsZE9wdGlvbnMuY29kZUNvdmVyYWdlKSB7XG4gICAgY29uc3QgY29kZUNvdmVyYWdlRXhjbHVkZSA9IGJ1aWxkT3B0aW9ucy5jb2RlQ292ZXJhZ2VFeGNsdWRlO1xuICAgIGNvbnN0IGV4Y2x1ZGU6IChzdHJpbmcgfCBSZWdFeHApW10gPSBbXG4gICAgICAvXFwuKGUyZXxzcGVjKVxcLnRzJC8sXG4gICAgICAvbm9kZV9tb2R1bGVzLyxcbiAgICBdO1xuXG4gICAgaWYgKGNvZGVDb3ZlcmFnZUV4Y2x1ZGUpIHtcbiAgICAgIGNvZGVDb3ZlcmFnZUV4Y2x1ZGUuZm9yRWFjaCgoZXhjbHVkZUdsb2I6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBleGNsdWRlRmlsZXMgPSBnbG9iXG4gICAgICAgICAgLnN5bmMocGF0aC5qb2luKHJvb3QsIGV4Y2x1ZGVHbG9iKSwgeyBub2RpcjogdHJ1ZSB9KVxuICAgICAgICAgIC5tYXAoZmlsZSA9PiBwYXRoLm5vcm1hbGl6ZShmaWxlKSk7XG4gICAgICAgIGV4Y2x1ZGUucHVzaCguLi5leGNsdWRlRmlsZXMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZXh0cmFSdWxlcy5wdXNoKHtcbiAgICAgIHRlc3Q6IC9cXC4oanN8dHMpJC8sXG4gICAgICBsb2FkZXI6ICdpc3RhbmJ1bC1pbnN0cnVtZW50ZXItbG9hZGVyJyxcbiAgICAgIG9wdGlvbnM6IHsgZXNNb2R1bGVzOiB0cnVlIH0sXG4gICAgICBlbmZvcmNlOiAncG9zdCcsXG4gICAgICBleGNsdWRlLFxuICAgICAgaW5jbHVkZSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbW9kZTogJ2RldmVsb3BtZW50JyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBtYWluRmllbGRzOiBbXG4gICAgICAgIC4uLih3Y28uc3VwcG9ydEVTMjAxNSA/IFsnZXMyMDE1J10gOiBbXSksXG4gICAgICAgICdicm93c2VyJywgJ21vZHVsZScsICdtYWluJyxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBkZXZ0b29sOiBidWlsZE9wdGlvbnMuc291cmNlTWFwID8gJ2lubGluZS1zb3VyY2UtbWFwJyA6ICdldmFsJyxcbiAgICBlbnRyeToge1xuICAgICAgbWFpbjogcGF0aC5yZXNvbHZlKHJvb3QsIGJ1aWxkT3B0aW9ucy5tYWluKSxcbiAgICB9LFxuICAgIG1vZHVsZToge1xuICAgICAgcnVsZXM6IGV4dHJhUnVsZXMsXG4gICAgfSxcbiAgICBwbHVnaW5zOiBleHRyYVBsdWdpbnMsXG4gICAgb3B0aW1pemF0aW9uOiB7XG4gICAgICBzcGxpdENodW5rczoge1xuICAgICAgICBjaHVua3M6ICgoY2h1bms6IHsgbmFtZTogc3RyaW5nIH0pID0+IGNodW5rLm5hbWUgIT09ICdwb2x5ZmlsbHMnKSxcbiAgICAgICAgY2FjaGVHcm91cHM6IHtcbiAgICAgICAgICB2ZW5kb3JzOiBmYWxzZSxcbiAgICAgICAgICB2ZW5kb3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICd2ZW5kb3InLFxuICAgICAgICAgICAgY2h1bmtzOiAnaW5pdGlhbCcsXG4gICAgICAgICAgICB0ZXN0OiAobW9kdWxlOiB7IG5hbWVGb3JDb25kaXRpb24/OiAoKSA9PiBzdHJpbmcgfSwgY2h1bmtzOiB7IG5hbWU6IHN0cmluZyB9W10pID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgbW9kdWxlTmFtZSA9IG1vZHVsZS5uYW1lRm9yQ29uZGl0aW9uID8gbW9kdWxlLm5hbWVGb3JDb25kaXRpb24oKSA6ICcnO1xuXG4gICAgICAgICAgICAgIHJldHVybiAvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL10vLnRlc3QobW9kdWxlTmFtZSlcbiAgICAgICAgICAgICAgICAmJiAhY2h1bmtzLnNvbWUoKHsgbmFtZSB9KSA9PiBuYW1lID09PSAncG9seWZpbGxzJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8gV2VicGFjayB0eXBpbmdzIGRvbid0IHlldCBpbmNsdWRlIHRoZSBmdW5jdGlvbiBmb3JtIGZvciAnY2h1bmtzJyxcbiAgICAvLyBvciB0aGUgYnVpbHQtaW4gdmVuZG9ycyBjYWNoZSBncm91cC5cbiAgfSBhcyB7fSBhcyB3ZWJwYWNrLkNvbmZpZ3VyYXRpb247XG59XG4iXX0=