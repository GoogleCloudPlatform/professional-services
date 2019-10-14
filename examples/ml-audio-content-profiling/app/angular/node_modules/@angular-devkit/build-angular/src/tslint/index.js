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
const fs_1 = require("fs");
const glob = require("glob");
const minimatch_1 = require("minimatch");
const path = require("path");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const strip_bom_1 = require("../angular-cli-files/utilities/strip-bom");
class TslintBuilder {
    constructor(context) {
        this.context = context;
    }
    async loadTslint() {
        let tslint;
        try {
            tslint = await Promise.resolve().then(() => require('tslint')); // tslint:disable-line:no-implicit-dependencies
        }
        catch (_a) {
            throw new Error('Unable to find TSLint. Ensure TSLint is installed.');
        }
        const version = tslint.Linter.VERSION && tslint.Linter.VERSION.split('.');
        if (!version || version.length < 2 || Number(version[0]) < 5 || Number(version[1]) < 5) {
            throw new Error('TSLint must be version 5.5 or higher.');
        }
        return tslint;
    }
    run(builderConfig) {
        const root = this.context.workspace.root;
        const systemRoot = core_1.getSystemPath(root);
        const options = builderConfig.options;
        if (!options.tsConfig && options.typeCheck) {
            throw new Error('A "project" must be specified to enable type checking.');
        }
        return rxjs_1.from(this.loadTslint()).pipe(operators_1.concatMap(projectTslint => new rxjs_1.Observable(obs => {
            const tslintConfigPath = options.tslintConfig
                ? path.resolve(systemRoot, options.tslintConfig)
                : null;
            const Linter = projectTslint.Linter;
            let result;
            if (options.tsConfig) {
                const tsConfigs = Array.isArray(options.tsConfig) ? options.tsConfig : [options.tsConfig];
                for (const tsConfig of tsConfigs) {
                    const program = Linter.createProgram(path.resolve(systemRoot, tsConfig));
                    const partial = lint(projectTslint, systemRoot, tslintConfigPath, options, program);
                    if (result == undefined) {
                        result = partial;
                    }
                    else {
                        result.failures = result.failures
                            .filter(curr => !partial.failures.some(prev => curr.equals(prev)))
                            .concat(partial.failures);
                        // we are not doing much with 'errorCount' and 'warningCount'
                        // apart from checking if they are greater than 0 thus no need to dedupe these.
                        result.errorCount += partial.errorCount;
                        result.warningCount += partial.warningCount;
                        if (partial.fixes) {
                            result.fixes = result.fixes ? result.fixes.concat(partial.fixes) : partial.fixes;
                        }
                    }
                }
            }
            else {
                result = lint(projectTslint, systemRoot, tslintConfigPath, options);
            }
            if (result == undefined) {
                throw new Error('Invalid lint configuration. Nothing to lint.');
            }
            if (!options.silent) {
                const Formatter = projectTslint.findFormatter(options.format);
                if (!Formatter) {
                    throw new Error(`Invalid lint format "${options.format}".`);
                }
                const formatter = new Formatter();
                const output = formatter.format(result.failures, result.fixes);
                if (output) {
                    this.context.logger.info(output);
                }
            }
            // Print formatter output directly for non human-readable formats.
            if (['prose', 'verbose', 'stylish'].indexOf(options.format) == -1) {
                options.silent = true;
            }
            if (result.warningCount > 0 && !options.silent) {
                this.context.logger.warn('Lint warnings found in the listed files.');
            }
            if (result.errorCount > 0 && !options.silent) {
                this.context.logger.error('Lint errors found in the listed files.');
            }
            if (result.warningCount === 0 && result.errorCount === 0 && !options.silent) {
                this.context.logger.info('All files pass linting.');
            }
            const success = options.force || result.errorCount === 0;
            obs.next({ success });
            return obs.complete();
        })));
    }
}
exports.default = TslintBuilder;
function lint(projectTslint, systemRoot, tslintConfigPath, options, program) {
    const Linter = projectTslint.Linter;
    const Configuration = projectTslint.Configuration;
    const files = getFilesToLint(systemRoot, options, Linter, program);
    const lintOptions = {
        fix: options.fix,
        formatter: options.format,
    };
    const linter = new Linter(lintOptions, program);
    let lastDirectory;
    let configLoad;
    for (const file of files) {
        const contents = getFileContents(file, options, program);
        // Only check for a new tslint config if the path changes.
        const currentDirectory = path.dirname(file);
        if (currentDirectory !== lastDirectory) {
            configLoad = Configuration.findConfiguration(tslintConfigPath, file);
            lastDirectory = currentDirectory;
        }
        if (contents && configLoad) {
            linter.lint(file, contents, configLoad.results);
        }
    }
    return linter.getResult();
}
function getFilesToLint(root, options, linter, program) {
    const ignore = options.exclude;
    if (options.files.length > 0) {
        return options.files
            .map(file => glob.sync(file, { cwd: root, ignore, nodir: true }))
            .reduce((prev, curr) => prev.concat(curr), [])
            .map(file => path.join(root, file));
    }
    if (!program) {
        return [];
    }
    let programFiles = linter.getFileNames(program);
    if (ignore && ignore.length > 0) {
        // normalize to support ./ paths
        const ignoreMatchers = ignore
            .map(pattern => new minimatch_1.Minimatch(path.normalize(pattern), { dot: true }));
        programFiles = programFiles
            .filter(file => !ignoreMatchers.some(matcher => matcher.match(path.relative(root, file))));
    }
    return programFiles;
}
function getFileContents(file, options, program) {
    // The linter retrieves the SourceFile TS node directly if a program is used
    if (program) {
        if (program.getSourceFile(file) == undefined) {
            const message = `File '${file}' is not part of the TypeScript project '${options.tsConfig}'.`;
            throw new Error(message);
        }
        // TODO: this return had to be commented out otherwise no file would be linted, figure out why.
        // return undefined;
    }
    // NOTE: The tslint CLI checks for and excludes MPEG transport streams; this does not.
    try {
        return strip_bom_1.stripBom(fs_1.readFileSync(file, 'utf-8'));
    }
    catch (_a) {
        throw new Error(`Could not read file '${file}'.`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3RzbGludC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQVFILCtDQUFxRDtBQUNyRCwyQkFBa0M7QUFDbEMsNkJBQTZCO0FBQzdCLHlDQUFzQztBQUN0Qyw2QkFBNkI7QUFDN0IsK0JBQXdDO0FBQ3hDLDhDQUEyQztBQUczQyx3RUFBb0U7QUFjcEUsTUFBcUIsYUFBYTtJQUVoQyxZQUFtQixPQUF1QjtRQUF2QixZQUFPLEdBQVAsT0FBTyxDQUFnQjtJQUFJLENBQUM7SUFFdkMsS0FBSyxDQUFDLFVBQVU7UUFDdEIsSUFBSSxNQUFNLENBQUM7UUFDWCxJQUFJO1lBQ0YsTUFBTSxHQUFHLDJDQUFhLFFBQVEsRUFBQyxDQUFDLENBQUMsK0NBQStDO1NBQ2pGO1FBQUMsV0FBTTtZQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQztTQUN2RTtRQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUN0RixNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7U0FDMUQ7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsR0FBRyxDQUFDLGFBQXlEO1FBRTNELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENB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QU07YUFDMUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXpFLFlBQVksR0FBRyxZQUFZO2FBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDOUY7SUFFRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQ3RCLElBQVksRUFDWixPQUE2QixFQUM3QixPQUFvQjtJQUVwQiw0RUFBNEU7SUFDNUUsSUFBSSxPQUFPLEVBQUU7UUFDWCxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxFQUFFO1lBQzVDLE1BQU0sT0FBTyxHQUFHLFNBQVMsSUFBSSw0Q0FBNEMsT0FBTyxDQUFDLFFBQVEsSUFBSSxDQUFDO1lBQzlGLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDMUI7UUFFRCwrRkFBK0Y7UUFDL0Ysb0JBQW9CO0tBQ3JCO0lBRUQsc0ZBQXNGO0lBQ3RGLElBQUk7UUFDRixPQUFPLG9CQUFRLENBQUMsaUJBQVksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUM5QztJQUFDLFdBQU07UUFDTixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixJQUFJLElBQUksQ0FBQyxDQUFDO0tBQ25EO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQnVpbGRFdmVudCxcbiAgQnVpbGRlcixcbiAgQnVpbGRlckNvbmZpZ3VyYXRpb24sXG4gIEJ1aWxkZXJDb250ZXh0LFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvYXJjaGl0ZWN0JztcbmltcG9ydCB7IGdldFN5c3RlbVBhdGggfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBnbG9iIGZyb20gJ2dsb2InO1xuaW1wb3J0IHsgTWluaW1hdGNoIH0gZnJvbSAnbWluaW1hdGNoJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBmcm9tIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgKiBhcyB0c2xpbnQgZnJvbSAndHNsaW50JzsgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1pbXBsaWNpdC1kZXBlbmRlbmNpZXNcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnOyAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLWltcGxpY2l0LWRlcGVuZGVuY2llc1xuaW1wb3J0IHsgc3RyaXBCb20gfSBmcm9tICcuLi9hbmd1bGFyLWNsaS1maWxlcy91dGlsaXRpZXMvc3RyaXAtYm9tJztcblxuZXhwb3J0IGludGVyZmFjZSBUc2xpbnRCdWlsZGVyT3B0aW9ucyB7XG4gIHRzbGludENvbmZpZz86IHN0cmluZztcbiAgdHNDb25maWc/OiBzdHJpbmcgfCBzdHJpbmdbXTtcbiAgZml4OiBib29sZWFuO1xuICB0eXBlQ2hlY2s6IGJvb2xlYW47XG4gIGZvcmNlOiBib29sZWFuO1xuICBzaWxlbnQ6IGJvb2xlYW47XG4gIGZvcm1hdDogc3RyaW5nO1xuICBleGNsdWRlOiBzdHJpbmdbXTtcbiAgZmlsZXM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUc2xpbnRCdWlsZGVyIGltcGxlbWVudHMgQnVpbGRlcjxUc2xpbnRCdWlsZGVyT3B0aW9ucz4ge1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCkgeyB9XG5cbiAgcHJpdmF0ZSBhc3luYyBsb2FkVHNsaW50KCkge1xuICAgIGxldCB0c2xpbnQ7XG4gICAgdHJ5IHtcbiAgICAgIHRzbGludCA9IGF3YWl0IGltcG9ydCgndHNsaW50Jyk7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8taW1wbGljaXQtZGVwZW5kZW5jaWVzXG4gICAgfSBjYXRjaCB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBmaW5kIFRTTGludC4gRW5zdXJlIFRTTGludCBpcyBpbnN0YWxsZWQuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgdmVyc2lvbiA9IHRzbGludC5MaW50ZXIuVkVSU0lPTiAmJiB0c2xpbnQuTGludGVyLlZFUlNJT04uc3BsaXQoJy4nKTtcbiAgICBpZiAoIXZlcnNpb24gfHwgdmVyc2lvbi5sZW5ndGggPCAyIHx8IE51bWJlcih2ZXJzaW9uWzBdKSA8IDUgfHwgTnVtYmVyKHZlcnNpb25bMV0pIDwgNSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUU0xpbnQgbXVzdCBiZSB2ZXJzaW9uIDUuNSBvciBoaWdoZXIuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRzbGludDtcbiAgfVxuXG4gIHJ1bihidWlsZGVyQ29uZmlnOiBCdWlsZGVyQ29uZmlndXJhdGlvbjxUc2xpbnRCdWlsZGVyT3B0aW9ucz4pOiBPYnNlcnZhYmxlPEJ1aWxkRXZlbnQ+IHtcblxuICAgIGNvbnN0IHJvb3QgPSB0aGlzLmNvbnRleHQud29ya3NwYWNlLnJvb3Q7XG4gICAgY29uc3Qgc3lzdGVtUm9vdCA9IGdldFN5c3RlbVBhdGgocm9vdCk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IGJ1aWxkZXJDb25maWcub3B0aW9ucztcblxuICAgIGlmICghb3B0aW9ucy50c0NvbmZpZyAmJiBvcHRpb25zLnR5cGVDaGVjaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIFwicHJvamVjdFwiIG11c3QgYmUgc3BlY2lmaWVkIHRvIGVuYWJsZSB0eXBlIGNoZWNraW5nLicpO1xuICAgIH1cblxuICAgIHJldHVybiBmcm9tKHRoaXMubG9hZFRzbGludCgpKS5waXBlKGNvbmNhdE1hcChwcm9qZWN0VHNsaW50ID0+IG5ldyBPYnNlcnZhYmxlKG9icyA9PiB7XG4gICAgICBjb25zdCB0c2xpbnRDb25maWdQYXRoID0gb3B0aW9ucy50c2xpbnRDb25maWdcbiAgICAgICAgPyBwYXRoLnJlc29sdmUoc3lzdGVtUm9vdCwgb3B0aW9ucy50c2xpbnRDb25maWcpXG4gICAgICAgIDogbnVsbDtcbiAgICAgIGNvbnN0IExpbnRlciA9IHByb2plY3RUc2xpbnQuTGludGVyO1xuXG4gICAgICBsZXQgcmVzdWx0OiB1bmRlZmluZWQgfCB0c2xpbnQuTGludFJlc3VsdDtcbiAgICAgIGlmIChvcHRpb25zLnRzQ29uZmlnKSB7XG4gICAgICAgIGNvbnN0IHRzQ29uZmlncyA9IEFycmF5LmlzQXJyYXkob3B0aW9ucy50c0NvbmZpZykgPyBvcHRpb25zLnRzQ29uZmlnIDogW29wdGlvbnMudHNDb25maWddO1xuXG4gICAgICAgIGZvciAoY29uc3QgdHNDb25maWcgb2YgdHNDb25maWdzKSB7XG4gICAgICAgICAgY29uc3QgcHJvZ3JhbSA9IExpbnRlci5jcmVhdGVQcm9ncmFtKHBhdGgucmVzb2x2ZShzeXN0ZW1Sb290LCB0c0NvbmZpZykpO1xuICAgICAgICAgIGNvbnN0IHBhcnRpYWwgPSBsaW50KHByb2plY3RUc2xpbnQsIHN5c3RlbVJvb3QsIHRzbGludENvbmZpZ1BhdGgsIG9wdGlvbnMsIHByb2dyYW0pO1xuICAgICAgICAgIGlmIChyZXN1bHQgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBwYXJ0aWFsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQuZmFpbHVyZXMgPSByZXN1bHQuZmFpbHVyZXNcbiAgICAgICAgICAgICAgLmZpbHRlcihjdXJyID0+ICFwYXJ0aWFsLmZhaWx1cmVzLnNvbWUocHJldiA9PiBjdXJyLmVxdWFscyhwcmV2KSkpXG4gICAgICAgICAgICAgIC5jb25jYXQocGFydGlhbC5mYWlsdXJlcyk7XG5cbiAgICAgICAgICAgIC8vIHdlIGFyZSBub3QgZG9pbmcgbXVjaCB3aXRoICdlcnJvckNvdW50JyBhbmQgJ3dhcm5pbmdDb3VudCdcbiAgICAgICAgICAgIC8vIGFwYXJ0IGZyb20gY2hlY2tpbmcgaWYgdGhleSBhcmUgZ3JlYXRlciB0aGFuIDAgdGh1cyBubyBuZWVkIHRvIGRlZHVwZSB0aGVzZS5cbiAgICAgICAgICAgIHJlc3VsdC5lcnJvckNvdW50ICs9IHBhcnRpYWwuZXJyb3JDb3VudDtcbiAgICAgICAgICAgIHJlc3VsdC53YXJuaW5nQ291bnQgKz0gcGFydGlhbC53YXJuaW5nQ291bnQ7XG5cbiAgICAgICAgICAgIGlmIChwYXJ0aWFsLmZpeGVzKSB7XG4gICAgICAgICAgICAgIHJlc3VsdC5maXhlcyA9IHJlc3VsdC5maXhlcyA/IHJlc3VsdC5maXhlcy5jb25jYXQocGFydGlhbC5maXhlcykgOiBwYXJ0aWFsLmZpeGVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gbGludChwcm9qZWN0VHNsaW50LCBzeXN0ZW1Sb290LCB0c2xpbnRDb25maWdQYXRoLCBvcHRpb25zKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdCA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGxpbnQgY29uZmlndXJhdGlvbi4gTm90aGluZyB0byBsaW50LicpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB7XG4gICAgICAgIGNvbnN0IEZvcm1hdHRlciA9IHByb2plY3RUc2xpbnQuZmluZEZvcm1hdHRlcihvcHRpb25zLmZvcm1hdCk7XG4gICAgICAgIGlmICghRm9ybWF0dGVyKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGxpbnQgZm9ybWF0IFwiJHtvcHRpb25zLmZvcm1hdH1cIi5gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgRm9ybWF0dGVyKCk7XG5cbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gZm9ybWF0dGVyLmZvcm1hdChyZXN1bHQuZmFpbHVyZXMsIHJlc3VsdC5maXhlcyk7XG4gICAgICAgIGlmIChvdXRwdXQpIHtcbiAgICAgICAgICB0aGlzLmNvbnRleHQubG9nZ2VyLmluZm8ob3V0cHV0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBQcmludCBmb3JtYXR0ZXIgb3V0cHV0IGRpcmVjdGx5IGZvciBub24gaHVtYW4tcmVhZGFibGUgZm9ybWF0cy5cbiAgICAgIGlmIChbJ3Byb3NlJywgJ3ZlcmJvc2UnLCAnc3R5bGlzaCddLmluZGV4T2Yob3B0aW9ucy5mb3JtYXQpID09IC0xKSB7XG4gICAgICAgIG9wdGlvbnMuc2lsZW50ID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdC53YXJuaW5nQ291bnQgPiAwICYmICFvcHRpb25zLnNpbGVudCkge1xuICAgICAgICB0aGlzLmNvbnRleHQubG9nZ2VyLndhcm4oJ0xpbnQgd2FybmluZ3MgZm91bmQgaW4gdGhlIGxpc3RlZCBmaWxlcy4nKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdC5lcnJvckNvdW50ID4gMCAmJiAhb3B0aW9ucy5zaWxlbnQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmxvZ2dlci5lcnJvcignTGludCBlcnJvcnMgZm91bmQgaW4gdGhlIGxpc3RlZCBmaWxlcy4nKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdC53YXJuaW5nQ291bnQgPT09IDAgJiYgcmVzdWx0LmVycm9yQ291bnQgPT09IDAgJiYgIW9wdGlvbnMuc2lsZW50KSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5sb2dnZXIuaW5mbygnQWxsIGZpbGVzIHBhc3MgbGludGluZy4nKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3VjY2VzcyA9IG9wdGlvbnMuZm9yY2UgfHwgcmVzdWx0LmVycm9yQ291bnQgPT09IDA7XG4gICAgICBvYnMubmV4dCh7IHN1Y2Nlc3MgfSk7XG5cbiAgICAgIHJldHVybiBvYnMuY29tcGxldGUoKTtcbiAgICB9KSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxpbnQoXG4gIHByb2plY3RUc2xpbnQ6IHR5cGVvZiB0c2xpbnQsXG4gIHN5c3RlbVJvb3Q6IHN0cmluZyxcbiAgdHNsaW50Q29uZmlnUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgb3B0aW9uczogVHNsaW50QnVpbGRlck9wdGlvbnMsXG4gIHByb2dyYW0/OiB0cy5Qcm9ncmFtLFxuKSB7XG4gIGNvbnN0IExpbnRlciA9IHByb2plY3RUc2xpbnQuTGludGVyO1xuICBjb25zdCBDb25maWd1cmF0aW9uID0gcHJvamVjdFRzbGludC5Db25maWd1cmF0aW9uO1xuXG4gIGNvbnN0IGZpbGVzID0gZ2V0RmlsZXNUb0xpbnQoc3lzdGVtUm9vdCwgb3B0aW9ucywgTGludGVyLCBwcm9ncmFtKTtcbiAgY29uc3QgbGludE9wdGlvbnMgPSB7XG4gICAgZml4OiBvcHRpb25zLmZpeCxcbiAgICBmb3JtYXR0ZXI6IG9wdGlvbnMuZm9ybWF0LFxuICB9O1xuXG4gIGNvbnN0IGxpbnRlciA9IG5ldyBMaW50ZXIobGludE9wdGlvbnMsIHByb2dyYW0pO1xuXG4gIGxldCBsYXN0RGlyZWN0b3J5O1xuICBsZXQgY29uZmlnTG9hZDtcbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgY29uc3QgY29udGVudHMgPSBnZXRGaWxlQ29udGVudHMoZmlsZSwgb3B0aW9ucywgcHJvZ3JhbSk7XG5cbiAgICAvLyBPbmx5IGNoZWNrIGZvciBhIG5ldyB0c2xpbnQgY29uZmlnIGlmIHRoZSBwYXRoIGNoYW5nZXMuXG4gICAgY29uc3QgY3VycmVudERpcmVjdG9yeSA9IHBhdGguZGlybmFtZShmaWxlKTtcbiAgICBpZiAoY3VycmVudERpcmVjdG9yeSAhPT0gbGFzdERpcmVjdG9yeSkge1xuICAgICAgY29uZmlnTG9hZCA9IENvbmZpZ3VyYXRpb24uZmluZENvbmZpZ3VyYXRpb24odHNsaW50Q29uZmlnUGF0aCwgZmlsZSk7XG4gICAgICBsYXN0RGlyZWN0b3J5ID0gY3VycmVudERpcmVjdG9yeTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudHMgJiYgY29uZmlnTG9hZCkge1xuICAgICAgbGludGVyLmxpbnQoZmlsZSwgY29udGVudHMsIGNvbmZpZ0xvYWQucmVzdWx0cyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGxpbnRlci5nZXRSZXN1bHQoKTtcbn1cblxuZnVuY3Rpb24gZ2V0RmlsZXNUb0xpbnQoXG4gIHJvb3Q6IHN0cmluZyxcbiAgb3B0aW9uczogVHNsaW50QnVpbGRlck9wdGlvbnMsXG4gIGxpbnRlcjogdHlwZW9mIHRzbGludC5MaW50ZXIsXG4gIHByb2dyYW0/OiB0cy5Qcm9ncmFtLFxuKTogc3RyaW5nW10ge1xuICBjb25zdCBpZ25vcmUgPSBvcHRpb25zLmV4Y2x1ZGU7XG5cbiAgaWYgKG9wdGlvbnMuZmlsZXMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBvcHRpb25zLmZpbGVzXG4gICAgICAubWFwKGZpbGUgPT4gZ2xvYi5zeW5jKGZpbGUsIHsgY3dkOiByb290LCBpZ25vcmUsIG5vZGlyOiB0cnVlIH0pKVxuICAgICAgLnJlZHVjZSgocHJldiwgY3VycikgPT4gcHJldi5jb25jYXQoY3VyciksIFtdKVxuICAgICAgLm1hcChmaWxlID0+IHBhdGguam9pbihyb290LCBmaWxlKSk7XG4gIH1cblxuICBpZiAoIXByb2dyYW0pIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBsZXQgcHJvZ3JhbUZpbGVzID0gbGludGVyLmdldEZpbGVOYW1lcyhwcm9ncmFtKTtcblxuICBpZiAoaWdub3JlICYmIGlnbm9yZS5sZW5ndGggPiAwKSB7XG4gICAgLy8gbm9ybWFsaXplIHRvIHN1cHBvcnQgLi8gcGF0aHNcbiAgICBjb25zdCBpZ25vcmVNYXRjaGVycyA9IGlnbm9yZVxuICAgICAgLm1hcChwYXR0ZXJuID0+IG5ldyBNaW5pbWF0Y2gocGF0aC5ub3JtYWxpemUocGF0dGVybiksIHsgZG90OiB0cnVlIH0pKTtcblxuICAgIHByb2dyYW1GaWxlcyA9IHByb2dyYW1GaWxlc1xuICAgICAgLmZpbHRlcihmaWxlID0+ICFpZ25vcmVNYXRjaGVycy5zb21lKG1hdGNoZXIgPT4gbWF0Y2hlci5tYXRjaChwYXRoLnJlbGF0aXZlKHJvb3QsIGZpbGUpKSkpO1xuICB9XG5cbiAgcmV0dXJuIHByb2dyYW1GaWxlcztcbn1cblxuZnVuY3Rpb24gZ2V0RmlsZUNvbnRlbnRzKFxuICBmaWxlOiBzdHJpbmcsXG4gIG9wdGlvbnM6IFRzbGludEJ1aWxkZXJPcHRpb25zLFxuICBwcm9ncmFtPzogdHMuUHJvZ3JhbSxcbik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIC8vIFRoZSBsaW50ZXIgcmV0cmlldmVzIHRoZSBTb3VyY2VGaWxlIFRTIG5vZGUgZGlyZWN0bHkgaWYgYSBwcm9ncmFtIGlzIHVzZWRcbiAgaWYgKHByb2dyYW0pIHtcbiAgICBpZiAocHJvZ3JhbS5nZXRTb3VyY2VGaWxlKGZpbGUpID09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGBGaWxlICcke2ZpbGV9JyBpcyBub3QgcGFydCBvZiB0aGUgVHlwZVNjcmlwdCBwcm9qZWN0ICcke29wdGlvbnMudHNDb25maWd9Jy5gO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIC8vIFRPRE86IHRoaXMgcmV0dXJuIGhhZCB0byBiZSBjb21tZW50ZWQgb3V0IG90aGVyd2lzZSBubyBmaWxlIHdvdWxkIGJlIGxpbnRlZCwgZmlndXJlIG91dCB3aHkuXG4gICAgLy8gcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8vIE5PVEU6IFRoZSB0c2xpbnQgQ0xJIGNoZWNrcyBmb3IgYW5kIGV4Y2x1ZGVzIE1QRUcgdHJhbnNwb3J0IHN0cmVhbXM7IHRoaXMgZG9lcyBub3QuXG4gIHRyeSB7XG4gICAgcmV0dXJuIHN0cmlwQm9tKHJlYWRGaWxlU3luYyhmaWxlLCAndXRmLTgnKSk7XG4gIH0gY2F0Y2gge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlYWQgZmlsZSAnJHtmaWxlfScuYCk7XG4gIH1cbn1cbiJdfQ==