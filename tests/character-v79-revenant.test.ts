// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import fury from './fixtures/v25-fury.json' with { type: 'json' };
import elementalist from './fixtures/v25-bethell.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
import { revenantPurchaseId } from '../shared/content/ancestries/revenant/level-one.ts';
const definitions=getDefinitions(1);
function build(former:string,traits:string[],extra:Record<string,SelectionValue>={},fixture:Record<string,SelectionValue>=fury.selections) {
 const selections:Record<string,SelectionValue>={...fixture};
 for(const id of Object.keys(selections))if(id.startsWith('ancestry.'))delete selections[id];
 return {...selections,'ancestry.choice':'Revenant','ancestry.revenant.former-life':former,[revenantPurchaseId(former)]:traits,...extra};
}
const evaluate=(selections:Record<string,SelectionValue>)=>evaluateCharacter({definitionsSchemaVersion:'r01.1',compendiumRevision:definitions.compendiumRevision,level:1,selections},definitions);
// Catches losing former size, accidentally inheriting a signature, and using the wrong size-dependent budget.
test('V79 Former Life gives only size; small Revenants have the additional ancestry point',()=>{
 for(const [former,size,traits] of [['Hakaan','1L',['Bloodless']],['Polder','1S',['Bloodless','Undead Influence']],['Time Raider','1M',['Bloodless']]] as const){
  const result=evaluate(build(former,[...traits]));
  assert.equal(result.status,'complete');
  const hero=result.baseline!;
  assert.equal(hero.size.value,size);assert.equal(hero.speed.value,5);
  assert.deepEqual(hero.damageImmunities?.map(i=>[i.damageType,i.value.value]),[['cold',1],['corruption',1],['lightning',1],['poison',1]]);
  assert.deepEqual(hero.damageWeaknesses?.map(i=>[i.damageType,i.value.value]),[['fire',5]]);
  assert.ok(hero.conditionImmunities?.some(i=>i.condition==='bleeding'));
  assert.ok(!hero.abilities.some(a=>a.name==='Shadowmeld'));
  assert.ok(!hero.traits.some(t=>['Big!','Psychic Scar','Small!'].includes(t.name)));
 }
 assert.equal(evaluate(build('Hakaan',['Bloodless','Undead Influence'])).status,'invalid');
});
// Adds repeated distinct one-point Previous Life purchases and overlapping-immunity maximum handling.
test('V79 multiple different Previous Life purchases share the Revenant budget without doubling immunity',()=>{
 const hero=evaluate(build('Polder',['Corruption Immunity','Graceful Retreat','Reactive Tumble'])).baseline!;
 assert.equal(hero.damageImmunities?.find(i=>i.damageType==='corruption')?.value.value,3);
 assert.equal(hero.damageImmunities?.filter(i=>i.damageType==='corruption').length,1);
 assert.equal(hero.disengage.value,2);
 assert.ok(hero.abilities.some(a=>a.name==='Reactive Tumble'));
 assert.equal(evaluate(build('Polder',['Reactive Tumble','Reactive Tumble'])).status,'invalid');
 assert.equal(evaluate(build('Human',['Determination','Staying Power'])).status,'invalid');
});
// Catches dropped nested requirements and copied parent conditions that make a borrowed child permanently unavailable.
test('V79 borrowed Psionic Gift requires and grants exactly one nested ability',()=>{
 assert.notEqual(evaluate(build('Time Raider',['Psionic Gift'])).status,'complete');
 const hero=evaluate(build('Time Raider',['Psionic Gift'],{'ancestry.revenant.time-raider.psionic-gift.ability':'Psionic Bolt'})).baseline!;
 assert.equal(hero.abilities.filter(a=>a.name==='Psionic Bolt').length,1);
 assert.ok(!hero.damageImmunities?.some(i=>i.damageType==='psychic'));
 const artisan=evaluate(build('Orc',['Passionate Artisan','Grounded'],{'ancestry.revenant.orc.passionate-artisan.skills':['Alchemy','Architecture']}));
 assert.equal(artisan.status,'complete');
 assert.ok(!artisan.baseline!.skills.some(s=>['Alchemy','Architecture'].includes(s.name)));
});
// Catches portrait-only Vengeance Mark support; all three actual activations must be exposed with the trait retained.
test('V79 Vengeance Mark grants placement, removal and Detonate Sigil and revokes them on replacement',()=>{
 const hero=evaluate(build('Human',['Vengeance Mark'])).baseline!;
 assert.ok(hero.traits.some(t=>t.name==='Vengeance Mark'));
 for(const name of ['Vengeance Mark','Vengeance Mark: Remove Sigil','Detonate Sigil'])assert.equal(hero.abilities.filter(a=>a.name===name).length,1);
 assert.ok(!evaluate(build('Human',['Bloodless'])).baseline!.abilities.some(a=>a.name==='Detonate Sigil'));
});
// Exercises permanent borrowed effects across health, movement, saves and immunity without copying original signatures.
test('V79 paid former traits contribute permanent values for kit and no-kit builds',()=>{
 const examples:[string,string[],string,number][]=[['Dwarf',['Spark Off Your Skin'],'staminaMaximum',36],['Human',['Staying Power'],'recoveriesMaximum',12],['Devil',['Beast Legs'],'speed',6],['Wode Elf',['Otherworldly Grace'],'savingThrowThreshold',5],['Memonek',['Lightning Nimbleness'],'speed',7]];
 for(const [former,traits,field,value] of examples){
  const hero=evaluate(build(former,traits)).baseline!;
  assert.equal((hero as unknown as Record<string,{value:number}>)[field].value,value,former);
 }
 const hero=evaluate(build('Memonek',['Nonstop'],{},elementalist.selections)).baseline!;
 assert.equal(hero.kit,null);assert.equal(hero.stability.value,0);
 assert.ok(hero.conditionImmunities?.some(i=>i.condition==='slowed'));
});
// Catches stale former-life choices after ancestry edits; impossible source prerequisites must fail closed.
test('V79 former ancestry replacement prunes borrowed descendants and Wyrmplate cannot be invented',()=>{
 const initial=build('Time Raider',['Psionic Gift'],{'ancestry.revenant.time-raider.psionic-gift.ability':'Psionic Bolt'});
 const changed=pruneUnavailable({...initial,'ancestry.revenant.former-life':'Dwarf',[revenantPurchaseId('Dwarf')]:['Grounded','Stone Singer']},definitions);
 assert.ok(changed.removed.includes('ancestry.revenant.time-raider.psionic-gift.ability'));
 const hero=evaluate(changed.selections).baseline!;
 assert.ok(!hero.abilities.some(a=>a.name==='Psionic Bolt'));
 assert.ok(hero.abilities.some(a=>a.name==='Stone Singer'));
 assert.equal(hero.stability.value,3);
 assert.notEqual(evaluate(build('Dragon Knight',['Prismatic Scales'],{'ancestry.revenant.dragon-knight.prismatic-scales-immunity':'acid'})).status,'complete');
});
