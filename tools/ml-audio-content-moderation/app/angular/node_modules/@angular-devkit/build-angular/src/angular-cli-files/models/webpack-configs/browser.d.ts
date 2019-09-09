import { WebpackConfigOptions } from '../build-options';
export declare function getBrowserConfig(wco: WebpackConfigOptions): {
    devtool: string | boolean;
    resolve: {
        mainFields: string[];
    };
    output: {
        crossOriginLoading: string | boolean;
    };
    optimization: {
        runtimeChunk: string;
        splitChunks: {
            maxAsyncRequests: number;
            cacheGroups: {
                default: false | {
                    chunks: string;
                    minChunks: number;
                    priority: number;
                } | undefined;
                common: false | {
                    name: string;
                    chunks: string;
                    minChunks: number;
                    enforce: boolean;
                    priority: number;
                } | undefined;
                vendors: boolean;
                vendor: false | {
                    name: string;
                    chunks: string;
                    enforce: boolean;
                    test: (module: {
                        nameForCondition?: Function | undefined;
                    }, chunks: {
                        name: string;
                    }[]) => boolean;
                } | undefined;
            };
        };
    };
    plugins: any[];
    node: boolean;
};
