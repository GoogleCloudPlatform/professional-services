import { HostSink } from './host';
/**
 * @deprecated Use the new virtualFs.Host classes from @angular-devkit/core.
 */
export declare class FileSystemSink extends HostSink {
    constructor(dir: string, force?: boolean);
}
