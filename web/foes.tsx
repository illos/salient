// SPDX-License-Identifier: GPL-3.0-only
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useCommand } from "./ui";

function SourceText({ sourceSnapshot }: { sourceSnapshot: string }) {
  const source = JSON.parse(sourceSnapshot) as { name: string; text: string };
  return <details><summary>Read complete source: {source.name}</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit" }}>{source.text}</pre></details>;
}
function FoeSource({ campaignId, foeId }: { campaignId: Id<"campaigns">; foeId: Id<"foes"> }) {
  const source = useQuery(api.foes.detail, { campaignId, foeId });
  return source ? <SourceText sourceSnapshot={source.sourceSnapshot} /> : <p role="status">Loading source…</p>;
}
function DirectorFoe({ campaignId, foe }: { campaignId: Id<"campaigns">; foe: { id: Id<"foes">; name: string; visible: boolean; stamina: number; maxStamina: number } }) {
  const setVisible = useMutation(api.foes.setVisible);
  const remove = useMutation(api.foes.remove);
  const visibility = useCommand();
  const deletion = useCommand();
  const [showSource, setShowSource] = useState(false);
  return <div className="panel stack">
    <div className="row"><strong>{foe.name}</strong><span>{foe.stamina} / {foe.maxStamina} Stamina</span><span className="muted">{foe.visible ? "Visible to players" : "Hidden from players"}</span></div>
    <div className="row">
      <button className="button secondary" type="button" disabled={visibility.pending || deletion.pending} onClick={() => void visibility.run(commandId => setVisible({ campaignId, foeId: foe.id, visible: !foe.visible, commandId }), JSON.stringify(["foes.setVisible", campaignId, foe.id, !foe.visible]))}>{foe.visible ? "Hide" : "Show"}</button>
      <button className="button secondary" type="button" onClick={() => setShowSource(!showSource)}>{showSource ? "Close source" : "Inspect source"}</button>
      <button className="button secondary" type="button" disabled={visibility.pending || deletion.pending} onClick={() => void deletion.run(commandId => remove({ campaignId, foeId: foe.id, commandId }), JSON.stringify(["foes.remove", campaignId, foe.id]))}>Remove</button>
    </div>
    {visibility.error && <p className="error" role="alert">{visibility.error}</p>}{deletion.error && <p className="error" role="alert">{deletion.error}</p>}
    {showSource && <FoeSource campaignId={campaignId} foeId={foe.id} />}
  </div>;
}
function AddFoe({ campaignId, addVisible }: { campaignId: Id<"campaigns">; addVisible: boolean }) {
  const source = useQuery(api.foes.catalog, { campaignId });
  const add = useMutation(api.foes.add);
  const setDefaultVisible = useMutation(api.foes.setDefaultVisible);
  const addition = useCommand();
  const defaults = useCommand();
  const [pendingVisibility, setPendingVisibility] = useState<boolean | null>(null);
  async function changeDefault(visible: boolean) {
    // Reflect this control's pending choice immediately; roster data remains server-owned.
    setPendingVisibility(visible);
    try {
      await defaults.run(commandId => setDefaultVisible({ campaignId, visible, commandId }), JSON.stringify(["foes.setDefaultVisible", campaignId, visible]));
    } finally {
      setPendingVisibility(null);
    }
  }
  return <div className="stack">
    <label className="row"><input type="checkbox" checked={pendingVisibility ?? addVisible} disabled={pendingVisibility !== null || defaults.pending || addition.pending} onChange={event => void changeDefault(event.target.checked)} />Show newly added foes to players</label>
    <p className="muted">This campaign remembers the setting. Each foe’s visibility can also be changed individually.</p>
    {source ? <><div className="row"><span>{source.name}</span><button type="button" className="button" disabled={addition.pending || defaults.pending} onClick={() => void addition.run(commandId => add({ campaignId, definitionId: source.definitionId, commandId }), JSON.stringify(["foes.add", campaignId, source.definitionId]))}>{addition.pending ? "Adding…" : "Add foe"}</button></div><SourceText sourceSnapshot={source.sourceSnapshot} /></> : <p role="status">Loading available foe…</p>}
    {addition.error && <p className="error" role="alert">{addition.error}</p>}{defaults.error && <p className="error" role="alert">{defaults.error}</p>}
  </div>;
}
export function FoesPanel({ campaignId, director }: { campaignId: Id<"campaigns">; director: boolean }) {
  const roster = useQuery(api.foes.list, { campaignId });
  return <section className="panel stack"><h2>Foes</h2>
    {!roster ? <p role="status">Loading foes…</p> : <>
      {director && roster.director && <AddFoe campaignId={campaignId} addVisible={roster.addVisible ?? false} />}
      {roster.rows.length === 0 && <p className="muted">{roster.director ? "No foes loaded yet." : "No foes are visible."}</p>}
      {roster.rows.map(foe => "visible" in foe ? <DirectorFoe key={foe.id} campaignId={campaignId} foe={foe} /> : <div className="row" key={foe.id}><strong>{foe.name}</strong><progress aria-label={`${foe.name} Stamina`} value={foe.healthFraction} max={1} /></div>)}
      <p className="muted">Foes stay in this campaign until removed. Combat actions are not available yet.</p>
    </>}
  </section>;
}
