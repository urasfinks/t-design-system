import {chromium} from '/Users/sfinks/Documents/ChatGPT/t-design-system/node_modules/playwright/index.mjs';
import lighthouse from '/tmp/tds-ui-audit/tools/node_modules/lighthouse/core/index.js';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({args:['--remote-debugging-port=9225']});
try {const r=await lighthouse('http://127.0.0.1:4173/docs/',{port:9225,output:'json',onlyCategories:['performance','accessibility','best-practices','seo'],logLevel:'error'});await writeFile('/Users/sfinks/Documents/ChatGPT/t-design-system/docs/audits/2026-11-05-ui/04-lighthouse.json',JSON.stringify(r.lhr,null,2)); console.log(Object.fromEntries(Object.entries(r.lhr.categories).map(([k,v])=>[k,v.score])));}finally {await b.close();}
