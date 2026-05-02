# Secret Agent Words — Visual Direction

Dossier theme. The board is an open manila folder; each word is a typewritten case file; reveals are rubber-stamped over the file. No grid-of-colored-cards visual language — that lane is owned by Codenames trade dress and we want clean separation from it.

## Color tokens

Tailwind theme keys live in `client/tailwind.config.ts`. Names are short and meaning-keyed; do not import raw hex values into components.

| Token | Hex | Usage |
| --- | --- | --- |
| `paper-cream` | `#f3e9d2` | App background; outer folder color |
| `paper-aged` | `#e8dcc0` | Card / case-file face |
| `paper-edge` | `#c9b78f` | Folder edge, drop-shadow tone |
| `ink` | `#1c1916` | Primary text (warm near-black, not pure black) |
| `ink-fade` | `#52483b` | Secondary / metadata text |
| `redact` | `#0f0d0a` | Solid redaction bars |
| `stamp-red` | `#a8261c` | ASSASSIN stamp, CLASSIFIED, error states |
| `stamp-blue` | `#2a4d6e` | AGENT confirmation stamp |
| `stamp-green` | `#3a6b3a` | Mission success, safe reveals |
| `caution` | `#d9a93a` | Turn-counter warnings, low-resource UI |

Pure white and pure black are banned. Always use `paper-*` and `ink*` tokens.

## Typography

All Google Fonts; load via `<link>` in `client/index.html`.

- **Display / stamps**: `Big Shoulders Stencil`, `Stencil Std`, `serif`. Wide letter-spacing, all-caps. For game-over headers, redaction stamps, and the room code.
- **Body / case-file text**: `Special Elite`, `Courier Prime`, `Cutive Mono`, `monospace`. Typewriter. For card words, clue display, system messages.
- **UI controls**: `Courier Prime` for buttons and inputs. Keep them typewritten; no sans-serif.

## Visual metaphors → components

| Plan component | Dossier metaphor |
| --- | --- |
| `Board` (5×5 grid) | An open folder showing 25 case-file tabs |
| `Word` card (unrevealed) | Manila tab, word typewritten centered, faint paper grain |
| `Word` card (AGENT revealed) | Blue `AGENT` stamp slammed across, agent silhouette icon |
| `Word` card (NON_AGENT) | Faded gray `BYSTANDER` stamp, slightly rotated |
| `Word` card (ASSASSIN) | Red `TARGET ELIMINATED` stencil with X overlay |
| `ClueComposer` | Transmission terminal / typewriter input frame |
| `ClueBar` | Intercept log strip across the top, monospaced |
| `TeamPanel` | Two operative dossier cards (you / partner) with codenames |
| `EndTurnButton` | Manila "DISMISS" button, stamp-style |
| `GameOver` (win) | `MISSION ACCOMPLISHED` stencil over the closed folder |
| `GameOver` (loss-assassin) | `OPERATIVE DOWN` red stencil |
| `GameOver` (loss-turns) | `OPERATION TIMED OUT` faded stencil |
| `Home` | A briefcase: room code field is a luggage-tag, name field is operative ID |

## Lexicon (user-facing copy)

Avoid generic-game language. Use:

- "Operative" — player
- "Codename" — display name
- "Operation Code" — room code
- "Briefing" — clue submission
- "Intercept" — clue display
- "Case File" — word card
- "Mission" — game session
- "Dossier" — game state / saved room

Never use "Codenames" as a noun in user-facing copy. (`CODE NAME` as a label on the operative card is fine — the trademark is the title, not the phrase.)

## Texture & motion

- **Paper grain**: subtle SVG noise overlay on `paper-*` surfaces, ~3% opacity. Reuse one shared SVG; do not regenerate per card.
- **Card rotation**: hand-placed feel — each unrevealed card carries `transform: rotate(±0.6deg)` from a deterministic per-word hash. Keep small enough that the grid still reads as a grid.
- **Drop shadows**: warm-toned (`paper-edge` with low opacity), short offsets. No cool blue-gray shadows.
- **Reveal animation**: "stamp slam" — `scale(1.4) rotate(-8deg)` → `scale(1) rotate(-3deg)` over 180ms, ease-out. The stamp lands; the card stays.
- **Clue arrival**: typewriter type-in of the clue word + count, ~40ms per character.
- **Page transitions**: route changes use a brief manila-folder slide (`translateX(-12px)` + fade) — keep under 200ms.
- **Hover (unrevealed)**: lift `translateY(-2px)` and deepen the warm shadow; no glow, no scale, no color shift.

## What we're explicitly NOT doing

- No red-team / blue-team color split on cards. The two operatives are visually distinguished by their *operative card* in `TeamPanel`, not by recoloring the board.
- No "key card" view. Each operative sees their own role assignments rendered as subtle margin annotations on each card (e.g., a small `[A]`/`[•]`/`[X]` glyph on their side), not as full card-face colors.
- No emoji icons. Use SVG line illustrations or single-character Unicode glyphs styled as ink stamps.
- No glassmorphism, no gradients, no neon. Period-correct office aesthetic only.
