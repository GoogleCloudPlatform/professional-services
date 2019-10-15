"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns a partial specific to creating a bundle for node
 * @param wco Options which are include the build options and app config
 */
function getServerConfig(wco) {
    const config = {
        devtool: wco.buildOptions.sourceMap ? 'source-map' : false,
        resolve: {
            mainFields: [
                ...(wco.supportES2015 ? ['es2015'] : []),
                'main', 'module',
            ],
        },
        target: 'node',
        output: {
            libraryTarget: 'commonjs',
        },
        node: false,
    };
    if (wco.buildOptions.bundleDependencies == 'none') {
        config.externals = [
            /^@angular/,
            // tslint:disable-next-line:no-any
            (_, request, callback) => {
                // Absolute & Relative paths are not externals
                if (request.match(/^\.{0,2}\//)) {
                    return callback();
                }
                try {
                    // Attempt to resolve the module via Node
                    const e = require.resolve(request);
                    if (/node_modules/.test(e)) {
                        // It's a node_module
                        callback(null, request);
                    }
                    else {
                        // It's a system thing (.ie util, fs...)
                        callback();
                    }
                }
                catch (_a) {
                    // Node couldn't find it, so it must be user-aliased
                    callback();
                }
            },
        ];
    }
    return config;
}
exports.getServerConfig = getServerConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9hbmd1bGFyLWNsaS1maWxlcy9tb2RlbHMvd2VicGFjay1jb25maWdzL3NlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVdBOzs7R0FHRztBQUNILFNBQWdCLGVBQWUsQ0FBQyxHQUF5QjtJQUV2RCxNQUFNLE1BQU0sR0FBa0I7UUFDNUIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEtBQUs7UUFDMUQsT0FBTyxFQUFFO1lBQ1AsVUFBVSxFQUFFO2dCQUNWLEdBQUcsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLE1BQU0sRUFBRSxRQUFRO2FBQ2pCO1NBQ0Y7UUFDRCxNQUFNLEVBQUUsTUFBTTtRQUNkLE1BQU0sRUFBRTtZQUNOLGFBQWEsRUFBRSxVQUFVO1NBQzFCO1FBQ0QsSUFBSSxFQUFFLEtBQUs7S0FDWixDQUFDO0lBRUYsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLGtCQUFrQixJQUFJLE1BQU0sRUFBRTtRQUNqRCxNQUFNLENBQUMsU0FBUyxHQUFHO1lBQ2pCLFdBQVc7WUFDWCxrQ0FBa0M7WUFDbEMsQ0FBQyxDQUFNLEVBQUUsT0FBWSxFQUFFLFFBQTZDLEVBQUUsRUFBRTtnQkFDdEUsOENBQThDO2dCQUM5QyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUU7b0JBQy9CLE9BQU8sUUFBUSxFQUFFLENBQUM7aUJBQ25CO2dCQUVELElBQUk7b0JBQ0YseUNBQXlDO29CQUN6QyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUNuQyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQzFCLHFCQUFxQjt3QkFDckIsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztxQkFDekI7eUJBQU07d0JBQ0wsd0NBQXdDO3dCQUN4QyxRQUFRLEVBQUUsQ0FBQztxQkFDWjtpQkFDRjtnQkFBQyxXQUFNO29CQUNOLG9EQUFvRDtvQkFDcEQsUUFBUSxFQUFFLENBQUM7aUJBQ1o7WUFDSCxDQUFDO1NBQ0YsQ0FBQztLQUNIO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQTlDRCwwQ0E4Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBDb25maWd1cmF0aW9uIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBXZWJwYWNrQ29uZmlnT3B0aW9ucyB9IGZyb20gJy4uL2J1aWxkLW9wdGlvbnMnO1xuXG5cbi8qKlxuICogUmV0dXJucyBhIHBhcnRpYWwgc3BlY2lmaWMgdG8gY3JlYXRpbmcgYSBidW5kbGUgZm9yIG5vZGVcbiAqIEBwYXJhbSB3Y28gT3B0aW9ucyB3aGljaCBhcmUgaW5jbHVkZSB0aGUgYnVpbGQgb3B0aW9ucyBhbmQgYXBwIGNvbmZpZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VydmVyQ29uZmlnKHdjbzogV2VicGFja0NvbmZpZ09wdGlvbnMpIHtcblxuICBjb25zdCBjb25maWc6IENvbmZpZ3VyYXRpb24gPSB7XG4gICAgZGV2dG9vbDogd2NvLmJ1aWxkT3B0aW9ucy5zb3VyY2VNYXAgPyAnc291cmNlLW1hcCcgOiBmYWxzZSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBtYWluRmllbGRzOiBbXG4gICAgICAgIC4uLih3Y28uc3VwcG9ydEVTMjAxNSA/IFsnZXMyMDE1J10gOiBbXSksXG4gICAgICAgICdtYWluJywgJ21vZHVsZScsXG4gICAgICBdLFxuICAgIH0sXG4gICAgdGFyZ2V0OiAnbm9kZScsXG4gICAgb3V0cHV0OiB7XG4gICAgICBsaWJyYXJ5VGFyZ2V0OiAnY29tbW9uanMnLFxuICAgIH0sXG4gICAgbm9kZTogZmFsc2UsXG4gIH07XG5cbiAgaWYgKHdjby5idWlsZE9wdGlvbnMuYnVuZGxlRGVwZW5kZW5jaWVzID09ICdub25lJykge1xuICAgIGNvbmZpZy5leHRlcm5hbHMgPSBbXG4gICAgICAvXkBhbmd1bGFyLyxcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAgIChfOiBhbnksIHJlcXVlc3Q6IGFueSwgY2FsbGJhY2s6IChlcnJvcj86IGFueSwgcmVzdWx0PzogYW55KSA9PiB2b2lkKSA9PiB7XG4gICAgICAgIC8vIEFic29sdXRlICYgUmVsYXRpdmUgcGF0aHMgYXJlIG5vdCBleHRlcm5hbHNcbiAgICAgICAgaWYgKHJlcXVlc3QubWF0Y2goL15cXC57MCwyfVxcLy8pKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIEF0dGVtcHQgdG8gcmVzb2x2ZSB0aGUgbW9kdWxlIHZpYSBOb2RlXG4gICAgICAgICAgY29uc3QgZSA9IHJlcXVpcmUucmVzb2x2ZShyZXF1ZXN0KTtcbiAgICAgICAgICBpZiAoL25vZGVfbW9kdWxlcy8udGVzdChlKSkge1xuICAgICAgICAgICAgLy8gSXQncyBhIG5vZGVfbW9kdWxlXG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXF1ZXN0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSXQncyBhIHN5c3RlbSB0aGluZyAoLmllIHV0aWwsIGZzLi4uKVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIC8vIE5vZGUgY291bGRuJ3QgZmluZCBpdCwgc28gaXQgbXVzdCBiZSB1c2VyLWFsaWFzZWRcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIF07XG4gIH1cblxuICByZXR1cm4gY29uZmlnO1xufVxuIl19