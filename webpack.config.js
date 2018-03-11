const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = {
	entry: './public/js/main.jsx',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'public/js')
	},
	module: {
		loaders: [{
			test: /\.jsx?$/,
			exclude: /node_modules/,
			loader: 'babel-loader',
			query: {
				presets: ['es2015', 'react', 'stage-2']
			}
		}]
	},
	resolve: {
		extensions: ['.js', '.jsx'],
	},
	plugins: [
		new CircularDependencyPlugin({
			// exclude detection of files based on a RegExp
			exclude: /node_modules/,
			// add errors to webpack instead of warnings
			failOnError: false,
			// set the current working directory for displaying module paths
			cwd: process.cwd(),
		})
	]
};
