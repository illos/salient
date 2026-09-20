# V2 design mockups

Second-generation desktop mockups supplied by the user. Like the [V1 set](../v1/README.md), they are
binding for desktop style, layout, proportions and display mechanics; labels, sample values and
placeholder bars remain approximate; the written specifications stay authoritative for behavior,
permissions and supported features. Where a V2 mockup covers a screen the V1 set also drew, the V2
picture supersedes the V1 picture for that screen.

## Reference screens

- [Campaign home, simplified](campaign-home-simplified.png) — supersedes `v1/campaign-home.png`.
  Built by [V68](../../build/V68-campaign-home.md).

## Campaign home: user decisions, 2026-09-20

Recorded from the user's review of the simplified mockup in the campaign-home UI thread. Each item is
a confirmed requirement unless marked otherwise; the owning specifications carry dated notes.

| Depicted element | Decision |
| --- | --- |
| DIRECTOR / PLAYER / OBSERVER member tags | Observer is a session-level state, not a campaign-level one. On the campaign home every member who is not the Director is a **player**. The **owner** gets a dedicated badge, separate from the **Director** badge; a member who is both shows both. ([access spec](../../accounts-and-access-spec.md#campaigns)) |
| Presence dots on member cards, "3 online" in chat | Build connected-member presence. ([table spec](../../table-spec.md#2-participation-and-presence)) |
| Session rows with a title line and a grey summary line | Sessions get an **optional title**; the row reads `Session 24 · title`. The summary line is dropped. ([table spec](../../table-spec.md#reading-session-history)) |
| RECAP button | A later abstraction over the game log, party chat and Director notes. For now RECAP loads that session's game log. ([table spec](../../table-spec.md#reading-session-history)) |
| Table chat pane with a ROLL chip | Build a very light campaign chat now ([V12 scope](../../build/V12-campaign-chat.md)). The user expects a long-term game-log/chat hybrid living inside the session; the ROLL chip is that future hybrid, not part of the light chat. ([table spec](../../table-spec.md#game-log-and-chat-scope)) |
| No next-session player tiles, no Party panel | The session roster (player selection, selected characters) moves to a **new session screen**, to be built as its own slice. Not on the campaign home. |
| INVITE PLAYERS button, MANAGE PLAYERS link | Invitation link and code, join requests and hero admission review all live inside the **Manage players** pop-up. |
| No Foes prepared section | Dropped from the campaign home. Foe management remains on the table. |
| Header meta `Session 12 · last played 3 days ago` | Session count plus relative last-played time; no member count, no eyebrow, no role tag in the header. |
