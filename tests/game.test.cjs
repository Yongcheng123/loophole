const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const el={innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return el},append(){},focus(){},remove(){},getBoundingClientRect(){return {width:1000,height:700}}};
const listeners={},mediaState={matches:false,addEventListener(){}};let timerId=0;
const sandbox={console,listeners,mediaState,intervals:new Map(),document:{querySelector(){return el},addEventListener(name,fn){listeners[name]=fn},createElement(){return {...el}}},window:{matchMedia(){return mediaState},addEventListener(name,fn){listeners[name]=fn}},localStorage:{data:{},setItem(k,v){this.data[k]=v},getItem(k){return this.data[k]}},setTimeout(fn){sandbox.pending.push(fn);return 1},clearTimeout(){},setInterval(fn){const id=++timerId;sandbox.intervals.set(id,fn);return id},clearInterval(id){sandbox.intervals.delete(id)},requestAnimationFrame(){},pending:[],URL,Blob};
vm.createContext(sandbox);const src=fs.readFileSync('dist/game.js','utf8').replace('title();updateInputMode();requestAnimationFrame(loop);','');vm.runInContext(src,sandbox);
vm.runInContext(`
let checks=0;function ok(v,m){if(!v)throw Error(m);checks++}
// Every landmark is reachable from the starting square without crossing water or trees.
const visited=new Set(['8,24']),queue=[[8,24]];while(queue.length){const [x,y]=queue.shift();for(const[dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]]){const nx=x+dx,ny=y+dy,k=nx+','+ny,t=tile(nx,ny);if(t&&t!==3&&!visited.has(k)){visited.add(k);queue.push([nx,ny])}}}for(const p of POINTS)ok(visited.has(p.x+','+p.y),'Unreachable: '+p.name);
// Keep all combat and progression logic real, replace rendering for deterministic engine checks.
renderBattle=()=>{};updateSidebar=()=>{};world=()=>{screen='world'};modal=()=>elStub;toast=()=>{};sound=()=>{};log=t=>state.log.push(t);ending=()=>{};
function fresh(a,b){state={version:1,name:'Tester',classes:[a,b],x:8,y:24,level:1,xp:0,gold:35,hp:1,mp:1,weapon:0,armor:0,items:{potion:5,ether:3,herb:2,ore:2,crystal:0},seals:[],chests:[],seen:[],kills:0,steps:0,won:false,log:[],playtime:0};state.hp=stats().maxHp;state.mp=stats().maxMp;battle=null;modalStack=[];return state}
for(let a=0;a<8;a++)for(let b=a;b<8;b++){fresh(a,b);ok(validSave(state),'Save invalid for class pair');const s=stats();ok(s.maxHp>=86&&s.maxMp>=32,'Invalid stats');for(const id of new Set([a,b])){startBattle('keeper');const before=battle.hp;state.hp=30;fight('skill',String(id));ok(state.mp<=s.maxMp&&state.mp>=0,'Mana invalid');ok(CLASSES[id].type==='heal'?state.hp>30:battle.hp<before,'Skill has no effect');pending.splice(0).forEach(f=>f());battle=null}}
// Death recovery, turn locking, boss gating, poison, guard and resource consumption.
fresh(0,5);startBattle('grove');fight('guard');ok(battle.busy,'Enemy turn must lock input');const old=state.mp;fight('skill','0');ok(state.mp===old,'Double input consumed mana');pending.splice(0).forEach(f=>f());ok(!battle.busy&&battle.turn===2,'Turn did not advance');
fresh(3,3);startBattle('keeper');fight('skill','3');ok(battle.poison===2,'Poison not applied');pending.splice(0).forEach(f=>f());
fresh(1,7);gainXp(121);ok(state.level===3&&state.xp===1,'XP rollover failed');ok(state.hp===stats().maxHp,'Level does not restore health');
fresh(0,0);state.hp=1;startBattle('keeper');fight('strike');pending.splice(0).forEach(f=>f());ok(!battle&&state.x===8&&state.hp===stats().maxHp,'Defeat recovery failed');
fresh(1,1);state.items.ore=3;const atk=stats().atk;craft('weapon');ok(state.weapon===1&&state.gold===10&&state.items.ore===0&&stats().atk===atk+4,'Crafting transaction failed');
fresh(4,5);saveGame();const copy=JSON.parse(localStorage.getItem(SAVE));ok(validSave(copy),'Saved round trip failed');copy.classes=[8,8];ok(!validSave(copy),'Invalid class accepted');
// A prepared level-5 hero can defeat all four guardians using actual turns and consumables.
fresh(1,5);state.level=5;state.weapon=2;state.armor=2;state.items.potion=20;state.items.ether=20;state.hp=stats().maxHp;state.mp=stats().maxMp;
for(const id of ['grove','ruins','ash','keeper']){startBattle(id);let turns=0;while(battle&&turns++<150){if(state.hp<65)useItem('potion');else if(battle.turn%3===0)fight('guard');else if(state.mp>=9)fight('skill','1');else useItem('ether');pending.splice(0).forEach(f=>f())}ok(!battle,'Battle did not resolve');ok(state.x===8&&state.y===24,'Unexpected position');if(id!=='keeper')ok(state.seals.includes(ENEMIES[id].boss),'Seal not awarded')}
ok(state.won,'Ending never reached');
// Ultimate unlock, choices and old-save compatibility.
fresh(0,1);state.level=4;chooseUltimate(0,0);ok(!state.ultimates,'Ultimate selected before level 5');ok(ultimateFor(0)===null,'Early ultimate unlocked');
state.level=5;chooseUltimate(0,0);chooseUltimate(1,1);ok(state.ultimates[0]===0&&state.ultimates[1]===1,'Dual-class choices not independent');chooseUltimate(2,0);ok(state.ultimates[2]===undefined,'Unowned class accepted');
const saved=JSON.parse(localStorage.getItem(SAVE));ok(validSave(saved)&&saved.ultimates[1]===1,'Ultimate save round trip failed');delete saved.ultimates;ok(validSave(saved),'Legacy save rejected');
for(const bad of [null,[],{'0':2},{'2':0},{'00':0}]){saved.ultimates=bad;ok(!validSave(saved),'Malformed ultimate save accepted')}
saved.ultimates={'0':0};saved.level=4;ok(!validSave(saved),'Save with early ultimate accepted');
// Both options of all eight classes use a turn, cost mana and respect per-battle limits.
for(let i=0;i<8;i++)for(let choice=0;choice<2;choice++){
 fresh(i,i);state.level=5;state.hp=stats().maxHp;state.mp=stats().maxMp;chooseUltimate(i,choice);ok(state.ultimates[i]===choice,'Selection failed');
 startBattle('keeper');state.hp=40;const hp=state.hp,mp=state.mp;const u=ULTIMATES[i][choice];fight('ultimate',String(i));
 ok(battle.busy&&battle.usedUltimates.includes(i),'Ultimate did not consume a turn or use');
 ok(state.hp>0&&state.hp<=stats().maxHp&&state.mp>=0&&state.mp<=stats().maxMp,'Ultimate exceeded stat bounds');
 if(u.physical||u.magic)ok(battle.hp<ENEMIES.keeper.hp,'Damage ultimate failed');
 if(u.heal||u.drain)ok(state.hp>hp,'Healing ultimate failed');
 if(u.sacrifice)ok(state.hp<hp,'Blood Nova cost missing');
 if(u.poison)ok(battle.poison===4,'Ultimate poison duration failed');
 if(u.weaken)ok(battle.weaken===u.weaken,'Ultimate weaken failed');
 if(u.fortify)ok(battle.fortify===4,'Fortification failed');
 if(u.guard)ok(battle.guard,'Ultimate guard failed');
 pending.splice(0).forEach(f=>f());const remaining=state.mp,enemyHp=battle.hp;fight('ultimate',String(i));ok(state.mp===remaining&&battle.hp===enemyHp&&!battle.busy,'Ultimate reused in same battle');
 chooseUltimate(i,1-choice);ok(state.ultimates[i]===choice,'Changed ultimate in battle');
 startBattle('keeper');ok(battle.usedUltimates.length===0,'Ultimate did not reset for new battle');
 state.mp=u.cost-1;fight('ultimate',String(i));ok(battle.usedUltimates.length===0&&!battle.busy,'Ultimate used without mana');battle=null;
}
// Physical armor piercing, execution threshold and specialist scaling.
fresh(3,0);state.level=5;state.ultimates={3:1};state.mp=99;startBattle('keeper');battle.hp=150;fight('ultimate','3');ok(!battle,'Execution did not double damage below threshold');pending.splice(0).forEach(f=>f());
fresh(0,1);state.level=5;state.ultimates={0:0};state.mp=99;startBattle('keeper');fight('ultimate','0');const hybridDamage=380-battle.hp;battle=null;pending.length=0;
fresh(0,0);state.level=5;state.ultimates={0:0};state.mp=99;startBattle('keeper');fight('ultimate','0');const specDamage=380-battle.hp;ok(specDamage>hybridDamage,'Specialist ultimate bonus absent');battle=null;pending.length=0;
// A level-up crossing five announces the new choice, including multiple-level gains.
fresh(1,7);gainXp(400);ok(state.level===5&&state.log.some(t=>t.includes('Ultimate abilities unlocked')),'Level-five unlock notification absent');

fresh(5,1);state.level=5;state.ultimates={5:0,1:0};state.mp=stats().maxMp;startBattle('keeper');fight('ultimate','5');pending.splice(0).forEach(f=>f());ok(battle.fortify===3,'Fortification did not count the first enemy turn');fight('ultimate','1');pending.splice(0).forEach(f=>f());ok(battle.usedUltimates.length===2,'Dual class ultimates did not track independently');battle=null;pending.length=0;
fresh(5,0);state.level=5;state.ultimates={5:0};state.mp=99;startBattle('keeper');const startHp=stats().maxHp;state.hp=startHp;fight('ultimate','5');pending.splice(0).forEach(f=>f());ok(startHp-state.hp===Math.round((31-stats().def)*.5),'Fortification did not halve incoming damage');
for(let i=0;i<3;i++){fight('guard');pending.splice(0).forEach(f=>f())}ok(battle.fortify===0,'Fortification did not expire after four enemy turns');battle=null;pending.length=0;
fresh(1,5);state.level=4;ok(ultimateChoices().includes('Unlock at level 5'),'Locked choice UI absent');state.level=5;ok(ultimateChoices().includes('Choose Meteor Requiem'),'Unlocked choice UI absent');

// Mobile detection and held-pointer lifecycle. These exercise the real move function.
fresh(0,1);screen='world';ok(!wantsTouchControls(),'Desktop incorrectly detected as touch');mediaState.matches=true;ok(wantsTouchControls(),'Phone media detection failed');
const padButton={dataset:{move:'0,-1'},classList:{add(){},remove(){}},setPointerCapture(id){this.captured=id}};
function pointer(id=1){return {pointerId:id,button:0,target:{closest(){return padButton}},preventDefault(){}}}
startTouchMove(pointer());ok(state.y===23&&padButton.captured===1,'Tap did not move immediately or capture pointer');ok(intervals.size===1,'Hold timer missing');
for(const tick of intervals.values())tick();ok(state.y===22,'Held button did not repeat movement');
endTouchMove(pointer(2));ok(intervals.size===1,'Second finger incorrectly cancelled movement');
endTouchMove(pointer());ok(intervals.size===0&&touchPointer===null,'Lifting finger did not stop movement');
padButton.dataset.move='-1,-1';state.x=8;state.y=24;startTouchMove(pointer());ok(state.x===7&&state.y===23,'Diagonal touch movement failed');listeners.pointercancel(pointer());ok(intervals.size===0,'Pointer cancellation did not stop movement');
state.x=8;state.y=24;startTouchMove(pointer());listeners.lostpointercapture(pointer());ok(intervals.size===0,'Losing pointer capture left movement running');
state.x=8;state.y=24;startTouchMove(pointer());listeners.blur();ok(intervals.size===0,'App blur left movement running');
state.x=8;state.y=24;startTouchMove(pointer());listeners.visibilitychange();ok(intervals.size===0,'Hiding app left movement running');
state.x=8;state.y=24;startTouchMove(pointer());const owner=touchPointer;startTouchMove(pointer(2));ok(touchPointer===owner&&intervals.size===1,'Multitouch started a competing movement timer');stopTouchMove();
modalStack=[elStub];const before=state.steps;startTouchMove(pointer());ok(intervals.size===0&&state.steps===before,'Movement occurred behind a menu');modalStack=[];
startBattle('grove');startTouchMove(pointer());ok(intervals.size===0,'Movement started during combat');battle=null;
state.x=8;state.y=24;startTouchMove(pointer());startBattle('grove');ok(intervals.size===0,'Entering combat left movement running');battle=null;
ok((mobileControls().match(/data-move=/g)||[]).length===8,'Eight-direction pad missing');
console.log(checks+' engine assertions passed; mobile controls and 16 ultimates verified; campaign completed.');



`,Object.assign(sandbox,{elStub:el}));
