// Regression checks for the shared slider: controls, responsive batches and autoplay.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
function compile(file,requireMock,globals={}) {
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(code,{module,exports:module.exports,require:requireMock,...globals});
 return module.exports;
}
let slots=[],cursor=0,effects=[],dirty=false,timers=new Map(),serial=0,lastDelay=0;
const fakeNode={addEventListener(){},removeEventListener(){},querySelector(){return null;}};
const react={Children:{toArray:v=>v},useRef(value){let i=cursor++;return slots[i]??(slots[i]={current:value===null?fakeNode:value});},
 useState(value){let i=cursor++;if(!(i in slots))slots[i]=value;return [slots[i],next=>{const v=typeof next==='function'?next(slots[i]):next;if(v!==slots[i]){slots[i]=v;dirty=true;}}];},
 useCallback(callback){return callback;},
 useEffect(callback,deps){let i=cursor++;const old=slots[i];if(!old||deps.some((d,j)=>d!==old.deps[j]))effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:callback()};});}};
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
const Slider=compile('components/StepSlider.tsx',name=>name==='react'?react:name==='./refreshLayout'?{refreshLayout(){}}:jsx,{
 setTimeout:(fn,delay)=>{lastDelay=delay;timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id),
 window:{setTimeout:(fn,delay)=>{lastDelay=delay;timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id),matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})},
 matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),
 document:{hidden:false,addEventListener(){},removeEventListener(){}},
 IntersectionObserver:class{constructor(cb){this.cb=cb;}observe(){this.cb([{isIntersecting:true}]);}disconnect(){}},Date
}).default;
let props={children:['one','two','three','four'],size:2,interval:2000,label:'Placements',controls:true},tree;
function render(){do{dirty=false;cursor=0;effects=[];tree=Slider(props);for(const run of effects)run();}while(dirty);return tree;}
function advance(){assert.equal(timers.size,1,'exactly one autoplay timer');const [id,fn]=timers.entries().next().value;timers.delete(id);fn();render();}
const track=()=>tree.props.children[0].props.children[0];
const transform=()=>track().props.style.transform;
render();assert.equal(lastDelay,2000,'placements timer is two seconds');assert.equal(transform(),'translateX(-0%)');advance();assert.equal(transform(),'translateX(-100%)');advance();assert.equal(transform(),'translateX(-0%)');
// Mouse focus on Next used to pause forever. It must now leave autoplay active.
tree.props.onFocus({target:{matches:()=>false,closest:()=>({})}});
tree.props.children[1].props.children.at(-1).props.onClick();render();
assert.equal(transform(),'translateX(-100%)');advance();assert.equal(transform(),'translateX(-0%)');
// Even keyboard use of a navigation arrow must allow the subsequent automatic step.
tree.props.onFocus({target:{matches:()=>true,closest:()=>({})}});render();advance();
props={...props,paused:true};render();assert.equal(timers.size,0,'open menu / explicit pause cancels autoplay');
props={...props,paused:false};render();advance();
props={...props,children:['a','b','c','d','e','f'],size:3};render();advance();
assert.equal(track().props.children[0].props.children.length,3,'updates retain three items per batch');
tree.props.onMouseEnter();render();assert.equal(timers.size,1,'hover does not pause autoplay by default');
advance();
props={...props,mouseDrag:true};render();
const beforeDrag=transform();
tree.props.onPointerDown({pointerType:'mouse',button:0,clientX:220,clientY:100,target:{closest:()=>null},currentTarget:fakeNode,pointerId:1});
tree.props.onPointerMove({clientX:120,clientY:102,pointerId:1,currentTarget:fakeNode});render();
assert.notEqual(transform(),beforeDrag,'mouse drag moves exactly one slide');assert.equal(timers.size,1,'hover and mouse drag leave autoplay active');
let suppressed=false;tree.props.onClickCapture({preventDefault(){suppressed=true},stopPropagation(){}});assert(suppressed,'drag cannot also open its photo');
console.log('PASS: shared autoplay, responsive batches, wraparound, pointer/keyboard controls, hover autoplay and mouse drag.');
