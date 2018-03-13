import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setPlayerName } from '../stores/player-id-store';
import { history } from '../stores';

const propTypes = {
	setPlayerName: PropTypes.func.isRequired,
};

export class BaseEnterGame extends Component {
	constructor(props) {
		super(props);

		this.state = {
			gameId: '',
			name: '',
		};

		this.onSubmit = this.onSubmit.bind(this);
		this.onChangeGameId = this.onChangeGameId.bind(this);
		this.onChangeName = this.onChangeName.bind(this);
	}

	onChangeGameId(e) {
		const gameId = e.target.value;
		this.setState(() => ({ gameId: gameId && gameId.replace(/\s/g, '').toUpperCase() }));
	}

	onChangeName(e) {
		const name = e.target.value;
		this.setState(() => ({ name: name && name.replace(/\s/g, '').toUpperCase() }));
	}

	onSubmit(e) {
		e.preventDefault();
		const { gameId, name } = this.state;

		if (!gameId) return;

		if (name) this.props.setPlayerName({ playerName: name });
		history.push(`/${gameId}`);
	}

	render() {
		return (
			<div className="enter-game-container">
				<div className="enter-game">
					<h1 className="title">Dooler</h1>
					<form onSubmit={this.onSubmit}>
						<input
							className="enter-game-input"
							placeholder="Game Code"
							onChange={this.onChangeGameId}
							value={this.state.gameId}
						/>
						<input
							className="enter-name-input"
							placeholder="Your Name"
							onChange={this.onChangeName}
							value={this.state.name}
						/>
						<div>
							<button className="enter-game-button" type="submit" disabled={!this.state.gameId}>
								Enter
							</button>
						</div>
					</form>
				</div>
				<div>
					<a href="itms-services://?action=download-manifest&url=https://www.dooler.com/manifest.plist">Download on iOS</a>
				</div>
			</div>
		);
	}
}

BaseEnterGame.propTypes = propTypes;

const mapDispatchToProps = {
	setPlayerName,
};

export default connect(undefined, mapDispatchToProps)(BaseEnterGame);
