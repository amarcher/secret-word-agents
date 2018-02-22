import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getPlayers } from '../stores/players-store';

const propTypes = {
	players: PropTypes.number.isRequired,
};

export class BasePlayerView extends Component {
	render() {
		return (
			<div className="players">
				Connected Players: {this.props.players}
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
