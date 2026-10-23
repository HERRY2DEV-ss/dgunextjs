import {ScrollTrigger} from 'gsap/ScrollTrigger';
let pending:ReturnType<typeof setTimeout>|undefined;
/** Coalesce card/image height changes into one refresh after layout settles. */
export function refreshLayout(){
 clearTimeout(pending);
 pending=setTimeout(()=>ScrollTrigger.refresh(),420);
}
