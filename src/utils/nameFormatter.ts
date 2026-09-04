/**
 * Utility functions for cleaning up and formatting user names and titles safely.
 */

/**
 * Removes repeated duplicate title prefixes such as "Mrs. Mrs.", "Mr. Mr.", "Dr. Dr.", etc.
 */
export function cleanDuplicateTitles(name: string | null | undefined): string {
  if (!name) return '';
  let cleaned = name.trim();

  // Pattern to match duplicated title prefixes (e.g. "Mrs. Mrs.", "Mr. Mr.", "Dr. Dr.", "Prof. Prof.")
  const titleRegex = /^(Mrs|Mr|Dr|Prof|Miss|Ms|Engr|Rev)\.?\s+\1\.?\s+/i;
  while (titleRegex.test(cleaned)) {
    cleaned = cleaned.replace(titleRegex, '$1. ');
  }

  // Handle case where title with dot and title without dot repeat (e.g., "Mrs. Mrs ")
  const multiTitleRegex =
    /^(Mrs|Mr|Dr|Prof|Miss|Ms|Engr|Rev)\.?\s+(Mrs|Mr|Dr|Prof|Miss|Ms|Engr|Rev)\.?\s+/i;
  const match = cleaned.match(multiTitleRegex);
  if (match && match[1].toLowerCase() === match[2].toLowerCase()) {
    cleaned = cleaned.replace(multiTitleRegex, `${match[1]}. `);
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Formats a display name combining title and name cleanly without duplicating titles.
 */
export function formatDisplayName(
  title: string | null | undefined,
  name: string | null | undefined,
): string {
  if (!name) return 'User';
  const cleanName = cleanDuplicateTitles(name);

  if (!title || !title.trim()) {
    return cleanName;
  }

  const cleanTitle = title.trim();
  const normTitle = cleanTitle.toLowerCase().replace(/[.,]/g, '');
  const normName = cleanName.toLowerCase().replace(/[.,]/g, '');

  // If cleanName already starts with the exact title or any standard title prefix, don't double prepend
  if (normName.startsWith(normTitle)) {
    return cleanName;
  }

  const startsWithAnyTitle = /^(Mrs|Mr|Dr|Prof|Miss|Ms|Engr|Rev)\b/i.test(cleanName);
  if (startsWithAnyTitle) {
    return cleanName;
  }

  return `${cleanTitle} ${cleanName}`;
}
