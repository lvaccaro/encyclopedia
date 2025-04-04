const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  //entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  mode: "development",
  //plugins: [
  //  new CopyWebpackPlugin({ patterns: ["src/index.tsx", "src/index.css", "src/App.css"] })
  //],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json', '.jsx']
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true
  },
  optimization: {
    minimize: false,
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
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      { test: /\.css$/, use: 'babel-loader' },
      { test: /\.less$/, use: 'babel-loader' },
      { test: /\.scss$/, use: 'babel-loader' }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({ patterns: ["src/index.tsx", "src/index.css", "src/App.css"] }),
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ]

};