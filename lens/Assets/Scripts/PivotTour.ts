/**
 * A hands-free walk through PIVOT, built to fit a three-minute demo: it switches scenarios, pinches the fix, tries the
 * other route, swaps the load and pulls a door edge by itself, with a short caption under the title at each step.
 * It only calls what a hand could call, so every beat is a real analysis. Touching any control hands the Lens back.
 */

/** What the tour needs from the analysis it drives. */
export interface TourHost {
  /** Show curated scenario `id`, leaving Your move first. */
  show(id: string): void;
  /** Pinch the first suggested fix of the blocked gate. */
  tryFix(): void;
  /** Pinch "Try another route". */
  tryAlternative(): void;
  /** Pinch "Swap object". */
  swapObject(): void;
  setLifeSize(on: boolean): void;
  /** Pull a handle of the object or the gate to a stage point (cm of the room). */
  drag(key: string, x: number, y: number, z: number): void;
  /** Show `text` in the story slot for `seconds`. An empty text clears it. */
  caption(text: string, seconds: number): void;
  /** Changes whenever something other than the tour changed what is on screen. */
  signature(): string;
}

export interface Beat {
  /** Seconds this beat stays up. */
  hold: number;
  caption?: string;
  /** Runs once when the beat starts. */
  run?: (host: TourHost) => void;
  /** Runs every frame with the beat's progress from 0 to 1. */
  during?: (u: number, host: TourHost) => void;
}

/**
 * Start the tour by itself two seconds after the Lens starts, so a screen recording needs no click on the Tour button.
 * Leave it false for the normal Lens and for the tests; any pinch on a control still hands the Lens back.
 */
export const AUTO_TOUR = false;

/** The studio flat's door: pulled from 80 cm to 100 cm, the sofa goes through at about 85. */
const DOOR_FROM = 40;
const DOOR_TO = 50;
let lastDoor = -1;

export const TOUR: Beat[] = [
  { hold: 15, caption: "Can it get there? PIVOT checks the whole move, not just the doorway.", run: (h) => h.show("studio-sofa") },
  { hold: 14, caption: "Pinch a fix: widen the door to 85. Re-planned live, and it fits.", run: (h) => h.tryFix() },
  { hold: 13, caption: "The door fits. The hall does not: no room to turn. A door check says yes.", run: (h) => h.show("narrow-hall") },
  { hold: 14, caption: "Round a corner the sofa swings on its back. Every angle is solved.", run: (h) => h.show("hallway-corner") },
  { hold: 10, caption: "Pinch Life size to stand at the corner: the same plan at real size.", run: (h) => h.setLifeSize(true) },
  { hold: 11, caption: "Lifts too: the door and the cabin both have to clear.", run: (h) => { h.setLifeSize(false); h.show("elevator-wardrobe"); } },
  { hold: 8, caption: "Not only sofas: a gallery crate, blocked at the side entrance.", run: (h) => h.show("gallery-loading") },
  { hold: 12, caption: "Try another route: the same crate clears the loading dock.", run: (h) => h.tryAlternative() },
  { hold: 11, caption: "A millimetre matters: it fits by 4 mm, and it tells you.", run: (h) => h.show("workshop-bench") },
  { hold: 7, caption: "A touring flight case: the stage door, then the wings turn.", run: (h) => h.show("backstage-flight-case") },
  { hold: 7, caption: "Empty glass through a garden gate and a narrow passage.", run: (h) => h.show("aquarium-delivery") },
  { hold: 9, caption: "Swap the load, keep the measured route: a new verdict at once.", run: (h) => h.swapObject() },
  { hold: 4, caption: "Your move: grab an edge and pull. The verdict follows your hand.", run: (h) => { lastDoor = -1; h.show("studio-sofa"); } },
  {
    hold: 9,
    caption: "Door at 80 cm blocks. Pull it past 85 and the sofa goes through.",
    // A step at a time, so each replan is one whole centimetre of door and not sixty a second.
    during: (u, h) => {
      const door = DOOR_FROM + Math.round((DOOR_TO - DOOR_FROM) * Math.min(1, u / 0.65));
      if (door === lastDoor) return;
      lastDoor = door;
      h.drag("gate:width", door, 102.5, 0);
    },
  },
  { hold: 12, caption: "PIVOT: before you lift it, know if it fits.", run: (h) => h.show("widened-door") },
];

/** How long the tour runs, in seconds. */
export const tourSeconds = (): number => TOUR.reduce((sum, beat) => sum + beat.hold, 0);

export class Tour {
  private beat = -1;
  private clock = 0;
  private expected = "";
  private active = false;

  constructor(private host: TourHost, private onChange: (running: boolean) => void) {}

  public get running(): boolean {
    return this.active;
  }

  public start(): void {
    if (this.active) return;
    this.active = true;
    this.beat = -1;
    this.onChange(true);
    this.advance();
  }

  public stop(): void {
    if (!this.active) return;
    this.active = false;
    this.host.caption("", 0);
    this.onChange(false);
  }

  public update(dt: number): void {
    if (!this.active) return;
    // Something other than the tour changed what is on screen: a hand took over.
    if (this.host.signature() !== this.expected) {
      this.stop();
      return;
    }
    this.clock += dt;
    const beat = TOUR[this.beat];
    if (beat.during) {
      beat.during(Math.min(1, this.clock / beat.hold), this.host);
      this.expected = this.host.signature();
    }
    if (this.clock >= beat.hold) this.advance();
  }

  private advance(): void {
    this.beat++;
    if (this.beat >= TOUR.length) {
      this.stop();
      return;
    }
    this.clock = 0;
    const beat = TOUR[this.beat];
    if (beat.run) beat.run(this.host);
    if (beat.caption) this.host.caption(beat.caption, beat.hold);
    this.expected = this.host.signature();
  }
}
