/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { IOptions, ProgramAwareRuleWalker, RuleFailure, Rules } from 'tslint';
import * as ts from 'typescript';
import { PropertyNameUpgradeData } from '../../data/property-names';
/**
 * Rule that identifies class declarations that extend CDK or Material classes and had
 * a public property change.
 */
export declare class Rule extends Rules.TypedRule {
    applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): RuleFailure[];
}
export declare class Walker extends ProgramAwareRuleWalker {
    /**
     * Map of classes that have been updated. Each class name maps to the according property
     * change data.
     */
    propertyNames: Map<string, PropertyNameUpgradeData>;
    constructor(sourceFile: ts.SourceFile, options: IOptions, program: ts.Program);
    visitClassDeclaration(node: ts.ClassDeclaration): void;
}
