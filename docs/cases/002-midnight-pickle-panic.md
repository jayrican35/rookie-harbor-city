# ROOKIE: Harbor City — Case 002 (V114)
## The Midnight Pickle Panic
A goofy, age-appropriate mystery for the whole family. This is an implemented gameplay case, not a standalone story draft.

### What happens
QuickMart's seven-foot foam mascot **Mr. Pickles** vanishes during the same night that snack crates go missing. Omar reports a bent delivery latch, a rubber chicken, and suspiciously silly security footage. The investigator visits the existing QuickMart shop, interviews Omar (including comic interview paths), studies the door, discovers the trapped foam mascot and Voss shipping label in the stockroom, examines the truck plate on camera, checks Records, logs evidence, and reports the supported Voss night-route lead to Brooks.

### Why it still fits Cases 003–005
Mr. Pickles is recovered; the **missing snack crates are not**. The torn Voss label, partial HBR-44.. plate, damaged door, and corroborating route records remain the legitimate evidence linking the QuickMart incident to the continuing campaign. Case 003 still follows the truck witness; later warehouse and waterfront missions retain their original gameplay and narrative code.

### Characters and tone
Jay/Papi, Rosa, Kaleb, Gigi, and LingLing receive differentiated reactions. The rubber chicken and seagull serve as harmless red herrings. Wrong theories receive funny explanations and can be retried without score loss. The detective learns to check evidence before blaming somebody. The award 'Dill Detective' is narrative flavor; the existing badge and save schema remain unchanged.

### Unchanged keys and progression
Retains m2, m2omar, m2door, m2label, m2camera, m2.db, m2.returned, m2.done and all follow-up mission flags. Case 001 save migration and Zombie Outbreak code/assets remain unchanged.

### Technical
- Source branch: `feature/v114-midnight-pickle-panic` (based on V113 visual polish)
- Implementation: `published-game-capture/game.js`
- Repeatable patch: `tools/patch_case002_v114.py`
- Regression tests: `qa/test_case002_v114.cjs`
- Browser preview: `/preview/v114/` once GitHub Pages deployment succeeds
- Preview-only localStorage isolation script: `published-game-capture/v114-preview-save-isolation.js`

### Manual playthrough
Use a separate V114 preview to complete the current Case 001 first (or continue a copied existing profile if Case 001 is already finished). Talk to Brooks to begin Case 002. Ask Omar each joke question and then record his factual statement. Inspect the door, stockroom and CCTV; deliberately select a silly camera choice, then select the plate. Query Voss or 4417 in Records. Return the evidence to the Evidence Room. At Brooks's final decision, select a silly accusation and verify a gentle retry, then select the Voss delivery lead. Check that Case 003 unlocks and that all save files remain in preview-only storage. As a separate QA step, launch and exit Zombie Outbreak to ensure it behaves identically.

### Release policy
Do **not** merge into production or V113 until the entire mobile playthrough is verified. Do not modify the separate original ChatGPT-hosted game or Zombie Outbreak.
