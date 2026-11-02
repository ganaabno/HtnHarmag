import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const base=process.env.AUDIT_URL??'http://127.0.0.1:4174';
const browser=await chromium.launch();const report={base,profiles:[]};
for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
 const context=await browser.newContext({viewport,deviceScaleFactor:1});const page=await context.newPage();const errors=[],failedAssets=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failedAssets.push([r.url(),r.status()]);});
 await page.goto(base,{waitUntil:'networkidle'});await page.locator('.hero-inspection[data-interaction-state="IDLE"]').waitFor({timeout:25000});await page.screenshot({path:`../../docs/qa/upgrade-hero-${name}.png`,timeout:20000});
 const heroState=await page.locator('.hero-inspection').getAttribute('data-interaction-state');
 await page.locator('.closing-chapter').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-110));
 await page.waitForFunction(()=>{const e=document.querySelector('.closing-line-two .closing-line-inner');return e&&Math.abs(new DOMMatrix(getComputedStyle(e).transform).m42)<1;},null,{timeout:20000});
 await page.screenshot({path:`../../docs/qa/upgrade-footer-${name}.png`,timeout:20000});
 await page.locator('.closing-landscape').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-100));await page.waitForTimeout(1200);await page.screenshot({path:`../../docs/qa/upgrade-footer-scene-${name}.png`,timeout:20000});
 await page.locator('.footer-information').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-105));await page.waitForTimeout(900);await page.screenshot({path:`../../docs/qa/upgrade-footer-links-${name}.png`,timeout:20000});
 const navigationUnobscured=await page.locator('.footer-information nav a').first().evaluate(a=>{const r=a.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return a===hit||a.contains(hit);});
 await page.locator('.footer-signature').scrollIntoViewIfNeeded();await page.waitForTimeout(900);await page.screenshot({path:`../../docs/qa/upgrade-signature-${name}.png`,timeout:20000});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),canvases=await page.locator('canvas').count();
 await page.goto(`${base}/products/sergeenee`,{waitUntil:'networkidle'});await page.locator('.product-view.model-ready').waitFor({timeout:25000});await page.screenshot({path:`../../docs/qa/upgrade-viewer-${name}.png`,timeout:20000});
 report.profiles.push({name,heroState,canvases,overflow,navigationUnobscured,errors,failedAssets});await context.close();
}
await browser.close();await writeFile('../../docs/qa/cinematic-upgrade-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(report.profiles.some(p=>p.errors.length||p.failedAssets.length||p.overflow||p.canvases!==1||!p.navigationUnobscured))process.exitCode=1;
