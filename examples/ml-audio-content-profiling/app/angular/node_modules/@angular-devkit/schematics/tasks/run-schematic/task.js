"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
class RunSchematicTask {
    constructor(c, s, o) {
        if (arguments.length == 2 || typeof s !== 'string') {
            o = s;
            s = c;
            c = null;
        }
        this._collection = c;
        this._schematic = s;
        this._options = o;
    }
    toConfiguration() {
        return {
            name: options_1.RunSchematicName,
            options: {
                collection: this._collection,
                name: this._schematic,
                options: this._options,
            },
        };
    }
}
exports.RunSchematicTask = RunSchematicTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFzay5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90YXNrcy9ydW4tc2NoZW1hdGljL3Rhc2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSx1Q0FBc0U7QUFHdEUsTUFBYSxnQkFBZ0I7SUFRM0IsWUFBWSxDQUFnQixFQUFFLENBQWEsRUFBRSxDQUFLO1FBQ2hELElBQUksU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxFQUFFO1lBQ2xELENBQUMsR0FBRyxDQUFNLENBQUM7WUFDWCxDQUFDLEdBQUcsQ0FBVyxDQUFDO1lBQ2hCLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDVjtRQUVELElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBVyxDQUFDO1FBQzlCLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBTSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxlQUFlO1FBQ2IsT0FBTztZQUNMLElBQUksRUFBRSwwQkFBZ0I7WUFDdEIsT0FBTyxFQUFFO2dCQUNQLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDNUIsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO2dCQUNyQixPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVE7YUFDdkI7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBOUJELDRDQThCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IFRhc2tDb25maWd1cmF0aW9uLCBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvciB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBSdW5TY2hlbWF0aWNOYW1lLCBSdW5TY2hlbWF0aWNUYXNrT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cblxuZXhwb3J0IGNsYXNzIFJ1blNjaGVtYXRpY1Rhc2s8VD4gaW1wbGVtZW50cyBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvcjxSdW5TY2hlbWF0aWNUYXNrT3B0aW9uczxUPj4ge1xuICBwcm90ZWN0ZWQgX2NvbGxlY3Rpb246IHN0cmluZyB8IG51bGw7XG4gIHByb3RlY3RlZCBfc2NoZW1hdGljOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBfb3B0aW9uczogVDtcblxuICBjb25zdHJ1Y3RvcihzOiBzdHJpbmcsIG86IFQpO1xuICBjb25zdHJ1Y3RvcihjOiBzdHJpbmcsIHM6IHN0cmluZywgbzogVCk7XG5cbiAgY29uc3RydWN0b3IoYzogc3RyaW5nIHwgbnVsbCwgczogc3RyaW5nIHwgVCwgbz86IFQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAyIHx8IHR5cGVvZiBzICE9PSAnc3RyaW5nJykge1xuICAgICAgbyA9IHMgYXMgVDtcbiAgICAgIHMgPSBjIGFzIHN0cmluZztcbiAgICAgIGMgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX2NvbGxlY3Rpb24gPSBjO1xuICAgIHRoaXMuX3NjaGVtYXRpYyA9IHMgYXMgc3RyaW5nO1xuICAgIHRoaXMuX29wdGlvbnMgPSBvIGFzIFQ7XG4gIH1cblxuICB0b0NvbmZpZ3VyYXRpb24oKTogVGFza0NvbmZpZ3VyYXRpb248UnVuU2NoZW1hdGljVGFza09wdGlvbnM8VD4+IHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogUnVuU2NoZW1hdGljTmFtZSxcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgY29sbGVjdGlvbjogdGhpcy5fY29sbGVjdGlvbixcbiAgICAgICAgbmFtZTogdGhpcy5fc2NoZW1hdGljLFxuICAgICAgICBvcHRpb25zOiB0aGlzLl9vcHRpb25zLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG59XG4iXX0=