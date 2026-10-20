import { DEFAULT_EXECUTION_LIMITS, RpcError, RpcErrorCodes } from '@pibot/protocol';
import { builtinApps } from '@pibot/connectors-builtins';
import { previewFiles } from './preview-files';
import {catalogsByLanguage,localize,preserveUserMessage} from './locale';
// Every record below belongs to this in-memory product tour, never to the desktop app.
const time = (hour=9,minute=0) => { const d=new Date();d.setHours(hour,minute,0,0);return d.toISOString(); };
const now=()=>new Date().toISOString();
let scene='welcome';
const ids=new Map<string,string>();
export function id(value:string){if(!ids.has(value))ids.set(value,crypto.randomUUID());return ids.get(value)!;}
const idKeys=new Set(['id','botId','groupId','coordinatorBotId','assigneeBotId','createdByBotId','conversationId','threadConversationId','topicId','messageId','userMessageId','assistantMessageId','runId','triggerId','routineId','threadId','topicConversationId','primaryFolderId','rootRunId','parentRunId','parentTaskId','taskId','pluginInstallationId','connectorId']);
function wire(value:any,key=''):any {
 if(Array.isArray(value))return value.map(v=>wire(v,key));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,wire(v,k)]));
 if(typeof value==='string'&&value!=='home'){
  if(idKeys.has(key)||['botIds','groupIds','reusedBotIds'].includes(key))return id(value);
  if(key==='conversationKey'){const [type,...rest]=value.split(':');return `${type}:${id(rest.join(':'))}`;}
 }
 return value;
}
function unwire(value:any):any {
 if(Array.isArray(value))return value.map(unwire);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,unwire(v)]));
 if(typeof value==='string'){for(const [key,uuid] of ids){if(value===uuid)return key;if(value===`dm:${uuid}`)return `dm:${key}`;if(value===`group:${uuid}`)return `group:${key}`;}}
 return value;
}
const handlers=new Map<string,Set<(data:any)=>void>>();
export function emit(event:string,data:any={}){const value=localize(data,settings.language);for(const handler of handlers.get(event)||[])handler(event==='settings.changed'?value:wire(value));}
const initialDisplay=new URLSearchParams(location.search);
const initialTheme=initialDisplay.get('theme')||document.documentElement.dataset.themePreference||'system';
const settings={language:(initialDisplay.get('lang')||document.documentElement.dataset.language)==='en'?'en':'zh',theme:['light','dark','system'].includes(initialTheme)?initialTheme:'system',onboardingCompleted:true,openAtLogin:false,showTrayIcon:true,closeToTrayHintShown:true,defaultModel:{provider:'demo',id:'demo-model',thinkingLevel:'medium'}};
const model={provider:'demo',id:'demo-model',name:'自选模型',available:true,contextWindow:200000,input:['text','image'],reasoning:true,cost:{input:null,output:null,cacheRead:null,cacheWrite:null}};
const makeBot=(id:string,name:string,color='violet',shape='blob',description='')=>({id,name,isMain:id==='pi',category:'chat',avatarShape:shape,avatarColor:color,avatarEyes:'marks',modelProvider:'demo',modelId:'demo-model',thinkingLevel:'medium',systemPrompt:'',createdAt:time(),updatedAt:time(),description,permissionOverrides:{},quickPrompts:[]});
const baseBots=[makeBot('pi','Pi','violet','blob','你的日常搭子'),makeBot('researcher','研究员','blue','pebble','把好奇变成答案'),makeBot('writer','写作搭子','pink','flower','一起找到好表达'),makeBot('steward','小管家','teal','bean','琐事放心交给我')];
let bots=[...baseBots];
const group={id:'demo-team',name:'灵感小分队',coordinatorBotId:'pi',announcement:'一起收集灵感、梳理想法，把内容做好。',autoRoundLimit:8,paused:false,workplace:{kind:'none'},folders:[],members:['pi','researcher','writer'].map((botId,position)=>({botId,position,joinedAt:time()})),conversationId:'conversation-team',topicTitle:'newsletter 灵感',createdAt:time(),updatedAt:time()};
let groups=[group];
let yolo=new Set<string>();
const message=(id:string,conversationId:string,role:string,content:string,botId='pi')=>({id,conversationId,role,content,botId:role==='user'?null:botId,status:'done',runId:null,errorCode:null,usage:null,createdAt:time(9,41),updatedAt:time(9,41),tools:[]});
const histories:Record<string,any[]>={
  'conversation-team':[
    message('team-1','conversation-team','user','想写一期「让工作轻一点」的 newsletter，帮我找找灵感，再整理一个提纲。'),
    message('team-2','conversation-team','assistant','好，我们分头行动。研究员收集参考资料，写作搭子整理提纲，我来汇总。'),
    message('team-3','conversation-team','assistant','参考资料已整理好。我选了三个切入点：注意力、日常习惯，以及给计划留一点余地。','researcher'),
    message('team-4','conversation-team','assistant','提纲准备好了：从一个日常小故事开始，接着聊「少做一点，做好一点」，最后留一个可执行的小练习。','writer'),
  ],
};
for(const [key,request,reply] of [
  ['browser','帮我查找几个值得参考的展览网页，把时间、地点和来源整理到一起。','我已打开参考页面。你可以查看浏览器，需要登录或手动操作时接管，再交还给我继续。'],
  ['changes','把资料简报按工作日整理，改完让我看看 diff，再帮我审查一次。','已经调整了三个文件。你可以查看改动、写批注，或者让我做一次审查，再决定是否提交。'],
  ['yolo','整理这些资料，再把目录和内容提纲一起准备好。','好，我会按当前对话的权限设置执行。希望减少打断时，可以在对话菜单中开启 YOLO；自动允许也会写入记录。'],
  ['plan','先别动文件，帮我规划这期 newsletter 怎么做，能并行的部分拆出去。','好，这次只规划不执行。我把工作拆成五步，资料核对和开头故事交给子任务并行准备，计划和进度都在右侧「任务」里。'],
  ['preview','把发布排期整理成表格，提纲也一起给我。','排期表和提纲都准备好了，可以直接在右侧预览。'],
]){const id=`topic-${key}`;histories[id]=[message(`${key}-1`,id,'user',request),message(`${key}-2`,id,'assistant',reply)];}
histories['topic-preview'][1].attachments=previewFiles.map(file=>file.attachment);
let inbox:any[]=[{kind:'approval',cursor:`${time(9,42)}|approval-demo`,conversationId:'topic-yolo',conversationKind:'dm',approval:{id:'approval-demo',botId:'pi',runId:'run-demo',messageId:'yolo-2',toolCallId:'write-demo',category:'write_file',source:'chat',risk:'normal',title:'保存内容提纲',facts:[{kind:'write',value:'/工作空间/灵感工作室/提纲.md'}],grantScope:{kind:'workplace',root:'/工作空间/灵感工作室'},canRemember:true,remembered:false,isolation:{available:true},status:'pending',resolvedAt:null,createdAt:time(9,42),expiresAt:time(23,59)}}];
let audit:any[]=[
  {id:'audit-4',kind:'approval.resolved',at:time(9,45),botId:'pi',runId:'run-demo',summary:'允许保存内容提纲',detail:{category:'write_file',decision:'allow',status:'allowed',reasonCode:'user',toolName:'write_file',path:'/工作空间/灵感工作室/提纲.md'}},
  {id:'audit-3',kind:'file.written',at:time(9,43),botId:'writer',runId:null,summary:'写入内容提纲',detail:{toolName:'write_file',path:'/工作空间/灵感工作室/提纲.md',bytes:1280}},
  {id:'audit-2',kind:'approval.resolved',at:time(9,40),botId:'researcher',runId:null,summary:'允许读取展览网页',detail:{category:'web',toolName:'fetch',domain:'example.com',status:'allowed',decision:'allow',reasonCode:'user'}},
  {id:'audit-1',kind:'exec.finished',at:time(9,38),botId:'pi',runId:'run-demo',summary:'检查文件目录',detail:{toolCallId:'exec-demo',command:'ls -la',cwd:'/工作空间/灵感工作室',exitCode:0,durationMs:120}},
];
const routineBase={version:1,instructions:'整理资料并输出简报，保留来源链接。',workplace:{kind:'folder',folderId:'home',readonly:[]},preauth:[],notify:'always',maxDurationMin:30,carryLastResult:true,missedPolicy:null,enabled:true,pausedReason:null,createdAt:time(),updatedAt:time()};
let routines:any[]=[
 {...routineBase,id:'routine-morning',botId:'steward',name:'工作日资料简报',triggers:[{kind:'cron',expr:'30 8 * * 1-5',timezone:Intl.DateTimeFormat().resolvedOptions().timeZone}]},
 {...routineBase,id:'routine-folder',botId:'researcher',name:'整理新收到的文件',triggers:[{kind:'folder',path:'/工作空间/收件箱',events:'new',pattern:'*',recursive:false,cooldownMin:5}]},
 {...routineBase,id:'routine-evening',botId:'writer',name:'整理今日内容',triggers:[{kind:'cron',expr:'0 17 * * 1-5',timezone:Intl.DateTimeFormat().resolvedOptions().timeZone}]},
];
for(const routine of routines){routine.lastScheduledAt=time(8,30);routine.topicConversationId=`topic-${routine.id}`;routine.deletedAt=null;routine.triggers=routine.triggers.map((config:any,index:number)=>({id:`trigger-${routine.id}-${index}`,routineId:routine.id,config,state:{},createdAt:time()}));}
const completedRun={id:'routine-run-morning',routineId:'routine-morning',botId:'steward',triggerId:'trigger-routine-morning-0',reason:'cron',scheduledFor:time(8,30),queuedAt:time(8,30),queueExpiresAt:null,maxDurationMin:30,startedAt:time(8,30),finishedAt:time(8,32),status:'done',runId:'run-morning',conversationId:'topic-routine-morning',triggerMessageId:null,errorCode:null,summary:'已整理 6 条新资料，生成今日简报并保留来源链接。',allowedOps:[],activeMs:120000,waitingMs:0,activeSince:null,waitingSince:null,waitExpiresAt:null,createdAt:time(8,30)};
const tasks=[['task-research','researcher','收集灵感与参考','已整理三组参考资料与来源链接。'],['task-outline','writer','整理内容提纲','已完成内容提纲，等待你一起打磨。']].map(([taskId,assigneeBotId,title,summary])=>({id:taskId,groupId:'demo-team',threadConversationId:`thread-${taskId}`,assigneeBotId,title,instructions:title,status:'done',summary,createdByBotId:'pi',createdAt:time(9,40),finishedAt:time(9,41)}));
const workplace={home:'/工作空间/灵感工作室',folders:[],currentId:'home',revision:0};
const changeRoot={id:'home',name:'灵感工作室',path:'/工作空间/灵感工作室',role:'primary'};
let changeFiles=[{path:'src/brief.ts',status:'modified',added:14,removed:3,binary:false,generated:false},{path:'src/schedule.ts',status:'modified',added:8,removed:1,binary:false,generated:false},{path:'README.md',status:'modified',added:2,removed:0,binary:false,generated:false}];
const git={state:'repo',branch:'main',head:'a'.repeat(40),operation:null,writable:true,readOnlyReason:null,subdirectory:null,hooksSkipped:true,writesIsolated:true,upstream:{ahead:0,behind:0}};
let catalogs=catalogsByLanguage[settings.language as 'zh'|'en'] as any;
function builtinPlan(params:any){const gs=catalogs.groups.filter((g:any)=>params.groups.includes(g.id));const ids=[...new Set([...gs.flatMap((g:any)=>g.members),...params.roles])];return {groups:gs.map((g:any)=>({...g,templateId:g.id,available:true,skipped:[]})),bots:ids.map((id:any)=>({roleId:id,name:catalogs.roles.find((r:any)=>r.id===id)?.defaultBotName,groups:gs.filter((g:any)=>g.members.includes(id)).map((g:any)=>g.id),standalone:params.roles.includes(id)})),counts:{groups:gs.length,newBots:ids.length,maxGroups:3,maxBots:10}};}
let browserState:any={botId:'pi',open:true,takeover:false,sleeping:false,viewing:true,recording:false,lastActivityAt:now(),tabs:[{id:'tab-exhibitions',title:'展览资料',url:'https://example.com/exhibitions',active:true,loading:false},{id:'tab-notes',title:'灵感笔记',url:'https://example.com/notes',active:false,loading:false}]};
const browserReceivers=new Set<(id:string,port:MessagePort)=>void>();
const framePorts=new Map<string,MessagePort>();
async function browserFrame(botId:string,display?:any){
 if(!browserReceivers.size)return;
 framePorts.get(botId)?.close();
 const channel=new MessageChannel();framePorts.set(botId,channel.port1);
 for(const receive of browserReceivers)receive(id(botId),channel.port2);
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=800;
 const c=canvas.getContext('2d')!;c.fillStyle='#f7f4ec';c.fillRect(0,0,640,800);
 c.fillStyle='#252b36';c.font='18px sans-serif';c.fillText(localize('FIELD NOTES / 示例网页',settings.language),42,52);
 c.fillRect(42,76,556,2);c.font=settings.language==='en'?'bold 33px sans-serif':'bold 42px sans-serif';c.fillText(localize(browserState.tabs[0]?.active?'周末，去看一场展。':'给灵感留一点空间。',settings.language),42,160);
 c.font='20px sans-serif';c.fillStyle='#777';c.fillText(localize('城市展览 · 时间、地点与资料整理',settings.language),42,210);
 c.fillStyle='#d8d9cd';c.fillRect(42,250,556,250);c.fillStyle='#7d8974';c.fillRect(105,292,135,160);c.fillStyle='#e8b097';c.beginPath();c.arc(405,380,90,0,Math.PI*2);c.fill();
 c.fillStyle='#252b36';c.font='bold 25px sans-serif';c.fillText(localize('在日常里，发现新的视角',settings.language),42,560);c.font='18px sans-serif';c.fillStyle='#666';c.fillText(localize('10:00 — 18:00 · 城市艺术空间',settings.language),42,607);c.fillText(localize('整理开放时间、交通信息与参考来源。',settings.language),42,650);c.fillText(localize('演示内容，不连接外部网站。',settings.language),42,735);
 const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',.85));if(!blob)return;
 const data=new Uint8Array(await blob.arrayBuffer());
 channel.port1.postMessage({type:'tabs',botId:id(botId),tabs:localize(browserState.tabs,settings.language),takeover:browserState.takeover});
 channel.port1.postMessage({type:'frame',botId:id(botId),tabId:browserState.tabs.find((t:any)=>t.active)?.id||'tab-exhibitions',seq:1,mimeType:'image/jpeg',width:640,height:800,data});
}
const planTodo={goal:'发布「让工作轻一点」newsletter',items:[['todo-sources','收集并核对参考资料','done'],['todo-outline','确定提纲与结构','done'],['todo-story','准备开头小故事','in_progress'],['todo-draft','写完整初稿','pending'],['todo-send','排版、预览并定时发送','pending']].map(([id,title,status])=>({id,title,status})),version:3,updatedAt:time(9,46)};
const planTasks=[['task-check','核对三组参考资料的来源链接','done','三组资料的来源链接都能打开，其中一篇改用原始出处。'],['task-story','准备两个开头小故事备选','running',null],['task-tone','对比往期语气，给出写作建议','queued',null]].map(([taskId,title,status,result],index)=>({id:taskId,botId:'pi',conversationId:'topic-plan',parentTaskId:null,rootRunId:'run-plan',parentRunId:'run-plan',runId:status==='queued'?null:`run-${taskId}`,title,status,version:1,createdAt:time(9,44+index),updatedAt:time(9,46),result,resultTruncated:false,needsVerification:false}));
const installedAt=time(8,50);
const connectorApps=()=>builtinApps('darwin');
const connectors=[{id:'connector-github',pluginInstallationId:'install-github',serverId:'github',revision:1,catalogVersion:1,kind:'mcp_remote',identity:'user',appId:'github',name:'GitHub',enabled:true,status:'ready',statusDetailCode:null,createdAt:installedAt,updatedAt:installedAt},{id:'connector-calendar',pluginInstallationId:'install-calendar',serverId:'calendar',revision:1,catalogVersion:1,kind:'builtin',identity:'user',appId:'calendar',name:'本机日历',enabled:true,status:'ready',statusDetailCode:null,createdAt:installedAt,updatedAt:installedAt}];
const installations=connectors.map(c=>({id:c.pluginInstallationId,pluginId:c.serverId,version:'1',digest:'d'.repeat(64),revision:1,sourceKind:'builtin',status:'installed',enabled:true,createdAt:installedAt,updatedAt:installedAt}));
const teachSteps=[['navigate','https://example.com/login','报表中心登录页'],['type','https://example.com/login','账号','demo@example.com'],['type','https://example.com/login','密码',null,true],['submit','https://example.com/login','登录'],['click','https://example.com/reports','报名统计'],['select','https://example.com/reports','时间范围','本周'],['download','https://example.com/reports','导出 CSV']].map(([kind,url,target,value,secret],index)=>({index,kind,url,target,...(value?{value}:{}),secret:!!secret,hasThumbnail:false,at:time(10,index)}));
const teachRecording={id:'recording-demo',botId:'steward',status:'review',startedAt:time(10,0),endedAt:time(10,7),steps:teachSteps};
const teachDraft={recordingId:'recording-demo',name:'导出本周报名表',description:'登录报表中心，按时间范围导出报名表 CSV，保存到收件箱。',body:'1. 打开报表中心并登录（账号密码由已保存的凭据自动填写）。\n2. 进入「报名统计」。\n3. 时间范围选择 {range}。\n4. 点击「导出 CSV」，保存到 /工作空间/收件箱。',params:[{name:'range',description:'时间范围',default:'本周'}],permissions:{domains:['example.com'],writePaths:['/工作空间/收件箱'],sendTo:[]},trigger:'chat'};
const memories=[['memory-1','about_you','你更喜欢先看结论，再看细节。'],['memory-2','work','newsletter 每周一 08:30 发送，读者主要是独立工作者。'],['memory-3','how_to','整理资料时保留原始来源链接。']].map(([memoryId,category,text])=>({id:memoryId,botId:'pi',text,category,sourceMessageId:null,createdAt:time(9,30),updatedAt:time(9,30)}));
const calls=new Set<string>();
export function configureScene(next:string){scene=next;if(!['welcome','presets','main'].includes(next)){bots=[...new Map([...bots,...baseBots].map(b=>[b.id,b])).values()];if(!groups.some(g=>g.id==='demo-team'))groups=[...groups,group];}emit('bots.changed',{});}
export function finishProfession(result:any){if(!result){bots=[baseBots[0]];groups=[];emit('bots.changed');emit('groups.changed');emit('sidebar.changed');}}
export const peer={
 on(event:string,handler:(data:any)=>void){let set=handlers.get(event);if(!set){set=new Set();handlers.set(event,set);}set.add(handler);return()=>set!.delete(handler);},
 async call(method:string,p:any={}) : Promise<any> {
  p ||= {};calls.add(method);(window as any).__productCalls=[...calls];
  switch(method){
   case 'settings.get':return {...settings};
   case 'settings.set':setProductDisplay(p,true);return {...settings};
   case 'network.getConfig':return {mode:'system'};
   case 'bots.list':return p.before?[]:bots;
   case 'bots.profile':return {bot:bots.find(b=>b.id===p.botId)||baseBots.find(b=>b.id===p.botId)||bots[0],memories:p.botId==='pi'?memories:[],proposals:[],permissionOverrides:{}};
   case 'models.list':return [model];
   case 'models.images':return [];
   case 'providers.list':return [{id:'demo',name:'自选模型',auth:'api_key',connected:true}];
   case 'groups.list':return p.before?[]:groups;
   case 'groups.get':return groups.find(g=>g.id===p.groupId)||group;
   case 'groups.tasks':return p.before?[]:tasks;
   case 'groups.tasks.summary':return {openCount:0,closedCount:tasks.length,batches:[],collaborations:[]};
   case 'chat.runs':return [];
   case 'execution.budget.get':return p.conversationId==='topic-plan'?{rootRunId:'run-plan',limits:DEFAULT_EXECUTION_LIMITS,activeMillis:184000,tools:23,requests:9,childTasks:3,activeChildren:1,maxDepth:1,observedTokens:48200,knownCostUsd:0,unknownUsageRequests:0,unknownCostRequests:0,exhaustedReason:null,version:4}:null;
   case 'changes.remotes':return {head:git.head,branch:git.branch,upstream:{remote:'origin',branch:'main'},remotes:[{name:'origin',fetchHost:'github.com',pushHost:'github.com',fetchSupported:true,pushSupported:true}],writable:true};
   case 'teach.start':case 'teach.review':case 'teach.stop':return scene==='teach'?teachRecording:(()=>{throw new RpcError(RpcErrorCodes.unsupported,'No recording');})();
   case 'teach.pause':return {paused:!!p.paused};
   case 'teach.discard':return {ok:true};
   case 'teach.draft':return {draft:{...teachDraft}};
   case 'teach.trial':{const runId=crypto.randomUUID();setTimeout(()=>emit('chat.done',{botId:'steward',conversationId:'topic-steward',runId,messageId:crypto.randomUUID(),usage:null}),1200);return {runId};}
   case 'teach.save':return {id:'skill-demo',botId:'steward',name:p.draft?.name||teachDraft.name,description:p.draft?.description||teachDraft.description,source:'taught',enabled:true,lastUsedAt:null,createdAt:now(),updatedAt:now()};
   case 'runtime.health.get':return {healthy:true,reason:null,botIds:[]};
   case 'execution.get':return {botId:p.botId,conversationId:p.conversationId,mode:p.conversationId==='topic-plan'?'plan':'execute',limits:DEFAULT_EXECUTION_LIMITS,version:0,updatedAt:null};
   case 'execution.todo.get':return p.conversationId==='topic-plan'?{botId:p.botId,conversationId:p.conversationId,...planTodo}:{botId:p.botId,conversationId:p.conversationId,goal:'',items:[],version:0,updatedAt:null};
   case 'execution.tasks.list':return {items:p.conversationId==='topic-plan'&&!p.before&&!p.archived?planTasks:[],nextBefore:null};
   case 'groups.execution.get':return {groupId:p.groupId,mode:'execute',limits:DEFAULT_EXECUTION_LIMITS,version:0,updatedAt:null};
   case 'groups.topics.history':{const rows=histories[groups.find(g=>g.id===p.groupId)?.conversationId||'']||[];return p.before?[]:rows.slice(-(p.limit||50));}
   case 'apps.list':return {items:connectorApps()};
   case 'connectors.list':return {items:connectors,nextCursor:null};
   case 'connectors.get':return {connector:connectors.find(c=>c.id===p.id)||connectors[0],access:{mode:'ask_first',bots:[]}};
   case 'connectors.tools':return {items:[],nextCursor:null};
   case 'plugins.list':return {items:installations,nextCursor:null};
   case 'secrets.list':return {items:[],nextCursor:null};
   case 'preview.read':{const file=previewFiles.find(f=>f.attachment.id===p.attachmentId);if(!file)throw new RpcError(RpcErrorCodes.unsupported,'Demo file unavailable');return file.read(settings.language);}
   case 'preview.cancel':case 'office.cancel':case 'preview.open':return null;
   case 'office.apps':return {apps:[]};
   case 'groups.status':return {round:1,roundLimit:8,paused:false,running:false};
   case 'groups.state':return {cycleId:null,rounds:1,limited:false};
   case 'sidebar.list':return {entries:[...groups.map(g=>`group:${g.id}`),...bots.map(b=>`dm:${b.id}`)].map(conversationKey=>({conversationKey,pinnedAt:null,groupId:null,hiddenAt:null,unread:false,lastReadAt:null})),groups:[]};
   case 'sidebar.groups.list':return [];
   case 'topics.list':return [{id:p.botId==='pi'?(scene==='main'?'topic-main':`topic-${scene}`):`topic-${p.botId}`,botId:p.botId,kind:'dm',isCurrent:true,title:'日常对话',createdAt:time(),updatedAt:time(),archivedAt:null}];
   case 'topics.get':return {id:p.topicId,botId:p.botId,kind:'dm',isCurrent:true,title:'日常对话',createdAt:time(),updatedAt:time(),archivedAt:null};
   case 'topics.busy':return {busy:false,runs:[]};
   case 'chat.history':{const id=p.groupId?groups.find(g=>g.id===p.groupId)?.conversationId:p.topicId||`topic-${p.botId}`;const rows=histories[id]||[];return p.before?[]:rows.slice(-(p.limit||50));}
   case 'approvals.pending':case 'chat.notices':case 'computer.status':return [];
   case 'credentials.status':return {storage:true,reveal:true};
   case 'credentials.capture.get':return null;
   case 'browser.googleCompat.get':return {botId:p.botId,enabled:false,enabledAt:null};
   case 'chat.status':return {state:'idle',runId:null,messageId:null};
   case 'chat.send':{const conversationId=p.topicId||`topic-${p.botId}`;const runId=crypto.randomUUID();const user=message(crypto.randomUUID(),conversationId,'user',p.text);preserveUserMessage(user);const reply=message(crypto.randomUUID(),conversationId,'assistant','这是官网里的产品演示。正式使用 Pi Bot 时，我会结合你的模型、工作目录和权限设置，与你一起完成这件事。',p.botId);user.runId=reply.runId=runId;user.createdAt=user.updatedAt=reply.createdAt=reply.updatedAt=now();histories[conversationId]=[...(histories[conversationId]||[]),user,reply];setTimeout(()=>{emit('chat.done',{botId:p.botId,conversationId,runId,messageId:reply.id,usage:null});emit('sidebar.changed',{conversationKey:`dm:${p.botId}`});},150);return {conversationId,runId,userMessageId:user.id,assistantMessageId:reply.id};}
   case 'chat.abort':return {ok:true};
   case 'topics.create':{const topicId=crypto.randomUUID();histories[topicId]=[];return {id:topicId,botId:p.botId,kind:'dm',isCurrent:true,title:'新话题',createdAt:now(),updatedAt:now(),archivedAt:null};}
   case 'workplaces.list':return workplace;
   case 'workplaces.home':return {id:'home',name:'主文件夹',path:'/工作空间/灵感工作室',displayPath:'灵感工作室',role:'primary'};
   case 'topics.workplace.get':return {topicId:p.topicId,folderId:'home',revision:0,busy:false,workplace,readonly:[]};
   case 'topics.workplace.initial':return {selection:{primary:'home',readonly:[]},workplace};
   case 'conversations.yolo.get':return {conversationId:p.conversationId,enabled:yolo.has(p.conversationId),enabledAt:yolo.has(p.conversationId)?now():null,isolation:{available:true}};
   case 'conversations.yolo.set':{p.enabled?yolo.add(p.conversationId):yolo.delete(p.conversationId);const value={conversationId:p.conversationId,enabled:p.enabled,enabledAt:p.enabled?now():null,isolation:{available:true}};emit('conversations.yolo.changed',value);addAudit('yolo.changed',{reasonCode:p.enabled?'yolo_on':'yolo_off',conversationId:p.conversationId});return value;}
   case 'inbox.list':return inbox.filter(i=>!p.kind||i.kind===p.kind);
   case 'inbox.counts':return {approval:inbox.filter(i=>i.kind==='approval').length,memory:0,provider:0,routine_approval:0,routine_proposal:0,routine_missed:0,routines_paused_away:0,routine_trigger_error:0};
   case 'approvals.resolve':case 'approval.resolve':case 'approval.respond':case 'approvals.respond':{const item=inbox.find(i=>i.approval?.id===p.id);if(item){item.approval.status=p.decision==='deny'?'denied':'allowed';item.approval.remembered=!!p.remember;emit('approval.resolved',{id:p.id,status:item.approval.status,remembered:!!p.remember});inbox=inbox.filter(i=>i!==item);}emit('inbox.changed');addAudit('approval.resolved',{category:'write_file',decision:p.decision,status:p.decision==='deny'?'denied':'allowed',toolName:'write_file',path:'/工作空间/灵感工作室/提纲.md',reasonCode:'user'});return {ok:true};}
   case 'audit.list':case 'audit.query':return p.before?[]:audit.filter(a=>(!p.kind||p.kind===a.kind)&&(!p.botId||a.botId===p.botId)).sort((a,b)=>b.at.localeCompare(a.at));
   case 'routines.list':return p.before?[]:routines.filter(r=>!p.botId||r.botId===p.botId);
   case 'routines.get':return routines.find(r=>r.id===p.id)||routines[0];
   case 'routines.summary':return {background:{state:'ready'},counts:{enabled:routines.filter(r=>r.enabled).length,running:0,waiting:0,scheduled:2,awayPaused:0},pausedUntil:null};
   case 'routines.rows':return {at:now(),pausedUntil:null,rows:p.ids.map((routineId:string)=>({routineId,active:null,lastResult:routineId==='routine-morning'?{...completedRun}:null,nextAt:routineId==='routine-folder'?null:routineId==='routine-morning'?new Date(new Date(time(8,30)).getTime()+86400000).toISOString():time(17),attentionCount:0}))};
   case 'routines.runs':return p.before||p.id!=='routine-morning'?[]:[completedRun];
   case 'routines.history':return p.before||p.botId&&p.botId!=='steward'||p.ids&&!p.ids.includes(completedRun.id)?[]:[{...completedRun,taskName:'工作日资料简报',taskDeleted:false,bot:baseBots[3]}];
   case 'routines.planned':{const from=new Date();from.setHours(0,0,0,0);const to=new Date(from);to.setDate(to.getDate()+1);return {from:from.toISOString(),to:to.toISOString(),asOf:now(),points:[{routineId:'routine-evening',botId:'writer',conversationId:'topic-routine-evening',at:time(17)}],nextCursor:null};}
   case 'routines.timeline':return p.source==='runs'?{source:'runs',runs:p.before?[]:[completedRun]}:{source:'power',context:{state:'awake',event:null},events:[]};
   case 'routines.settings.get':return {missedPolicy:'catchup',keepAwake:'on_ac',pauseWhenAway:true};
   case 'routines.setEnabled':case 'routines.update':case 'routines.set':{const r=routines.find(r=>r.id===p.id);if(r)Object.assign(r,p.patch||p);emit('routines.changed',{id:r?.id});return r;}
   case 'routines.delete':routines=routines.filter(r=>r.id!==p.id);emit('routines.changed');return {};
   case 'changes.watch':return {};
   case 'changes.status':return {root:changeRoot,roots:[changeRoot],git:scene==='changes'?git:{state:'none',reason:'not_repo'},author:{name:'Pi Bot',email:'demo@example.com'},files:scene==='changes'?changeFiles:[],total:scene==='changes'?changeFiles.length:0,nextCursor:null,overflow:false,totals:{files:changeFiles.length,added:24,removed:4},statsPending:false};
   case 'changes.turn':return {runId:'run-demo',botId:'pi',root:changeRoot.path,files:changeFiles.map(f=>({...f,displayPath:f.path,kind:'modify',diffAvailable:true})),total:changeFiles.length,truncated:false};
   case 'changes.diff':return {path:p.path,binary:false,tooLarge:false,unavailable:null,added:3,removed:1,hunks:[{index:0,header:'@@ -1,3 +1,5 @@',oldStart:1,oldLines:3,newStart:1,newLines:5,lines:[' export function prepareBrief() {','-  const everyDay = true;','+  const weekdaysOnly = true;','+  const includeSources = true;','+  return { weekdaysOnly, includeSources };',' }'],digest:'b'.repeat(64)}]};
   case 'changes.log':case 'changes.history':return {commits:[{oid:'a'.repeat(40),author:'Pi Bot',email:'demo@example.com',time:time(8),subject:'整理资料简报的目录结构',files:2}],nextCursor:null};
   case 'changes.comments.list':case 'changes.reviews.list':return [];
   case 'changes.reviews':return {runId:null,findings:[]};
   case 'changes.commit':{changeFiles=[];emit('changes.changed',{conversationKey:p.conversationKey,topicId:p.topicId,reason:'commit'});addAudit('file.written',{toolName:'write_file',path:changeRoot.path});return {commit:'c'.repeat(40)};}
   case 'changes.discard':{changeFiles=changeFiles.filter(f=>f.path!==p.path);emit('changes.changed',{conversationKey:p.conversationKey,topicId:p.topicId,reason:'discard'});return {ok:true};}
   case 'changes.draftMessage':return {message:'按工作日整理资料简报并保留来源'};
   case 'changes.reviewStart':return {ok:true};
   case 'computer.steps':return [];
   case 'backgroundCommands.page':return [];
   case 'browser.tabs':return {...browserState,botId:p.botId,open:scene==='browser',tabs:scene==='browser'?browserState.tabs:[]};
   case 'browser.view':if(p.visible&&scene==='browser')void browserFrame(p.botId,p.display);else framePorts.get(p.botId)?.close();return {...browserState,botId:p.botId};
   case 'browser.switchTab':browserState={...browserState,tabs:browserState.tabs.map((t:any)=>({...t,active:t.id===p.tabId}))};emit('browser.state',browserState);void browserFrame(p.botId);return browserState;
   case 'browser.takeover':browserState={...browserState,botId:p.botId,takeover:p.on};emit('browser.state',browserState);addAudit('browser.takeover',{on:p.on,domain:'example.com'});void browserFrame(p.botId);return browserState;
   case 'browser.handBack':case 'browser.handback':browserState={...browserState,takeover:false};emit('browser.state',browserState);return browserState;
   case 'builtin.catalog':return catalogs;
   case 'builtin.plan':return builtinPlan(p);
   case 'builtin.create':{const plan=builtinPlan(p);const newBots=plan.bots.map((b:any)=>{const r=catalogs.roles.find((r:any)=>r.id===b.roleId);return {...makeBot(b.roleId,r.defaultBotName,r.avatar.color,r.avatar.shape,r.summary),avatarEyes:r.avatar.eyes,role:{id:r.id,version:r.version}};});bots=[baseBots[0],...newBots];groups=plan.groups.map((g:any)=>({...group,id:`group-${g.templateId}`,name:g.name,coordinatorBotId:g.coordinator,announcement:g.announcement,conversationId:`conversation-${g.templateId}`,members:g.members.map((botId:string,position:number)=>({botId,position,joinedAt:time()}))}));emit('bots.changed');emit('groups.changed');emit('sidebar.changed');return {botIds:newBots.map((b:any)=>b.id),groupIds:groups.map(g=>g.id),reusedBotIds:[],skippedSkills:[]};}
   case 'permissions.get':{const settings={levels:Object.fromEntries(['run_command','computer','read_file','list_dir','write_file','read_ai_config','read_messages','send_out','web'].map(category=>[category,'ask'])),network:{allowAll:true,domains:[]}};return {...settings,botId:p.botId,overrides:{},effective:settings,isolation:{available:true}};}
   case 'skills.list':return p.botId==='pi'&&!p.before?[{id:'skill-brief',botId:'pi',name:'整理每周资料简报',description:'收集本周新资料，按主题整理成简报并保留来源链接。',source:'taught',enabled:true,lastUsedAt:time(8,32),createdAt:time(8),updatedAt:time(8)}]:[];
   case 'memory.list':case 'computer.apps.list':case 'background.commands.list':case 'credentials.list':case 'computer.blocklist.list':return [];
   default: (window as any).__productUnhandled=[...new Set([...(window as any).__productUnhandled||[],method])];throw new RpcError(RpcErrorCodes.unsupported,`Demo method unavailable: ${method}`);
  }
 }
};
const callDemo=peer.call.bind(peer);
peer.call=async(method:string,params:any={})=>{
 const result=localize(await callDemo(method,unwire(params)),settings.language);
 return /^(settings\.|models\.|providers\.)/.test(method)||['builtin.catalog','builtin.plan','apps.list'].includes(method)?result:wire(result);
};
function addAudit(kind:string,detail:any){audit.unshift({id:crypto.randomUUID(),kind,detail,summary:'产品演示操作',at:now(),botId:'pi',runId:null});emit('audit.changed');}
export function installDesktopDemo(){
 try {localStorage.setItem('pibot.appearance',JSON.stringify({language:settings.language,theme:settings.theme}));} catch {}
 (window as any).pibot={platform:'darwin',onPort:()=>()=>{},onBrowserFrames:(callback:any)=>{browserReceivers.add(callback);return()=>browserReceivers.delete(callback);},exportLogs:async()=> 'canceled',background:{state:async()=>({state:'ready'}),serviceState:async()=>({installed:false,running:true,preferences:{}})}};
}
export function setCatalog(catalog:any){Object.assign(catalogs,catalog);}

export function setProductDisplay(patch:any,notify=false){
 const previousLanguage=settings.language;
 if(['zh','en'].includes(patch.language))settings.language=patch.language;
 if(['light','dark','system'].includes(patch.theme))settings.theme=patch.theme;
 catalogs=catalogsByLanguage[settings.language as 'zh'|'en'];
 emit('settings.changed',{...settings});
 if(previousLanguage!==settings.language){emit('providers.changed');emit('bots.changed');emit('groups.changed');}
 if(notify&&parent!==window)parent.postMessage({type:'pi-product-display-changed',display:{language:settings.language,theme:settings.theme}},location.origin);
}
