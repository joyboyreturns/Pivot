---
status: approved
---

# Design brief: PIVOT

> **Update (28 Oct 2026).** The original brief below describes the single-doorway demo. PIVOT now plans whole routes: a scenario switcher (pinch *Next scenario*), seven scenarios, gate chips (one per gate of the route, coloured by verdict, diamond on the bottleneck), and four gate types (doorway, corridor, lift, L-shaped corner) drawn at real scale. Sections below still hold, with these changes: the doorway is no longer fixed at 80 cm, the dimension labels follow the selected gate, the result states the verdict of the selected gate and the route, and the **Unverified maneuver** label is per step: "Verified step" appears only when that step was checked against the room in front of the gate; every no-fit illustration and every step without a measured approach stays "Unverified maneuver". Green is shown only for evaluated gate clearance. A **Your move** sandbox lets the wearer pick any object and place and edit every number with steppers (1 cm a tap, 5 cm on quick repeats); blocked gates list the smallest fixes and the largest size the route allows. The out-of-scope list loses "hallway turns" and "changing dimensions" (both done); stairs, wall thickness and room scanning stay out.

## The one spatial moment
A person approaches a narrow doorway with a large sofa and sees, at real scale, why PIVOT cannot find a valid fixed orientation under its current box-model constraints. They can step or scrub through a smooth, explicitly unverified illustrative maneuver to understand the spatial problem.

## Why it belongs on glasses
- Uses: draws in the world and leaves the user's hands free to interact.
- Why it's better than the phone or laptop version: The sofa, doorway, and guidance appear together at real scale where the move would happen (default).

## Product or overlay
- Type: overlay on a real-world moving task, demonstrated with a virtual scene.
- What the real version would sense: nothing in this preview; the dimensions are supplied in advance.
- Stand-in for the preview: a fixed virtual sofa and doorway with the dimensions below. There is no real-object recognition or physical tracking.

## Where things live
- Where the user is looking during the main task: at the sofa and doorway, walking around them and looking at the restriction.
- Sofa: realistic-looking, doorway-anchored model, 210 cm wide × 90 cm deep × 85 cm high. Its planner representation is a box of those dimensions.
- Doorway: 80 cm wide × 205 cm high, in a wall 15 cm thick. The fixed-orientation planner does not validate motion through wall thickness.
- Labels and restriction: spatially anchored beside their corresponding sofa or doorway dimensions; red marks the limiting doorway restriction. Main content starts in front of the user at a comfortable viewing distance (default), with room to walk around it.
- Next-step arrow: floating beside the sofa, within reach. Timeline rail: subtle, beneath the sofa, within reach; both anchored to the scene.

## Hands and input
- Advance: pinch and release the floating arrow to advance one illustrative step.
- Scrub: pinch and drag along the timeline rail to move backward or forward through the illustrative maneuver.
- Targets are big and highlight when aimed at.
- Controls glow on hover and briefly respond on selection. Use mouse-simulated pinch and drag in Interactive Preview.
- Voice (if any) and the button that does the same job: none.

## When things show
- Initial view: the sofa and doorway appear at realistic scale with subtle dimension labels.
- Analysis: a brief, smooth scan highlights sofa dimensions and doorway clearance.
- Result: show “Does not fit under the current box-model constraints”; emphasize 0.85 m versus 0.80 m and keep the restriction red. Explain that no fixed orientation of the bounding box fits this opening.
- Interaction: fade secondary labels while emphasizing the current sofa position and relevant clearance; restore the labels and explanation afterward.
- Illustrative motion: show smooth transitions with a translucent sofa and a persistent “Unverified maneuver” label. Do not present the animation, its clearance, or any green highlighting as proof of a collision-free path. Show green only for an actually evaluated safe state, if one exists; this fixed scenario has no fitting fixed orientation.
- If something needs attention out of view: none (default).

## Done criteria
Each one can be checked in Lens Studio's preview.
1. A realistic sofa and doorway appear at the specified scale, with readable spatial dimension labels; the viewer can walk around and inspect them.
2. The result states “Does not fit under the current box-model constraints,” highlights the 0.85 m sofa dimension and 0.80 m doorway restriction in red, and does not claim a verified solution.
3. A mouse-simulated pinch on the arrow advances a step, and pinch-dragging the rail scrubs the illustrative animation in both directions. Both controls visibly respond to hover and selection.
4. The illustrative sofa transitions smoothly between steps, remains anchored to the doorway, and displays “Unverified maneuver” throughout. The viewer can pause by leaving it at a step and change viewpoint using preview controls.
5. The preview runs without crashes or broken interactions; labels remain readable and visual transitions avoid distracting clutter. A first-time viewer can understand within 30 seconds what PIVOT does, why this configuration cannot be confirmed to fit, and what the visualization explains.

## Out of scope
- Room scanning, object recognition, real-time physical tracking, and changing dimensions in this initial preview.
- Full six-axis path planning, hallway turns, stairs, or validating the sofa's motion against wall thickness.
- Claims that the illustrative maneuver is collision-free or that a real sofa cannot fit by any other method.

## Risks and open questions
- The planner models an oriented box moving through the doorway at one fixed orientation. It does not validate intermediate rotation or tilt, so animation and any apparent intersections are illustrative rather than a physical collision analysis.
- A realistic sofa's shape and compressibility may differ from its bounding box; the no-fit result is limited to that model.
- Real glasses comfort and hand-tracking reliability remain feel unproven. A full-size sofa and doorway may not fit in the narrow view at once; inspect the scene by walking around it.
- The 30-second first-viewer criterion needs a human observation; smoothness and visual quality require manual judgment as well as automated checks.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
