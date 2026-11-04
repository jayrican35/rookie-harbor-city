# Banana talking frame repair — Codex import

The previous pack had cropped hands in `banana_talk_02.png` and `banana_talk_03.png`. This pack replaces those two frames and regenerates `banana_talk_4x1.png`. The 112×120 pixel frame dimensions, left-to-right order, 4 columns, 120-pixel atlas height and footAnchor [56,110] are unchanged.

1. Compare this repaired `sprites/atlas/banana_talk_4x1.png` to Banana's installed atlas.
2. Replace only Banana's talking atlas (and individual frames if imported); no Chicken edits.
3. Remove temporary frame restriction limiting speech animation to indices [0,1] after visually checking all four frames in-game.
4. Preserve the character's existing spawn, dialogue logic, walking animation, and other assets.
5. Play the talk animation once at game speed; verify no clipped gloves, jumping anchors, or texture seam.
6. Keep all work LOCAL. No push, deploy, version change. Zombie Outbreak untouched.
