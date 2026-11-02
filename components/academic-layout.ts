import { isAdvancedComputing, isAdvancedComputingAcademicPage, isBtechProgramPage, advancedComputingLayout } from './advanced-computing-layout';
import { academicFlow } from './academic-content-flow';
import { academicSectionKey } from './academic-section-key';
import type { AcademicInfo, AcademicSection } from './academic-page-api';
import { mergeAcademicBody } from './academic-html';
import { academicFeaturePointCount, academicFeaturePresentation } from './academic-features';

export type AcademicBlock = {
  kind: 'section' | 'tabs' | 'accordion' | 'industry' | 'laboratories' | 'tracks' | 'programs' | 'specializations' | 'other-programs' | 'placements' | 'international' | 'news' | 'faculty' | 'testimonials' | 'faqs' | 'video';
  title: string; sections: AcademicSection[]; nested?: { parent: string; titles: string[] }[];
  lead?:AcademicSection[];
};

/** Each supplied section is consumed once; unmatched API content remains visible. */
export function academicLayout(info: AcademicInfo): AcademicBlock[] {
  if (isAdvancedComputing(info)) return advancedComputingLayout(info);
  const sections = [...info.pathways, ...info.tabs, ...info.sections, ...info.accordions];
  const used = new Set<AcademicSection>(), blocks: AcademicBlock[] = [];
  const steps = academicFlow(info.slug, info.kind, info.id);
  const take = (title: string) => {
    const key = academicSectionKey(title);
    const matches = sections.filter(section => !used.has(section) && academicSectionKey(section.title) === key);
    matches.forEach(section => used.add(section));
    // Combine split parts without replacing the original heading or losing tables.
    if (!matches.length) return [];
    const first = matches[0];
    const html = matches.reduce((combined, section) => mergeAcademicBody(combined, section.html), '');
    return [{ title:first.title, html }];
  };
  const nested = steps.filter(step => step.mode === 'nested' && step.parent).map(step => ({parent:step.parent!,titles:step.headings}));
  for (const step of steps) {
    if (step.mode === 'nested') continue;
    if (step.mode === 'tabs' || step.mode === 'accordion') {
      const selected=step.headings.flatMap(take);
      if (selected.length) blocks.push({kind:step.mode,title:'',sections:selected,...(step.mode==='tabs' ? {nested} : {})});
      continue;
    }
    const title=step.headings[0],key=academicSectionKey(title);
    const selected=take(title);
    const special: Record<string,AcademicBlock['kind']> = {programs:'programs',specializations:'specializations','other-programs':'other-programs',placements:'placements',international:'international',news:'news',faculty:'faculty',faqs:'faqs',video:'video'};
    const kind=info.slug==='mba-human-resource' && title==='MBA in Human Resource Tracks' ? 'tracks' : special[key] || 'section';
    blocks.push({kind,title,sections:selected});
  }
  // New CMS headings not in the guide are retained before the shared page ending.
  const remaining=sections.filter(section=>!used.has(section));
  const extras:AcademicBlock[]=[];
  for (const section of remaining) {
    if (info.tabs.includes(section) || info.pathways.includes(section)) {
      let tabs=extras.find(block=>block.kind==='tabs');
      if(!tabs){tabs={kind:'tabs',title:'',sections:[]};extras.push(tabs);}tabs.sections.push(section);
    } else if (info.accordions.includes(section)) {
      let group=extras.find(block=>block.kind==='accordion');
      if(!group){group={kind:'accordion',title:'',sections:[]};extras.push(group);}group.sections.push(section);
    } else extras.push({kind:'section',title:section.title,sections:[section]});
  }
  const end=blocks.findIndex(block=>['international','news','faculty','faqs'].includes(block.kind));
  blocks.splice(end<0 ? blocks.length : end,0,...extras);
  // Programme specifications use the shared wave before their admission tabs.
  if (info.kind === 'program') for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    if (!['tabs', 'accordion'].includes(block.kind)) continue;
    const specifications = block.sections.filter(section => academicSectionKey(section.title) === 'specification');
    if (!specifications.length) continue;
    block.sections = block.sections.filter(section => !specifications.includes(section));
    blocks.splice(index, 0, { kind: 'section', title: '', sections: specifications });
    index++;
  }
  // Advanced Computing uses its API feature count to select waves or tabs.
  const featureKeys=new Set(['difference','features','pillars','global-difference']);
  const advancedComputingPage=isAdvancedComputingAcademicPage(info);
  if(advancedComputingPage){
    featureKeys.add('industry-aligned-curriculum');
    const tabFeatures:AcademicSection[]=[];
    for(const block of blocks){
      const large=block.sections.filter(section=>featureKeys.has(academicSectionKey(section.title)) && academicFeaturePresentation(academicFeaturePointCount(section.html),7)==='tab');
      if(!large.length)continue;
      block.sections=block.sections.filter(section=>!large.includes(section));
      tabFeatures.push(...large);
    }
    for(let index=0;index<blocks.length;index++){
      const block=blocks[index];if(!['tabs','accordion'].includes(block.kind))continue;
      const features=block.sections.filter(section=>featureKeys.has(academicSectionKey(section.title)));
      if(features.length){block.sections=block.sections.filter(section=>!features.includes(section));blocks.splice(index+1,0,{kind:'section',title:'',sections:features});index++;}
    }
    if(tabFeatures.length){
      let group=blocks.find(block=>block.kind==='tabs'&&block.sections.some(section=>['advantage','eligibility','fees','scholarship','structure','specification'].includes(academicSectionKey(section.title)))) || blocks.find(block=>block.kind==='tabs');
      if(!group){group={kind:'tabs',title:'',sections:[]};const ending=blocks.findIndex(block=>['placements','international','news','faculty','faqs'].includes(block.kind));blocks.splice(ending<0?blocks.length:ending,0,group);}
      const before=group.sections.findIndex(section=>['eligibility','fees','scholarship','structure','specification'].includes(academicSectionKey(section.title)));
      group.sections.splice(before<0?group.sections.length:before,0,...tabFeatures);
    }
  } else {
    for(let index=0;index<blocks.length;index++){
      const block=blocks[index];if(!['tabs','accordion'].includes(block.kind))continue;
      const features=block.sections.filter(section=>featureKeys.has(academicSectionKey(section.title)));
      if(features.length){block.sections=block.sections.filter(section=>!features.includes(section));blocks.splice(index+1,0,{kind:'section',title:'',sections:features});index++;}
    }
  }
  // Careers belong with admission/structure tabs on every school and programme.
  const careers:AcademicSection[]=[];
  for(const block of blocks){block.sections=block.sections.filter(section=>{
    const key=academicSectionKey(section.title);
    // Global MBA explicitly places "Where This MBA Can Take You" in its
    // dedicated accordion group. Do not let the generic career-tab rule
    // pull that API section out of the page-specific flow.
    if(key==='global-careers' && info.slug==='dgu-global-mba')return true;
    if(['careers','global-careers'].includes(key)){careers.push(section);return false;}
    return true;
  });}
  if(careers.length){
    let group=blocks.find(block=>block.kind==='tabs'&&block.sections.some(s=>['structure','eligibility','fees','scholarship','advantage'].includes(academicSectionKey(s.title)))) || blocks.find(block=>block.kind==='tabs');
    if(!group){group={kind:'tabs',title:'',sections:[]};const ending=blocks.findIndex(b=>['placements','international','news','faculty','faqs'].includes(b.kind));blocks.splice(ending<0?blocks.length:ending,0,group);}
    group.sections.push(...(info.slug==='bcom' ? careers.map(section=>({...section,title:'Outcomes'})) : careers));
  }
  // Related specialization links use the same admission tab row and the same
  // three-card presentation as the parent Programme Specialization section.
  const otherSections:AcademicSection[]=[];
  for(const block of blocks)block.sections=block.sections.filter(section=>{
    if(academicSectionKey(section.title)==='other-programs'){otherSections.push(section);return false;}return true;
  });
  if(info.otherPrograms.length || otherSections.length){
    let group=blocks.find(block=>block.kind==='tabs'&&block.sections.some(section=>['structure','eligibility','fees','scholarship','advantage'].includes(academicSectionKey(section.title)))) || blocks.findLast(block=>block.kind==='tabs');
    if(!group){group={kind:'tabs',title:'',sections:[]};const ending=blocks.findIndex(block=>['placements','international','news','faculty','faqs'].includes(block.kind));blocks.splice(ending<0?blocks.length:ending,0,group);}
    group.sections.push({title:otherSections[0]?.title || 'Other Specializations',html:otherSections.reduce((copy,section)=>mergeAcademicBody(copy,section.html),'')});
  }
  if(info.programOptions?.length)blocks.unshift({kind:'tabs',title:'Program Options',sections:info.programOptions});
  // Keep the curriculum introduction and its four collaborations together once.
  const industryKeys=new Set(['co-designed','co-delivered','co-certified','industry-benefits']);
  const collaborations=blocks.flatMap(b=>b.sections.filter(s=>industryKeys.has(academicSectionKey(s.title))));
  const leads=blocks.flatMap(b=>b.sections.filter(s=>academicSectionKey(s.title)==='industry'));
  if(collaborations.length && leads.length){
    const position=blocks.findIndex(b=>b.sections.some(s=>industryKeys.has(academicSectionKey(s.title)) || academicSectionKey(s.title)==='industry'));
    for(const block of blocks)block.sections=block.sections.filter(s=>!collaborations.includes(s)&&!leads.includes(s));
    blocks.splice(position,0,{kind:'industry',title:leads[0].title,lead:leads,sections:collaborations});
  }
  for(const block of blocks)if(block.kind==='section'&&block.sections.some(s=>academicSectionKey(s.title)==='laboratories'))block.kind='laboratories';
  if(info.tracks.length && !blocks.some(block=>block.kind==='tracks')) {
    const specializations=blocks.findIndex(block=>block.kind==='specializations');
    blocks.splice(specializations<0 ? 0 : specializations+1,0,{kind:'tracks',title:info.tracksHeading,sections:[]});
  }
  // Some legacy guides omit the placements heading even though their API has
  // correctly related students. Render the same shared gallery for those records.
  if(info.students.length && !blocks.some(block=>block.kind==='placements')) {
    const ending=blocks.findIndex(block=>['international','news','faculty','faqs'].includes(block.kind));
    blocks.splice(ending<0 ? blocks.length : ending,0,{kind:'placements',title:'Placements',sections:[]});
  }
  if(info.kind==='program' && info.schoolUrl && info.facultyIds?.length !== 0 && !blocks.some(block=>block.kind==='faculty')) {
    const ending=blocks.findIndex(block=>['international','news','faqs'].includes(block.kind));
    blocks.splice(ending<0 ? blocks.length : ending,0,{kind:'faculty',title:'Faculty',sections:[]});
  }
  if (info.kind === 'program' && info.testimonials?.length) {
    const faqs = blocks.findIndex(block => block.kind === 'faqs');
    blocks.splice(faqs < 0 ? blocks.length : faqs, 0, { kind: 'testimonials', title: 'Student Testimonials', sections: [] });
  }
  if (isBtechProgramPage(info)) {
    const collaborationSections = blocks.flatMap(block =>
      block.sections.filter(section => academicSectionKey(section.title) === 'industry'));
    if (collaborationSections.length) {
      for (const block of blocks) {
        block.sections = block.sections.filter(section => !collaborationSections.includes(section));
      }
      blocks.unshift({ kind: 'section', title: '', sections: collaborationSections });
    }
  }
  return blocks.filter(block=>block.kind!=='other-programs'&&(!['tabs','accordion','section'].includes(block.kind)||block.sections.length>0));
}
