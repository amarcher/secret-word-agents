import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import ClueView from './clue-view';
import PlayerView from './player-view';
import GameView from './game-view';
import InfoView from './info-view';
import TurnView from './turn-view';
import PlayerSelect from './player-select';
import EndTurn from './end-turn';
import { enterGame, getGame } from '../stores/game-store';
import { enableNotifications } from '../utils/notifications';

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

		enableNotifications();
		document.title = gameId;
	}

	render() {
		const { game } = this.props;

		if (!game.words) {
			return null;
		}

		return (
			<div className="container">
				<div className="header">
					<TurnView />
					<ClueView />
					<InfoView />
				</div>
				<GameView game={game} />
				<div className="player-info">
					<PlayerSelect />
					<EndTurn />
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
