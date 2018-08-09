import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Word from './word';

const propTypes = {
	game: PropTypes.shape({
		gameId: PropTypes.string,
		words: PropTypes.object,
	}).isRequired,
	teamId: PropTypes.number,
};

const defaultProps = {
	teamId: undefined,
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
		const { game, teamId } = this.props;

		if (!game || !game.words) {
			return null;
		}

		const className = classNames('words', {
			[`team-${teamId}`]: !!teamId,
		});

		return (
			<div className={className}>
				{this.renderWords()}
			</div>
		);
	}
}

GameView.propTypes = propTypes;
GameView.defaultProps = defaultProps;
