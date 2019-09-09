import * as postcss from 'postcss';
import * as webpack from 'webpack';
export interface PostcssCliResourcesOptions {
    baseHref?: string;
    deployUrl?: string;
    filename: string;
    loader: webpack.loader.LoaderContext;
}
declare const _default: postcss.Plugin<PostcssCliResourcesOptions>;
export default _default;
