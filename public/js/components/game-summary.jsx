import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { history } from '../stores';
import { getClueForGameId, getTurnsLeftForGameId } from '../stores/turns-store';

const propTypes = {
	gameId: PropTypes.string.isRequired,
	clue: PropTypes.shape({
		word: PropTypes.string,
		number: PropTypes.number,
	}),
	turnsLeft: PropTypes.number,
};

const defaultProps = {
	clue: {},
	turnsLeft: 0,
};

export class BaseGameSummary extends Component {
	constructor(props) {
		super(props);

		this.onPress = this.onPress.bind(this);
	}

	onPress() {
		const { gameId } = this.props;

		history.push(`/${gameId}`);
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
			<button
				className="game-summary"
				type="button"
				onClick={this.onPress}
			>
				<div>{gameId}</div>
				<div className="game-summary-details">
					<span className="small-text">{turnsLeftText}</span>
					{this.renderClue()}
				</div>
			</button>
		);
	}
}

BaseGameSummary.propTypes = propTypes;
BaseGameSummary.defaultProps = defaultProps;

const mapStateToProps = (state, ownProps) => {
	const { gameId } = ownProps;

	const turnsLeft = getTurnsLeftForGameId(state, gameId);
	const clue = getClueForGameId(state, gameId);

	return {
		clue,
		turnsLeft,
	};
};

export default connect(mapStateToProps)(BaseGameSummary);
