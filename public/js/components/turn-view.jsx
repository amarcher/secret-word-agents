import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getTurnsLeftForGameId } from '../stores/turns-store';
import { getAgentsLeftForGameId, getActiveGameId } from '../stores/game-store';

const propTypes = {
	agentsLeft: PropTypes.number.isRequired,
	turnsLeft: PropTypes.number.isRequired,
};

export class BaseTurnView extends Component {
	maybeRenderWin() {
		if (this.props.agentsLeft !== 0) return null;

		return (
			<div className="you-win">You Win!</div>
		);
	}

	renderTurns() {
		const turnsLeft = Math.max(this.props.turnsLeft, 0);

		if (turnsLeft < 1) {
			return (
				<div className="game-over">Game Over</div>
			);
		}

		return Array(turnsLeft).fill().map((_el, index) => (
			<div className="turn" key={index} /> // eslint-disable-line react/no-array-index-key
		));
	}

	render() {
		return (
			<div className="turn-view">
				<div className="turns-left">
					{this.renderTurns()}
				</div>
				{this.maybeRenderWin()}
			</div>
		);
	}
}

BaseTurnView.propTypes = propTypes;

function mapStateToProps(state) {
	const gameId = getActiveGameId(state);

	return {
		turnsLeft: getTurnsLeftForGameId(state, gameId),
		agentsLeft: getAgentsLeftForGameId(state, gameId),
	};
}

export default connect(mapStateToProps)(BaseTurnView);
