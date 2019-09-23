"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
class NodePackageLinkTask {
    constructor(packageName, workingDirectory) {
        this.packageName = packageName;
        this.workingDirectory = workingDirectory;
        this.quiet = true;
    }
    toConfiguration() {
        return {
            name: options_1.NodePackageName,
            options: {
                command: 'link',
                quiet: this.quiet,
                workingDirectory: this.workingDirectory,
                packageName: this.packageName,
            },
        };
    }
}
exports.NodePackageLinkTask = NodePackageLinkTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay10YXNrLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL25vZGUtcGFja2FnZS9saW5rLXRhc2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSx1Q0FBb0U7QUFFcEUsTUFBYSxtQkFBbUI7SUFHOUIsWUFBbUIsV0FBb0IsRUFBUyxnQkFBeUI7UUFBdEQsZ0JBQVcsR0FBWCxXQUFXLENBQVM7UUFBUyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVM7UUFGekUsVUFBSyxHQUFHLElBQUksQ0FBQztJQUUrRCxDQUFDO0lBRTdFLGVBQWU7UUFDYixPQUFPO1lBQ0wsSUFBSSxFQUFFLHlCQUFlO1lBQ3JCLE9BQU8sRUFBRTtnQkFDUCxPQUFPLEVBQUUsTUFBTTtnQkFDZixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7Z0JBQ3ZDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVzthQUM5QjtTQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFoQkQsa0RBZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgVGFza0NvbmZpZ3VyYXRpb24sIFRhc2tDb25maWd1cmF0aW9uR2VuZXJhdG9yIH0gZnJvbSAnLi4vLi4vc3JjJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlTmFtZSwgTm9kZVBhY2thZ2VUYXNrT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cbmV4cG9ydCBjbGFzcyBOb2RlUGFja2FnZUxpbmtUYXNrIGltcGxlbWVudHMgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3I8Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICBxdWlldCA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHBhY2thZ2VOYW1lPzogc3RyaW5nLCBwdWJsaWMgd29ya2luZ0RpcmVjdG9yeT86IHN0cmluZykge31cblxuICB0b0NvbmZpZ3VyYXRpb24oKTogVGFza0NvbmZpZ3VyYXRpb248Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBOb2RlUGFja2FnZU5hbWUsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGNvbW1hbmQ6ICdsaW5rJyxcbiAgICAgICAgcXVpZXQ6IHRoaXMucXVpZXQsXG4gICAgICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHRoaXMud29ya2luZ0RpcmVjdG9yeSxcbiAgICAgICAgcGFja2FnZU5hbWU6IHRoaXMucGFja2FnZU5hbWUsXG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cbiJdfQ==