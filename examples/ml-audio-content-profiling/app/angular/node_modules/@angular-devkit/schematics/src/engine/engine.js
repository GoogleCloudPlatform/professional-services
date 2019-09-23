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
const interface_1 = require("../tree/interface");
const null_1 = require("../tree/null");
const static_1 = require("../tree/static");
const schematic_1 = require("./schematic");
class UnknownUrlSourceProtocol extends core_1.BaseException {
    constructor(url) { super(`Unknown Protocol on url "${url}".`); }
}
exports.UnknownUrlSourceProtocol = UnknownUrlSourceProtocol;
class UnknownCollectionException extends core_1.BaseException {
    constructor(name) { super(`Unknown collection "${name}".`); }
}
exports.UnknownCollectionException = UnknownCollectionException;
class CircularCollectionException extends core_1.BaseException {
    constructor(name) {
        super(`Circular collection reference "${name}".`);
    }
}
exports.CircularCollectionException = CircularCollectionException;
class UnknownSchematicException extends core_1.BaseException {
    constructor(name, collection) {
        super(`Schematic "${name}" not found in collection "${collection.name}".`);
    }
}
exports.UnknownSchematicException = UnknownSchematicException;
class PrivateSchematicException extends core_1.BaseException {
    constructor(name, collection) {
        super(`Schematic "${name}" not found in collection "${collection.name}".`);
    }
}
exports.PrivateSchematicException = PrivateSchematicException;
class SchematicEngineConflictingException extends core_1.BaseException {
    constructor() { super(`A schematic was called from a different engine as its parent.`); }
}
exports.SchematicEngineConflictingException = SchematicEngineConflictingException;
class UnregisteredTaskException extends core_1.BaseException {
    constructor(name, schematic) {
        const addendum = schematic ? ` in schematic "${schematic.name}"` : '';
        super(`Unregistered task "${name}"${addendum}.`);
    }
}
exports.UnregisteredTaskException = UnregisteredTaskException;
class UnknownTaskDependencyException extends core_1.BaseException {
    constructor(id) {
        super(`Unknown task dependency [ID: ${id.id}].`);
    }
}
exports.UnknownTaskDependencyException = UnknownTaskDependencyException;
class CollectionImpl {
    constructor(_description, _engine, baseDescriptions) {
        this._description = _description;
        this._engine = _engine;
        this.baseDescriptions = baseDescriptions;
    }
    get description() { return this._description; }
    get name() { return this.description.name || '<unknown>'; }
    createSchematic(name, allowPrivate = false) {
        return this._engine.createSchematic(name, this, allowPrivate);
    }
    listSchematicNames() {
        return this._engine.listSchematicNames(this);
    }
}
exports.CollectionImpl = CollectionImpl;
class TaskScheduler {
    constructor(_context) {
        this._context = _context;
        this._queue = new core_1.PriorityQueue((x, y) => x.priority - y.priority);
        this._taskIds = new Map();
    }
    _calculatePriority(dependencies) {
        if (dependencies.size === 0) {
            return 0;
        }
        const prio = [...dependencies].reduce((prio, task) => prio + task.priority, 1);
        return prio;
    }
    _mapDependencies(dependencies) {
        if (!dependencies) {
            return new Set();
        }
        const tasks = dependencies.map(dep => {
            const task = this._taskIds.get(dep);
            if (!task) {
                throw new UnknownTaskDependencyException(dep);
            }
            return task;
        });
        return new Set(tasks);
    }
    schedule(taskConfiguration) {
        const dependencies = this._mapDependencies(taskConfiguration.dependencies);
        const priority = this._calculatePriority(dependencies);
        const task = {
            id: TaskScheduler._taskIdCounter++,
            priority,
            configuration: taskConfiguration,
            context: this._context,
        };
        this._queue.push(task);
        const id = { id: task.id };
        this._taskIds.set(id, task);
        return id;
    }
    finalize() {
        const tasks = this._queue.toArray();
        this._queue.clear();
        this._taskIds.clear();
        return tasks;
    }
}
TaskScheduler._taskIdCounter = 1;
exports.TaskScheduler = TaskScheduler;
class SchematicEngine {
    constructor(_host, _workflow) {
        this._host = _host;
        this._workflow = _workflow;
        this._collectionCache = new Map();
        this._schematicCache = new Map();
        this._taskSchedulers = new Array();
    }
    get workflow() { return this._workflow || null; }
    get defaultMergeStrategy() { return this._host.defaultMergeStrategy || interface_1.MergeStrategy.Default; }
    createCollection(name) {
        let collection = this._collectionCache.get(name);
        if (collection) {
            return collection;
        }
        const [description, bases] = this._createCollectionDescription(name);
        collection = new CollectionImpl(description, this, bases);
        this._collectionCache.set(name, collection);
        this._schematicCache.set(name, new Map());
        return collection;
    }
    _createCollectionDescription(name, parentNames) {
        const description = this._host.createCollectionDescription(name);
        if (!description) {
            throw new UnknownCollectionException(name);
        }
        if (parentNames && parentNames.has(description.name)) {
            throw new CircularCollectionException(name);
        }
        const bases = new Array();
        if (description.extends) {
            parentNames = (parentNames || new Set()).add(description.name);
            for (const baseName of description.extends) {
                const [base, baseBases] = this._createCollectionDescription(baseName, new Set(parentNames));
                bases.unshift(base, ...baseBases);
            }
        }
        return [description, bases];
    }
    createContext(schematic, parent, executionOptions) {
        // Check for inconsistencies.
        if (parent && parent.engine && parent.engine !== this) {
            throw new SchematicEngineConflictingException();
        }
        let interactive = true;
        if (executionOptions && executionOptions.interactive != undefined) {
            interactive = executionOptions.interactive;
        }
        else if (parent && parent.interactive != undefined) {
            interactive = parent.interactive;
        }
        let context = {
            debug: parent && parent.debug || false,
            engine: this,
            logger: (parent && parent.logger && parent.logger.createChild(schematic.description.name))
                || new core_1.logging.NullLogger(),
            schematic,
            strategy: (parent && parent.strategy !== undefined)
                ? parent.strategy : this.defaultMergeStrategy,
            interactive,
            addTask,
        };
        const maybeNewContext = this._host.transformContext(context);
        if (maybeNewContext) {
            context = maybeNewContext;
        }
        const taskScheduler = new TaskScheduler(context);
        const host = this._host;
        this._taskSchedulers.push(taskScheduler);
        function addTask(task, dependencies) {
            const config = task.toConfiguration();
            if (!host.hasTaskExecutor(config.name)) {
                throw new UnregisteredTaskException(config.name, schematic.description);
            }
            config.dependencies = config.dependencies || [];
            if (dependencies) {
                config.dependencies.unshift(...dependencies);
            }
            return taskScheduler.schedule(config);
        }
        return context;
    }
    createSchematic(name, collection, allowPrivate = false) {
        const collectionImpl = this._collectionCache.get(collection.description.name);
        const schematicMap = this._schematicCache.get(collection.description.name);
        if (!collectionImpl || !schematicMap || collectionImpl !== collection) {
            // This is weird, maybe the collection was created by another engine?
            throw new UnknownCollectionException(collection.description.name);
        }
        let schematic = schematicMap.get(name);
        if (schematic) {
            return schematic;
        }
        let collectionDescription = collection.description;
        let description = this._host.createSchematicDescription(name, collection.description);
        if (!description) {
            if (collection.baseDescriptions) {
                for (const base of collection.baseDescriptions) {
                    description = this._host.createSchematicDescription(name, base);
                    if (description) {
                        collectionDescription = base;
                        break;
                    }
                }
            }
            if (!description) {
                // Report the error for the top level schematic collection
                throw new UnknownSchematicException(name, collection.description);
            }
        }
        if (description.private && !allowPrivate) {
            throw new PrivateSchematicException(name, collection.description);
        }
        const factory = this._host.getSchematicRuleFactory(description, collectionDescription);
        schematic = new schematic_1.SchematicImpl(description, factory, collection, this);
        schematicMap.set(name, schematic);
        return schematic;
    }
    listSchematicNames(collection) {
        const names = this._host.listSchematicNames(collection.description);
        if (collection.baseDescriptions) {
            for (const base of collection.baseDescriptions) {
                names.push(...this._host.listSchematicNames(base));
            }
        }
        // remove duplicates
        return [...new Set(names)].sort();
    }
    transformOptions(schematic, options, context) {
        return this._host.transformOptions(schematic.description, options, context);
    }
    createSourceFromUrl(url, context) {
        switch (url.protocol) {
            case 'null:': return () => new null_1.NullTree();
            case 'empty:': return () => static_1.empty();
            default:
                const hostSource = this._host.createSourceFromUrl(url, context);
                if (!hostSource) {
                    throw new UnknownUrlSourceProtocol(url.toString());
                }
                return hostSource;
        }
    }
    executePostTasks() {
        const executors = new Map();
        const taskObservable = rxjs_1.from(this._taskSchedulers)
            .pipe(operators_1.concatMap(scheduler => scheduler.finalize()), operators_1.concatMap(task => {
            const { name, options } = task.configuration;
            const executor = executors.get(name);
            if (executor) {
                return executor(options, task.context);
            }
            return this._host.createTaskExecutor(name)
                .pipe(operators_1.concatMap(executor => {
                executors.set(name, executor);
                return executor(options, task.context);
            }));
        }));
        return taskObservable;
    }
}
exports.SchematicEngine = SchematicEngine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9lbmdpbmUvZW5naW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQTZFO0FBQzdFLCtCQUEwRDtBQUMxRCw4Q0FBMkM7QUFFM0MsaURBQWtEO0FBQ2xELHVDQUF3QztBQUN4QywyQ0FBdUM7QUFtQnZDLDJDQUE0QztBQUc1QyxNQUFhLHdCQUF5QixTQUFRLG9CQUFhO0lBQ3pELFlBQVksR0FBVyxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDekU7QUFGRCw0REFFQztBQUVELE1BQWEsMEJBQTJCLFNBQVEsb0JBQWE7SUFDM0QsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLHVCQUF1QixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN0RTtBQUZELGdFQUVDO0FBRUQsTUFBYSwyQkFBNEIsU0FBUSxvQkFBYTtJQUM1RCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGtDQUFrQyxJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ3BELENBQUM7Q0FDRjtBQUpELGtFQUlDO0FBRUQsTUFBYSx5QkFBMEIsU0FBUSxvQkFBYTtJQUMxRCxZQUFZLElBQVksRUFBRSxVQUFxQztRQUM3RCxLQUFLLENBQUMsY0FBYyxJQUFJLDhCQUE4QixVQUFVLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUM3RSxDQUFDO0NBQ0Y7QUFKRCw4REFJQztBQUVELE1BQWEseUJBQTBCLFNBQVEsb0JBQWE7SUFDMUQsWUFBWSxJQUFZLEVBQUUsVUFBcUM7UUFDN0QsS0FBSyxDQUFDLGNBQWMsSUFBSSw4QkFBOEIsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7SUFDN0UsQ0FBQztDQUNGO0FBSkQsOERBSUM7QUFFRCxNQUFhLG1DQUFvQyxT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LFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckMsSUFBSSxRQUFRLEVBQUU7Z0JBQ1osT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUN4QztZQUVELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7aUJBQ3ZDLElBQUksQ0FBQyxxQkFBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUN6QixTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFFOUIsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1IsQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUVKLE9BQU8sY0FBYyxDQUFDO0lBQ3hCLENBQUM7Q0FDRjtBQTVORCwwQ0E0TkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uLCBQcmlvcml0eVF1ZXVlLCBsb2dnaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbSBhcyBvYnNlcnZhYmxlRnJvbSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY29uY2F0TWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSAndXJsJztcbmltcG9ydCB7IE1lcmdlU3RyYXRlZ3kgfSBmcm9tICcuLi90cmVlL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBOdWxsVHJlZSB9IGZyb20gJy4uL3RyZWUvbnVsbCc7XG5pbXBvcnQgeyBlbXB0eSB9IGZyb20gJy4uL3RyZWUvc3RhdGljJztcbmltcG9ydCB7IFdvcmtmbG93IH0gZnJvbSAnLi4vd29ya2Zsb3cvaW50ZXJmYWNlJztcbmltcG9ydCB7XG4gIENvbGxlY3Rpb24sXG4gIENvbGxlY3Rpb25EZXNjcmlwdGlvbixcbiAgRW5naW5lLFxuICBFbmdpbmVIb3N0LFxuICBFeGVjdXRpb25PcHRpb25zLFxuICBTY2hlbWF0aWMsXG4gIFNjaGVtYXRpY0NvbnRleHQsXG4gIFNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxuICBTb3VyY2UsXG4gIFRhc2tDb25maWd1cmF0aW9uLFxuICBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvcixcbiAgVGFza0V4ZWN1dG9yLFxuICBUYXNrSWQsXG4gIFRhc2tJbmZvLFxuICBUeXBlZFNjaGVtYXRpY0NvbnRleHQsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IFNjaGVtYXRpY0ltcGwgfSBmcm9tICcuL3NjaGVtYXRpYyc7XG5cblxuZXhwb3J0IGNsYXNzIFVua25vd25VcmxTb3VyY2VQcm90b2NvbCBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3Rvcih1cmw6IHN0cmluZykgeyBzdXBlcihgVW5rbm93biBQcm90b2NvbCBvbiB1cmwgXCIke3VybH1cIi5gKTsgfVxufVxuXG5leHBvcnQgY2xhc3MgVW5rbm93bkNvbGxlY3Rpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBVbmtub3duIGNvbGxlY3Rpb24gXCIke25hbWV9XCIuYCk7IH1cbn1cblxuZXhwb3J0IGNsYXNzIENpcmN1bGFyQ29sbGVjdGlvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ2lyY3VsYXIgY29sbGVjdGlvbiByZWZlcmVuY2UgXCIke25hbWV9XCIuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVua25vd25TY2hlbWF0aWNFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBjb2xsZWN0aW9uOiBDb2xsZWN0aW9uRGVzY3JpcHRpb248e30+KSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyBcIiR7bmFtZX1cIiBub3QgZm91bmQgaW4gY29sbGVjdGlvbiBcIiR7Y29sbGVjdGlvbi5uYW1lfVwiLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQcml2YXRlU2NoZW1hdGljRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgY29sbGVjdGlvbjogQ29sbGVjdGlvbkRlc2NyaXB0aW9uPHt9Pikge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgXCIke25hbWV9XCIgbm90IGZvdW5kIGluIGNvbGxlY3Rpb24gXCIke2NvbGxlY3Rpb24ubmFtZX1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2NoZW1hdGljRW5naW5lQ29uZmxpY3RpbmdFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoKSB7IHN1cGVyKGBBIHNjaGVtYXRpYyB3YXMgY2FsbGVkIGZyb20gYSBkaWZmZXJlbnQgZW5naW5lIGFzIGl0cyBwYXJlbnQuYCk7IH1cbn1cblxuZXhwb3J0IGNsYXNzIFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBzY2hlbWF0aWM/OiBTY2hlbWF0aWNEZXNjcmlwdGlvbjx7fSwge30+KSB7XG4gICAgY29uc3QgYWRkZW5kdW0gPSBzY2hlbWF0aWMgPyBgIGluIHNjaGVtYXRpYyBcIiR7c2NoZW1hdGljLm5hbWV9XCJgIDogJyc7XG4gICAgc3VwZXIoYFVucmVnaXN0ZXJlZCB0YXNrIFwiJHtuYW1lfVwiJHthZGRlbmR1bX0uYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVua25vd25UYXNrRGVwZW5kZW5jeUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihpZDogVGFza0lkKSB7XG4gICAgc3VwZXIoYFVua25vd24gdGFzayBkZXBlbmRlbmN5IFtJRDogJHtpZC5pZH1dLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uSW1wbDxDb2xsZWN0aW9uVCBleHRlbmRzIG9iamVjdCwgU2NoZW1hdGljVCBleHRlbmRzIG9iamVjdD5cbiAgaW1wbGVtZW50cyBDb2xsZWN0aW9uPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2Rlc2NyaXB0aW9uOiBDb2xsZWN0aW9uRGVzY3JpcHRpb248Q29sbGVjdGlvblQ+LFxuICAgICAgICAgICAgICBwcml2YXRlIF9lbmdpbmU6IFNjaGVtYXRpY0VuZ2luZTxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBiYXNlRGVzY3JpcHRpb25zPzogQXJyYXk8Q29sbGVjdGlvbkRlc2NyaXB0aW9uPENvbGxlY3Rpb25UPj4pIHtcbiAgfVxuXG4gIGdldCBkZXNjcmlwdGlvbigpIHsgcmV0dXJuIHRoaXMuX2Rlc2NyaXB0aW9uOyB9XG4gIGdldCBuYW1lKCkgeyByZXR1cm4gdGhpcy5kZXNjcmlwdGlvbi5uYW1lIHx8ICc8dW5rbm93bj4nOyB9XG5cbiAgY3JlYXRlU2NoZW1hdGljKG5hbWU6IHN0cmluZywgYWxsb3dQcml2YXRlID0gZmFsc2UpOiBTY2hlbWF0aWM8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+IHtcbiAgICByZXR1cm4gdGhpcy5fZW5naW5lLmNyZWF0ZVNjaGVtYXRpYyhuYW1lLCB0aGlzLCBhbGxvd1ByaXZhdGUpO1xuICB9XG5cbiAgbGlzdFNjaGVtYXRpY05hbWVzKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5fZW5naW5lLmxpc3RTY2hlbWF0aWNOYW1lcyh0aGlzKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVGFza1NjaGVkdWxlciB7XG4gIHByaXZhdGUgX3F1ZXVlID0gbmV3IFByaW9yaXR5UXVldWU8VGFza0luZm8+KCh4LCB5KSA9PiB4LnByaW9yaXR5IC0geS5wcmlvcml0eSk7XG4gIHByaXZhdGUgX3Rhc2tJZHMgPSBuZXcgTWFwPFRhc2tJZCwgVGFza0luZm8+KCk7XG4gIHByaXZhdGUgc3RhdGljIF90YXNrSWRDb3VudGVyID0gMTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9jb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSB7fVxuXG4gIHByaXZhdGUgX2NhbGN1bGF0ZVByaW9yaXR5KGRlcGVuZGVuY2llczogU2V0PFRhc2tJbmZvPik6IG51bWJlciB7XG4gICAgaWYgKGRlcGVuZGVuY2llcy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBwcmlvID0gWy4uLmRlcGVuZGVuY2llc10ucmVkdWNlKChwcmlvLCB0YXNrKSA9PiBwcmlvICsgdGFzay5wcmlvcml0eSwgMSk7XG5cbiAgICByZXR1cm4gcHJpbztcbiAgfVxuXG4gIHByaXZhdGUgX21hcERlcGVuZGVuY2llcyhkZXBlbmRlbmNpZXM/OiBBcnJheTxUYXNrSWQ+KTogU2V0PFRhc2tJbmZvPiB7XG4gICAgaWYgKCFkZXBlbmRlbmNpZXMpIHtcbiAgICAgIHJldHVybiBuZXcgU2V0KCk7XG4gICAgfVxuXG4gICAgY29uc3QgdGFza3MgPSBkZXBlbmRlbmNpZXMubWFwKGRlcCA9PiB7XG4gICAgICBjb25zdCB0YXNrID0gdGhpcy5fdGFza0lkcy5nZXQoZGVwKTtcbiAgICAgIGlmICghdGFzaykge1xuICAgICAgICB0aHJvdyBuZXcgVW5rbm93blRhc2tEZXBlbmRlbmN5RXhjZXB0aW9uKGRlcCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0YXNrO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBTZXQodGFza3MpO1xuICB9XG5cbiAgc2NoZWR1bGU8VD4odGFza0NvbmZpZ3VyYXRpb246IFRhc2tDb25maWd1cmF0aW9uPFQ+KTogVGFza0lkIHtcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSB0aGlzLl9tYXBEZXBlbmRlbmNpZXModGFza0NvbmZpZ3VyYXRpb24uZGVwZW5kZW5jaWVzKTtcbiAgICBjb25zdCBwcmlvcml0eSA9IHRoaXMuX2NhbGN1bGF0ZVByaW9yaXR5KGRlcGVuZGVuY2llcyk7XG5cbiAgICBjb25zdCB0YXNrID0ge1xuICAgICAgaWQ6IFRhc2tTY2hlZHVsZXIuX3Rhc2tJZENvdW50ZXIrKyxcbiAgICAgIHByaW9yaXR5LFxuICAgICAgY29uZmlndXJhdGlvbjogdGFza0NvbmZpZ3VyYXRpb24sXG4gICAgICBjb250ZXh0OiB0aGlzLl9jb250ZXh0LFxuICAgIH07XG5cbiAgICB0aGlzLl9xdWV1ZS5wdXNoKHRhc2spO1xuXG4gICAgY29uc3QgaWQgPSB7IGlkOiB0YXNrLmlkIH07XG4gICAgdGhpcy5fdGFza0lkcy5zZXQoaWQsIHRhc2spO1xuXG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgZmluYWxpemUoKTogUmVhZG9ubHlBcnJheTxUYXNrSW5mbz4ge1xuICAgIGNvbnN0IHRhc2tzID0gdGhpcy5fcXVldWUudG9BcnJheSgpO1xuICAgIHRoaXMuX3F1ZXVlLmNsZWFyKCk7XG4gICAgdGhpcy5fdGFza0lkcy5jbGVhcigpO1xuXG4gICAgcmV0dXJuIHRhc2tzO1xuICB9XG5cbn1cblxuXG5leHBvcnQgY2xhc3MgU2NoZW1hdGljRW5naW5lPENvbGxlY3Rpb25UIGV4dGVuZHMgb2JqZWN0LCBTY2hlbWF0aWNUIGV4dGVuZHMgb2JqZWN0PlxuICAgIGltcGxlbWVudHMgRW5naW5lPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPiB7XG5cbiAgcHJpdmF0ZSBfY29sbGVjdGlvbkNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIENvbGxlY3Rpb25JbXBsPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPj4oKTtcbiAgcHJpdmF0ZSBfc2NoZW1hdGljQ2FjaGVcbiAgICA9IG5ldyBNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBTY2hlbWF0aWNJbXBsPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPj4+KCk7XG4gIHByaXZhdGUgX3Rhc2tTY2hlZHVsZXJzID0gbmV3IEFycmF5PFRhc2tTY2hlZHVsZXI+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaG9zdDogRW5naW5lSG9zdDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sIHByb3RlY3RlZCBfd29ya2Zsb3c/OiBXb3JrZmxvdykge1xuICB9XG5cbiAgZ2V0IHdvcmtmbG93KCkgeyByZXR1cm4gdGhpcy5fd29ya2Zsb3cgfHwgbnVsbDsgfVxuICBnZXQgZGVmYXVsdE1lcmdlU3RyYXRlZ3koKSB7IHJldHVybiB0aGlzLl9ob3N0LmRlZmF1bHRNZXJnZVN0cmF0ZWd5IHx8IE1lcmdlU3RyYXRlZ3kuRGVmYXVsdDsgfVxuXG4gIGNyZWF0ZUNvbGxlY3Rpb24obmFtZTogc3RyaW5nKTogQ29sbGVjdGlvbjxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4ge1xuICAgIGxldCBjb2xsZWN0aW9uID0gdGhpcy5fY29sbGVjdGlvbkNhY2hlLmdldChuYW1lKTtcbiAgICBpZiAoY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gICAgfVxuXG4gICAgY29uc3QgW2Rlc2NyaXB0aW9uLCBiYXNlc10gPSB0aGlzLl9jcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24obmFtZSk7XG5cbiAgICBjb2xsZWN0aW9uID0gbmV3IENvbGxlY3Rpb25JbXBsPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPihkZXNjcmlwdGlvbiwgdGhpcywgYmFzZXMpO1xuICAgIHRoaXMuX2NvbGxlY3Rpb25DYWNoZS5zZXQobmFtZSwgY29sbGVjdGlvbik7XG4gICAgdGhpcy5fc2NoZW1hdGljQ2FjaGUuc2V0KG5hbWUsIG5ldyBNYXAoKSk7XG5cbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcGFyZW50TmFtZXM/OiBTZXQ8c3RyaW5nPixcbiAgKTogW0NvbGxlY3Rpb25EZXNjcmlwdGlvbjxDb2xsZWN0aW9uVD4sIEFycmF5PENvbGxlY3Rpb25EZXNjcmlwdGlvbjxDb2xsZWN0aW9uVD4+XSB7XG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLl9ob3N0LmNyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihuYW1lKTtcbiAgICBpZiAoIWRlc2NyaXB0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgVW5rbm93bkNvbGxlY3Rpb25FeGNlcHRpb24obmFtZSk7XG4gICAgfVxuICAgIGlmIChwYXJlbnROYW1lcyAmJiBwYXJlbnROYW1lcy5oYXMoZGVzY3JpcHRpb24ubmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBDaXJjdWxhckNvbGxlY3Rpb25FeGNlcHRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgYmFzZXMgPSBuZXcgQXJyYXk8Q29sbGVjdGlvbkRlc2NyaXB0aW9uPENvbGxlY3Rpb25UPj4oKTtcbiAgICBpZiAoZGVzY3JpcHRpb24uZXh0ZW5kcykge1xuICAgICAgcGFyZW50TmFtZXMgPSAocGFyZW50TmFtZXMgfHwgbmV3IFNldDxzdHJpbmc+KCkpLmFkZChkZXNjcmlwdGlvbi5uYW1lKTtcbiAgICAgIGZvciAoY29uc3QgYmFzZU5hbWUgb2YgZGVzY3JpcHRpb24uZXh0ZW5kcykge1xuICAgICAgICBjb25zdCBbYmFzZSwgYmFzZUJhc2VzXSA9IHRoaXMuX2NyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihiYXNlTmFtZSwgbmV3IFNldChwYXJlbnROYW1lcykpO1xuXG4gICAgICAgIGJhc2VzLnVuc2hpZnQoYmFzZSwgLi4uYmFzZUJhc2VzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gW2Rlc2NyaXB0aW9uLCBiYXNlc107XG4gIH1cblxuICBjcmVhdGVDb250ZXh0KFxuICAgIHNjaGVtYXRpYzogU2NoZW1hdGljPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPixcbiAgICBwYXJlbnQ/OiBQYXJ0aWFsPFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4+LFxuICAgIGV4ZWN1dGlvbk9wdGlvbnM/OiBQYXJ0aWFsPEV4ZWN1dGlvbk9wdGlvbnM+LFxuICApOiBUeXBlZFNjaGVtYXRpY0NvbnRleHQ8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+IHtcbiAgICAvLyBDaGVjayBmb3IgaW5jb25zaXN0ZW5jaWVzLlxuICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LmVuZ2luZSAmJiBwYXJlbnQuZW5naW5lICE9PSB0aGlzKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljRW5naW5lQ29uZmxpY3RpbmdFeGNlcHRpb24oKTtcbiAgICB9XG5cbiAgICBsZXQgaW50ZXJhY3RpdmUgPSB0cnVlO1xuICAgIGlmIChleGVjdXRpb25PcHRpb25zICYmIGV4ZWN1dGlvbk9wdGlvbnMuaW50ZXJhY3RpdmUgIT0gdW5kZWZpbmVkKSB7XG4gICAgICBpbnRlcmFjdGl2ZSA9IGV4ZWN1dGlvbk9wdGlvbnMuaW50ZXJhY3RpdmU7XG4gICAgfSBlbHNlIGlmIChwYXJlbnQgJiYgcGFyZW50LmludGVyYWN0aXZlICE9IHVuZGVmaW5lZCkge1xuICAgICAgaW50ZXJhY3RpdmUgPSBwYXJlbnQuaW50ZXJhY3RpdmU7XG4gICAgfVxuXG4gICAgbGV0IGNvbnRleHQ6IFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4gPSB7XG4gICAgICBkZWJ1ZzogcGFyZW50ICYmIHBhcmVudC5kZWJ1ZyB8fCBmYWxzZSxcbiAgICAgIGVuZ2luZTogdGhpcyxcbiAgICAgIGxvZ2dlcjogKHBhcmVudCAmJiBwYXJlbnQubG9nZ2VyICYmIHBhcmVudC5sb2dnZXIuY3JlYXRlQ2hpbGQoc2NoZW1hdGljLmRlc2NyaXB0aW9uLm5hbWUpKVxuICAgICAgICAgICAgICB8fCBuZXcgbG9nZ2luZy5OdWxsTG9nZ2VyKCksXG4gICAgICBzY2hlbWF0aWMsXG4gICAgICBzdHJhdGVneTogKHBhcmVudCAmJiBwYXJlbnQuc3RyYXRlZ3kgIT09IHVuZGVmaW5lZClcbiAgICAgICAgPyBwYXJlbnQuc3RyYXRlZ3kgOiB0aGlzLmRlZmF1bHRNZXJnZVN0cmF0ZWd5LFxuICAgICAgaW50ZXJhY3RpdmUsXG4gICAgICBhZGRUYXNrLFxuICAgIH07XG5cbiAgICBjb25zdCBtYXliZU5ld0NvbnRleHQgPSB0aGlzLl9ob3N0LnRyYW5zZm9ybUNvbnRleHQoY29udGV4dCk7XG4gICAgaWYgKG1heWJlTmV3Q29udGV4dCkge1xuICAgICAgY29udGV4dCA9IG1heWJlTmV3Q29udGV4dDtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrU2NoZWR1bGVyID0gbmV3IFRhc2tTY2hlZHVsZXIoY29udGV4dCk7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMuX2hvc3Q7XG4gICAgdGhpcy5fdGFza1NjaGVkdWxlcnMucHVzaCh0YXNrU2NoZWR1bGVyKTtcblxuICAgIGZ1bmN0aW9uIGFkZFRhc2s8VD4oXG4gICAgICB0YXNrOiBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvcjxUPixcbiAgICAgIGRlcGVuZGVuY2llcz86IEFycmF5PFRhc2tJZD4sXG4gICAgKTogVGFza0lkIHtcbiAgICAgIGNvbnN0IGNvbmZpZyA9IHRhc2sudG9Db25maWd1cmF0aW9uKCk7XG5cbiAgICAgIGlmICghaG9zdC5oYXNUYXNrRXhlY3V0b3IoY29uZmlnLm5hbWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uKGNvbmZpZy5uYW1lLCBzY2hlbWF0aWMuZGVzY3JpcHRpb24pO1xuICAgICAgfVxuXG4gICAgICBjb25maWcuZGVwZW5kZW5jaWVzID0gY29uZmlnLmRlcGVuZGVuY2llcyB8fCBbXTtcbiAgICAgIGlmIChkZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgY29uZmlnLmRlcGVuZGVuY2llcy51bnNoaWZ0KC4uLmRlcGVuZGVuY2llcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0YXNrU2NoZWR1bGVyLnNjaGVkdWxlKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRleHQ7XG4gIH1cblxuICBjcmVhdGVTY2hlbWF0aWMoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbGxlY3Rpb246IENvbGxlY3Rpb248Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+LFxuICAgIGFsbG93UHJpdmF0ZSA9IGZhbHNlLFxuICApOiBTY2hlbWF0aWM8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uSW1wbCA9IHRoaXMuX2NvbGxlY3Rpb25DYWNoZS5nZXQoY29sbGVjdGlvbi5kZXNjcmlwdGlvbi5uYW1lKTtcbiAgICBjb25zdCBzY2hlbWF0aWNNYXAgPSB0aGlzLl9zY2hlbWF0aWNDYWNoZS5nZXQoY29sbGVjdGlvbi5kZXNjcmlwdGlvbi5uYW1lKTtcbiAgICBpZiAoIWNvbGxlY3Rpb25JbXBsIHx8ICFzY2hlbWF0aWNNYXAgfHwgY29sbGVjdGlvbkltcGwgIT09IGNvbGxlY3Rpb24pIHtcbiAgICAgIC8vIFRoaXMgaXMgd2VpcmQsIG1heWJlIHRoZSBjb2xsZWN0aW9uIHdhcyBjcmVhdGVkIGJ5IGFub3RoZXIgZW5naW5lP1xuICAgICAgdGhyb3cgbmV3IFVua25vd25Db2xsZWN0aW9uRXhjZXB0aW9uKGNvbGxlY3Rpb24uZGVzY3JpcHRpb24ubmFtZSk7XG4gICAgfVxuXG4gICAgbGV0IHNjaGVtYXRpYyA9IHNjaGVtYXRpY01hcC5nZXQobmFtZSk7XG4gICAgaWYgKHNjaGVtYXRpYykge1xuICAgICAgcmV0dXJuIHNjaGVtYXRpYztcbiAgICB9XG5cbiAgICBsZXQgY29sbGVjdGlvbkRlc2NyaXB0aW9uID0gY29sbGVjdGlvbi5kZXNjcmlwdGlvbjtcbiAgICBsZXQgZGVzY3JpcHRpb24gPSB0aGlzLl9ob3N0LmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKG5hbWUsIGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuICAgIGlmICghZGVzY3JpcHRpb24pIHtcbiAgICAgIGlmIChjb2xsZWN0aW9uLmJhc2VEZXNjcmlwdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBiYXNlIG9mIGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgICAgIGRlc2NyaXB0aW9uID0gdGhpcy5faG9zdC5jcmVhdGVTY2hlbWF0aWNEZXNjcmlwdGlvbihuYW1lLCBiYXNlKTtcbiAgICAgICAgICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb25EZXNjcmlwdGlvbiA9IGJhc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZGVzY3JpcHRpb24pIHtcbiAgICAgICAgLy8gUmVwb3J0IHRoZSBlcnJvciBmb3IgdGhlIHRvcCBsZXZlbCBzY2hlbWF0aWMgY29sbGVjdGlvblxuICAgICAgICB0aHJvdyBuZXcgVW5rbm93blNjaGVtYXRpY0V4Y2VwdGlvbihuYW1lLCBjb2xsZWN0aW9uLmRlc2NyaXB0aW9uKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZGVzY3JpcHRpb24ucHJpdmF0ZSAmJiAhYWxsb3dQcml2YXRlKSB7XG4gICAgICB0aHJvdyBuZXcgUHJpdmF0ZVNjaGVtYXRpY0V4Y2VwdGlvbihuYW1lLCBjb2xsZWN0aW9uLmRlc2NyaXB0aW9uKTtcbiAgICB9XG5cbiAgICBjb25zdCBmYWN0b3J5ID0gdGhpcy5faG9zdC5nZXRTY2hlbWF0aWNSdWxlRmFjdG9yeShkZXNjcmlwdGlvbiwgY29sbGVjdGlvbkRlc2NyaXB0aW9uKTtcbiAgICBzY2hlbWF0aWMgPSBuZXcgU2NoZW1hdGljSW1wbDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4oZGVzY3JpcHRpb24sIGZhY3RvcnksIGNvbGxlY3Rpb24sIHRoaXMpO1xuXG4gICAgc2NoZW1hdGljTWFwLnNldChuYW1lLCBzY2hlbWF0aWMpO1xuXG4gICAgcmV0dXJuIHNjaGVtYXRpYztcbiAgfVxuXG4gIGxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uOiBDb2xsZWN0aW9uPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPik6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBuYW1lcyA9IHRoaXMuX2hvc3QubGlzdFNjaGVtYXRpY05hbWVzKGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuXG4gICAgaWYgKGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgZm9yIChjb25zdCBiYXNlIG9mIGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgICBuYW1lcy5wdXNoKC4uLnRoaXMuX2hvc3QubGlzdFNjaGVtYXRpY05hbWVzKGJhc2UpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZW1vdmUgZHVwbGljYXRlc1xuICAgIHJldHVybiBbLi4ubmV3IFNldChuYW1lcyldLnNvcnQoKTtcbiAgfVxuXG4gIHRyYW5zZm9ybU9wdGlvbnM8T3B0aW9uVCBleHRlbmRzIG9iamVjdCwgUmVzdWx0VCBleHRlbmRzIG9iamVjdD4oXG4gICAgc2NoZW1hdGljOiBTY2hlbWF0aWM8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+LFxuICAgIG9wdGlvbnM6IE9wdGlvblQsXG4gICAgY29udGV4dD86IFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICk6IE9ic2VydmFibGU8UmVzdWx0VD4ge1xuICAgIHJldHVybiB0aGlzLl9ob3N0LnRyYW5zZm9ybU9wdGlvbnM8T3B0aW9uVCwgUmVzdWx0VD4oc2NoZW1hdGljLmRlc2NyaXB0aW9uLCBvcHRpb25zLCBjb250ZXh0KTtcbiAgfVxuXG4gIGNyZWF0ZVNvdXJjZUZyb21VcmwodXJsOiBVcmwsIGNvbnRleHQ6IFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4pOiBTb3VyY2Uge1xuICAgIHN3aXRjaCAodXJsLnByb3RvY29sKSB7XG4gICAgICBjYXNlICdudWxsOic6IHJldHVybiAoKSA9PiBuZXcgTnVsbFRyZWUoKTtcbiAgICAgIGNhc2UgJ2VtcHR5Oic6IHJldHVybiAoKSA9PiBlbXB0eSgpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc3QgaG9zdFNvdXJjZSA9IHRoaXMuX2hvc3QuY3JlYXRlU291cmNlRnJvbVVybCh1cmwsIGNvbnRleHQpO1xuICAgICAgICBpZiAoIWhvc3RTb3VyY2UpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVW5rbm93blVybFNvdXJjZVByb3RvY29sKHVybC50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBob3N0U291cmNlO1xuICAgIH1cbiAgfVxuXG4gIGV4ZWN1dGVQb3N0VGFza3MoKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgY29uc3QgZXhlY3V0b3JzID0gbmV3IE1hcDxzdHJpbmcsIFRhc2tFeGVjdXRvcj4oKTtcblxuICAgIGNvbnN0IHRhc2tPYnNlcnZhYmxlID0gb2JzZXJ2YWJsZUZyb20odGhpcy5fdGFza1NjaGVkdWxlcnMpXG4gICAgICAucGlwZShcbiAgICAgICAgY29uY2F0TWFwKHNjaGVkdWxlciA9PiBzY2hlZHVsZXIuZmluYWxpemUoKSksXG4gICAgICAgIGNvbmNhdE1hcCh0YXNrID0+IHtcbiAgICAgICAgICBjb25zdCB7IG5hbWUsIG9wdGlvbnMgfSA9IHRhc2suY29uZmlndXJhdGlvbjtcblxuICAgICAgICAgIGNvbnN0IGV4ZWN1dG9yID0gZXhlY3V0b3JzLmdldChuYW1lKTtcbiAgICAgICAgICBpZiAoZXhlY3V0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRvcihvcHRpb25zLCB0YXNrLmNvbnRleHQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB0aGlzLl9ob3N0LmNyZWF0ZVRhc2tFeGVjdXRvcihuYW1lKVxuICAgICAgICAgICAgLnBpcGUoY29uY2F0TWFwKGV4ZWN1dG9yID0+IHtcbiAgICAgICAgICAgICAgZXhlY3V0b3JzLnNldChuYW1lLCBleGVjdXRvcik7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dG9yKG9wdGlvbnMsIHRhc2suY29udGV4dCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIHJldHVybiB0YXNrT2JzZXJ2YWJsZTtcbiAgfVxufVxuIl19