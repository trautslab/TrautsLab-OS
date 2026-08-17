/**
 * Sanitizes markdown, code blocks, bullet points, asterisks, hashtags and table formatting
 * into natural, conversational, fluid plain Spanish text for speech synthesis (TTS / Kokoro / WebSpeech).
 */
export function sanitizeTextForSpeech(text: string): string {
  if (!text) return '';

  let clean = text
    // 1. Remove markdown code blocks (```code```)
    .replace(/```[\s\S]*?```/g, ' bloque de código omitido ')
    // 2. Remove inline code (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // 3. Remove markdown headers (### Header -> Header.)
    .replace(/^#{1,6}\s+(.*)$/gm, '$1. ')
    // 4. Remove bold & italic markdown (**text**, *text*, __text__, _text_)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // 5. Remove any leftover asterisks or hashes
    .replace(/[*#]/g, '')
    // 6. Convert numbered lists: "1. " -> natural flow
    .replace(/^\s*\d+\.\s+/gm, '')
    // 7. Remove bullet points (- or + or •)
    .replace(/^\s*[-+•]\s+/gm, '')
    // 8. Convert links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 9. Remove table lines (| col | col |)
    .replace(/\|/g, ', ')
    // 10. Remove horizontal rules (---, ===)
    .replace(/^[=\-]{3,}$/gm, '')
    // 11. Remove emojis and unusual symbols that some TTS pronounce awkwardly
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // 12. Fix multiple colons, commas, or spaces
    .replace(/:\s*:/g, ':')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();

  return clean;
}
