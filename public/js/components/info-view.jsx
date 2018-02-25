import React, { Component } from 'react';
import classNames from 'classnames';
import findParent from 'find-parent';

export default class InfoView extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isOpen: false,
		};

		this.onClick = this.onClick.bind(this);
		this.onBodyClick = this.onBodyClick.bind(this);
	}

	componentWillUnmount() {
		window.document.body.removeEventListener('click', this.onBodyClick);
	}

	onClick() {
		this.setState(prevState => ({
			isOpen: !prevState.isOpen,
		}), () => {
			if (this.state.isOpen) {
				window.document.body.addEventListener('click', this.onBodyClick);
			}
		});
	}

	onBodyClick(e) {
		const targetIsInfoOrButton = findParent.byMatcher(e.target, node => node.classList.contains('info') || node.classList.contains('info-button'));

		if (targetIsInfoOrButton) return;

		e.preventDefault();

		this.setState(() => ({
			isOpen: false,
		}));

		window.document.body.removeEventListener('click', this.onBodyClick);
	}

	renderHowTo() {
		return (
			<div className="info-how-to-play">
				<p>This is a two-player, cooperative, word-guessing game</p>
				<p>
					Together, you and a teammate are trying to find all
					15 <span className="color-agent">good</span> words in 9 turns
					without revealing any <span className="color-assasin">kill</span> words.
				</p>
				<p>
					You will each see 9 <span className="color-agent">good</span> words that you need
					to get your teammate to reveal. Note that words you see
					as <span className="color-agent">good</span>, your teammate may see
					as <span className="color-agent">good</span>,
					<span className="color-non-agent">neutral</span>, or
					even <span className="color-assasin">kill</span> words.
				</p>
				<p>
					Each turn starts with a player giving a single-word clue followed by a
					number (e.g. swimming 3). The clue attempts to link
					multiple <span className="color-agent">good</span> words for their teammate to guess.
				</p>
				<p>The teammate that received the clue reveals words one at a time until:</p>
				<ol>
					<li>They choose to end the turn.</li>
					<li>
						They have revealed as many <span className="color-agent">good</span> words as
						the number provided with the clue.
					</li>
					<li>They reveal a <span className="color-non-agent">neutral</span> word.</li>
					<li>
						They reveal a <span className="color-assasin">kill</span> word, in
						which case the GAME ends immediately in defeat.
					</li>
				</ol>
				<p>To start:</p>
				<ol>
					<li>1. Select which player you want to be (bottom left)</li>
					<li>2. Tell your teammate to play as the other player</li>
					<li>3. Take turns giving a <strong>one-word clue and a number</strong></li>
					<li>4. After receiving a clue, click on words to reveal them</li>
				</ol>
			</div>
		);
	}

	renderAttribution() {
		return (
			<div className="info-attribution">
				Icons made by <a href="https://www.flaticon.com/authors/gregor-cresnar" title="Gregor Cresnar">Gregor Cresnar</a>&nbsp;
				from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by&nbsp;
				<a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank" rel="noopener noreferrer">
					CC 3.0 BY
				</a>
			</div>
		);
	}

	render() {
		const { isOpen } = this.state;
		const className = classNames('info-container', {
			open: isOpen,
		});

		return (
			<div className="info-view">
				<div className={className}>
					<button className="info-button" type="button" onClick={this.onClick}>?</button>
					<div className="info">
						{this.renderHowTo()}
						{this.renderAttribution()}
					</div>
				</div>
			</div>
		);
	}
}
