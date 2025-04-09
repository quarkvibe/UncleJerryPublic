/**
 * Bundle Analyzer Configuration
 * 
 * This script allows you to analyze the size of your production bundle
 * and identify opportunities for optimization.
 */

const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpackConfigProd = require('react-scripts/config/webpack.config')('production');

// Add Bundle Analyzer plugin
webpackConfigProd.plugins.push(new BundleAnalyzerPlugin({
  analyzerMode: 'static',
  reportFilename: 'report.html',
  openAnalyzer: false,
}));

// Run webpack
webpack(webpackConfigProd, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err || stats.toString({
      colors: true,
      chunks: false, 
      errorDetails: true,
    }));
  } else {
    console.log(stats.toString({
      chunks: false,
      colors: true
    }));
    console.log('\nBundle analysis completed! Open ./report.html in your browser to see the results.');
  }
});