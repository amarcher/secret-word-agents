import 'whatwg-fetch';

function stringify(params) {
	return Object.keys(params).map(key => `${key}=${typeof params[key] === 'undefined' ? '' : params[key]}`).join('&');
}

function parseJSONorThrow(resp) {
	if (resp.status === 204) {
		return null;
	} else if (resp.status !== 500) {
		return resp.json();
	}

	throw resp;
}

const Ajax = {
	get(url, params = {}) {
		return fetch(`${url}?${stringify(params)}`)
			.then(parseJSONorThrow);
	},

	post(url, params = {}) {
		return fetch(url, {
			method: 'post',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
			},
			body: stringify(params),
		}).then(parseJSONorThrow);
	},
};

module.exports = Ajax;
