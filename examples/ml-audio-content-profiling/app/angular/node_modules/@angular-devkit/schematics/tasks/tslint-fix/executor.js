"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const node_1 = require("@angular-devkit/core/node");
const fs = require("fs");
const path = require("path");
const rxjs_1 = require("rxjs");
function _loadConfiguration(Configuration, options, root, file) {
    if (options.tslintConfig) {
        return Configuration.parseConfigFile(options.tslintConfig, root);
    }
    else if (options.tslintPath) {
        return Configuration.findConfiguration(path.join(root, options.tslintPath)).results;
    }
    else if (file) {
        return Configuration.findConfiguration(null, file).results;
    }
    else {
        throw new Error('Executor must specify a tslint configuration.');
    }
}
function _getFileContent(file, options, program) {
    // The linter retrieves the SourceFile TS node directly if a program is used
    if (program) {
        const source = program.getSourceFile(file);
        if (!source) {
            const message = `File '${file}' is not part of the TypeScript project '${options.tsConfigPath}'.`;
            throw new Error(message);
        }
        return source.getFullText(source);
    }
    // NOTE: The tslint CLI checks for and excludes MPEG transport streams; this does not.
    try {
        // Strip BOM from file data.
        // https://stackoverflow.com/questions/24356713
        return fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
    }
    catch (_a) {
        throw new Error(`Could not read file '${file}'.`);
    }
}
function _listAllFiles(root) {
    const result = [];
    function _recurse(location) {
        const dir = fs.readdirSync(path.join(root, location));
        dir.forEach(name => {
            const loc = path.join(location, name);
            if (fs.statSync(path.join(root, loc)).isDirectory()) {
                _recurse(loc);
            }
            else {
                result.push(loc);
            }
        });
    }
    _recurse('');
    return result;
}
function default_1() {
    return (options, context) => {
        return new rxjs_1.Observable(obs => {
            const root = process.cwd();
            const tslint = require(node_1.resolve('tslint', {
                basedir: root,
                checkGlobal: true,
                checkLocal: true,
            }));
            const includes = (Array.isArray(options.includes)
                ? options.includes
                : (options.includes ? [options.includes] : []));
            const files = (Array.isArray(options.files)
                ? options.files
                : (options.files ? [options.files] : []));
            const Linter = tslint.Linter;
            const Configuration = tslint.Configuration;
            let program = undefined;
            let filesToLint = files;
            if (options.tsConfigPath && files.length == 0) {
                const tsConfigPath = path.join(process.cwd(), options.tsConfigPath);
                if (!fs.existsSync(tsConfigPath)) {
                    obs.error(new Error('Could not find tsconfig.'));
                    return;
                }
                program = Linter.createProgram(tsConfigPath);
                filesToLint = Linter.getFileNames(program);
            }
            if (includes.length > 0) {
                const allFilesRel = _listAllFiles(root);
                const pattern = '^('
                    + includes
                        .map(ex => '('
                        + ex.split(/[\/\\]/g).map(f => f
                            .replace(/[\-\[\]{}()+?.^$|]/g, '\\$&')
                            .replace(/^\*\*/g, '(.+?)?')
                            .replace(/\*/g, '[^/\\\\]*'))
                            .join('[\/\\\\]')
                        + ')')
                        .join('|')
                    + ')($|/|\\\\)';
                const re = new RegExp(pattern);
                filesToLint.push(...allFilesRel
                    .filter(x => re.test(x))
                    .map(x => path.join(root, x)));
            }
            const lintOptions = {
                fix: true,
                formatter: options.format || 'prose',
            };
            const linter = new Linter(lintOptions, program);
            // If directory doesn't change, we
            let lastDirectory = null;
            let config;
            for (const file of filesToLint) {
                const dir = path.dirname(file);
                if (lastDirectory !== dir) {
                    lastDirectory = dir;
                    config = _loadConfiguration(Configuration, options, root, file);
                }
                const content = _getFileContent(file, options, program);
                if (!content) {
                    continue;
                }
                linter.lint(file, content, config);
            }
            const result = linter.getResult();
            // Format and show the results.
            if (!options.silent) {
                const Formatter = tslint.findFormatter(options.format || 'prose');
                if (!Formatter) {
                    throw new Error(`Invalid lint format "${options.format}".`);
                }
                const formatter = new Formatter();
                // Certain tslint formatters outputs '\n' when there are no failures.
                // This will bloat the console when having schematics running refactor tasks.
                // see https://github.com/palantir/tslint/issues/4244
                const output = (formatter.format(result.failures, result.fixes) || '').trim();
                if (output) {
                    context.logger.info(output);
                }
            }
            if (!options.ignoreErrors && result.errorCount > 0) {
                obs.error(new Error('Lint errors were found.'));
            }
            else {
                obs.next();
                obs.complete();
            }
        });
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MvdHNsaW50LWZpeC9leGVjdXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILG9EQUFvRDtBQUNwRCx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLCtCQUFrQztBQWNsQyxTQUFTLGtCQUFrQixDQUN6QixhQUE2QixFQUM3QixPQUE2QixFQUM3QixJQUFZLEVBQ1osSUFBYTtJQUViLElBQUksT0FBTyxDQUFDLFlBQVksRUFBRTtRQUN4QixPQUFPLGFBQWEsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNsRTtTQUFNLElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRTtRQUM3QixPQUFPLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7S0FDckY7U0FBTSxJQUFJLElBQUksRUFBRTtRQUNmLE9BQU8sYUFBYSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUM7S0FDNUQ7U0FBTTtRQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztLQUNsRTtBQUNILENBQUM7QUFHRCxTQUFTLGVBQWUsQ0FDdEIsSUFBWSxFQUNaLE9BQTZCLEVBQzdCLE9BQW9CO0lBRXBCLDRFQUE0RTtJQUM1RSxJQUFJLE9BQU8sRUFBRTtRQUNYLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE1BQU0sT0FBTyxHQUNULFNBQVMsSUFBSSw0Q0FBNEMsT0FBTyxDQUFDLFlBQVksSUFBSSxDQUFDO1lBQ3RGLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDMUI7UUFFRCxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDbkM7SUFFRCxzRkFBc0Y7SUFDdEYsSUFBSTtRQUNGLDRCQUE0QjtRQUM1QiwrQ0FBK0M7UUFDL0MsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQzlEO0lBQUMsV0FBTTtRQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLElBQUksSUFBSSxDQUFDLENBQUM7S0FDbkQ7QUFDSCxDQUFDO0FBR0QsU0FBUyxhQUFhLENBQUMsSUFBWTtJQUNqQyxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7SUFFNUIsU0FBUyxRQUFRLENBQUMsUUFBZ0I7UUFDaEMsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBRXRELEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDakIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEMsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7Z0JBQ25ELFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNmO2lCQUFNO2dCQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDbEI7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFYixPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBR0Q7SUFDRSxPQUFPLENBQUMsT0FBNkIsRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDbEUsT0FBTyxJQUFJLGlCQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDMUIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQzNCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxjQUFPLENBQUMsUUFBUSxFQUFFO2dCQUN2QyxPQUFPLEVBQUUsSUFBSTtnQkFDYixXQUFXLEVBQUUsSUFBSTtnQkFDakIsVUFBVSxFQUFFLElBQUk7YUFDakIsQ0FBQyxDQUFDLENBQUM7WUFDSixNQUFNLFFBQVEsR0FBRyxDQUNmLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztnQkFDN0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRO2dCQUNsQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQ2pELENBQUM7WUFDRixNQUFNLEtBQUssR0FBRyxDQUNaLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztnQkFDMUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLO2dCQUNmLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FDM0MsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFpQixDQUFDO1lBQ3hDLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUErQixDQUFDO1lBQzdELElBQUksT0FBTyxHQUEyQixTQUFTLENBQUM7WUFDaEQsSUFBSSxXQUFXLEdBQWEsS0FBSyxDQUFDO1lBRWxDLElBQUksT0FBTyxDQUFDLFlBQVksSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtnQkFDN0MsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUVwRSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRTtvQkFDaEMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUM7b0JBRWpELE9BQU87aUJBQ1I7Z0JBQ0QsT0FBTyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzdDLFdBQVcsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQzVDO1lBRUQsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDdkIsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLE9BQU8sR0FBRyxJQUFJO3NCQUNmLFFBQXFCO3lCQUNyQixHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHOzBCQUNWLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzs2QkFDN0IsT0FBTyxDQUFDLHFCQUFxQixFQUFFLE1BQU0sQ0FBQzs2QkFDdEMsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUM7NkJBQzNCLE9BQU8sQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7NkJBQzVCLElBQUksQ0FBQyxVQUFVLENBQUM7MEJBQ2pCLEdBQUcsQ0FBQzt5QkFDUCxJQUFJLENBQUMsR0FBRyxDQUFDO3NCQUNWLGFBQWEsQ0FBQztnQkFDbEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRS9CLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxXQUFXO3FCQUM1QixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUN2QixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUM5QixDQUFDO2FBQ0g7WUFFRCxNQUFNLFdBQVcsR0FBRztnQkFDbEIsR0FBRyxFQUFFLElBQUk7Z0JBQ1QsU0FBUyxFQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTzthQUNyQyxDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2hELGtDQUFrQztZQUNsQyxJQUFJLGFBQWEsR0FBa0IsSUFBSSxDQUFDO1lBQ3hDLElBQUksTUFBTSxDQUFDO1lBRVgsS0FBSyxNQUFNLElBQUksSUFBSSxXQUFXLEVBQUU7Z0JBQzlCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQy9CLElBQUksYUFBYSxLQUFLLEdBQUcsRUFBRTtvQkFDekIsYUFBYSxHQUFHLEdBQUcsQ0FBQztvQkFDcEIsTUFBTSxHQUFHLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUNqRTtnQkFDRCxNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFFeEQsSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDWixTQUFTO2lCQUNWO2dCQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQzthQUNwQztZQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUVsQywrQkFBK0I7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7Z0JBQ25CLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQztnQkFDbEUsSUFBSSxDQUFDLFNBQVMsRUFBRTtvQkFDZCxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztpQkFDN0Q7Z0JBQ0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFFbEMscUVBQXFFO2dCQUNyRSw2RUFBNkU7Z0JBQzdFLHFEQUFxRDtnQkFDckQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUM5RSxJQUFJLE1BQU0sRUFBRTtvQkFDVixPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDN0I7YUFDRjtZQUVELElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxJQUFJLE1BQU0sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxFQUFFO2dCQUNsRCxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQzthQUNqRDtpQkFBTTtnQkFDTCxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO2FBQ2hCO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7QUFDSixDQUFDO0FBOUdELDRCQThHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge1xuICBDb25maWd1cmF0aW9uIGFzIENvbmZpZ3VyYXRpb25OUyxcbiAgTGludGVyIGFzIExpbnRlck5TLFxufSBmcm9tICd0c2xpbnQnOyAgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1pbXBsaWNpdC1kZXBlbmRlbmNpZXNcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnOyAgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1pbXBsaWNpdC1kZXBlbmRlbmNpZXNcbmltcG9ydCB7IFNjaGVtYXRpY0NvbnRleHQsIFRhc2tFeGVjdXRvciB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBUc2xpbnRGaXhUYXNrT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cblxudHlwZSBDb25maWd1cmF0aW9uVCA9IHR5cGVvZiBDb25maWd1cmF0aW9uTlM7XG50eXBlIExpbnRlclQgPSB0eXBlb2YgTGludGVyTlM7XG5cblxuZnVuY3Rpb24gX2xvYWRDb25maWd1cmF0aW9uKFxuICBDb25maWd1cmF0aW9uOiBDb25maWd1cmF0aW9uVCxcbiAgb3B0aW9uczogVHNsaW50Rml4VGFza09wdGlvbnMsXG4gIHJvb3Q6IHN0cmluZyxcbiAgZmlsZT86IHN0cmluZyxcbikge1xuICBpZiAob3B0aW9ucy50c2xpbnRDb25maWcpIHtcbiAgICByZXR1cm4gQ29uZmlndXJhdGlvbi5wYXJzZUNvbmZpZ0ZpbGUob3B0aW9ucy50c2xpbnRDb25maWcsIHJvb3QpO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMudHNsaW50UGF0aCkge1xuICAgIHJldHVybiBDb25maWd1cmF0aW9uLmZpbmRDb25maWd1cmF0aW9uKHBhdGguam9pbihyb290LCBvcHRpb25zLnRzbGludFBhdGgpKS5yZXN1bHRzO1xuICB9IGVsc2UgaWYgKGZpbGUpIHtcbiAgICByZXR1cm4gQ29uZmlndXJhdGlvbi5maW5kQ29uZmlndXJhdGlvbihudWxsLCBmaWxlKS5yZXN1bHRzO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignRXhlY3V0b3IgbXVzdCBzcGVjaWZ5IGEgdHNsaW50IGNvbmZpZ3VyYXRpb24uJyk7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBfZ2V0RmlsZUNvbnRlbnQoXG4gIGZpbGU6IHN0cmluZyxcbiAgb3B0aW9uczogVHNsaW50Rml4VGFza09wdGlvbnMsXG4gIHByb2dyYW0/OiB0cy5Qcm9ncmFtLFxuKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgLy8gVGhlIGxpbnRlciByZXRyaWV2ZXMgdGhlIFNvdXJjZUZpbGUgVFMgbm9kZSBkaXJlY3RseSBpZiBhIHByb2dyYW0gaXMgdXNlZFxuICBpZiAocHJvZ3JhbSkge1xuICAgIGNvbnN0IHNvdXJjZSA9IHByb2dyYW0uZ2V0U291cmNlRmlsZShmaWxlKTtcbiAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgY29uc3QgbWVzc2FnZVxuICAgICAgICA9IGBGaWxlICcke2ZpbGV9JyBpcyBub3QgcGFydCBvZiB0aGUgVHlwZVNjcmlwdCBwcm9qZWN0ICcke29wdGlvbnMudHNDb25maWdQYXRofScuYDtcbiAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc291cmNlLmdldEZ1bGxUZXh0KHNvdXJjZSk7XG4gIH1cblxuICAvLyBOT1RFOiBUaGUgdHNsaW50IENMSSBjaGVja3MgZm9yIGFuZCBleGNsdWRlcyBNUEVHIHRyYW5zcG9ydCBzdHJlYW1zOyB0aGlzIGRvZXMgbm90LlxuICB0cnkge1xuICAgIC8vIFN0cmlwIEJPTSBmcm9tIGZpbGUgZGF0YS5cbiAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNDM1NjcxM1xuICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMoZmlsZSwgJ3V0Zi04JykucmVwbGFjZSgvXlxcdUZFRkYvLCAnJyk7XG4gIH0gY2F0Y2gge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlYWQgZmlsZSAnJHtmaWxlfScuYCk7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBfbGlzdEFsbEZpbGVzKHJvb3Q6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgcmVzdWx0OiBzdHJpbmdbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIF9yZWN1cnNlKGxvY2F0aW9uOiBzdHJpbmcpIHtcbiAgICBjb25zdCBkaXIgPSBmcy5yZWFkZGlyU3luYyhwYXRoLmpvaW4ocm9vdCwgbG9jYXRpb24pKTtcblxuICAgIGRpci5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgY29uc3QgbG9jID0gcGF0aC5qb2luKGxvY2F0aW9uLCBuYW1lKTtcbiAgICAgIGlmIChmcy5zdGF0U3luYyhwYXRoLmpvaW4ocm9vdCwgbG9jKSkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICBfcmVjdXJzZShsb2MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0LnB1c2gobG9jKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBfcmVjdXJzZSgnJyk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBUYXNrRXhlY3V0b3I8VHNsaW50Rml4VGFza09wdGlvbnM+IHtcbiAgcmV0dXJuIChvcHRpb25zOiBUc2xpbnRGaXhUYXNrT3B0aW9ucywgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZShvYnMgPT4ge1xuICAgICAgY29uc3Qgcm9vdCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgICBjb25zdCB0c2xpbnQgPSByZXF1aXJlKHJlc29sdmUoJ3RzbGludCcsIHtcbiAgICAgICAgYmFzZWRpcjogcm9vdCxcbiAgICAgICAgY2hlY2tHbG9iYWw6IHRydWUsXG4gICAgICAgIGNoZWNrTG9jYWw6IHRydWUsXG4gICAgICB9KSk7XG4gICAgICBjb25zdCBpbmNsdWRlcyA9IChcbiAgICAgICAgQXJyYXkuaXNBcnJheShvcHRpb25zLmluY2x1ZGVzKVxuICAgICAgICAgID8gb3B0aW9ucy5pbmNsdWRlc1xuICAgICAgICAgIDogKG9wdGlvbnMuaW5jbHVkZXMgPyBbb3B0aW9ucy5pbmNsdWRlc10gOiBbXSlcbiAgICAgICk7XG4gICAgICBjb25zdCBmaWxlcyA9IChcbiAgICAgICAgQXJyYXkuaXNBcnJheShvcHRpb25zLmZpbGVzKVxuICAgICAgICAgID8gb3B0aW9ucy5maWxlc1xuICAgICAgICAgIDogKG9wdGlvbnMuZmlsZXMgPyBbb3B0aW9ucy5maWxlc10gOiBbXSlcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IExpbnRlciA9IHRzbGludC5MaW50ZXIgYXMgTGludGVyVDtcbiAgICAgIGNvbnN0IENvbmZpZ3VyYXRpb24gPSB0c2xpbnQuQ29uZmlndXJhdGlvbiBhcyBDb25maWd1cmF0aW9uVDtcbiAgICAgIGxldCBwcm9ncmFtOiB0cy5Qcm9ncmFtIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGZpbGVzVG9MaW50OiBzdHJpbmdbXSA9IGZpbGVzO1xuXG4gICAgICBpZiAob3B0aW9ucy50c0NvbmZpZ1BhdGggJiYgZmlsZXMubGVuZ3RoID09IDApIHtcbiAgICAgICAgY29uc3QgdHNDb25maWdQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIG9wdGlvbnMudHNDb25maWdQYXRoKTtcblxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmModHNDb25maWdQYXRoKSkge1xuICAgICAgICAgIG9icy5lcnJvcihuZXcgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIHRzY29uZmlnLicpKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBwcm9ncmFtID0gTGludGVyLmNyZWF0ZVByb2dyYW0odHNDb25maWdQYXRoKTtcbiAgICAgICAgZmlsZXNUb0xpbnQgPSBMaW50ZXIuZ2V0RmlsZU5hbWVzKHByb2dyYW0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoaW5jbHVkZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBhbGxGaWxlc1JlbCA9IF9saXN0QWxsRmlsZXMocm9vdCk7XG4gICAgICAgIGNvbnN0IHBhdHRlcm4gPSAnXignXG4gICAgICAgICAgKyAoaW5jbHVkZXMgYXMgc3RyaW5nW10pXG4gICAgICAgICAgICAubWFwKGV4ID0+ICcoJ1xuICAgICAgICAgICAgICArIGV4LnNwbGl0KC9bXFwvXFxcXF0vZykubWFwKGYgPT4gZlxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bXFwtXFxbXFxde30oKSs/Ll4kfF0vZywgJ1xcXFwkJicpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL15cXCpcXCovZywgJyguKz8pPycpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKi9nLCAnW14vXFxcXFxcXFxdKicpKVxuICAgICAgICAgICAgICAgIC5qb2luKCdbXFwvXFxcXFxcXFxdJylcbiAgICAgICAgICAgICAgKyAnKScpXG4gICAgICAgICAgICAuam9pbignfCcpXG4gICAgICAgICAgKyAnKSgkfC98XFxcXFxcXFwpJztcbiAgICAgICAgY29uc3QgcmUgPSBuZXcgUmVnRXhwKHBhdHRlcm4pO1xuXG4gICAgICAgIGZpbGVzVG9MaW50LnB1c2goLi4uYWxsRmlsZXNSZWxcbiAgICAgICAgICAuZmlsdGVyKHggPT4gcmUudGVzdCh4KSlcbiAgICAgICAgICAubWFwKHggPT4gcGF0aC5qb2luKHJvb3QsIHgpKSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGludE9wdGlvbnMgPSB7XG4gICAgICAgIGZpeDogdHJ1ZSxcbiAgICAgICAgZm9ybWF0dGVyOiBvcHRpb25zLmZvcm1hdCB8fCAncHJvc2UnLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgbGludGVyID0gbmV3IExpbnRlcihsaW50T3B0aW9ucywgcHJvZ3JhbSk7XG4gICAgICAvLyBJZiBkaXJlY3RvcnkgZG9lc24ndCBjaGFuZ2UsIHdlXG4gICAgICBsZXQgbGFzdERpcmVjdG9yeTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICBsZXQgY29uZmlnO1xuXG4gICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXNUb0xpbnQpIHtcbiAgICAgICAgY29uc3QgZGlyID0gcGF0aC5kaXJuYW1lKGZpbGUpO1xuICAgICAgICBpZiAobGFzdERpcmVjdG9yeSAhPT0gZGlyKSB7XG4gICAgICAgICAgbGFzdERpcmVjdG9yeSA9IGRpcjtcbiAgICAgICAgICBjb25maWcgPSBfbG9hZENvbmZpZ3VyYXRpb24oQ29uZmlndXJhdGlvbiwgb3B0aW9ucywgcm9vdCwgZmlsZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udGVudCA9IF9nZXRGaWxlQ29udGVudChmaWxlLCBvcHRpb25zLCBwcm9ncmFtKTtcblxuICAgICAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpbnRlci5saW50KGZpbGUsIGNvbnRlbnQsIGNvbmZpZyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGxpbnRlci5nZXRSZXN1bHQoKTtcblxuICAgICAgLy8gRm9ybWF0IGFuZCBzaG93IHRoZSByZXN1bHRzLlxuICAgICAgaWYgKCFvcHRpb25zLnNpbGVudCkge1xuICAgICAgICBjb25zdCBGb3JtYXR0ZXIgPSB0c2xpbnQuZmluZEZvcm1hdHRlcihvcHRpb25zLmZvcm1hdCB8fCAncHJvc2UnKTtcbiAgICAgICAgaWYgKCFGb3JtYXR0ZXIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbGludCBmb3JtYXQgXCIke29wdGlvbnMuZm9ybWF0fVwiLmApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlciA9IG5ldyBGb3JtYXR0ZXIoKTtcblxuICAgICAgICAvLyBDZXJ0YWluIHRzbGludCBmb3JtYXR0ZXJzIG91dHB1dHMgJ1xcbicgd2hlbiB0aGVyZSBhcmUgbm8gZmFpbHVyZXMuXG4gICAgICAgIC8vIFRoaXMgd2lsbCBibG9hdCB0aGUgY29uc29sZSB3aGVuIGhhdmluZyBzY2hlbWF0aWNzIHJ1bm5pbmcgcmVmYWN0b3IgdGFza3MuXG4gICAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGFsYW50aXIvdHNsaW50L2lzc3Vlcy80MjQ0XG4gICAgICAgIGNvbnN0IG91dHB1dCA9IChmb3JtYXR0ZXIuZm9ybWF0KHJlc3VsdC5mYWlsdXJlcywgcmVzdWx0LmZpeGVzKSB8fCAnJykudHJpbSgpO1xuICAgICAgICBpZiAob3V0cHV0KSB7XG4gICAgICAgICAgY29udGV4dC5sb2dnZXIuaW5mbyhvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghb3B0aW9ucy5pZ25vcmVFcnJvcnMgJiYgcmVzdWx0LmVycm9yQ291bnQgPiAwKSB7XG4gICAgICAgIG9icy5lcnJvcihuZXcgRXJyb3IoJ0xpbnQgZXJyb3JzIHdlcmUgZm91bmQuJykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2JzLm5leHQoKTtcbiAgICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59XG4iXX0=