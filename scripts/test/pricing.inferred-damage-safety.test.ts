import assert from 'node:assert/strict';
import { appleEvidenceQuote } from '../../lib/pricing/appleCashifyModel';
import { PERFECT_CONDITION_DIAGNOSTICS } from '../../lib/pricing/perfectCondition';
import { createPricingService } from '../../lib/pricing/pricingService';
const base={...PERFECT_CONDITION_DIAGNOSTICS,warranty:false,mobileAge:'above11',accessories:['box']};
const q=(m:string,r:number,d:any)=>{const x=appleEvidenceQuote(m,'128GB',r,d);assert(x&&x.source==='model');return x.outcome.price;};
async function main(){
 const r=52426,m='Apple iPhone 15';
 assert(q(m,r,{...base,bodyScratches:'More than 2 scratches'})<=q(m,r,{...base,bodyScratches:'1-2 scratches'}),'heavier scratches cannot pay more');
 assert(q(m,r,{...base,bodyScratches:'1-2 scratches',bodyBent:'Bent/ curved panel'})<=q(m,r,{...base,bodyScratches:'1-2 scratches'}),'bent frame cannot remove an existing scratch deduction');
 assert(q('Apple iPhone 17',56520,{...base,bodyPanel:'Missing side or back panel'})<=q('Apple iPhone 17',56520,{...base,bodyPanel:'Cracked/ broken side or back panel'}),'missing panel cannot pay more than broken panel');
 const device={brand:'Apple',model:'Apple iPhone 15 Plus',storage:'512GB'};const d={...base,validBill:true,hardware:['face','battery_service'],accessories:[]};const ref=48600;const now=new Date('2026-10-19T00:00:00Z');
 const svc=createPricingService({repository:{async get(key:string){return{deviceKey:key,currentPrice:ref,source:'cashify',status:'fresh',matchConfidence:'exact',lastVerifiedAt:now};}}as any,signingSecret:'inferred-damage-offline-only-secret-32',tokenTtlSeconds:900,strictReferenceMode:true,referenceLookupTimeoutMs:100,snapshot:{},pricingMode:'hybrid',now:()=>now,logger:{info(){},warn(){},error(){}}});
 const actual=await svc.quote({...device,diagnostics:d});const model=appleEvidenceQuote(device.model,device.storage,ref,d);assert(actual.ok&&model);assert.equal(actual.internal.cashifyConditionEquivalent,model.outcome.price,'supported 512GB must use current fitted rules instead of historical router');
 console.log('4 inferred-damage and Apple dispatch regression checks passed');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
