import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import FacebookLogin from 'react-facebook-login';
import { connect } from 'react-redux';

import { setPlayerName, setFacebookId } from '../stores/actions';
import { getActiveGameId } from '../stores/game-store';
import { changeTeamId, getTeamId } from '../stores/team-id-store';
import { getPlayerName, getFacebookId, getFacebookImage, changePlayerDetails } from '../stores/player-name-store';

const propTypes = {
	changeTeamId: PropTypes.func.isRequired,
	setPlayerName: PropTypes.func.isRequired,
	teamId: PropTypes.string,
	playerName: PropTypes.string,
	facebookId: PropTypes.string,
	facebookImage: PropTypes.string,
	setFacebookId: PropTypes.func.isRequired,
	changePlayerDetails: PropTypes.func.isRequired,
};

const defaultProps = {
	teamId: '',
	playerName: '',
	facebookId: undefined,
	facebookImage: undefined,
};

export class BasePlayerSelect extends Component {
	constructor(props) {
		super(props);

		this.state = {
			playerName: props.playerName,
		};

		this.onChangePlayer = this.onChangePlayer.bind(this);
		this.onChangePlayerName = this.onChangePlayerName.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.playerName && !this.state.playerName) {
			this.setState(() => ({ playerName: nextProps.playerName }));
		}
	}

	onChangePlayer() {
		this.props.setPlayerName({ playerName: '' });
		this.props.changeTeamId({ teamId: '' });
	}

	onChangePlayerName(e) {
		const name = e.target.value;
		this.setState(() => ({ playerName: name && name.replace(/\s/g, '').toUpperCase() }));
	}

	onSubmit(e) {
		e.preventDefault();
		const { playerName } = this.state;

		if (playerName) this.props.setPlayerName({ playerName });
		this.props.changePlayerDetails({ playerName });
	}

	renderBeNeutralButton() {
		if (!this.props.teamId) return null;

		return (
			<button type="button" onClick={this.onChangePlayer}>
				Be neutral
			</button>
		);
	}

	renderEnterGameButton() {
		if (this.props.teamId) return null;

		return (
			<button type="button" onClick={this.onChangePlayer}>
				Enter game
			</button>
		);
	}

	renderFacebookLoginButton() {
		const { facebookId, facebookImage } = this.props;

		if (facebookId) {
			return (
				<button
					type="button"
					className="facebook-login facebook-login--static"
					onClick={() => {
						this.props.setFacebookId({
							facebookId: undefined,
							facebookImage: undefined,
						});
						// this.props.getGamesViaApi();
					}}
					style={{ background: `url("${facebookImage}")` }}
				/>
			);
		}

		return (
			<Fragment>
				{this.renderInput()}
				<FacebookLogin
					appId="977527402285765"
					fields="name,picture"
					size="small"
					cssClass="facebook-login facebook-login--static"
					icon="fa-facebook"
					callback={({ name, id, picture } = {}) => {
						const image = picture && picture.data && picture.data.url;

						const playerName = name.split(' ')[0].toUpperCase();

						this.props.setFacebookId({
							playerName,
							facebookId: id,
							facebookImage: image,
						});

						this.props.changePlayerDetails({
							playerName,
							facebookId: id,
							facebookImage: image,
						});
					}}
					textButton=""
					scope="public_profile"
					autoLoad
				/>
			</Fragment>
		);
	}

	renderInput() {
		return (
			<form onSubmit={this.onSubmit}>
				<div className="player-select-enter-game">
					<input
						className="enter-name-input"
						placeholder="Enter Name To Join"
						onChange={this.onChangePlayerName}
						value={this.state.playerName}
					/>
				</div>
			</form>
		);
	}

	render() {
		return (
			<div className="player-select">
				{this.renderFacebookLoginButton()}
			</div>
		);
	}
}

BasePlayerSelect.propTypes = propTypes;
BasePlayerSelect.defaultProps = defaultProps;

const mapDispatchToProps = {
	setPlayerName,
	changeTeamId,
	setFacebookId,
	changePlayerDetails,
};

function mapStateToProps(state) {
	const gameId = getActiveGameId(state);

	return {
		teamId: getTeamId(state, gameId),
		playerName: getPlayerName(state),
		facebookId: getFacebookId(state),
		facebookImage: getFacebookImage(state),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(BasePlayerSelect);
