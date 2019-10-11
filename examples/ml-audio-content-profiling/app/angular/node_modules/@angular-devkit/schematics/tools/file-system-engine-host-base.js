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
const node_1 = require("@angular-devkit/core/node");
const fs_1 = require("fs");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const src_1 = require("../src");
const file_system_utility_1 = require("./file-system-utility");
class CollectionCannotBeResolvedException extends core_1.BaseException {
    constructor(name) {
        super(`Collection ${JSON.stringify(name)} cannot be resolved.`);
    }
}
exports.CollectionCannotBeResolvedException = CollectionCannotBeResolvedException;
class InvalidCollectionJsonException extends core_1.BaseException {
    constructor(_name, path, jsonException) {
        let msg = `Collection JSON at path ${JSON.stringify(path)} is invalid.`;
        if (jsonException) {
            msg = `${msg} ${jsonException.message}`;
        }
        super(msg);
    }
}
exports.InvalidCollectionJsonException = InvalidCollectionJsonException;
class SchematicMissingFactoryException extends core_1.BaseException {
    constructor(name) {
        super(`Schematic ${JSON.stringify(name)} is missing a factory.`);
    }
}
exports.SchematicMissingFactoryException = SchematicMissingFactoryException;
class FactoryCannotBeResolvedException extends core_1.BaseException {
    constructor(name) {
        super(`Schematic ${JSON.stringify(name)} cannot resolve the factory.`);
    }
}
exports.FactoryCannotBeResolvedException = FactoryCannotBeResolvedException;
class CollectionMissingSchematicsMapException extends core_1.BaseException {
    constructor(name) { super(`Collection "${name}" does not have a schematics map.`); }
}
exports.CollectionMissingSchematicsMapException = CollectionMissingSchematicsMapException;
class CollectionMissingFieldsException extends core_1.BaseException {
    constructor(name) { super(`Collection "${name}" is missing fields.`); }
}
exports.CollectionMissingFieldsException = CollectionMissingFieldsException;
class SchematicMissingFieldsException extends core_1.BaseException {
    constructor(name) { super(`Schematic "${name}" is missing fields.`); }
}
exports.SchematicMissingFieldsException = SchematicMissingFieldsException;
class SchematicMissingDescriptionException extends core_1.BaseException {
    constructor(name) { super(`Schematics "${name}" does not have a description.`); }
}
exports.SchematicMissingDescriptionException = SchematicMissingDescriptionException;
class SchematicNameCollisionException extends core_1.BaseException {
    constructor(name) {
        super(`Schematics/alias ${JSON.stringify(name)} collides with another alias or schematic`
            + ' name.');
    }
}
exports.SchematicNameCollisionException = SchematicNameCollisionException;
/**
 * A EngineHost base class that uses the file system to resolve collections. This is the base of
 * all other EngineHost provided by the tooling part of the Schematics library.
 */
