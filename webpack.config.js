const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode:'development',
  entry: './src/main.ts',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
  },
    experiments:{syncWebAssembly: true},
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Dev',
      template:'./index.html'
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/sync'
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean:true,
  },
};
