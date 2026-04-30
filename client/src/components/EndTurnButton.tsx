interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export default function EndTurnButton({ onClick, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="case-file rounded-sm px-4 py-2 font-stencil text-sm tracking-[0.2em] uppercase text-stamp-red hover:bg-paper-edge/30 disabled:opacity-40"
    >
      End Turn
    </button>
  );
}
