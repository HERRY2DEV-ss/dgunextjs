'use client';
import { ReviewCard } from './ReviewsSection';
import type { Review } from './reviews-api';
import StepSlider from './StepSlider';

/** Same review cards and slider as the project, using this page's API data. */
export default function AcademicTestimonials({ items, id, paused }: { items: Review[]; id: string; paused: boolean }) {
  if (!items.length) return null;
  return <section className="academic-api-section academic-student-testimonials" data-content-kind="testimonials" aria-labelledby={id + '-title'}>
    <h2 id={id + '-title'}>Student Testimonials</h2>
    <StepSlider size={Math.min(3, items.length)} interval={6500} horizontalOnMobile controls dots paused={paused} label="Student testimonials">
      {items.map(item => <ReviewCard key={item.id} review={item} />)}
    </StepSlider>
  </section>;
}
