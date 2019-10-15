import { WebpackConfigOptions } from '../build-options';
export declare const buildOptimizerLoader: string;
export declare function getCommonConfig(wco: WebpackConfigOptions): {
    mode: string;
    devtool: boolean;
    resolve: {
        extensions: string[];
        symlinks: boolean;
        modules: string[];
        alias: {};
    };
    resolveLoader: {
        modules: string[];
    };
    context: string;
    entry: {
        [key: string]: string[];
    };
    output: {
        path: string;
        publicPath: string | undefined;
        filename: string;
    };
    watch: boolean | undefined;
    watchOptions: {
        poll: number | undefined;
    };
    performance: {
        hints: boolean;
    };
    module: {
        rules: ({
            test: RegExp;
            loader: string;
            options?: undefined;
            parser?: undefined;
        } | {
            test: RegExp;
            loader: string;
            options: {
                name: string;
            };
            parser?: undefined;
        } | {
            test: RegExp;
            parser: {
                system: boolean;
            };
            loader?: undefined;
            options?: undefined;
        } | {
            test: RegExp;
            loader?: undefined;
            options?: undefined;
            parser?: undefined;
        } | {
            use: {
                loader: string;
                options: {
                    sourceMap: boolean | undefined;
                };
            }[];
            test: RegExp;
            loader?: undefined;
            options?: undefined;
            parser?: undefined;
        } | {
            test: RegExp;
            exclude: RegExp;
            enforce: string;
            loader?: undefined;
            options?: undefined;
            parser?: undefined;
        } | {
            use: {
                loader: string;
            }[];
            test: RegExp;
            exclude: RegExp;
            enforce: string;
            loader?: undefined;
            options?: undefined;
            parser?: undefined;
        })[];
    };
    optimization: {
        noEmitOnErrors: boolean;
        minimizer: any[];
    };
    plugins: any[];
};
