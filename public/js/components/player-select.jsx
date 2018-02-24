import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { changePlayerId, getPlayerId } from '../stores/player-id-store';

const PLAYERS = {
	ONE: 'one',
	TWO: 'two',
	NEUTRAL: '',
};

const propTypes = {
	changePlayerId: PropTypes.func.isRequired,
	playerId: PropTypes.string,
};

const defaultProps = {
	playerId: PLAYERS.NEUTRAL,
};

export class BasePlayerSelect extends Component {
	renderButton(playerId) {
		const text = playerId ? `Be player ${playerId}` : 'Be neutral';

		return (
			<button type="button" onClick={() => this.props.changePlayerId({ playerId })} key={`player${playerId}`}>
				{text}
			</button>
		);
	}

	render() {
		const buttons = this.props.playerId ? this.renderButton(PLAYERS.NEUTRAL) : [PLAYERS.ONE, PLAYERS.TWO].map(this.renderButton, this);
		const text = this.props.playerId ? `You are player ${this.props.playerId}` : 'Choose a player';

		return (
			<div className="player-select">
				<div className="player-display">{text}</div>
				{buttons}
			</div>
		);
	}
}

BasePlayerSelect.propTypes = propTypes;
BasePlayerSelect.defaultProps = defaultProps;

const mapDispatchToProps = { changePlayerId };

function mapStateToProps(state) {
	return {
		playerId: getPlayerId(state),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(BasePlayerSelect);
