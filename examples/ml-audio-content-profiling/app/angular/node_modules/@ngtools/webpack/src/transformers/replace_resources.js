"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const ts = require("typescript");
const ast_helpers_1 = require("./ast_helpers");
const interfaces_1 = require("./interfaces");
const make_transform_1 = require("./make_transform");
function replaceResources(shouldTransform) {
    const standardTransform = function (sourceFile) {
        const ops = [];
        if (!shouldTransform(sourceFile.fileName)) {
            return ops;
        }
        const replacements = findResources(sourceFile);
        if (replacements.length > 0) {
            // Add the replacement operations.
            ops.push(...(replacements.map((rep) => rep.replaceNodeOperation)));
            // If we added a require call, we need to also add typings for it.
            // The typings need to be compatible with node typings, but also work by themselves.
            // interface NodeRequire {(id: string): any;}
            const nodeRequireInterface = ts.createInterfaceDeclaration([], [], 'NodeRequire', [], [], [
                ts.createCallSignature([], [
                    ts.createParameter([], [], undefined, 'id', undefined, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)),
                ], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)),
            ]);
            // declare var require: NodeRequire;
            const varRequire = ts.createVariableStatement([ts.createToken(ts.SyntaxKind.DeclareKeyword)], [ts.createVariableDeclaration('require', ts.createTypeReferenceNode('NodeRequire', []))]);
            ops.push(new interfaces_1.AddNodeOperation(sourceFile, ast_helpers_1.getFirstNode(sourceFile), nodeRequireInterface));
            ops.push(new interfaces_1.AddNodeOperation(sourceFile, ast_helpers_1.getFirstNode(sourceFile), varRequire));
        }
        return ops;
    };
    return make_transform_1.makeTransform(standardTransform);
}
exports.replaceResources = replaceResources;
function findResources(sourceFile) {
    const replacements = [];
    // Find all object literals.
    ast_helpers_1.collectDeepNodes(sourceFile, ts.SyntaxKind.ObjectLiteralExpression)
        // Get all their property assignments.
        .map(node => ast_helpers_1.collectDeepNodes(node, ts.SyntaxKind.PropertyAssignment))
        // Flatten into a single array (from an array of array<property assignments>).
        .reduce((prev, curr) => curr ? prev.concat(curr) : prev, [])
        // We only want property assignments for the templateUrl/styleUrls keys.
        .filter((node) => {
        const key = _getContentOfKeyLiteral(node.name);
        if (!key) {
            // key is an expression, can't do anything.
            return false;
        }
        return key == 'templateUrl' || key == 'styleUrls';
    })
        // Replace templateUrl/styleUrls key with template/styles, and and paths with require('path').
        .forEach((node) => {
        const key = _getContentOfKeyLiteral(node.name);
        if (key == 'templateUrl') {
            const resourcePath = _getResourceRequest(node.initializer, sourceFile);
            const requireCall = _createRequireCall(resourcePath);
            const propAssign = ts.createPropertyAssignment('template', requireCall);
            replacements.push({
                resourcePaths: [resourcePath],
                replaceNodeOperation: new interfaces_1.ReplaceNodeOperation(sourceFile, node, propAssign),
            });
        }
        else if (key == 'styleUrls') {
            const arr = ast_helpers_1.collectDeepNodes(node, ts.SyntaxKind.ArrayLiteralExpression);
            if (!arr || arr.length == 0 || arr[0].elements.length == 0) {
                return;
            }
            const stylePaths = arr[0].elements.map((element) => {
                return _getResourceRequest(element, sourceFile);
            });
            const requireArray = ts.createArrayLiteral(stylePaths.map((path) => _createRequireCall(path)));
            const propAssign = ts.createPropertyAssignment('styles', requireArray);
            replacements.push({
                resourcePaths: stylePaths,
                replaceNodeOperation: new interfaces_1.ReplaceNodeOperation(sourceFile, node, propAssign),
            });
        }
    });
    return replacements;
}
exports.findResources = findResources;
function _getContentOfKeyLiteral(node) {
    if (!node) {
        return null;
    }
    else if (node.kind == ts.SyntaxKind.Identifier) {
        return node.text;
    }
    else if (node.kind == ts.SyntaxKind.StringLiteral) {
        return node.text;
    }
    else {
        return null;
    }
}
function _getResourceRequest(element, sourceFile) {
    if (element.kind === ts.SyntaxKind.StringLiteral ||
        element.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
        const url = element.text;
        // If the URL does not start with ./ or ../, prepends ./ to it.
        return `${/^\.?\.\//.test(url) ? '' : './'}${url}`;
    }
    else {
        // if not string, just use expression directly
        return element.getFullText(sourceFile);
    }
}
function _createRequireCall(path) {
    return ts.createCall(ts.createIdentifier('require'), [], [ts.createLiteral(path)]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZV9yZXNvdXJjZXMuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvdHJhbnNmb3JtZXJzL3JlcGxhY2VfcmVzb3VyY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsaUNBQWlDO0FBQ2pDLCtDQUErRDtBQUMvRCw2Q0FLc0I7QUFDdEIscURBQWlEO0FBR2pELFNBQWdCLGdCQUFnQixDQUM5QixlQUE4QztJQUU5QyxNQUFNLGlCQUFpQixHQUFzQixVQUFVLFVBQXlCO1FBQzlFLE1BQU0sR0FBRyxHQUF5QixFQUFFLENBQUM7UUFFckMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDekMsT0FBTyxHQUFHLENBQUM7U0FDWjtRQUVELE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUvQyxJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBRTNCLGtDQUFrQztZQUNsQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbkUsa0VBQWtFO1lBQ2xFLG9GQUFvRjtZQUVwRiw2Q0FBNkM7WUFDN0MsTUFBTSxvQkFBb0IsR0FBRyxFQUFFLENBQUMsMEJBQTBCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDeEYsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRTtvQkFDekIsRUFBRSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUNuRCxFQUFFLENBQUMscUJBQXFCLENBQUMsRUFBRSxD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QU0sSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFO1FBQ25ELE9BQVEsSUFBeUIsQ0FBQyxJQUFJLENBQUM7S0FDeEM7U0FBTTtRQUNMLE9BQU8sSUFBSSxDQUFDO0tBQ2I7QUFDSCxDQUFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxPQUFzQixFQUFFLFVBQXlCO0lBQzVFLElBQ0UsT0FBTyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLGFBQWE7UUFDNUMsT0FBTyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLDZCQUE2QixFQUM1RDtRQUNBLE1BQU0sR0FBRyxHQUFJLE9BQTRCLENBQUMsSUFBSSxDQUFDO1FBRS9DLCtEQUErRDtRQUMvRCxPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7S0FDcEQ7U0FBTTtRQUNMLDhDQUE4QztRQUM5QyxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDeEM7QUFDSCxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxJQUFZO0lBQ3RDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FDbEIsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxFQUM5QixFQUFFLEVBQ0YsQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ3pCLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBjb2xsZWN0RGVlcE5vZGVzLCBnZXRGaXJzdE5vZGUgfSBmcm9tICcuL2FzdF9oZWxwZXJzJztcbmltcG9ydCB7XG4gIEFkZE5vZGVPcGVyYXRpb24sXG4gIFJlcGxhY2VOb2RlT3BlcmF0aW9uLFxuICBTdGFuZGFyZFRyYW5zZm9ybSxcbiAgVHJhbnNmb3JtT3BlcmF0aW9uLFxufSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHsgbWFrZVRyYW5zZm9ybSB9IGZyb20gJy4vbWFrZV90cmFuc2Zvcm0nO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiByZXBsYWNlUmVzb3VyY2VzKFxuICBzaG91bGRUcmFuc2Zvcm06IChmaWxlTmFtZTogc3RyaW5nKSA9PiBib29sZWFuLFxuKTogdHMuVHJhbnNmb3JtZXJGYWN0b3J5PHRzLlNvdXJjZUZpbGU+IHtcbiAgY29uc3Qgc3RhbmRhcmRUcmFuc2Zvcm06IFN0YW5kYXJkVHJhbnNmb3JtID0gZnVuY3Rpb24gKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgICBjb25zdCBvcHM6IFRyYW5zZm9ybU9wZXJhdGlvbltdID0gW107XG5cbiAgICBpZiAoIXNob3VsZFRyYW5zZm9ybShzb3VyY2VGaWxlLmZpbGVOYW1lKSkge1xuICAgICAgcmV0dXJuIG9wcztcbiAgICB9XG5cbiAgICBjb25zdCByZXBsYWNlbWVudHMgPSBmaW5kUmVzb3VyY2VzKHNvdXJjZUZpbGUpO1xuXG4gICAgaWYgKHJlcGxhY2VtZW50cy5sZW5ndGggPiAwKSB7XG5cbiAgICAgIC8vIEFkZCB0aGUgcmVwbGFjZW1lbnQgb3BlcmF0aW9ucy5cbiAgICAgIG9wcy5wdXNoKC4uLihyZXBsYWNlbWVudHMubWFwKChyZXApID0+IHJlcC5yZXBsYWNlTm9kZU9wZXJhdGlvbikpKTtcblxuICAgICAgLy8gSWYgd2UgYWRkZWQgYSByZXF1aXJlIGNhbGwsIHdlIG5lZWQgdG8gYWxzbyBhZGQgdHlwaW5ncyBmb3IgaXQuXG4gICAgICAvLyBUaGUgdHlwaW5ncyBuZWVkIHRvIGJlIGNvbXBhdGlibGUgd2l0aCBub2RlIHR5cGluZ3MsIGJ1dCBhbHNvIHdvcmsgYnkgdGhlbXNlbHZlcy5cblxuICAgICAgLy8gaW50ZXJmYWNlIE5vZGVSZXF1aXJlIHsoaWQ6IHN0cmluZyk6IGFueTt9XG4gICAgICBjb25zdCBub2RlUmVxdWlyZUludGVyZmFjZSA9IHRzLmNyZWF0ZUludGVyZmFjZURlY2xhcmF0aW9uKFtdLCBbXSwgJ05vZGVSZXF1aXJlJywgW10sIFtdLCBbXG4gICAgICAgIHRzLmNyZWF0ZUNhbGxTaWduYXR1cmUoW10sIFtcbiAgICAgICAgICB0cy5jcmVhdGVQYXJhbWV0ZXIoW10sIFtdLCB1bmRlZmluZWQsICdpZCcsIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHRzLmNyZWF0ZUtleXdvcmRUeXBlTm9kZSh0cy5TeW50YXhLaW5kLlN0cmluZ0tleXdvcmQpLFxuICAgICAgICAgICksXG4gICAgICAgIF0sIHRzLmNyZWF0ZUtleXdvcmRUeXBlTm9kZSh0cy5TeW50YXhLaW5kLkFueUtleXdvcmQpKSxcbiAgICAgIF0pO1xuXG4gICAgICAvLyBkZWNsYXJlIHZhciByZXF1aXJlOiBOb2RlUmVxdWlyZTtcbiAgICAgIGNvbnN0IHZhclJlcXVpcmUgPSB0cy5jcmVhdGVWYXJpYWJsZVN0YXRlbWVudChcbiAgICAgICAgW3RzLmNyZWF0ZVRva2VuKHRzLlN5bnRheEtpbmQuRGVjbGFyZUtleXdvcmQpXSxcbiAgICAgICAgW3RzLmNyZWF0ZVZhcmlhYmxlRGVjbGFyYXRpb24oJ3JlcXVpcmUnLCB0cy5jcmVhdGVUeXBlUmVmZXJlbmNlTm9kZSgnTm9kZVJlcXVpcmUnLCBbXSkpXSxcbiAgICAgICk7XG5cbiAgICAgIG9wcy5wdXNoKG5ldyBBZGROb2RlT3BlcmF0aW9uKHNvdXJjZUZpbGUsIGdldEZpcnN0Tm9kZShzb3VyY2VGaWxlKSwgbm9kZVJlcXVpcmVJbnRlcmZhY2UpKTtcbiAgICAgIG9wcy5wdXNoKG5ldyBBZGROb2RlT3BlcmF0aW9uKHNvdXJjZUZpbGUsIGdldEZpcnN0Tm9kZShzb3VyY2VGaWxlKSwgdmFyUmVxdWlyZSkpO1xuICAgIH1cblxuICAgIHJldHVybiBvcHM7XG4gIH07XG5cbiAgcmV0dXJuIG1ha2VUcmFuc2Zvcm0oc3RhbmRhcmRUcmFuc2Zvcm0pO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlc291cmNlUmVwbGFjZW1lbnQge1xuICByZXNvdXJjZVBhdGhzOiBzdHJpbmdbXTtcbiAgcmVwbGFjZU5vZGVPcGVyYXRpb246IFJlcGxhY2VOb2RlT3BlcmF0aW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFJlc291cmNlcyhzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogUmVzb3VyY2VSZXBsYWNlbWVudFtdIHtcbiAgY29uc3QgcmVwbGFjZW1lbnRzOiBSZXNvdXJjZVJlcGxhY2VtZW50W10gPSBbXTtcblxuICAvLyBGaW5kIGFsbCBvYmplY3QgbGl0ZXJhbHMuXG4gIGNvbGxlY3REZWVwTm9kZXM8dHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24+KHNvdXJjZUZpbGUsIHRzLlN5bnRheEtpbmQuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24pXG4gICAgLy8gR2V0IGFsbCB0aGVpciBwcm9wZXJ0eSBhc3NpZ25tZW50cy5cbiAgICAubWFwKG5vZGUgPT4gY29sbGVjdERlZXBOb2Rlczx0cy5Qcm9wZXJ0eUFzc2lnbm1lbnQ+KG5vZGUsIHRzLlN5bnRheEtpbmQuUHJvcGVydHlBc3NpZ25tZW50KSlcbiAgICAvLyBGbGF0dGVuIGludG8gYSBzaW5nbGUgYXJyYXkgKGZyb20gYW4gYXJyYXkgb2YgYXJyYXk8cHJvcGVydHkgYXNzaWdubWVudHM+KS5cbiAgICAucmVkdWNlKChwcmV2LCBjdXJyKSA9PiBjdXJyID8gcHJldi5jb25jYXQoY3VycikgOiBwcmV2LCBbXSlcbiAgICAvLyBXZSBvbmx5IHdhbnQgcHJvcGVydHkgYXNzaWdubWVudHMgZm9yIHRoZSB0ZW1wbGF0ZVVybC9zdHlsZVVybHMga2V5cy5cbiAgICAuZmlsdGVyKChub2RlOiB0cy5Qcm9wZXJ0eUFzc2lnbm1lbnQpID0+IHtcbiAgICAgIGNvbnN0IGtleSA9IF9nZXRDb250ZW50T2ZLZXlMaXRlcmFsKG5vZGUubmFtZSk7XG4gICAgICBpZiAoIWtleSkge1xuICAgICAgICAvLyBrZXkgaXMgYW4gZXhwcmVzc2lvbiwgY2FuJ3QgZG8gYW55dGhpbmcuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGtleSA9PSAndGVtcGxhdGVVcmwnIHx8IGtleSA9PSAnc3R5bGVVcmxzJztcbiAgICB9KVxuICAgIC8vIFJlcGxhY2UgdGVtcGxhdGVVcmwvc3R5bGVVcmxzIGtleSB3aXRoIHRlbXBsYXRlL3N0eWxlcywgYW5kIGFuZCBwYXRocyB3aXRoIHJlcXVpcmUoJ3BhdGgnKS5cbiAgICAuZm9yRWFjaCgobm9kZTogdHMuUHJvcGVydHlBc3NpZ25tZW50KSA9PiB7XG4gICAgICBjb25zdCBrZXkgPSBfZ2V0Q29udGVudE9mS2V5TGl0ZXJhbChub2RlLm5hbWUpO1xuXG4gICAgICBpZiAoa2V5ID09ICd0ZW1wbGF0ZVVybCcpIHtcbiAgICAgICAgY29uc3QgcmVzb3VyY2VQYXRoID0gX2dldFJlc291cmNlUmVxdWVzdChub2RlLmluaXRpYWxpemVyLCBzb3VyY2VGaWxlKTtcbiAgICAgICAgY29uc3QgcmVxdWlyZUNhbGwgPSBfY3JlYXRlUmVxdWlyZUNhbGwocmVzb3VyY2VQYXRoKTtcbiAgICAgICAgY29uc3QgcHJvcEFzc2lnbiA9IHRzLmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudCgndGVtcGxhdGUnLCByZXF1aXJlQ2FsbCk7XG4gICAgICAgIHJlcGxhY2VtZW50cy5wdXNoKHtcbiAgICAgICAgICByZXNvdXJjZVBhdGhzOiBbcmVzb3VyY2VQYXRoXSxcbiAgICAgICAgICByZXBsYWNlTm9kZU9wZXJhdGlvbjogbmV3IFJlcGxhY2VOb2RlT3BlcmF0aW9uKHNvdXJjZUZpbGUsIG5vZGUsIHByb3BBc3NpZ24pLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoa2V5ID09ICdzdHlsZVVybHMnKSB7XG4gICAgICAgIGNvbnN0IGFyciA9IGNvbGxlY3REZWVwTm9kZXM8dHMuQXJyYXlMaXRlcmFsRXhwcmVzc2lvbj4obm9kZSxcbiAgICAgICAgICB0cy5TeW50YXhLaW5kLkFycmF5TGl0ZXJhbEV4cHJlc3Npb24pO1xuICAgICAgICBpZiAoIWFyciB8fCBhcnIubGVuZ3RoID09IDAgfHwgYXJyWzBdLmVsZW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3R5bGVQYXRocyA9IGFyclswXS5lbGVtZW50cy5tYXAoKGVsZW1lbnQ6IHRzLkV4cHJlc3Npb24pID0+IHtcbiAgICAgICAgICByZXR1cm4gX2dldFJlc291cmNlUmVxdWVzdChlbGVtZW50LCBzb3VyY2VGaWxlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcmVxdWlyZUFycmF5ID0gdHMuY3JlYXRlQXJyYXlMaXRlcmFsKFxuICAgICAgICAgIHN0eWxlUGF0aHMubWFwKChwYXRoKSA9PiBfY3JlYXRlUmVxdWlyZUNhbGwocGF0aCkpLFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IHByb3BBc3NpZ24gPSB0cy5jcmVhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoJ3N0eWxlcycsIHJlcXVpcmVBcnJheSk7XG4gICAgICAgIHJlcGxhY2VtZW50cy5wdXNoKHtcbiAgICAgICAgICByZXNvdXJjZVBhdGhzOiBzdHlsZVBhdGhzLFxuICAgICAgICAgIHJlcGxhY2VOb2RlT3BlcmF0aW9uOiBuZXcgUmVwbGFjZU5vZGVPcGVyYXRpb24oc291cmNlRmlsZSwgbm9kZSwgcHJvcEFzc2lnbiksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIHJldHVybiByZXBsYWNlbWVudHM7XG5cbn1cblxuZnVuY3Rpb24gX2dldENvbnRlbnRPZktleUxpdGVyYWwobm9kZT86IHRzLk5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFub2RlKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSBpZiAobm9kZS5raW5kID09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgIHJldHVybiAobm9kZSBhcyB0cy5JZGVudGlmaWVyKS50ZXh0O1xuICB9IGVsc2UgaWYgKG5vZGUua2luZCA9PSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWwpIHtcbiAgICByZXR1cm4gKG5vZGUgYXMgdHMuU3RyaW5nTGl0ZXJhbCkudGV4dDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBfZ2V0UmVzb3VyY2VSZXF1ZXN0KGVsZW1lbnQ6IHRzLkV4cHJlc3Npb24sIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgaWYgKFxuICAgIGVsZW1lbnQua2luZCA9PT0gdHMuU3ludGF4S2luZC5TdHJpbmdMaXRlcmFsIHx8XG4gICAgZWxlbWVudC5raW5kID09PSB0cy5TeW50YXhLaW5kLk5vU3Vic3RpdHV0aW9uVGVtcGxhdGVMaXRlcmFsXG4gICkge1xuICAgIGNvbnN0IHVybCA9IChlbGVtZW50IGFzIHRzLlN0cmluZ0xpdGVyYWwpLnRleHQ7XG5cbiAgICAvLyBJZiB0aGUgVVJMIGRvZXMgbm90IHN0YXJ0IHdpdGggLi8gb3IgLi4vLCBwcmVwZW5kcyAuLyB0byBpdC5cbiAgICByZXR1cm4gYCR7L15cXC4/XFwuXFwvLy50ZXN0KHVybCkgPyAnJyA6ICcuLyd9JHt1cmx9YDtcbiAgfSBlbHNlIHtcbiAgICAvLyBpZiBub3Qgc3RyaW5nLCBqdXN0IHVzZSBleHByZXNzaW9uIGRpcmVjdGx5XG4gICAgcmV0dXJuIGVsZW1lbnQuZ2V0RnVsbFRleHQoc291cmNlRmlsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2NyZWF0ZVJlcXVpcmVDYWxsKHBhdGg6IHN0cmluZykge1xuICByZXR1cm4gdHMuY3JlYXRlQ2FsbChcbiAgICB0cy5jcmVhdGVJZGVudGlmaWVyKCdyZXF1aXJlJyksXG4gICAgW10sXG4gICAgW3RzLmNyZWF0ZUxpdGVyYWwocGF0aCldLFxuICApO1xufVxuIl19