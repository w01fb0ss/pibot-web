import './install';
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '@pibot/ui';
import '@pibot/ui/tokens.css';
import '@app/page.module.css';
import { RpcContext, useNavigation, useSettings, useT } from '@pibot/renderer-kit';
import { RoutineOverlay } from '@pibot/routines/ui';
import { ProfessionFlow, TeamOverlays } from '@pibot/teams/ui';
import { RestoreRequestProvider } from '@pibot/workspaces/ui';
import { SettingsProvider } from '@app/app/settings.tsx';
import { NavigationProvider } from '@app/app/navigation.tsx';
import { BrowserPorts } from '@app/app/browser-ports.tsx';
import { ConnectorsPorts } from '@app/app/connectors-ports.tsx';
import { RoutinesPorts } from '@app/app/routines-ports.tsx';
import { SkillsPorts } from '@app/app/skills-ports.tsx';
import { WorkspacesPorts } from '@app/app/workspaces-ports.tsx';
import { UpdatesProvider } from '@app/features/app-menu/updates.tsx';
import { WorkspaceProvider } from '@app/features/workspace/data.tsx';
import { ChatScreen } from '@app/features/chat/index.tsx';
import { SettingsScreen } from '@app/features/settings/index.tsx';
import { WelcomeFlow } from '@app/features/welcome/index.tsx';
import { ComposerDraftProvider } from '@app/features/chat/composer/composer-drafts.tsx';
import { TaskInputProvider } from '@app/features/execution/task-inputs.tsx';
import welcome from '@app/features/welcome/welcome.module.css';
import { configureScene, id, finishProfession, setProductDisplay, peer } from './fixtures';
import './frame.css';
const scenes=['welcome','presets','main','team','plan','browser','teach','changes','preview','connectors','memory','devices','computer','inbox','routine','audit','yolo'];
function announce(scene:string){window.parent.postMessage({type:'pi-product-selected',scene},location.origin);}
function Tour() {
  const [scene,setScene]=useState(()=>new URLSearchParams(location.search).get('scene')||'welcome');
  const {navigate,openWorkspace,closeBotPanel,openSettings,closeSettings,settingsOverlay}=useNavigation();
  const t=useT();
  useEffect(()=>{
    function receive(event:MessageEvent){
      if(event.source!==parent||event.origin!==location.origin)return;
      if(event.data?.type==='pi-product-display'){setProductDisplay(event.data.display);return;}
      if(event.data?.type!=='pi-product-scene')return;
      const next=event.data.scene;
      if(!scenes.includes(next))return;
      configureScene(next);setScene(next);
    }
    addEventListener('message',receive);parent.postMessage({type:'pi-product-ready'},location.origin);
    return()=>removeEventListener('message',receive);
  },[]);
  useEffect(()=>{
    configureScene(scene);
    navigate(scene==='team'?{name:'chat',groupId:id('demo-team')}:scene==='inbox'?{name:'inbox'}:scene==='routine'?{name:'routines'}:scene==='audit'?{name:'audit'}:scene==='connectors'?{name:'connectors'}:scene==='teach'?{name:'teach',botId:id('steward')}:{name:'chat',botId:id('pi'),topicId:id(scene==='main'?'topic-main':`topic-${scene}`)});
    if(scene==='memory')openWorkspace({name:'profile',botId:id('pi'),target:'memory'});else closeBotPanel();
    if(scene==='devices')openSettings('remote');else if(scene==='computer')openSettings('computer');else closeSettings();
    // openWorkspace changes identity with the current view; depending on it would re-run navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[scene,navigate,closeBotPanel]);
  useEffect(()=>{
    // Open the side pane the way a visitor would, once the real header controls have rendered.
    const pane=scene==='plan'?t('agentWork.tasks'):scene==='changes'?t('sidePane.changes'):scene==='browser'?t('sidePane.browser'):null;
    // Open the outline first so the spreadsheet ends up as the active preview tab.
    const files=scene==='preview'?['button[aria-label$=".md"]','button[aria-label$=".xlsx"]']:[];
    if(scene==='devices'){
      // The paired devices sit below the connection settings; show them the way a visitor scrolls.
      const frame=setTimeout(()=>{const heading=[...document.querySelectorAll<HTMLElement>('dialog h2,dialog h3,dialog h4')].find(h=>h.textContent?.trim()===t('remote.devices'));heading?.scrollIntoView({block:'start'});(document.activeElement as HTMLElement|null)?.blur();},500);
      return()=>clearTimeout(frame);
    }
    if(scene==='connectors'||scene==='memory'){const frame=setTimeout(()=>(document.activeElement as HTMLElement|null)?.blur(),300);return()=>clearTimeout(frame);}
    if(!pane&&!files.length)return;
    let tries=0;
    const timer=setInterval(()=>{
      const button=pane?[...document.querySelectorAll<HTMLButtonElement>('nav button[aria-pressed]')].find(b=>b.getAttribute('aria-label')?.startsWith(pane)):document.querySelector<HTMLButtonElement>(files[0]);
      if(button&&!button.disabled){
        if(button.getAttribute('aria-pressed')!=='true')button.click();
        files.shift();
        if(!files.length){clearInterval(timer);requestAnimationFrame(()=>(document.activeElement as HTMLElement|null)?.blur());}
      }else if(++tries>50)clearInterval(timer);
    },100);
    return()=>clearInterval(timer);
  },[scene,t]);
  const finish=()=>{configureScene('main');setScene('main');announce('main');};
  if(scene==='welcome')return <WelcomeFlow onDone={finish}/>;
  if(scene==='presets')return <main className={welcome.root}><div className={welcome.body}><div className={welcome.content}><ProfessionFlow skipLabel={t('builtin.profession.skip')} onFinish={result=>{finishProfession(result);finish();}}/></div></div></main>;
  return <><ChatScreen key={scene}/><RoutineOverlay/><TeamOverlays/>{settingsOverlay&&<SettingsScreen section={settingsOverlay.section} target={settingsOverlay.target} onClose={()=>{closeSettings();if(scene==='devices'||scene==='computer'){configureScene('main');setScene('main');announce('main');}}}/>}</>;
}
// Same provider order as the desktop App; the demo peer stands in for the brain's MessagePort.
const rpc={peer:peer as any,state:'ready' as const,consumeNavigation(){}};
function Product() {
  const {theme}=useSettings();
  return <ThemeProvider theme={theme}><NavigationProvider><WorkspaceProvider><RoutinesPorts><BrowserPorts><SkillsPorts><ConnectorsPorts><UpdatesProvider><Tour/></UpdatesProvider></ConnectorsPorts></SkillsPorts></BrowserPorts></RoutinesPorts></WorkspaceProvider></NavigationProvider></ThemeProvider>;
}
createRoot(document.getElementById('root')!).render(<RpcContext.Provider value={rpc}><SettingsProvider><WorkspacesPorts><RestoreRequestProvider><TaskInputProvider><ComposerDraftProvider><Product/></ComposerDraftProvider></TaskInputProvider></RestoreRequestProvider></WorkspacesPorts></SettingsProvider></RpcContext.Provider>);
