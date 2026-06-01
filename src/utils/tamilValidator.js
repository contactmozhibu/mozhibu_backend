/**
 * TAMIL TEXT VALIDATOR & PROCESSOR
 * 
 * Validates Tamil Unicode text before database storage
 * Cleans and prepares Tamil content for optimal storage and retrieval
 */

/**
 * Validate if text contains only Tamil characters and punctuation
 * Tamil Unicode range: U+0B80 to U+0BFF
 */
const isTamilOnly = (text) => {
  if (!text || typeof text !== 'string') return false;
  const tamilPattern = /^[\u0B80-\u0BFF\s.,!?;:—–-]+$/;
  return tamilPattern.test(text);
};

/**
 * Check if text contains Tamil characters
 */
const containsTamil = (text) => {
  if (!text || typeof text !== 'string') return false;
  const tamilPattern = /[\u0B80-\u0BFF]/;
  return tamilPattern.test(text);
};

/**
 * Check if text is pure ASCII (English)
 */
const isPureEnglish = (text) => {
  if (!text || typeof text !== 'string') return false;
  return /^[a-zA-Z0-9\s.,!?;:\-—–'"\(\)]+$/.test(text);
};

/**
 * Normalize Tamil text
 * Removes extra spaces, normalizes line breaks
 */
const normalizeTamil = (text) => {
  if (!text || typeof text !== 'string') return '';

  // Remove leading/trailing whitespace
  let normalized = text.trim();

  // Replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ');

  // Normalize line breaks (Unix line endings)
  normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove multiple consecutive line breaks
  normalized = normalized.replace(/\n\n+/g, '\n');

  return normalized;
};

/**
 * Clean Tamil text for storage
 * Removes unwanted characters while preserving meaningful content
 */
const cleanTamil = (text) => {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // Remove control characters except newline and tab
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Normalize spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
};

/**
 * Prepare Tamil text for database storage
 */
const prepareTamilForStorage = (text) => {
  if (!text || typeof text !== 'string') return '';

  // Step 1: Clean unwanted characters
  let prepared = cleanTamil(text);

  // Step 2: Normalize formatting
  prepared = normalizeTamil(prepared);

  // Step 3: Validate
  if (!isTamilOnly(prepared) && !containsTamil(prepared)) {
    console.warn('Warning: Text may not contain valid Tamil characters');
  }

  return prepared;
};

/**
 * Validate Tamil text for quality
 */
const validateTamilQuality = (text) => {
  const issues = [];

  if (!text || text.length === 0) {
    issues.push('Text is empty');
  }

  if (text.length < 3) {
    issues.push('Text is too short (minimum 3 characters)');
  }

  if (!containsTamil(text)) {
    issues.push('Text does not contain Tamil characters');
  }

  // Check for too much English mixed in
  const englishRatio =
    (text.match(/[a-zA-Z]/g) || []).length / text.length;
  if (englishRatio > 0.3) {
    issues.push('Text contains too much English (more than 30%)');
  }

  // Check for suspicious patterns (repeated characters)
  const repeatedChars = text.match(/(.)\1{9,}/g);
  if (repeatedChars && repeatedChars.length > 0) {
    issues.push('Text contains repeated characters pattern');
  }

  return {
    isValid: issues.length === 0,
    issues,
    quality: {
      length: text.length,
      tamilCharacterCount: (text.match(/[\u0B80-\u0BFF]/g) || []).length,
      englishRatio: englishRatio.toFixed(2),
    },
  };
};

/**
 * Sanitize Tamil text for display
 * Removes potentially harmful content while preserving readability
 */
const sanitizeTamilForDisplay = (text) => {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;

  // Remove script tags (shouldn't be possible with Tamil, but be safe)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = sanitized;
  sanitized = textarea.value;

  return sanitized;
};

/**
 * Extract statistics from Tamil text
 */
const extractTamilStats = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      characters: 0,
      words: 0,
      lines: 0,
      tamilCharacters: 0,
      sentences: 0,
    };
  }

  return {
    characters: text.length,
    words: text.trim().split(/\s+/).filter((w) => w.length > 0).length,
    lines: text.split('\n').filter((l) => l.trim().length > 0).length,
    tamilCharacters: (text.match(/[\u0B80-\u0BFF]/g) || []).length,
    sentences: (text.match(/[।॥]/g) || []).length + (text.match(/\./g) || []).length,
  };
};

/**
 * Batch validate multiple Tamil texts
 */
const batchValidateTamil = (texts) => {
  if (!Array.isArray(texts)) return [];

  return texts.map((text) => ({
    original: text,
    isValid: isTamilOnly(text) || containsTamil(text),
    containsTamil: containsTamil(text),
    quality: validateTamilQuality(text),
  }));
};

module.exports = {
  isTamilOnly,
  containsTamil,
  isPureEnglish,
  normalizeTamil,
  cleanTamil,
  prepareTamilForStorage,
  validateTamilQuality,
  sanitizeTamilForDisplay,
  extractTamilStats,
  batchValidateTamil,
};
