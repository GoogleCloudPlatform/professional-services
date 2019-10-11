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
const tasks_1 = require("@angular-devkit/schematics/tasks");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const semver = require("semver");
const npm_1 = require("./npm");
// Angular guarantees that a major is compatible with its following major (so packages that depend
// on Angular 5 are also compatible with Angular 6). This is, in code, represented by verifying
// that all other packages that have a peer dependency of `"@angular/core": "^5.0.0"` actually
// supports 6.0, by adding that compatibility to the range, so it is `^5.0.0 || ^6.0.0`.
// We export it to allow for testing.
function angularMajorCompatGuarantee(range) {
    range = semver.validRange(range);
    let major = 1;
    while (!semver.gtr(major + '.0.0', range)) {
        major++;
        if (major >= 99) {
            // Use original range if it supports a major this high
            // Range is most likely unbounded (e.g., >=5.0.0)
            return range;
        }
    }
    // Add the major version as compatible with the angular compatible, with all minors. This is
    // already one major above the greatest supported, because we increment `major` before checking.
    // We add minors like this because a minor beta is still compatible with a minor non-beta.
    let newRange = range;
    for (let minor = 0; minor < 20; minor++) {
        newRange += ` || ^${major}.${minor}.0-alpha.0 `;
    }
    return semver.validRange(newRange) || range;
}
exports.angularMajorCompatGuarantee = angularMajorCompatGuarantee;
// This is a map of packageGroupName to range extending function. If it isn't found, the range is
// kept the same.
const peerCompatibleWhitelist = {
    '@angular/core': angularMajorCompatGuarantee,
};
function _updatePeerVersion(infoMap, name, range) {
    // Resolve packageGroupName.
    const maybePackageInfo = infoMap.get(name);
    if (!maybePackageInfo) {
        return range;
    }
    if (maybePackageInfo.target) {
        name = maybePackageInfo.target.updateMetadata.packageGroup[0] || name;
    }
    else {
        name = maybePackageInfo.installed.updateMetadata.packageGroup[0] || name;
    }
    const maybeTransform = peerCompatibleWhitelist[name];
    if (maybeTransform) {
        if (typeof maybeTransform == 'function') {
            return maybeTransform(range);
        }
        else {
            return maybeTransform;
        }
    }
    return range;
}
function _validateForwardPeerDependencies(name, infoMap, peers, logger) {
    for (const [peer, range] of Object.entries(peers)) {
        logger.debug(`Checking forward peer ${peer}...`);
        const maybePeerInfo = infoMap.get(peer);
        if (!maybePeerInfo) {
            logger.error([
                `Package ${JSON.stringify(name)} has a missing peer dependency of`,
                `${JSON.stringify(peer)} @ ${JSON.stringify(range)}.`,
            ].join(' '));
            return true;
        }
        const peerVersion = maybePeerInfo.target && maybePeerInfo.target.packageJson.version
            ? maybePeerInfo.target.packageJson.version
            : maybePeerInfo.installed.version;
        logger.debug(`  Range intersects(${range}, ${peerVersion})...`);
        if (!semver.satisfies(peerVersion, range)) {
            logger.error([
                `Package ${JSON.stringify(name)} has an incompatible peer dependency to`,
                `${JSON.stringify(peer)} (requires ${JSON.stringify(range)},`,
                `would install ${JSON.stringify(peerVersion)})`,
            ].join(' '));
            return true;
        }
    }
    return false;
}
function _validateReversePeerDependencies(name, version, infoMap, logger) {
    for (const [installed, installedInfo] of infoMap.entries()) {
        const installedLogger = logger.createChild(installed);
        installedLogger.debug(`${installed}...`);
        const peers = (installedInfo.target || installedInfo.installed).packageJson.peerDependencies;
        for (const [peer, range] of Object.entries(peers || {})) {
            if (peer != name) {
                // Only check peers to the packages we're updating. We don't care about peers
                // that are unmet but we have no effect on.
                continue;
            }
            // Override the peer version range if it's whitelisted.
            const extendedRange = _updatePeerVersion(infoMap, peer, range);
            if (!semver.satisfies(version, extendedRange)) {
                logger.error([
                    `Package ${JSON.stringify(installed)} has an incompatible peer dependency to`,
                    `${JSON.stringify(name)} (requires`,
                    `${JSON.stringify(range)}${extendedRange == range ? '' : ' (extended)'},`,
                    `would install ${JSON.stringify(version)}).`,
                ].join(' '));
                return true;
            }
        }
    }
    return false;
}
function _validateUpdatePackages(infoMap, force, logger) {
    logger.debug('Updating the following packages:');
    infoMap.forEach(info => {
        if (info.target) {
            logger.debug(`  ${info.name} => ${info.target.version}`);
        }
    });
    let peerErrors = false;
    infoMap.forEach(info => {
        const { name, target } = info;
        if (!target) {
            return;
        }
        const pkgLogger = logger.createChild(name);
        logger.debug(`${name}...`);
        const peers = target.packageJson.peerDependencies || {};
        peerErrors = _validateForwardPeerDependencies(name, infoMap, peers, pkgLogger) || peerErrors;
        peerErrors
            = _validateReversePeerDependencies(name, target.version, infoMap, pkgLogger)
                || peerErrors;
    });
    if (!force && peerErrors) {
        throw new schematics_1.SchematicsException(`Incompatible peer dependencies found. See above.`);
    }
}
function _performUpdate(tree, context, infoMap, logger, migrateOnly) {
    const packageJsonContent = tree.read('/package.json');
    if (!packageJsonContent) {
        throw new schematics_1.SchematicsException('Could not find a package.json. Are you in a Node project?');
    }
    let packageJson;
    try {
        packageJson = JSON.parse(packageJsonContent.toString());
    }
    catch (e) {
        throw new schematics_1.SchematicsException('package.json could not be parsed: ' + e.message);
    }
    const updateDependency = (deps, name, newVersion) => {
        const oldVersion = deps[name];
        // We only respect caret and tilde ranges on update.
        const execResult = /^[\^~]/.exec(oldVersion);
        deps[name] = `${execResult ? execResult[0] : ''}${newVersion}`;
    };
    const toInstall = [...infoMap.values()]
        .map(x => [x.name, x.target, x.installed])
        // tslint:disable-next-line:no-non-null-assertion
        .filter(([name, target, installed]) => {
        return !!name && !!target && !!installed;
    });
    toInstall.forEach(([name, target, installed]) => {
        logger.info(`Updating package.json with dependency ${name} `
            + `@ ${JSON.stringify(target.version)} (was ${JSON.stringify(installed.version)})...`);
        if (packageJson.dependencies && packageJson.dependencies[name]) {
            updateDependency(packageJson.dependencies, name, target.version);
            if (packageJson.devDependencies && packageJson.devDependencies[name]) {
                delete packageJson.devDependencies[name];
            }
            if (packageJson.peerDependencies && packageJson.peerDependencies[name]) {
                delete packageJson.peerDependencies[name];
            }
        }
        else if (packageJson.devDependencies && packageJson.devDependencies[name]) {
            updateDependency(packageJson.devDependencies, name, target.version);
            if (packageJson.peerDependencies && packageJson.peerDependencies[name]) {
                delete packageJson.peerDependencies[name];
            }
        }
        else if (packageJson.peerDependencies && packageJson.peerDependencies[name]) {
            updateDependency(packageJson.peerDependencies, name, target.version);
        }
        else {
            logger.warn(`Package ${name} was not found in dependencies.`);
        }
    });
    const newContent = JSON.stringify(packageJson, null, 2);
    if (packageJsonContent.toString() != newContent || migrateOnly) {
        let installTask = [];
        if (!migrateOnly) {
            // If something changed, also hook up the task.
            tree.overwrite('/package.json', JSON.stringify(packageJson, null, 2));
            installTask = [context.addTask(new tasks_1.NodePackageInstallTask())];
        }
        // Run the migrate schematics with the list of packages to use. The collection contains
        // version information and we need to do this post installation. Please note that the
        // migration COULD fail and leave side effects on disk.
        // Run the schematics task of those packages.
        toInstall.forEach(([name, target, installed]) => {
            if (!target.updateMetadata.migrations) {
                return;
            }
            const collection = (target.updateMetadata.migrations.match(/^[./]/)
                ? name + '/'
                : '') + target.updateMetadata.migrations;
            context.addTask(new tasks_1.RunSchematicTask('@schematics/update', 'migrate', {
                package: name,
                collection,
                from: installed.version,
                to: target.version,
            }), installTask);
        });
    }
    return rxjs_1.of(undefined);
}
function _migrateOnly(info, context, from, to) {
    if (!info) {
        return rxjs_1.of();
    }
    const target = info.installed;
    if (!target || !target.updateMetadata.migrations) {
        return rxjs_1.of(undefined);
    }
    const collection = (target.updateMetadata.migrations.match(/^[./]/)
        ? info.name + '/'
        : '') + target.updateMetadata.migrations;
    context.addTask(new tasks_1.RunSchematicTask('@schematics/update', 'migrate', {
        package: info.name,
        collection,
        from: from,
        to: to || target.version,
    }));
    return rxjs_1.of(undefined);
}
function _getUpdateMetadata(packageJson, logger) {
    const metadata = packageJson['ng-update'];
    const result = {
        packageGroup: [],
        requirements: {},
    };
    if (!metadata || typeof metadata != 'object' || Array.isArray(metadata)) {
        return result;
    }
    if (metadata['packageGroup']) {
        const packageGroup = metadata['packageGroup'];
        // Verify that packageGroup is an array of strings. This is not an error but we still warn
        // the user and ignore the packageGroup keys.
        if (!Array.isArray(packageGroup) || packageGroup.some(x => typeof x != 'string')) {
            logger.warn(`packageGroup metadata of package ${packageJson.name} is malformed. Ignoring.`);
        }
        else {
            result.packageGroup = packageGroup;
        }
    }
    if (metadata['requirements']) {
        const requirements = metadata['requirements'];
        // Verify that requirements are
        if (typeof requirements != 'object'
            || Array.isArray(requirements)
            || Object.keys(requirements).some(name => typeof requirements[name] != 'string')) {
            logger.warn(`requirements metadata of package ${packageJson.name} is malformed. Ignoring.`);
        }
        else {
            result.requirements = requirements;
        }
    }
    if (metadata['migrations']) {
        const migrations = metadata['migrations'];
        if (typeof migrations != 'string') {
            logger.warn(`migrations metadata of package ${packageJson.name} is malformed. Ignoring.`);
        }
        else {
            result.migrations = migrations;
        }
    }
    return result;
}
function _usageMessage(options, infoMap, logger) {
    const packageGroups = new Map();
    const packagesToUpdate = [...infoMap.entries()]
        .map(([name, info]) => {
        const tag = options.next
            ? (info.npmPackageJson['dist-tags']['next'] ? 'next' : 'latest') : 'latest';
        const version = info.npmPackageJson['dist-tags'][tag];
        const target = info.npmPackageJson.versions[version];
        return {
            name,
            info,
            version,
            tag,
            target,
        };
    })
        .filter(({ name, info, version, target }) => {
        return (target && semver.compare(info.installed.version, version) < 0);
    })
        .filter(({ target }) => {
        return target['ng-update'];
    })
        .map(({ name, info, version, tag, target }) => {
        // Look for packageGroup.
        if (target['ng-update'] && target['ng-update']['packageGroup']) {
            const packageGroup = target['ng-update']['packageGroup'];
            const packageGroupName = target['ng-update']['packageGroupName']
                || target['ng-update']['packageGroup'][0];
            if (packageGroupName) {
                if (packageGroups.has(name)) {
                    return null;
                }
                packageGroup.forEach((x) => packageGroups.set(x, packageGroupName));
                packageGroups.set(packageGroupName, packageGroupName);
                name = packageGroupName;
            }
        }
        let command = `ng update ${name}`;
        if (tag == 'next') {
            command += ' --next';
        }
        return [name, `${info.installed.version} -> ${version}`, command];
    })
        .filter(x => x !== null)
        .sort((a, b) => a && b ? a[0].localeCompare(b[0]) : 0);
    if (packagesToUpdate.length == 0) {
        logger.info('We analyzed your package.json and everything seems to be in order. Good work!');
        return rxjs_1.of(undefined);
    }
    logger.info('We analyzed your package.json, there are some packages to update:\n');
    // Find the largest name to know the padding needed.
    let namePad = Math.max(...[...infoMap.keys()].map(x => x.length)) + 2;
    if (!Number.isFinite(namePad)) {
        namePad = 30;
    }
    const pads = [namePad, 25, 0];
    logger.info('  '
        + ['Name', 'Version', 'Command to update'].map((x, i) => x.padEnd(pads[i])).join(''));
    logger.info(' ' + '-'.repeat(pads.reduce((s, x) => s += x, 0) + 20));
    packagesToUpdate.forEach(fields => {
        if (!fields) {
            return;
        }
        logger.info('  ' + fields.map((x, i) => x.padEnd(pads[i])).join(''));
    });
    logger.info('\n');
    logger.info('There might be additional packages that are outdated.');
    logger.info('Run "ng update --all" to try to update all at the same time.\n');
    return rxjs_1.of(undefined);
}
function _buildPackageInfo(tree, packages, allDependencies, npmPackageJson, logger) {
    const name = npmPackageJson.name;
    const packageJsonRange = allDependencies.get(name);
    if (!packageJsonRange) {
        throw new schematics_1.SchematicsException(`Package ${JSON.stringify(name)} was not found in package.json.`);
    }
    // Find out the currently installed version. Either from the package.json or the node_modules/
    // TODO: figure out a way to read package-lock.json and/or yarn.lock.
    let installedVersion;
    const packageContent = tree.read(`/node_modules/${name}/package.json`);
    if (packageContent) {
        const content = JSON.parse(packageContent.toString());
        installedVersion = content.version;
    }
    if (!installedVersion) {
        // Find the version from NPM that fits the range to max.
        installedVersion = semver.maxSatisfying(Object.keys(npmPackageJson.versions), packageJsonRange);
    }
    const installedPackageJson = npmPackageJson.versions[installedVersion] || packageContent;
    if (!installedPackageJson) {
        throw new schematics_1.SchematicsException(`An unexpected error happened; package ${name} has no version ${installedVersion}.`);
    }
    let targetVersion = packages.get(name);
    if (targetVersion) {
        if (npmPackageJson['dist-tags'][targetVersion]) {
            targetVersion = npmPackageJson['dist-tags'][targetVersion];
        }
        else if (targetVersion == 'next') {
            targetVersion = npmPackageJson['dist-tags']['latest'];
        }
        else {
            targetVersion = semver.maxSatisfying(Object.keys(npmPackageJson.versions), targetVersion);
        }
    }
    if (targetVersion && semver.lte(targetVersion, installedVersion)) {
        logger.debug(`Package ${name} already satisfied by package.json (${packageJsonRange}).`);
        targetVersion = undefined;
    }
    const target = targetVersion
        ? {
            version: targetVersion,
            packageJson: npmPackageJson.versions[targetVersion],
            updateMetadata: _getUpdateMetadata(npmPackageJson.versions[targetVersion], logger),
        }
        : undefined;
    // Check if there's an installed version.
    return {
        name,
        npmPackageJson,
        installed: {
            version: installedVersion,
            packageJson: installedPackageJson,
            updateMetadata: _getUpdateMetadata(installedPackageJson, logger),
        },
        target,
        packageJsonRange,
    };
}
function _buildPackageList(options, projectDeps, logger) {
    // Parse the packages options to set the targeted version.
    const packages = new Map();
    const commandLinePackages = (options.packages && options.packages.length > 0)
        ? options.packages
        : (options.all ? projectDeps.keys() : []);
    for (const pkg of commandLinePackages) {
        // Split the version asked on command line.
        const m = pkg.match(/^((?:@[^/]{1,100}\/)?[^@]{1,100})(?:@(.{1,100}))?$/);
        if (!m) {
            logger.warn(`Invalid package argument: ${JSON.stringify(pkg)}. Skipping.`);
            continue;
        }
        const [, npmName, maybeVersion] = m;
        const version = projectDeps.get(npmName);
        if (!version) {
            logger.warn(`Package not installed: ${JSON.stringify(npmName)}. Skipping.`);
            continue;
        }
        // Verify that people have an actual version in the package.json, otherwise (label or URL or
        // gist or ...) we don't update it.
        if (version.startsWith('http:') // HTTP
            || version.startsWith('file:') // Local folder
            || version.startsWith('git:') // GIT url
            || version.match(/^\w{1,100}\/\w{1,100}/) // GitHub's "user/repo"
            || version.match(/^(?:\.{0,2}\/)\w{1,100}/) // Local folder, maybe relative.
        ) {
            // We only do that for --all. Otherwise we have the installed version and the user specified
            // it on the command line.
            if (options.all) {
                logger.warn(`Package ${JSON.stringify(npmName)} has a custom version: `
                    + `${JSON.stringify(version)}. Skipping.`);
                continue;
            }
        }
        packages.set(npmName, (maybeVersion || (options.next ? 'next' : 'latest')));
    }
    return packages;
}
function _addPackageGroup(tree, packages, allDependencies, npmPackageJson, logger) {
    const maybePackage = packages.get(npmPackageJson.name);
    if (!maybePackage) {
        return;
    }
    const info = _buildPackageInfo(tree, packages, allDependencies, npmPackageJson, logger);
    const version = (info.target && info.target.version)
        || npmPackageJson['dist-tags'][maybePackage]
        || maybePackage;
    if (!npmPackageJson.versions[version]) {
        return;
    }
    const ngUpdateMetadata = npmPackageJson.versions[version]['ng-update'];
    if (!ngUpdateMetadata) {
        return;
    }
    const packageGroup = ngUpdateMetadata['packageGroup'];
    if (!packageGroup) {
        return;
    }
    if (!Array.isArray(packageGroup) || packageGroup.some(x => typeof x != 'string')) {
        logger.warn(`packageGroup metadata of package ${npmPackageJson.name} is malformed.`);
        return;
    }
    packageGroup
        .filter(name => !packages.has(name)) // Don't override names from the command line.
        .filter(name => allDependencies.has(name)) // Remove packages that aren't installed.
        .forEach(name => {
        packages.set(name, maybePackage);
    });
}
/**
 * Add peer dependencies of packages on the command line to the list of packages to update.
 * We don't do verification of the versions here as this will be done by a later step (and can
 * be ignored by the --force flag).
 * @private
 */
