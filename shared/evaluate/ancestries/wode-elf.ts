// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';
export function applyWodeElfBaseline(ctx:DerivationContext,out:PartialBaseline,noKit:boolean|undefined) {
  if(!ctx.available.has('ancestry.wode-elf.base-statistics')) return;
  const base=(amount?:number):Provenance=>({decisionId:'ancestry.wode-elf.base-statistics',source:ctx.sentence(SENTENCES.baseStatistics),operation:amount===undefined?'set':'base',...(amount===undefined?{}:{amount})});
  const selected=ctx.list('ancestry.wode-elf.purchased-traits')??[];
  const purchased=(name:string,slug:string,quote:string,amount:number):Provenance=>({decisionId:'ancestry.wode-elf.purchased-traits',selection:name,source:ctx.sentence({path:`en/unified/md/feature/trait/wode-elf/${slug}.md`,quote}),operation:'set',amount});
  out.size={value:'1M',provenance:[base()]};
  const swift=selected.includes('Swift');
  out.speed={value:(swift?6:5)+(out.kit?.speedBonus.value??0),provenance:[swift?purchased('Swift','swift','You have speed 6.',6):base(5),...(out.kit?.speedBonus.provenance??[])]};
  if(out.kit||noKit)out.stability={value:out.kit?.stabilityBonus.value??0,provenance:[base(0),...(out.kit?.stabilityBonus.provenance??[])]};
  if(selected.includes('Otherworldly Grace'))out.savingThrowThreshold={value:5,provenance:[purchased('Otherworldly Grace','otherworldly-grace','Whenever you make a saving throw, you succeed on a roll of 5 or higher.',5)]};
}
