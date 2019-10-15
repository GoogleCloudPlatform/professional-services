/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { core } from '@angular/compiler';
export class MockSchemaRegistry {
    /**
     * @param {?} existingProperties
     * @param {?} attrPropMapping
     * @param {?} existingElements
     * @param {?} invalidProperties
     * @param {?} invalidAttributes
     */
    constructor(existingProperties, attrPropMapping, existingElements, invalidProperties, invalidAttributes) {
        this.existingProperties = existingProperties;
        this.attrPropMapping = attrPropMapping;
        this.existingElements = existingElements;
        this.invalidProperties = invalidProperties;
        this.invalidAttributes = invalidAttributes;
    }
    /**
     * @param {?} tagName
     * @param {?} property
     * @param {?} schemas
     * @return {?}
     */
    hasProperty(tagName, property, schemas) {
        /** @type {?} */
        const value = this.existingProperties[property];
        return value === void 0 ? true : value;
    }
    /**
     * @param {?} tagName
     * @param {?} schemaMetas
     * @return {?}
     */
    hasElement(tagName, schemaMetas) {
        /** @type {?} */
        const value = this.existingElements[tagName.toLowerCase()];
        return value === void 0 ? true : value;
    }
    /**
     * @return {?}
     */
    allKnownElementNames() { return Object.keys(this.existingElements); }
    /**
     * @param {?} selector
     * @param {?} property
     * @param {?} isAttribute
     * @return {?}
     */
    securityContext(selector, property, isAttribute) {
        return core.SecurityContext.NONE;
    }
    /**
     * @param {?} attrName
     * @return {?}
     */
    getMappedPropName(attrName) { return this.attrPropMapping[attrName] || attrName; }
    /**
     * @return {?}
     */
    getDefaultComponentElementName() { return 'ng-component'; }
    /**
     * @param {?} name
     * @return {?}
     */
    validateProperty(name) {
        if (this.invalidProperties.indexOf(name) > -1) {
            return { error: true, msg: `Binding to property '${name}' is disallowed for security reasons` };
        }
        else {
            return { error: false };
        }
    }
    /**
     * @param {?} name
     * @return {?}
     */
    validateAttribute(name) {
        if (this.invalidAttributes.indexOf(name) > -1) {
            return {
                error: true,
                msg: `Binding to attribute '${name}' is disallowed for security reasons`
            };
        }
        else {
            return { error: false };
        }
    }
    /**
     * @param {?} propName
     * @return {?}
     */
    normalizeAnimationStyleProperty(propName) { return propName; }
    /**
     * @param {?} camelCaseProp
     * @param {?} userProvidedProp
     * @param {?} val
     * @return {?}
     */
    normalizeAnimationStyleValue(camelCaseProp, userProvidedProp, val) {
        return { error: /** @type {?} */ ((null)), value: val.toString() };
    }
}
if (false) {
    /** @type {?} */
    MockSchemaRegistry.prototype.existingProperties;
    /** @type {?} */
    MockSchemaRegistry.prototype.attrPropMapping;
    /** @type {?} */
    MockSchemaRegistry.prototype.existingElements;
    /** @type {?} */
    MockSchemaRegistry.prototype.invalidProperties;
    /** @type {?} */
    MockSchemaRegistry.prototype.invalidAttributes;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hX3JlZ2lzdHJ5X21vY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci90ZXN0aW5nL3NyYy9zY2hlbWFfcmVnaXN0cnlfbW9jay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBd0IsSUFBSSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFOUQsTUFBTSxPQUFPLGtCQUFrQjs7Ozs7Ozs7SUFDN0IsWUFDVyxvQkFDQSxpQkFDQSxrQkFBbUQsaUJBQWdDLEVBQ25GO1FBSEEsdUJBQWtCLEdBQWxCLGtCQUFrQjtRQUNsQixvQkFBZSxHQUFmLGVBQWU7UUFDZixxQkFBZ0IsR0FBaEIsZ0JBQWdCO1FBQW1DLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBZTtRQUNuRixzQkFBaUIsR0FBakIsaUJBQWlCO0tBQW1COzs7Ozs7O0lBRS9DLFdBQVcsQ0FBQyxPQUFlLEVBQUUsUUFBZ0IsRUFBRSxPQUE4Qjs7UUFDM0UsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hELE9BQU8sS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztLQUN4Qzs7Ozs7O0lBRUQsVUFBVSxDQUFDLE9BQWUsRUFBRSxXQUFrQzs7UUFDNUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQzNELE9BQU8sS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztLQUN4Qzs7OztJQUVELG9CQUFvQixLQUFlLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFOzs7Ozs7O0lBRS9FLGVBQWUsQ0FBQyxRQUFnQixFQUFFLFFBQWdCLEVBQUUsV0FBb0I7UUFDdEUsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQztLQUNsQzs7Ozs7SUFFRCxpQkFBaUIsQ0FBQyxRQUFnQixJQUFZLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsRUFBRTs7OztJQUVsRyw4QkFBOEIsS0FBYSxPQUFPLGNBQWMsQ0FBQyxFQUFFOzs7OztJQUVuRSxnQkFBZ0IsQ0FBQyxJQUFZO1FBQzNCLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtZQUM3QyxPQUFPLEVBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsd0JBQXdCLElBQUksc0NBQXNDLEVBQUMsQ0FBQztTQUMvRjthQUFNO1lBQ0wsT0FBTyxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQztTQUN2QjtLQUNGOzs7OztJQUVELGlCQUFpQixDQUFDLElBQVk7UUFDNUIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO1lBQzdDLE9BQU87Z0JBQ0wsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsR0FBRyxFQUFFLHlCQUF5QixJQUFJLHNDQUFzQzthQUN6RSxDQUFDO1NBQ0g7YUFBTTtZQUNMLE9BQU8sRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUM7U0FDdkI7S0FDRjs7Ozs7SUFFRCwrQkFBK0IsQ0FBQyxRQUFnQixJQUFZLE9BQU8sUUFBUSxDQUFDLEVBQUU7Ozs7Ozs7SUFDOUUsNEJBQTRCLENBQUMsYUFBcUIsRUFBRSxnQkFBd0IsRUFBRSxHQUFrQjtRQUU5RixPQUFPLEVBQUMsS0FBSyxxQkFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFDLENBQUM7S0FDL0M7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbGVtZW50U2NoZW1hUmVnaXN0cnksIGNvcmV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuZXhwb3J0IGNsYXNzIE1vY2tTY2hlbWFSZWdpc3RyeSBpbXBsZW1lbnRzIEVsZW1lbnRTY2hlbWFSZWdpc3RyeSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGV4aXN0aW5nUHJvcGVydGllczoge1trZXk6IHN0cmluZ106IGJvb2xlYW59LFxuICAgICAgcHVibGljIGF0dHJQcm9wTWFwcGluZzoge1trZXk6IHN0cmluZ106IHN0cmluZ30sXG4gICAgICBwdWJsaWMgZXhpc3RpbmdFbGVtZW50czoge1trZXk6IHN0cmluZ106IGJvb2xlYW59LCBwdWJsaWMgaW52YWxpZFByb3BlcnRpZXM6IEFycmF5PHN0cmluZz4sXG4gICAgICBwdWJsaWMgaW52YWxpZEF0dHJpYnV0ZXM6IEFycmF5PHN0cmluZz4pIHt9XG5cbiAgaGFzUHJvcGVydHkodGFnTmFtZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCBzY2hlbWFzOiBjb3JlLlNjaGVtYU1ldGFkYXRhW10pOiBib29sZWFuIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZXhpc3RpbmdQcm9wZXJ0aWVzW3Byb3BlcnR5XTtcbiAgICByZXR1cm4gdmFsdWUgPT09IHZvaWQgMCA/IHRydWUgOiB2YWx1ZTtcbiAgfVxuXG4gIGhhc0VsZW1lbnQodGFnTmFtZTogc3RyaW5nLCBzY2hlbWFNZXRhczogY29yZS5TY2hlbWFNZXRhZGF0YVtdKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLmV4aXN0aW5nRWxlbWVudHNbdGFnTmFtZS50b0xvd2VyQ2FzZSgpXTtcbiAgICByZXR1cm4gdmFsdWUgPT09IHZvaWQgMCA/IHRydWUgOiB2YWx1ZTtcbiAgfVxuXG4gIGFsbEtub3duRWxlbWVudE5hbWVzKCk6IHN0cmluZ1tdIHsgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZXhpc3RpbmdFbGVtZW50cyk7IH1cblxuICBzZWN1cml0eUNvbnRleHQoc2VsZWN0b3I6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZywgaXNBdHRyaWJ1dGU6IGJvb2xlYW4pOiBjb3JlLlNlY3VyaXR5Q29udGV4dCB7XG4gICAgcmV0dXJuIGNvcmUuU2VjdXJpdHlDb250ZXh0Lk5PTkU7XG4gIH1cblxuICBnZXRNYXBwZWRQcm9wTmFtZShhdHRyTmFtZTogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuYXR0clByb3BNYXBwaW5nW2F0dHJOYW1lXSB8fCBhdHRyTmFtZTsgfVxuXG4gIGdldERlZmF1bHRDb21wb25lbnRFbGVtZW50TmFtZSgpOiBzdHJpbmcgeyByZXR1cm4gJ25nLWNvbXBvbmVudCc7IH1cblxuICB2YWxpZGF0ZVByb3BlcnR5KG5hbWU6IHN0cmluZyk6IHtlcnJvcjogYm9vbGVhbiwgbXNnPzogc3RyaW5nfSB7XG4gICAgaWYgKHRoaXMuaW52YWxpZFByb3BlcnRpZXMuaW5kZXhPZihuYW1lKSA+IC0xKSB7XG4gICAgICByZXR1cm4ge2Vycm9yOiB0cnVlLCBtc2c6IGBCaW5kaW5nIHRvIHByb3BlcnR5ICcke25hbWV9JyBpcyBkaXNhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zYH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7ZXJyb3I6IGZhbHNlfTtcbiAgICB9XG4gIH1cblxuICB2YWxpZGF0ZUF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiB7ZXJyb3I6IGJvb2xlYW4sIG1zZz86IHN0cmluZ30ge1xuICAgIGlmICh0aGlzLmludmFsaWRBdHRyaWJ1dGVzLmluZGV4T2YobmFtZSkgPiAtMSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZXJyb3I6IHRydWUsXG4gICAgICAgIG1zZzogYEJpbmRpbmcgdG8gYXR0cmlidXRlICcke25hbWV9JyBpcyBkaXNhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zYFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtlcnJvcjogZmFsc2V9O1xuICAgIH1cbiAgfVxuXG4gIG5vcm1hbGl6ZUFuaW1hdGlvblN0eWxlUHJvcGVydHkocHJvcE5hbWU6IHN0cmluZyk6IHN0cmluZyB7IHJldHVybiBwcm9wTmFtZTsgfVxuICBub3JtYWxpemVBbmltYXRpb25TdHlsZVZhbHVlKGNhbWVsQ2FzZVByb3A6IHN0cmluZywgdXNlclByb3ZpZGVkUHJvcDogc3RyaW5nLCB2YWw6IHN0cmluZ3xudW1iZXIpOlxuICAgICAge2Vycm9yOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd9IHtcbiAgICByZXR1cm4ge2Vycm9yOiBudWxsICEsIHZhbHVlOiB2YWwudG9TdHJpbmcoKX07XG4gIH1cbn1cbiJdfQ==