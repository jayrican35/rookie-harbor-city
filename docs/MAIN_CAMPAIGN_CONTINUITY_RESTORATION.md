# Main campaign continuity restoration

The standalone connected game now reaches **Harbor Dawn (Chapter 013)**. Both authored ending presentations are available. This restoration uses the shipped chapter definitions, Story Journal, Assignment Board, NPCs, case flags, and save format.

## Campaign Summary and saves

- The Shift Summary and Campaign Summary used to render behind the connected canvas. They now use the connected modal host, retain their original buttons, and suspend walking while open. The existing new-campaign confirmation is hosted with them. The summary scrolls within the portrait viewport.
- The summary, Records, field manual, and Evidence Room distinguish the Sandwich Caper from an imported Missing Drive case. Case 005’s callback, arrest report, and outcome are preserved. Its final reference to Case 001 names the sandwich on the Caper route and the drive on the legacy route.
- Story is available from **Menu → Settings → Story**. It opens the existing journal, including active findings and completed endings. The next chapter still requires three findings and a decision in the preceding chapter. An existing in-progress chapter resumes with its remaining markers.
- The station cast excludes the selected family character and places each companion once. Connected NPC visibility follows the original conditions for Ferris and Voss, including Voss’s absence after the arrest.

[Connected story adapter](../published-game-capture/connected-story.js) · [Summary styles](../published-game-capture/connected-main.css) · [Main-build bindings](../tools/campaign_transition.py)

## Chapter-by-chapter verification

The common failure was the connected map’s one-time import of legacy spots. The legacy spot list exposes a lead only while its chapter is active. The connected adapter now registers unfinished leads when the active chapter or its findings change, and removes them after completion. The original quest engine checks answers, records evidence and trust, and advances the story.

| Chapter | Previously broken dependency and change | Standalone browser result |
| --- | --- | --- |
| **006 · The Cost of Command** | The warehouse supply lists never registered after the briefing. The lead now uses the warehouse’s existing manifest area, Ortiz uses his industrial-yard position, and the signed order sits in the Municipal lobby. | Walked through the warehouse and Municipal doors. A wrong answer left the finding unrecorded. Reloaded after the first finding, completed Ortiz’s interview and the signed order, then resolved 006. |
| **007 · A Chair at City Hall** | The Municipal security deal, Northgate clinic witness, and Downtown company van had no active connected markers. Their existing locations now receive markers when 007 starts. | All three findings recorded and the decision unlocked 008. |
| **008 · The Broken Badge** | The precinct message, warehouse file, and Café Del Mar interview were missing from the active map. The file uses the existing warehouse room and the interview uses the connected café interior. | Recorded all three findings, including the café interview after walking through its door. The authored decision advanced to 009. |
| **009 · A Harbor for the Hunted** | The Southbay marina and inn leads were dormant. The residential witness lead now uses Almeida’s existing spot as an anchor. | Recorded the marina contact, witness account, and safehouse handoff. The decision advanced to 010. |
| **010 · The Occupation** | The industrial order, Northgate clinic evacuation, and Southbay relief roster lacked live markers. | Recorded all three findings and advanced to 011. |
| **011 · The Silent Frequency** | The council notes, marina interview, and Midtown radio handoff lacked live markers. Ana’s lead now uses her existing connected office. | Walked through the marina office door, asked both interview questions, recorded all three findings, and advanced to 012. |
| **012 · No One Left Behind** | In addition to the registration failure, the relocated Brooks lead initially overlapped another precinct NPC’s interaction exactly. The adapter now selects clear positions separated from existing interaction markers. | The Brooks interview, Northgate clinic record, and waterfront observer all accepted ordinary Action input. The decision advanced to 013. |
| **013 · Harbor Dawn** | The Municipal evidence, Southbay assembly, and precinct flag-plaza objective never registered. They now appear for the final chapter and disappear as their findings are recorded. | Completed all three findings and reached **A City Returned**. Reloaded and confirmed **13 / 13 chapters completed**. Restored the pre-decision snapshot in the isolated test profile and selected the other authored choice to verify **Another Command**. |

## Validation scope and remaining narrative gaps

The regression serves `published-game-capture/index.html` directly from a fresh loopback server. It uses separate browser profiles. The browser test stages cross-city trips with the existing positioning fixture, then walks up to all 24 markers, uses the normal Action and dialogue controls, and resolves 006–013 in order. It also walks through four connected doors, tests an intermediate save and a finished save, checks four non-Jay selections for companion duplication, and exercises the Case 005 summary and Act II handoff with touch input in an emulated Pixel 7 viewport. It does not drive every street between objectives or test on a physical handset.

The fresh-profile run used the existing First Shift Skip control, then completed Cases 001–005 and Chapters 006–013 in sequence through the game’s controls. A separate import of an older Rosa save retained the Missing Drive summary, Case 005 completion, and waterfront evidence when Chapter 006 opened.

Run the browser regression with `node qa/check-campaign-continuity.cjs --from-intro` in a workspace with Playwright and Chrome available. The standalone package inventory verified 909 files. The original engine and Zombie Outbreak stylesheet matched the pre-edit checkpoint byte for byte. The checkpoint is stored beside the repository in `.rookie-campaign-checkpoints/rookie-campaign-before-20261111-001733/`.

The restored chapters still use the existing journal briefings, text findings, interviews, and choice panels. Some named witnesses or handoffs are presented through those panels. The later story still uses Jay’s viewpoint for all profiles. The ending is a journal presentation followed by free exploration. Chicken and Banana’s story is unchanged.

[Browser regression](../qa/check-campaign-continuity.cjs)
