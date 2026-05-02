export function isAgent(word) {
	const revealed = word.roleRevealedForClueGiver || word;
	return revealed && [revealed.playerOne, revealed.playerTwo].indexOf('AGENT') > -1;
}

export function isAssasin(word) {
	const revealed = word.roleRevealedForClueGiver || word;
	return [revealed.playerOne, revealed.playerTwo].indexOf('ASSASIN') > -1;
}

export function isNonAgent(word, teamId = '') {
	const revealed = word.roleRevealedForClueGiver || word;
	return (teamId === 'one' && revealed.playerTwo === 'NON_AGENT') ||
		(teamId === 'two' && revealed.playerOne === 'NON_AGENT') ||
		(revealed.playerOne === 'NON_AGENT' && revealed.playerTwo === 'NON_AGENT');
}

export function isGuessed(word, teamId = '') {
	return isAgent(word) || isAssasin(word) || isNonAgent(word, teamId);
}
