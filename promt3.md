You are a senior React UX Engineer.

Design a premium reading experience for an AI English learning platform.

The current reader already supports:
- Word tokenization
- Clickable vocabulary
- Audio playback
- Current word synchronization from backend timestamps

Redesign the word highlighting experience.

====================================================

GOALS

The reader should feel alive.

Do NOT simply change the text color.

When the narrator reads a word:

• the current word should smoothly animate
• previous words should return to normal
• transitions should feel soft
• no flashing
• no aggressive colors

====================================================

CURRENT WORD

Animate over 180~220ms.

Animation sequence:

scale:
1
→
1.08
→
1

background:
light blue gradient

text color:
#2563EB

border radius:
6px

box shadow:
very soft

font-weight:
600

The animation must be subtle.

Think Apple Books.

====================================================

NEXT WORD

Do not instantly jump.

Fade between current and next word.

====================================================

READ WORDS

Already-read words should have a slightly darker color than unread words.

Unread:
#222

Read:
#666

Current:
Blue highlight

====================================================

CLICKABLE VOCABULARY

Vocabulary words already have blue text.

When the current reading word is also vocabulary:

blend both effects.

Do not lose clickability.

====================================================

SCROLL

The current sentence should always remain around the middle of the viewport.

Smooth scrolling.

Never jump.

====================================================

PERFORMANCE

There may be 3000+ words.

Avoid rerendering every token.

Only animate the current token.

Use React.memo where possible.

====================================================

Deliver:

- Component architecture
- React hooks
- CSS animation
- State management
- Timeline diagram