import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { makeGuess } from '../stores/game-store';

const propTypes = {
	word: PropTypes.string.isRequired,
	revealed: PropTypes.shape({
		playerOne: PropTypes.string,
		playerTwo: PropTypes.string,
	}).isRequired,
	makeGuess: PropTypes.func.isRequired,
};

function isAgent(revealed) {
	return [revealed.playerOne, revealed.playerTwo].indexOf('AGENT') > -1;
}

function isAssasin(revealed) {
	return [revealed.playerOne, revealed.playerTwo].indexOf('ASSASIN') > -1;
}

export class BaseWord extends Component {
	constructor(props) {
		super(props);

		this.onClick = this.onClick.bind(this);
	}

	onClick(e) {
		e.preventDefault();

		const { word, revealed } = this.props;
		if (!isAgent(revealed) && !isAssasin(revealed)) {
			this.props.makeGuess({ word });
		}
	}

	render() {
		const { word, revealed } = this.props;

		const className = classNames('word', {
			agent: isAgent(revealed),
			'non-agent-player-one': revealed.playerOne === 'NON_AGENT',
			'non-agent-player-two': revealed.playerTwo === 'NON_AGENT',
			assasin: isAssasin(revealed),
		});

		return (
			<button type="button" className={className} onClick={this.onClick}>
				{word}
			</button>
		);
	}
}

const mapDispatchToProps = { makeGuess };

BaseWord.propTypes = propTypes;

export default connect(undefined, mapDispatchToProps)(BaseWord);
