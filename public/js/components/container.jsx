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
import { enterGame, getGameById, getActiveGameId } from '../stores/game-store';
import { getTeamId } from '../stores/team-id-store';
import { getPlayerName } from '../stores/player-name-store';
import { enableNotifications } from '../utils/notifications';

const propTypes = {
	enterGame: PropTypes.func.isRequired,
	playerName: PropTypes.string,
	gameId: PropTypes.string.isRequired,
	game: PropTypes.shape({
		gameId: PropTypes.string,
		words: PropTypes.object,
	}),
	teamId: PropTypes.number,
};

const defaultProps = {
	game: {},
	playerName: '',
	teamId: undefined,
};

export class BaseContainer extends Component {
	componentDidMount() {
		const { gameId, playerName } = this.props;

		this.props.enterGame({ gameId, playerName });

		enableNotifications();
		document.title = gameId;
	}

	render() {
		const { game, teamId } = this.props;

		if (!game.words) {
			return null;
		}

		return (
			<div className="container">
				<div className="header">
					<InfoView />
					<ClueView />
					<PlayerSelect />
				</div>
				<GameView game={game} teamId={teamId} />
				<div className="player-info">
					<TurnView />
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
	const gameId = getActiveGameId(state);

	return {
		game: getGameById(state, gameId),
		gameId,
		teamId: getTeamId(state, gameId),
		playerName: getPlayerName(state),
	};
}

const mapDispatchToProps = {
	enterGame,
};

export default connect(mapStateToProps, mapDispatchToProps)(BaseContainer);
