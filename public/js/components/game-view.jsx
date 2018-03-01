import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Word from './word';

const propTypes = {
	game: PropTypes.shape({
		gameId: PropTypes.string,
		words: PropTypes.object,
	}).isRequired,
};

export default class GameView extends Component {
	renderWords() {
		const { game } = this.props;

		return Object.keys(game.words).map(word => (
			<Word
				word={word}
				guessedThisTurn={game.words[word].guessedThisTurn}
				role={game.words[word].role}
				revealed={game.words[word].roleRevealedForClueGiver}
				key={word}
			/>
		));
	}

	render() {
		if (!this.props.game.words) {
			return null;
		}

		return (
			<div className="words">
				{this.renderWords()}
			</div>
		);
	}
}

GameView.propTypes = propTypes;
