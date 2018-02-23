import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import PlayerView from './player-view';
import GameView from './game-view';
import PlayerSelect from './player-select';
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

export class BaseContainer extends Component {
	componentDidMount() {
		const { gameId } = this.props;

		this.props.enterGame({ gameId });
	}

	render() {
		const { game } = this.props;

		if (!game.words) {
			return null;
		}

		return (
			<div className="container">
				<GameView game={game} />
				<div className="player-info">
					<PlayerSelect />
					<PlayerView />
				</div>
			</div>
		);
	}
}

BaseContainer.propTypes = propTypes;
BaseContainer.defaultProps = defaultProps;

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

export default connect(mapStateToProps, mapDispatchToProps)(BaseContainer);