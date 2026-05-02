import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getActiveGameId, getAgentsLeftForGameIdAndTeamId } from '../stores/game-store';
import { getConnectedPlayerNamesForGameId } from '../stores/players-store';

const propTypes = {
	teamOne: PropTypes.arrayOf(PropTypes.shape({
		playerName: PropTypes.string,
		playerId: PropTypes.number,
		facebookImage: PropTypes.string,
	})).isRequired,
	teamTwo: PropTypes.arrayOf(PropTypes.shape({
		playerName: PropTypes.string,
		playerId: PropTypes.number,
		facebookImage: PropTypes.string,
	})).isRequired,
	agentsLeftTeamOne: PropTypes.number.isRequired,
	agentsLeftTeamTwo: PropTypes.number.isRequired,
};

export class BasePlayerView extends Component {
	renderPlayers(players, agentsLeft) {
		const playersContent = players.map(({ playerId, playerName, facebookImage } = {}, index) => {
			const key = `${index}-${playerName}-${playerId}`;
			const style = {};
			if (facebookImage) style.background = `url('${facebookImage}')`;

			return (
				<div className="player" key={key} style={style}>
					<span className="player-name">{playerName}</span>
				</div>
			);
		});

		return (
			<Fragment>
				<legend align="center">{`${agentsLeft} left`}</legend>
				<div className="team-container">
					{playersContent}
				</div>
			</Fragment>
		);
	}

	render() {
		const {
			teamOne, teamTwo, agentsLeftTeamOne, agentsLeftTeamTwo,
		} = this.props;

		return (
			<div className="players">
				<fieldset className="team">
					{this.renderPlayers(teamOne, agentsLeftTeamOne)}
				</fieldset>
				<fieldset className="team">
					{this.renderPlayers(teamTwo, agentsLeftTeamTwo)}
				</fieldset>
			</div>
		);
	}
}

BasePlayerView.propTypes = propTypes;

function mapStateToProps(state) {
	const gameId = getActiveGameId(state);
	const { teamOne, teamTwo } = getConnectedPlayerNamesForGameId(state, gameId);

	return {
		teamOne,
		teamTwo,
		agentsLeftTeamOne: getAgentsLeftForGameIdAndTeamId(state, gameId, 1),
		agentsLeftTeamTwo: getAgentsLeftForGameIdAndTeamId(state, gameId, 2),
	};
}

export default connect(mapStateToProps)(BasePlayerView);
