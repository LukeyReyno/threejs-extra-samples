require('ts-node/register');

import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

const example_pages = ['webxr_xr_cubes', 'webxr_xr_equirect_layer'];

module.exports = (env: any, argv: Record<string, any>) => {
  const isProduction = argv.mode === 'production';

  // Handle example ts sources and html plugins
  const exampleEntries: Record<string, string> = {};
  const exampleHtmlPlugins: HtmlWebpackPlugin[] = [];
  example_pages.forEach((example: string) => {
    exampleEntries[example] = `./examples/src/${example}.ts`;
    exampleHtmlPlugins.push(
      new HtmlWebpackPlugin({
        template: `./examples/${example}.html`,
        filename: `examples/${example}.html`,
        chunks: [example],
      }),
    );
  });

  // Handle assets in examples (Excluding src folder)
  const exampleAssetFolders = fs.readdirSync('./examples').filter((folder: string) => {
    const folderPath = path.join('./examples', folder);
    return fs.statSync(folderPath).isDirectory() && folder !== 'src';
  });
  const copyAssetFoldersPatterns = exampleAssetFolders.map((folder: string) => ({
    from: path.join('./examples', folder),
    to: path.join('examples', folder),
  }));

  return {
    entry: {
      example_index: './examples/src/index.ts',
      ...exampleEntries,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      filename: isProduction ? 'bundle.[contenthash].js' : '[name].bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true, // Clean the output directory before emit
    },
    performance: {
      hints: false,
    },
    mode: isProduction ? 'production' : 'development',
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode),
      }),
      new CopyPlugin({
        patterns: [
          {
            from: './index.html',
            to: 'index.html',
          },
          {
            from: './files',
            to: 'files',
          },
          {
            from: './examples/!(*.html)',
            to: 'examples/[name][ext]',
          },
          ...copyAssetFoldersPatterns,
        ],
      }),
      new HtmlWebpackPlugin({
        template: './examples/index.html',
        filename: 'examples/index.html',
        chunks: ['example_index'],
      }),
      ...exampleHtmlPlugins,
    ],
    devServer: {
      server: 'https',
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      hot: !isProduction,
      liveReload: !isProduction,
      webSocketServer: false,
      port: 8080,
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          extractComments: false,
          exclude: /(node_modules$)/,
          terserOptions: {
            mangle: isProduction,
            sourceMap: !isProduction,
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
      },
    },
  };
};
