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
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const engine_1 = require("../engine");
const exception_1 = require("../exception/exception");
const formats_1 = require("../formats");
const dryrun_1 = require("../sink/dryrun");
const host_1 = require("../sink/host");
const host_tree_1 = require("../tree/host-tree");
const static_1 = require("../tree/static");
/**
 * Base class for workflows. Even without abstract methods, this class should not be used without
 * surrounding some initialization for the registry and host. This class only adds life cycle and
 * dryrun/force support. You need to provide any registry and task executors that you need to
 * support.
 * See {@see NodeWorkflow} implementation for how to make a specialized subclass of this.
 * TODO: add default set of CoreSchemaRegistry transforms. Once the job refactor is done, use that
 *       as the support for tasks.
 *
 * @public
 */
class BaseWorkflow {
    constructor(options) {
        this._reporter = new rxjs_1.Subject();
        this._lifeCycle = new rxjs_1.Subject();
        this._host = options.host;
        this._engineHost = options.engineHost;
        if (options.registry) {
            this._registry = options.registry;
        }
        else {
            this._registry = new core_1.schema.CoreSchemaRegistry(formats_1.standardFormats);
            this._registry.addPostTransform(core_1.schema.transforms.addUndefinedDefaults);
        }
        this._engine = new engine_1.SchematicEngine(this._engineHost, this);
        this._context = [];
        this._force = options.force || false;
        this._dryRun = options.dryRun || false;
    }
    get context() {
        const maybeContext = this._context[this._context.length - 1];
        if (!maybeContext) {
            throw new Error('Cannot get context when workflow is not executing...');
        }
        return maybeContext;
    }
    get registry() {
        return this._registry;
    }
    get reporter() {
        return this._reporter.asObservable();
    }
    get lifeCycle() {
        return this._lifeCycle.asObservable();
    }
    _createSinks() {
        let error = false;
        const dryRunSink = new dryrun_1.DryRunSink(this._host, this._force);
        const dryRunSubscriber = dryRunSink.reporter.subscribe(event => {
            this._reporter.next(event);
            error = error || (event.kind == 'error');
        });
        // We need two sinks if we want to output what will happen, and actually do the work.
        return [
            dryRunSink,
            // Add a custom sink that clean ourselves and throws an error if an error happened.
            {
                commit() {
                    dryRunSubscriber.unsubscribe();
                    if (error) {
                        return rxjs_1.throwError(new exception_1.UnsuccessfulWorkflowExecution());
                    }
                    return rxjs_1.of();
                },
            },
            // Only add a HostSink if this is not a dryRun.
            ...(!this._dryRun ? [new host_1.HostSink(this._host, this._force)] : []),
        ];
    }
    execute(options) {
        const parentContext = this._context[this._context.length - 1];
        if (!parentContext) {
            this._lifeCycle.next({ kind: 'start' });
        }
        /** Create the collection and the schematic. */
        const collection = this._engine.createCollection(options.collection);
        // Only allow private schematics if called from the same collection.
        const allowPrivate = options.allowPrivate
            || (parentContext && parentContext.collection === options.collection);
        const schematic = collection.createSchematic(options.schematic, allowPrivate);
        const sinks = this._createSinks();
        this._lifeCycle.next({ kind: 'workflow-start' });
        const context = Object.assign({}, options, { debug: options.debug || false, logger: options.logger || (parentContext && parentContext.logger) || new core_1.logging.NullLogger(), parentContext });
        this._context.push(context);
        return schematic.call(options.options, rxjs_1.of(new host_tree_1.HostTree(this._host)), { logger: context.logger }).pipe(operators_1.map(tree => static_1.optimize(tree)), operators_1.concatMap((tree) => {
            // Process all sinks.
            return rxjs_1.concat(rxjs_1.from(sinks).pipe(operators_1.concatMap(sink => sink.commit(tree)), operators_1.ignoreElements()), rxjs_1.of(tree));
        }), operators_1.concatMap(() => {
            if (this._dryRun) {
                return rxjs_1.of();
            }
            this._lifeCycle.next({ kind: 'post-tasks-start' });
            return this._engine.executePostTasks()
                .pipe(operators_1.tap({ complete: () => this._lifeCycle.next({ kind: 'post-tasks-end' }) }), operators_1.defaultIfEmpty(), operators_1.last());
        }), operators_1.tap({ complete: () => {
                this._lifeCycle.next({ kind: 'workflow-end' });
                this._context.pop();
                if (this._context.length == 0) {
                    this._lifeCycle.next({ kind: 'end' });
                }
            } }));
    }
}
exports.BaseWorkflow = BaseWorkflow;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvd29ya2Zsb3cvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUFrRTtBQUNsRSwrQkFBeUU7QUFDekUsOENBQTJGO0FBQzNGLHNDQUF3RDtBQUN4RCxzREFBdUU7QUFDdkUsd0NBQTZDO0FBQzdDLDJDQUF5RDtBQUN6RCx1Q0FBd0M7QUFFeEMsaURBQTZDO0FBRTdDLDJDQUEwQztBQWtCMUM7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQXNCLFlBQVk7SUFlaEMsWUFBWSxPQUE0QjtRQVI5QixjQUFTLEdBQXlCLElBQUksY0FBTyxFQUFFLENBQUM7UUFDaEQsZUFBVSxHQUE0QixJQUFJLGNBQU8sRUFBRSxDQUFDO1FBUTVELElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFFdEMsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztTQUNuQzthQUFNO1lBQ0wsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGFBQU0sQ0FBQyxrQkFBa0IsQ0FBQyx5QkFBZSxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFNLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDekU7UUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksd0JBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTNELElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBRW5CLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFB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TyxDQUFDLGdCQUFnQixFQUFFO2lCQUNuQyxJQUFJLENBQ0gsZUFBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3pFLDBCQUFjLEVBQUUsRUFDaEIsZ0JBQUksRUFBRSxDQUNQLENBQUM7UUFDTixDQUFDLENBQUMsRUFDRixlQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFO2dCQUNqQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUVwQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtvQkFDN0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztpQkFDdkM7WUFDSCxDQUFDLEVBQUMsQ0FBQyxDQUNOLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFySkQsb0NBcUpDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgbG9nZ2luZywgc2NoZW1hLCB2aXJ0dWFsRnMgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0LCBjb25jYXQsIGZyb20sIG9mLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAsIGRlZmF1bHRJZkVtcHR5LCBpZ25vcmVFbGVtZW50cywgbGFzdCwgbWFwLCB0YXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBFbmdpbmVIb3N0LCBTY2hlbWF0aWNFbmdpbmUgfSBmcm9tICcuLi9lbmdpbmUnO1xuaW1wb3J0IHsgVW5zdWNjZXNzZnVsV29ya2Zsb3dFeGVjdXRpb24gfSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7IHN0YW5kYXJkRm9ybWF0cyB9IGZyb20gJy4uL2Zvcm1hdHMnO1xuaW1wb3J0IHsgRHJ5UnVuRXZlbnQsIERyeVJ1blNpbmsgfSBmcm9tICcuLi9zaW5rL2RyeXJ1bic7XG5pbXBvcnQgeyBIb3N0U2luayB9IGZyb20gJy4uL3NpbmsvaG9zdCc7XG5pbXBvcnQgeyBTaW5rIH0gZnJvbSAnLi4vc2luay9zaW5rJztcbmltcG9ydCB7IEhvc3RUcmVlIH0gZnJvbSAnLi4vdHJlZS9ob3N0LXRyZWUnO1xuaW1wb3J0IHsgVHJlZSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7IG9wdGltaXplIH0gZnJvbSAnLi4vdHJlZS9zdGF0aWMnO1xuaW1wb3J0IHtcbiAgTGlmZUN5Y2xlRXZlbnQsXG4gIFJlcXVpcmVkV29ya2Zsb3dFeGVjdXRpb25Db250ZXh0LFxuICBXb3JrZmxvdyxcbiAgV29ya2Zsb3dFeGVjdXRpb25Db250ZXh0LFxufSBmcm9tICcuL2ludGVyZmFjZSc7XG5cblxuZXhwb3J0IGludGVyZmFjZSBCYXNlV29ya2Zsb3dPcHRpb25zIHtcbiAgaG9zdDogdmlydHVhbEZzLkhvc3Q7XG4gIGVuZ2luZUhvc3Q6IEVuZ2luZUhvc3Q8e30sIHt9PjtcbiAgcmVnaXN0cnk/OiBzY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5O1xuXG4gIGZvcmNlPzogYm9vbGVhbjtcbiAgZHJ5UnVuPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciB3b3JrZmxvd3MuIEV2ZW4gd2l0aG91dCBhYnN0cmFjdCBtZXRob2RzLCB0aGlzIGNsYXNzIHNob3VsZCBub3QgYmUgdXNlZCB3aXRob3V0XG4gKiBzdXJyb3VuZGluZyBzb21lIGluaXRpYWxpemF0aW9uIGZvciB0aGUgcmVnaXN0cnkgYW5kIGhvc3QuIFRoaXMgY2xhc3Mgb25seSBhZGRzIGxpZmUgY3ljbGUgYW5kXG4gKiBkcnlydW4vZm9yY2Ugc3VwcG9ydC4gWW91IG5lZWQgdG8gcHJvdmlkZSBhbnkgcmVnaXN0cnkgYW5kIHRhc2sgZXhlY3V0b3JzIHRoYXQgeW91IG5lZWQgdG9cbiAqIHN1cHBvcnQuXG4gKiBTZWUge0BzZWUgTm9kZVdvcmtmbG93fSBpbXBsZW1lbnRhdGlvbiBmb3IgaG93IHRvIG1ha2UgYSBzcGVjaWFsaXplZCBzdWJjbGFzcyBvZiB0aGlzLlxuICogVE9ETzogYWRkIGRlZmF1bHQgc2V0IG9mIENvcmVTY2hlbWFSZWdpc3RyeSB0cmFuc2Zvcm1zLiBPbmNlIHRoZSBqb2IgcmVmYWN0b3IgaXMgZG9uZSwgdXNlIHRoYXRcbiAqICAgICAgIGFzIHRoZSBzdXBwb3J0IGZvciB0YXNrcy5cbiAqXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlV29ya2Zsb3cgaW1wbGVtZW50cyBXb3JrZmxvdyB7XG4gIHByb3RlY3RlZCBfZW5naW5lOiBTY2hlbWF0aWNFbmdpbmU8e30sIHt9PjtcbiAgcHJvdGVjdGVkIF9lbmdpbmVIb3N0OiBFbmdpbmVIb3N0PHt9LCB7fT47XG4gIHByb3RlY3RlZCBfcmVnaXN0cnk6IHNjaGVtYS5Db3JlU2NoZW1hUmVnaXN0cnk7XG5cbiAgcHJvdGVjdGVkIF9ob3N0OiB2aXJ0dWFsRnMuSG9zdDtcblxuICBwcm90ZWN0ZWQgX3JlcG9ydGVyOiBTdWJqZWN0PERyeVJ1bkV2ZW50PiA9IG5ldyBTdWJqZWN0KCk7XG4gIHByb3RlY3RlZCBfbGlmZUN5Y2xlOiBTdWJqZWN0PExpZmVDeWNsZUV2ZW50PiA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgcHJvdGVjdGVkIF9jb250ZXh0OiBXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHRbXTtcblxuICBwcm90ZWN0ZWQgX2ZvcmNlOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgX2RyeVJ1bjogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBCYXNlV29ya2Zsb3dPcHRpb25zKSB7XG4gICAgdGhpcy5faG9zdCA9IG9wdGlvbnMuaG9zdDtcbiAgICB0aGlzLl9lbmdpbmVIb3N0ID0gb3B0aW9ucy5lbmdpbmVIb3N0O1xuXG4gICAgaWYgKG9wdGlvbnMucmVnaXN0cnkpIHtcbiAgICAgIHRoaXMuX3JlZ2lzdHJ5ID0gb3B0aW9ucy5yZWdpc3RyeTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVnaXN0cnkgPSBuZXcgc2NoZW1hLkNvcmVTY2hlbWFSZWdpc3RyeShzdGFuZGFyZEZvcm1hdHMpO1xuICAgICAgdGhpcy5fcmVnaXN0cnkuYWRkUG9zdFRyYW5zZm9ybShzY2hlbWEudHJhbnNmb3Jtcy5hZGRVbmRlZmluZWREZWZhdWx0cyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZW5naW5lID0gbmV3IFNjaGVtYXRpY0VuZ2luZSh0aGlzLl9lbmdpbmVIb3N0LCB0aGlzKTtcblxuICAgIHRoaXMuX2NvbnRleHQgPSBbXTtcblxuICAgIHRoaXMuX2ZvcmNlID0gb3B0aW9ucy5mb3JjZSB8fCBmYWxzZTtcbiAgICB0aGlzLl9kcnlSdW4gPSBvcHRpb25zLmRyeVJ1biB8fCBmYWxzZTtcbiAgfVxuXG4gIGdldCBjb250ZXh0KCk6IFJlYWRvbmx5PFdvcmtmbG93RXhlY3V0aW9uQ29udGV4dD4ge1xuICAgIGNvbnN0IG1heWJlQ29udGV4dCA9IHRoaXMuX2NvbnRleHRbdGhpcy5fY29udGV4dC5sZW5ndGggLSAxXTtcbiAgICBpZiAoIW1heWJlQ29udGV4dCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZ2V0IGNvbnRleHQgd2hlbiB3b3JrZmxvdyBpcyBub3QgZXhlY3V0aW5nLi4uJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1heWJlQ29udGV4dDtcbiAgfVxuICBnZXQgcmVnaXN0cnkoKTogc2NoZW1hLlNjaGVtYVJlZ2lzdHJ5IHtcbiAgICByZXR1cm4gdGhpcy5fcmVnaXN0cnk7XG4gIH1cbiAgZ2V0IHJlcG9ydGVyKCk6IE9ic2VydmFibGU8RHJ5UnVuRXZlbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fcmVwb3J0ZXIuYXNPYnNlcnZhYmxlKCk7XG4gIH1cbiAgZ2V0IGxpZmVDeWNsZSgpOiBPYnNlcnZhYmxlPExpZmVDeWNsZUV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX2xpZmVDeWNsZS5hc09ic2VydmFibGUoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfY3JlYXRlU2lua3MoKTogU2lua1tdIHtcbiAgICBsZXQgZXJyb3IgPSBmYWxzZTtcblxuICAgIGNvbnN0IGRyeVJ1blNpbmsgPSBuZXcgRHJ5UnVuU2luayh0aGlzLl9ob3N0LCB0aGlzLl9mb3JjZSk7XG4gICAgY29uc3QgZHJ5UnVuU3Vic2NyaWJlciA9IGRyeVJ1blNpbmsucmVwb3J0ZXIuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuX3JlcG9ydGVyLm5leHQoZXZlbnQpO1xuICAgICAgZXJyb3IgPSBlcnJvciB8fCAoZXZlbnQua2luZCA9PSAnZXJyb3InKTtcbiAgICB9KTtcblxuICAgIC8vIFdlIG5lZWQgdHdvIHNpbmtzIGlmIHdlIHdhbnQgdG8gb3V0cHV0IHdoYXQgd2lsbCBoYXBwZW4sIGFuZCBhY3R1YWxseSBkbyB0aGUgd29yay5cbiAgICByZXR1cm4gW1xuICAgICAgZHJ5UnVuU2luayxcbiAgICAgIC8vIEFkZCBhIGN1c3RvbSBzaW5rIHRoYXQgY2xlYW4gb3Vyc2VsdmVzIGFuZCB0aHJvd3MgYW4gZXJyb3IgaWYgYW4gZXJyb3IgaGFwcGVuZWQuXG4gICAgICB7XG4gICAgICAgIGNvbW1pdCgpIHtcbiAgICAgICAgICBkcnlSdW5TdWJzY3JpYmVyLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgVW5zdWNjZXNzZnVsV29ya2Zsb3dFeGVjdXRpb24oKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG9mKCk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuXG4gICAgICAvLyBPbmx5IGFkZCBhIEhvc3RTaW5rIGlmIHRoaXMgaXMgbm90IGEgZHJ5UnVuLlxuICAgICAgLi4uKCF0aGlzLl9kcnlSdW4gPyBbbmV3IEhvc3RTaW5rKHRoaXMuX2hvc3QsIHRoaXMuX2ZvcmNlKV0gOiBbXSksXG4gICAgXTtcbiAgfVxuXG4gIGV4ZWN1dGUoXG4gICAgb3B0aW9uczogUGFydGlhbDxXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQ+ICYgUmVxdWlyZWRXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQsXG4gICk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIGNvbnN0IHBhcmVudENvbnRleHQgPSB0aGlzLl9jb250ZXh0W3RoaXMuX2NvbnRleHQubGVuZ3RoIC0gMV07XG5cbiAgICBpZiAoIXBhcmVudENvbnRleHQpIHtcbiAgICAgIHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ3N0YXJ0JyB9KTtcbiAgICB9XG5cbiAgICAvKiogQ3JlYXRlIHRoZSBjb2xsZWN0aW9uIGFuZCB0aGUgc2NoZW1hdGljLiAqL1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSB0aGlzLl9lbmdpbmUuY3JlYXRlQ29sbGVjdGlvbihvcHRpb25zLmNvbGxlY3Rpb24pO1xuICAgIC8vIE9ubHkgYWxsb3cgcHJpdmF0ZSBzY2hlbWF0aWNzIGlmIGNhbGxlZCBmcm9tIHRoZSBzYW1lIGNvbGxlY3Rpb24uXG4gICAgY29uc3QgYWxsb3dQcml2YXRlID0gb3B0aW9ucy5hbGxvd1ByaXZhdGVcbiAgICAgIHx8IChwYXJlbnRDb250ZXh0ICYmIHBhcmVudENvbnRleHQuY29sbGVjdGlvbiA9PT0gb3B0aW9ucy5jb2xsZWN0aW9uKTtcbiAgICBjb25zdCBzY2hlbWF0aWMgPSBjb2xsZWN0aW9uLmNyZWF0ZVNjaGVtYXRpYyhvcHRpb25zLnNjaGVtYXRpYywgYWxsb3dQcml2YXRlKTtcblxuICAgIGNvbnN0IHNpbmtzID0gdGhpcy5fY3JlYXRlU2lua3MoKTtcblxuICAgIHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ3dvcmtmbG93LXN0YXJ0JyB9KTtcblxuICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgZGVidWc6IG9wdGlvbnMuZGVidWcgfHwgZmFsc2UsXG4gICAgICBsb2dnZXI6IG9wdGlvbnMubG9nZ2VyIHx8IChwYXJlbnRDb250ZXh0ICYmIHBhcmVudENvbnRleHQubG9nZ2VyKSB8fCBuZXcgbG9nZ2luZy5OdWxsTG9nZ2VyKCksXG4gICAgICBwYXJlbnRDb250ZXh0LFxuICAgIH07XG4gICAgdGhpcy5fY29udGV4dC5wdXNoKGNvbnRleHQpO1xuXG4gICAgcmV0dXJuIHNjaGVtYXRpYy5jYWxsKFxuICAgICAgb3B0aW9ucy5vcHRpb25zLFxuICAgICAgb2YobmV3IEhvc3RUcmVlKHRoaXMuX2hvc3QpKSxcbiAgICAgIHsgbG9nZ2VyOiBjb250ZXh0LmxvZ2dlciB9LFxuICAgICkucGlwZShcbiAgICAgIG1hcCh0cmVlID0+IG9wdGltaXplKHRyZWUpKSxcbiAgICAgIGNvbmNhdE1hcCgodHJlZTogVHJlZSkgPT4ge1xuICAgICAgICAvLyBQcm9jZXNzIGFsbCBzaW5rcy5cbiAgICAgICAgcmV0dXJuIGNvbmNhdChcbiAgICAgICAgICBmcm9tKHNpbmtzKS5waXBlKFxuICAgICAgICAgICAgY29uY2F0TWFwKHNpbmsgPT4gc2luay5jb21taXQodHJlZSkpLFxuICAgICAgICAgICAgaWdub3JlRWxlbWVudHMoKSxcbiAgICAgICAgICApLFxuICAgICAgICAgIG9mKHRyZWUpLFxuICAgICAgICApO1xuICAgICAgfSksXG4gICAgICBjb25jYXRNYXAoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fZHJ5UnVuKSB7XG4gICAgICAgICAgcmV0dXJuIG9mKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICdwb3N0LXRhc2tzLXN0YXJ0JyB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZW5naW5lLmV4ZWN1dGVQb3N0VGFza3MoKVxuICAgICAgICAgIC5waXBlKFxuICAgICAgICAgICAgdGFwKHsgY29tcGxldGU6ICgpID0+IHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ3Bvc3QtdGFza3MtZW5kJyB9KSB9KSxcbiAgICAgICAgICAgIGRlZmF1bHRJZkVtcHR5KCksXG4gICAgICAgICAgICBsYXN0KCksXG4gICAgICAgICAgKTtcbiAgICAgIH0pLFxuICAgICAgdGFwKHsgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICd3b3JrZmxvdy1lbmQnIH0pO1xuICAgICAgICAgIHRoaXMuX2NvbnRleHQucG9wKCk7XG5cbiAgICAgICAgICBpZiAodGhpcy5fY29udGV4dC5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5fbGlmZUN5Y2xlLm5leHQoeyBraW5kOiAnZW5kJyB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH19KSxcbiAgICApO1xuICB9XG59XG4iXX0=