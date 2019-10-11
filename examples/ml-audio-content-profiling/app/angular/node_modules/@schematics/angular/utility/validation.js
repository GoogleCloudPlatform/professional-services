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
const schematics_1 = require("@angular-devkit/schematics");
function validateName(name) {
    if (name && /^\d/.test(name)) {
        throw new schematics_1.SchematicsException(core_1.tags.oneLine `name (${name})
        can not start with a digit.`);
    }
}
exports.validateName = validateName;
// Must start with a letter, and must contain only alphanumeric characters or dashes.
// When adding a dash the segment after the dash must also start with a letter.
exports.htmlSelectorRe = /^[a-zA-Z][.0-9a-zA-Z]*(:?-[a-zA-Z][.0-9a-zA-Z]*)*$/;
function validateHtmlSelector(selector) {
    if (selector && !exports.htmlSelectorRe.test(selector)) {
        throw new schematics_1.SchematicsException(core_1.tags.oneLine `Selector (${selector})
        is invalid.`);
    }
}
exports.validateHtmlSelector = validateHtmlSelector;
function validateProjectName(projectName) {
    const errorIndex = getRegExpFailPosition(projectName);
    const unsupportedProjectNames = ['test', 'ember', 'ember-cli', 'vendor', 'app'];
    const packageNameRegex = /^(?:@[a-zA-Z0-9_-]+\/)?[a-zA-Z0-9_-]+$/;
    if (errorIndex !== null) {
        const firstMessage = core_1.tags.oneLine `
    Project name "${projectName}" is not valid. New project names must
    start with a letter, and must contain only alphanumeric characters or dashes.
    When adding a dash the segment after the dash must also start with a letter.
    `;
        const msg = core_1.tags.stripIndent `
    ${firstMessage}
    ${projectName}
    ${Array(errorIndex + 1).join(' ') + '^'}
    `;
        throw new schematics_1.SchematicsException(msg);
    }
    else if (unsupportedProjectNames.indexOf(projectName) !== -1) {
        throw new schematics_1.SchematicsException(`Project name ${JSON.stringify(projectName)} is not a supported name.`);
    }
    else if (!packageNameRegex.test(projectName)) {
        throw new schematics_1.SchematicsException(`Project name ${JSON.stringify(projectName)} is invalid.`);
    }
}
exports.validateProjectName = validateProjectName;
function getRegExpFailPosition(str) {
    const isScope = /^@.*\/.*/.test(str);
    if (isScope) {
        // Remove starting @
        str = str.replace(/^@/, '');
        // Change / to - for validation
        str = str.replace(/\//g, '-');
    }
    const parts = str.indexOf('-') >= 0 ? str.split('-') : [str];
    const matched = [];
    const projectNameRegexp = /^[a-zA-Z][.0-9a-zA-Z]*(-[.0-9a-zA-Z]*)*$/;
    parts.forEach(part => {
        if (part.match(projectNameRegexp)) {
            matched.push(part);
        }
    });
    const compare = matched.join('-');
    return (str !== compare) ? compare.length : null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvdmFsaWRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUE0QztBQUM1QywyREFBaUU7QUFFakUsU0FBZ0IsWUFBWSxDQUFDLElBQVk7SUFDdkMsSUFBSSxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUM1QixNQUFNLElBQUksZ0NBQW1CLENBQUMsV0FBSSxDQUFDLE9BQU8sQ0FBQSxTQUFTLElBQUk7b0NBQ3ZCLENBQUMsQ0FBQztLQUNuQztBQUNILENBQUM7QUFMRCxvQ0FLQztBQUVELHFGQUFxRjtBQUNyRiwrRUFBK0U7QUFDbEUsUUFBQSxjQUFjLEdBQUcsb0RBQW9ELENBQUM7QUFFbkYsU0FBZ0Isb0JBQW9CLENBQUMsUUFBZ0I7SUFDbkQsSUFBSSxRQUFRLElBQUksQ0FBQyxzQkFBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUM5QyxNQUFNLElBQUksZ0NBQW1CLENBQUMsV0FBSSxDQUFDLE9BQU8sQ0FBQSxhQUFhLFFBQVE7b0JBQy9DLENBQUMsQ0FBQztLQUNuQjtBQUNILENBQUM7QUFMRCxvREFLQztBQUdELFNBQWdCLG1CQUFtQixDQUFDLFdBQW1CO0lBQ3JELE1BQU0sVUFBVSxHQUFHLHFCQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3RELE1BQU0sdUJBQXVCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEYsTUFBTSxnQkFBZ0IsR0FBRyx3Q0FBd0MsQ0FBQztJQUNsRSxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUU7UUFDdkIsTUFBTSxZQUFZLEdBQUcsV0FBSSxDQUFDLE9BQU8sQ0FBQTtvQkFDakIsV0FBVzs7O0tBRzFCLENBQUM7UUFDRixNQUFNLEdBQUcsR0FBRyxXQUFJLENBQUMsV0FBVyxDQUFBO01BQzFCLFlBQVk7TUFDWixXQUFXO01BQ1gsS0FBSyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRztLQUN0QyxDQUFDO1FBQ0YsTUFBTSxJQUFJLGdDQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3BDO1NBQU0sSUFBSSx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDOUQsTUFBTSxJQUFJLGdDQUFtQixDQUMzQixnQkFBZ0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsMkJBQTJCLENBQUMsQ0FBQztLQUMzRTtTQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7UUFDOUMsTUFBTSxJQUFJLGdDQUFtQixDQUFDLGdCQUFnQixJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztLQUMxRjtBQUNILENBQUM7QUF0QkQsa0RBc0JDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxHQUFXO0lBQ3hDLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckMsSUFBSSxPQUFPLEVBQUU7UUFDWCxvQkFBb0I7UUFDcEIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLCtCQUErQjtRQUMvQixHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDL0I7SUFFRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3RCxNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUM7SUFFN0IsTUFBTSxpQkFBaUIsR0FBRywwQ0FBMEMsQ0FBQztJQUVyRSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ25CLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO1lBQ2pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDcEI7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFbEMsT0FBTyxDQUFDLEdBQUcsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ25ELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgU2NoZW1hdGljc0V4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlTmFtZShuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKG5hbWUgJiYgL15cXGQvLnRlc3QobmFtZSkpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbih0YWdzLm9uZUxpbmVgbmFtZSAoJHtuYW1lfSlcbiAgICAgICAgY2FuIG5vdCBzdGFydCB3aXRoIGEgZGlnaXQuYCk7XG4gIH1cbn1cblxuLy8gTXVzdCBzdGFydCB3aXRoIGEgbGV0dGVyLCBhbmQgbXVzdCBjb250YWluIG9ubHkgYWxwaGFudW1lcmljIGNoYXJhY3RlcnMgb3IgZGFzaGVzLlxuLy8gV2hlbiBhZGRpbmcgYSBkYXNoIHRoZSBzZWdtZW50IGFmdGVyIHRoZSBkYXNoIG11c3QgYWxzbyBzdGFydCB3aXRoIGEgbGV0dGVyLlxuZXhwb3J0IGNvbnN0IGh0bWxTZWxlY3RvclJlID0gL15bYS16QS1aXVsuMC05YS16QS1aXSooOj8tW2EtekEtWl1bLjAtOWEtekEtWl0qKSokLztcblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSHRtbFNlbGVjdG9yKHNlbGVjdG9yOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHNlbGVjdG9yICYmICFodG1sU2VsZWN0b3JSZS50ZXN0KHNlbGVjdG9yKSkge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKHRhZ3Mub25lTGluZWBTZWxlY3RvciAoJHtzZWxlY3Rvcn0pXG4gICAgICAgIGlzIGludmFsaWQuYCk7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVQcm9qZWN0TmFtZShwcm9qZWN0TmFtZTogc3RyaW5nKSB7XG4gIGNvbnN0IGVycm9ySW5kZXggPSBnZXRSZWdFeHBGYWlsUG9zaXRpb24ocHJvamVjdE5hbWUpO1xuICBjb25zdCB1bnN1cHBvcnRlZFByb2plY3ROYW1lcyA9IFsndGVzdCcsICdlbWJlcicsICdlbWJlci1jbGknLCAndmVuZG9yJywgJ2FwcCddO1xuICBjb25zdCBwYWNrYWdlTmFtZVJlZ2V4ID0gL14oPzpAW2EtekEtWjAtOV8tXStcXC8pP1thLXpBLVowLTlfLV0rJC87XG4gIGlmIChlcnJvckluZGV4ICE9PSBudWxsKSB7XG4gICAgY29uc3QgZmlyc3RNZXNzYWdlID0gdGFncy5vbmVMaW5lYFxuICAgIFByb2plY3QgbmFtZSBcIiR7cHJvamVjdE5hbWV9XCIgaXMgbm90IHZhbGlkLiBOZXcgcHJvamVjdCBuYW1lcyBtdXN0XG4gICAgc3RhcnQgd2l0aCBhIGxldHRlciwgYW5kIG11c3QgY29udGFpbiBvbmx5IGFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzIG9yIGRhc2hlcy5cbiAgICBXaGVuIGFkZGluZyBhIGRhc2ggdGhlIHNlZ21lbnQgYWZ0ZXIgdGhlIGRhc2ggbXVzdCBhbHNvIHN0YXJ0IHdpdGggYSBsZXR0ZXIuXG4gICAgYDtcbiAgICBjb25zdCBtc2cgPSB0YWdzLnN0cmlwSW5kZW50YFxuICAgICR7Zmlyc3RNZXNzYWdlfVxuICAgICR7cHJvamVjdE5hbWV9XG4gICAgJHtBcnJheShlcnJvckluZGV4ICsgMSkuam9pbignICcpICsgJ14nfVxuICAgIGA7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24obXNnKTtcbiAgfSBlbHNlIGlmICh1bnN1cHBvcnRlZFByb2plY3ROYW1lcy5pbmRleE9mKHByb2plY3ROYW1lKSAhPT0gLTEpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgIGBQcm9qZWN0IG5hbWUgJHtKU09OLnN0cmluZ2lmeShwcm9qZWN0TmFtZSl9IGlzIG5vdCBhIHN1cHBvcnRlZCBuYW1lLmApO1xuICB9IGVsc2UgaWYgKCFwYWNrYWdlTmFtZVJlZ2V4LnRlc3QocHJvamVjdE5hbWUpKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFByb2plY3QgbmFtZSAke0pTT04uc3RyaW5naWZ5KHByb2plY3ROYW1lKX0gaXMgaW52YWxpZC5gKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZWdFeHBGYWlsUG9zaXRpb24oc3RyOiBzdHJpbmcpOiBudW1iZXIgfCBudWxsIHtcbiAgY29uc3QgaXNTY29wZSA9IC9eQC4qXFwvLiovLnRlc3Qoc3RyKTtcbiAgaWYgKGlzU2NvcGUpIHtcbiAgICAvLyBSZW1vdmUgc3RhcnRpbmcgQFxuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9eQC8sICcnKTtcbiAgICAvLyBDaGFuZ2UgLyB0byAtIGZvciB2YWxpZGF0aW9uXG4gICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcLy9nLCAnLScpO1xuICB9XG5cbiAgY29uc3QgcGFydHMgPSBzdHIuaW5kZXhPZignLScpID49IDAgPyBzdHIuc3BsaXQoJy0nKSA6IFtzdHJdO1xuICBjb25zdCBtYXRjaGVkOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGNvbnN0IHByb2plY3ROYW1lUmVnZXhwID0gL15bYS16QS1aXVsuMC05YS16QS1aXSooLVsuMC05YS16QS1aXSopKiQvO1xuXG4gIHBhcnRzLmZvckVhY2gocGFydCA9PiB7XG4gICAgaWYgKHBhcnQubWF0Y2gocHJvamVjdE5hbWVSZWdleHApKSB7XG4gICAgICBtYXRjaGVkLnB1c2gocGFydCk7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBjb21wYXJlID0gbWF0Y2hlZC5qb2luKCctJyk7XG5cbiAgcmV0dXJuIChzdHIgIT09IGNvbXBhcmUpID8gY29tcGFyZS5sZW5ndGggOiBudWxsO1xufVxuIl19