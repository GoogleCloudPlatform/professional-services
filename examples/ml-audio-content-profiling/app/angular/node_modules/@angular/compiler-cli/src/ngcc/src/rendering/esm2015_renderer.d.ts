/// <amd-module name="@angular/compiler-cli/src/ngcc/src/rendering/esm2015_renderer" />
import * as ts from 'typescript';
import { DecorationAnalysis } from '../analysis/decoration_analyzer';
import { SwitchMarkerAnalysis } from '../analysis/switch_marker_analyzer';
import { DtsMapper } from '../host/dts_mapper';
import { NgccReflectionHost } from '../host/ngcc_host';
import { Fesm2015Renderer } from './fesm2015_renderer';
import { FileInfo } from './renderer';
export declare class Esm2015Renderer extends Fesm2015Renderer {
    protected host: NgccReflectionHost;
    protected isCore: boolean;
    protected rewriteCoreImportsTo: ts.SourceFile | null;
    protected sourcePath: string;
    protected targetPath: string;
    protected dtsMapper: DtsMapper;
    constructor(host: NgccReflectionHost, isCore: boolean, rewriteCoreImportsTo: ts.SourceFile | null, sourcePath: string, targetPath: string, dtsMapper: DtsMapper);
    renderFile(sourceFile: ts.SourceFile, decorationAnalysis: DecorationAnalysis | undefined, switchMarkerAnalysis: SwitchMarkerAnalysis | undefined, targetPath: string): FileInfo[];
}
