const path = require('path');

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
				presets: ['es2015', 'react']
			}
		}]
	},
	resolve: {
		extensions: ['.js', '.jsx'],
	}
};
