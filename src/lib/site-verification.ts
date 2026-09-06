/**
 * Google Search Console verification.
 *
 * Paste the `content` value from the Google Search Console HTML tag here.
 * Google gives you a tag like:
 *   <meta name="google-site-verification" content="AbC123..." />
 * Copy only the part inside content="..." below, then publish the site.
 *
 * Leave it as an empty string to omit the tag entirely.
 */
export const GOOGLE_SITE_VERIFICATION = "ni8Q-VthUQA0G7VI_FFmte0cyzVzxG5p9G2tjQ-Y9Q0";

/** Extra verification codes (e.g. a second Google account). */
export const ADDITIONAL_SITE_VERIFICATIONS: { name: string; content: string }[] = [];

export function verificationMetaTags() {
  const tags: { name: string; content: string }[] = [];
  if (GOOGLE_SITE_VERIFICATION.trim()) {
    tags.push({ name: "google-site-verification", content: GOOGLE_SITE_VERIFICATION.trim() });
  }
  for (const tag of ADDITIONAL_SITE_VERIFICATIONS) {
    if (tag.name.trim() && tag.content.trim()) {
      tags.push({ name: tag.name.trim(), content: tag.content.trim() });
    }
  }
  return tags;
}
