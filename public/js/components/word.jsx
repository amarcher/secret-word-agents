import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { makeGuess } from '../stores/game-store';
import { getPlayerId } from '../stores/player-id-store';

const propTypes = {
	word: PropTypes.string.isRequired,
	role: PropTypes.string,
	revealed: PropTypes.shape({
		playerOne: PropTypes.string,
		playerTwo: PropTypes.string,
	}).isRequired,
	playerId: PropTypes.string,
	makeGuess: PropTypes.func.isRequired,
};

const defaultProps = {
	role: '',
	playerId: '',
};

function isAgent(revealed) {
	return [revealed.playerOne, revealed.playerTwo].indexOf('AGENT') > -1;
}

function isAssasin(revealed) {
	return [revealed.playerOne, revealed.playerTwo].indexOf('ASSASIN') > -1;
}

function isGuessed(playerId, revealed) {
	return isAgent(revealed) || isAssasin(revealed) ||
		(playerId === 'one' && revealed.playerTwo) ||
		(playerId === 'two' && revealed.playerOne);
}

export class BaseWord extends Component {
	constructor(props) {
		super(props);

		this.onClick = this.onClick.bind(this);
	}

	onClick(e) {
		e.preventDefault();

		const {
			word, revealed, role, playerId,
		} = this.props;

		if (role && !isGuessed(playerId, revealed)) {
			this.props.makeGuess({ word });
		}
	}

	render() {
		const {
			word, revealed, role, playerId,
		} = this.props;

		const className = classNames('word', {
			agent: isAgent(revealed),
			'non-agent-player-one': revealed.playerOne === 'NON_AGENT',
			'non-agent-player-two': revealed.playerTwo === 'NON_AGENT',
			assasin: isAssasin(revealed),
			'my-agent': role === 'AGENT',
			'my-non-agent': role === 'NON_AGENT',
			'my-assasin': role === 'ASSASIN',
			guessed: isGuessed(playerId, revealed),
			neutral: !role,
		});

		return (
			<button type="button" className={className} onClick={this.onClick} disabled={!role || isGuessed(playerId, revealed)}>
				{word}
			</button>
		);
	}
}

const mapDispatchToProps = { makeGuess };
function mapStateToProps(state) {
	return {
		playerId: getPlayerId(state),
	};
}

BaseWord.propTypes = propTypes;
BaseWord.defaultProps = defaultProps;

export default connect(mapStateToProps, mapDispatchToProps)(BaseWord);
