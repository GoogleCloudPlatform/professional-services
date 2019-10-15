"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const architect_command_1 = require("../models/architect-command");
class TestCommand extends architect_command_1.ArchitectCommand {
    constructor() {
        super(...arguments);
        this.target = 'test';
        this.multiTarget = true;
    }
    async run(options) {
        return this.runArchitectTarget(options);
    }
}
exports.TestCommand = TestCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1pbXBsLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyL2NsaS9jb21tYW5kcy90ZXN0LWltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCxtRUFBd0Y7QUFJeEYsTUFBYSxXQUFZLFNBQVEsb0NBQW1DO0lBQXBFOztRQUNrQixXQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ2hCLGdCQUFXLEdBQUcsSUFBSSxDQUFDO0lBS3JDLENBQUM7SUFIUSxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQTRDO1FBQzNELE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzFDLENBQUM7Q0FDRjtBQVBELGtDQU9DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBBcmNoaXRlY3RDb21tYW5kLCBBcmNoaXRlY3RDb21tYW5kT3B0aW9ucyB9IGZyb20gJy4uL21vZGVscy9hcmNoaXRlY3QtY29tbWFuZCc7XG5pbXBvcnQgeyBBcmd1bWVudHMgfSBmcm9tICcuLi9tb2RlbHMvaW50ZXJmYWNlJztcbmltcG9ydCB7IFNjaGVtYSBhcyBUZXN0Q29tbWFuZFNjaGVtYSB9IGZyb20gJy4vdGVzdCc7XG5cbmV4cG9ydCBjbGFzcyBUZXN0Q29tbWFuZCBleHRlbmRzIEFyY2hpdGVjdENvbW1hbmQ8VGVzdENvbW1hbmRTY2hlbWE+IHtcbiAgcHVibGljIHJlYWRvbmx5IHRhcmdldCA9ICd0ZXN0JztcbiAgcHVibGljIHJlYWRvbmx5IG11bHRpVGFyZ2V0ID0gdHJ1ZTtcblxuICBwdWJsaWMgYXN5bmMgcnVuKG9wdGlvbnM6IEFyY2hpdGVjdENvbW1hbmRPcHRpb25zICYgQXJndW1lbnRzKSB7XG4gICAgcmV0dXJuIHRoaXMucnVuQXJjaGl0ZWN0VGFyZ2V0KG9wdGlvbnMpO1xuICB9XG59XG4iXX0=