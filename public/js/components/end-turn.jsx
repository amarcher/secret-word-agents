import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { endTurn, getGuessesLeftForGameId, getTurnsLeftForGameId } from '../stores/turns-store';
import { getTeamId } from '../stores/team-id-store';
import { getActiveGameId } from '../stores/game-store';

const propTypes = {
	endTurn: PropTypes.func.isRequired,
	teamId: PropTypes.string,
	guessesLeft: PropTypes.number,
	turnsLeft: PropTypes.number,
};

const defaultProps = {
	teamId: undefined,
	guessesLeft: undefined,
	turnsLeft: 0,
};

export class BaseEndTurn extends Component {
	render() {
		if (!this.props.teamId || this.props.guessesLeft === 0 || this.props.turnsLeft < 1) return null;

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
		teamId: getTeamId(state, gameId),
		turnsLeft: getTurnsLeftForGameId(state, gameId),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(BaseEndTurn);
