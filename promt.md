# English Learning Platform Architecture Review

Act as a Senior EdTech Architect, Product Architect, and LMS System Designer.

I am building an English Learning Platform for students from Grade 1 to Grade 9.

The platform supports:

- Vocabulary Learning
- Grammar Learning
- Listening Practice
- Speaking Practice
- Reading Practice
- Quizzes
- Homework
- Exams

The system must be scalable, reusable, and maintainable.

---

# Core Philosophy

I do NOT want teachers to repeatedly create the same data.

Instead, I want a Knowledge Asset architecture.

The platform should treat Vocabulary as a reusable learning asset.

---

# Vocabulary Library (Core Knowledge Repository)

Create a centralized Vocabulary Library.

Each vocabulary item contains:

- Word
- Meaning (Vietnamese)
- IPA Pronunciation
- UK Audio
- US Audio
- Image
- Example Sentence
- Part Of Speech
- Difficulty Level
- Tags

Example:

Word:
Apple

Meaning:
Quả táo

IPA:
/ˈæp.əl/

Audio:
UK Audio
US Audio

Example:
I eat an apple every day.

Part Of Speech:
Noun

Image:
Apple Picture

---

# Automatic Vocabulary Enrichment

Teachers should NOT manually enter IPA or Audio.

Workflow:

Teacher enters:

Apple

Backend automatically retrieves:

- IPA
- UK Audio
- US Audio
- Part Of Speech

using Free Dictionary API or similar dictionary services.

Teacher only provides:

- Vietnamese Meaning
- Image (optional)
- Example Sentence (optional)

---

# Vocabulary Sets

Teachers create Vocabulary Sets.

Example:

Fruits Vocabulary

- Apple
- Banana
- Orange
- Mango

School Vocabulary

- Book
- Pen
- Teacher
- Classroom

Vocabulary Sets are reusable.

The same vocabulary can belong to multiple sets.

---

# Lesson Architecture

Do NOT model Lesson as a collection of questions.

Instead:

Course
└── Unit
└── Lesson
└── Learning Blocks

Learning Blocks can be:

- Text Block
- Image Block
- Video Block
- Grammar Block
- Vocabulary Set Block
- Quiz Block
- Listening Block
- Speaking Block
- Reading Block
- Assignment Block

---

# Activity Generation

Vocabulary Sets should automatically generate learning activities.

Teachers do not need to manually create every exercise.

Example:

Vocabulary Set:
Apple
Banana
Orange

Automatically generate:

- Flashcards
- Match Word
- Match Image
- Missing Letters
- Reorder Letters
- Listen And Choose
- Listen And Type
- Speaking Practice
- Review Quiz

---

# Question Bank

Question Bank should exist as a separate module.

Question Bank stores:

- Vocabulary Questions
- Grammar Questions
- Reading Questions
- Listening Questions

Lessons can reference Question Bank items.

Question Bank and Vocabulary Library should coexist.

Vocabulary Library = Knowledge Repository

Question Bank = Assessment Repository

---

# Content Creation Methods

Support 4 authoring methods:

1. Manual Builder
   - Teachers create questions manually.

2. Excel Import
   - Teachers upload CSV/Excel.

3. Question Bank
   - Teachers select existing questions.

4. Vocabulary Set Generator
   - Teachers select vocabulary assets and the system generates activities automatically.

---

# Future Requirements

The architecture should support:

- 10,000+ Vocabulary Items
- 100,000+ Questions
- 10,000+ Students
- Mobile Learning
- AI-generated Exercises
- AI-generated Pronunciation Evaluation
- AI-generated Quizzes
- AI-generated Vocabulary Recommendations

---

# Please Analyze

1. Overall architecture
2. Domain-driven design
3. Database schema
4. Entity relationships
5. Vocabulary Library design
6. Question Bank design
7. Lesson Builder design
8. Activity Generator design
9. Scalability considerations
10. Recommended implementation roadmap

Provide:

- ERD
- Architecture Diagrams
- Workflow Diagrams
- UI/UX Suggestions
- Backend Design Recommendations

Think like a real EdTech platform, not a simple LMS.
