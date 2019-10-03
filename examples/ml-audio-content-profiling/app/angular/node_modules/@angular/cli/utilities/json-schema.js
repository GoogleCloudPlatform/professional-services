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
const tools_1 = require("@angular-devkit/schematics/tools");
const fs_1 = require("fs");
const path_1 = require("path");
const interface_1 = require("../models/interface");
class CommandJsonPathException extends core_1.BaseException {
    constructor(path, name) {
        super(`File ${path} was not found while constructing the subcommand ${name}.`);
        this.path = path;
        this.name = name;
    }
}
exports.CommandJsonPathException = CommandJsonPathException;
function _getEnumFromValue(value, enumeration, defaultValue) {
    if (typeof value !== 'string') {
        return defaultValue;
    }
    if (Object.values(enumeration).indexOf(value) !== -1) {
        return value;
    }
    return defaultValue;
}
async function parseJsonSchemaToSubCommandDescription(name, jsonPath, registry, schema) {
    const options = await parseJsonSchemaToOptions(registry, schema);
    const aliases = [];
    if (core_1.json.isJsonArray(schema.$aliases)) {
        schema.$aliases.forEach(value => {
            if (typeof value == 'string') {
                aliases.push(value);
            }
        });
    }
    if (core_1.json.isJsonArray(schema.aliases)) {
        schema.aliases.forEach(value => {
            if (typeof value == 'string') {
                aliases.push(value);
            }
        });
    }
    if (typeof schema.alias == 'string') {
        aliases.push(schema.alias);
    }
    let longDescription = '';
    if (typeof schema.$longDescription == 'string' && schema.$longDescription) {
        const ldPath = path_1.resolve(path_1.dirname(jsonPath), schema.$longDescription);
        try {
            longDescription = fs_1.readFileSync(ldPath, 'utf-8');
        }
        catch (e) {
            throw new CommandJsonPathException(ldPath, name);
        }
    }
    let usageNotes = '';
    if (typeof schema.$usageNotes == 'string' && schema.$usageNotes) {
        const unPath = path_1.resolve(path_1.dirname(jsonPath), schema.$usageNotes);
        try {
            usageNotes = fs_1.readFileSync(unPath, 'utf-8');
        }
        catch (e) {
            throw new CommandJsonPathException(unPath, name);
        }
    }
    const description = '' + (schema.description === undefined ? '' : schema.description);
    return Object.assign({ name,
        description }, (longDescription ? { longDescription } : {}), (usageNotes ? { usageNotes } : {}), { options,
        aliases });
}
exports.parseJsonSchemaToSubCommandDescription = parseJsonSchemaToSubCommandDescription;
async function parseJsonSchemaToCommandDescription(name, jsonPath, registry, schema) {
    const subcommand = await parseJsonSchemaToSubCommandDescription(name, jsonPath, registry, schema);
    // Before doing any work, let's validate the implementation.
    if (typeof schema.$impl != 'string') {
        throw new Error(`Command ${name} has an invalid implementation.`);
    }
    const ref = new tools_1.ExportStringRef(schema.$impl, path_1.dirname(jsonPath));
    const impl = ref.ref;
    if (impl === undefined || typeof impl !== 'function') {
        throw new Error(`Command ${name} has an invalid implementation.`);
    }
    const scope = _getEnumFromValue(schema.$scope, interface_1.CommandScope, interface_1.CommandScope.Default);
    const hidden = !!schema.$hidden;
    return Object.assign({}, subcommand, { scope,
        hidden,
        impl });
}
exports.parseJsonSchemaToCommandDescription = parseJsonSchemaToCommandDescription;
async function parseJsonSchemaToOptions(registry, schema) {
    const options = [];
    function visitor(current, pointer, parentSchema) {
        if (!parentSchema) {
            // Ignore root.
            return;
        }
        else if (pointer.split(/\/(?:properties|items|definitions)\//g).length > 2) {
            // Ignore subitems (objects or arrays).
            return;
        }
        else if (core_1.json.isJsonArray(current)) {
            return;
        }
        if (pointer.indexOf('/not/') != -1) {
            // We don't support anyOf/not.
            throw new Error('The "not" keyword is not supported in JSON Schema.');
        }
        const ptr = core_1.json.schema.parseJsonPointer(pointer);
        const name = ptr[ptr.length - 1];
        if (ptr[ptr.length - 2] != 'properties') {
            // Skip any non-property items.
            return;
        }
        const typeSet = core_1.json.schema.getTypesOfSchema(current);
        if (typeSet.size == 0) {
            throw new Error('Cannot find type of schema.');
        }
        // We only support number, string or boolean (or array of those), so remove everything else.
        const types = [...typeSet].filter(x => {
            switch (x) {
                case 'boolean':
                case 'number':
                case 'string':
                    return true;
                case 'array':
                    // Only include arrays if they're boolean, string or number.
                    if (core_1.json.isJsonObject(current.items)
                        && typeof current.items.type == 'string'
                        && ['boolean', 'number', 'string'].includes(current.items.type)) {
                        return true;
                    }
                    return false;
                default:
                    return false;
            }
        }).map(x => _getEnumFromValue(x, interface_1.OptionType, interface_1.OptionType.String));
        if (types.length == 0) {
            // This means it's not usable on the command line. e.g. an Object.
            return;
        }
        // Only keep enum values we support (booleans, numbers and strings).
        const enumValues = (core_1.json.isJsonArray(current.enum) && current.enum || []).filter(x => {
            switch (typeof x) {
                case 'boolean':
                case 'number':
                case 'string':
                    return true;
                default:
                    return false;
            }
        });
        let defaultValue = undefined;
        if (current.default !== undefined) {
            switch (types[0]) {
                case 'string':
                    if (typeof current.default == 'string') {
                        defaultValue = current.default;
                    }
                    break;
                case 'number':
                    if (typeof current.default == 'number') {
                        defaultValue = current.default;
                    }
                    break;
                case 'boolean':
                    if (typeof current.default == 'boolean') {
                        defaultValue = current.default;
                    }
                    break;
            }
        }
        const type = types[0];
        const $default = current.$default;
        const $defaultIndex = (core_1.json.isJsonObject($default) && $default['$source'] == 'argv')
            ? $default['index'] : undefined;
        const positional = typeof $defaultIndex == 'number'
            ? $defaultIndex : undefined;
        const required = core_1.json.isJsonArray(current.required)
            ? current.required.indexOf(name) != -1 : false;
        const aliases = core_1.json.isJsonArray(current.aliases) ? [...current.aliases].map(x => '' + x)
            : current.alias ? ['' + current.alias] : [];
        const format = typeof current.format == 'string' ? current.format : undefined;
        const visible = current.visible === undefined || current.visible === true;
        const hidden = !!current.hidden || !visible;
        const option = Object.assign({ name, description: '' + (current.description === undefined ? '' : current.description) }, types.length == 1 ? { type } : { type, types }, defaultValue !== undefined ? { default: defaultValue } : {}, enumValues && enumValues.length > 0 ? { enum: enumValues } : {}, { required,
            aliases }, format !== undefined ? { format } : {}, { hidden }, positional !== undefined ? { positional } : {});
        options.push(option);
    }
    const flattenedSchema = await registry.flatten(schema).toPromise();
    core_1.json.schema.visitJsonSchema(flattenedSchema, visitor);
    // Sort by positional.
    return options.sort((a, b) => {
        if (a.positional) {
            if (b.positional) {
                return a.positional - b.positional;
            }
            else {
                return 1;
            }
        }
        else if (b.positional) {
            return -1;
        }
        else {
            return 0;
        }
    });
}
exports.parseJsonSchemaToOptions = parseJsonSchemaToOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1zY2hlbWEuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL3V0aWxpdGllcy9qc29uLXNjaGVtYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUEyRDtBQUMzRCw0REFBbUU7QUFDbkUsMkJBQWtDO0FBQ2xDLCtCQUF3QztBQUN4QyxtREFRNkI7QUFHN0IsTUFBYSx3QkFBeUIsU0FBUSxvQkFBYTtJQUN6RCxZQUE0QixJQUFZLEVBQWtCLElBQVk7UUFDcEUsS0FBSyxDQUFDLFFBQVEsSUFBSSxvREFBb0QsSUFBSSxHQUFHLENBQUMsQ0FBQztRQURyRCxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQWtCLFNBQUksR0FBSixJQUFJLENBQVE7SUFFdEUsQ0FBQztDQUNGO0FBSkQsNERBSUM7QUFFRCxTQUFTLGlCQUFpQixDQUN4QixLQUFxQixFQUNyQixXQUFjLEVBQ2QsWUFBZTtJQUVmLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQzdCLE9BQU8sWUFBWSxDQUFDO0tBQ3JCO0lBRUQsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtRQUNwRCxPQUFPLEtBQXFCLENBQUM7S0FDOUI7SUFFRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDO0FBRU0sS0FBSyxVQUFVLHNDQUFzQyxDQUMxRCxJQUFZLEVBQ1osUUFBZ0IsRUFDaEIsUUFBb0MsRUFDcEMsTUFBdUI7SUFFdkIsTUFBTSxPQUFPLEdBQUcsTUFBTSx3QkFBd0IsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFakUsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO0lBQzdCLElBQUksV0FBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDckMsTUFBTSxDQUFDLFFB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QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDM0IsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFO1lBQ2hCLElBQUksQ0FBQyxDQUFDLFVBQVUsRUFBRTtnQkFDaEIsT0FBTyxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUM7YUFDcEM7aUJBQU07Z0JBQ0wsT0FBTyxDQUFDLENBQUM7YUFDVjtTQUNGO2FBQU0sSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFO1lBQ3ZCLE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDWDthQUFNO1lBQ0wsT0FBTyxDQUFDLENBQUM7U0FDVjtJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQXRKRCw0REFzSkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uLCBqc29uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgRXhwb3J0U3RyaW5nUmVmIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMnO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgZGlybmFtZSwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtcbiAgQ29tbWFuZENvbnN0cnVjdG9yLFxuICBDb21tYW5kRGVzY3JpcHRpb24sXG4gIENvbW1hbmRTY29wZSxcbiAgT3B0aW9uLFxuICBPcHRpb25UeXBlLFxuICBTdWJDb21tYW5kRGVzY3JpcHRpb24sXG4gIFZhbHVlLFxufSBmcm9tICcuLi9tb2RlbHMvaW50ZXJmYWNlJztcblxuXG5leHBvcnQgY2xhc3MgQ29tbWFuZEpzb25QYXRoRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBwYXRoOiBzdHJpbmcsIHB1YmxpYyByZWFkb25seSBuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgRmlsZSAke3BhdGh9IHdhcyBub3QgZm91bmQgd2hpbGUgY29uc3RydWN0aW5nIHRoZSBzdWJjb21tYW5kICR7bmFtZX0uYCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2dldEVudW1Gcm9tVmFsdWU8RSwgVCBleHRlbmRzIEVba2V5b2YgRV0+KFxuICB2YWx1ZToganNvbi5Kc29uVmFsdWUsXG4gIGVudW1lcmF0aW9uOiBFLFxuICBkZWZhdWx0VmFsdWU6IFQsXG4pOiBUIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICB9XG5cbiAgaWYgKE9iamVjdC52YWx1ZXMoZW51bWVyYXRpb24pLmluZGV4T2YodmFsdWUpICE9PSAtMSkge1xuICAgIHJldHVybiB2YWx1ZSBhcyB1bmtub3duIGFzIFQ7XG4gIH1cblxuICByZXR1cm4gZGVmYXVsdFZhbHVlO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VKc29uU2NoZW1hVG9TdWJDb21tYW5kRGVzY3JpcHRpb24oXG4gIG5hbWU6IHN0cmluZyxcbiAganNvblBhdGg6IHN0cmluZyxcbiAgcmVnaXN0cnk6IGpzb24uc2NoZW1hLlNjaGVtYVJlZ2lzdHJ5LFxuICBzY2hlbWE6IGpzb24uSnNvbk9iamVjdCxcbik6IFByb21pc2U8U3ViQ29tbWFuZERlc2NyaXB0aW9uPiB7XG4gIGNvbnN0IG9wdGlvbnMgPSBhd2FpdCBwYXJzZUpzb25TY2hlbWFUb09wdGlvbnMocmVnaXN0cnksIHNjaGVtYSk7XG5cbiAgY29uc3QgYWxpYXNlczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKGpzb24uaXNKc29uQXJyYXkoc2NoZW1hLiRhbGlhc2VzKSkge1xuICAgIHNjaGVtYS4kYWxpYXNlcy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgYWxpYXNlcy5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBpZiAoanNvbi5pc0pzb25BcnJheShzY2hlbWEuYWxpYXNlcykpIHtcbiAgICBzY2hlbWEuYWxpYXNlcy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgYWxpYXNlcy5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBpZiAodHlwZW9mIHNjaGVtYS5hbGlhcyA9PSAnc3RyaW5nJykge1xuICAgIGFsaWFzZXMucHVzaChzY2hlbWEuYWxpYXMpO1xuICB9XG5cbiAgbGV0IGxvbmdEZXNjcmlwdGlvbiA9ICcnO1xuICBpZiAodHlwZW9mIHNjaGVtYS4kbG9uZ0Rlc2NyaXB0aW9uID09ICdzdHJpbmcnICYmIHNjaGVtYS4kbG9uZ0Rlc2NyaXB0aW9uKSB7XG4gICAgY29uc3QgbGRQYXRoID0gcmVzb2x2ZShkaXJuYW1lKGpzb25QYXRoKSwgc2NoZW1hLiRsb25nRGVzY3JpcHRpb24pO1xuICAgIHRyeSB7XG4gICAgICBsb25nRGVzY3JpcHRpb24gPSByZWFkRmlsZVN5bmMobGRQYXRoLCAndXRmLTgnKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgQ29tbWFuZEpzb25QYXRoRXhjZXB0aW9uKGxkUGF0aCwgbmFtZSk7XG4gICAgfVxuICB9XG4gIGxldCB1c2FnZU5vdGVzID0gJyc7XG4gIGlmICh0eXBlb2Ygc2NoZW1hLiR1c2FnZU5vdGVzID09ICdzdHJpbmcnICYmIHNjaGVtYS4kdXNhZ2VOb3Rlcykge1xuICAgIGNvbnN0IHVuUGF0aCA9IHJlc29sdmUoZGlybmFtZShqc29uUGF0aCksIHNjaGVtYS4kdXNhZ2VOb3Rlcyk7XG4gICAgdHJ5IHtcbiAgICAgIHVzYWdlTm90ZXMgPSByZWFkRmlsZVN5bmModW5QYXRoLCAndXRmLTgnKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgQ29tbWFuZEpzb25QYXRoRXhjZXB0aW9uKHVuUGF0aCwgbmFtZSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZGVzY3JpcHRpb24gPSAnJyArIChzY2hlbWEuZGVzY3JpcHRpb24gPT09IHVuZGVmaW5lZCA/ICcnIDogc2NoZW1hLmRlc2NyaXB0aW9uKTtcblxuICByZXR1cm4ge1xuICAgIG5hbWUsXG4gICAgZGVzY3JpcHRpb24sXG4gICAgLi4uKGxvbmdEZXNjcmlwdGlvbiA/IHsgbG9uZ0Rlc2NyaXB0aW9uIH0gOiB7fSksXG4gICAgLi4uKHVzYWdlTm90ZXMgPyB7IHVzYWdlTm90ZXMgfSA6IHt9KSxcbiAgICBvcHRpb25zLFxuICAgIGFsaWFzZXMsXG4gIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUpzb25TY2hlbWFUb0NvbW1hbmREZXNjcmlwdGlvbihcbiAgbmFtZTogc3RyaW5nLFxuICBqc29uUGF0aDogc3RyaW5nLFxuICByZWdpc3RyeToganNvbi5zY2hlbWEuU2NoZW1hUmVnaXN0cnksXG4gIHNjaGVtYToganNvbi5Kc29uT2JqZWN0LFxuKTogUHJvbWlzZTxDb21tYW5kRGVzY3JpcHRpb24+IHtcbiAgY29uc3Qgc3ViY29tbWFuZCA9XG4gICAgYXdhaXQgcGFyc2VKc29uU2NoZW1hVG9TdWJDb21tYW5kRGVzY3JpcHRpb24obmFtZSwganNvblBhdGgsIHJlZ2lzdHJ5LCBzY2hlbWEpO1xuXG4gIC8vIEJlZm9yZSBkb2luZyBhbnkgd29yaywgbGV0J3MgdmFsaWRhdGUgdGhlIGltcGxlbWVudGF0aW9uLlxuICBpZiAodHlwZW9mIHNjaGVtYS4kaW1wbCAhPSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ29tbWFuZCAke25hbWV9IGhhcyBhbiBpbnZhbGlkIGltcGxlbWVudGF0aW9uLmApO1xuICB9XG4gIGNvbnN0IHJlZiA9IG5ldyBFeHBvcnRTdHJpbmdSZWY8Q29tbWFuZENvbnN0cnVjdG9yPihzY2hlbWEuJGltcGwsIGRpcm5hbWUoanNvblBhdGgpKTtcbiAgY29uc3QgaW1wbCA9IHJlZi5yZWY7XG5cbiAgaWYgKGltcGwgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgaW1wbCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ29tbWFuZCAke25hbWV9IGhhcyBhbiBpbnZhbGlkIGltcGxlbWVudGF0aW9uLmApO1xuICB9XG5cbiAgY29uc3Qgc2NvcGUgPSBfZ2V0RW51bUZyb21WYWx1ZShzY2hlbWEuJHNjb3BlLCBDb21tYW5kU2NvcGUsIENvbW1hbmRTY29wZS5EZWZhdWx0KTtcbiAgY29uc3QgaGlkZGVuID0gISFzY2hlbWEuJGhpZGRlbjtcblxuICByZXR1cm4ge1xuICAgIC4uLnN1YmNvbW1hbmQsXG4gICAgc2NvcGUsXG4gICAgaGlkZGVuLFxuICAgIGltcGwsXG4gIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUpzb25TY2hlbWFUb09wdGlvbnMoXG4gIHJlZ2lzdHJ5OiBqc29uLnNjaGVtYS5TY2hlbWFSZWdpc3RyeSxcbiAgc2NoZW1hOiBqc29uLkpzb25PYmplY3QsXG4pOiBQcm9taXNlPE9wdGlvbltdPiB7XG4gIGNvbnN0IG9wdGlvbnM6IE9wdGlvbltdID0gW107XG5cbiAgZnVuY3Rpb24gdmlzaXRvcihcbiAgICBjdXJyZW50OiBqc29uLkpzb25PYmplY3QgfCBqc29uLkpzb25BcnJheSxcbiAgICBwb2ludGVyOiBqc29uLnNjaGVtYS5Kc29uUG9pbnRlcixcbiAgICBwYXJlbnRTY2hlbWE/OiBqc29uLkpzb25PYmplY3QgfCBqc29uLkpzb25BcnJheSxcbiAgKSB7XG4gICAgaWYgKCFwYXJlbnRTY2hlbWEpIHtcbiAgICAgIC8vIElnbm9yZSByb290LlxuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAocG9pbnRlci5zcGxpdCgvXFwvKD86cHJvcGVydGllc3xpdGVtc3xkZWZpbml0aW9ucylcXC8vZykubGVuZ3RoID4gMikge1xuICAgICAgLy8gSWdub3JlIHN1Yml0ZW1zIChvYmplY3RzIG9yIGFycmF5cykuXG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmIChqc29uLmlzSnNvbkFycmF5KGN1cnJlbnQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHBvaW50ZXIuaW5kZXhPZignL25vdC8nKSAhPSAtMSkge1xuICAgICAgLy8gV2UgZG9uJ3Qgc3VwcG9ydCBhbnlPZi9ub3QuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBcIm5vdFwiIGtleXdvcmQgaXMgbm90IHN1cHBvcnRlZCBpbiBKU09OIFNjaGVtYS4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBwdHIgPSBqc29uLnNjaGVtYS5wYXJzZUpzb25Qb2ludGVyKHBvaW50ZXIpO1xuICAgIGNvbnN0IG5hbWUgPSBwdHJbcHRyLmxlbmd0aCAtIDFdO1xuXG4gICAgaWYgKHB0cltwdHIubGVuZ3RoIC0gMl0gIT0gJ3Byb3BlcnRpZXMnKSB7XG4gICAgICAvLyBTa2lwIGFueSBub24tcHJvcGVydHkgaXRlbXMuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdHlwZVNldCA9IGpzb24uc2NoZW1hLmdldFR5cGVzT2ZTY2hlbWEoY3VycmVudCk7XG5cbiAgICBpZiAodHlwZVNldC5zaXplID09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGZpbmQgdHlwZSBvZiBzY2hlbWEuJyk7XG4gICAgfVxuXG4gICAgLy8gV2Ugb25seSBzdXBwb3J0IG51bWJlciwgc3RyaW5nIG9yIGJvb2xlYW4gKG9yIGFycmF5IG9mIHRob3NlKSwgc28gcmVtb3ZlIGV2ZXJ5dGhpbmcgZWxzZS5cbiAgICBjb25zdCB0eXBlcyA9IFsuLi50eXBlU2V0XS5maWx0ZXIoeCA9PiB7XG4gICAgICBzd2l0Y2ggKHgpIHtcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgY2FzZSAnYXJyYXknOlxuICAgICAgICAgIC8vIE9ubHkgaW5jbHVkZSBhcnJheXMgaWYgdGhleSdyZSBib29sZWFuLCBzdHJpbmcgb3IgbnVtYmVyLlxuICAgICAgICAgIGlmIChqc29uLmlzSnNvbk9iamVjdChjdXJyZW50Lml0ZW1zKVxuICAgICAgICAgICAgICAmJiB0eXBlb2YgY3VycmVudC5pdGVtcy50eXBlID09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICYmIFsnYm9vbGVhbicsICdudW1iZXInLCAnc3RyaW5nJ10uaW5jbHVkZXMoY3VycmVudC5pdGVtcy50eXBlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0pLm1hcCh4ID0+IF9nZXRFbnVtRnJvbVZhbHVlKHgsIE9wdGlvblR5cGUsIE9wdGlvblR5cGUuU3RyaW5nKSk7XG5cbiAgICBpZiAodHlwZXMubGVuZ3RoID09IDApIHtcbiAgICAgIC8vIFRoaXMgbWVhbnMgaXQncyBub3QgdXNhYmxlIG9uIHRoZSBjb21tYW5kIGxpbmUuIGUuZy4gYW4gT2JqZWN0LlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE9ubHkga2VlcCBlbnVtIHZhbHVlcyB3ZSBzdXBwb3J0IChib29sZWFucywgbnVtYmVycyBhbmQgc3RyaW5ncykuXG4gICAgY29uc3QgZW51bVZhbHVlcyA9IChqc29uLmlzSnNvbkFycmF5KGN1cnJlbnQuZW51bSkgJiYgY3VycmVudC5lbnVtIHx8IFtdKS5maWx0ZXIoeCA9PiB7XG4gICAgICBzd2l0Y2ggKHR5cGVvZiB4KSB7XG4gICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0pIGFzIFZhbHVlW107XG5cbiAgICBsZXQgZGVmYXVsdFZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChjdXJyZW50LmRlZmF1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc3dpdGNoICh0eXBlc1swXSkge1xuICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudC5kZWZhdWx0ID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBjdXJyZW50LmRlZmF1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudC5kZWZhdWx0ID09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBjdXJyZW50LmRlZmF1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnQuZGVmYXVsdCA9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IGN1cnJlbnQuZGVmYXVsdDtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdHlwZSA9IHR5cGVzWzBdO1xuICAgIGNvbnN0ICRkZWZhdWx0ID0gY3VycmVudC4kZGVmYXVsdDtcbiAgICBjb25zdCAkZGVmYXVsdEluZGV4ID0gKGpzb24uaXNKc29uT2JqZWN0KCRkZWZhdWx0KSAmJiAkZGVmYXVsdFsnJHNvdXJjZSddID09ICdhcmd2JylcbiAgICAgID8gJGRlZmF1bHRbJ2luZGV4J10gOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgcG9zaXRpb25hbDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdHlwZW9mICRkZWZhdWx0SW5kZXggPT0gJ251bWJlcidcbiAgICAgID8gJGRlZmF1bHRJbmRleCA6IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IHJlcXVpcmVkID0ganNvbi5pc0pzb25BcnJheShjdXJyZW50LnJlcXVpcmVkKVxuICAgICAgPyBjdXJyZW50LnJlcXVpcmVkLmluZGV4T2YobmFtZSkgIT0gLTEgOiBmYWxzZTtcbiAgICBjb25zdCBhbGlhc2VzID0ganNvbi5pc0pzb25BcnJheShjdXJyZW50LmFsaWFzZXMpID8gWy4uLmN1cnJlbnQuYWxpYXNlc10ubWFwKHggPT4gJycgKyB4KVxuICAgICAgOiBjdXJyZW50LmFsaWFzID8gWycnICsgY3VycmVudC5hbGlhc10gOiBbXTtcbiAgICBjb25zdCBmb3JtYXQgPSB0eXBlb2YgY3VycmVudC5mb3JtYXQgPT0gJ3N0cmluZycgPyBjdXJyZW50LmZvcm1hdCA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCB2aXNpYmxlID0gY3VycmVudC52aXNpYmxlID09PSB1bmRlZmluZWQgfHwgY3VycmVudC52aXNpYmxlID09PSB0cnVlO1xuICAgIGNvbnN0IGhpZGRlbiA9ICEhY3VycmVudC5oaWRkZW4gfHwgIXZpc2libGU7XG5cbiAgICBjb25zdCBvcHRpb246IE9wdGlvbiA9IHtcbiAgICAgIG5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJycgKyAoY3VycmVudC5kZXNjcmlwdGlvbiA9PT0gdW5kZWZpbmVkID8gJycgOiBjdXJyZW50LmRlc2NyaXB0aW9uKSxcbiAgICAgIC4uLnR5cGVzLmxlbmd0aCA9PSAxID8geyB0eXBlIH0gOiB7IHR5cGUsIHR5cGVzIH0sXG4gICAgICAuLi5kZWZhdWx0VmFsdWUgIT09IHVuZGVmaW5lZCA/IHsgZGVmYXVsdDogZGVmYXVsdFZhbHVlIH0gOiB7fSxcbiAgICAgIC4uLmVudW1WYWx1ZXMgJiYgZW51bVZhbHVlcy5sZW5ndGggPiAwID8geyBlbnVtOiBlbnVtVmFsdWVzIH0gOiB7fSxcbiAgICAgIHJlcXVpcmVkLFxuICAgICAgYWxpYXNlcyxcbiAgICAgIC4uLmZvcm1hdCAhPT0gdW5kZWZpbmVkID8geyBmb3JtYXQgfSA6IHt9LFxuICAgICAgaGlkZGVuLFxuICAgICAgLi4ucG9zaXRpb25hbCAhPT0gdW5kZWZpbmVkID8geyBwb3NpdGlvbmFsIH0gOiB7fSxcbiAgICB9O1xuXG4gICAgb3B0aW9ucy5wdXNoKG9wdGlvbik7XG4gIH1cblxuICBjb25zdCBmbGF0dGVuZWRTY2hlbWEgPSBhd2FpdCByZWdpc3RyeS5mbGF0dGVuKHNjaGVtYSkudG9Qcm9taXNlKCk7XG4gIGpzb24uc2NoZW1hLnZpc2l0SnNvblNjaGVtYShmbGF0dGVuZWRTY2hlbWEsIHZpc2l0b3IpO1xuXG4gIC8vIFNvcnQgYnkgcG9zaXRpb25hbC5cbiAgcmV0dXJuIG9wdGlvbnMuc29ydCgoYSwgYikgPT4ge1xuICAgIGlmIChhLnBvc2l0aW9uYWwpIHtcbiAgICAgIGlmIChiLnBvc2l0aW9uYWwpIHtcbiAgICAgICAgcmV0dXJuIGEucG9zaXRpb25hbCAtIGIucG9zaXRpb25hbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYi5wb3NpdGlvbmFsKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgfSk7XG59XG4iXX0=