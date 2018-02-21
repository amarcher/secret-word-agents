import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const propTypes = {
	word: PropTypes.string.isRequired,
	revealed: PropTypes.shape({
		playerOne: PropTypes.string,
		playerTwo: PropTypes.string,
	}).isRequired,
};

export default class Word extends Component {
	render() {
		const { word, revealed } = this.props;
		const isAgent = [revealed.playerOne, revealed.playerTwo].indexOf('AGENT') > -1;
		const isAssasin = [revealed.playerOne, revealed.playerTwo].indexOf('ASSASIN') > -1;

		const className = classNames('word', {
			agent: isAgent,
			'non-agent-player-one': revealed.playerOne === 'NON_AGENT',
			'non-agent-player-two': revealed.playerTwo === 'NON_AGENT',
			assasin: isAssasin,
		});

		return (
			<div className={className}>
				{word}
			</div>
		);
	}
}

Word.propTypes = propTypes;
