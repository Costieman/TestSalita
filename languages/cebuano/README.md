# Salita Quest: Bisaya

This directory contains the Cebuano/Sinugbuanong Binisaya language layer for Salita Quest.

## Current playable scope

- Beginners Bay: greetings, courtesy, replies, and leave-taking
- Name Village: names, preferred names, introductions, and occupations
- Home Hills: origin, residence, family, and explaining that the learner is studying Bisaya
- Feeling Forest: wellbeing, physical sensations, emotions, and common discomforts
- Question Crossroads: clarification, repetition, slower speech, meanings, essential questions, and requests for help
- Market Port: wants, availability, quantities, prices, ordering, payment, change, and receipts
- Grammar Bridge: pronouns, noun markers, linkers, location words, demonstratives, and high-frequency particles
- Verb Volcano: verb roots, actor-focused aspect patterns, ability forms, goal focus, transfer focus, negation, and time cues
- Spanish Square: Spanish-derived calendar words, clock time, and integrated everyday nouns
- Bisaya-English City: purposeful Cebuano-English code-switching in work and scheduling conversations
- Memory Camp: adaptive written review prioritising weaker, due, and already-encountered items
- Echo Cave: hands-free active recall using Bisaya audio, a five-second recall gap, and the English answer
- Campfire Review: a ten-part final challenge drawing from every curriculum region
- 182 course items across all ten curriculum regions
- 107 authored starter exercises, with exactly six tokens in every sentence-builder word bank
- All 13 map locations now have a defined activity
- Separate progress for each learner and language
- In-app switching between Tagalog and Bisaya through the learner-profile menu

All curriculum material remains foundation content requiring fluent or native Cebuano review. Review-region logic does not grant artificial mastery: Memory Camp uses the existing spaced-repetition queue, Echo Cave does not raise mastery through listening alone, and Campfire Review records challenge results separately from item-level mastery.

## Review-region behaviour

- `Memory Camp` unlocks after at least eight course items have been encountered. It selects up to twelve items from the existing review pool, which is ordered by due status and weaker mastery.
- `Echo Cave` unlocks after at least one active item exists at mastery level 1–4. It opens the existing two-minute hands-free recall interface. If verified Cebuano audio is unavailable, Tagalog audio is not substituted.
- `Campfire Review` unlocks after at least two items have been encountered in each of the ten curriculum regions. Passing requires at least 80% accuracy across ten representative questions.

## Structure

- `course.json` — course metadata, map, module definitions, Beginners Bay items, and initial exercises
- `modules/manifest.json` — ordered list of additional module packs
- `modules/introductions.json` — Name Village content and dialogue
- `modules/origin.json` — Home Hills content and dialogue
- `modules/wellbeing.json` — Feeling Forest content and dialogue
- `modules/questions.json` — Question Crossroads content and dialogue
- `modules/food.json` — Market Port content and dialogue
- `modules/grammar.json` — Grammar Bridge content and dialogue
- `modules/verbs.json` — Verb Volcano content and dialogue
- `modules/spanish.json` — Spanish Square content and dialogue
- `modules/code-switching.json` — Bisaya-English City content and dialogue
- `../../bisaya-review-regions.js` — Memory Camp, Echo Cave, Campfire Review, final challenge, and review badges

## Language policy

The primary target is contemporary conversational Cebuano, commonly called Bisaya. The course does not treat Cebuano, Hiligaynon, Waray, and other Visayan languages as interchangeable.

Regional, spelling, and register alternatives may be recorded in `accepted` fields. Alternatives should be accepted only when they preserve the intended meaning and remain natural in a relevant Cebuano-speaking context.

All lesson material remains marked for fluent or native Cebuano review before a production release.

## Content cautions

- Questions about marriage and family may be too personal in some contexts.
- Physical and emotional expressions are taught as language patterns, not medical guidance.
- Experienced-state forms such as `gikapoy ko`, `gigutom ko`, and `giuhaw ko` are preserved rather than reshaped to imitate English adjective order.
- Clarification phrases are deliberately repeated because they are conversational recovery tools.
- Market Port preference phrases such as `walay baboy` are not sufficient allergy communication.
- Grammar Bridge avoids presenting `ang`, `og`, and `sa` as direct one-word equivalents of English articles or prepositions.
- `kita` and `kami` remain separate because including or excluding the listener changes the meaning of “we.”
- Particles such as `man`, `ra`, `pa`, `na`, and `gyud` are taught through complete phrases because their translation depends on context.
- Verb Volcano describes Cebuano through aspect, focus, mood, time cues, and common verb classes rather than forcing every form into an English tense table.
- Verb affixes are taught through reviewed high-frequency forms rather than attached mechanically to every root.
- Spanish Square distinguishes integrated Cebuano vocabulary from modern Spanish. Borrowed words follow Cebuano spelling, pronunciation, grammar, and local meaning.
- Bisaya-English City treats code-switching as a context-sensitive bilingual practice. It is not presented as the only natural register or as a replacement for full Cebuano forms.
- English roots may take Cebuano affixes or appear inside Cebuano marker, pronoun, and particle patterns. The surrounding Cebuano structure remains part of the learning target.
- Workplace examples are provisional and remain marked for fluent review because code-switching preferences vary by speaker, setting, age, profession, and region.

## Audio policy

Tagalog pronunciation must never be substituted for Cebuano. The Bisaya runtime uses only verified static audio mapped to `ceb-PH` or a browser voice explicitly identified as Cebuano. When neither is available, audio remains disabled and the written lesson continues normally.

## Progress compatibility

Tagalog and Cebuano progress use separate profile-and-course keys. Existing Tagalog progress is migrated to the Tagalog namespace and is not overwritten when the learner switches to Bisaya.

## Validation

Run:

```bash
node scripts/validate-bisaya.mjs
```

The validator checks JavaScript and JSON syntax, the 13-location map, sequential release order, duplicate IDs, item and exercise references, token analysis, native-review status, six-token sentence builders, answer-token coverage, shared-engine transformation markers, review-region wiring, offline caching, and the absence of calls to the Tagalog speech endpoint.

## Reference material used for drafting

- John U. Wolff, *A Dictionary of Cebuano Visayan* (1972), digitised search edition
- Bohol.ph Peace Corps-derived Cebuano phrasebook
- *Cebuano Grammar Notes* and *Cebuano for Beginners*, University of Hawai‘i Press digital editions
- Universal Dependencies Cebuano documentation
- Cebuano phrase references for calendar, clock-time, and established Spanish-derived vocabulary
- Research on Cebuano-English code-switching, code-mixing, pragmatic functions, and English roots carrying Cebuano affixes

These sources support initial drafting but do not replace fluent-speaker review of contemporary usage.
