import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getConnectedPlayerNames } from '../stores/players-store';

const propTypes = {
	players: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export class BasePlayerView extends Component {
	renderPlayers() {
		return this.props.players.map((player, index) => (
			// eslint-disable-next-line react/no-array-index-key
			<div className="player" key={index}>
				<span className="player-name">{player}</span>
			</div>
		));
	}

	render() {
		return (
			<div className="players">
				{this.renderPlayers()}
			</div>
		);
	}
}

BasePlayerView.propTypes = propTypes;

function mapStateToProps(state) {
	return {
		players: getConnectedPlayerNames(state),
	};
}

export default connect(mapStateToProps)(BasePlayerView);
