const path = require('path');
const webpack = require('webpack');

// Makes the .vue file format parseable.
const {VueLoaderPlugin} = require('vue-loader');
// Compresses resources for smaller download.
const CompressionPlugin = require('compression-webpack-plugin');
// // Speeds up typescript type checking into a separate process.
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
// Enables the tsconfig-paths behavior in webpack. tsconfig-paths is responsible for the
// import mapping that often begins with @.
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const zlib = require('zlib');

const prod = process.env.NODE_ENV === 'production';

module.exports = (env = {}) => ({
  // devtool: 'source-map',
  // mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  // devtool: env.prod ? 'source-map' : 'cheap-module-eval-source-map',
  devtool: 'source-map',
  mode: env.prod ? 'production' : 'development',
  // entry: './src/client/main.ts',
  entry: [
    require.resolve(`webpack-dev-server/client`),
    // path.resolve(__dirname, './src/main.ts'),
  ].filter(Boolean),
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    extensions: ['.ts', '.vue', '.js'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      'vue': '@vue/compat',
    },
    fallback: {
      util: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          compilerOptions: {
            compatConfig: {
              MODE: 2,
            },
          },
        },
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {appendTsSuffixTo: [/\.vue$/], transpileOnly: true},
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader?url=false'],
      },
      {
        test: /\.less$/,
        use: ['vue-style-loader', 'css-loader?url=false', 'less-loader'],
      },
    ],
  },
  plugins: [
    // new ForkTsCheckerWebpackPlugin({
    //   typescript: {
    //     configOverwrite: {
    //       exclude: [
    //         'tests/**/*.ts',
    //       ],
    //     },
    //     extensions: {
    //       vue: true,
    //     },
    //   },
    // }),
    new VueLoaderPlugin(),
    ...(prod ? [
      // Why is this included twice?
      new CompressionPlugin(),
      new CompressionPlugin({
        algorithm: 'brotliCompress',
        filename: '[path][base].br',
        compressionOptions: {params: {[zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY}},
      }),
    ] : [
      // Reports progress on the commandline during compilation.
      new webpack.ProgressPlugin(),
    ]),
  ],
  output: {
    path: __dirname + '/build',
  },
});
