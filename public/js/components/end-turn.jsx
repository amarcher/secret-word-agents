import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { endTurn, getGuessesLeftForGameId, getTurnsLeftForGameId } from '../stores/turns-store';
import { getPlayerId } from '../stores/player-id-store';
import { getActiveGameId } from '../stores/game-store';

const propTypes = {
	endTurn: PropTypes.func.isRequired,
	playerId: PropTypes.string,
	guessesLeft: PropTypes.number,
	turnsLeft: PropTypes.number,
};

const defaultProps = {
	playerId: undefined,
	guessesLeft: undefined,
	turnsLeft: 0,
};

export class BaseEndTurn extends Component {
	render() {
		if (!this.props.playerId || this.props.guessesLeft === 0 || this.props.turnsLeft < 1) return null;

		return (
			<button className="end-turn" type="button" onClick={this.props.endTurn}>
				End Turn
			</button>
		);
	}
}

BaseEndTurn.propTypes = propTypes;
BaseEndTurn.defaultProps = defaultProps;

const mapDispatchToProps = { endTurn };

function mapStateToProps(state) {
	const gameId = getActiveGameId(state);

	return {
		guessesLeft: getGuessesLeftForGameId(state, gameId),
		playerId: getPlayerId(state, gameId),
		turnsLeft: getTurnsLeftForGameId(state, gameId),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(BaseEndTurn);
