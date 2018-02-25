import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getPlayers } from '../stores/players-store';

const propTypes = {
	players: PropTypes.number.isRequired,
};

export class BasePlayerView extends Component {
	renderPlayers() {
		return Array(this.props.players).fill().map((_el, index) => (
			<div className="player" key={index} /> // eslint-disable-line react/no-array-index-key
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
		players: getPlayers(state),
	};
}

export default connect(mapStateToProps)(BasePlayerView);
