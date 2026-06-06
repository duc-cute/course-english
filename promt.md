I'm designing an EdTech platform for English learning (Grade 1 - Grade 9).

I want the Lesson architecture to be highly scalable, maintainable and extensible.

IMPORTANT:

A Lesson is NOT a simple content page.

A Lesson is a sequence of Learning Blocks.

The system should support adding new learning activities in the future without changing the core database structure.

Think of Duolingo, Quizlet, Khan Academy and modern LMS platforms.

==================================================

Hierarchy:

Course
└── Unit
└── Lesson
└── Learning Blocks

==================================================

A Learning Block is the smallest renderable unit.

Example:

Lesson: Fruits

1. Vocabulary Introduction
2. Flashcards
3. Match Word To Image
4. Missing Letter Exercise
5. Listen And Choose
6. Grammar Tip
7. Quiz
8. Summary

==================================================

Current block categories:

CONTENT BLOCKS

- TEXT
- IMAGE
- VIDEO
- AUDIO
- PDF

TEACHING BLOCKS

- VOCABULARY
- GRAMMAR_RULE
- CALLOUT
- SUMMARY

VOCABULARY PRACTICE BLOCKS

- FLASHCARD
- MATCH_WORD
- MATCH_IMAGE
- SPELLING
- REORDER_LETTERS
- LISTEN_CHOOSE
- LISTEN_TYPE
- MEMORY_GAME
- WORD_SEARCH

GRAMMAR PRACTICE BLOCKS

- FILL_BLANK
- MULTIPLE_CHOICE
- TRUE_FALSE
- REORDER_SENTENCE
- ERROR_DETECTION

READING BLOCKS

- READING_PASSAGE
- READING_QUESTION

LISTENING BLOCKS

- LISTENING_QUESTION
- LISTENING_FILL_BLANK

SPEAKING BLOCKS

- SPEAKING_REPEAT
- SPEAKING_READ
- SPEAKING_CONVERSATION

ASSESSMENT BLOCKS

- QUIZ
- MINI_TEST

==================================================

I need you to:

1. Design the complete Lesson architecture.
2. Design database entities.
3. Design JSON schema for LessonBlock.
4. Explain how to render blocks dynamically on React.
5. Explain how teachers can build lessons visually using drag and drop.
6. Ensure new block types can be added without database changes.
7. Review the architecture from a Senior EdTech Architect perspective.
8. Point out weaknesses and suggest improvements.

Output should include:

- Architecture diagram
- ERD
- JSON examples
- Frontend rendering strategy
- Backend API design
- Future scalability considerations

Lesson
│
├── VOCABULARY
│ ├── Apple
│ ├── Banana
│ └── Orange
│
├── FLASHCARD
│
├── MATCH_IMAGE
│
├── SPELLING
│
├── LISTEN_CHOOSE
│
├── QUIZ
│
└── SUMMARY

{
"id": "lesson_1",
"title": "Fruits",
"blocks": [
{
"id": "block_1",
"type": "VOCABULARY",
"order": 1,
"data": {
"words": [
{
"word": "Apple",
"meaning": "Quả táo",
"image": "...",
"audio": "..."
}
]
}
},
{
"id": "block_2",
"type": "FLASHCARD",
"order": 2,
"data": {
"sourceVocabularySetId": "vocab_1"
}
},
{
"id": "block_3",
"type": "MATCH_IMAGE",
"order": 3,
"data": {
"questions": []
}
}
]
}
