const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports  = (env, options) => 
{
  return {
  mode: options.mode,
  target: "web",
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json', '.jsx']
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true
  },
  optimization: {
    minimize: true,
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false, // disable the behaviour
        }
      },  
      {
        test: /\.(ts|tsx|.js)$/,
        exclude: [/node_modules/, /scripts/],
        use: 'babel-loader'
      },
      { test: /\.css$/, use: 'babel-loader' },
      { test: /\.less$/, use: 'babel-loader' },
      { test: /\.scss$/, use: 'babel-loader' }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({patterns: [
      { from: "./public/assets", to: "assets" },
      { from: "./public/icons", to: "icons" },
    ]}),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: true,
      minify: true
    })
  ]
  }
};