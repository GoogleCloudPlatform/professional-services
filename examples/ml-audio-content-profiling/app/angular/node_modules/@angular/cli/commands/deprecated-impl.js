"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const command_1 = require("../models/command");
class DeprecatedCommand extends command_1.Command {
    async run() {
        let message = 'The "${this.description.name}" command has been deprecated.';
        if (this.description.name == 'get' || this.description.name == 'set') {
            message = 'get/set have been deprecated in favor of the config command.';
        }
        this.logger.error(message);
        return 0;
    }
}
exports.DeprecatedCommand = DeprecatedCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwcmVjYXRlZC1pbXBsLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyL2NsaS9jb21tYW5kcy9kZXByZWNhdGVkLWltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FBNEM7QUFHNUMsTUFBYSxpQkFBa0IsU0FBUSxpQkFBZ0M7SUFDOUQsS0FBSyxDQUFDLEdBQUc7UUFDZCxJQUFJLE9BQU8sR0FBRyw2REFBNkQsQ0FBQztRQUM1RSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksSUFBSSxLQUFLLEVBQUU7WUFDcEUsT0FBTyxHQUFHLDhEQUE4RCxDQUFDO1NBQzFFO1FBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFM0IsT0FBTyxDQUFDLENBQUM7SUFDWCxDQUFDO0NBQ0Y7QUFYRCw4Q0FXQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IENvbW1hbmQgfSBmcm9tICcuLi9tb2RlbHMvY29tbWFuZCc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgRGVwcmVjYXRlZENvbW1hbmRTY2hlbWEgfSBmcm9tICcuL2RlcHJlY2F0ZWQnO1xuXG5leHBvcnQgY2xhc3MgRGVwcmVjYXRlZENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kPERlcHJlY2F0ZWRDb21tYW5kU2NoZW1hPiB7XG4gIHB1YmxpYyBhc3luYyBydW4oKSB7XG4gICAgbGV0IG1lc3NhZ2UgPSAnVGhlIFwiJHt0aGlzLmRlc2NyaXB0aW9uLm5hbWV9XCIgY29tbWFuZCBoYXMgYmVlbiBkZXByZWNhdGVkLic7XG4gICAgaWYgKHRoaXMuZGVzY3JpcHRpb24ubmFtZSA9PSAnZ2V0JyB8fCB0aGlzLmRlc2NyaXB0aW9uLm5hbWUgPT0gJ3NldCcpIHtcbiAgICAgIG1lc3NhZ2UgPSAnZ2V0L3NldCBoYXZlIGJlZW4gZGVwcmVjYXRlZCBpbiBmYXZvciBvZiB0aGUgY29uZmlnIGNvbW1hbmQuJztcbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5lcnJvcihtZXNzYWdlKTtcblxuICAgIHJldHVybiAwO1xuICB9XG59XG4iXX0=