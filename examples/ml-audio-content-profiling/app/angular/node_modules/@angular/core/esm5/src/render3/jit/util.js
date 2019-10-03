/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Host, Inject, Optional, Self, SkipSelf } from '../../di/metadata';
import { Attribute } from '../../metadata/di';
import { ReflectionCapabilities } from '../../reflection/reflection_capabilities';
import { getCompilerFacade } from './compiler_facade';
var _reflect = null;
export function getReflect() {
    return (_reflect = _reflect || new ReflectionCapabilities());
}
export function reflectDependencies(type) {
    return convertDependencies(getReflect().parameters(type));
}
export function convertDependencies(deps) {
    var compiler = getCompilerFacade();
    return deps.map(function (dep) { return reflectDependency(compiler, dep); });
}
function reflectDependency(compiler, dep) {
    var meta = {
        token: null,
        host: false,
        optional: false,
        resolved: compiler.R3ResolvedDependencyType.Token,
        self: false,
        skipSelf: false,
    };
    function setTokenAndResolvedType(token) {
        meta.resolved = compiler.R3ResolvedDependencyType.Token;
        meta.token = token;
    }
    if (Array.isArray(dep)) {
        if (dep.length === 0) {
            throw new Error('Dependency array must have arguments.');
        }
        for (var j = 0; j < dep.length; j++) {
            var param = dep[j];
            if (param instanceof Optional || param.__proto__.ngMetadataName === 'Optional') {
                meta.optional = true;
            }
            else if (param instanceof SkipSelf || param.__proto__.ngMetadataName === 'SkipSelf') {
                meta.skipSelf = true;
            }
            else if (param instanceof Self || param.__proto__.ngMetadataName === 'Self') {
                meta.self = true;
            }
            else if (param instanceof Host || param.__proto__.ngMetadataName === 'Host') {
                meta.host = true;
            }
            else if (param instanceof Inject) {
                meta.token = param.token;
            }
            else if (param instanceof Attribute) {
                if (param.attributeName === undefined) {
                    throw new Error("Attribute name must be defined.");
                }
                meta.token = param.attributeName;
                meta.resolved = compiler.R3ResolvedDependencyType.Attribute;
            }
            else {
                setTokenAndResolvedType(param);
            }
        }
    }
    else {
        setTokenAndResolvedType(dep);
    }
    return meta;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6RSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUMsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sMENBQTBDLENBQUM7QUFHaEYsT0FBTyxFQUE2QyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWhHLElBQUksUUFBUSxHQUFnQyxJQUFJLENBQUM7QUFFakQsTUFBTSxVQUFVLFVBQVU7SUFDeEIsT0FBTyxDQUFDLFFBQVEsR0FBRyxRQUFRLElBQUksSUFBSSxzQkFBc0IsRUFBRSxDQUFDLENBQUM7QUFDL0QsQ0FBQztBQUVELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxJQUFlO0lBQ2pELE9BQU8sbUJBQW1CLENBQUMsVUFBVSxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxJQUFXO0lBQzdDLElBQU0sUUFBUSxHQUFHLGlCQUFpQixFQUFFLENBQUM7SUFDckMsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsaUJBQWlCLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFoQyxDQUFnQyxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsUUFBd0IsRUFBRSxHQUFnQjtJQUNuRSxJQUFNLElBQUksR0FBK0I7UUFDdkMsS0FBSyxFQUFFLElBQUk7UUFDWCxJQUFJLEVBQUUsS0FBSztRQUNYLFFBQVEsRUFBRSxLQUFLO1FBQ2YsUUFBUSxFQUFFLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLO1FBQ2pELElBQUksRUFBRSxLQUFLO1FBQ1gsUUFBUSxFQUFFLEtBQUs7S0FDaEIsQ0FBQztJQUVGLFNBQVMsdUJBQXVCLENBQUMsS0FBVTtRQUN6QyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUM7UUFDeEQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDckIsQ0FBQztJQUVELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUN0QixJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQztTQUMxRDtRQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ25DLElBQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixJQUFJLEtBQUssWUFBWSxRQUFRLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssVUFBVSxFQUFFO2dCQUM5RSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzthQUN0QjtpQkFBTSxJQUFJLEtBQUssWUFBWSxRQUFRLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssVUFBVSxFQUFFO2dCQUNyRixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzthQUN0QjtpQkFBTSxJQUFJLEtBQUssWUFBWSxJQUFJLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssTUFBTSxFQUFFO2dCQUM3RSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzthQUNsQjtpQkFBTSxJQUFJLEtBQUssWUFBWSxJQUFJLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssTUFBTSxFQUFFO2dCQUM3RSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzthQUNsQjtpQkFBTSxJQUFJLEtBQUssWUFBWSxNQUFNLEVBQUU7Z0JBQ2xDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQzthQUMxQjtpQkFBTSxJQUFJLEtBQUssWUFBWSxTQUFTLEVBQUU7Z0JBQ3JDLElBQUksS0FBSyxDQUFDLGFBQWEsS0FBSyxTQUFTLEVBQUU7b0JBQ3JDLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztpQkFDcEQ7Z0JBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxTQUFTLENBQUM7YUFDN0Q7aUJBQU07Z0JBQ0wsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDaEM7U0FDRjtLQUNGO1NBQU07UUFDTCx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUM5QjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtIb3N0LCBJbmplY3QsIE9wdGlvbmFsLCBTZWxmLCBTa2lwU2VsZn0gZnJvbSAnLi4vLi4vZGkvbWV0YWRhdGEnO1xuaW1wb3J0IHtBdHRyaWJ1dGV9IGZyb20gJy4uLy4uL21ldGFkYXRhL2RpJztcbmltcG9ydCB7UmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbi9yZWZsZWN0aW9uX2NhcGFiaWxpdGllcyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuXG5pbXBvcnQge0NvbXBpbGVyRmFjYWRlLCBSM0RlcGVuZGVuY3lNZXRhZGF0YUZhY2FkZSwgZ2V0Q29tcGlsZXJGYWNhZGV9IGZyb20gJy4vY29tcGlsZXJfZmFjYWRlJztcblxubGV0IF9yZWZsZWN0OiBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzfG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVmbGVjdCgpOiBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzIHtcbiAgcmV0dXJuIChfcmVmbGVjdCA9IF9yZWZsZWN0IHx8IG5ldyBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlOiBUeXBlPGFueT4pOiBSM0RlcGVuZGVuY3lNZXRhZGF0YUZhY2FkZVtdIHtcbiAgcmV0dXJuIGNvbnZlcnREZXBlbmRlbmNpZXMoZ2V0UmVmbGVjdCgpLnBhcmFtZXRlcnModHlwZSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29udmVydERlcGVuZGVuY2llcyhkZXBzOiBhbnlbXSk6IFIzRGVwZW5kZW5jeU1ldGFkYXRhRmFjYWRlW10ge1xuICBjb25zdCBjb21waWxlciA9IGdldENvbXBpbGVyRmFjYWRlKCk7XG4gIHJldHVybiBkZXBzLm1hcChkZXAgPT4gcmVmbGVjdERlcGVuZGVuY3koY29tcGlsZXIsIGRlcCkpO1xufVxuXG5mdW5jdGlvbiByZWZsZWN0RGVwZW5kZW5jeShjb21waWxlcjogQ29tcGlsZXJGYWNhZGUsIGRlcDogYW55IHwgYW55W10pOiBSM0RlcGVuZGVuY3lNZXRhZGF0YUZhY2FkZSB7XG4gIGNvbnN0IG1ldGE6IFIzRGVwZW5kZW5jeU1ldGFkYXRhRmFjYWRlID0ge1xuICAgIHRva2VuOiBudWxsLFxuICAgIGhvc3Q6IGZhbHNlLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICByZXNvbHZlZDogY29tcGlsZXIuUjNSZXNvbHZlZERlcGVuZGVuY3lUeXBlLlRva2VuLFxuICAgIHNlbGY6IGZhbHNlLFxuICAgIHNraXBTZWxmOiBmYWxzZSxcbiAgfTtcblxuICBmdW5jdGlvbiBzZXRUb2tlbkFuZFJlc29sdmVkVHlwZSh0b2tlbjogYW55KTogdm9pZCB7XG4gICAgbWV0YS5yZXNvbHZlZCA9IGNvbXBpbGVyLlIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZS5Ub2tlbjtcbiAgICBtZXRhLnRva2VuID0gdG9rZW47XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShkZXApKSB7XG4gICAgaWYgKGRlcC5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRGVwZW5kZW5jeSBhcnJheSBtdXN0IGhhdmUgYXJndW1lbnRzLicpO1xuICAgIH1cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGRlcC5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgcGFyYW0gPSBkZXBbal07XG4gICAgICBpZiAocGFyYW0gaW5zdGFuY2VvZiBPcHRpb25hbCB8fCBwYXJhbS5fX3Byb3RvX18ubmdNZXRhZGF0YU5hbWUgPT09ICdPcHRpb25hbCcpIHtcbiAgICAgICAgbWV0YS5vcHRpb25hbCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHBhcmFtIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgcGFyYW0uX19wcm90b19fLm5nTWV0YWRhdGFOYW1lID09PSAnU2tpcFNlbGYnKSB7XG4gICAgICAgIG1ldGEuc2tpcFNlbGYgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChwYXJhbSBpbnN0YW5jZW9mIFNlbGYgfHwgcGFyYW0uX19wcm90b19fLm5nTWV0YWRhdGFOYW1lID09PSAnU2VsZicpIHtcbiAgICAgICAgbWV0YS5zZWxmID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAocGFyYW0gaW5zdGFuY2VvZiBIb3N0IHx8IHBhcmFtLl9fcHJvdG9fXy5uZ01ldGFkYXRhTmFtZSA9PT0gJ0hvc3QnKSB7XG4gICAgICAgIG1ldGEuaG9zdCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHBhcmFtIGluc3RhbmNlb2YgSW5qZWN0KSB7XG4gICAgICAgIG1ldGEudG9rZW4gPSBwYXJhbS50b2tlbjtcbiAgICAgIH0gZWxzZSBpZiAocGFyYW0gaW5zdGFuY2VvZiBBdHRyaWJ1dGUpIHtcbiAgICAgICAgaWYgKHBhcmFtLmF0dHJpYnV0ZU5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXR0cmlidXRlIG5hbWUgbXVzdCBiZSBkZWZpbmVkLmApO1xuICAgICAgICB9XG4gICAgICAgIG1ldGEudG9rZW4gPSBwYXJhbS5hdHRyaWJ1dGVOYW1lO1xuICAgICAgICBtZXRhLnJlc29sdmVkID0gY29tcGlsZXIuUjNSZXNvbHZlZERlcGVuZGVuY3lUeXBlLkF0dHJpYnV0ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRva2VuQW5kUmVzb2x2ZWRUeXBlKHBhcmFtKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgc2V0VG9rZW5BbmRSZXNvbHZlZFR5cGUoZGVwKTtcbiAgfVxuICByZXR1cm4gbWV0YTtcbn1cbiJdfQ==