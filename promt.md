# Context

I am building an English Learning Platform for students from Grade 1 to Grade 9.

The platform follows this structure:

Course
→ Unit
→ Lesson
→ Learning Blocks

A Lesson is not a static page.

A Lesson is composed of multiple Learning Blocks such as:

- Text
- Image
- Video
- Audio
- Vocabulary
- Grammar
- Quiz
- Flashcard
- Matching
- Listening
- Speaking
- Reading
- Summary

The system must be scalable and maintainable because new activity types will be added in the future.

---

# Lesson Authoring Strategy

The platform supports FOUR different content creation methods.

## Method 1 - Manual Builder

Teachers manually create questions.

Example:

Question:
Apple means?

A. Orange
B. Apple
C. Banana
D. Grape

Correct answer:
B

Advantages:

- Flexible
- Supports all question types

Disadvantages:

- Time consuming
- Difficult for large datasets

---

## Method 2 - Import Builder

Teachers upload Excel or CSV files.

Example:

| Word   | Meaning   |
| ------ | --------- |
| Apple  | Quả táo   |
| Banana | Quả chuối |

The system imports and converts data into questions automatically.

Advantages:

- Fast content creation
- Bulk operations

Disadvantages:

- Still generates individual questions

---

## Method 3 - Question Bank

Questions are stored centrally.

Question Bank
├── Vocabulary
├── Grammar
├── Reading
└── Listening

Teachers create lessons by selecting questions from the bank.

Example:

Lesson A:
Q1, Q2, Q3

Lesson B:
Q1, Q5, Q7

Advantages:

- Reusable
- Easy maintenance
- Centralized management

If a question is updated, all lessons using that question are updated automatically.

---

## Method 4 - Vocabulary Set + Activity Generator

This is the strategic EdTech approach.

Teachers DO NOT create individual questions.

Teachers only create knowledge assets.

Example:

Vocabulary Set:

Apple = Quả táo
Banana = Quả chuối
Orange = Quả cam

The system automatically generates learning activities from the vocabulary set.

Examples:

Flashcards

Match Word

Match Image

Multiple Choice

Missing Letters

Reorder Letters

Listening Practice

Speaking Practice

Review Quiz

Advantages:

- Massive content generation
- Reduced teacher workload
- Better scalability

This approach is similar to modern language-learning products.

---

# My Goals

Analyze these four authoring strategies.

Provide:

1. Recommended architecture.
2. Database design.
3. Entity relationships.
4. UI/UX flow for teachers.
5. Scalability analysis.
6. Pros and cons of each method.
7. Recommended MVP roadmap.
8. How these four methods can coexist in a single system.
9. Whether Question Bank and Vocabulary Set should be separate modules or integrated.
10. Long-term architecture for an EdTech platform serving 10,000+ students.

Act as:

- Senior Product Architect
- Senior EdTech Architect
- Senior LMS Designer

Output diagrams, workflows, database suggestions, and implementation recommendations.

---

# Tiến độ triển khai

> Checklist chi tiết + nhật ký: **[docs/LESSON_AUTHORING_PROGRESS.md](./docs/LESSON_AUTHORING_PROGRESS.md)**

| Phase | Nội dung | Trạng thái |
|-------|----------|------------|
| 1A | Manual Builder — form EXERCISE_SET | ✅ Xong |
| 1B | Import Builder — CSV trong Admin | ✅ Xong |
| 2 | Question Bank | 📋 Tiếp theo |
| 3 | Vocab Set + Activity Generator | 📋 Chưa bắt đầu |
