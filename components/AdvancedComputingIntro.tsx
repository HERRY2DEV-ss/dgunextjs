'use client';
import { sitePath } from './site-base';
import ExpandableText from './ExpandableText';
import './advanced-computing.css';

export default function AdvancedComputingIntro({ intro, highlights = '' }: { intro: string; highlights?: string }) {
  const content = [intro, highlights].filter(Boolean).join('');
  return <div className="advanced-computing-intro-extras">
    <ExpandableText text="" html={content} previewWords={42} className="academic-intro-text" />
    <div className="advanced-computing-partners" aria-label="Delivery, technology and certification partners">
      <img src={sitePath("/assets/academic/advanced-computing-partners.png")} width="573" height="195"
        alt="Delivery, technology and certification partners: HCLTech, iOS Development Center, SAS, SAP, Alteryx, Microsoft, Google and NVIDIA" />
    </div>
  </div>;
}
