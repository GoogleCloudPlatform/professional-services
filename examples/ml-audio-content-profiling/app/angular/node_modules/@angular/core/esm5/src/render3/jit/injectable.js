/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getClosureSafeProperty } from '../../util/property';
import { NG_INJECTABLE_DEF } from '../fields';
import { getCompilerFacade } from './compiler_facade';
import { angularCoreEnv } from './environment';
import { convertDependencies, reflectDependencies } from './util';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * `ngInjectableDef` onto the injectable type.
 */
export function compileInjectable(type, srcMeta) {
    // Allow the compilation of a class with a `@Injectable()` decorator without parameters
    var meta = srcMeta || { providedIn: null };
    var def = null;
    Object.defineProperty(type, NG_INJECTABLE_DEF, {
        get: function () {
            if (def === null) {
                var meta_1 = srcMeta || { providedIn: null };
                var hasAProvider = isUseClassProvider(meta_1) || isUseFactoryProvider(meta_1) ||
                    isUseValueProvider(meta_1) || isUseExistingProvider(meta_1);
                var compilerMeta = {
                    name: type.name,
                    type: type,
                    providedIn: meta_1.providedIn,
                    ctorDeps: reflectDependencies(type),
                    userDeps: undefined
                };
                if ((isUseClassProvider(meta_1) || isUseFactoryProvider(meta_1)) && meta_1.deps !== undefined) {
                    compilerMeta.userDeps = convertDependencies(meta_1.deps);
                }
                if (!hasAProvider) {
                    // In the case the user specifies a type provider, treat it as {provide: X, useClass: X}.
                    // The deps will have been reflected above, causing the factory to create the class by
                    // calling
                    // its constructor with injected deps.
                    compilerMeta.useClass = type;
                }
                else if (isUseClassProvider(meta_1)) {
                    // The user explicitly specified useClass, and may or may not have provided deps.
                    compilerMeta.useClass = meta_1.useClass;
                }
                else if (isUseValueProvider(meta_1)) {
                    // The user explicitly specified useValue.
                    compilerMeta.useValue = meta_1.useValue;
                }
                else if (isUseFactoryProvider(meta_1)) {
                    // The user explicitly specified useFactory.
                    compilerMeta.useFactory = meta_1.useFactory;
                }
                else if (isUseExistingProvider(meta_1)) {
                    // The user explicitly specified useExisting.
                    compilerMeta.useExisting = meta_1.useExisting;
                }
                else {
                    // Can't happen - either hasAProvider will be false, or one of the providers will be set.
                    throw new Error("Unreachable state.");
                }
                def = getCompilerFacade().compileInjectable(angularCoreEnv, "ng://" + type.name + "/ngInjectableDef.js", compilerMeta);
            }
            return def;
        },
    });
}
var ɵ0 = getClosureSafeProperty;
var USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 });
function isUseClassProvider(meta) {
    return meta.useClass !== undefined;
}
function isUseValueProvider(meta) {
    return USE_VALUE in meta;
}
function isUseFactoryProvider(meta) {
    return meta.useFactory !== undefined;
}
function isUseExistingProvider(meta) {
    return meta.useExisting !== undefined;
}
export { ɵ0 };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2luamVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBS0gsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0QsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRTVDLE9BQU8sRUFBNkIsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUloRTs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsSUFBZSxFQUFFLE9BQW9CO0lBQ3JFLHVGQUF1RjtJQUN2RixJQUFNLElBQUksR0FBZSxPQUFPLElBQUksRUFBQyxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7SUFFdkQsSUFBSSxHQUFHLEdBQVEsSUFBSSxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1FBQzdDLEdBQUcsRUFBRTtZQUNILElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtnQkFDaEIsSUFBTSxNQUFJLEdBQWUsT0FBTyxJQUFJLEVBQUMsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO2dCQUN2RCxJQUFNLFlBQVksR0FBRyxrQkFBa0IsQ0FBQyxNQUFJLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxNQUFJLENBQUM7b0JBQ3ZFLGtCQUFrQixDQUFDLE1BQUksQ0FBQyxJQUFJLHFCQUFxQixDQUFDLE1BQUksQ0FBQyxDQUFDO2dCQUc1RCxJQUFNLFlBQVksR0FBK0I7b0JBQy9DLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtvQkFDZixJQUFJLEVBQUUsSUFBSTtvQkFDVixVQUFVLEVBQUUsTUFBSSxDQUFDLFVBQVU7b0JBQzNCLFFBQVEsRUFBRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7b0JBQ25DLFFBQVEsRUFBRSxTQUFTO2lCQUNwQixDQUFDO2dCQUNGLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFJLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxNQUFJLENBQUMsQ0FBQyxJQUFJLE1BQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO29CQUN2RixZQUFZLENBQUMsUUFBUSxHQUFHLG1CQUFtQixDQUFDLE1BQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDeEQ7Z0JBQ0QsSUFBSSxDQUFDLFlBQVksRUFBRTtvQkFDakIseUZBQXlGO29CQUN6RixzRkFBc0Y7b0JBQ3RGLFVBQVU7b0JBQ1Ysc0NBQXNDO29CQUN0QyxZQUFZLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztpQkFDOUI7cUJBQU0sSUFBSSxrQkFBa0IsQ0FBQyxNQUFJLENBQUMsRUFBRTtvQkFDbkMsaUZBQWlGO29CQUNqRixZQUFZLENBQUMsUUFBUSxHQUFHLE1BQUksQ0FBQyxRQUFRLENBQUM7aUJBQ3ZDO3FCQUFNLElBQUksa0JBQWtCLENBQUMsTUFBSSxDQUFDLEVBQUU7b0JBQ25DLDBDQUEwQztvQkFDMUMsWUFBWSxDQUFDLFFBQVEsR0FBRyxNQUFJLENBQUMsUUFBUSxDQUFDO2lCQUN2QztxQkFBTSxJQUFJLG9CQUFvQixDQUFDLE1BQUksQ0FBQyxFQUFFO29CQUNyQyw0Q0FBNEM7b0JBQzVDLFlBQVksQ0FBQyxVQUFVLEdBQUcsTUFBSSxDQUFDLFVBQVUsQ0FBQztpQkFDM0M7cUJBQU0sSUFBSSxxQkFBcUIsQ0FBQyxNQUFJLENBQUMsRUFBRTtvQkFDdEMsNkNBQTZDO29CQUM3QyxZQUFZLENBQUMsV0FBVyxHQUFHLE1BQUksQ0FBQyxXQUFXLENBQUM7aUJBQzdDO3FCQUFNO29CQUNMLHlGQUF5RjtvQkFDekYsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2lCQUN2QztnQkFDRCxHQUFHLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxpQkFBaUIsQ0FDdkMsY0FBYyxFQUFFLFVBQVEsSUFBSSxDQUFDLElBQUksd0JBQXFCLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDM0U7WUFDRCxPQUFPLEdBQUcsQ0FBQztRQUNiLENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO1NBS3FFLHNCQUFzQjtBQUQ1RixJQUFNLFNBQVMsR0FDWCxzQkFBc0IsQ0FBZ0IsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsSUFBd0IsRUFBQyxDQUFDLENBQUM7QUFFL0YsU0FBUyxrQkFBa0IsQ0FBQyxJQUFnQjtJQUMxQyxPQUFRLElBQXlCLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQztBQUMzRCxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxJQUFnQjtJQUMxQyxPQUFPLFNBQVMsSUFBSSxJQUFJLENBQUM7QUFDM0IsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQUMsSUFBZ0I7SUFDNUMsT0FBUSxJQUE0QixDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUM7QUFDaEUsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsSUFBZ0I7SUFDN0MsT0FBUSxJQUE2QixDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUM7QUFDbEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7Q2xhc3NTYW5zUHJvdmlkZXIsIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyLCBGYWN0b3J5U2Fuc1Byb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyLCBWYWx1ZVNhbnNQcm92aWRlcn0gZnJvbSAnLi4vLi4vZGkvcHJvdmlkZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge05HX0lOSkVDVEFCTEVfREVGfSBmcm9tICcuLi9maWVsZHMnO1xuXG5pbXBvcnQge1IzSW5qZWN0YWJsZU1ldGFkYXRhRmFjYWRlLCBnZXRDb21waWxlckZhY2FkZX0gZnJvbSAnLi9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge2NvbnZlcnREZXBlbmRlbmNpZXMsIHJlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBpbmplY3RhYmxlIGFjY29yZGluZyB0byBpdHMgYEluamVjdGFibGVgIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogYG5nSW5qZWN0YWJsZURlZmAgb250byB0aGUgaW5qZWN0YWJsZSB0eXBlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUluamVjdGFibGUodHlwZTogVHlwZTxhbnk+LCBzcmNNZXRhPzogSW5qZWN0YWJsZSk6IHZvaWQge1xuICAvLyBBbGxvdyB0aGUgY29tcGlsYXRpb24gb2YgYSBjbGFzcyB3aXRoIGEgYEBJbmplY3RhYmxlKClgIGRlY29yYXRvciB3aXRob3V0IHBhcmFtZXRlcnNcbiAgY29uc3QgbWV0YTogSW5qZWN0YWJsZSA9IHNyY01ldGEgfHwge3Byb3ZpZGVkSW46IG51bGx9O1xuXG4gIGxldCBkZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19JTkpFQ1RBQkxFX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBtZXRhOiBJbmplY3RhYmxlID0gc3JjTWV0YSB8fCB7cHJvdmlkZWRJbjogbnVsbH07XG4gICAgICAgIGNvbnN0IGhhc0FQcm92aWRlciA9IGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSB8fCBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSB8fFxuICAgICAgICAgICAgaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGEpIHx8IGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhKTtcblxuXG4gICAgICAgIGNvbnN0IGNvbXBpbGVyTWV0YTogUjNJbmplY3RhYmxlTWV0YWRhdGFGYWNhZGUgPSB7XG4gICAgICAgICAgbmFtZTogdHlwZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgcHJvdmlkZWRJbjogbWV0YS5wcm92aWRlZEluLFxuICAgICAgICAgIGN0b3JEZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKHR5cGUpLFxuICAgICAgICAgIHVzZXJEZXBzOiB1bmRlZmluZWRcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkgfHwgaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkpICYmIG1ldGEuZGVwcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29tcGlsZXJNZXRhLnVzZXJEZXBzID0gY29udmVydERlcGVuZGVuY2llcyhtZXRhLmRlcHMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaGFzQVByb3ZpZGVyKSB7XG4gICAgICAgICAgLy8gSW4gdGhlIGNhc2UgdGhlIHVzZXIgc3BlY2lmaWVzIGEgdHlwZSBwcm92aWRlciwgdHJlYXQgaXQgYXMge3Byb3ZpZGU6IFgsIHVzZUNsYXNzOiBYfS5cbiAgICAgICAgICAvLyBUaGUgZGVwcyB3aWxsIGhhdmUgYmVlbiByZWZsZWN0ZWQgYWJvdmUsIGNhdXNpbmcgdGhlIGZhY3RvcnkgdG8gY3JlYXRlIHRoZSBjbGFzcyBieVxuICAgICAgICAgIC8vIGNhbGxpbmdcbiAgICAgICAgICAvLyBpdHMgY29uc3RydWN0b3Igd2l0aCBpbmplY3RlZCBkZXBzLlxuICAgICAgICAgIGNvbXBpbGVyTWV0YS51c2VDbGFzcyA9IHR5cGU7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlQ2xhc3MsIGFuZCBtYXkgb3IgbWF5IG5vdCBoYXZlIHByb3ZpZGVkIGRlcHMuXG4gICAgICAgICAgY29tcGlsZXJNZXRhLnVzZUNsYXNzID0gbWV0YS51c2VDbGFzcztcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZVZhbHVlUHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VWYWx1ZS5cbiAgICAgICAgICBjb21waWxlck1ldGEudXNlVmFsdWUgPSBtZXRhLnVzZVZhbHVlO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRmFjdG9yeS5cbiAgICAgICAgICBjb21waWxlck1ldGEudXNlRmFjdG9yeSA9IG1ldGEudXNlRmFjdG9yeTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VFeGlzdGluZy5cbiAgICAgICAgICBjb21waWxlck1ldGEudXNlRXhpc3RpbmcgPSBtZXRhLnVzZUV4aXN0aW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENhbid0IGhhcHBlbiAtIGVpdGhlciBoYXNBUHJvdmlkZXIgd2lsbCBiZSBmYWxzZSwgb3Igb25lIG9mIHRoZSBwcm92aWRlcnMgd2lsbCBiZSBzZXQuXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnJlYWNoYWJsZSBzdGF0ZS5gKTtcbiAgICAgICAgfVxuICAgICAgICBkZWYgPSBnZXRDb21waWxlckZhY2FkZSgpLmNvbXBpbGVJbmplY3RhYmxlKFxuICAgICAgICAgICAgYW5ndWxhckNvcmVFbnYsIGBuZzovLyR7dHlwZS5uYW1lfS9uZ0luamVjdGFibGVEZWYuanNgLCBjb21waWxlck1ldGEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICB9KTtcbn1cblxudHlwZSBVc2VDbGFzc1Byb3ZpZGVyID0gSW5qZWN0YWJsZSAmIENsYXNzU2Fuc1Byb3ZpZGVyICYge2RlcHM/OiBhbnlbXX07XG5cbmNvbnN0IFVTRV9WQUxVRSA9XG4gICAgZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPih7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0pO1xuXG5mdW5jdGlvbiBpc1VzZUNsYXNzUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgVXNlQ2xhc3NQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBVc2VDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1VzZVZhbHVlUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZWYWx1ZVNhbnNQcm92aWRlciB7XG4gIHJldHVybiBVU0VfVkFMVUUgaW4gbWV0YTtcbn1cblxuZnVuY3Rpb24gaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZGYWN0b3J5U2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIEZhY3RvcnlTYW5zUHJvdmlkZXIpLnVzZUZhY3RvcnkgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmRXhpc3RpbmdTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRXhpc3RpbmdTYW5zUHJvdmlkZXIpLnVzZUV4aXN0aW5nICE9PSB1bmRlZmluZWQ7XG59XG4iXX0=