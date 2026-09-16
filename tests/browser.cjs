// Run with PLAYWRIGHT_MODULE pointing at an installed playwright module.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const root=process.env.TEST_URL||'http://localhost:8080/';
await page.goto(root);await page.waitForSelector('.ta-card');assert.equal(await page.locator('.ta-group:first-child .ta-card').count(),16);
await page.getByRole('button',{name:'Pause',exact:true}).click();assert.equal(await page.locator('.ta-track.paused').count(),1);
await page.screenshot({path:'/tmp/ad4051-desktop.png',fullPage:true});
for(const path of ['assignments','schedule','lectures','materials']){await page.goto(root+path+'/');await page.waitForSelector('#content');assert.equal(await page.locator('h1').textContent(),path[0].toUpperCase()+path.slice(1));}
await page.goto(root+'schedule/');await page.waitForSelector('.semester-schedule');assert.equal(await page.locator('.semester-schedule tbody tr').count(),18);assert((await page.locator('.semester-schedule tbody tr').nth(2).textContent()).includes('Monday, 13 Mehr: Lecture 6 — Greedy Algorithms'));assert((await page.locator('.semester-schedule').textContent()).includes('1 Dey – 9 Dey'));await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/ad4051-schedule-mobile.png',fullPage:true});await page.setViewportSize({width:1280,height:900});
await page.goto(root+'lectures/');await page.waitForSelector('#archive');assert.equal(await page.locator('#archive li').count(),30);assert((await page.locator('#archive li').first().textContent()).includes('Date: 28 Shahrivar'));
await page.goto(root+'assignments/');await page.waitForSelector('#archive');assert.equal(await page.locator('#archive li').count(),14);
await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Toggle navigation'}).click();assert(await page.getByRole('link',{name:'Home',exact:true}).isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/ad4051-mobile.png',fullPage:true});
await page.goto(root+'admin/');await page.waitForSelector('#editor');await page.getByLabel('Course title',{exact:true}).fill('Test course');await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.reload();await page.waitForSelector('#editor');await page.getByRole('button',{name:'Restore saved draft',exact:true}).click();assert.equal(await page.getByLabel('Course title',{exact:true}).inputValue(),'Test course');
await page.locator('[data-photo="0"]').setInputFiles('assets/iust.png');await page.waitForFunction(()=>document.querySelector('[data-section="tas"] [data-key="photo"]').value.startsWith('data:image/jpeg'));
await page.getByRole('button',{name:'Preview home'}).click();assert(await page.locator('#preview-content').isVisible());
await page.getByRole('button',{name:'Save draft',exact:true}).click();
// Exercise authenticated loading and optimistic-concurrency publishing without touching GitHub.
const fs=require('fs');const fixture=fs.readFileSync('data/site.json','utf8');let put=0;
await page.route('https://api.github.com/**',async route=>{if(route.request().method()==='GET')return route.fulfill({json:{sha:'current-sha',content:Buffer.from(fixture).toString('base64')}});put++;const body=route.request().postDataJSON();assert.equal(body.sha,'current-sha');assert.equal(JSON.parse(Buffer.from(body.content,'base64').toString()).title,'Published test');return route.fulfill({json:{content:{sha:'new-sha'}}});});
await page.getByLabel('GitHub token',{exact:true}).fill('test-token');await page.getByRole('button',{name:'Connect to GitHub'}).click();await page.waitForFunction(()=>!document.querySelector('#publish').disabled);await page.getByLabel('Course title',{exact:true}).fill('Published test');await page.getByRole('button',{name:'Publish changes'}).click();await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Published to GitHub'));assert.equal(put,1);assert(!(await page.evaluate(()=>JSON.stringify(localStorage))).includes('test-token'));
await page.unroute('https://api.github.com/**');
await page.route('https://api.github.com/**',r=>r.fulfill({status:403,json:{message:'Resource not accessible by personal access token'}}));
await page.getByLabel('Course title',{exact:true}).fill('Keep these edits');await page.getByRole('button',{name:'Publish changes'}).click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Contents = Read and write'));assert.equal(await page.getByLabel('Course title',{exact:true}).inputValue(),'Keep these edits');assert.equal(await page.locator('#publish').isDisabled(),false);await page.getByRole('button',{name:'Save draft',exact:true}).click();
assert.deepEqual(errors,[]);await browser.close();console.log('PASS: routes, roster, pause, mobile, drafts, photo upload, preview, publish contract, token storage, and browser errors');
})().catch(e=>{console.error(e);process.exit(1)});
