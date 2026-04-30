import type { PlayerView } from '@saw/shared';
import Word from './Word.tsx';

interface Props {
  view: PlayerView;
  canGuess: boolean;
  onGuess: (word: string) => void;
}

export default function Board({ view, canGuess, onGuess }: Props) {
  const words = Object.keys(view.words);
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-3xl mx-auto">
      {words.map(word => (
        <Word
          key={word}
          word={word}
          view={view.words[word]!}
          canGuess={canGuess}
          onClick={() => onGuess(word)}
        />
      ))}
    </div>
  );
}
