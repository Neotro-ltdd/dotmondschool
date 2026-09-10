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

  const startsWithAnyTitle = /^(Mrs|Mr|Dr|Prof|Miss|Ms|Engr|Rev|Mr\s*(&|and)\s*Mrs)\b/i.test(cleanName);
  if (startsWithAnyTitle) {
    return cleanName;
  }

  return `${cleanTitle} ${cleanName}`;
}

/**
 * Formats a parent display name. If the parent name is not provided or is an auto-generated
 * username (e.g., "Parent_8032455892", raw phone number, or "User"), it derives the name from the child's
 * surname with "Mr & Mrs [ChildSurname]".
 */
export function getParentDisplayName(
  rawParentName: string | null | undefined,
  wards?: Array<{ surname?: string; firstName?: string } | null> | null,
): string {
  const isAutoOrMissing =
    !rawParentName ||
    !rawParentName.trim() ||
    rawParentName.trim().toLowerCase() === 'user' ||
    rawParentName.trim().toLowerCase() === 'parent' ||
    rawParentName.trim().toLowerCase() === 'parent / guardian' ||
    rawParentName.trim().toLowerCase().startsWith('parent_') ||
    rawParentName.trim().toLowerCase().startsWith('parent-') ||
    /^\+?\d+$/.test(rawParentName.trim()) ||
    rawParentName.includes('@');

  if (isAutoOrMissing) {
    const childWithSurname = (wards || []).find((w) => w && w.surname && w.surname.trim());
    if (childWithSurname && childWithSurname.surname) {
      const surname = childWithSurname.surname.trim();
      const formattedSurname = surname.charAt(0).toUpperCase() + surname.slice(1);
      return `Mr & Mrs ${formattedSurname}`;
    }
    return 'Mr & Mrs Parent';
  }

  // If already prefixed with Mr & Mrs or similar
  if (/^mr\s*(&|and)\s*mrs/i.test(rawParentName.trim())) {
    return cleanDuplicateTitles(rawParentName);
  }

  return cleanDuplicateTitles(rawParentName);
}
