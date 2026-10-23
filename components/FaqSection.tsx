'use client';
import '../app/programs/program.css';
import { useId, useState } from 'react';
import ApiRichText from './ApiRichText';

/** Shared optional FAQ section; no questions are invented when data is absent. */
export default function FaqSection({ items, html }: {
  items?: ReadonlyArray<{ question: string; answer: string }>; html?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  if (!items?.length && !html) return null;
  return <section className="program-faqs" aria-labelledby={id + '-title'}>
    <h2 id={id + '-title'}>Frequently Asked Questions</h2>
    {items?.length ? <div className="program-faq-list">{items.map((item, index) => <div className={'program-faq' + (open === index ? ' is-open' : '')} key={item.question}>
      <h3><button type="button" id={id + '-question-' + index} aria-expanded={open === index} aria-controls={id + '-answer-' + index} onClick={() => setOpen(value => value === index ? null : index)}>
        <span>{item.question}</span><span className="program-faq-icon" aria-hidden="true">+</span>
      </button></h3>
      <div className="program-faq-answer" id={id + '-answer-' + index} role="region" aria-labelledby={id + '-question-' + index} hidden={open !== index}>
        <div><ApiRichText html={item.answer} /></div>
      </div>
    </div>)}</div> : <ApiRichText html={html || ''} />}
  </section>;
}
