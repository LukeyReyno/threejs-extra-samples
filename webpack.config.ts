require('ts-node/register');

import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

module.exports = (env: any, argv: Record<string, any>) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      example_index: './examples/src/index.ts',
      webxr_xr_cubes: './examples/src/webxr_xr_cubes.ts'
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
      filename: isProduction ? 'bundle.[contenthash].js' : 'bundle.js',
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
            from: './files',
            to: 'files',
          },
          {
            from: './examples/files',
            to: 'examples/files',
          },
          {
            from: './examples/screenshots',
            to: 'examples/screenshots',
          },
          {
            from: './examples/!(*.html)',
            to: 'examples/[name][ext]',
          },
        ],
      }),
      new HtmlWebpackPlugin({
        template: './examples/index.html',
        filename: 'examples/index.html',
        chunks: ['example_index'],
      }),
      new HtmlWebpackPlugin({
        template: './examples/webxr_xr_cubes.html',
        filename: 'examples/webxr_xr_cubes.html',
        chunks: ['webxr_xr_cubes'],
      }),
    ],
    devServer: {
      server: 'https',
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      hot: !isProduction,
      liveReload: !isProduction,
      webSocketServer: !isProduction,
      port: 9000,
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
