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
class E2eCommand extends architect_command_1.ArchitectCommand {
    constructor() {
        super(...arguments);
        this.target = 'e2e';
        this.multiTarget = true;
    }
    async run(options) {
        return this.runArchitectTarget(options);
    }
}
exports.E2eCommand = E2eCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZTJlLWltcGwuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL2NvbW1hbmRzL2UyZS1pbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsbUVBQStEO0FBSy9ELE1BQWEsVUFBVyxTQUFRLG9DQUFrQztJQUFsRTs7UUFDa0IsV0FBTSxHQUFHLEtBQUssQ0FBQztRQUNmLGdCQUFXLEdBQUcsSUFBSSxDQUFDO0lBS3JDLENBQUM7SUFIUSxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQXFDO1FBQ3BELE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzFDLENBQUM7Q0FDRjtBQVBELGdDQU9DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBBcmNoaXRlY3RDb21tYW5kIH0gZnJvbSAnLi4vbW9kZWxzL2FyY2hpdGVjdC1jb21tYW5kJztcbmltcG9ydCB7IEFyZ3VtZW50cyB9IGZyb20gJy4uL21vZGVscy9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIEUyZUNvbW1hbmRTY2hlbWEgfSBmcm9tICcuL2UyZSc7XG5cblxuZXhwb3J0IGNsYXNzIEUyZUNvbW1hbmQgZXh0ZW5kcyBBcmNoaXRlY3RDb21tYW5kPEUyZUNvbW1hbmRTY2hlbWE+IHtcbiAgcHVibGljIHJlYWRvbmx5IHRhcmdldCA9ICdlMmUnO1xuICBwdWJsaWMgcmVhZG9ubHkgbXVsdGlUYXJnZXQgPSB0cnVlO1xuXG4gIHB1YmxpYyBhc3luYyBydW4ob3B0aW9uczogRTJlQ29tbWFuZFNjaGVtYSAmIEFyZ3VtZW50cykge1xuICAgIHJldHVybiB0aGlzLnJ1bkFyY2hpdGVjdFRhcmdldChvcHRpb25zKTtcbiAgfVxufVxuIl19