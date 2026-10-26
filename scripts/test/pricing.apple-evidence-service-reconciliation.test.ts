/** Offline production-route reconciliation of all complete supplied archive measurements. No database connections. */
import { customerPayout } from '../../lib/pricing/payout';
import { createPricingService } from '../../lib/pricing/pricingService';
import { loadReleaseRouteEvidence } from '../../lib/pricing/releaseRouteEvidence';
import { resolvePricingReleaseConfig } from '../../lib/pricing/releaseConfig';
import { existingExactFinalQuoteIndex } from '../pricing/exact-final-quote-evidence';
import { loadMeasurements, hasUnknownInput, toDiagnostics, modelSemantics } from '../pricing-evidence/evidenceLib';
import { findCatalogDevice } from '../../lib/pricing/catalog';
import { questionnaireModelKey } from '../../lib/referencePricing/questionnaire/types';
import { deviceKey } from '../../lib/referencePricing/types';
import { SEED_DEVICES } from '../../lib/seed_devices';
import { storageGbOf } from '../../lib/pricing/appleCashifyModel/scope';
let reference = 0;
const at = new Date('2026-10-25T12:00:00Z');
const repo: any = { async get(key: string) { const d=(SEED_DEVICES as any[]).find(d=>deviceKey(d)===key); return { ...d, deviceKey:key, currentPrice:reference,source:'cashify',status:'fresh',matchConfidence:'exact',lastVerifiedAt:at }; } };
const cfg=resolvePricingReleaseConfig();
const semantics=modelSemantics(loadMeasurements());
const profiles=new Map((SEED_DEVICES as any[]).filter(d=>d.brand==='Apple').map(d=>[questionnaireModelKey(d), semantics.get(d.model.replace(/^Apple /,''))]));
const svc=createPricingService({repository:repo,signingSecret:'release-offline-only-secret-at-least-32-chars',now:()=>at,tokenTtlSeconds:900,strictReferenceMode:true,referenceLookupTimeoutMs:100,snapshot:{},questionnaireStore:{async get(k:string){return profiles.get(k)??null;}} as any,pricingMode:cfg.mode,releaseRouteEvidence:loadReleaseRouteEvidence(cfg.routeEvidenceFile??undefined),exactFinalQuoteIndex:cfg.exactFinalQuoteCache?existingExactFinalQuoteIndex():undefined,exactFinalQuoteOfferPolicy:cfg.exactFinalQuoteOfferPolicy,logger:{info(){},warn(){},error(){}}});
(async()=>{let n=0,bad=0,ceilingBreaches=0;const details:any[]=[];for(const m of loadMeasurements()){
 if(hasUnknownInput(m))continue;
 const d=(SEED_DEVICES as any[]).find(d=>d.brand==='Apple' && d.model===`Apple ${m.model_key}` && storageGbOf(d.storage)===m.storage_gb);
 if(!d)continue;reference=m.variant_get_upto;n++;
 const q=await svc.quote({brand:d.brand,model:d.model,storage:d.storage,diagnostics:toDiagnostics(m,'none')});
 if(q.ok&&m.payout!==null){const normalized=m.base!-(q.internal.payoutCeiling.equivalentBasis==='selling'?20:0);const limit=customerPayout(Math.round(normalized+Math.min(reference*(reference<=20000?.08:reference<=50000?.06:.04),2000)),false).payout;if(customerPayout(q.fhoneifyPrice,true,q.couponHeadroom).payout>limit)ceilingBreaches++;}
 const actual=q.ok?q.internal.cashifyConditionEquivalent+(q.internal.payoutCeiling.equivalentBasis==='selling'?20:0):null;
 if(m.outcome==='NUMERIC_QUOTE' ? !q.ok||actual!==m.base : q.ok){bad++;details.push({model:m.model_key,gb:m.storage_gb,id:m.case_id,expected:m.base,actual,delta:actual!==null&&m.base!==null?actual-m.base:null,code:q.ok?'price':q.code});if(bad<=0)console.log(JSON.stringify({model:m.model_key,gb:m.storage_gb,id:m.case_id,expected:m.base,actual,code:q.ok?'price':q.code,message:q.ok?null:q.message,basis:q.ok?q.internal.payoutCeiling.equivalentBasis:null}));}
 }console.log(JSON.stringify({cases:n,mismatches:bad,ceilingBreaches,mode:cfg.mode,large:details.filter(d=>d.delta===null||Math.abs(d.delta)>20),byModel:details.reduce((a:any,d:any)=>{a[d.model]=(a[d.model]??0)+1;return a;},{})},null,2));if(n<2000||bad||ceilingBreaches)process.exitCode=1;})();
