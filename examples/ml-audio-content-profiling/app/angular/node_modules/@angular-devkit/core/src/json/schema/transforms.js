"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const interface_1 = require("../interface");
const utility_1 = require("./utility");
function addUndefinedDefaults(value, _pointer, schema) {
    if (!schema) {
        return value;
    }
    const types = utility_1.getTypesOfSchema(schema);
    if (types.size === 0) {
        return value;
    }
    let type;
    if (types.size === 1) {
        // only one potential type
        type = Array.from(types)[0];
    }
    else if (types.size === 2 && types.has('array') && types.has('object')) {
        // need to create one of them and array is simpler
        type = 'array';
    }
    else if (schema.properties && types.has('object')) {
        // assume object
        type = 'object';
    }
    else if (schema.items && types.has('array')) {
        // assume array
        type = 'array';
    }
    else {
        // anything else needs to be checked by the consumer anyway
        return value;
    }
    if (type === 'array') {
        return value == undefined ? [] : value;
    }
    if (type === 'object') {
        let newValue;
        if (value == undefined) {
            newValue = {};
        }
        else if (interface_1.isJsonObject(value)) {
            newValue = value;
        }
        else {
            return value;
        }
        if (!interface_1.isJsonObject(schema.properties)) {
            return newValue;
        }
        for (const propName of Object.getOwnPropertyNames(schema.properties)) {
            if (propName in newValue) {
                continue;
            }
            else if (propName == '$schema') {
                continue;
            }
            // TODO: Does not currently handle more complex schemas (oneOf/anyOf/etc.)
            const defaultValue = schema.properties[propName].default;
            newValue[propName] = defaultValue;
        }
        return newValue;
    }
    return value;
}
exports.addUndefinedDefaults = addUndefinedDefaults;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3Jtcy5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvanNvbi9zY2hlbWEvdHJhbnNmb3Jtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILDRDQUFtRTtBQUVuRSx1Q0FBNkM7QUFFN0MsU0FBZ0Isb0JBQW9CLENBQ2xDLEtBQWdCLEVBQ2hCLFFBQXFCLEVBQ3JCLE1BQW1CO0lBRW5CLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsTUFBTSxLQUFLLEdBQUcsMEJBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkMsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRTtRQUNwQixPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsSUFBSSxJQUFJLENBQUM7SUFDVCxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO1FBQ3BCLDBCQUEwQjtRQUMxQixJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM3QjtTQUFNLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ3hFLGtEQUFrRDtRQUNsRCxJQUFJLEdBQUcsT0FBTyxDQUFDO0tBQ2hCO1NBQU0sSUFBSSxNQUFNLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbkQsZ0JBQWdCO1FBQ2hCLElBQUksR0FBRyxRQUFRLENBQUM7S0FDakI7U0FBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUM3QyxlQUFlO1FBQ2YsSUFBSSxHQUFHLE9BQU8sQ0FBQztLQUNoQjtTQUFNO1FBQ0wsMkRBQTJEO1FBQzNELE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7UUFDcEIsT0FBTyxLQUFLLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztLQUN4QztJQUVELElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUNyQixJQUFJLFFBQVEsQ0FBQztRQUNiLElBQUksS0FBSyxJQUFJLFNBQVMsRUFBRTtZQUN0QixRQUFRLEdBQUcsRUFBZ0IsQ0FBQztTQUM3QjthQUFNLElBQUksd0JBQVksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUM5QixRQUFRLEdBQUcsS0FBSyxDQUFDO1NBQ2xCO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsSUFBSSxDQUFDLHdCQUFZLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3BDLE9BQU8sUUFBUSxDQUFDO1NBQ2pCO1FBRUQsS0FBSyxNQUFNLFFBQVEsSUFBSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3BFLElBQUksUUFBUSxJQUFJLFFBQVEsRUFBRTtnQkFDeEIsU0FBUzthQUNWO2lCQUFNLElBQUksUUFBUSxJQUFJLFNBQVMsRUFBRTtnQkFDaEMsU0FBUzthQUNWO1lBRUQsMEVBQTBFO1lBQzFFLE1BQU0sWUFBWSxHQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFnQixDQUFDLE9BQU8sQ0FBQztZQUV6RSxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsWUFBWSxDQUFDO1NBQ25DO1FBRUQsT0FBTyxRQUFRLENBQUM7S0FDakI7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFuRUQsb0RBbUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgSnNvbk9iamVjdCwgSnNvblZhbHVlLCBpc0pzb25PYmplY3QgfSBmcm9tICcuLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgSnNvblBvaW50ZXIgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBnZXRUeXBlc09mU2NoZW1hIH0gZnJvbSAnLi91dGlsaXR5JztcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZFVuZGVmaW5lZERlZmF1bHRzKFxuICB2YWx1ZTogSnNvblZhbHVlLFxuICBfcG9pbnRlcjogSnNvblBvaW50ZXIsXG4gIHNjaGVtYT86IEpzb25PYmplY3QsXG4pOiBKc29uVmFsdWUge1xuICBpZiAoIXNjaGVtYSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGNvbnN0IHR5cGVzID0gZ2V0VHlwZXNPZlNjaGVtYShzY2hlbWEpO1xuICBpZiAodHlwZXMuc2l6ZSA9PT0gMCkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGxldCB0eXBlO1xuICBpZiAodHlwZXMuc2l6ZSA9PT0gMSkge1xuICAgIC8vIG9ubHkgb25lIHBvdGVudGlhbCB0eXBlXG4gICAgdHlwZSA9IEFycmF5LmZyb20odHlwZXMpWzBdO1xuICB9IGVsc2UgaWYgKHR5cGVzLnNpemUgPT09IDIgJiYgdHlwZXMuaGFzKCdhcnJheScpICYmIHR5cGVzLmhhcygnb2JqZWN0JykpIHtcbiAgICAvLyBuZWVkIHRvIGNyZWF0ZSBvbmUgb2YgdGhlbSBhbmQgYXJyYXkgaXMgc2ltcGxlclxuICAgIHR5cGUgPSAnYXJyYXknO1xuICB9IGVsc2UgaWYgKHNjaGVtYS5wcm9wZXJ0aWVzICYmIHR5cGVzLmhhcygnb2JqZWN0JykpIHtcbiAgICAvLyBhc3N1bWUgb2JqZWN0XG4gICAgdHlwZSA9ICdvYmplY3QnO1xuICB9IGVsc2UgaWYgKHNjaGVtYS5pdGVtcyAmJiB0eXBlcy5oYXMoJ2FycmF5JykpIHtcbiAgICAvLyBhc3N1bWUgYXJyYXlcbiAgICB0eXBlID0gJ2FycmF5JztcbiAgfSBlbHNlIHtcbiAgICAvLyBhbnl0aGluZyBlbHNlIG5lZWRzIHRvIGJlIGNoZWNrZWQgYnkgdGhlIGNvbnN1bWVyIGFueXdheVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGlmICh0eXBlID09PSAnYXJyYXknKSB7XG4gICAgcmV0dXJuIHZhbHVlID09IHVuZGVmaW5lZCA/IFtdIDogdmFsdWU7XG4gIH1cblxuICBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICBsZXQgbmV3VmFsdWU7XG4gICAgaWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuICAgICAgbmV3VmFsdWUgPSB7fSBhcyBKc29uT2JqZWN0O1xuICAgIH0gZWxzZSBpZiAoaXNKc29uT2JqZWN0KHZhbHVlKSkge1xuICAgICAgbmV3VmFsdWUgPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGlmICghaXNKc29uT2JqZWN0KHNjaGVtYS5wcm9wZXJ0aWVzKSkge1xuICAgICAgcmV0dXJuIG5ld1ZhbHVlO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgcHJvcE5hbWUgb2YgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoc2NoZW1hLnByb3BlcnRpZXMpKSB7XG4gICAgICBpZiAocHJvcE5hbWUgaW4gbmV3VmFsdWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2UgaWYgKHByb3BOYW1lID09ICckc2NoZW1hJykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gVE9ETzogRG9lcyBub3QgY3VycmVudGx5IGhhbmRsZSBtb3JlIGNvbXBsZXggc2NoZW1hcyAob25lT2YvYW55T2YvZXRjLilcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IChzY2hlbWEucHJvcGVydGllc1twcm9wTmFtZV0gYXMgSnNvbk9iamVjdCkuZGVmYXVsdDtcblxuICAgICAgbmV3VmFsdWVbcHJvcE5hbWVdID0gZGVmYXVsdFZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBuZXdWYWx1ZTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn1cbiJdfQ==