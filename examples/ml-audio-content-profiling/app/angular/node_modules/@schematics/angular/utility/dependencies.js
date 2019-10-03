"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const json_utils_1 = require("./json-utils");
const pkgJsonPath = '/package.json';
var NodeDependencyType;
(function (NodeDependencyType) {
    NodeDependencyType["Default"] = "dependencies";
    NodeDependencyType["Dev"] = "devDependencies";
    NodeDependencyType["Peer"] = "peerDependencies";
    NodeDependencyType["Optional"] = "optionalDependencies";
})(NodeDependencyType = exports.NodeDependencyType || (exports.NodeDependencyType = {}));
function addPackageJsonDependency(tree, dependency) {
    const packageJsonAst = _readPackageJson(tree);
    const depsNode = json_utils_1.findPropertyInAstObject(packageJsonAst, dependency.type);
    const recorder = tree.beginUpdate(pkgJsonPath);
    if (!depsNode) {
        // Haven't found the dependencies key, add it to the root of the package.json.
        json_utils_1.appendPropertyInAstObject(recorder, packageJsonAst, dependency.type, {
            [dependency.name]: dependency.version,
        }, 2);
    }
    else if (depsNode.kind === 'object') {
        // check if package already added
        const depNode = json_utils_1.findPropertyInAstObject(depsNode, dependency.name);
        if (!depNode) {
            // Package not found, add it.
            json_utils_1.insertPropertyInAstObjectInOrder(recorder, depsNode, dependency.name, dependency.version, 4);
        }
        else if (dependency.overwrite) {
            // Package found, update version if overwrite.
            const { end, start } = depNode;
            recorder.remove(start.offset, end.offset - start.offset);
            recorder.insertRight(start.offset, JSON.stringify(dependency.version));
        }
    }
    tree.commitUpdate(recorder);
}
exports.addPackageJsonDependency = addPackageJsonDependency;
function getPackageJsonDependency(tree, name) {
    const packageJson = _readPackageJson(tree);
    let dep = null;
    [
        NodeDependencyType.Default,
        NodeDependencyType.Dev,
        NodeDependencyType.Optional,
        NodeDependencyType.Peer,
    ].forEach(depType => {
        if (dep !== null) {
            return;
        }
        const depsNode = json_utils_1.findPropertyInAstObject(packageJson, depType);
        if (depsNode !== null && depsNode.kind === 'object') {
            const depNode = json_utils_1.findPropertyInAstObject(depsNode, name);
            if (depNode !== null && depNode.kind === 'string') {
                const version = depNode.value;
                dep = {
                    type: depType,
                    name: name,
                    version: version,
                };
            }
        }
    });
    return dep;
}
exports.getPackageJsonDependency = getPackageJsonDependency;
function _readPackageJson(tree) {
    const buffer = tree.read(pkgJsonPath);
    if (buffer === null) {
        throw new schematics_1.SchematicsException('Could not read package.json.');
    }
    const content = buffer.toString();
    const packageJson = core_1.parseJsonAst(content, core_1.JsonParseMode.Strict);
    if (packageJson.kind != 'object') {
        throw new schematics_1.SchematicsException('Invalid package.json. Was expecting an object');
    }
    return packageJson;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwZW5kZW5jaWVzLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9kZXBlbmRlbmNpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FBa0Y7QUFDbEYsMkRBQXVFO0FBQ3ZFLDZDQUl1QjtBQUd2QixNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUM7QUFDcEMsSUFBWSxrQkFLWDtBQUxELFdBQVksa0JBQWtCO0lBQzVCLDhDQUF3QixDQUFBO0lBQ3hCLDZDQUF1QixDQUFBO0lBQ3ZCLCtDQUF5QixDQUFBO0lBQ3pCLHVEQUFpQyxDQUFBO0FBQ25DLENBQUMsRUFMVyxrQkFBa0IsR0FBbEIsMEJBQWtCLEtBQWxCLDBCQUFrQixRQUs3QjtBQVNELFNBQWdCLHdCQUF3QixDQUFDLElBQVUsRUFBRSxVQUEwQjtJQUM3RSxNQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QyxNQUFNLFFBQVEsR0FBRyxvQ0FBdUIsQ0FBQyxjQUFjLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDL0MsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNiLDhFQUE4RTtRQUM5RSxzQ0FBeUIsQ0FBQyxRQUFRLEVBQUUsY0FBYyxFQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUU7WUFDbkUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsVUFBVSxDQUFDLE9BQU87U0FDdEMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNQO1NBQU0sSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUNyQyxpQ0FBaUM7UUFDakMsTUFBTSxPQUFPLEdBQUcsb0NBQXVCLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVuRSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osNkJBQTZCO1lBQzdCLDZDQUFnQyxDQUM5QixRQUFRLEVBQ1IsUUFBUSxFQUNSLFVBQVUsQ0FBQyxJQUFJLEVBQ2YsVUFBVSxDQUFDLE9BQU8sRUFDbEIsQ0FBQyxDQUNGLENBQUM7U0FDSDthQUFNLElBQUksVUFBVSxDQUFDLFNBQVMsRUFBRTtZQUMvQiw4Q0FBOEM7WUFDOUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDL0IsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pELFFBQVEsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1NBQ3hFO0tBQ0Y7SUFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzlCLENBQUM7QUEvQkQsNERBK0JDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQUMsSUFBVSxFQUFFLElBQVk7SUFDL0QsTUFBTSxXQUFXLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0MsSUFBSSxHQUFHLEdBQTBCLElBQUksQ0FBQztJQUN0QztRQUNFLGtCQUFrQixDQUFDLE9BQU87UUFDMUIsa0JBQWtCLENBQUMsR0FBRztRQUN0QixrQkFBa0IsQ0FBQyxRQUFRO1FBQzNCLGtCQUFrQixDQUFDLElBQUk7S0FDeEIsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDbEIsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO1lBQ2hCLE9BQU87U0FDUjtRQUNELE1BQU0sUUFBUSxHQUFHLG9DQUF1QixDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvRCxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDbkQsTUFBTSxPQUFPLEdBQUcsb0NBQXVCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hELElBQUksT0FBTyxLQUFLLElBQUksSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtnQkFDakQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztnQkFDOUIsR0FBRyxHQUFHO29CQUNKLElBQUksRUFBRSxPQUFPO29CQUNiLElBQUksRUFBRSxJQUFJO29CQUNWLE9BQU8sRUFBRSxPQUFPO2lCQUNqQixDQUFDO2FBQ0g7U0FDRjtJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBM0JELDREQTJCQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsSUFBVTtJQUNsQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3RDLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtRQUNuQixNQUFNLElBQUksZ0NBQW1CLENBQUMsOEJBQThCLENBQUMsQ0FBQztLQUMvRDtJQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUVsQyxNQUFNLFdBQVcsR0FBRyxtQkFBWSxDQUFDLE9BQU8sRUFBRSxvQkFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2hFLElBQUksV0FBVyxDQUFDLElBQUksSUFBSSxRQUFRLEVBQUU7UUFDaEMsTUFBTSxJQUFJLGdDQUFtQixDQUFDLCtDQUErQyxDQUFDLENBQUM7S0FDaEY7SUFFRCxPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgSnNvbkFzdE9iamVjdCwgSnNvblBhcnNlTW9kZSwgcGFyc2VKc29uQXN0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7XG4gIGFwcGVuZFByb3BlcnR5SW5Bc3RPYmplY3QsXG4gIGZpbmRQcm9wZXJ0eUluQXN0T2JqZWN0LFxuICBpbnNlcnRQcm9wZXJ0eUluQXN0T2JqZWN0SW5PcmRlcixcbiB9IGZyb20gJy4vanNvbi11dGlscyc7XG5cblxuY29uc3QgcGtnSnNvblBhdGggPSAnL3BhY2thZ2UuanNvbic7XG5leHBvcnQgZW51bSBOb2RlRGVwZW5kZW5jeVR5cGUge1xuICBEZWZhdWx0ID0gJ2RlcGVuZGVuY2llcycsXG4gIERldiA9ICdkZXZEZXBlbmRlbmNpZXMnLFxuICBQZWVyID0gJ3BlZXJEZXBlbmRlbmNpZXMnLFxuICBPcHRpb25hbCA9ICdvcHRpb25hbERlcGVuZGVuY2llcycsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTm9kZURlcGVuZGVuY3kge1xuICB0eXBlOiBOb2RlRGVwZW5kZW5jeVR5cGU7XG4gIG5hbWU6IHN0cmluZztcbiAgdmVyc2lvbjogc3RyaW5nO1xuICBvdmVyd3JpdGU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkUGFja2FnZUpzb25EZXBlbmRlbmN5KHRyZWU6IFRyZWUsIGRlcGVuZGVuY3k6IE5vZGVEZXBlbmRlbmN5KTogdm9pZCB7XG4gIGNvbnN0IHBhY2thZ2VKc29uQXN0ID0gX3JlYWRQYWNrYWdlSnNvbih0cmVlKTtcbiAgY29uc3QgZGVwc05vZGUgPSBmaW5kUHJvcGVydHlJbkFzdE9iamVjdChwYWNrYWdlSnNvbkFzdCwgZGVwZW5kZW5jeS50eXBlKTtcbiAgY29uc3QgcmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHBrZ0pzb25QYXRoKTtcbiAgaWYgKCFkZXBzTm9kZSkge1xuICAgIC8vIEhhdmVuJ3QgZm91bmQgdGhlIGRlcGVuZGVuY2llcyBrZXksIGFkZCBpdCB0byB0aGUgcm9vdCBvZiB0aGUgcGFja2FnZS5qc29uLlxuICAgIGFwcGVuZFByb3BlcnR5SW5Bc3RPYmplY3QocmVjb3JkZXIsIHBhY2thZ2VKc29uQXN0LCBkZXBlbmRlbmN5LnR5cGUsIHtcbiAgICAgIFtkZXBlbmRlbmN5Lm5hbWVdOiBkZXBlbmRlbmN5LnZlcnNpb24sXG4gICAgfSwgMik7XG4gIH0gZWxzZSBpZiAoZGVwc05vZGUua2luZCA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBjaGVjayBpZiBwYWNrYWdlIGFscmVhZHkgYWRkZWRcbiAgICBjb25zdCBkZXBOb2RlID0gZmluZFByb3BlcnR5SW5Bc3RPYmplY3QoZGVwc05vZGUsIGRlcGVuZGVuY3kubmFtZSk7XG5cbiAgICBpZiAoIWRlcE5vZGUpIHtcbiAgICAgIC8vIFBhY2thZ2Ugbm90IGZvdW5kLCBhZGQgaXQuXG4gICAgICBpbnNlcnRQcm9wZXJ0eUluQXN0T2JqZWN0SW5PcmRlcihcbiAgICAgICAgcmVjb3JkZXIsXG4gICAgICAgIGRlcHNOb2RlLFxuICAgICAgICBkZXBlbmRlbmN5Lm5hbWUsXG4gICAgICAgIGRlcGVuZGVuY3kudmVyc2lvbixcbiAgICAgICAgNCxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChkZXBlbmRlbmN5Lm92ZXJ3cml0ZSkge1xuICAgICAgLy8gUGFja2FnZSBmb3VuZCwgdXBkYXRlIHZlcnNpb24gaWYgb3ZlcndyaXRlLlxuICAgICAgY29uc3QgeyBlbmQsIHN0YXJ0IH0gPSBkZXBOb2RlO1xuICAgICAgcmVjb3JkZXIucmVtb3ZlKHN0YXJ0Lm9mZnNldCwgZW5kLm9mZnNldCAtIHN0YXJ0Lm9mZnNldCk7XG4gICAgICByZWNvcmRlci5pbnNlcnRSaWdodChzdGFydC5vZmZzZXQsIEpTT04uc3RyaW5naWZ5KGRlcGVuZGVuY3kudmVyc2lvbikpO1xuICAgIH1cbiAgfVxuXG4gIHRyZWUuY29tbWl0VXBkYXRlKHJlY29yZGVyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhY2thZ2VKc29uRGVwZW5kZW5jeSh0cmVlOiBUcmVlLCBuYW1lOiBzdHJpbmcpOiBOb2RlRGVwZW5kZW5jeSB8IG51bGwge1xuICBjb25zdCBwYWNrYWdlSnNvbiA9IF9yZWFkUGFja2FnZUpzb24odHJlZSk7XG4gIGxldCBkZXA6IE5vZGVEZXBlbmRlbmN5IHwgbnVsbCA9IG51bGw7XG4gIFtcbiAgICBOb2RlRGVwZW5kZW5jeVR5cGUuRGVmYXVsdCxcbiAgICBOb2RlRGVwZW5kZW5jeVR5cGUuRGV2LFxuICAgIE5vZGVEZXBlbmRlbmN5VHlwZS5PcHRpb25hbCxcbiAgICBOb2RlRGVwZW5kZW5jeVR5cGUuUGVlcixcbiAgXS5mb3JFYWNoKGRlcFR5cGUgPT4ge1xuICAgIGlmIChkZXAgIT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgZGVwc05vZGUgPSBmaW5kUHJvcGVydHlJbkFzdE9iamVjdChwYWNrYWdlSnNvbiwgZGVwVHlwZSk7XG4gICAgaWYgKGRlcHNOb2RlICE9PSBudWxsICYmIGRlcHNOb2RlLmtpbmQgPT09ICdvYmplY3QnKSB7XG4gICAgICBjb25zdCBkZXBOb2RlID0gZmluZFByb3BlcnR5SW5Bc3RPYmplY3QoZGVwc05vZGUsIG5hbWUpO1xuICAgICAgaWYgKGRlcE5vZGUgIT09IG51bGwgJiYgZGVwTm9kZS5raW5kID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCB2ZXJzaW9uID0gZGVwTm9kZS52YWx1ZTtcbiAgICAgICAgZGVwID0ge1xuICAgICAgICAgIHR5cGU6IGRlcFR5cGUsXG4gICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICB2ZXJzaW9uOiB2ZXJzaW9uLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGRlcDtcbn1cblxuZnVuY3Rpb24gX3JlYWRQYWNrYWdlSnNvbih0cmVlOiBUcmVlKTogSnNvbkFzdE9iamVjdCB7XG4gIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChwa2dKc29uUGF0aCk7XG4gIGlmIChidWZmZXIgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignQ291bGQgbm90IHJlYWQgcGFja2FnZS5qc29uLicpO1xuICB9XG4gIGNvbnN0IGNvbnRlbnQgPSBidWZmZXIudG9TdHJpbmcoKTtcblxuICBjb25zdCBwYWNrYWdlSnNvbiA9IHBhcnNlSnNvbkFzdChjb250ZW50LCBKc29uUGFyc2VNb2RlLlN0cmljdCk7XG4gIGlmIChwYWNrYWdlSnNvbi5raW5kICE9ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ0ludmFsaWQgcGFja2FnZS5qc29uLiBXYXMgZXhwZWN0aW5nIGFuIG9iamVjdCcpO1xuICB9XG5cbiAgcmV0dXJuIHBhY2thZ2VKc29uO1xufVxuIl19