import { sitePath } from './site-base';
import ExpandableText from './ExpandableText';

const additionalAboutText='To promote future-ready education, all programs integrate AI-embedded learning, contemporary tools, and 21st-century skills. Students are encouraged to grow beyond academics and think beyond conventional boundaries by actively participating in more than 25+ student-led clubs and committees, fostering leadership, creativity, collaboration, and holistic development.';

export default function AboutSection(){
 return <section id="about" className="about-section is-visible" aria-labelledby="about-title">
  <div className="about-inner content-width">
   <div className="about-copy">
    <p className="about-eyebrow">About the University</p>
    <h2 id="about-title">About DBS Global University</h2>
    <p>DBS Global University is committed to offering programs that prioritize skill development, industry relevance, and experiential learning. Every program is designed in collaboration with leading industry partners and is enriched with value-added certifications such as SAP, SAS Six Sigma, NISM, ACCA, ICA, Alteryx, HCL Tech, and more — ensuring that students graduate as industry-ready professionals.</p>
    <ExpandableText className="placement-description about-description" text={additionalAboutText} collapseAll />
   </div>
   <div className="about-divider" aria-hidden="true"><span>DGU</span></div>
   <div className="about-visual">
    <i className="about-shape about-shape-top" aria-hidden="true" />
    <i className="about-shape about-shape-bottom" aria-hidden="true" />
    <figure><img src={sitePath("/assets/hero-campus.webp")} alt="DBS Global University campus" width="1920" height="901" loading="lazy" /></figure>
   </div>
  </div>
 </section>;
}
