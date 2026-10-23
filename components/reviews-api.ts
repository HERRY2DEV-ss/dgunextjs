import { apiData, apiFields, apiMedia, apiPlain, apiRecord, apiText, apiValue, contentCache, postContent } from './dgu-content-api';
export type Review = { id: string; name: string; text: string; image: string; designation: string; program: string; rating: number | null };

export function parseReviews(payload: unknown): Review[] {
  let source = apiData(payload, ['reviews', 'testimonials']);
  const nested = apiRecord(source);
  if (nested) source = apiValue(apiFields(nested), 'reviews', 'review', 'testimonials', 'items', 'records') ?? source;
  const entries = Array.isArray(source) ? source : apiRecord(source) ? [source] : null;
  if (!entries) throw new Error('The Reviews API did not return review records.');
  const seen = new Set<string>();
  const reviews: Review[] = [];
  for (const item of entries) {
    const record = apiRecord(item);
    if (!record) continue;
    const fields = apiFields(record);
    const text = apiPlain(apiValue(fields, 'review', 'reviewText', 'reviewDescription', 'reviewContent', 'reviewMessage', 'studentReview', 'testimonial', 'description', 'message', 'comment', 'content', 'text', 'details'));
    if (!text) continue;
    const name = apiPlain(apiValue(fields, 'reviewerName', 'studentName', 'reviewName', 'fullName', 'name', 'title'));
    const program = apiPlain(apiValue(fields, 'programName', 'courseName', 'program', 'course', 'batch'));
    const id = apiText(apiValue(fields, 'id', 'reviewId')) || name + '|' + text;
    const identity = name + '|' + text;
    if (seen.has(id) || seen.has(identity)) continue;
    seen.add(id); seen.add(identity);
    const ratingValue = apiValue(fields, 'rating', 'reviewRating', 'stars', 'ratingValue');
    const rating = typeof ratingValue === 'number' || typeof ratingValue === 'string' ? Number(ratingValue) : NaN;
    reviews.push({ id, name, text, program,
      designation: apiPlain(apiValue(fields, 'designation', 'role', 'company', 'position')),
      image: apiMedia(apiValue(fields, 'imageURL', 'image', 'reviewImage', 'reviewerImage', 'studentImage', 'profileImage', 'photo')),
      rating: Number.isFinite(rating) && rating > 0 && rating <= 5 ? rating : null,
    });
  }
  if (entries.length && !reviews.length) throw new Error('The Reviews API response has no readable review text.');
  return reviews;
}
const cachedReviews = contentCache<Review[]>();
export function requestReviews(): Promise<Review[]> {
  return cachedReviews('all', async () => parseReviews(await postContent('reviews', {})));
}
