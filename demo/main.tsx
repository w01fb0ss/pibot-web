import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '@pibot/ui';
import '@pibot/ui/tokens.css';
import '@app/page.module.css';
import { SettingsProvider, useSettings, useT } from '@app/app/settings.tsx';
import { NavigationProvider, useNavigation } from '@app/app/navigation.tsx';
import { WorkspaceProvider } from '@app/features/workspace/data.tsx';
import { ChatScreen } from '@app/features/chat/index.tsx';
import { WelcomeFlow } from '@app/features/welcome/index.tsx';
import { ProfessionFlow } from '@app/features/builtin/ProfessionFlow.tsx';
import { RoutineOverlay } from '@app/features/routines/RoutineOverlay.tsx';
import { TeamOverlays } from '@app/features/teams/TeamOverlays.tsx';
import { RestoreRequestProvider } from '@app/features/changes/restore-requests.tsx';
import { ComposerDraftProvider } from '@app/features/chat/composer-drafts.tsx';
import { TaskInputProvider } from '@app/features/execution/task-inputs.tsx';
import welcome from '@app/features/welcome/welcome.module.css';
import { configureScene, installDesktopDemo, id, finishProfession, setProductDisplay } from './fixtures';
import './frame.css';
installDesktopDemo();
const scenes=['welcome','presets','main','team','plan','browser','teach','changes','preview','connectors','memory','inbox','routine','audit','yolo'];
function announce(scene:string){window.parent.postMessage({type:'pi-product-selected',scene},location.origin);}
function Tour() {
  const [scene,setScene]=useState(()=>new URLSearchParams(location.search).get('scene')||'welcome');
  const {navigate,openWorkspace,closeBotPanel}=useNavigation();
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
    // openWorkspace changes identity with the current view; depending on it would re-run navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[scene,navigate,closeBotPanel]);
  useEffect(()=>{
    // Open the side pane the way a visitor would, once the real header controls have rendered.
    const pane=scene==='plan'?t('afx.tasks'):scene==='changes'?t('sidePane.changes'):scene==='browser'?t('sidePane.browser'):null;
    // Open the outline first so the spreadsheet ends up as the active preview tab.
    const files=scene==='preview'?['button[aria-label$=".md"]','button[aria-label$=".xlsx"]']:[];
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
  return <><ChatScreen key={scene}/><RoutineOverlay/><TeamOverlays/></>;
}
function Product() {
  const {theme}=useSettings();
  return <ThemeProvider theme={theme}><NavigationProvider><WorkspaceProvider><Tour/></WorkspaceProvider></NavigationProvider></ThemeProvider>;
}
createRoot(document.getElementById('root')!).render(<SettingsProvider><RestoreRequestProvider><TaskInputProvider><ComposerDraftProvider><Product/></ComposerDraftProvider></TaskInputProvider></RestoreRequestProvider></SettingsProvider>);
