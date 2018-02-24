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

		if (gameId) {
			history.push(`/${gameId}`);
		}
	}

	render() {
		return (
			<div className="enter-game-container">
				<div className="enter-game">
					<h1 className="title">Dooler</h1>
					<form onSubmit={this.onSubmit}>
						<input className="enter-game-input" placeholder="Enter Game Code" onChange={this.onChange} />
						<div>
							<button className="enter-game-button" type="submit" disabled={!this.state.gameId}>
								Enter
							</button>
						</div>
					</form>
				</div>
			</div>
		);
	}
}
