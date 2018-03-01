import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getTurnsLeft } from '../stores/turns-store';

const propTypes = {
	turnsLeft: PropTypes.number.isRequired,
};

export class BaseTurnView extends Component {
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
			</div>
		);
	}
}

BaseTurnView.propTypes = propTypes;

function mapStateToProps(state) {
	return {
		turnsLeft: getTurnsLeft(state),
	};
}

export default connect(mapStateToProps)(BaseTurnView);