function _addPeerDependencies(tree, packages, allDependencies, npmPackageJson, logger) {
    const maybePackage = packages.get(npmPackageJson.name);
    if (!maybePackage) {
        return;
    }
    const info = _buildPackageInfo(tree, packages, allDependencies, npmPackageJson, logger);
    const version = (info.target && info.target.version)
        || npmPackageJson['dist-tags'][maybePackage]
        || maybePackage;
    if (!npmPackageJson.versions[version]) {
        return;
    }
    const packageJson = npmPackageJson.versions[version];
    const error = false;
    for (const [peer, range] of Object.entries(packageJson.peerDependencies || {})) {
        if (!packages.has(peer)) {
            packages.set(peer, range);
        }
    }
    if (error) {
        throw new schematics_1.SchematicsException('An error occured, see above.');
    }
}
function _getAllDependencies(tree) {
    const packageJsonContent = tree.read('/package.json');
    if (!packageJsonContent) {
        throw new schematics_1.SchematicsException('Could not find a package.json. Are you in a Node project?');
    }
    let packageJson;
    try {
        packageJson = JSON.parse(packageJsonContent.toString());
    }
    catch (e) {
        throw new schematics_1.SchematicsException('package.json could not be parsed: ' + e.message);
    }
    return new Map([
        ...Object.entries(packageJson.peerDependencies || {}),
        ...Object.entries(packageJson.devDependencies || {}),
        ...Object.entries(packageJson.dependencies || {}),
    ]);
}
function _formatVersion(version) {
    if (version === undefined) {
        return undefined;
    }
    if (!version.match(/^\d{1,30}\.\d{1,30}\.\d{1,30}/)) {
        version += '.0';
    }
    if (!version.match(/^\d{1,30}\.\d{1,30}\.\d{1,30}/)) {
        version += '.0';
    }
    if (!semver.valid(version)) {
        throw new schematics_1.SchematicsException(`Invalid migration version: ${JSON.stringify(version)}`);
    }
    return version;
}
function default_1(options) {
    if (!options.packages) {
        // We cannot just return this because we need to fetch the packages from NPM still for the
        // help/guide to show.
        options.packages = [];
    }
    else {
        // We split every packages by commas to allow people to pass in multiple and make it an array.
        options.packages = options.packages.reduce((acc, curr) => {
            return acc.concat(curr.split(','));
        }, []);
    }
    if (options.migrateOnly && options.from) {
        if (options.packages.length !== 1) {
            throw new schematics_1.SchematicsException('--from requires that only a single package be passed.');
        }
    }
    options.from = _formatVersion(options.from);
    options.to = _formatVersion(options.to);
    return (tree, context) => {
        const logger = context.logger;
        const allDependencies = _getAllDependencies(tree);
        const packages = _buildPackageList(options, allDependencies, logger);
        return rxjs_1.from([...allDependencies.keys()]).pipe(
        // Grab all package.json from the npm repository. This requires a lot of HTTP calls so we
        // try to parallelize as many as possible.
        operators_1.mergeMap(depName => npm_1.getNpmPackageJson(depName, options.registry, logger)), 
        // Build a map of all dependencies and their packageJson.
        operators_1.reduce((acc, npmPackageJson) => {
            // If the package was not found on the registry. It could be private, so we will just
            // ignore. If the package was part of the list, we will error out, but will simply ignore
            // if it's either not requested (so just part of package.json. silently) or if it's a
            // `--all` situation. There is an edge case here where a public package peer depends on a
            // private one, but it's rare enough.
            if (!npmPackageJson.name) {
                if (packages.has(npmPackageJson.requestedName)) {
                    if (options.all) {
                        logger.warn(`Package ${JSON.stringify(npmPackageJson.requestedName)} was not `
                            + 'found on the registry. Skipping.');
                    }
                    else {
                        throw new schematics_1.SchematicsException(`Package ${JSON.stringify(npmPackageJson.requestedName)} was not found on the `
                            + 'registry. Cannot continue as this may be an error.');
                    }
                }
            }
            else {
                acc.set(npmPackageJson.name, npmPackageJson);
            }
            return acc;
        }, new Map()), operators_1.map(npmPackageJsonMap => {
            // Augment the command line package list with packageGroups and forward peer dependencies.
            // Each added package may uncover new package groups and peer dependencies, so we must
            // repeat this process until the package list stabilizes.
            let lastPackagesSize;
            do {
                lastPackagesSize = packages.size;
                npmPackageJsonMap.forEach((npmPackageJson) => {
                    _addPackageGroup(tree, packages, allDependencies, npmPackageJson, logger);
                    _addPeerDependencies(tree, packages, allDependencies, npmPackageJson, logger);
                });
            } while (packages.size > lastPackagesSize);
            // Build the PackageInfo for each module.
            const packageInfoMap = new Map();
            npmPackageJsonMap.forEach((npmPackageJson) => {
                packageInfoMap.set(npmPackageJson.name, _buildPackageInfo(tree, packages, allDependencies, npmPackageJson, logger));
            });
            return packageInfoMap;
        }), operators_1.switchMap(infoMap => {
            // Now that we have all the information, check the flags.
            if (packages.size > 0) {
                if (options.migrateOnly && options.from && options.packages) {
                    return _migrateOnly(infoMap.get(options.packages[0]), context, options.from, options.to);
                }
                const sublog = new core_1.logging.LevelCapLogger('validation', logger.createChild(''), 'warn');
                _validateUpdatePackages(infoMap, !!options.force, sublog);
                return _performUpdate(tree, context, infoMap, logger, !!options.migrateOnly);
            }
            else {
                return _usageMessage(options, infoMap, logger);
            }
        }), operators_1.switchMap(() => rxjs_1.of(tree)));
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL3NjaGVtYXRpY3MvdXBkYXRlL3VwZGF0ZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUErQztBQUMvQywyREFNb0M7QUFDcEMsNERBQTRGO0FBQzVGLCtCQUE4RDtBQUM5RCw4Q0FBa0U7QUFDbEUsaUNBQWlDO0FBQ2pDLCtCQUEwQztBQVMxQyxrR0FBa0c7QUFDbEcsK0ZBQStGO0FBQy9GLDhGQUE4RjtBQUM5Rix3RkFBd0Y7QUFDeEYscUNBQXFDO0FBQ3JDLFNBQWdCLDJCQUEyQixDQUFDLEtBQWE7SUFDdkQsS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRTtRQUN6QyxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksS0FBSyxJQUFJLEVBQUUsRUFBRTtZQUNmLHNEQUFzRDtZQUN0RCxpREFBaUQ7WUFDakQsT0FBTyxLQUFLLENBQUM7U0FDZDtLQUNGO0lBRUQsNEZBQTRGO0lBQzVGLGdHQUFnRztJQUNoRywwRkFBMEY7SUFDMUYsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUU7UUFDdkMsUUFBUSxJQUFJLFFBQVEsS0FBSyxJQUFJLEtBQUssYUFBYSxDQUFDO0tBQ2pEO0lBRUQsT0FBTyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUM5QyxDQUFDO0FBckJELGtFQXFCQztBQUdELGlHQUFpRztBQUNqRyxpQkFBaUI7QUFDakIsTUFBTSx1QkFB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QUFPLGNBQWMsQ0FBQztRQUN4QixDQUFDLENBQUMsRUFFRixxQkFBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ2xCLHlEQUF5RDtZQUN6RCxJQUFJLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFO2dCQUNyQixJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksT0FBTyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO29CQUMzRCxPQUFPLFlBQVksQ0FDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ2hDLE9BQU8sRUFDUCxPQUFPLENBQUMsSUFBSSxFQUNaLE9BQU8sQ0FBQyxFQUFFLENBQ1gsQ0FBQztpQkFDSDtnQkFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLGNBQU8sQ0FBQyxjQUFjLENBQ3ZDLFlBQVksRUFDWixNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxFQUN0QixNQUFNLENBQ1AsQ0FBQztnQkFDRix1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRTFELE9BQU8sY0FBYyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQzlFO2lCQUFNO2dCQUNMLE9BQU8sYUFBYSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDaEQ7UUFDSCxDQUFDLENBQUMsRUFFRixxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUMxQixDQUFDO0lBQ0osQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWhIRCw0QkFnSEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBsb2dnaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljQ29udGV4dCxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVGFza0lkLFxuICBUcmVlLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBOb2RlUGFja2FnZUluc3RhbGxUYXNrLCBSdW5TY2hlbWF0aWNUYXNrIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbSBhcyBvYnNlcnZhYmxlRnJvbSwgb2YgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IG1hcCwgbWVyZ2VNYXAsIHJlZHVjZSwgc3dpdGNoTWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBnZXROcG1QYWNrYWdlSnNvbiB9IGZyb20gJy4vbnBtJztcbmltcG9ydCB7IE5wbVJlcG9zaXRvcnlQYWNrYWdlSnNvbiB9IGZyb20gJy4vbnBtLXBhY2thZ2UtanNvbic7XG5pbXBvcnQgeyBEZXBlbmRlbmN5LCBKc29uU2NoZW1hRm9yTnBtUGFja2FnZUpzb25GaWxlcyB9IGZyb20gJy4vcGFja2FnZS1qc29uJztcbmltcG9ydCB7IFNjaGVtYSBhcyBVcGRhdGVTY2hlbWEgfSBmcm9tICcuL3NjaGVtYSc7XG5cbnR5cGUgVmVyc2lvblJhbmdlID0gc3RyaW5nICYgeyBfX1ZFUlNJT05fUkFOR0U6IHZvaWQ7IH07XG50eXBlIFBlZXJWZXJzaW9uVHJhbnNmb3JtID0gc3RyaW5nIHwgKChyYW5nZTogc3RyaW5nKSA9PiBzdHJpbmcpO1xuXG5cbi8vIEFuZ3VsYXIgZ3VhcmFudGVlcyB0aGF0IGEgbWFqb3IgaXMgY29tcGF0aWJsZSB3aXRoIGl0cyBmb2xsb3dpbmcgbWFqb3IgKHNvIHBhY2thZ2VzIHRoYXQgZGVwZW5kXG4vLyBvbiBBbmd1bGFyIDUgYXJlIGFsc28gY29tcGF0aWJsZSB3aXRoIEFuZ3VsYXIgNikuIFRoaXMgaXMsIGluIGNvZGUsIHJlcHJlc2VudGVkIGJ5IHZlcmlmeWluZ1xuLy8gdGhhdCBhbGwgb3RoZXIgcGFja2FnZXMgdGhhdCBoYXZlIGEgcGVlciBkZXBlbmRlbmN5IG9mIGBcIkBhbmd1bGFyL2NvcmVcIjogXCJeNS4wLjBcImAgYWN0dWFsbHlcbi8vIHN1cHBvcnRzIDYuMCwgYnkgYWRkaW5nIHRoYXQgY29tcGF0aWJpbGl0eSB0byB0aGUgcmFuZ2UsIHNvIGl0IGlzIGBeNS4wLjAgfHwgXjYuMC4wYC5cbi8vIFdlIGV4cG9ydCBpdCB0byBhbGxvdyBmb3IgdGVzdGluZy5cbmV4cG9ydCBmdW5jdGlvbiBhbmd1bGFyTWFqb3JDb21wYXRHdWFyYW50ZWUocmFuZ2U6IHN0cmluZykge1xuICByYW5nZSA9IHNlbXZlci52YWxpZFJhbmdlKHJhbmdlKTtcbiAgbGV0IG1ham9yID0gMTtcbiAgd2hpbGUgKCFzZW12ZXIuZ3RyKG1ham9yICsgJy4wLjAnLCByYW5nZSkpIHtcbiAgICBtYWpvcisrO1xuICAgIGlmIChtYWpvciA+PSA5OSkge1xuICAgICAgLy8gVXNlIG9yaWdpbmFsIHJhbmdlIGlmIGl0IHN1cHBvcnRzIGEgbWFqb3IgdGhpcyBoaWdoXG4gICAgICAvLyBSYW5nZSBpcyBtb3N0IGxpa2VseSB1bmJvdW5kZWQgKGUuZy4sID49NS4wLjApXG4gICAgICByZXR1cm4gcmFuZ2U7XG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIHRoZSBtYWpvciB2ZXJzaW9uIGFzIGNvbXBhdGlibGUgd2l0aCB0aGUgYW5ndWxhciBjb21wYXRpYmxlLCB3aXRoIGFsbCBtaW5vcnMuIFRoaXMgaXNcbiAgLy8gYWxyZWFkeSBvbmUgbWFqb3IgYWJvdmUgdGhlIGdyZWF0ZXN0IHN1cHBvcnRlZCwgYmVjYXVzZSB3ZSBpbmNyZW1lbnQgYG1ham9yYCBiZWZvcmUgY2hlY2tpbmcuXG4gIC8vIFdlIGFkZCBtaW5vcnMgbGlrZSB0aGlzIGJlY2F1c2UgYSBtaW5vciBiZXRhIGlzIHN0aWxsIGNvbXBhdGlibGUgd2l0aCBhIG1pbm9yIG5vbi1iZXRhLlxuICBsZXQgbmV3UmFuZ2UgPSByYW5nZTtcbiAgZm9yIChsZXQgbWlub3IgPSAwOyBtaW5vciA8IDIwOyBtaW5vcisrKSB7XG4gICAgbmV3UmFuZ2UgKz0gYCB8fCBeJHttYWpvcn0uJHttaW5vcn0uMC1hbHBoYS4wIGA7XG4gIH1cblxuICByZXR1cm4gc2VtdmVyLnZhbGlkUmFuZ2UobmV3UmFuZ2UpIHx8IHJhbmdlO1xufVxuXG5cbi8vIFRoaXMgaXMgYSBtYXAgb2YgcGFja2FnZUdyb3VwTmFtZSB0byByYW5nZSBleHRlbmRpbmcgZnVuY3Rpb24uIElmIGl0IGlzbid0IGZvdW5kLCB0aGUgcmFuZ2UgaXNcbi8vIGtlcHQgdGhlIHNhbWUuXG5jb25zdCBwZWVyQ29tcGF0aWJsZVdoaXRlbGlzdDogeyBbbmFtZTogc3RyaW5nXTogUGVlclZlcnNpb25UcmFuc2Zvcm0gfSA9IHtcbiAgJ0Bhbmd1bGFyL2NvcmUnOiBhbmd1bGFyTWFqb3JDb21wYXRHdWFyYW50ZWUsXG59O1xuXG5pbnRlcmZhY2UgUGFja2FnZVZlcnNpb25JbmZvIHtcbiAgdmVyc2lvbjogVmVyc2lvblJhbmdlO1xuICBwYWNrYWdlSnNvbjogSnNvblNjaGVtYUZvck5wbVBhY2thZ2VKc29uRmlsZXM7XG4gIHVwZGF0ZU1ldGFkYXRhOiBVcGRhdGVNZXRhZGF0YTtcbn1cblxuaW50ZXJmYWNlIFBhY2thZ2VJbmZvIHtcbiAgbmFtZTogc3RyaW5nO1xuICBucG1QYWNrYWdlSnNvbjogTnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uO1xuICBpbnN0YWxsZWQ6IFBhY2thZ2VWZXJzaW9uSW5mbztcbiAgdGFyZ2V0PzogUGFja2FnZVZlcnNpb25JbmZvO1xuICBwYWNrYWdlSnNvblJhbmdlOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBVcGRhdGVNZXRhZGF0YSB7XG4gIHBhY2thZ2VHcm91cDogc3RyaW5nW107XG4gIHJlcXVpcmVtZW50czogeyBbcGFja2FnZU5hbWU6IHN0cmluZ106IHN0cmluZyB9O1xuICBtaWdyYXRpb25zPzogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBfdXBkYXRlUGVlclZlcnNpb24oaW5mb01hcDogTWFwPHN0cmluZywgUGFja2FnZUluZm8+LCBuYW1lOiBzdHJpbmcsIHJhbmdlOiBzdHJpbmcpIHtcbiAgLy8gUmVzb2x2ZSBwYWNrYWdlR3JvdXBOYW1lLlxuICBjb25zdCBtYXliZVBhY2thZ2VJbmZvID0gaW5mb01hcC5nZXQobmFtZSk7XG4gIGlmICghbWF5YmVQYWNrYWdlSW5mbykge1xuICAgIHJldHVybiByYW5nZTtcbiAgfVxuICBpZiAobWF5YmVQYWNrYWdlSW5mby50YXJnZXQpIHtcbiAgICBuYW1lID0gbWF5YmVQYWNrYWdlSW5mby50YXJnZXQudXBkYXRlTWV0YWRhdGEucGFja2FnZUdyb3VwWzBdIHx8IG5hbWU7XG4gIH0gZWxzZSB7XG4gICAgbmFtZSA9IG1heWJlUGFja2FnZUluZm8uaW5zdGFsbGVkLnVwZGF0ZU1ldGFkYXRhLnBhY2thZ2VHcm91cFswXSB8fCBuYW1lO1xuICB9XG5cbiAgY29uc3QgbWF5YmVUcmFuc2Zvcm0gPSBwZWVyQ29tcGF0aWJsZVdoaXRlbGlzdFtuYW1lXTtcbiAgaWYgKG1heWJlVHJhbnNmb3JtKSB7XG4gICAgaWYgKHR5cGVvZiBtYXliZVRyYW5zZm9ybSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gbWF5YmVUcmFuc2Zvcm0ocmFuZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWF5YmVUcmFuc2Zvcm07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJhbmdlO1xufVxuXG5mdW5jdGlvbiBfdmFsaWRhdGVGb3J3YXJkUGVlckRlcGVuZGVuY2llcyhcbiAgbmFtZTogc3RyaW5nLFxuICBpbmZvTWFwOiBNYXA8c3RyaW5nLCBQYWNrYWdlSW5mbz4sXG4gIHBlZXJzOiB7W25hbWU6IHN0cmluZ106IHN0cmluZ30sXG4gIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksXG4pOiBib29sZWFuIHtcbiAgZm9yIChjb25zdCBbcGVlciwgcmFuZ2VdIG9mIE9iamVjdC5lbnRyaWVzKHBlZXJzKSkge1xuICAgIGxvZ2dlci5kZWJ1ZyhgQ2hlY2tpbmcgZm9yd2FyZCBwZWVyICR7cGVlcn0uLi5gKTtcbiAgICBjb25zdCBtYXliZVBlZXJJbmZvID0gaW5mb01hcC5nZXQocGVlcik7XG4gICAgaWYgKCFtYXliZVBlZXJJbmZvKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoW1xuICAgICAgICBgUGFja2FnZSAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBoYXMgYSBtaXNzaW5nIHBlZXIgZGVwZW5kZW5jeSBvZmAsXG4gICAgICAgIGAke0pTT04uc3RyaW5naWZ5KHBlZXIpfSBAICR7SlNPTi5zdHJpbmdpZnkocmFuZ2UpfS5gLFxuICAgICAgXS5qb2luKCcgJykpO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBwZWVyVmVyc2lvbiA9IG1heWJlUGVlckluZm8udGFyZ2V0ICYmIG1heWJlUGVlckluZm8udGFyZ2V0LnBhY2thZ2VKc29uLnZlcnNpb25cbiAgICAgID8gbWF5YmVQZWVySW5mby50YXJnZXQucGFja2FnZUpzb24udmVyc2lvblxuICAgICAgOiBtYXliZVBlZXJJbmZvLmluc3RhbGxlZC52ZXJzaW9uO1xuXG4gICAgbG9nZ2VyLmRlYnVnKGAgIFJhbmdlIGludGVyc2VjdHMoJHtyYW5nZX0sICR7cGVlclZlcnNpb259KS4uLmApO1xuICAgIGlmICghc2VtdmVyLnNhdGlzZmllcyhwZWVyVmVyc2lvbiwgcmFuZ2UpKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoW1xuICAgICAgICBgUGFja2FnZSAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBoYXMgYW4gaW5jb21wYXRpYmxlIHBlZXIgZGVwZW5kZW5jeSB0b2AsXG4gICAgICAgIGAke0pTT04uc3RyaW5naWZ5KHBlZXIpfSAocmVxdWlyZXMgJHtKU09OLnN0cmluZ2lmeShyYW5nZSl9LGAsXG4gICAgICAgIGB3b3VsZCBpbnN0YWxsICR7SlNPTi5zdHJpbmdpZnkocGVlclZlcnNpb24pfSlgLFxuICAgICAgXS5qb2luKCcgJykpO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cblxuZnVuY3Rpb24gX3ZhbGlkYXRlUmV2ZXJzZVBlZXJEZXBlbmRlbmNpZXMoXG4gIG5hbWU6IHN0cmluZyxcbiAgdmVyc2lvbjogc3RyaW5nLFxuICBpbmZvTWFwOiBNYXA8c3RyaW5nLCBQYWNrYWdlSW5mbz4sXG4gIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksXG4pIHtcbiAgZm9yIChjb25zdCBbaW5zdGFsbGVkLCBpbnN0YWxsZWRJbmZvXSBvZiBpbmZvTWFwLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IGluc3RhbGxlZExvZ2dlciA9IGxvZ2dlci5jcmVhdGVDaGlsZChpbnN0YWxsZWQpO1xuICAgIGluc3RhbGxlZExvZ2dlci5kZWJ1ZyhgJHtpbnN0YWxsZWR9Li4uYCk7XG4gICAgY29uc3QgcGVlcnMgPSAoaW5zdGFsbGVkSW5mby50YXJnZXQgfHwgaW5zdGFsbGVkSW5mby5pbnN0YWxsZWQpLnBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXM7XG5cbiAgICBmb3IgKGNvbnN0IFtwZWVyLCByYW5nZV0gb2YgT2JqZWN0LmVudHJpZXMocGVlcnMgfHwge30pKSB7XG4gICAgICBpZiAocGVlciAhPSBuYW1lKSB7XG4gICAgICAgIC8vIE9ubHkgY2hlY2sgcGVlcnMgdG8gdGhlIHBhY2thZ2VzIHdlJ3JlIHVwZGF0aW5nLiBXZSBkb24ndCBjYXJlIGFib3V0IHBlZXJzXG4gICAgICAgIC8vIHRoYXQgYXJlIHVubWV0IGJ1dCB3ZSBoYXZlIG5vIGVmZmVjdCBvbi5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIE92ZXJyaWRlIHRoZSBwZWVyIHZlcnNpb24gcmFuZ2UgaWYgaXQncyB3aGl0ZWxpc3RlZC5cbiAgICAgIGNvbnN0IGV4dGVuZGVkUmFuZ2UgPSBfdXBkYXRlUGVlclZlcnNpb24oaW5mb01hcCwgcGVlciwgcmFuZ2UpO1xuXG4gICAgICBpZiAoIXNlbXZlci5zYXRpc2ZpZXModmVyc2lvbiwgZXh0ZW5kZWRSYW5nZSkpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKFtcbiAgICAgICAgICBgUGFja2FnZSAke0pTT04uc3RyaW5naWZ5KGluc3RhbGxlZCl9IGhhcyBhbiBpbmNvbXBhdGlibGUgcGVlciBkZXBlbmRlbmN5IHRvYCxcbiAgICAgICAgICBgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gKHJlcXVpcmVzYCxcbiAgICAgICAgICBgJHtKU09OLnN0cmluZ2lmeShyYW5nZSl9JHtleHRlbmRlZFJhbmdlID09IHJhbmdlID8gJycgOiAnIChleHRlbmRlZCknfSxgLFxuICAgICAgICAgIGB3b3VsZCBpbnN0YWxsICR7SlNPTi5zdHJpbmdpZnkodmVyc2lvbil9KS5gLFxuICAgICAgICBdLmpvaW4oJyAnKSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdmFsaWRhdGVVcGRhdGVQYWNrYWdlcyhcbiAgaW5mb01hcDogTWFwPHN0cmluZywgUGFja2FnZUluZm8+LFxuICBmb3JjZTogYm9vbGVhbixcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbik6IHZvaWQge1xuICBsb2dnZXIuZGVidWcoJ1VwZGF0aW5nIHRoZSBmb2xsb3dpbmcgcGFja2FnZXM6Jyk7XG4gIGluZm9NYXAuZm9yRWFjaChpbmZvID0+IHtcbiAgICBpZiAoaW5mby50YXJnZXQpIHtcbiAgICAgIGxvZ2dlci5kZWJ1ZyhgICAke2luZm8ubmFtZX0gPT4gJHtpbmZvLnRhcmdldC52ZXJzaW9ufWApO1xuICAgIH1cbiAgfSk7XG5cbiAgbGV0IHBlZXJFcnJvcnMgPSBmYWxzZTtcbiAgaW5mb01hcC5mb3JFYWNoKGluZm8gPT4ge1xuICAgIGNvbnN0IHtuYW1lLCB0YXJnZXR9ID0gaW5mbztcbiAgICBpZiAoIXRhcmdldCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBrZ0xvZ2dlciA9IGxvZ2dlci5jcmVhdGVDaGlsZChuYW1lKTtcbiAgICBsb2dnZXIuZGVidWcoYCR7bmFtZX0uLi5gKTtcblxuICAgIGNvbnN0IHBlZXJzID0gdGFyZ2V0LnBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXMgfHwge307XG4gICAgcGVlckVycm9ycyA9IF92YWxpZGF0ZUZvcndhcmRQZWVyRGVwZW5kZW5jaWVzKG5hbWUsIGluZm9NYXAsIHBlZXJzLCBwa2dMb2dnZXIpIHx8IHBlZXJFcnJvcnM7XG4gICAgcGVlckVycm9yc1xuICAgICAgPSBfdmFsaWRhdGVSZXZlcnNlUGVlckRlcGVuZGVuY2llcyhuYW1lLCB0YXJnZXQudmVyc2lvbiwgaW5mb01hcCwgcGtnTG9nZ2VyKVxuICAgICAgfHwgcGVlckVycm9ycztcbiAgfSk7XG5cbiAgaWYgKCFmb3JjZSAmJiBwZWVyRXJyb3JzKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYEluY29tcGF0aWJsZSBwZWVyIGRlcGVuZGVuY2llcyBmb3VuZC4gU2VlIGFib3ZlLmApO1xuICB9XG59XG5cblxuZnVuY3Rpb24gX3BlcmZvcm1VcGRhdGUoXG4gIHRyZWU6IFRyZWUsXG4gIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQsXG4gIGluZm9NYXA6IE1hcDxzdHJpbmcsIFBhY2thZ2VJbmZvPixcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbiAgbWlncmF0ZU9ubHk6IGJvb2xlYW4sXG4pOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgY29uc3QgcGFja2FnZUpzb25Db250ZW50ID0gdHJlZS5yZWFkKCcvcGFja2FnZS5qc29uJyk7XG4gIGlmICghcGFja2FnZUpzb25Db250ZW50KSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ0NvdWxkIG5vdCBmaW5kIGEgcGFja2FnZS5qc29uLiBBcmUgeW91IGluIGEgTm9kZSBwcm9qZWN0PycpO1xuICB9XG5cbiAgbGV0IHBhY2thZ2VKc29uOiBKc29uU2NoZW1hRm9yTnBtUGFja2FnZUpzb25GaWxlcztcbiAgdHJ5IHtcbiAgICBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UocGFja2FnZUpzb25Db250ZW50LnRvU3RyaW5nKCkpIGFzIEpzb25TY2hlbWFGb3JOcG1QYWNrYWdlSnNvbkZpbGVzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ3BhY2thZ2UuanNvbiBjb3VsZCBub3QgYmUgcGFyc2VkOiAnICsgZS5tZXNzYWdlKTtcbiAgfVxuXG4gIGNvbnN0IHVwZGF0ZURlcGVuZGVuY3kgPSAoZGVwczogRGVwZW5kZW5jeSwgbmFtZTogc3RyaW5nLCBuZXdWZXJzaW9uOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBvbGRWZXJzaW9uID0gZGVwc1tuYW1lXTtcbiAgICAvLyBXZSBvbmx5IHJlc3BlY3QgY2FyZXQgYW5kIHRpbGRlIHJhbmdlcyBvbiB1cGRhdGUuXG4gICAgY29uc3QgZXhlY1Jlc3VsdCA9IC9eW1xcXn5dLy5leGVjKG9sZFZlcnNpb24pO1xuICAgIGRlcHNbbmFtZV0gPSBgJHtleGVjUmVzdWx0ID8gZXhlY1Jlc3VsdFswXSA6ICcnfSR7bmV3VmVyc2lvbn1gO1xuICB9O1xuXG4gIGNvbnN0IHRvSW5zdGFsbCA9IFsuLi5pbmZvTWFwLnZhbHVlcygpXVxuICAgICAgLm1hcCh4ID0+IFt4Lm5hbWUsIHgudGFyZ2V0LCB4Lmluc3RhbGxlZF0pXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAuZmlsdGVyKChbbmFtZSwgdGFyZ2V0LCBpbnN0YWxsZWRdKSA9PiB7XG4gICAgICAgIHJldHVybiAhIW5hbWUgJiYgISF0YXJnZXQgJiYgISFpbnN0YWxsZWQ7XG4gICAgICB9KSBhcyBbc3RyaW5nLCBQYWNrYWdlVmVyc2lvbkluZm8sIFBhY2thZ2VWZXJzaW9uSW5mb11bXTtcblxuICB0b0luc3RhbGwuZm9yRWFjaCgoW25hbWUsIHRhcmdldCwgaW5zdGFsbGVkXSkgPT4ge1xuICAgIGxvZ2dlci5pbmZvKFxuICAgICAgYFVwZGF0aW5nIHBhY2thZ2UuanNvbiB3aXRoIGRlcGVuZGVuY3kgJHtuYW1lfSBgXG4gICAgICArIGBAICR7SlNPTi5zdHJpbmdpZnkodGFyZ2V0LnZlcnNpb24pfSAod2FzICR7SlNPTi5zdHJpbmdpZnkoaW5zdGFsbGVkLnZlcnNpb24pfSkuLi5gLFxuICAgICk7XG5cbiAgICBpZiAocGFja2FnZUpzb24uZGVwZW5kZW5jaWVzICYmIHBhY2thZ2VKc29uLmRlcGVuZGVuY2llc1tuYW1lXSkge1xuICAgICAgdXBkYXRlRGVwZW5kZW5jeShwYWNrYWdlSnNvbi5kZXBlbmRlbmNpZXMsIG5hbWUsIHRhcmdldC52ZXJzaW9uKTtcblxuICAgICAgaWYgKHBhY2thZ2VKc29uLmRldkRlcGVuZGVuY2llcyAmJiBwYWNrYWdlSnNvbi5kZXZEZXBlbmRlbmNpZXNbbmFtZV0pIHtcbiAgICAgICAgZGVsZXRlIHBhY2thZ2VKc29uLmRldkRlcGVuZGVuY2llc1tuYW1lXTtcbiAgICAgIH1cbiAgICAgIGlmIChwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzICYmIHBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXNbbmFtZV0pIHtcbiAgICAgICAgZGVsZXRlIHBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXNbbmFtZV07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwYWNrYWdlSnNvbi5kZXZEZXBlbmRlbmNpZXMgJiYgcGFja2FnZUpzb24uZGV2RGVwZW5kZW5jaWVzW25hbWVdKSB7XG4gICAgICB1cGRhdGVEZXBlbmRlbmN5KHBhY2thZ2VKc29uLmRldkRlcGVuZGVuY2llcywgbmFtZSwgdGFyZ2V0LnZlcnNpb24pO1xuXG4gICAgICBpZiAocGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llcyAmJiBwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzW25hbWVdKSB7XG4gICAgICAgIGRlbGV0ZSBwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzW25hbWVdO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llcyAmJiBwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzW25hbWVdKSB7XG4gICAgICB1cGRhdGVEZXBlbmRlbmN5KHBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXMsIG5hbWUsIHRhcmdldC52ZXJzaW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nZ2VyLndhcm4oYFBhY2thZ2UgJHtuYW1lfSB3YXMgbm90IGZvdW5kIGluIGRlcGVuZGVuY2llcy5gKTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IG5ld0NvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShwYWNrYWdlSnNvbiwgbnVsbCwgMik7XG4gIGlmIChwYWNrYWdlSnNvbkNvbnRlbnQudG9TdHJpbmcoKSAhPSBuZXdDb250ZW50IHx8IG1pZ3JhdGVPbmx5KSB7XG4gICAgbGV0IGluc3RhbGxUYXNrOiBUYXNrSWRbXSA9IFtdO1xuICAgIGlmICghbWlncmF0ZU9ubHkpIHtcbiAgICAgIC8vIElmIHNvbWV0aGluZyBjaGFuZ2VkLCBhbHNvIGhvb2sgdXAgdGhlIHRhc2suXG4gICAgICB0cmVlLm92ZXJ3cml0ZSgnL3BhY2thZ2UuanNvbicsIEpTT04uc3RyaW5naWZ5KHBhY2thZ2VKc29uLCBudWxsLCAyKSk7XG4gICAgICBpbnN0YWxsVGFzayA9IFtjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soKSldO1xuICAgIH1cblxuICAgIC8vIFJ1biB0aGUgbWlncmF0ZSBzY2hlbWF0aWNzIHdpdGggdGhlIGxpc3Qgb2YgcGFja2FnZXMgdG8gdXNlLiBUaGUgY29sbGVjdGlvbiBjb250YWluc1xuICAgIC8vIHZlcnNpb24gaW5mb3JtYXRpb24gYW5kIHdlIG5lZWQgdG8gZG8gdGhpcyBwb3N0IGluc3RhbGxhdGlvbi4gUGxlYXNlIG5vdGUgdGhhdCB0aGVcbiAgICAvLyBtaWdyYXRpb24gQ09VTEQgZmFpbCBhbmQgbGVhdmUgc2lkZSBlZmZlY3RzIG9uIGRpc2suXG4gICAgLy8gUnVuIHRoZSBzY2hlbWF0aWNzIHRhc2sgb2YgdGhvc2UgcGFja2FnZXMuXG4gICAgdG9JbnN0YWxsLmZvckVhY2goKFtuYW1lLCB0YXJnZXQsIGluc3RhbGxlZF0pID0+IHtcbiAgICAgIGlmICghdGFyZ2V0LnVwZGF0ZU1ldGFkYXRhLm1pZ3JhdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb2xsZWN0aW9uID0gKFxuICAgICAgICB0YXJnZXQudXBkYXRlTWV0YWRhdGEubWlncmF0aW9ucy5tYXRjaCgvXlsuL10vKVxuICAgICAgICA/IG5hbWUgKyAnLydcbiAgICAgICAgOiAnJ1xuICAgICAgKSArIHRhcmdldC51cGRhdGVNZXRhZGF0YS5taWdyYXRpb25zO1xuXG4gICAgICBjb250ZXh0LmFkZFRhc2sobmV3IFJ1blNjaGVtYXRpY1Rhc2soJ0BzY2hlbWF0aWNzL3VwZGF0ZScsICdtaWdyYXRlJywge1xuICAgICAgICAgIHBhY2thZ2U6IG5hbWUsXG4gICAgICAgICAgY29sbGVjdGlvbixcbiAgICAgICAgICBmcm9tOiBpbnN0YWxsZWQudmVyc2lvbixcbiAgICAgICAgICB0bzogdGFyZ2V0LnZlcnNpb24sXG4gICAgICAgIH0pLFxuICAgICAgICBpbnN0YWxsVGFzayxcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gb2Y8dm9pZD4odW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gX21pZ3JhdGVPbmx5KFxuICBpbmZvOiBQYWNrYWdlSW5mbyB8IHVuZGVmaW5lZCxcbiAgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCxcbiAgZnJvbTogc3RyaW5nLFxuICB0bz86IHN0cmluZyxcbikge1xuICBpZiAoIWluZm8pIHtcbiAgICByZXR1cm4gb2Y8dm9pZD4oKTtcbiAgfVxuXG4gIGNvbnN0IHRhcmdldCA9IGluZm8uaW5zdGFsbGVkO1xuICBpZiAoIXRhcmdldCB8fCAhdGFyZ2V0LnVwZGF0ZU1ldGFkYXRhLm1pZ3JhdGlvbnMpIHtcbiAgICByZXR1cm4gb2Y8dm9pZD4odW5kZWZpbmVkKTtcbiAgfVxuXG4gIGNvbnN0IGNvbGxlY3Rpb24gPSAoXG4gICAgdGFyZ2V0LnVwZGF0ZU1ldGFkYXRhLm1pZ3JhdGlvbnMubWF0Y2goL15bLi9dLylcbiAgICAgID8gaW5mby5uYW1lICsgJy8nXG4gICAgICA6ICcnXG4gICkgKyB0YXJnZXQudXBkYXRlTWV0YWRhdGEubWlncmF0aW9ucztcblxuICBjb250ZXh0LmFkZFRhc2sobmV3IFJ1blNjaGVtYXRpY1Rhc2soJ0BzY2hlbWF0aWNzL3VwZGF0ZScsICdtaWdyYXRlJywge1xuICAgICAgcGFja2FnZTogaW5mby5uYW1lLFxuICAgICAgY29sbGVjdGlvbixcbiAgICAgIGZyb206IGZyb20sXG4gICAgICB0bzogdG8gfHwgdGFyZ2V0LnZlcnNpb24sXG4gICAgfSksXG4gICk7XG5cbiAgcmV0dXJuIG9mPHZvaWQ+KHVuZGVmaW5lZCk7XG59XG5cbmZ1bmN0aW9uIF9nZXRVcGRhdGVNZXRhZGF0YShcbiAgcGFja2FnZUpzb246IEpzb25TY2hlbWFGb3JOcG1QYWNrYWdlSnNvbkZpbGVzLFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogVXBkYXRlTWV0YWRhdGEge1xuICBjb25zdCBtZXRhZGF0YSA9IHBhY2thZ2VKc29uWyduZy11cGRhdGUnXTtcblxuICBjb25zdCByZXN1bHQ6IFVwZGF0ZU1ldGFkYXRhID0ge1xuICAgIHBhY2thZ2VHcm91cDogW10sXG4gICAgcmVxdWlyZW1lbnRzOiB7fSxcbiAgfTtcblxuICBpZiAoIW1ldGFkYXRhIHx8IHR5cGVvZiBtZXRhZGF0YSAhPSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KG1ldGFkYXRhKSkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpZiAobWV0YWRhdGFbJ3BhY2thZ2VHcm91cCddKSB7XG4gICAgY29uc3QgcGFja2FnZUdyb3VwID0gbWV0YWRhdGFbJ3BhY2thZ2VHcm91cCddO1xuICAgIC8vIFZlcmlmeSB0aGF0IHBhY2thZ2VHcm91cCBpcyBhbiBhcnJheSBvZiBzdHJpbmdzLiBUaGlzIGlzIG5vdCBhbiBlcnJvciBidXQgd2Ugc3RpbGwgd2FyblxuICAgIC8vIHRoZSB1c2VyIGFuZCBpZ25vcmUgdGhlIHBhY2thZ2VHcm91cCBrZXlzLlxuICAgIGlmICghQXJyYXkuaXNBcnJheShwYWNrYWdlR3JvdXApIHx8IHBhY2thZ2VHcm91cC5zb21lKHggPT4gdHlwZW9mIHggIT0gJ3N0cmluZycpKSB7XG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgYHBhY2thZ2VHcm91cCBtZXRhZGF0YSBvZiBwYWNrYWdlICR7cGFja2FnZUpzb24ubmFtZX0gaXMgbWFsZm9ybWVkLiBJZ25vcmluZy5gLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnBhY2thZ2VHcm91cCA9IHBhY2thZ2VHcm91cDtcbiAgICB9XG4gIH1cblxuICBpZiAobWV0YWRhdGFbJ3JlcXVpcmVtZW50cyddKSB7XG4gICAgY29uc3QgcmVxdWlyZW1lbnRzID0gbWV0YWRhdGFbJ3JlcXVpcmVtZW50cyddO1xuICAgIC8vIFZlcmlmeSB0aGF0IHJlcXVpcmVtZW50cyBhcmVcbiAgICBpZiAodHlwZW9mIHJlcXVpcmVtZW50cyAhPSAnb2JqZWN0J1xuICAgICAgICB8fCBBcnJheS5pc0FycmF5KHJlcXVpcmVtZW50cylcbiAgICAgICAgfHwgT2JqZWN0LmtleXMocmVxdWlyZW1lbnRzKS5zb21lKG5hbWUgPT4gdHlwZW9mIHJlcXVpcmVtZW50c1tuYW1lXSAhPSAnc3RyaW5nJykpIHtcbiAgICAgIGxvZ2dlci53YXJuKFxuICAgICAgICBgcmVxdWlyZW1lbnRzIG1ldGFkYXRhIG9mIHBhY2thZ2UgJHtwYWNrYWdlSnNvbi5uYW1lfSBpcyBtYWxmb3JtZWQuIElnbm9yaW5nLmAsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQucmVxdWlyZW1lbnRzID0gcmVxdWlyZW1lbnRzO1xuICAgIH1cbiAgfVxuXG4gIGlmIChtZXRhZGF0YVsnbWlncmF0aW9ucyddKSB7XG4gICAgY29uc3QgbWlncmF0aW9ucyA9IG1ldGFkYXRhWydtaWdyYXRpb25zJ107XG4gICAgaWYgKHR5cGVvZiBtaWdyYXRpb25zICE9ICdzdHJpbmcnKSB7XG4gICAgICBsb2dnZXIud2FybihgbWlncmF0aW9ucyBtZXRhZGF0YSBvZiBwYWNrYWdlICR7cGFja2FnZUpzb24ubmFtZX0gaXMgbWFsZm9ybWVkLiBJZ25vcmluZy5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0Lm1pZ3JhdGlvbnMgPSBtaWdyYXRpb25zO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuZnVuY3Rpb24gX3VzYWdlTWVzc2FnZShcbiAgb3B0aW9uczogVXBkYXRlU2NoZW1hLFxuICBpbmZvTWFwOiBNYXA8c3RyaW5nLCBQYWNrYWdlSW5mbz4sXG4gIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksXG4pIHtcbiAgY29uc3QgcGFja2FnZUdyb3VwcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IHBhY2thZ2VzVG9VcGRhdGUgPSBbLi4uaW5mb01hcC5lbnRyaWVzKCldXG4gICAgLm1hcCgoW25hbWUsIGluZm9dKSA9PiB7XG4gICAgICBjb25zdCB0YWcgPSBvcHRpb25zLm5leHRcbiAgICAgICAgPyAoaW5mby5ucG1QYWNrYWdlSnNvblsnZGlzdC10YWdzJ11bJ25leHQnXSA/ICduZXh0JyA6ICdsYXRlc3QnKSA6ICdsYXRlc3QnO1xuICAgICAgY29uc3QgdmVyc2lvbiA9IGluZm8ubnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW3RhZ107XG4gICAgICBjb25zdCB0YXJnZXQgPSBpbmZvLm5wbVBhY2thZ2VKc29uLnZlcnNpb25zW3ZlcnNpb25dO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBpbmZvLFxuICAgICAgICB2ZXJzaW9uLFxuICAgICAgICB0YWcsXG4gICAgICAgIHRhcmdldCxcbiAgICAgIH07XG4gICAgfSlcbiAgICAuZmlsdGVyKCh7IG5hbWUsIGluZm8sIHZlcnNpb24sIHRhcmdldCB9KSA9PiB7XG4gICAgICByZXR1cm4gKHRhcmdldCAmJiBzZW12ZXIuY29tcGFyZShpbmZvLmluc3RhbGxlZC52ZXJzaW9uLCB2ZXJzaW9uKSA8IDApO1xuICAgIH0pXG4gICAgLmZpbHRlcigoeyB0YXJnZXQgfSkgPT4ge1xuICAgICAgcmV0dXJuIHRhcmdldFsnbmctdXBkYXRlJ107XG4gICAgfSlcbiAgICAubWFwKCh7IG5hbWUsIGluZm8sIHZlcnNpb24sIHRhZywgdGFyZ2V0IH0pID0+IHtcbiAgICAgIC8vIExvb2sgZm9yIHBhY2thZ2VHcm91cC5cbiAgICAgIGlmICh0YXJnZXRbJ25nLXVwZGF0ZSddICYmIHRhcmdldFsnbmctdXBkYXRlJ11bJ3BhY2thZ2VHcm91cCddKSB7XG4gICAgICAgIGNvbnN0IHBhY2thZ2VHcm91cCA9IHRhcmdldFsnbmctdXBkYXRlJ11bJ3BhY2thZ2VHcm91cCddO1xuICAgICAgICBjb25zdCBwYWNrYWdlR3JvdXBOYW1lID0gdGFyZ2V0WyduZy11cGRhdGUnXVsncGFja2FnZUdyb3VwTmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB0YXJnZXRbJ25nLXVwZGF0ZSddWydwYWNrYWdlR3JvdXAnXVswXTtcbiAgICAgICAgaWYgKHBhY2thZ2VHcm91cE5hbWUpIHtcbiAgICAgICAgICBpZiAocGFja2FnZUdyb3Vwcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhY2thZ2VHcm91cC5mb3JFYWNoKCh4OiBzdHJpbmcpID0+IHBhY2thZ2VHcm91cHMuc2V0KHgsIHBhY2thZ2VHcm91cE5hbWUpKTtcbiAgICAgICAgICBwYWNrYWdlR3JvdXBzLnNldChwYWNrYWdlR3JvdXBOYW1lLCBwYWNrYWdlR3JvdXBOYW1lKTtcbiAgICAgICAgICBuYW1lID0gcGFja2FnZUdyb3VwTmFtZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXQgY29tbWFuZCA9IGBuZyB1cGRhdGUgJHtuYW1lfWA7XG4gICAgICBpZiAodGFnID09ICduZXh0Jykge1xuICAgICAgICBjb21tYW5kICs9ICcgLS1uZXh0JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFtuYW1lLCBgJHtpbmZvLmluc3RhbGxlZC52ZXJzaW9ufSAtPiAke3ZlcnNpb259YCwgY29tbWFuZF07XG4gICAgfSlcbiAgICAuZmlsdGVyKHggPT4geCAhPT0gbnVsbClcbiAgICAuc29ydCgoYSwgYikgPT4gYSAmJiBiID8gYVswXS5sb2NhbGVDb21wYXJlKGJbMF0pIDogMCk7XG5cbiAgaWYgKHBhY2thZ2VzVG9VcGRhdGUubGVuZ3RoID09IDApIHtcbiAgICBsb2dnZXIuaW5mbygnV2UgYW5hbHl6ZWQgeW91ciBwYWNrYWdlLmpzb24gYW5kIGV2ZXJ5dGhpbmcgc2VlbXMgdG8gYmUgaW4gb3JkZXIuIEdvb2Qgd29yayEnKTtcblxuICAgIHJldHVybiBvZjx2b2lkPih1bmRlZmluZWQpO1xuICB9XG5cbiAgbG9nZ2VyLmluZm8oXG4gICAgJ1dlIGFuYWx5emVkIHlvdXIgcGFja2FnZS5qc29uLCB0aGVyZSBhcmUgc29tZSBwYWNrYWdlcyB0byB1cGRhdGU6XFxuJyxcbiAgKTtcblxuICAvLyBGaW5kIHRoZSBsYXJnZXN0IG5hbWUgdG8ga25vdyB0aGUgcGFkZGluZyBuZWVkZWQuXG4gIGxldCBuYW1lUGFkID0gTWF0aC5tYXgoLi4uWy4uLmluZm9NYXAua2V5cygpXS5tYXAoeCA9PiB4Lmxlbmd0aCkpICsgMjtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobmFtZVBhZCkpIHtcbiAgICBuYW1lUGFkID0gMzA7XG4gIH1cbiAgY29uc3QgcGFkcyA9IFtuYW1lUGFkLCAyNSwgMF07XG5cbiAgbG9nZ2VyLmluZm8oXG4gICAgJyAgJ1xuICAgICsgWydOYW1lJywgJ1ZlcnNpb24nLCAnQ29tbWFuZCB0byB1cGRhdGUnXS5tYXAoKHgsIGkpID0+IHgucGFkRW5kKHBhZHNbaV0pKS5qb2luKCcnKSxcbiAgKTtcbiAgbG9nZ2VyLmluZm8oJyAnICsgJy0nLnJlcGVhdChwYWRzLnJlZHVjZSgocywgeCkgPT4gcyArPSB4LCAwKSArIDIwKSk7XG5cbiAgcGFja2FnZXNUb1VwZGF0ZS5mb3JFYWNoKGZpZWxkcyA9PiB7XG4gICAgaWYgKCFmaWVsZHMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2dnZXIuaW5mbygnICAnICsgZmllbGRzLm1hcCgoeCwgaSkgPT4geC5wYWRFbmQocGFkc1tpXSkpLmpvaW4oJycpKTtcbiAgfSk7XG5cbiAgbG9nZ2VyLmluZm8oJ1xcbicpO1xuICBsb2dnZXIuaW5mbygnVGhlcmUgbWlnaHQgYmUgYWRkaXRpb25hbCBwYWNrYWdlcyB0aGF0IGFyZSBvdXRkYXRlZC4nKTtcbiAgbG9nZ2VyLmluZm8oJ1J1biBcIm5nIHVwZGF0ZSAtLWFsbFwiIHRvIHRyeSB0byB1cGRhdGUgYWxsIGF0IHRoZSBzYW1lIHRpbWUuXFxuJyk7XG5cbiAgcmV0dXJuIG9mPHZvaWQ+KHVuZGVmaW5lZCk7XG59XG5cblxuZnVuY3Rpb24gX2J1aWxkUGFja2FnZUluZm8oXG4gIHRyZWU6IFRyZWUsXG4gIHBhY2thZ2VzOiBNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+LFxuICBhbGxEZXBlbmRlbmNpZXM6IFJlYWRvbmx5TWFwPHN0cmluZywgVmVyc2lvblJhbmdlPixcbiAgbnBtUGFja2FnZUpzb246IE5wbVJlcG9zaXRvcnlQYWNrYWdlSnNvbixcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbik6IFBhY2thZ2VJbmZvIHtcbiAgY29uc3QgbmFtZSA9IG5wbVBhY2thZ2VKc29uLm5hbWU7XG4gIGNvbnN0IHBhY2thZ2VKc29uUmFuZ2UgPSBhbGxEZXBlbmRlbmNpZXMuZ2V0KG5hbWUpO1xuICBpZiAoIXBhY2thZ2VKc29uUmFuZ2UpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgIGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IHdhcyBub3QgZm91bmQgaW4gcGFja2FnZS5qc29uLmAsXG4gICAgKTtcbiAgfVxuXG4gIC8vIEZpbmQgb3V0IHRoZSBjdXJyZW50bHkgaW5zdGFsbGVkIHZlcnNpb24uIEVpdGhlciBmcm9tIHRoZSBwYWNrYWdlLmpzb24gb3IgdGhlIG5vZGVfbW9kdWxlcy9cbiAgLy8gVE9ETzogZmlndXJlIG91dCBhIHdheSB0byByZWFkIHBhY2thZ2UtbG9jay5qc29uIGFuZC9vciB5YXJuLmxvY2suXG4gIGxldCBpbnN0YWxsZWRWZXJzaW9uOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGNvbnN0IHBhY2thZ2VDb250ZW50ID0gdHJlZS5yZWFkKGAvbm9kZV9tb2R1bGVzLyR7bmFtZX0vcGFja2FnZS5qc29uYCk7XG4gIGlmIChwYWNrYWdlQ29udGVudCkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBKU09OLnBhcnNlKHBhY2thZ2VDb250ZW50LnRvU3RyaW5nKCkpIGFzIEpzb25TY2hlbWFGb3JOcG1QYWNrYWdlSnNvbkZpbGVzO1xuICAgIGluc3RhbGxlZFZlcnNpb24gPSBjb250ZW50LnZlcnNpb247XG4gIH1cbiAgaWYgKCFpbnN0YWxsZWRWZXJzaW9uKSB7XG4gICAgLy8gRmluZCB0aGUgdmVyc2lvbiBmcm9tIE5QTSB0aGF0IGZpdHMgdGhlIHJhbmdlIHRvIG1heC5cbiAgICBpbnN0YWxsZWRWZXJzaW9uID0gc2VtdmVyLm1heFNhdGlzZnlpbmcoXG4gICAgICBPYmplY3Qua2V5cyhucG1QYWNrYWdlSnNvbi52ZXJzaW9ucyksXG4gICAgICBwYWNrYWdlSnNvblJhbmdlLFxuICAgICk7XG4gIH1cblxuICBjb25zdCBpbnN0YWxsZWRQYWNrYWdlSnNvbiA9IG5wbVBhY2thZ2VKc29uLnZlcnNpb25zW2luc3RhbGxlZFZlcnNpb25dIHx8IHBhY2thZ2VDb250ZW50O1xuICBpZiAoIWluc3RhbGxlZFBhY2thZ2VKc29uKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICBgQW4gdW5leHBlY3RlZCBlcnJvciBoYXBwZW5lZDsgcGFja2FnZSAke25hbWV9IGhhcyBubyB2ZXJzaW9uICR7aW5zdGFsbGVkVmVyc2lvbn0uYCxcbiAgICApO1xuICB9XG5cbiAgbGV0IHRhcmdldFZlcnNpb246IFZlcnNpb25SYW5nZSB8IHVuZGVmaW5lZCA9IHBhY2thZ2VzLmdldChuYW1lKTtcbiAgaWYgKHRhcmdldFZlcnNpb24pIHtcbiAgICBpZiAobnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW3RhcmdldFZlcnNpb25dKSB7XG4gICAgICB0YXJnZXRWZXJzaW9uID0gbnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW3RhcmdldFZlcnNpb25dIGFzIFZlcnNpb25SYW5nZTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldFZlcnNpb24gPT0gJ25leHQnKSB7XG4gICAgICB0YXJnZXRWZXJzaW9uID0gbnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddWydsYXRlc3QnXSBhcyBWZXJzaW9uUmFuZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhcmdldFZlcnNpb24gPSBzZW12ZXIubWF4U2F0aXNmeWluZyhcbiAgICAgICAgT2JqZWN0LmtleXMobnBtUGFja2FnZUpzb24udmVyc2lvbnMpLFxuICAgICAgICB0YXJnZXRWZXJzaW9uLFxuICAgICAgKSBhcyBWZXJzaW9uUmFuZ2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRhcmdldFZlcnNpb24gJiYgc2VtdmVyLmx0ZSh0YXJnZXRWZXJzaW9uLCBpbnN0YWxsZWRWZXJzaW9uKSkge1xuICAgIGxvZ2dlci5kZWJ1ZyhgUGFja2FnZSAke25hbWV9IGFscmVhZHkgc2F0aXNmaWVkIGJ5IHBhY2thZ2UuanNvbiAoJHtwYWNrYWdlSnNvblJhbmdlfSkuYCk7XG4gICAgdGFyZ2V0VmVyc2lvbiA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IHRhcmdldDogUGFja2FnZVZlcnNpb25JbmZvIHwgdW5kZWZpbmVkID0gdGFyZ2V0VmVyc2lvblxuICAgID8ge1xuICAgICAgdmVyc2lvbjogdGFyZ2V0VmVyc2lvbixcbiAgICAgIHBhY2thZ2VKc29uOiBucG1QYWNrYWdlSnNvbi52ZXJzaW9uc1t0YXJnZXRWZXJzaW9uXSxcbiAgICAgIHVwZGF0ZU1ldGFkYXRhOiBfZ2V0VXBkYXRlTWV0YWRhdGEobnBtUGFja2FnZUpzb24udmVyc2lvbnNbdGFyZ2V0VmVyc2lvbl0sIGxvZ2dlciksXG4gICAgfVxuICAgIDogdW5kZWZpbmVkO1xuXG4gIC8vIENoZWNrIGlmIHRoZXJlJ3MgYW4gaW5zdGFsbGVkIHZlcnNpb24uXG4gIHJldHVybiB7XG4gICAgbmFtZSxcbiAgICBucG1QYWNrYWdlSnNvbixcbiAgICBpbnN0YWxsZWQ6IHtcbiAgICAgIHZlcnNpb246IGluc3RhbGxlZFZlcnNpb24gYXMgVmVyc2lvblJhbmdlLFxuICAgICAgcGFja2FnZUpzb246IGluc3RhbGxlZFBhY2thZ2VKc29uLFxuICAgICAgdXBkYXRlTWV0YWRhdGE6IF9nZXRVcGRhdGVNZXRhZGF0YShpbnN0YWxsZWRQYWNrYWdlSnNvbiwgbG9nZ2VyKSxcbiAgICB9LFxuICAgIHRhcmdldCxcbiAgICBwYWNrYWdlSnNvblJhbmdlLFxuICB9O1xufVxuXG5cbmZ1bmN0aW9uIF9idWlsZFBhY2thZ2VMaXN0KFxuICBvcHRpb25zOiBVcGRhdGVTY2hlbWEsXG4gIHByb2plY3REZXBzOiBNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+LFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogTWFwPHN0cmluZywgVmVyc2lvblJhbmdlPiB7XG4gIC8vIFBhcnNlIHRoZSBwYWNrYWdlcyBvcHRpb25zIHRvIHNldCB0aGUgdGFyZ2V0ZWQgdmVyc2lvbi5cbiAgY29uc3QgcGFja2FnZXMgPSBuZXcgTWFwPHN0cmluZywgVmVyc2lvblJhbmdlPigpO1xuICBjb25zdCBjb21tYW5kTGluZVBhY2thZ2VzID1cbiAgICAob3B0aW9ucy5wYWNrYWdlcyAmJiBvcHRpb25zLnBhY2thZ2VzLmxlbmd0aCA+IDApXG4gICAgPyBvcHRpb25zLnBhY2thZ2VzXG4gICAgOiAob3B0aW9ucy5hbGwgPyBwcm9qZWN0RGVwcy5rZXlzKCkgOiBbXSk7XG5cbiAgZm9yIChjb25zdCBwa2cgb2YgY29tbWFuZExpbmVQYWNrYWdlcykge1xuICAgIC8vIFNwbGl0IHRoZSB2ZXJzaW9uIGFza2VkIG9uIGNvbW1hbmQgbGluZS5cbiAgICBjb25zdCBtID0gcGtnLm1hdGNoKC9eKCg/OkBbXi9dezEsMTAwfVxcLyk/W15AXXsxLDEwMH0pKD86QCguezEsMTAwfSkpPyQvKTtcbiAgICBpZiAoIW0pIHtcbiAgICAgIGxvZ2dlci53YXJuKGBJbnZhbGlkIHBhY2thZ2UgYXJndW1lbnQ6ICR7SlNPTi5zdHJpbmdpZnkocGtnKX0uIFNraXBwaW5nLmApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgWywgbnBtTmFtZSwgbWF5YmVWZXJzaW9uXSA9IG07XG5cbiAgICBjb25zdCB2ZXJzaW9uID0gcHJvamVjdERlcHMuZ2V0KG5wbU5hbWUpO1xuICAgIGlmICghdmVyc2lvbikge1xuICAgICAgbG9nZ2VyLndhcm4oYFBhY2thZ2Ugbm90IGluc3RhbGxlZDogJHtKU09OLnN0cmluZ2lmeShucG1OYW1lKX0uIFNraXBwaW5nLmApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gVmVyaWZ5IHRoYXQgcGVvcGxlIGhhdmUgYW4gYWN0dWFsIHZlcnNpb24gaW4gdGhlIHBhY2thZ2UuanNvbiwgb3RoZXJ3aXNlIChsYWJlbCBvciBVUkwgb3JcbiAgICAvLyBnaXN0IG9yIC4uLikgd2UgZG9uJ3QgdXBkYXRlIGl0LlxuICAgIGlmIChcbiAgICAgIHZlcnNpb24uc3RhcnRzV2l0aCgnaHR0cDonKSAgLy8gSFRUUFxuICAgICAgfHwgdmVyc2lvbi5zdGFydHNXaXRoKCdmaWxlOicpICAvLyBMb2NhbCBmb2xkZXJcbiAgICAgIHx8IHZlcnNpb24uc3RhcnRzV2l0aCgnZ2l0OicpICAvLyBHSVQgdXJsXG4gICAgICB8fCB2ZXJzaW9uLm1hdGNoKC9eXFx3ezEsMTAwfVxcL1xcd3sxLDEwMH0vKSAgLy8gR2l0SHViJ3MgXCJ1c2VyL3JlcG9cIlxuICAgICAgfHwgdmVyc2lvbi5tYXRjaCgvXig/OlxcLnswLDJ9XFwvKVxcd3sxLDEwMH0vKSAgLy8gTG9jYWwgZm9sZGVyLCBtYXliZSByZWxhdGl2ZS5cbiAgICApIHtcbiAgICAgIC8vIFdlIG9ubHkgZG8gdGhhdCBmb3IgLS1hbGwuIE90aGVyd2lzZSB3ZSBoYXZlIHRoZSBpbnN0YWxsZWQgdmVyc2lvbiBhbmQgdGhlIHVzZXIgc3BlY2lmaWVkXG4gICAgICAvLyBpdCBvbiB0aGUgY29tbWFuZCBsaW5lLlxuICAgICAgaWYgKG9wdGlvbnMuYWxsKSB7XG4gICAgICAgIGxvZ2dlci53YXJuKFxuICAgICAgICAgIGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobnBtTmFtZSl9IGhhcyBhIGN1c3RvbSB2ZXJzaW9uOiBgXG4gICAgICAgICAgKyBgJHtKU09OLnN0cmluZ2lmeSh2ZXJzaW9uKX0uIFNraXBwaW5nLmAsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBhY2thZ2VzLnNldChucG1OYW1lLCAobWF5YmVWZXJzaW9uIHx8IChvcHRpb25zLm5leHQgPyAnbmV4dCcgOiAnbGF0ZXN0JykpIGFzIFZlcnNpb25SYW5nZSk7XG4gIH1cblxuICByZXR1cm4gcGFja2FnZXM7XG59XG5cblxuZnVuY3Rpb24gX2FkZFBhY2thZ2VHcm91cChcbiAgdHJlZTogVHJlZSxcbiAgcGFja2FnZXM6IE1hcDxzdHJpbmcsIFZlcnNpb25SYW5nZT4sXG4gIGFsbERlcGVuZGVuY2llczogUmVhZG9ubHlNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+LFxuICBucG1QYWNrYWdlSnNvbjogTnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uLFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogdm9pZCB7XG4gIGNvbnN0IG1heWJlUGFja2FnZSA9IHBhY2thZ2VzLmdldChucG1QYWNrYWdlSnNvbi5uYW1lKTtcbiAgaWYgKCFtYXliZVBhY2thZ2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBpbmZvID0gX2J1aWxkUGFja2FnZUluZm8odHJlZSwgcGFja2FnZXMsIGFsbERlcGVuZGVuY2llcywgbnBtUGFja2FnZUpzb24sIGxvZ2dlcik7XG5cbiAgY29uc3QgdmVyc2lvbiA9IChpbmZvLnRhcmdldCAmJiBpbmZvLnRhcmdldC52ZXJzaW9uKVxuICAgICAgICAgICAgICAgfHwgbnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW21heWJlUGFja2FnZV1cbiAgICAgICAgICAgICAgIHx8IG1heWJlUGFja2FnZTtcbiAgaWYgKCFucG1QYWNrYWdlSnNvbi52ZXJzaW9uc1t2ZXJzaW9uXSkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBuZ1VwZGF0ZU1ldGFkYXRhID0gbnBtUGFja2FnZUpzb24udmVyc2lvbnNbdmVyc2lvbl1bJ25nLXVwZGF0ZSddO1xuICBpZiAoIW5nVXBkYXRlTWV0YWRhdGEpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwYWNrYWdlR3JvdXAgPSBuZ1VwZGF0ZU1ldGFkYXRhWydwYWNrYWdlR3JvdXAnXTtcbiAgaWYgKCFwYWNrYWdlR3JvdXApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFBcnJheS5pc0FycmF5KHBhY2thZ2VHcm91cCkgfHwgcGFja2FnZUdyb3VwLnNvbWUoeCA9PiB0eXBlb2YgeCAhPSAnc3RyaW5nJykpIHtcbiAgICBsb2dnZXIud2FybihgcGFja2FnZUdyb3VwIG1ldGFkYXRhIG9mIHBhY2thZ2UgJHtucG1QYWNrYWdlSnNvbi5uYW1lfSBpcyBtYWxmb3JtZWQuYCk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICBwYWNrYWdlR3JvdXBcbiAgICAuZmlsdGVyKG5hbWUgPT4gIXBhY2thZ2VzLmhhcyhuYW1lKSkgIC8vIERvbid0IG92ZXJyaWRlIG5hbWVzIGZyb20gdGhlIGNvbW1hbmQgbGluZS5cbiAgICAuZmlsdGVyKG5hbWUgPT4gYWxsRGVwZW5kZW5jaWVzLmhhcyhuYW1lKSkgIC8vIFJlbW92ZSBwYWNrYWdlcyB0aGF0IGFyZW4ndCBpbnN0YWxsZWQuXG4gICAgLmZvckVhY2gobmFtZSA9PiB7XG4gICAgcGFja2FnZXMuc2V0KG5hbWUsIG1heWJlUGFja2FnZSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIEFkZCBwZWVyIGRlcGVuZGVuY2llcyBvZiBwYWNrYWdlcyBvbiB0aGUgY29tbWFuZCBsaW5lIHRvIHRoZSBsaXN0IG9mIHBhY2thZ2VzIHRvIHVwZGF0ZS5cbiAqIFdlIGRvbid0IGRvIHZlcmlmaWNhdGlvbiBvZiB0aGUgdmVyc2lvbnMgaGVyZSBhcyB0aGlzIHdpbGwgYmUgZG9uZSBieSBhIGxhdGVyIHN0ZXAgKGFuZCBjYW5cbiAqIGJlIGlnbm9yZWQgYnkgdGhlIC0tZm9yY2UgZmxhZykuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBfYWRkUGVlckRlcGVuZGVuY2llcyhcbiAgdHJlZTogVHJlZSxcbiAgcGFja2FnZXM6IE1hcDxzdHJpbmcsIFZlcnNpb25SYW5nZT4sXG4gIGFsbERlcGVuZGVuY2llczogUmVhZG9ubHlNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+LFxuICBucG1QYWNrYWdlSnNvbjogTnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uLFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogdm9pZCB7XG4gIGNvbnN0IG1heWJlUGFja2FnZSA9IHBhY2thZ2VzLmdldChucG1QYWNrYWdlSnNvbi5uYW1lKTtcbiAgaWYgKCFtYXliZVBhY2thZ2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBpbmZvID0gX2J1aWxkUGFja2FnZUluZm8odHJlZSwgcGFja2FnZXMsIGFsbERlcGVuZGVuY2llcywgbnBtUGFja2FnZUpzb24sIGxvZ2dlcik7XG5cbiAgY29uc3QgdmVyc2lvbiA9IChpbmZvLnRhcmdldCAmJiBpbmZvLnRhcmdldC52ZXJzaW9uKVxuICAgICAgICAgICAgICAgfHwgbnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW21heWJlUGFja2FnZV1cbiAgICAgICAgICAgICAgIHx8IG1heWJlUGFja2FnZTtcbiAgaWYgKCFucG1QYWNrYWdlSnNvbi52ZXJzaW9uc1t2ZXJzaW9uXSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHBhY2thZ2VKc29uID0gbnBtUGFja2FnZUpzb24udmVyc2lvbnNbdmVyc2lvbl07XG4gIGNvbnN0IGVycm9yID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCBbcGVlciwgcmFuZ2VdIG9mIE9iamVjdC5lbnRyaWVzKHBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXMgfHwge30pKSB7XG4gICAgaWYgKCFwYWNrYWdlcy5oYXMocGVlcikpIHtcbiAgICAgIHBhY2thZ2VzLnNldChwZWVyLCByYW5nZSBhcyBWZXJzaW9uUmFuZ2UpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdBbiBlcnJvciBvY2N1cmVkLCBzZWUgYWJvdmUuJyk7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBfZ2V0QWxsRGVwZW5kZW5jaWVzKHRyZWU6IFRyZWUpOiBNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+IHtcbiAgY29uc3QgcGFja2FnZUpzb25Db250ZW50ID0gdHJlZS5yZWFkKCcvcGFja2FnZS5qc29uJyk7XG4gIGlmICghcGFja2FnZUpzb25Db250ZW50KSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ0NvdWxkIG5vdCBmaW5kIGEgcGFja2FnZS5qc29uLiBBcmUgeW91IGluIGEgTm9kZSBwcm9qZWN0PycpO1xuICB9XG5cbiAgbGV0IHBhY2thZ2VKc29uOiBKc29uU2NoZW1hRm9yTnBtUGFja2FnZUpzb25GaWxlcztcbiAgdHJ5IHtcbiAgICBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UocGFja2FnZUpzb25Db250ZW50LnRvU3RyaW5nKCkpIGFzIEpzb25TY2hlbWFGb3JOcG1QYWNrYWdlSnNvbkZpbGVzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ3BhY2thZ2UuanNvbiBjb3VsZCBub3QgYmUgcGFyc2VkOiAnICsgZS5tZXNzYWdlKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgTWFwPHN0cmluZywgVmVyc2lvblJhbmdlPihbXG4gICAgLi4uT2JqZWN0LmVudHJpZXMocGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llcyB8fCB7fSksXG4gICAgLi4uT2JqZWN0LmVudHJpZXMocGFja2FnZUpzb24uZGV2RGVwZW5kZW5jaWVzIHx8IHt9KSxcbiAgICAuLi5PYmplY3QuZW50cmllcyhwYWNrYWdlSnNvbi5kZXBlbmRlbmNpZXMgfHwge30pLFxuICBdIGFzIFtzdHJpbmcsIFZlcnNpb25SYW5nZV1bXSk7XG59XG5cbmZ1bmN0aW9uIF9mb3JtYXRWZXJzaW9uKHZlcnNpb246IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuICBpZiAodmVyc2lvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmICghdmVyc2lvbi5tYXRjaCgvXlxcZHsxLDMwfVxcLlxcZHsxLDMwfVxcLlxcZHsxLDMwfS8pKSB7XG4gICAgdmVyc2lvbiArPSAnLjAnO1xuICB9XG4gIGlmICghdmVyc2lvbi5tYXRjaCgvXlxcZHsxLDMwfVxcLlxcZHsxLDMwfVxcLlxcZHsxLDMwfS8pKSB7XG4gICAgdmVyc2lvbiArPSAnLjAnO1xuICB9XG4gIGlmICghc2VtdmVyLnZhbGlkKHZlcnNpb24pKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYEludmFsaWQgbWlncmF0aW9uIHZlcnNpb246ICR7SlNPTi5zdHJpbmdpZnkodmVyc2lvbil9YCk7XG4gIH1cblxuICByZXR1cm4gdmVyc2lvbjtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihvcHRpb25zOiBVcGRhdGVTY2hlbWEpOiBSdWxlIHtcbiAgaWYgKCFvcHRpb25zLnBhY2thZ2VzKSB7XG4gICAgLy8gV2UgY2Fubm90IGp1c3QgcmV0dXJuIHRoaXMgYmVjYXVzZSB3ZSBuZWVkIHRvIGZldGNoIHRoZSBwYWNrYWdlcyBmcm9tIE5QTSBzdGlsbCBmb3IgdGhlXG4gICAgLy8gaGVscC9ndWlkZSB0byBzaG93LlxuICAgIG9wdGlvbnMucGFja2FnZXMgPSBbXTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXZSBzcGxpdCBldmVyeSBwYWNrYWdlcyBieSBjb21tYXMgdG8gYWxsb3cgcGVvcGxlIHRvIHBhc3MgaW4gbXVsdGlwbGUgYW5kIG1ha2UgaXQgYW4gYXJyYXkuXG4gICAgb3B0aW9ucy5wYWNrYWdlcyA9IG9wdGlvbnMucGFja2FnZXMucmVkdWNlKChhY2MsIGN1cnIpID0+IHtcbiAgICAgIHJldHVybiBhY2MuY29uY2F0KGN1cnIuc3BsaXQoJywnKSk7XG4gICAgfSwgW10gYXMgc3RyaW5nW10pO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMubWlncmF0ZU9ubHkgJiYgb3B0aW9ucy5mcm9tKSB7XG4gICAgaWYgKG9wdGlvbnMucGFja2FnZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignLS1mcm9tIHJlcXVpcmVzIHRoYXQgb25seSBhIHNpbmdsZSBwYWNrYWdlIGJlIHBhc3NlZC4nKTtcbiAgICB9XG4gIH1cblxuICBvcHRpb25zLmZyb20gPSBfZm9ybWF0VmVyc2lvbihvcHRpb25zLmZyb20pO1xuICBvcHRpb25zLnRvID0gX2Zvcm1hdFZlcnNpb24ob3B0aW9ucy50byk7XG5cbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgbG9nZ2VyID0gY29udGV4dC5sb2dnZXI7XG4gICAgY29uc3QgYWxsRGVwZW5kZW5jaWVzID0gX2dldEFsbERlcGVuZGVuY2llcyh0cmVlKTtcbiAgICBjb25zdCBwYWNrYWdlcyA9IF9idWlsZFBhY2thZ2VMaXN0KG9wdGlvbnMsIGFsbERlcGVuZGVuY2llcywgbG9nZ2VyKTtcblxuICAgIHJldHVybiBvYnNlcnZhYmxlRnJvbShbLi4uYWxsRGVwZW5kZW5jaWVzLmtleXMoKV0pLnBpcGUoXG4gICAgICAvLyBHcmFiIGFsbCBwYWNrYWdlLmpzb24gZnJvbSB0aGUgbnBtIHJlcG9zaXRvcnkuIFRoaXMgcmVxdWlyZXMgYSBsb3Qgb2YgSFRUUCBjYWxscyBzbyB3ZVxuICAgICAgLy8gdHJ5IHRvIHBhcmFsbGVsaXplIGFzIG1hbnkgYXMgcG9zc2libGUuXG4gICAgICBtZXJnZU1hcChkZXBOYW1lID0+IGdldE5wbVBhY2thZ2VKc29uKGRlcE5hbWUsIG9wdGlvbnMucmVnaXN0cnksIGxvZ2dlcikpLFxuXG4gICAgICAvLyBCdWlsZCBhIG1hcCBvZiBhbGwgZGVwZW5kZW5jaWVzIGFuZCB0aGVpciBwYWNrYWdlSnNvbi5cbiAgICAgIHJlZHVjZTxOcG1SZXBvc2l0b3J5UGFja2FnZUpzb24sIE1hcDxzdHJpbmcsIE5wbVJlcG9zaXRvcnlQYWNrYWdlSnNvbj4+KFxuICAgICAgICAoYWNjLCBucG1QYWNrYWdlSnNvbikgPT4ge1xuICAgICAgICAgIC8vIElmIHRoZSBwYWNrYWdlIHdhcyBub3QgZm91bmQgb24gdGhlIHJlZ2lzdHJ5LiBJdCBjb3VsZCBiZSBwcml2YXRlLCBzbyB3ZSB3aWxsIGp1c3RcbiAgICAgICAgICAvLyBpZ25vcmUuIElmIHRoZSBwYWNrYWdlIHdhcyBwYXJ0IG9mIHRoZSBsaXN0LCB3ZSB3aWxsIGVycm9yIG91dCwgYnV0IHdpbGwgc2ltcGx5IGlnbm9yZVxuICAgICAgICAgIC8vIGlmIGl0J3MgZWl0aGVyIG5vdCByZXF1ZXN0ZWQgKHNvIGp1c3QgcGFydCBvZiBwYWNrYWdlLmpzb24uIHNpbGVudGx5KSBvciBpZiBpdCdzIGFcbiAgICAgICAgICAvLyBgLS1hbGxgIHNpdHVhdGlvbi4gVGhlcmUgaXMgYW4gZWRnZSBjYXNlIGhlcmUgd2hlcmUgYSBwdWJsaWMgcGFja2FnZSBwZWVyIGRlcGVuZHMgb24gYVxuICAgICAgICAgIC8vIHByaXZhdGUgb25lLCBidXQgaXQncyByYXJlIGVub3VnaC5cbiAgICAgICAgICBpZiAoIW5wbVBhY2thZ2VKc29uLm5hbWUpIHtcbiAgICAgICAgICAgIGlmIChwYWNrYWdlcy5oYXMobnBtUGFja2FnZUpzb24ucmVxdWVzdGVkTmFtZSkpIHtcbiAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYWxsKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oYFBhY2thZ2UgJHtKU09OLnN0cmluZ2lmeShucG1QYWNrYWdlSnNvbi5yZXF1ZXN0ZWROYW1lKX0gd2FzIG5vdCBgXG4gICAgICAgICAgICAgICAgICArICdmb3VuZCBvbiB0aGUgcmVnaXN0cnkuIFNraXBwaW5nLicpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICAgICAgICAgYFBhY2thZ2UgJHtKU09OLnN0cmluZ2lmeShucG1QYWNrYWdlSnNvbi5yZXF1ZXN0ZWROYW1lKX0gd2FzIG5vdCBmb3VuZCBvbiB0aGUgYFxuICAgICAgICAgICAgICAgICAgKyAncmVnaXN0cnkuIENhbm5vdCBjb250aW51ZSBhcyB0aGlzIG1heSBiZSBhbiBlcnJvci4nKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY2Muc2V0KG5wbVBhY2thZ2VKc29uLm5hbWUsIG5wbVBhY2thZ2VKc29uKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9LFxuICAgICAgICBuZXcgTWFwPHN0cmluZywgTnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uPigpLFxuICAgICAgKSxcblxuICAgICAgbWFwKG5wbVBhY2thZ2VKc29uTWFwID0+IHtcbiAgICAgICAgLy8gQXVnbWVudCB0aGUgY29tbWFuZCBsaW5lIHBhY2thZ2UgbGlzdCB3aXRoIHBhY2thZ2VHcm91cHMgYW5kIGZvcndhcmQgcGVlciBkZXBlbmRlbmNpZXMuXG4gICAgICAgIC8vIEVhY2ggYWRkZWQgcGFja2FnZSBtYXkgdW5jb3ZlciBuZXcgcGFja2FnZSBncm91cHMgYW5kIHBlZXIgZGVwZW5kZW5jaWVzLCBzbyB3ZSBtdXN0XG4gICAgICAgIC8vIHJlcGVhdCB0aGlzIHByb2Nlc3MgdW50aWwgdGhlIHBhY2thZ2UgbGlzdCBzdGFiaWxpemVzLlxuICAgICAgICBsZXQgbGFzdFBhY2thZ2VzU2l6ZTtcbiAgICAgICAgZG8ge1xuICAgICAgICAgIGxhc3RQYWNrYWdlc1NpemUgPSBwYWNrYWdlcy5zaXplO1xuICAgICAgICAgIG5wbVBhY2thZ2VKc29uTWFwLmZvckVhY2goKG5wbVBhY2thZ2VKc29uKSA9PiB7XG4gICAgICAgICAgICBfYWRkUGFja2FnZUdyb3VwKHRyZWUsIHBhY2thZ2VzLCBhbGxEZXBlbmRlbmNpZXMsIG5wbVBhY2thZ2VKc29uLCBsb2dnZXIpO1xuICAgICAgICAgICAgX2FkZFBlZXJEZXBlbmRlbmNpZXModHJlZSwgcGFja2FnZXMsIGFsbERlcGVuZGVuY2llcywgbnBtUGFja2FnZUpzb24sIGxvZ2dlcik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gd2hpbGUgKHBhY2thZ2VzLnNpemUgPiBsYXN0UGFja2FnZXNTaXplKTtcblxuICAgICAgICAvLyBCdWlsZCB0aGUgUGFja2FnZUluZm8gZm9yIGVhY2ggbW9kdWxlLlxuICAgICAgICBjb25zdCBwYWNrYWdlSW5mb01hcCA9IG5ldyBNYXA8c3RyaW5nLCBQYWNrYWdlSW5mbz4oKTtcbiAgICAgICAgbnBtUGFja2FnZUpzb25NYXAuZm9yRWFjaCgobnBtUGFja2FnZUpzb24pID0+IHtcbiAgICAgICAgICBwYWNrYWdlSW5mb01hcC5zZXQoXG4gICAgICAgICAgICBucG1QYWNrYWdlSnNvbi5uYW1lLFxuICAgICAgICAgICAgX2J1aWxkUGFja2FnZUluZm8odHJlZSwgcGFja2FnZXMsIGFsbERlcGVuZGVuY2llcywgbnBtUGFja2FnZUpzb24sIGxvZ2dlciksXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHBhY2thZ2VJbmZvTWFwO1xuICAgICAgfSksXG5cbiAgICAgIHN3aXRjaE1hcChpbmZvTWFwID0+IHtcbiAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSBhbGwgdGhlIGluZm9ybWF0aW9uLCBjaGVjayB0aGUgZmxhZ3MuXG4gICAgICAgIGlmIChwYWNrYWdlcy5zaXplID4gMCkge1xuICAgICAgICAgIGlmIChvcHRpb25zLm1pZ3JhdGVPbmx5ICYmIG9wdGlvbnMuZnJvbSAmJiBvcHRpb25zLnBhY2thZ2VzKSB7XG4gICAgICAgICAgICByZXR1cm4gX21pZ3JhdGVPbmx5KFxuICAgICAgICAgICAgICBpbmZvTWFwLmdldChvcHRpb25zLnBhY2thZ2VzWzBdKSxcbiAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgb3B0aW9ucy5mcm9tLFxuICAgICAgICAgICAgICBvcHRpb25zLnRvLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBzdWJsb2cgPSBuZXcgbG9nZ2luZy5MZXZlbENhcExvZ2dlcihcbiAgICAgICAgICAgICd2YWxpZGF0aW9uJyxcbiAgICAgICAgICAgIGxvZ2dlci5jcmVhdGVDaGlsZCgnJyksXG4gICAgICAgICAgICAnd2FybicsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBfdmFsaWRhdGVVcGRhdGVQYWNrYWdlcyhpbmZvTWFwLCAhIW9wdGlvbnMuZm9yY2UsIHN1YmxvZyk7XG5cbiAgICAgICAgICByZXR1cm4gX3BlcmZvcm1VcGRhdGUodHJlZSwgY29udGV4dCwgaW5mb01hcCwgbG9nZ2VyLCAhIW9wdGlvbnMubWlncmF0ZU9ubHkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBfdXNhZ2VNZXNzYWdlKG9wdGlvbnMsIGluZm9NYXAsIGxvZ2dlcik7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuXG4gICAgICBzd2l0Y2hNYXAoKCkgPT4gb2YodHJlZSkpLFxuICAgICk7XG4gIH07XG59XG4iXX0=