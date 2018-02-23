import React, { Component } from 'react';

import { history } from '../stores';

export default class EnterGame extends Component {
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

		history.push(`/${gameId}`);
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