class FileSystemEngineHostBase {
    constructor() {
        this._transforms = [];
        this._taskFactories = new Map();
    }
    /**
     * @deprecated Use `listSchematicNames`.
     */
    listSchematics(collection) {
        return this.listSchematicNames(collection.description);
    }
    listSchematicNames(collection) {
        const schematics = [];
        for (const key of Object.keys(collection.schematics)) {
            const schematic = collection.schematics[key];
            if (schematic.hidden || schematic.private) {
                continue;
            }
            // If extends is present without a factory it is an alias, do not return it
            //   unless it is from another collection.
            if (!schematic.extends || schematic.factory) {
                schematics.push(key);
            }
            else if (schematic.extends && schematic.extends.indexOf(':') !== -1) {
                schematics.push(key);
            }
        }
        return schematics;
    }
    registerOptionsTransform(t) {
        this._transforms.push(t);
    }
    /**
     *
     * @param name
     * @return {{path: string}}
     */
    createCollectionDescription(name) {
        const path = this._resolveCollectionPath(name);
        const jsonValue = file_system_utility_1.readJsonFile(path);
        if (!jsonValue || typeof jsonValue != 'object' || Array.isArray(jsonValue)) {
            throw new InvalidCollectionJsonException(name, path);
        }
        // normalize extends property to an array
        if (typeof jsonValue['extends'] === 'string') {
            jsonValue['extends'] = [jsonValue['extends']];
        }
        const description = this._transformCollectionDescription(name, Object.assign({}, jsonValue, { path }));
        if (!description || !description.name) {
            throw new InvalidCollectionJsonException(name, path);
        }
        // Validate aliases.
        const allNames = Object.keys(description.schematics);
        for (const schematicName of Object.keys(description.schematics)) {
            const aliases = description.schematics[schematicName].aliases || [];
            for (const alias of aliases) {
                if (allNames.indexOf(alias) != -1) {
                    throw new SchematicNameCollisionException(alias);
                }
            }
            allNames.push(...aliases);
        }
        return description;
    }
    createSchematicDescription(name, collection) {
        // Resolve aliases first.
        for (const schematicName of Object.keys(collection.schematics)) {
            const schematicDescription = collection.schematics[schematicName];
            if (schematicDescription.aliases && schematicDescription.aliases.indexOf(name) != -1) {
                name = schematicName;
                break;
            }
        }
        if (!(name in collection.schematics)) {
            return null;
        }
        const collectionPath = path_1.dirname(collection.path);
        const partialDesc = collection.schematics[name];
        if (!partialDesc) {
            return null;
        }
        if (partialDesc.extends) {
            const index = partialDesc.extends.indexOf(':');
            const collectionName = index !== -1 ? partialDesc.extends.substr(0, index) : null;
            const schematicName = index === -1 ?
                partialDesc.extends : partialDesc.extends.substr(index + 1);
            if (collectionName !== null) {
                const extendCollection = this.createCollectionDescription(collectionName);
                return this.createSchematicDescription(schematicName, extendCollection);
            }
            else {
                return this.createSchematicDescription(schematicName, collection);
            }
        }
        // Use any on this ref as we don't have the OptionT here, but we don't need it (we only need
        // the path).
        if (!partialDesc.factory) {
            throw new SchematicMissingFactoryException(name);
        }
        const resolvedRef = this._resolveReferenceString(partialDesc.factory, collectionPath);
        if (!resolvedRef) {
            throw new FactoryCannotBeResolvedException(name);
        }
        let schema = partialDesc.schema;
        let schemaJson = undefined;
        if (schema) {
            if (!path_1.isAbsolute(schema)) {
                schema = path_1.join(collectionPath, schema);
            }
            schemaJson = file_system_utility_1.readJsonFile(schema);
        }
        // The schematic path is used to resolve URLs.
        // We should be able to just do `dirname(resolvedRef.path)` but for compatibility with
        // Bazel under Windows this directory needs to be resolved from the collection instead.
        // This is needed because on Bazel under Windows the data files (such as the collection or
        // url files) are not in the same place as the compiled JS.
        const maybePath = path_1.join(collectionPath, partialDesc.factory);
        const path = fs_1.existsSync(maybePath) && fs_1.statSync(maybePath).isDirectory()
            ? maybePath : path_1.dirname(maybePath);
        return this._transformSchematicDescription(name, collection, Object.assign({}, partialDesc, { schema,
            schemaJson,
            name,
            path, factoryFn: resolvedRef.ref, collection }));
    }
    createSourceFromUrl(url) {
        switch (url.protocol) {
            case null:
            case 'file:':
                return (context) => {
                    // Resolve all file:///a/b/c/d from the schematic's own path, and not the current
                    // path.
                    const root = core_1.normalize(path_1.resolve(context.schematic.description.path, url.path || ''));
                    return new src_1.HostCreateTree(new core_1.virtualFs.ScopedHost(new node_1.NodeJsSyncHost(), root));
                };
        }
        return null;
    }
    transformOptions(schematic, options, context) {
        // tslint:disable-next-line:no-any https://github.com/ReactiveX/rxjs/issues/3989
        return (rxjs_1.of(options)
            .pipe(...this._transforms.map(tFn => operators_1.mergeMap(opt => {
            const newOptions = tFn(schematic, opt, context);
            if (core_1.isObservable(newOptions)) {
                return newOptions;
            }
            else {
                return rxjs_1.of(newOptions);
            }
        }))));
    }
    transformContext(context) {
        return context;
    }
    getSchematicRuleFactory(schematic, _collection) {
        return schematic.factoryFn;
    }
    registerTaskExecutor(factory, options) {
        this._taskFactories.set(factory.name, () => rxjs_1.from(factory.create(options)));
    }
    createTaskExecutor(name) {
        const factory = this._taskFactories.get(name);
        if (factory) {
            return factory();
        }
        return rxjs_1.throwError(new src_1.UnregisteredTaskException(name));
    }
    hasTaskExecutor(name) {
        return this._taskFactories.has(name);
    }
}
exports.FileSystemEngineHostBase = FileSystemEngineHostBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBUThCO0FBQzlCLG9EQUEyRDtBQUMzRCwyQkFBMEM7QUFDMUMsK0JBQTBEO0FBQzFELCtCQUEwRjtBQUMxRiw4Q0FBMEM7QUFFMUMsZ0NBUWdCO0FBU2hCLCtEQUFxRDtBQVdyRCxNQUFhLG1DQUFvQyxTQUFRLG9CQUFhO0lBQ3BFLFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsY0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7Q0FDRjtBQUpELGtGQUlDO0FBQ0QsTUFBYSw4QkFBK0IsU0FBUSxvQkFBYTtJQUMvRCxZQUNFLEtBQWEsRUFDYixJQUFZLEVBQ1osYUFBNkU7UUFFN0UsSUFBSSxHQUFHLEdBQUcsMkJBQTJCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUV4RSxJQUFJLGFBQWEsRUFBRTtZQUNqQixHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3pDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsQ0FBQztDQUNGO0FBZEQsd0VBY0M7QUFDRCxNQUFhLGdDQUFpQyxTQUFRLG9CQUFhO0lBQ2pFLFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBQ25FLENBQUM7Q0FDRjtBQUpELDRFQUlDO0FBQ0QsTUFBYSxnQ0FBaUMsU0FBUSxvQkFBYTtJQUNqRSxZQUFZLElBQVk7UUFD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SUFBSSxtQkFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUM1QixPQUFPLFVBQVUsQ0FBQzthQUNuQjtpQkFBTTtnQkFDTCxPQUFPLFNBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNqQztRQUNILENBQUMsQ0FBQyxDQUFDLENBQ0osQ0FBOEIsQ0FBQztJQUNwQyxDQUFDO0lBRUQsZ0JBQWdCLENBQUMsT0FBbUM7UUFDbEQsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVELHVCQUF1QixDQUNyQixTQUFrQyxFQUNsQyxXQUFxQztRQUNyQyxPQUFPLFNBQVMsQ0FBQyxTQUFTLENBQUM7SUFDN0IsQ0FBQztJQUVELG9CQUFvQixDQUFJLE9BQStCLEVBQUUsT0FBVztRQUNsRSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLFdBQWMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RixDQUFDO0lBRUQsa0JBQWtCLENBQUMsSUFBWTtRQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxJQUFJLE9BQU8sRUFBRTtZQUNYLE9BQU8sT0FBTyxFQUFFLENBQUM7U0FDbEI7UUFFRCxPQUFPLGlCQUFVLENBQUMsSUFBSSwrQkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxlQUFlLENBQUMsSUFBWTtRQUMxQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQWpPRCw0REFpT0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBCYXNlRXhjZXB0aW9uLFxuICBJbnZhbGlkSnNvbkNoYXJhY3RlckV4Y2VwdGlvbixcbiAgSnNvbk9iamVjdCxcbiAgVW5leHBlY3RlZEVuZE9mSW5wdXRFeGNlcHRpb24sXG4gIGlzT2JzZXJ2YWJsZSxcbiAgbm9ybWFsaXplLFxuICB2aXJ0dWFsRnMsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE5vZGVKc1N5bmNIb3N0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvbm9kZSc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCBzdGF0U3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGRpcm5hbWUsIGlzQWJzb2x1dGUsIGpvaW4sIHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IE9ic2VydmFibGUsIGZyb20gYXMgb2JzZXJ2YWJsZUZyb20sIG9mIGFzIG9ic2VydmFibGVPZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgbWVyZ2VNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBVcmwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHtcbiAgRW5naW5lSG9zdCxcbiAgSG9zdENyZWF0ZVRyZWUsXG4gIFJ1bGVGYWN0b3J5LFxuICBTb3VyY2UsXG4gIFRhc2tFeGVjdXRvcixcbiAgVGFza0V4ZWN1dG9yRmFjdG9yeSxcbiAgVW5yZWdpc3RlcmVkVGFza0V4Y2VwdGlvbixcbn0gZnJvbSAnLi4vc3JjJztcbmltcG9ydCB7XG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uLFxuICBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0LFxuICBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxufSBmcm9tICcuL2Rlc2NyaXB0aW9uJztcbmltcG9ydCB7IHJlYWRKc29uRmlsZSB9IGZyb20gJy4vZmlsZS1zeXN0ZW0tdXRpbGl0eSc7XG5cblxuZXhwb3J0IGRlY2xhcmUgdHlwZSBPcHRpb25UcmFuc2Zvcm08VCBleHRlbmRzIG9iamVjdCwgUiBleHRlbmRzIG9iamVjdD5cbiAgICA9IChcbiAgICAgIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxuICAgICAgb3B0aW9uczogVCxcbiAgICAgIGNvbnRleHQ/OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCxcbiAgICApID0+IE9ic2VydmFibGU8Uj47XG5cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25DYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBDb2xsZWN0aW9uICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGNhbm5vdCBiZSByZXNvbHZlZC5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihcbiAgICBfbmFtZTogc3RyaW5nLFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBqc29uRXhjZXB0aW9uPzogVW5leHBlY3RlZEVuZE9mSW5wdXRFeGNlcHRpb24gfCBJbnZhbGlkSnNvbkNoYXJhY3RlckV4Y2VwdGlvbixcbiAgKSB7XG4gICAgbGV0IG1zZyA9IGBDb2xsZWN0aW9uIEpTT04gYXQgcGF0aCAke0pTT04uc3RyaW5naWZ5KHBhdGgpfSBpcyBpbnZhbGlkLmA7XG5cbiAgICBpZiAoanNvbkV4Y2VwdGlvbikge1xuICAgICAgbXNnID0gYCR7bXNnfSAke2pzb25FeGNlcHRpb24ubWVzc2FnZX1gO1xuICAgIH1cblxuICAgIHN1cGVyKG1zZyk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRmFjdG9yeUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgU2NoZW1hdGljICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGlzIG1pc3NpbmcgYSBmYWN0b3J5LmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRmFjdG9yeUNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjYW5ub3QgcmVzb2x2ZSB0aGUgZmFjdG9yeS5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25NaXNzaW5nU2NoZW1hdGljc01hcEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYENvbGxlY3Rpb24gXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIHNjaGVtYXRpY3MgbWFwLmApOyB9XG59XG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbk1pc3NpbmdGaWVsZHNFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBDb2xsZWN0aW9uIFwiJHtuYW1lfVwiIGlzIG1pc3NpbmcgZmllbGRzLmApOyB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0ZpZWxkc0V4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYFNjaGVtYXRpYyBcIiR7bmFtZX1cIiBpcyBtaXNzaW5nIGZpZWxkcy5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY01pc3NpbmdEZXNjcmlwdGlvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYFNjaGVtYXRpY3MgXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIGRlc2NyaXB0aW9uLmApOyB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTmFtZUNvbGxpc2lvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgU2NoZW1hdGljcy9hbGlhcyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjb2xsaWRlcyB3aXRoIGFub3RoZXIgYWxpYXMgb3Igc2NoZW1hdGljYFxuICAgICAgICAgICsgJyBuYW1lLicpO1xuICB9XG59XG5cblxuLyoqXG4gKiBBIEVuZ2luZUhvc3QgYmFzZSBjbGFzcyB0aGF0IHVzZXMgdGhlIGZpbGUgc3lzdGVtIHRvIHJlc29sdmUgY29sbGVjdGlvbnMuIFRoaXMgaXMgdGhlIGJhc2Ugb2ZcbiAqIGFsbCBvdGhlciBFbmdpbmVIb3N0IHByb3ZpZGVkIGJ5IHRoZSB0b29saW5nIHBhcnQgb2YgdGhlIFNjaGVtYXRpY3MgbGlicmFyeS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSBpbXBsZW1lbnRzXG4gICAgRW5naW5lSG9zdDxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24+IHtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZTogc3RyaW5nKTogc3RyaW5nO1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3Jlc29sdmVSZWZlcmVuY2VTdHJpbmcoXG4gICAgICBuYW1lOiBzdHJpbmcsIHBhcmVudFBhdGg6IHN0cmluZyk6IHsgcmVmOiBSdWxlRmFjdG9yeTx7fT4sIHBhdGg6IHN0cmluZyB9IHwgbnVsbDtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgICBuYW1lOiBzdHJpbmcsIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjPik6IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYztcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihcbiAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgICAgIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M+KTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M7XG5cbiAgcHJpdmF0ZSBfdHJhbnNmb3JtczogT3B0aW9uVHJhbnNmb3JtPHt9LCB7fT5bXSA9IFtdO1xuICBwcml2YXRlIF90YXNrRmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsICgpID0+IE9ic2VydmFibGU8VGFza0V4ZWN1dG9yPj4oKTtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgVXNlIGBsaXN0U2NoZW1hdGljTmFtZXNgLlxuICAgKi9cbiAgbGlzdFNjaGVtYXRpY3MoY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb24pOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdFNjaGVtYXRpY05hbWVzKGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuICB9XG4gIGxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MpIHtcbiAgICBjb25zdCBzY2hlbWF0aWNzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpYyA9IGNvbGxlY3Rpb24uc2NoZW1hdGljc1trZXldO1xuXG4gICAgICBpZiAoc2NoZW1hdGljLmhpZGRlbiB8fCBzY2hlbWF0aWMucHJpdmF0ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgZXh0ZW5kcyBpcyBwcmVzZW50IHdpdGhvdXQgYSBmYWN0b3J5IGl0IGlzIGFuIGFsaWFzLCBkbyBub3QgcmV0dXJuIGl0XG4gICAgICAvLyAgIHVubGVzcyBpdCBpcyBmcm9tIGFub3RoZXIgY29sbGVjdGlvbi5cbiAgICAgIGlmICghc2NoZW1hdGljLmV4dGVuZHMgfHwgc2NoZW1hdGljLmZhY3RvcnkpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9IGVsc2UgaWYgKHNjaGVtYXRpYy5leHRlbmRzICYmIHNjaGVtYXRpYy5leHRlbmRzLmluZGV4T2YoJzonKSAhPT0gLTEpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjaGVtYXRpY3M7XG4gIH1cblxuICByZWdpc3Rlck9wdGlvbnNUcmFuc2Zvcm08VCBleHRlbmRzIG9iamVjdCwgUiBleHRlbmRzIG9iamVjdD4odDogT3B0aW9uVHJhbnNmb3JtPFQsIFI+KSB7XG4gICAgdGhpcy5fdHJhbnNmb3Jtcy5wdXNoKHQpO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lXG4gICAqIEByZXR1cm4ge3twYXRoOiBzdHJpbmd9fVxuICAgKi9cbiAgY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWU6IHN0cmluZyk6IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuX3Jlc29sdmVDb2xsZWN0aW9uUGF0aChuYW1lKTtcbiAgICBjb25zdCBqc29uVmFsdWUgPSByZWFkSnNvbkZpbGUocGF0aCk7XG4gICAgaWYgKCFqc29uVmFsdWUgfHwgdHlwZW9mIGpzb25WYWx1ZSAhPSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KGpzb25WYWx1ZSkpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24obmFtZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gbm9ybWFsaXplIGV4dGVuZHMgcHJvcGVydHkgdG8gYW4gYXJyYXlcbiAgICBpZiAodHlwZW9mIGpzb25WYWx1ZVsnZXh0ZW5kcyddID09PSAnc3RyaW5nJykge1xuICAgICAganNvblZhbHVlWydleHRlbmRzJ10gPSBbanNvblZhbHVlWydleHRlbmRzJ11dO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5fdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWUsIHtcbiAgICAgIC4uLmpzb25WYWx1ZSxcbiAgICAgIHBhdGgsXG4gICAgfSk7XG4gICAgaWYgKCFkZXNjcmlwdGlvbiB8fCAhZGVzY3JpcHRpb24ubmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbihuYW1lLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBhbGlhc2VzLlxuICAgIGNvbnN0IGFsbE5hbWVzID0gT2JqZWN0LmtleXMoZGVzY3JpcHRpb24uc2NoZW1hdGljcyk7XG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGRlc2NyaXB0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBhbGlhc2VzID0gZGVzY3JpcHRpb24uc2NoZW1hdGljc1tzY2hlbWF0aWNOYW1lXS5hbGlhc2VzIHx8IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IGFsaWFzIG9mIGFsaWFzZXMpIHtcbiAgICAgICAgaWYgKGFsbE5hbWVzLmluZGV4T2YoYWxpYXMpICE9IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY05hbWVDb2xsaXNpb25FeGNlcHRpb24oYWxpYXMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFsbE5hbWVzLnB1c2goLi4uYWxpYXNlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2NyaXB0aW9uO1xuICB9XG5cbiAgY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgKTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MgfCBudWxsIHtcbiAgICAvLyBSZXNvbHZlIGFsaWFzZXMgZmlyc3QuXG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY0Rlc2NyaXB0aW9uID0gY29sbGVjdGlvbi5zY2hlbWF0aWNzW3NjaGVtYXRpY05hbWVdO1xuICAgICAgaWYgKHNjaGVtYXRpY0Rlc2NyaXB0aW9uLmFsaWFzZXMgJiYgc2NoZW1hdGljRGVzY3JpcHRpb24uYWxpYXNlcy5pbmRleE9mKG5hbWUpICE9IC0xKSB7XG4gICAgICAgIG5hbWUgPSBzY2hlbWF0aWNOYW1lO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIShuYW1lIGluIGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbGxlY3Rpb25QYXRoID0gZGlybmFtZShjb2xsZWN0aW9uLnBhdGgpO1xuICAgIGNvbnN0IHBhcnRpYWxEZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPiB8IG51bGwgPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3NbbmFtZV07XG4gICAgaWYgKCFwYXJ0aWFsRGVzYykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHBhcnRpYWxEZXNjLmV4dGVuZHMpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFydGlhbERlc2MuZXh0ZW5kcy5pbmRleE9mKCc6Jyk7XG4gICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IGluZGV4ICE9PSAtMSA/IHBhcnRpYWxEZXNjLmV4dGVuZHMuc3Vic3RyKDAsIGluZGV4KSA6IG51bGw7XG4gICAgICBjb25zdCBzY2hlbWF0aWNOYW1lID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgcGFydGlhbERlc2MuZXh0ZW5kcyA6IHBhcnRpYWxEZXNjLmV4dGVuZHMuc3Vic3RyKGluZGV4ICsgMSk7XG5cbiAgICAgIGlmIChjb2xsZWN0aW9uTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBleHRlbmRDb2xsZWN0aW9uID0gdGhpcy5jcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24oY29sbGVjdGlvbk5hbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKHNjaGVtYXRpY05hbWUsIGV4dGVuZENvbGxlY3Rpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oc2NoZW1hdGljTmFtZSwgY29sbGVjdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFVzZSBhbnkgb24gdGhpcyByZWYgYXMgd2UgZG9uJ3QgaGF2ZSB0aGUgT3B0aW9uVCBoZXJlLCBidXQgd2UgZG9uJ3QgbmVlZCBpdCAod2Ugb25seSBuZWVkXG4gICAgLy8gdGhlIHBhdGgpLlxuICAgIGlmICghcGFydGlhbERlc2MuZmFjdG9yeSkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY01pc3NpbmdGYWN0b3J5RXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZFJlZiA9IHRoaXMuX3Jlc29sdmVSZWZlcmVuY2VTdHJpbmcocGFydGlhbERlc2MuZmFjdG9yeSwgY29sbGVjdGlvblBhdGgpO1xuICAgIGlmICghcmVzb2x2ZWRSZWYpIHtcbiAgICAgIHRocm93IG5ldyBGYWN0b3J5Q2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG5cbiAgICBsZXQgc2NoZW1hID0gcGFydGlhbERlc2Muc2NoZW1hO1xuICAgIGxldCBzY2hlbWFKc29uOiBKc29uT2JqZWN0IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChzY2hlbWEpIHtcbiAgICAgIGlmICghaXNBYnNvbHV0ZShzY2hlbWEpKSB7XG4gICAgICAgIHNjaGVtYSA9IGpvaW4oY29sbGVjdGlvblBhdGgsIHNjaGVtYSk7XG4gICAgICB9XG4gICAgICBzY2hlbWFKc29uID0gcmVhZEpzb25GaWxlKHNjaGVtYSkgYXMgSnNvbk9iamVjdDtcbiAgICB9XG5cbiAgICAvLyBUaGUgc2NoZW1hdGljIHBhdGggaXMgdXNlZCB0byByZXNvbHZlIFVSTHMuXG4gICAgLy8gV2Ugc2hvdWxkIGJlIGFibGUgdG8ganVzdCBkbyBgZGlybmFtZShyZXNvbHZlZFJlZi5wYXRoKWAgYnV0IGZvciBjb21wYXRpYmlsaXR5IHdpdGhcbiAgICAvLyBCYXplbCB1bmRlciBXaW5kb3dzIHRoaXMgZGlyZWN0b3J5IG5lZWRzIHRvIGJlIHJlc29sdmVkIGZyb20gdGhlIGNvbGxlY3Rpb24gaW5zdGVhZC5cbiAgICAvLyBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIG9uIEJhemVsIHVuZGVyIFdpbmRvd3MgdGhlIGRhdGEgZmlsZXMgKHN1Y2ggYXMgdGhlIGNvbGxlY3Rpb24gb3JcbiAgICAvLyB1cmwgZmlsZXMpIGFyZSBub3QgaW4gdGhlIHNhbWUgcGxhY2UgYXMgdGhlIGNvbXBpbGVkIEpTLlxuICAgIGNvbnN0IG1heWJlUGF0aCA9IGpvaW4oY29sbGVjdGlvblBhdGgsIHBhcnRpYWxEZXNjLmZhY3RvcnkpO1xuICAgIGNvbnN0IHBhdGggPSBleGlzdHNTeW5jKG1heWJlUGF0aCkgJiYgc3RhdFN5bmMobWF5YmVQYXRoKS5pc0RpcmVjdG9yeSgpXG4gICAgICA/IG1heWJlUGF0aCA6IGRpcm5hbWUobWF5YmVQYXRoKTtcblxuICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihuYW1lLCBjb2xsZWN0aW9uLCB7XG4gICAgICAuLi5wYXJ0aWFsRGVzYyxcbiAgICAgIHNjaGVtYSxcbiAgICAgIHNjaGVtYUpzb24sXG4gICAgICBuYW1lLFxuICAgICAgcGF0aCxcbiAgICAgIGZhY3RvcnlGbjogcmVzb2x2ZWRSZWYucmVmLFxuICAgICAgY29sbGVjdGlvbixcbiAgICB9KTtcbiAgfVxuXG4gIGNyZWF0ZVNvdXJjZUZyb21VcmwodXJsOiBVcmwpOiBTb3VyY2UgfCBudWxsIHtcbiAgICBzd2l0Y2ggKHVybC5wcm90b2NvbCkge1xuICAgICAgY2FzZSBudWxsOlxuICAgICAgY2FzZSAnZmlsZTonOlxuICAgICAgICByZXR1cm4gKGNvbnRleHQ6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgICAgICAgLy8gUmVzb2x2ZSBhbGwgZmlsZTovLy9hL2IvYy9kIGZyb20gdGhlIHNjaGVtYXRpYydzIG93biBwYXRoLCBhbmQgbm90IHRoZSBjdXJyZW50XG4gICAgICAgICAgLy8gcGF0aC5cbiAgICAgICAgICBjb25zdCByb290ID0gbm9ybWFsaXplKHJlc29sdmUoY29udGV4dC5zY2hlbWF0aWMuZGVzY3JpcHRpb24ucGF0aCwgdXJsLnBhdGggfHwgJycpKTtcblxuICAgICAgICAgIHJldHVybiBuZXcgSG9zdENyZWF0ZVRyZWUobmV3IHZpcnR1YWxGcy5TY29wZWRIb3N0KG5ldyBOb2RlSnNTeW5jSG9zdCgpLCByb290KSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB0cmFuc2Zvcm1PcHRpb25zPE9wdGlvblQgZXh0ZW5kcyBvYmplY3QsIFJlc3VsdFQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gICAgb3B0aW9uczogT3B0aW9uVCxcbiAgICBjb250ZXh0PzogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQsXG4gICk6IE9ic2VydmFibGU8UmVzdWx0VD4ge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnkgaHR0cHM6Ly9naXRodWIuY29tL1JlYWN0aXZlWC9yeGpzL2lzc3Vlcy8zOTg5XG4gICAgcmV0dXJuICgob2JzZXJ2YWJsZU9mKG9wdGlvbnMpIGFzIGFueSlcbiAgICAgIC5waXBlKFxuICAgICAgICAuLi50aGlzLl90cmFuc2Zvcm1zLm1hcCh0Rm4gPT4gbWVyZ2VNYXAob3B0ID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdPcHRpb25zID0gdEZuKHNjaGVtYXRpYywgb3B0LCBjb250ZXh0KTtcbiAgICAgICAgICBpZiAoaXNPYnNlcnZhYmxlKG5ld09wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3T3B0aW9ucztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihuZXdPcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKSxcbiAgICAgICkpIGFzIHt9IGFzIE9ic2VydmFibGU8UmVzdWx0VD47XG4gIH1cblxuICB0cmFuc2Zvcm1Db250ZXh0KGNvbnRleHQ6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0KTogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQge1xuICAgIHJldHVybiBjb250ZXh0O1xuICB9XG5cbiAgZ2V0U2NoZW1hdGljUnVsZUZhY3Rvcnk8T3B0aW9uVCBleHRlbmRzIG9iamVjdD4oXG4gICAgc2NoZW1hdGljOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgICBfY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjKTogUnVsZUZhY3Rvcnk8T3B0aW9uVD4ge1xuICAgIHJldHVybiBzY2hlbWF0aWMuZmFjdG9yeUZuO1xuICB9XG5cbiAgcmVnaXN0ZXJUYXNrRXhlY3V0b3I8VD4oZmFjdG9yeTogVGFza0V4ZWN1dG9yRmFjdG9yeTxUPiwgb3B0aW9ucz86IFQpOiB2b2lkIHtcbiAgICB0aGlzLl90YXNrRmFjdG9yaWVzLnNldChmYWN0b3J5Lm5hbWUsICgpID0+IG9ic2VydmFibGVGcm9tKGZhY3RvcnkuY3JlYXRlKG9wdGlvbnMpKSk7XG4gIH1cblxuICBjcmVhdGVUYXNrRXhlY3V0b3IobmFtZTogc3RyaW5nKTogT2JzZXJ2YWJsZTxUYXNrRXhlY3V0b3I+IHtcbiAgICBjb25zdCBmYWN0b3J5ID0gdGhpcy5fdGFza0ZhY3Rvcmllcy5nZXQobmFtZSk7XG4gICAgaWYgKGZhY3RvcnkpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRocm93RXJyb3IobmV3IFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24obmFtZSkpO1xuICB9XG5cbiAgaGFzVGFza0V4ZWN1dG9yKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl90YXNrRmFjdG9yaWVzLmhhcyhuYW1lKTtcbiAgfVxufVxuIl19