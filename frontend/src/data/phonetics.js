/**
 * Phonetically Balanced Paragraphs for Voice Enrollment
 * 
 * These carefully chosen sentences ensure comprehensive voice sampling by:
 * 1. Covering all major phonemes (speech sounds) in English
 * 2. Including various consonant clusters and vowel combinations
 * 3. Capturing different speaking patterns and rhythms
 * 
 * Why phonetic balance matters:
 * - Voice biometrics analyze frequency patterns across different sounds
 * - A good voiceprint needs samples of how you pronounce various phonemes
 * - Pangrams (sentences using all letters) ensure broad phonetic coverage
 * 
 * Each sample serves a specific purpose:
 * - Sample 1: Classic pangrams with common word patterns
 * - Sample 2: Unusual consonant combinations and stress patterns
 * - Sample 3: Complex phoneme sequences and varied intonation
 */

export const PHONETIC_PARAGRAPHS = [
    {
        id: 'sample_1',
        // Contains: quick consonants (q, x), voiced/unvoiced pairs (b/p, d/t), sibilants (s, z)
        text: "The quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly. Pack my box with five dozen liquor jugs.",
        label: "Phonetic Balance 1"
    },
    {
        id: 'sample_2',
        // Emphasizes: fricatives (f, v, z), affricates (j), and complex clusters (zw, nymph)
        text: "Bright vixens jump; dozy fowl quack. Quick wafting zephyrs vex bold Jim. Waltz, bad nymph, for quick jigs vex! Glib jocks quiz nymph to vex dwarf.",
        label: "Phonetic Balance 2"
    },
    {
        id: 'sample_3',
        // Focuses on: liquid consonants (l, r), nasals (m, n), and varied vowel sounds
        text: "How razorback-jumping frogs can level six piqued gymnasts! Cozy sphinx waves quart jug of bad milk. A very bad quack might jinx zippy fowls.",
        label: "Phonetic Balance 3"
    }
];
