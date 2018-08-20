import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { history } from '../stores';
import { getClueForGameId, getTurnsLeftForGameId } from '../stores/turns-store';
import { exitGame } from '../stores/game-store';

const propTypes = {
	gameId: PropTypes.string.isRequired,
	clue: PropTypes.shape({
		word: PropTypes.string,
		number: PropTypes.number,
	}),
	turnsLeft: PropTypes.number,
	exitGame: PropTypes.func.isRequired,
};

const defaultProps = {
	clue: {},
	turnsLeft: 0,
};

export class BaseGameSummary extends Component {
	constructor(props) {
		super(props);

		this.onPress = this.onPress.bind(this);
		this.onConfirmLeave = this.onConfirmLeave.bind(this);
	}

	onPress() {
		const { gameId } = this.props;

		history.push(`/${gameId}`);
	}

	onConfirmLeave() {
		const { gameId } = this.props;

		this.props.exitGame({ gameId });
	}

	renderClue() {
		const { clue } = this.props;

		if (!clue || !clue.word) return null;

		return (
			<span className="small-text"> {clue.word} - {clue.number}</span>
		);
	}

	render() {
		const { gameId } = this.props;
		const turnsLeft = Math.max(this.props.turnsLeft, 0);

		const turnsLeftText = `${turnsLeft} TURN${turnsLeft !== 1 ? 'S' : ''} LEFT`;

		return (
			<div className="game-summary">
				<button
					className="game-summary-button"
					type="button"
					onClick={this.onPress}
				>
					<div>{gameId}</div>
					<div className="game-summary-details">
						<span className="small-text">{turnsLeftText}</span>
						{this.renderClue()}
					</div>
				</button>
				<button className="game-summary-leave-button" onClick={this.onConfirmLeave}>
					x
				</button>
			</div>
		);
	}
}

BaseGameSummary.propTypes = propTypes;
BaseGameSummary.defaultProps = defaultProps;

const mapDispatchToProps = {
	exitGame,
};

const mapStateToProps = (state, ownProps) => {
	const { gameId } = ownProps;

	const turnsLeft = getTurnsLeftForGameId(state, gameId);
	const clue = getClueForGameId(state, gameId);

	return {
		clue,
		turnsLeft,
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(BaseGameSummary);
