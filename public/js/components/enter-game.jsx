import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { history } from '../stores';
import { enterGame } from '../stores/game-store';

const propTypes = {
	enterGame: PropTypes.func.isRequired,
};

export class BaseEnterGame extends Component {
	constructor(props) {
		super(props);

		this.state = {
			gameId: '',
		};

		this.onSubmit = this.onSubmit.bind(this);
		this.onChange = this.onChange.bind(this);
	}

	onChange(e) {
		const gameId = e.target.value;
		this.setState(() => ({ gameId }));
	}

	onSubmit(e) {
		e.preventDefault();
		const { gameId } = this.state;

		this.props.enterGame({ gameId }).then(() => history.push(`/${gameId}`));
	}

	render() {
		const buttonText = this.state.gameId ? 'Create' : 'Enter';

		return (
			<div>
				<form onSubmit={this.onSubmit}>
					<label htmlFor="game-name">
						Game Code:
						<input name="game-name" placeholder="GAME" onChange={this.onChange} />
					</label>
					<button type="submit">
						{buttonText}
					</button>
				</form>
			</div>
		);
	}
}

BaseEnterGame.propTypes = propTypes;

const mapDispatchToProps = {
	enterGame,
};

export default connect(undefined, mapDispatchToProps)(BaseEnterGame);
