# PIVOT demo: the three-minute script

The video is a screen recording of the Lens Studio Interactive Preview (SPECS 27). The Lens runs its own **Tour**: a hands-free walk through the whole story, with a caption on screen at each step, so the take is the same every time and nothing depends on where a mouse pinch lands. The tour is 2:41 long; the rest of the three minutes is a title and the build story.

## How to record

1. Open `lens/lens.esproj`, Preview on SPECS 27, Interactive. Make the Preview panel large; the recording is that panel.
2. Reset the Preview so it shows scenario 1 (the studio sofa, blocked).
3. Start the screen recording, then pinch **TOUR ›** on the left (one click in the Preview). To leave the cursor out of the take, set `AUTO_TOUR = true` in `lens/Assets/Scripts/PivotTour.ts` (the tour starts two seconds after the Lens starts), reset the Preview with the recording running, and set it back to `false` afterwards.
4. Let it run to the end (2:41). Any pinch on a control hands the Lens back, so do not touch the mouse during the take.
5. Record the voice-over separately against the picture; the lines below fit each beat. No music, or music you own. No third-party logos.

A caption on screen carries each beat, so the video also works with the sound off. Each result also plays a short cue (a chime for a fit, a lower tone for no fit or "too close to confirm"); they are quiet, but mute the Preview if the voice-over needs the room.

## The tour, beat by beat

| Time | On screen (the tour does this) | Say |
|---|---|---|
| 0:00 | Studio flat, the sofa, **Does not fit · 5 cm short**. The ghost tries the door and jams (coral). | "Every AR furniture app asks: does it fit here? Moving day asks something harder: can it get there? PIVOT checks the whole move, not just the doorway. This sofa is five centimetres too big for this door." |
| 0:14 | The tour pinches the suggested fix, **widen to 86**. Re-plans live: **Fits · 1 cm to spare**, **Verified step**. | "Pinch a suggested fix: widen the door to 86, a centimetre more than the sofa needs. PIVOT re-plans the whole route live, and now it fits. Every step of the turn is checked." |
| 0:28 | "Door fits, hall doesn't": **No room to turn**. | "Here the door is fine but the hall isn't. Turning the sofa sweeps two point three metres and the hall is only one point two. A doorway-only check would have said yes." |
| 0:41 | Tight hallway corner: the L-shaped plan, the sofa laid on its back swinging round, **6 mm to spare**. | "Corners too. PIVOT sweeps the footprint round the corner a degree at a time, so the sofa goes round laid on its back, with six millimetres to spare." |
| 0:55 | **Life size**: the same plan at real size. | "Pinch Life size and you stand at the corner: the same plan at real size." |
| 1:04 | Wardrobe by lift. | "Lifts: the door and the cabin both have to clear, in the same pose." |
| 1:15 | Gallery art crate, blocked at the side entrance. | "It's not only sofas. A gallery crate is blocked at the side entrance." |
| 1:23 | **Try another route**: the same crate clears the loading dock. | "Try another route: the same crate, through the loading dock, and it clears." |
| 1:35 | Workshop bench: **Fits · 4 mm to spare**, and **Too close to confirm at ±5 mm**, **At ±5 mm: 8 mm short**. | "A workshop bench round a hall corner fits by four millimetres. But if the measurements can be five millimetres out, PIVOT says it is too close to confirm. That is an error you state, not a prediction." |
| 1:47 | **Try another route**: the double doors, **Holds with ±5 mm error**, **At ±5 mm: 15 cm left**. | "Try the double doors: they hold even with that error, with fifteen centimetres to spare." |
| 1:57 | Touring flight case. | "A touring flight case: the stage door, then the wings turn." |
| 2:03 | Empty aquarium through a garden gate. | "Empty glass through a garden gate and a narrow passage." |
| 2:09 | **Swap object**: another load on the same measured route. | "Swap the load and keep the measured route. New object, new verdict, instantly." |
| 2:18 | Back to the sofa and the 80 cm door; the tour grabs the door edge and pulls it out, the number follows, the verdict flips as it passes 85. | "Or take over. Grab an edge and pull. At 80 centimetres the door blocks; pull it past 85 and the sofa goes through." |
| 2:31 | Closing caption over the widened door: "PIVOT: before you lift it, know if it fits." | "PIVOT. Before you lift it, know if it fits." |

## After the tour (2:41-2:56): how it was built, and the limits

Cut to the Lens Studio window and show, in this order, about four seconds each:
- the LEAF panel with the 14 scenarios passing, **pivot-tour** among them (it runs this very tour and checks every beat);
- `npm test` in a terminal: 134 passing;
- `lens/devpost/design-brief.md`.

Say: "A real planner with 134 tests, and 14 LEAF scenarios run in the preview, including this tour. Built by a coding agent through the Lens Studio MCP. What I could not do is try it on glasses, so the feel of the text and the pinch targets is unproven."

A 3-second title card at the start ("PIVOT: before you lift it, know if it fits") brings the total to about 2:56. Do not go over 3:00.

## Pitch points to land

Problem: moving day, not placement. Who: buyers, movers, shops, landlords. Why glasses: a model of the move at arm's length, life size at the gate, hands free. What is different: a route, not a spot; verified versus unverified; try-the-fix; stated measurement error ("too close to confirm"); every number can be edited.

## If a take goes wrong

The tour stops the moment any control is pinched, and the **STOP TOUR ■** button stops it too. Pinch **TOUR ›** again to restart from the top. Edit the take together from two runs; the beats are independent, so cuts at beat boundaries are clean.

## Optional hand-driven extras (not in the tour)

Your move: **Your move ›**, then **Next place** (terraced house), **Next object** (piano, bed, wardrobe), pull the sofa's end handle in until the verdict flips, add a gate. Use these in a longer cut or in the Devpost description screenshots.
