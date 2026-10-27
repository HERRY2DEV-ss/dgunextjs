'use client';
import { sitePath } from './site-base';

import ApiRichText from './ApiRichText';
import './advanced-computing.css';

export default function AdvancedComputingIntro({ intro }: { intro: string }) {
  return <div className="advanced-computing-intro-extras">
    <ApiRichText html={intro} className="academic-intro-text" scrollTables />
    <div className="advanced-computing-partners" aria-label="Delivery, technology and certification partners">
      <img src={sitePath("/assets/academic/advanced-computing-partners.png")} width="573" height="195"
        alt="Delivery, technology and certification partners: HCLTech, iOS Development Center, SAS, SAP, Alteryx, Microsoft, Google and NVIDIA" />
    </div>
  </div>;
}
