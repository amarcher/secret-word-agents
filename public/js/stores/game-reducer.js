export default function reducer(state = {}, action) {
	switch (action.type) {
	case 'INCREMENT':
		return state;
	case 'DECREMENT':
		return state;
	default:
		return state;
	}
}
