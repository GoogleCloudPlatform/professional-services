"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
class NodePackageInstallTaskOptions {
}
exports.NodePackageInstallTaskOptions = NodePackageInstallTaskOptions;
class NodePackageInstallTask {
    constructor(options) {
        this.quiet = true;
        if (typeof options === 'string') {
            this.workingDirectory = options;
        }
        else if (typeof options === 'object') {
            if (options.quiet != undefined) {
                this.quiet = options.quiet;
            }
            if (options.workingDirectory != undefined) {
                this.workingDirectory = options.workingDirectory;
            }
            if (options.packageManager != undefined) {
                this.packageManager = options.packageManager;
            }
            if (options.packageName != undefined) {
                this.packageName = options.packageName;
            }
        }
    }
    toConfiguration() {
        return {
            name: options_1.NodePackageName,
            options: {
                command: 'install',
                quiet: this.quiet,
                workingDirectory: this.workingDirectory,
                packageManager: this.packageManager,
                packageName: this.packageName,
            },
        };
    }
}
exports.NodePackageInstallTask = NodePackageInstallTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbC10YXNrLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL25vZGUtcGFja2FnZS9pbnN0YWxsLXRhc2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSx1Q0FBb0U7QUFFcEUsTUFBYSw2QkFBNkI7Q0FLekM7QUFMRCxzRUFLQztBQUVELE1BQWEsc0JBQXNCO0lBUWpDLFlBQVksT0FBeUQ7UUFQckUsVUFBSyxHQUFHLElBQUksQ0FBQztRQVFYLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO1lBQy9CLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUM7U0FDakM7YUFBTSxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUN0QyxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksU0FBUyxFQUFFO2dCQUM5QixJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7YUFDNUI7WUFDRCxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxTQUFTLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7YUFDbEQ7WUFDRCxJQUFJLE9BQU8sQ0FBQyxjQUFjLElBQUksU0FBUyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7YUFDOUM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksU0FBUyxFQUFFO2dCQUNwQyxJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUM7YUFDeEM7U0FDRjtJQUNILENBQUM7SUFFRCxlQUFlO1FBQ2IsT0FBTztZQUNMLElBQUksRUFBRSx5QkFBZTtZQUNyQixPQUFPLEVBQUU7Z0JBQ1AsT0FBTyxFQUFFLFNBQVM7Z0JBQ2xCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtnQkFDdkMsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO2dCQUNuQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7YUFDOUI7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBdkNELHdEQXVDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IFRhc2tDb25maWd1cmF0aW9uLCBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvciB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBOb2RlUGFja2FnZU5hbWUsIE5vZGVQYWNrYWdlVGFza09wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuXG5leHBvcnQgY2xhc3MgTm9kZVBhY2thZ2VJbnN0YWxsVGFza09wdGlvbnMge1xuICBwYWNrYWdlTWFuYWdlcjogc3RyaW5nO1xuICBwYWNrYWdlTmFtZTogc3RyaW5nO1xuICB3b3JraW5nRGlyZWN0b3J5OiBzdHJpbmc7XG4gIHF1aWV0OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgTm9kZVBhY2thZ2VJbnN0YWxsVGFzayBpbXBsZW1lbnRzIFRhc2tDb25maWd1cmF0aW9uR2VuZXJhdG9yPE5vZGVQYWNrYWdlVGFza09wdGlvbnM+IHtcbiAgcXVpZXQgPSB0cnVlO1xuICB3b3JraW5nRGlyZWN0b3J5Pzogc3RyaW5nO1xuICBwYWNrYWdlTWFuYWdlcj86IHN0cmluZztcbiAgcGFja2FnZU5hbWU/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Iod29ya2luZ0RpcmVjdG9yeT86IHN0cmluZyk7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFBhcnRpYWw8Tm9kZVBhY2thZ2VJbnN0YWxsVGFza09wdGlvbnM+KTtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IHN0cmluZyB8IFBhcnRpYWw8Tm9kZVBhY2thZ2VJbnN0YWxsVGFza09wdGlvbnM+KSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy53b3JraW5nRGlyZWN0b3J5ID0gb3B0aW9ucztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKG9wdGlvbnMucXVpZXQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucXVpZXQgPSBvcHRpb25zLnF1aWV0O1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMud29ya2luZ0RpcmVjdG9yeSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy53b3JraW5nRGlyZWN0b3J5ID0gb3B0aW9ucy53b3JraW5nRGlyZWN0b3J5O1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMucGFja2FnZU1hbmFnZXIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucGFja2FnZU1hbmFnZXIgPSBvcHRpb25zLnBhY2thZ2VNYW5hZ2VyO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMucGFja2FnZU5hbWUgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucGFja2FnZU5hbWUgPSBvcHRpb25zLnBhY2thZ2VOYW1lO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRvQ29uZmlndXJhdGlvbigpOiBUYXNrQ29uZmlndXJhdGlvbjxOb2RlUGFja2FnZVRhc2tPcHRpb25zPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IE5vZGVQYWNrYWdlTmFtZSxcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgY29tbWFuZDogJ2luc3RhbGwnLFxuICAgICAgICBxdWlldDogdGhpcy5xdWlldCxcbiAgICAgICAgd29ya2luZ0RpcmVjdG9yeTogdGhpcy53b3JraW5nRGlyZWN0b3J5LFxuICAgICAgICBwYWNrYWdlTWFuYWdlcjogdGhpcy5wYWNrYWdlTWFuYWdlcixcbiAgICAgICAgcGFja2FnZU5hbWU6IHRoaXMucGFja2FnZU5hbWUsXG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cbiJdfQ==