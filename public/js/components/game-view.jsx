import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Word from './word';
import { enterGame, getGame } from '../stores/game-store';

const propTypes = {
	enterGame: PropTypes.func.isRequired,
	gameId: PropTypes.string.isRequired,
	game: PropTypes.shape({
		gameId: PropTypes.string,
		words: PropTypes.object,
	}),
};

const defaultProps = {
	game: {},
};

export class BaseGameView extends Component {
	componentDidMount() {
		const { game, gameId } = this.props;

		if (!game.gameId || game.gameId !== gameId) {
			this.props.enterGame({ gameId });
		}
	}

	renderWords() {
		const { game } = this.props;

		return Object.keys(game.words).map(word => (
			<Word word={word} revealed={game.words[word]} key={word} />
		));
	}

	render() {
		if (!this.props.game.words) {
			return null;
		}

		return (
			<div>
				{this.renderWords()}
			</div>
		);
	}
}

BaseGameView.propTypes = propTypes;
BaseGameView.defaultProps = defaultProps;

function mapStateToProps(state) {
	const gameId = state.router.location.pathname.replace('/', '');

	return {
		game: getGame(state),
		gameId,
	};
}

const mapDispatchToProps = {
	enterGame,
};

export default connect(mapStateToProps, mapDispatchToProps)(BaseGameView);
