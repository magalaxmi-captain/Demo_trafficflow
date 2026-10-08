const assert=require('node:assert/strict');
const E=require('./engine.js');
for(const [key,s] of Object.entries(E.scenarios)){
 const r=E.analyze(s.input),a=E.apply(r);
 assert.equal(r.trace.length,6);
 for(const action of r.actions)assert.equal(action.status==='approved',action.checks.every(c=>c.pass));
 for(const sim of [r.baseline,a.after])for(const frame of sim.timeline)frame.queues.forEach((q,i)=>assert(q>=0&&q<=sim.storage[i]+.001));
 assert(a.applied.every(id=>r.actions.some(x=>x.id===id&&x.status==='approved')));
 console.log(key,r.perception.label,'blocked:',r.actions.filter(x=>x.status==='blocked').map(x=>x.id).join(','),'waiting:',r.baseline.waitVehicleMinutes,'->',a.after.waitVehicleMinutes);
}
const bad=E.analyze(E.scenarios.unsafe.input);for(const id of ['timing','isolate','priority'])assert.equal(bad.actions.find(a=>a.id===id).status,'blocked');
const fake=E.analyze(E.scenarios.conflict.input);assert.equal(fake.perception.confirmed,false);assert(!fake.actions.some(a=>a.id==='dispatch'));assert.equal(fake.actions.find(a=>a.id==='priority').status,'blocked');
const noTeam=E.analyze({...E.scenarios.collision.input,responder:false});assert(noTeam.actions.filter(a=>['dispatch','isolate'].includes(a.id)).every(a=>a.status==='blocked'));
const noClear=E.analyze({...E.scenarios.ambulance.input,clearance:1});assert(noClear.actions.filter(a=>['timing','priority'].includes(a.id)).every(a=>a.status==='blocked'));
const stale=E.analyze({...E.scenarios.collision.input,age:61});assert.equal(stale.perception.confirmed,false);
assert.throws(()=>E.analyze({...E.base,blocked:4,lanes:1}),/Blocked lanes/);
assert.throws(()=>E.analyze({...E.base,demand:NaN}),/demand/);
// Tampering with a returned status cannot bypass the engine's revalidation on application.
bad.actions.forEach(a=>a.status='approved');assert(!E.apply(bad).applied.includes('priority'));
const zero=E.analyze({...E.base,demand:0});assert.equal(zero.baseline.finalTotal,0);
assert.deepEqual(E.analyze(E.scenarios.collision.input),E.analyze(E.scenarios.collision.input));
console.log('PASS: scenario coverage, safety gates, bounds, stale evidence, no-team handling, revalidation and determinism.');
