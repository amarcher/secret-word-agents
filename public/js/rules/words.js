export function isAgent(word) {
	const revealed = word.roleRevealedForClueGiver || word;
	return revealed && [revealed.playerOne, revealed.playerTwo].indexOf('AGENT') > -1;
}

export function isAssasin(word) {
	const revealed = word.roleRevealedForClueGiver || word;
	return [revealed.playerOne, revealed.playerTwo].indexOf('ASSASIN') > -1;
}

export function isNonAgent(word, playerId = '') {
	const revealed = word.roleRevealedForClueGiver || word;
	return (playerId === 'one' && revealed.playerTwo === 'NON_AGENT') ||
		(playerId === 'two' && revealed.playerOne === 'NON_AGENT') ||
		(revealed.playerOne === 'NON_AGENT' && revealed.playerTwo === 'NON_AGENT');
}

export function isGuessed(word, playerId = '') {
	return isAgent(word) || isAssasin(word) || isNonAgent(word, playerId);
}
