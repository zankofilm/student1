import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const code=readFileSync(new URL('app/src/main/assets/girl-dashboard.js',root),'utf8');
const java=readFileSync(new URL('app/src/main/java/ir/madreseyar/student/MainActivity.java',root),'utf8');
const css=readFileSync(new URL('app/src/main/assets/girl-dashboard.css',root),'utf8');
function setup({online=true,syncResult='ذخیره شد'}={}){
  let ready=false;
  let current='home',moreCount=0,homeCount=0,syncCount=0,backCount=0,scrollPos=-1,displayText='',shieldCount=0;
  const history={state:{msyStudentPage:'home'},back(){backCount++;current='home';this.state={msyStudentPage:'home'};}};
  const syncLabel={textContent:'حالت محلی'};
  const status={textContent:'حالت محلی'};
  const page={querySelector(sel){return sel==='.v115-hero'&&current==='home'?{}:null}};
  const home={classList:{contains(c){return c==='active'&&current==='home'}},click(){homeCount++;current='home';history.state={msyStudentPage:'home'};}};
  const more={click(){moreCount++;current='more';history.state={msyStudentPage:'more'};}};
  const manual={onclick:async()=>{syncCount++;syncLabel.textContent=syncResult;}};
  const elements=[];
  const body={classList:{toggle(){}},addEventListener(){},appendChild(node){elements.push(node);node.remove=()=>{node.removed=true;};if(node.id==='msySyncShieldV14')shieldCount++;}};
  const document={body,querySelector(sel){
    if(sel==='#appView')return ready?{classList:{contains(){return false}}}:null;
    if(sel==='#page')return page;
    if(sel==='#msyGirlHome')return current==='home'?{}:null;
    if(sel==='#bottomNav [data-page="home"]')return home;
    if(sel==='#bottomNav [data-page="more"]')return more;
    if(sel==='#manualSyncBtn')return current==='more'?manual:null;
    if(sel==='#syncLabel')return syncLabel;
    if(sel==='#msyGirlHome .msy-sync-status span')return status;
    return null;
  },addEventListener(){},createElement(){return {innerHTML:'',id:'',className:'',textContent:'',setAttribute(){},remove(){this.removed=true;}}}};
  const win={history,scrollY:282,scrollTo(x,y){scrollPos=y;},addEventListener(){}};
  vm.runInNewContext(code,{window:win,document,navigator:{onLine:online},MutationObserver:class{observe(){}},setTimeout(fn){fn();},alert(){},Intl,Date});
  ready=true;
  return {win,get current(){return current},get moreCount(){return moreCount},get homeCount(){return homeCount},get syncCount(){return syncCount},get backCount(){return backCount},get scrollPos(){return scrollPos},get displayText(){return status.textContent},get shieldCount(){return shieldCount},elements};
}
test('update on Home runs real manual sync and restores dashboard without extra back entry',async()=>{
  const s=setup();await s.win.__msyGirlRefresh();
  assert.equal(s.current,'home');assert.equal(s.moreCount,1);assert.equal(s.syncCount,1);
  assert.equal(s.homeCount,0);assert.equal(s.backCount,1);assert.equal(s.scrollPos,282);
  assert.match(s.displayText,/به‌روز شد/);assert.equal(s.shieldCount,1);
  assert.ok(s.elements.some(x=>x.id==='msySyncShieldV14'&&x.removed));
});
test('offline update keeps home visible and never executes server sync',async()=>{
  const s=setup({online:false});await s.win.__msyGirlRefresh();
  assert.equal(s.current,'home');assert.equal(s.moreCount,0);assert.equal(s.syncCount,0);
  assert.equal(s.shieldCount,0);assert.ok(s.elements.some(x=>x.className.includes('error')));
});
test('failed server sync returns to home without false success status',async()=>{
  const s=setup({syncResult:'حالت محلی'});await s.win.__msyGirlRefresh();
  assert.equal(s.current,'home');assert.equal(s.syncCount,1);assert.equal(s.backCount,1);
  assert.equal(s.displayText,'حالت محلی');assert.ok(s.elements.some(x=>x.className.includes('error')));
});
test('native update path and style no longer leave the app on More',()=>{
  assert.match(java,/window\.__msyGirlRefresh\(\)/);
  const method=java.slice(java.indexOf('private void updateNow()'),java.indexOf('private void askNotificationPermission()'));
  assert.doesNotMatch(method,/data-page=\\\"more/);
  assert.match(css,/#msySyncShieldV14/);
  assert.doesNotMatch(code,/setTimeout\(\(\)=>\{const sync=\$\('#manualSyncBtn'\)/);
});
