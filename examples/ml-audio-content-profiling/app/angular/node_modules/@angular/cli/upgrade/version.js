"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const path = require("path");
const semver_1 = require("semver");
const config_1 = require("../utilities/config");
class Version {
    constructor(_version = null) {
        this._version = _version;
        this._semver = null;
        this._semver = _version ? new semver_1.SemVer(_version) : null;
    }
    isAlpha() { return this.qualifier == 'alpha'; }
    isBeta() { return this.qualifier == 'beta'; }
    isReleaseCandidate() { return this.qualifier == 'rc'; }
    isKnown() { return this._version !== null; }
    isLocal() { return this.isKnown() && this._version && path.isAbsolute(this._version); }
    isGreaterThanOrEqualTo(other) {
        return this._semver !== null && this._semver.compare(other) >= 0;
    }
    get major() { return this._semver ? this._semver.major : 0; }
    get minor() { return this._semver ? this._semver.minor : 0; }
    get patch() { return this._semver ? this._semver.patch : 0; }
    get qualifier() { return this._semver ? this._semver.prerelease[0] : ''; }
    get extra() { return this._semver ? this._semver.prerelease[1] : ''; }
    toString() { return this._version; }
    static assertCompatibleAngularVersion(projectRoot) {
        let angularPkgJson;
        let rxjsPkgJson;
        try {
            const resolveOptions = {
                basedir: projectRoot,
                checkGlobal: false,
                checkLocal: true,
            };
            const angularPackagePath = node_1.resolve('@angular/core/package.json', resolveOptions);
            const rxjsPackagePath = node_1.resolve('rxjs/package.json', resolveOptions);
            angularPkgJson = require(angularPackagePath);
            rxjsPkgJson = require(rxjsPackagePath);
        }
        catch (_a) {
            console.error(core_1.terminal.bold(core_1.terminal.red(core_1.tags.stripIndents `
        You seem to not be depending on "@angular/core" and/or "rxjs". This is an error.
      `)));
            process.exit(2);
        }
        if (!(angularPkgJson && angularPkgJson['version'] && rxjsPkgJson && rxjsPkgJson['version'])) {
            console.error(core_1.terminal.bold(core_1.terminal.red(core_1.tags.stripIndents `
        Cannot determine versions of "@angular/core" and/or "rxjs".
        This likely means your local installation is broken. Please reinstall your packages.
      `)));
            process.exit(2);
        }
        const angularVersion = new Version(angularPkgJson['version']);
        const rxjsVersion = new Version(rxjsPkgJson['version']);
        if (angularVersion.isLocal()) {
            console.error(core_1.terminal.yellow('Using a local version of angular. Proceeding with care...'));
            return;
        }
        if (!angularVersion.isGreaterThanOrEqualTo(new semver_1.SemVer('5.0.0'))) {
            console.error(core_1.terminal.bold(core_1.terminal.red(core_1.tags.stripIndents `
          This version of CLI is only compatible with Angular version 5.0.0 or higher.

          Please visit the link below to find instructions on how to update Angular.
          https://angular-update-guide.firebaseapp.com/
        ` + '\n')));
            process.exit(3);
        }
        else if (angularVersion.isGreaterThanOrEqualTo(new semver_1.SemVer('6.0.0-rc.0'))
            && !rxjsVersion.isGreaterThanOrEqualTo(new semver_1.SemVer('5.6.0-forward-compat.0'))
            && !rxjsVersion.isGreaterThanOrEqualTo(new semver_1.SemVer('6.0.0-beta.0'))) {
            console.error(core_1.terminal.bold(core_1.terminal.red(core_1.tags.stripIndents `
          This project uses version ${rxjsVersion} of RxJs, which is not supported by Angular v6.
          The official RxJs version that is supported is 5.6.0-forward-compat.0 and greater.

          Please visit the link below to find instructions on how to update RxJs.
          https://docs.google.com/document/d/12nlLt71VLKb-z3YaSGzUfx6mJbc34nsMXtByPUN35cg/edit#
        ` + '\n')));
            process.exit(3);
        }
        else if (angularVersion.isGreaterThanOrEqualTo(new semver_1.SemVer('6.0.0-rc.0'))
            && !rxjsVersion.isGreaterThanOrEqualTo(new semver_1.SemVer('6.0.0-beta.0'))) {
            console.warn(core_1.terminal.bold(core_1.terminal.red(core_1.tags.stripIndents `
          This project uses a temporary compatibility version of RxJs (${rxjsVersion}).

          Please visit the link below to find instructions on how to update RxJs.
          https://docs.google.com/document/d/12nlLt71VLKb-z3YaSGzUfx6mJbc34nsMXtByPUN35cg/edit#
        ` + '\n')));
        }
    }
    static assertTypescriptVersion(projectRoot) {
        if (!config_1.isWarningEnabled('typescriptMismatch')) {
            return;
        }
        let compilerVersion;
        let tsVersion;
        let compilerTypeScriptPeerVersion;
        try {
            const resolveOptions = {
                basedir: projectRoot,
                checkGlobal: false,
                checkLocal: true,
            };
            const compilerPackagePath = node_1.resolve('@angular/compiler-cli/package.json', resolveOptions);
            const typescriptProjectPath = node_1.resolve('typescript', resolveOptions);
            const compilerPackageInfo = require(compilerPackagePath);
            compilerVersion = compilerPackageInfo['version'];
            compilerTypeScriptPeerVersion = compilerPackageInfo['peerDependencies']['typescript'];
            tsVersion = require(typescriptProjectPath).version;
        }
        catch (_a) {
            console.error(core_1.terminal.bold(core_1.terminal.red(core_1.tags.stripIndents `
        Versions of @angular/compiler-cli and typescript could not be determined.
        The most common reason for this is a broken npm install.

        Please make sure your package.json contains both @angular/compiler-cli and typescript in
        devDependencies, then delete node_modules and package-lock.json (if you have one) and
        run npm install again.
      `)));
            process.exit(2);
            return;
        }
        // These versions do not have accurate typescript peer dependencies
        const versionCombos = [
            { compiler: '>=2.3.1 <3.0.0', typescript: '>=2.0.2 <2.3.0' },
            { compiler: '>=4.0.0-beta.0 <5.0.0', typescript: '>=2.1.0 <2.4.0' },
            { compiler: '5.0.0-beta.0 - 5.0.0-rc.2', typescript: '>=2.4.2 <2.5.0' },
        ];
        let currentCombo = versionCombos.find((combo) => semver_1.satisfies(compilerVersion, combo.compiler));
        if (!currentCombo && compilerTypeScriptPeerVersion) {
            currentCombo = { compiler: compilerVersion, typescript: compilerTypeScriptPeerVersion };
        }
        if (currentCombo && !semver_1.satisfies(tsVersion, currentCombo.typescript)) {
            // First line of warning looks weird being split in two, disable tslint for it.
            console.error((core_1.terminal.yellow('\n' + core_1.tags.stripIndent `
        @angular/compiler-cli@${compilerVersion} requires typescript@'${currentCombo.typescript}' but ${tsVersion} was found instead.
        Using this version can result in undefined behaviour and difficult to debug problems.

        Please run the following command to install a compatible version of TypeScript.

            npm install typescript@"${currentCombo.typescript}"

        To disable this warning run "ng config cli.warnings.typescriptMismatch false".
      ` + '\n')));
        }
    }
}
exports.Version = Version;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhci9jbGkvdXBncmFkZS92ZXJzaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0NBQXNEO0FBQ3RELG9EQUFvRDtBQUNwRCw2QkFBNkI7QUFDN0IsbUNBQTJDO0FBQzNDLGdEQUF1RDtBQUd2RCxNQUFhLE9BQU87SUFFbEIsWUFBb0IsV0FBMEIsSUFBSTtRQUE5QixhQUFRLEdBQVIsUUFBUSxDQUFzQjtRQUQxQyxZQUFPLEdBQWtCLElBQUksQ0FBQztRQUVwQyxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxlQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN4RCxDQUFDO0lBRUQsT0FBTyxLQUFLLE9BQU8sSUFBSSxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQy9DLE1BQU0sS0FBSyxPQUFPLElBQUksQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM3QyxrQkFBa0IsS0FBSyxPQUFPLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN2RCxPQUFPLEtBQUssT0FBTyxJQUFJLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7SUFFNUMsT0FBTyxLQUFLLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLHNCQUFzQixDQUFDLEtBQWE7UUFDbEMsT0FBTyxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkUs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RSxnQkFBZ0IsRUFBRTtTQUN4RSxDQUFDO1FBRUYsSUFBSSxZQUFZLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsa0JBQVMsQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDN0YsSUFBSSxDQUFDLFlBQVksSUFBSSw2QkFBNkIsRUFBRTtZQUNsRCxZQUFZLEdBQUcsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSw2QkFBNkIsRUFBRSxDQUFDO1NBQ3pGO1FBRUQsSUFBSSxZQUFZLElBQUksQ0FBQyxrQkFBUyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDbEUsK0VBQStFO1lBQy9FLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxlQUFRLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxXQUFJLENBQUMsV0FBVyxDQUFBO2dDQUM1QixlQUFlLHlCQUN2QyxZQUFZLENBQUMsVUFBVSxTQUFTLFNBQVM7Ozs7O3NDQUtYLFlBQVksQ0FBQyxVQUFVOzs7T0FHdEQsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDYjtJQUNILENBQUM7Q0FFRjtBQWhLRCwwQkFnS0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IHRhZ3MsIHRlcm1pbmFsIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL25vZGUnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IFNlbVZlciwgc2F0aXNmaWVzIH0gZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IGlzV2FybmluZ0VuYWJsZWQgfSBmcm9tICcuLi91dGlsaXRpZXMvY29uZmlnJztcblxuXG5leHBvcnQgY2xhc3MgVmVyc2lvbiB7XG4gIHByaXZhdGUgX3NlbXZlcjogU2VtVmVyIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3ZlcnNpb246IHN0cmluZyB8IG51bGwgPSBudWxsKSB7XG4gICAgdGhpcy5fc2VtdmVyID0gX3ZlcnNpb24gPyBuZXcgU2VtVmVyKF92ZXJzaW9uKSA6IG51bGw7XG4gIH1cblxuICBpc0FscGhhKCkgeyByZXR1cm4gdGhpcy5xdWFsaWZpZXIgPT0gJ2FscGhhJzsgfVxuICBpc0JldGEoKSB7IHJldHVybiB0aGlzLnF1YWxpZmllciA9PSAnYmV0YSc7IH1cbiAgaXNSZWxlYXNlQ2FuZGlkYXRlKCkgeyByZXR1cm4gdGhpcy5xdWFsaWZpZXIgPT0gJ3JjJzsgfVxuICBpc0tub3duKCkgeyByZXR1cm4gdGhpcy5fdmVyc2lvbiAhPT0gbnVsbDsgfVxuXG4gIGlzTG9jYWwoKSB7IHJldHVybiB0aGlzLmlzS25vd24oKSAmJiB0aGlzLl92ZXJzaW9uICYmIHBhdGguaXNBYnNvbHV0ZSh0aGlzLl92ZXJzaW9uKTsgfVxuICBpc0dyZWF0ZXJUaGFuT3JFcXVhbFRvKG90aGVyOiBTZW1WZXIpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VtdmVyICE9PSBudWxsICYmIHRoaXMuX3NlbXZlci5jb21wYXJlKG90aGVyKSA+PSAwO1xuICB9XG5cbiAgZ2V0IG1ham9yKCkgeyByZXR1cm4gdGhpcy5fc2VtdmVyID8gdGhpcy5fc2VtdmVyLm1ham9yIDogMDsgfVxuICBnZXQgbWlub3IoKSB7IHJldHVybiB0aGlzLl9zZW12ZXIgPyB0aGlzLl9zZW12ZXIubWlub3IgOiAwOyB9XG4gIGdldCBwYXRjaCgpIHsgcmV0dXJuIHRoaXMuX3NlbXZlciA/IHRoaXMuX3NlbXZlci5wYXRjaCA6IDA7IH1cbiAgZ2V0IHF1YWxpZmllcigpIHsgcmV0dXJuIHRoaXMuX3NlbXZlciA/IHRoaXMuX3NlbXZlci5wcmVyZWxlYXNlWzBdIDogJyc7IH1cbiAgZ2V0IGV4dHJhKCkgeyByZXR1cm4gdGhpcy5fc2VtdmVyID8gdGhpcy5fc2VtdmVyLnByZXJlbGVhc2VbMV0gOiAnJzsgfVxuXG4gIHRvU3RyaW5nKCkgeyByZXR1cm4gdGhpcy5fdmVyc2lvbjsgfVxuXG4gIHN0YXRpYyBhc3NlcnRDb21wYXRpYmxlQW5ndWxhclZlcnNpb24ocHJvamVjdFJvb3Q6IHN0cmluZykge1xuICAgIGxldCBhbmd1bGFyUGtnSnNvbjtcbiAgICBsZXQgcnhqc1BrZ0pzb247XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzb2x2ZU9wdGlvbnMgPSB7XG4gICAgICAgIGJhc2VkaXI6IHByb2plY3RSb290LFxuICAgICAgICBjaGVja0dsb2JhbDogZmFsc2UsXG4gICAgICAgIGNoZWNrTG9jYWw6IHRydWUsXG4gICAgICB9O1xuICAgICAgY29uc3QgYW5ndWxhclBhY2thZ2VQYXRoID0gcmVzb2x2ZSgnQGFuZ3VsYXIvY29yZS9wYWNrYWdlLmpzb24nLCByZXNvbHZlT3B0aW9ucyk7XG4gICAgICBjb25zdCByeGpzUGFja2FnZVBhdGggPSByZXNvbHZlKCdyeGpzL3BhY2thZ2UuanNvbicsIHJlc29sdmVPcHRpb25zKTtcblxuICAgICAgYW5ndWxhclBrZ0pzb24gPSByZXF1aXJlKGFuZ3VsYXJQYWNrYWdlUGF0aCk7XG4gICAgICByeGpzUGtnSnNvbiA9IHJlcXVpcmUocnhqc1BhY2thZ2VQYXRoKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IodGVybWluYWwuYm9sZCh0ZXJtaW5hbC5yZWQodGFncy5zdHJpcEluZGVudHNgXG4gICAgICAgIFlvdSBzZWVtIHRvIG5vdCBiZSBkZXBlbmRpbmcgb24gXCJAYW5ndWxhci9jb3JlXCIgYW5kL29yIFwicnhqc1wiLiBUaGlzIGlzIGFuIGVycm9yLlxuICAgICAgYCkpKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgyKTtcbiAgICB9XG5cbiAgICBpZiAoIShhbmd1bGFyUGtnSnNvbiAmJiBhbmd1bGFyUGtnSnNvblsndmVyc2lvbiddICYmIHJ4anNQa2dKc29uICYmIHJ4anNQa2dKc29uWyd2ZXJzaW9uJ10pKSB7XG4gICAgICBjb25zb2xlLmVycm9yKHRlcm1pbmFsLmJvbGQodGVybWluYWwucmVkKHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgICAgICBDYW5ub3QgZGV0ZXJtaW5lIHZlcnNpb25zIG9mIFwiQGFuZ3VsYXIvY29yZVwiIGFuZC9vciBcInJ4anNcIi5cbiAgICAgICAgVGhpcyBsaWtlbHkgbWVhbnMgeW91ciBsb2NhbCBpbnN0YWxsYXRpb24gaXMgYnJva2VuLiBQbGVhc2UgcmVpbnN0YWxsIHlvdXIgcGFja2FnZXMuXG4gICAgICBgKSkpO1xuICAgICAgcHJvY2Vzcy5leGl0KDIpO1xuICAgIH1cblxuICAgIGNvbnN0IGFuZ3VsYXJWZXJzaW9uID0gbmV3IFZlcnNpb24oYW5ndWxhclBrZ0pzb25bJ3ZlcnNpb24nXSk7XG4gICAgY29uc3Qgcnhqc1ZlcnNpb24gPSBuZXcgVmVyc2lvbihyeGpzUGtnSnNvblsndmVyc2lvbiddKTtcblxuICAgIGlmIChhbmd1bGFyVmVyc2lvbi5pc0xvY2FsKCkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IodGVybWluYWwueWVsbG93KCdVc2luZyBhIGxvY2FsIHZlcnNpb24gb2YgYW5ndWxhci4gUHJvY2VlZGluZyB3aXRoIGNhcmUuLi4nKSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIWFuZ3VsYXJWZXJzaW9uLmlzR3JlYXRlclRoYW5PckVxdWFsVG8obmV3IFNlbVZlcignNS4wLjAnKSkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IodGVybWluYWwuYm9sZCh0ZXJtaW5hbC5yZWQodGFncy5zdHJpcEluZGVudHNgXG4gICAgICAgICAgVGhpcyB2ZXJzaW9uIG9mIENMSSBpcyBvbmx5IGNvbXBhdGlibGUgd2l0aCBBbmd1bGFyIHZlcnNpb24gNS4wLjAgb3IgaGlnaGVyLlxuXG4gICAgICAgICAgUGxlYXNlIHZpc2l0IHRoZSBsaW5rIGJlbG93IHRvIGZpbmQgaW5zdHJ1Y3Rpb25zIG9uIGhvdyB0byB1cGRhdGUgQW5ndWxhci5cbiAgICAgICAgICBodHRwczovL2FuZ3VsYXItdXBkYXRlLWd1aWRlLmZpcmViYXNlYXBwLmNvbS9cbiAgICAgICAgYCArICdcXG4nKSkpO1xuICAgICAgcHJvY2Vzcy5leGl0KDMpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBhbmd1bGFyVmVyc2lvbi5pc0dyZWF0ZXJUaGFuT3JFcXVhbFRvKG5ldyBTZW1WZXIoJzYuMC4wLXJjLjAnKSlcbiAgICAgICYmICFyeGpzVmVyc2lvbi5pc0dyZWF0ZXJUaGFuT3JFcXVhbFRvKG5ldyBTZW1WZXIoJzUuNi4wLWZvcndhcmQtY29tcGF0LjAnKSlcbiAgICAgICYmICFyeGpzVmVyc2lvbi5pc0dyZWF0ZXJUaGFuT3JFcXVhbFRvKG5ldyBTZW1WZXIoJzYuMC4wLWJldGEuMCcpKVxuICAgICkge1xuICAgICAgY29uc29sZS5lcnJvcih0ZXJtaW5hbC5ib2xkKHRlcm1pbmFsLnJlZCh0YWdzLnN0cmlwSW5kZW50c2BcbiAgICAgICAgICBUaGlzIHByb2plY3QgdXNlcyB2ZXJzaW9uICR7cnhqc1ZlcnNpb259IG9mIFJ4SnMsIHdoaWNoIGlzIG5vdCBzdXBwb3J0ZWQgYnkgQW5ndWxhciB2Ni5cbiAgICAgICAgICBUaGUgb2ZmaWNpYWwgUnhKcyB2ZXJzaW9uIHRoYXQgaXMgc3VwcG9ydGVkIGlzIDUuNi4wLWZvcndhcmQtY29tcGF0LjAgYW5kIGdyZWF0ZXIuXG5cbiAgICAgICAgICBQbGVhc2UgdmlzaXQgdGhlIGxpbmsgYmVsb3cgdG8gZmluZCBpbnN0cnVjdGlvbnMgb24gaG93IHRvIHVwZGF0ZSBSeEpzLlxuICAgICAgICAgIGh0dHBzOi8vZG9jcy5nb29nbGUuY29tL2RvY3VtZW50L2QvMTJubEx0NzFWTEtiLXozWWFTR3pVZng2bUpiYzM0bnNNWHRCeVBVTjM1Y2cvZWRpdCNcbiAgICAgICAgYCArICdcXG4nKSkpO1xuICAgICAgcHJvY2Vzcy5leGl0KDMpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBhbmd1bGFyVmVyc2lvbi5pc0dyZWF0ZXJUaGFuT3JFcXVhbFRvKG5ldyBTZW1WZXIoJzYuMC4wLXJjLjAnKSlcbiAgICAgICYmICFyeGpzVmVyc2lvbi5pc0dyZWF0ZXJUaGFuT3JFcXVhbFRvKG5ldyBTZW1WZXIoJzYuMC4wLWJldGEuMCcpKVxuICAgICkge1xuICAgICAgY29uc29sZS53YXJuKHRlcm1pbmFsLmJvbGQodGVybWluYWwucmVkKHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgICAgICAgIFRoaXMgcHJvamVjdCB1c2VzIGEgdGVtcG9yYXJ5IGNvbXBhdGliaWxpdHkgdmVyc2lvbiBvZiBSeEpzICgke3J4anNWZXJzaW9ufSkuXG5cbiAgICAgICAgICBQbGVhc2UgdmlzaXQgdGhlIGxpbmsgYmVsb3cgdG8gZmluZCBpbnN0cnVjdGlvbnMgb24gaG93IHRvIHVwZGF0ZSBSeEpzLlxuICAgICAgICAgIGh0dHBzOi8vZG9jcy5nb29nbGUuY29tL2RvY3VtZW50L2QvMTJubEx0NzFWTEtiLXozWWFTR3pVZng2bUpiYzM0bnNNWHRCeVBVTjM1Y2cvZWRpdCNcbiAgICAgICAgYCArICdcXG4nKSkpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBhc3NlcnRUeXBlc2NyaXB0VmVyc2lvbihwcm9qZWN0Um9vdDogc3RyaW5nKSB7XG4gICAgaWYgKCFpc1dhcm5pbmdFbmFibGVkKCd0eXBlc2NyaXB0TWlzbWF0Y2gnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBjb21waWxlclZlcnNpb246IHN0cmluZztcbiAgICBsZXQgdHNWZXJzaW9uOiBzdHJpbmc7XG4gICAgbGV0IGNvbXBpbGVyVHlwZVNjcmlwdFBlZXJWZXJzaW9uOiBzdHJpbmc7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc29sdmVPcHRpb25zID0ge1xuICAgICAgICBiYXNlZGlyOiBwcm9qZWN0Um9vdCxcbiAgICAgICAgY2hlY2tHbG9iYWw6IGZhbHNlLFxuICAgICAgICBjaGVja0xvY2FsOiB0cnVlLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGNvbXBpbGVyUGFja2FnZVBhdGggPSByZXNvbHZlKCdAYW5ndWxhci9jb21waWxlci1jbGkvcGFja2FnZS5qc29uJywgcmVzb2x2ZU9wdGlvbnMpO1xuICAgICAgY29uc3QgdHlwZXNjcmlwdFByb2plY3RQYXRoID0gcmVzb2x2ZSgndHlwZXNjcmlwdCcsIHJlc29sdmVPcHRpb25zKTtcbiAgICAgIGNvbnN0IGNvbXBpbGVyUGFja2FnZUluZm8gPSByZXF1aXJlKGNvbXBpbGVyUGFja2FnZVBhdGgpO1xuXG4gICAgICBjb21waWxlclZlcnNpb24gPSBjb21waWxlclBhY2thZ2VJbmZvWyd2ZXJzaW9uJ107XG4gICAgICBjb21waWxlclR5cGVTY3JpcHRQZWVyVmVyc2lvbiA9IGNvbXBpbGVyUGFja2FnZUluZm9bJ3BlZXJEZXBlbmRlbmNpZXMnXVsndHlwZXNjcmlwdCddO1xuICAgICAgdHNWZXJzaW9uID0gcmVxdWlyZSh0eXBlc2NyaXB0UHJvamVjdFBhdGgpLnZlcnNpb247XG4gICAgfSBjYXRjaCB7XG4gICAgICBjb25zb2xlLmVycm9yKHRlcm1pbmFsLmJvbGQodGVybWluYWwucmVkKHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgICAgICBWZXJzaW9ucyBvZiBAYW5ndWxhci9jb21waWxlci1jbGkgYW5kIHR5cGVzY3JpcHQgY291bGQgbm90IGJlIGRldGVybWluZWQuXG4gICAgICAgIFRoZSBtb3N0IGNvbW1vbiByZWFzb24gZm9yIHRoaXMgaXMgYSBicm9rZW4gbnBtIGluc3RhbGwuXG5cbiAgICAgICAgUGxlYXNlIG1ha2Ugc3VyZSB5b3VyIHBhY2thZ2UuanNvbiBjb250YWlucyBib3RoIEBhbmd1bGFyL2NvbXBpbGVyLWNsaSBhbmQgdHlwZXNjcmlwdCBpblxuICAgICAgICBkZXZEZXBlbmRlbmNpZXMsIHRoZW4gZGVsZXRlIG5vZGVfbW9kdWxlcyBhbmQgcGFja2FnZS1sb2NrLmpzb24gKGlmIHlvdSBoYXZlIG9uZSkgYW5kXG4gICAgICAgIHJ1biBucG0gaW5zdGFsbCBhZ2Fpbi5cbiAgICAgIGApKSk7XG4gICAgICBwcm9jZXNzLmV4aXQoMik7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUaGVzZSB2ZXJzaW9ucyBkbyBub3QgaGF2ZSBhY2N1cmF0ZSB0eXBlc2NyaXB0IHBlZXIgZGVwZW5kZW5jaWVzXG4gICAgY29uc3QgdmVyc2lvbkNvbWJvcyA9IFtcbiAgICAgIHsgY29tcGlsZXI6ICc+PTIuMy4xIDwzLjAuMCcsIHR5cGVzY3JpcHQ6ICc+PTIuMC4yIDwyLjMuMCcgfSxcbiAgICAgIHsgY29tcGlsZXI6ICc+PTQuMC4wLWJldGEuMCA8NS4wLjAnLCB0eXBlc2NyaXB0OiAnPj0yLjEuMCA8Mi40LjAnIH0sXG4gICAgICB7IGNvbXBpbGVyOiAnNS4wLjAtYmV0YS4wIC0gNS4wLjAtcmMuMicsIHR5cGVzY3JpcHQ6ICc+PTIuNC4yIDwyLjUuMCcgfSxcbiAgICBdO1xuXG4gICAgbGV0IGN1cnJlbnRDb21ibyA9IHZlcnNpb25Db21ib3MuZmluZCgoY29tYm8pID0+IHNhdGlzZmllcyhjb21waWxlclZlcnNpb24sIGNvbWJvLmNvbXBpbGVyKSk7XG4gICAgaWYgKCFjdXJyZW50Q29tYm8gJiYgY29tcGlsZXJUeXBlU2NyaXB0UGVlclZlcnNpb24pIHtcbiAgICAgIGN1cnJlbnRDb21ibyA9IHsgY29tcGlsZXI6IGNvbXBpbGVyVmVyc2lvbiwgdHlwZXNjcmlwdDogY29tcGlsZXJUeXBlU2NyaXB0UGVlclZlcnNpb24gfTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudENvbWJvICYmICFzYXRpc2ZpZXModHNWZXJzaW9uLCBjdXJyZW50Q29tYm8udHlwZXNjcmlwdCkpIHtcbiAgICAgIC8vIEZpcnN0IGxpbmUgb2Ygd2FybmluZyBsb29rcyB3ZWlyZCBiZWluZyBzcGxpdCBpbiB0d28sIGRpc2FibGUgdHNsaW50IGZvciBpdC5cbiAgICAgIGNvbnNvbGUuZXJyb3IoKHRlcm1pbmFsLnllbGxvdygnXFxuJyArIHRhZ3Muc3RyaXBJbmRlbnRgXG4gICAgICAgIEBhbmd1bGFyL2NvbXBpbGVyLWNsaUAke2NvbXBpbGVyVmVyc2lvbn0gcmVxdWlyZXMgdHlwZXNjcmlwdEAnJHtcbiAgICAgICAgY3VycmVudENvbWJvLnR5cGVzY3JpcHR9JyBidXQgJHt0c1ZlcnNpb259IHdhcyBmb3VuZCBpbnN0ZWFkLlxuICAgICAgICBVc2luZyB0aGlzIHZlcnNpb24gY2FuIHJlc3VsdCBpbiB1bmRlZmluZWQgYmVoYXZpb3VyIGFuZCBkaWZmaWN1bHQgdG8gZGVidWcgcHJvYmxlbXMuXG5cbiAgICAgICAgUGxlYXNlIHJ1biB0aGUgZm9sbG93aW5nIGNvbW1hbmQgdG8gaW5zdGFsbCBhIGNvbXBhdGlibGUgdmVyc2lvbiBvZiBUeXBlU2NyaXB0LlxuXG4gICAgICAgICAgICBucG0gaW5zdGFsbCB0eXBlc2NyaXB0QFwiJHtjdXJyZW50Q29tYm8udHlwZXNjcmlwdH1cIlxuXG4gICAgICAgIFRvIGRpc2FibGUgdGhpcyB3YXJuaW5nIHJ1biBcIm5nIGNvbmZpZyBjbGkud2FybmluZ3MudHlwZXNjcmlwdE1pc21hdGNoIGZhbHNlXCIuXG4gICAgICBgICsgJ1xcbicpKSk7XG4gICAgfVxuICB9XG5cbn1cbiJdfQ==