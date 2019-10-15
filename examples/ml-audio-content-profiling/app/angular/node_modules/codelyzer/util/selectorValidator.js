"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectorValidator = {
    attribute: function (selector) {
        return selector.length !== 0;
    },
    element: function (selector) {
        return selector !== null;
    },
    kebabCase: function (selector) {
        return /^[a-z0-9\-]+\-[a-z0-9\-]+$/.test(selector);
    },
    camelCase: function (selector) {
        return /^[a-zA-Z0-9\[\]]+$/.test(selector);
    },
    prefix: function (prefix, selectorType) {
        var regex = new RegExp("^\\[?(" + prefix + ")");
        return function (selector) {
            if (!prefix) {
                return true;
            }
            if (!regex.test(selector)) {
                return false;
            }
            var suffix = selector.replace(regex, '');
            if (selectorType === 'camelCase') {
                return !suffix || suffix[0] === suffix[0].toUpperCase();
            }
            else if (selectorType === 'kebab-case') {
                return !suffix || suffix[0] === '-';
            }
            throw Error('Invalid selector type');
        };
    }
};
