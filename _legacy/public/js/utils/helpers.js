export function noop() {}

export function isIOSSafari() {
	const ua = window.navigator.userAgent;
	const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
	const webkit = !!ua.match(/WebKit/i);

	return iOS && webkit && !ua.match(/CriOS/i);
}

export function debounce(func, wait) {
	let timeout = null;
	let resolves = [];

	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			// Get the result of func, then call every pending resolve function with it
			const result = func(...args);
			resolves.forEach(r => r(result));
			resolves = [];
		}, wait);

		return new Promise(resolve => resolves.push(resolve));
	};
}
