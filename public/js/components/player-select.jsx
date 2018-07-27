import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getActiveGameId } from '../stores/game-store';
import { changePlayerId, getPlayerId } from '../stores/player-id-store';
import { getPlayerName, setPlayerName } from '../stores/player-name-store';

const propTypes = {
	changePlayerId: PropTypes.func.isRequired,
	setPlayerName: PropTypes.func.isRequired,
	playerId: PropTypes.string,
	playerName: PropTypes.string,
};

const defaultProps = {
	playerId: '',
	playerName: '',
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

	onChangePlayer() {
		this.props.setPlayerName({ playerName: '' });
		this.props.changePlayerId({ playerId: '' });
	}

	onChangePlayerName(e) {
		const name = e.target.value;
		this.setState(() => ({ playerName: name && name.replace(/\s/g, '').toUpperCase() }));
	}

	onSubmit(e) {
		e.preventDefault();
		const { playerId } = this.props;
		const { playerName } = this.state;

		if (playerName) this.props.setPlayerName({ playerName });
		this.props.changePlayerId({ playerId });
	}

	renderBeNeutralButton() {
		return (
			<button type="button" onClick={this.onChangePlayer}>
				Be neutral
			</button>
		);
	}

	renderEnterGameButton() {
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
		const button = this.props.playerId ? this.renderBeNeutralButton() : this.renderEnterGameButton();
		const text = this.props.playerId ? `You are ${this.props.playerName}` : 'You are neutral';

		return (
			<div className="player-select">
				<div className="player-display">{text}</div>
				{button}
			</div>
		);
	}
}

BasePlayerSelect.propTypes = propTypes;
BasePlayerSelect.defaultProps = defaultProps;

const mapDispatchToProps = { setPlayerName, changePlayerId };

function mapStateToProps(state) {
	const gameId = getActiveGameId(state);

	return {
		playerId: getPlayerId(state, gameId),
		playerName: getPlayerName(state),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(BasePlayerSelect);
