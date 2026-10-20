import scheduleZh from './files/schedule.zh.xlsx?inline';
import scheduleEn from './files/schedule.en.xlsx?inline';
// Sample files for the in-memory preview scene; nothing is read from the visitor's computer.
const outline:Record<string,string>={
zh:`# 让工作轻一点 · 提纲

## 开头
一个周一早上的小故事：待办列表很长，但真正重要的只有三件事。

## 正文
1. **注意力**：一次只做一件事，把切换的成本降下来。
2. **日常习惯**：把重复的小事交给例行任务。
3. **留一点余地**：计划排满八成，给意外留出空间。

## 结尾练习
今天下班前，写下明天最重要的一件事。
`,
en:`# Making work feel lighter · Outline

## Opening
A Monday-morning story: the to-do list is long, but only three things truly matter.

## Body
1. **Attention**: do one thing at a time and cut the cost of switching.
2. **Everyday habits**: hand repetitive chores to routines.
3. **Breathing room**: plan to 80% and leave space for surprises.

## Closing exercise
Before you log off today, write down tomorrow's single most important task.
`};
const base64=(dataUrl:string)=>dataUrl.slice(dataUrl.indexOf(',')+1);
const utf8Base64=(text:string)=>{let raw='';for(const byte of new TextEncoder().encode(text))raw+=String.fromCharCode(byte);return btoa(raw);};
async function revision(data:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data));return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export const previewFiles=[
 {attachment:{id:'file-schedule',kind:'file',name:'发布排期.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',size:5403},
  async read(language:string){const data=base64(language==='en'?scheduleEn:scheduleZh);return {kind:'xlsx',revision:await revision(data),data};}},
 {attachment:{id:'file-outline',kind:'file',name:'提纲.md',mimeType:'text/markdown',size:620},
  async read(language:string){const text=outline[language==='en'?'en':'zh'];const data=utf8Base64(text);return {kind:'markdown',revision:await revision(data),data,text};}},
];
