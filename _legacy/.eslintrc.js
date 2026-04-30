module.exports = {
	"extends": "airbnb",
	"rules": {
		"indent": ["error", "tab"],
		"no-tabs": "off",
		"import/prefer-default-export": "off",
		"react/jsx-indent": ["error", "tab"],
		"react/jsx-indent-props": ["error", "tab"],
		"class-methods-use-this": "off",
		"max-len": ["error", 150, 8, {
			"ignoreUrls": true,
			"ignoreComments": true,
			"ignoreRegExpLiterals": true,
			"ignoreStrings": true,
			"ignoreTemplateLiterals": true
		}],
		"react/prefer-stateless-function": "off"
	},
	"env": {
		"browser": true
	},
	"plugins": [
		"react"
	],
	"parserOptions": {
		"ecmaFeatures": {
			"jsx": true
		}
	}
};
