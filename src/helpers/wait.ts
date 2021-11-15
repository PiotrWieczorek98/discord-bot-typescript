// ---------------------------------------------------------
// Wait ms amount of time
// Example of usage: const wait = require('wait.js');
// await wait(1000);
// ---------------------------------------------------------
function wait(ms: number){
    return new Promise(res => setTimeout(res, ms));
}
export {wait};