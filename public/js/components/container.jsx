import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import FacebookLogin from 'react-facebook-login';

import ClueView from './clue-view';
import PlayerView from './player-view';
import GameView from './game-view';
import InfoView from './info-view';
import TurnView from './turn-view';
import PlayerSelect from './player-select';
import EndTurn from './end-turn';
import { enterGame, getGameById, getActiveGameId, getGamesViaApi } from '../stores/game-store';
import { getPlayerName, setFacebookId } from '../stores/player-name-store';
import { enableNotifications } from '../utils/notifications';

const propTypes = {
	enterGame: PropTypes.func.isRequired,
	playerName: PropTypes.string,
	gameId: PropTypes.string.isRequired,
	game: PropTypes.shape({
		gameId: PropTypes.string,
		words: PropTypes.object,
	}),
	setFacebookId: PropTypes.func.isRequired,
	getGamesViaApi: PropTypes.func.isRequired,
};

const defaultProps = {
	game: {},
	playerName: '',
};

export class BaseContainer extends Component {
	componentDidMount() {
		const { gameId, playerName } = this.props;

		this.props.enterGame({ gameId, playerName });

		enableNotifications();
		document.title = gameId;
	}

	renderHiddenFBLogin() {
		const { gameId } = this.props;

		return (
			<FacebookLogin
				appId="977527402285765"
				fields="name,picture"
				size="small"
				cssClass="facebook-login--hidden"
				icon="fa-facebook"
				callback={({ name, id, picture } = {}) => {
					const image = picture && picture.data && picture.data.url;
					const playerName = name.split(' ')[0].toUpperCase();

					this.props.setFacebookId({
						playerName,
						facebookId: id,
						facebookImage: image,
					});

					this.props.getGamesViaApi().then(() => {
						this.props.enterGame({ gameId, playerName });
					});
				}}
				textButton=""
				scope="public_profile"
				autoLoad
			/>
		);
	}

	render() {
		const { game } = this.props;

		if (!game.words) {
			return null;
		}

		return (
			<div className="container">
				{this.renderHiddenFBLogin()}
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
	const gameId = getActiveGameId(state);

	return {
		game: getGameById(state, gameId),
		gameId,
		playerName: getPlayerName(state),
	};
}

const mapDispatchToProps = {
	enterGame,
	setFacebookId,
	getGamesViaApi,
};

export default connect(mapStateToProps, mapDispatchToProps)(BaseContainer);
