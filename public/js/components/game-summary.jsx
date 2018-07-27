import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { history } from '../stores';
import { getGameById } from '../stores/game-store';

const propTypes = {
	gameId: PropTypes.string,
};

const defaultProps = {
	gameId: '',
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

	render() {
		const { gameId } = this.props;

		return (
			<button
				className="game-summary"
				type="button"
				onClick={this.onPress}
			>
				{gameId}
			</button>
		);
	}
}

BaseGameSummary.propTypes = propTypes;
BaseGameSummary.defaultProps = defaultProps;

const mapStateToProps = (state, { gameId } = {}) => {
	const game = getGameById(state, gameId);

	return {
		...game,
	};
};

export default connect(mapStateToProps)(BaseGameSummary);
