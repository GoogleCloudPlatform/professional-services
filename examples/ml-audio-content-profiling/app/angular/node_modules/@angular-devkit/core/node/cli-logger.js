"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const operators_1 = require("rxjs/operators");
const src_1 = require("../src");
/**
 * A Logger that sends information to STDOUT and STDERR.
 */
function createConsoleLogger(verbose = false, stdout = process.stdout, stderr = process.stderr) {
    const logger = new src_1.logging.IndentLogger('cling');
    logger
        .pipe(operators_1.filter(entry => (entry.level != 'debug' || verbose)))
        .subscribe(entry => {
        let color = x => src_1.terminal.dim(src_1.terminal.white(x));
        let output = stdout;
        switch (entry.level) {
            case 'info':
                color = src_1.terminal.white;
                break;
            case 'warn':
                color = (x) => src_1.terminal.bold(src_1.terminal.yellow(x));
                break;
            case 'fatal':
            case 'error':
                color = (x) => src_1.terminal.bold(src_1.terminal.red(x));
                output = stderr;
                break;
        }
        output.write(color(entry.message) + '\n');
    });
    return logger;
}
exports.createConsoleLogger = createConsoleLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLWxvZ2dlci5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9ub2RlL2NsaS1sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCw4Q0FBd0M7QUFDeEMsZ0NBQTJDO0FBTTNDOztHQUVHO0FBQ0gsU0FBZ0IsbUJBQW1CLENBQ2pDLE9BQU8sR0FBRyxLQUFLLEVBQ2YsU0FBd0IsT0FBTyxDQUFDLE1BQU0sRUFDdEMsU0FBd0IsT0FBTyxDQUFDLE1BQU07SUFFdEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxhQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWpELE1BQU07U0FDSCxJQUFJLENBQUMsa0JBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQztTQUMxRCxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDakIsSUFBSSxLQUFLLEdBQTBCLENBQUMsQ0FBQyxFQUFFLENBQUMsY0FBUSxDQUFDLEdBQUcsQ0FBQyxjQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEUsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3BCLFFBQVEsS0FBSyxDQUFDLEtBQUssRUFBRTtZQUNuQixLQUFLLE1BQU07Z0JBQ1QsS0FBSyxHQUFHLGNBQVEsQ0FBQyxLQUFLLENBQUM7Z0JBQ3ZCLE1BQU07WUFDUixLQUFLLE1BQU07Z0JBQ1QsS0FBSyxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxjQUFRLENBQUMsSUFBSSxDQUFDLGNBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekQsTUFBTTtZQUNSLEtBQUssT0FBTyxDQUFDO1lBQ2IsS0FBSyxPQUFPO2dCQUNWLEtBQUssR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsY0FBUSxDQUFDLElBQUksQ0FBQyxjQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RELE1BQU0sR0FBRyxNQUFNLENBQUM7Z0JBQ2hCLE1BQU07U0FDVDtRQUVELE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUMsQ0FBQztJQUVMLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUE5QkQsa0RBOEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgZmlsdGVyIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgbG9nZ2luZywgdGVybWluYWwgfSBmcm9tICcuLi9zcmMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb2Nlc3NPdXRwdXQge1xuICB3cml0ZShidWZmZXI6IHN0cmluZyB8IEJ1ZmZlcik6IGJvb2xlYW47XG59XG5cbi8qKlxuICogQSBMb2dnZXIgdGhhdCBzZW5kcyBpbmZvcm1hdGlvbiB0byBTVERPVVQgYW5kIFNUREVSUi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbnNvbGVMb2dnZXIoXG4gIHZlcmJvc2UgPSBmYWxzZSxcbiAgc3Rkb3V0OiBQcm9jZXNzT3V0cHV0ID0gcHJvY2Vzcy5zdGRvdXQsXG4gIHN0ZGVycjogUHJvY2Vzc091dHB1dCA9IHByb2Nlc3Muc3RkZXJyLFxuKTogbG9nZ2luZy5Mb2dnZXIge1xuICBjb25zdCBsb2dnZXIgPSBuZXcgbG9nZ2luZy5JbmRlbnRMb2dnZXIoJ2NsaW5nJyk7XG5cbiAgbG9nZ2VyXG4gICAgLnBpcGUoZmlsdGVyKGVudHJ5ID0+IChlbnRyeS5sZXZlbCAhPSAnZGVidWcnIHx8IHZlcmJvc2UpKSlcbiAgICAuc3Vic2NyaWJlKGVudHJ5ID0+IHtcbiAgICAgIGxldCBjb2xvcjogKHM6IHN0cmluZykgPT4gc3RyaW5nID0geCA9PiB0ZXJtaW5hbC5kaW0odGVybWluYWwud2hpdGUoeCkpO1xuICAgICAgbGV0IG91dHB1dCA9IHN0ZG91dDtcbiAgICAgIHN3aXRjaCAoZW50cnkubGV2ZWwpIHtcbiAgICAgICAgY2FzZSAnaW5mbyc6XG4gICAgICAgICAgY29sb3IgPSB0ZXJtaW5hbC53aGl0ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnd2Fybic6XG4gICAgICAgICAgY29sb3IgPSAoeDogc3RyaW5nKSA9PiB0ZXJtaW5hbC5ib2xkKHRlcm1pbmFsLnllbGxvdyh4KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2ZhdGFsJzpcbiAgICAgICAgY2FzZSAnZXJyb3InOlxuICAgICAgICAgIGNvbG9yID0gKHg6IHN0cmluZykgPT4gdGVybWluYWwuYm9sZCh0ZXJtaW5hbC5yZWQoeCkpO1xuICAgICAgICAgIG91dHB1dCA9IHN0ZGVycjtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgb3V0cHV0LndyaXRlKGNvbG9yKGVudHJ5Lm1lc3NhZ2UpICsgJ1xcbicpO1xuICAgIH0pO1xuXG4gIHJldHVybiBsb2dnZXI7XG59XG4iXX0=