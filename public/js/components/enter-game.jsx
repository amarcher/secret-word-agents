import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FacebookLogin from 'react-facebook-login';
import { connect } from 'react-redux';

import { isIOSSafari } from '../utils/helpers';
import { setPlayerName, setFacebookId, getFacebookId, getFacebookImage, getPlayerName } from '../stores/player-name-store';
import { getGames, getGamesViaApi } from '../stores/game-store';
import { history } from '../stores';
import GameSummary from './game-summary';

const propTypes = {
	setPlayerName: PropTypes.func.isRequired,
	setFacebookId: PropTypes.func.isRequired,
	getGamesViaApi: PropTypes.func.isRequired,
	playerName: PropTypes.string,
	facebookId: PropTypes.string,
	facebookImage: PropTypes.string,
	games: PropTypes.arrayOf(PropTypes.string),
};

const defaultProps = {
	playerName: undefined,
	facebookId: undefined,
	facebookImage: undefined,
	games: [],
};

const IS_IOS_SAFARI = isIOSSafari();
const IOS_DOWNLOAD_LINK = 'itms-services://?action=download-manifest&url=https://www.dooler.com/manifest.plist';

export class BaseEnterGame extends Component {
	constructor(props) {
		super(props);

		this.state = {
			gameId: '',
			name: props.playerName,
		};

		this.onSubmit = this.onSubmit.bind(this);
		this.onChangeGameId = this.onChangeGameId.bind(this);
		this.onChangeName = this.onChangeName.bind(this);
	}

	componentDidMount() {
		this.props.getGamesViaApi();
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.playerName !== this.state.name) {
			this.setState(() => ({ name: nextProps.playerName }));
		}
	}

	onChangeGameId(e) {
		const gameId = e.target.value;
		this.setState(() => ({ gameId: gameId && gameId.replace(/\s/g, '').toUpperCase() }));
	}

	onChangeName(e) {
		const name = e.target.value;
		this.setState(() => ({ name: name && name.replace(/\s/g, '').toUpperCase() }));
	}

	onSubmit(e) {
		e.preventDefault();
		const { gameId, name } = this.state;

		if (!gameId) return;

		if (name) this.props.setPlayerName({ playerName: name });
		history.push(`/${gameId}`);
	}

	renderDownloadOnIOSLink() {
		if (!IS_IOS_SAFARI) return null;

		return (
			<div>
				<a href={IOS_DOWNLOAD_LINK}>
					Download on iOS
				</a>
			</div>
		);
	}

	renderFacebookLoginButton() {
		const { facebookId, facebookImage } = this.props;

		if (facebookId) {
			return (
				<button
					type="button"
					className="facebook-login"
					onClick={() => {
						this.props.setFacebookId({
							facebookId: undefined,
							facebookImage: undefined,
						});
						this.props.getGamesViaApi();
					}}
					style={{ background: `url("${facebookImage}")` }}
				/>
			);
		}

		return (
			<FacebookLogin
				appId="977527402285765"
				fields="name,picture"
				size="small"
				cssClass="facebook-login"
				icon="fa-facebook"
				callback={({ name, id, picture } = {}) => {
					const image = picture && picture.data && picture.data.url;

					this.props.setFacebookId({
						playerName: name.split(' ')[0].toUpperCase(),
						facebookId: id,
						facebookImage: image,
					});
					this.props.getGamesViaApi();
				}}
				textButton=""
				scope="public_profile"
				autoLoad
			/>
		);
	}

	renderGameSummaries() {
		const { games } = this.props;

		if (!games || !games.length) return null;

		const gameSummaries = games.map(gameId => (
			<GameSummary gameId={gameId} key={gameId} />
		));

		return (
			<div className="game-summary-section">
				<span>Rejoin an existing game:</span>
				{gameSummaries}
			</div>
		);
	}

	render() {
		const { gameId, name } = this.state;

		return (
			<div className="enter-game-container">
				<div className="header header-flex-end">
					<div className="player-select">
						{this.renderFacebookLoginButton()}
					</div>
				</div>
				<div className="enter-game-subcontainer">
					<div className="enter-game">
						<h1 className="title">Dooler</h1>
						<form onSubmit={this.onSubmit}>
							<input
								className="enter-game-input"
								placeholder="Game Code"
								onChange={this.onChangeGameId}
								value={gameId}
							/>
							<input
								className="enter-name-input"
								placeholder="Your Name"
								onChange={this.onChangeName}
								value={name}
							/>
							<div>
								<button className="enter-game-button" type="submit" disabled={!this.state.gameId}>
									Enter
								</button>
							</div>
						</form>

						{this.renderGameSummaries()}
					</div>
					{this.renderDownloadOnIOSLink()}
				</div>
			</div>
		);
	}
}

BaseEnterGame.propTypes = propTypes;
BaseEnterGame.defaultProps = defaultProps;

const mapStateToProps = (state) => {
	const playerName = getPlayerName(state);
	const facebookId = getFacebookId(state);
	const facebookImage = getFacebookImage(state);
	const games = getGames(state);

	return {
		playerName,
		facebookId,
		facebookImage,
		games,
	};
};

const mapDispatchToProps = {
	setPlayerName,
	setFacebookId,
	getGamesViaApi,
};

export default connect(mapStateToProps, mapDispatchToProps)(BaseEnterGame);
