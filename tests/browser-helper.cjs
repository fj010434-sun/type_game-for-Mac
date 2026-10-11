const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/sunyifeng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
exports.setup = async () => {
 const browser = await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 return {browser,page,errors,base:process.env.BASE_URL||'http://127.0.0.1:18765'};
};
