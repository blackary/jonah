import Phaser from 'phaser';
import { DIALOGUES } from './content/dialogue';
import { getHudState, MAPS } from './content/maps';
import { PUZZLES, TRIVIA_GATES } from './content/puzzles';
import { TRIVIA_QUESTIONS } from './content/trivia';
import { GameSession } from './runtime/GameSession';
import { DomUi } from './ui/DomUi';
import type {
  DialogueDefinition,
  DialogueLineNode,
  Difficulty,
  DialogueOutcome,
  FlagValue,
  SettingsState,
  TriviaQuestion,
} from './types';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';

export interface InteractionSource {
  kind: 'actor' | 'object' | 'trigger' | 'map';
  actorId?: string;
  objectId?: string;
  triggerId?: string;
}

type AppMode = 'title' | 'world';

export class GameApp {
  readonly session = new GameSession();

  readonly ui: DomUi;

  readonly game: Phaser.Game;

  private readonly gameRoot: HTMLElement;

  private mode: AppMode = 'title';

  private overlayDepth = 0;

  private worldScene?: WorldScene;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="app-shell">
        <div class="stage-frame">
          <div id="game-root" class="game-root"></div>
          <div id="ui-root" class="ui-root"></div>
        </div>
      </div>
    `;

    this.gameRoot = root.querySelector<HTMLElement>('#game-root') as HTMLElement;

    this.ui = new DomUi(root.querySelector<HTMLElement>('#ui-root') as HTMLElement, {
      onNewGame: () => void this.startNewGame(),
      onContinue: () => void this.continueGame(),
      onOpenSettings: () => void this.openSettings(),
      onOpenCredits: () => void this.openCredits(),
      onPauseToggle: () => void this.togglePause(),
      onInteract: () => void this.worldScene?.interact(),
      onDirectionStart: (direction) => this.worldScene?.setVirtualDirection(direction, true),
      onDirectionEnd: (direction) => this.worldScene?.setVirtualDirection(direction, false),
    });

    this.session.subscribe(() => {
      this.refreshHud();
      this.worldScene?.refreshFromSave();
    });

    this.game = new Phaser.Game({
      type: Phaser.CANVAS,
      width: 640,
      height: 480,
      parent: this.gameRoot,
      pixelArt: true,
      backgroundColor: '#10151d',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [
        new BootScene(this),
        new PreloadScene(this),
        new TitleScene(this),
        new WorldScene(this),
      ],
    });

    this.game.canvas?.setAttribute('tabindex', '0');
    this.focusGameSurface();
  }

  registerBootScene(): void {
    if (this.mode === 'world') {
      return;
    }
    this.ui.showTitle(this.session.hasSave(), this.session.getSettings());
  }

  registerPreloadComplete(): void {
    if (this.mode === 'world') {
      return;
    }
    this.ui.showTitle(this.session.hasSave(), this.session.getSettings());
  }

  attachTitleScene(scene: TitleScene): void {
    void scene;
    if (this.mode === 'world') {
      return;
    }
    this.mode = 'title';
    this.ui.hideHud();
    this.ui.showTitle(this.session.hasSave(), this.session.getSettings());
  }

  attachWorldScene(scene: WorldScene): void {
    this.worldScene = scene;
  }

  canAcceptWorldInput(): boolean {
    return this.mode === 'world' && this.overlayDepth === 0;
  }

  getSnapshot(): {
    mode: AppMode;
    overlayDepth: number;
    save: ReturnType<GameSession['getSave']>;
    settings: SettingsState;
  } {
    return {
      mode: this.mode,
      overlayDepth: this.overlayDepth,
      save: this.session.getSave() ? structuredClone(this.session.getSave()) : null,
      settings: structuredClone(this.session.getSettings()),
    };
  }

  refreshHud(): void {
    if (this.mode !== 'world' || !this.session.hasSave()) {
      return;
    }

    this.ui.updateHud(getHudState(this.session.requireSave()));
  }

  async examineFeature(label: string, text: string): Promise<void> {
    if (this.overlayDepth > 0) {
      return;
    }

    await this.runOverlay(async () => {
      await this.playLines([{ speaker: label, text }]);
    });
  }

  async startNewGame(): Promise<void> {
    this.session.startNewGame();
    this.mode = 'world';
    this.ui.hideTitle();
    this.game.scene.stop('title');
    this.game.scene.start('world');
    this.focusGameSurface();
  }

  async continueGame(): Promise<void> {
    if (!this.session.hasSave()) {
      this.ui.showToast('No saved pilgrimage yet.', 'warning');
      return;
    }

    this.mode = 'world';
    this.ui.hideTitle();
    this.game.scene.stop('title');
    this.game.scene.start('world');
    this.focusGameSurface();
  }

  async debugStartNewGame(): Promise<void> {
    await this.startNewGame();
  }

  async debugTransition(mapId: string, spawnId: string): Promise<void> {
    if (this.mode !== 'world') {
      if (!this.session.hasSave()) {
        await this.startNewGame();
      } else {
        await this.continueGame();
      }
    }
    await this.transitionToMap(mapId, spawnId);
  }

  async debugRunScript(scriptId: string, source: InteractionSource = { kind: 'map' }): Promise<void> {
    await this.runOverlay(async () => {
      await this.runScript(scriptId, source);
    });
  }

  debugSetFlag(flag: string, value: FlagValue): void {
    this.session.setFlag(flag, value);
  }

  async handleEvent(event: string, source: InteractionSource): Promise<void> {
    if (this.overlayDepth > 0) {
      return;
    }

    await this.runOverlay(async () => {
      await this.dispatchEvent(event, source);
    });
  }

  async dispatchEvent(event: string, source: InteractionSource): Promise<void> {
    if (event.startsWith('dialogue:')) {
      await this.playDialogue(event.slice('dialogue:'.length));
      return;
    }

    if (event.startsWith('script:')) {
      await this.runScript(event.slice('script:'.length), source);
    }
  }

  async transitionToMap(mapId: string, spawnId: string): Promise<void> {
    const spawn = MAPS[mapId].spawns[spawnId];
    this.session.setMap(mapId, spawnId, spawn.x, spawn.y);
    this.session.setPlayerPosition(spawn.x, spawn.y, spawn.facing ?? 'down');
    this.session.saveNow();
    await this.worldScene?.transitionToMap();
  }

  async togglePause(): Promise<void> {
    if (this.mode !== 'world' || this.overlayDepth > 0) {
      return;
    }

    await this.runOverlay(async () => {
      let open = true;
      while (open) {
        const choice = await this.ui.showModalCard(
          'Pause',
          '<p>Choose your next move.</p>',
          [
            { id: 'resume', label: 'Resume', accent: true, testId: 'pause-resume' },
            { id: 'settings', label: 'Settings', testId: 'pause-settings' },
            { id: 'credits', label: 'Credits', testId: 'pause-credits' },
            { id: 'title', label: 'Save & Title', testId: 'pause-title' },
          ],
        );

        switch (choice) {
          case 'resume':
            open = false;
            break;
          case 'settings':
            await this.openSettings(true);
            break;
          case 'credits':
            await this.openCredits(true);
            break;
          case 'title':
            this.returnToTitle();
            open = false;
            break;
        }
      }
    });
  }

  async openSettings(fromPause = false): Promise<void> {
    if (!fromPause && this.overlayDepth > 0) {
      return;
    }

    const runner = async () => {
      let done = false;
      while (!done) {
        const settings = this.session.getSettings();
        const choice = await this.ui.showModalCard(
          'Settings',
          `<p>Set the pace for play and how demanding the trivia gates should be.</p>
           <p>Difficulty shapes which questions the game selects for each gate.</p>`,
          [
            { id: 'difficulty', label: `Difficulty: ${this.pretty(settings.difficulty)}`, accent: true },
            { id: 'text', label: `Text Speed: ${this.pretty(settings.textSpeed)}` },
            { id: 'music', label: `Music: ${settings.musicEnabled ? 'On' : 'Off'}` },
            { id: 'sfx', label: `SFX: ${settings.sfxEnabled ? 'On' : 'Off'}` },
            { id: 'back', label: 'Back' },
          ],
        );

        switch (choice) {
          case 'difficulty':
            this.session.setSettings({
              ...settings,
              difficulty: this.cycleDifficulty(settings.difficulty),
            });
            this.ui.showTitle(this.session.hasSave(), this.session.getSettings());
            break;
          case 'text':
            this.session.setSettings({
              ...settings,
              textSpeed: this.cycleTextSpeed(settings.textSpeed),
            });
            this.ui.showTitle(this.session.hasSave(), this.session.getSettings());
            break;
          case 'music':
            this.session.setSettings({
              ...settings,
              musicEnabled: !settings.musicEnabled,
            });
            this.ui.showTitle(this.session.hasSave(), this.session.getSettings());
            break;
          case 'sfx':
            this.session.setSettings({
              ...settings,
              sfxEnabled: !settings.sfxEnabled,
            });
            this.ui.showTitle(this.session.hasSave(), this.session.getSettings());
            break;
          case 'back':
            done = true;
            break;
        }
      }
    };

    if (fromPause) {
      await runner();
      return;
    }

    await this.runOverlay(runner);
  }

  async openCredits(fromPause = false): Promise<void> {
    const runner = async () => {
      await this.ui.showModalCard(
        'Credits',
        `<p><strong>Design:</strong> Jonah 1–4 rendered as a compact retro pilgrimage.</p>
         <p><strong>Engine:</strong> Phaser 3 + Vite.</p>
         <p><strong>Focus:</strong> God’s sovereignty, human resistance, and mercy toward the undeserving.</p>`,
        [{ id: 'back', label: 'Back', accent: true }],
      );
    };

    if (fromPause) {
      await runner();
      return;
    }

    await this.runOverlay(runner);
  }

  returnToTitle(): void {
    this.session.saveNow();
    this.mode = 'title';
    this.game.scene.stop('world');
    this.game.scene.start('title');
    this.ui.hideHud();
    this.ui.showTitle(this.session.hasSave(), this.session.getSettings());
  }

  private async runOverlay<T>(callback: () => Promise<T>): Promise<T> {
    this.overlayDepth += 1;
    try {
      return await callback();
    } finally {
      this.overlayDepth = Math.max(0, this.overlayDepth - 1);
      if (this.mode === 'world') {
        this.focusGameSurface();
      }
    }
  }

  private focusGameSurface(): void {
    window.requestAnimationFrame(() => {
      this.game.canvas?.focus();
    });
  }

  private async playDialogue(dialogueId: string): Promise<DialogueOutcome> {
    const dialogue = DIALOGUES[dialogueId];
    if (!dialogue) {
      throw new Error(`Unknown dialogue: ${dialogueId}`);
    }

    return this.playDialogueDefinition(dialogue);
  }

  private async playDialogueDefinition(dialogue: DialogueDefinition): Promise<DialogueOutcome> {
    let choice: string | undefined;

    for (const node of dialogue.lines) {
      if ('choice' in node) {
        choice = await this.ui.showDialogueChoice(node.choice.prompt, node.choice.options);
      } else {
        const line = node as DialogueLineNode;
        await this.ui.showDialogueLine(line.speaker, line.text);
      }
    }

    return { choice };
  }

  private async playLines(lines: DialogueDefinition['lines']): Promise<DialogueOutcome> {
    return this.playDialogueDefinition({
      id: 'inline',
      lines,
    });
  }

  private async playTriviaGate(gateId: string): Promise<boolean> {
    const gate = TRIVIA_GATES[gateId];
    if (!gate) {
      throw new Error(`Unknown trivia gate: ${gateId}`);
    }

    const questions = this.pickQuestions(gate.tags, gate.questionsRequired, this.session.getSettings().difficulty);
    for (const question of questions) {
      const success = await this.askQuestion(question);
      if (!success) {
        return false;
      }
    }

    this.session.saveNow();
    return true;
  }

  private pickQuestions(tags: string[], count: number, difficulty: Difficulty): TriviaQuestion[] {
    const rankOrder: Record<Difficulty, Difficulty[]> = {
      easy: ['easy', 'normal', 'hard'],
      normal: ['normal', 'easy', 'hard'],
      hard: ['hard', 'normal', 'easy'],
    };

    const relevant = TRIVIA_QUESTIONS.filter((question) => question.tags.some((tag) => tags.includes(tag)));
    const answered = this.session.getSave()?.trivia.answered ?? {};
    const selected: TriviaQuestion[] = [];

    for (const rank of rankOrder[difficulty]) {
      const fresh = relevant.filter((question) => question.difficulty === rank && !answered[question.id]);
      this.shuffle(fresh);
      fresh.forEach((question) => {
        if (selected.length < count) {
          selected.push(question);
        }
      });
      if (selected.length >= count) {
        return selected;
      }
    }

    const fallback = relevant.filter((question) => !selected.includes(question));
    this.shuffle(fallback);
    fallback.forEach((question) => {
      if (selected.length < count) {
        selected.push(question);
      }
    });

    return selected.slice(0, count);
  }

  private async askQuestion(question: TriviaQuestion): Promise<boolean> {
    let attempts = this.session.requireSave().trivia.attemptsLeft[question.id] ?? 3;
    let hintActive = false;

    while (true) {
      const answer = await this.ui.showTriviaQuestion(question, attempts, hintActive);
      if (answer === question.answerIndex) {
        this.session.markTriviaAnswered(question.id);
        await this.ui.showModalCard(
          'Correct',
          `<p>${question.verseReference}</p><p>The gate yields when the word is remembered.</p>`,
          [{ id: 'continue', label: 'Continue', accent: true }],
        );
        return true;
      }

      attempts -= 1;
      if (attempts <= 0) {
        attempts = 3;
        hintActive = true;
        this.session.resetTriviaAttempt(question.id);
        await this.ui.showModalCard(
          'Hint',
          `<p>${question.hint}</p><p>The question will repeat.</p>`,
          [{ id: 'again', label: 'Try Again', accent: true }],
        );
        continue;
      }

      this.session.setTriviaAttempt(question.id, attempts);
      await this.ui.showModalCard(
        'Not Yet',
        '<p>Look closely at the book of Jonah and try again.</p>',
        [{ id: 'again', label: 'Again', accent: true }],
      );
    }
  }

  private async runScript(scriptId: string, source: InteractionSource): Promise<void> {
    switch (scriptId) {
      case 'onEnterJoppa': {
        if (this.session.getFlag('joppaIntroSeen') === true) {
          break;
        }
        await this.playLines([
          {
            speaker: 'Narrator',
            text: 'Bronze markers show what Jonah can talk to or use. Face a marked person or object and press Space, Enter, or Z. Close scene props can also be examined.',
          },
          {
            speaker: 'Narrator',
            text: 'Stone walls and large props block movement. The messenger is waiting just north of Jonah.',
          },
        ]);
        this.session.setFlag('joppaIntroSeen', true);
        break;
      }
      case 'messenger': {
        if (!this.session.getFlag('heardCall')) {
          const outcome = await this.playDialogue('messenger_call');
          this.session.setFlag('heardCall', true);
          if (outcome.choice === 'obey') {
            await this.playLines([
              {
                speaker: 'Narrator',
                text: 'That would have been wisdom. Yet Jonah in this story turns toward the western sea.',
              },
            ]);
          }
        } else {
          await this.playDialogue('messenger_reminder');
        }
        break;
      }
      case 'merchant': {
        const step = Number(this.session.getFlag('fareQuestStep') ?? 0);
        if (this.session.getFlag('fareTokenObtained') === true) {
          await this.playLines([
            { speaker: 'Merchant', text: 'The token is yours already. The dockmaster cannot ask for more than stamped silver.' },
          ]);
          break;
        }
        if (step <= 0) {
          await this.playDialogue('merchant_intro');
          this.session.setFlag('fareQuestStep', 1);
          this.ui.showToast('The harbor office is marked in bronze.', 'info');
        } else if (step === 1 || step === 2) {
          if (step === 1) {
            await this.playLines([
              {
                speaker: 'Merchant',
                text: 'The manifest is on the harbor office desk to the west. Bring it down-pier to the sailor, then return with his receipt.',
              },
            ]);
          } else {
            await this.playLines([
              {
                speaker: 'Merchant',
                text: 'Good. The sailor is still waiting below the pier for that manifest. Bring his receipt back to me when he signs it.',
              },
            ]);
          }
        } else {
          await this.playDialogue('merchant_return');
          this.session.setFlag('fareTokenObtained', true);
          this.session.addItem('fare_token');
          this.session.setFlag('fareQuestStep', 4);
          this.ui.showToast('Received Ship Fare.', 'success');
        }
        break;
      }
      case 'harborOfficeDoor': {
        await this.transitionToMap('JOPPA_HARBOR_OFFICE', 'from_docks');
        break;
      }
      case 'leaveHarborOffice': {
        await this.transitionToMap('JOPPA_DOCKS', 'office_return');
        break;
      }
      case 'manifestCrate': {
        const step = Number(this.session.getFlag('fareQuestStep') ?? 0);
        if (step < 1) {
          await this.playLines([{ speaker: 'Narrator', text: 'Ledgers, seals, and harbor tallies. Jonah has no business here yet.' }]);
        } else if (step === 1) {
          await this.playLines([
            { speaker: 'Narrator', text: 'Jonah takes the merchant’s Tarshish manifest from the harbor desk and tucks the receipt tablet beneath it.' },
          ]);
          this.session.setFlag('fareQuestStep', 2);
          this.ui.showToast('Deliver the manifest to the sailor.', 'info');
        } else {
          await this.playDialogue('already_done');
        }
        break;
      }
      case 'sailor': {
        const step = Number(this.session.getFlag('fareQuestStep') ?? 0);
        if (step === 2) {
          await this.playDialogue('sailor_manifest');
          this.session.setFlag('fareQuestStep', 3);
          this.ui.showToast('Return to the merchant.', 'success');
        } else {
          await this.playDialogue('sailor_done');
        }
        break;
      }
      case 'dockmaster': {
        if (!this.session.hasItem('fare_token')) {
          await this.playDialogue('dockmaster_no_fare');
          break;
        }
        if (this.session.getFlag('joppaTriviaPassed') !== true) {
          await this.playDialogue('dockmaster_quiz_intro');
          if (await this.playTriviaGate('joppa_call')) {
            this.session.setFlag('joppaTriviaPassed', true);
            await this.playDialogue('dockmaster_pass');
            this.ui.showToast('Gangplank lowered.', 'success');
          }
          break;
        }
        await this.playLines([{ speaker: 'Dockmaster', text: 'The plank is clear. If you mean to flee, then flee.' }]);
        break;
      }
      case 'gangplank': {
        if (this.session.getFlag('joppaTriviaPassed') !== true) {
          await this.playLines([
            {
              speaker: 'Dockmaster',
              text: 'The gangplank stays up until your fare and your answer are in order.',
            },
          ]);
          break;
        }
        await this.playDialogue('captain_board');
        this.session.setFlag('boardedShip', true);
        this.session.removeItem('fare_token');
        await this.transitionToMap('SHIP_DECK', 'gangplank');
        break;
      }
      case 'captain': {
        if (this.session.getFlag('joppaTriviaPassed') !== true) {
          await this.playLines([{ speaker: 'Captain', text: 'The dockmaster will not wave you through until your fare and your answer are in order.' }]);
          break;
        }
        await this.playDialogue('captain_board');
        this.session.setFlag('boardedShip', true);
        this.session.removeItem('fare_token');
        await this.transitionToMap('SHIP_DECK', 'gangplank');
        break;
      }
      case 'onEnterShip': {
        if (this.session.getFlag('stormStarted') === true) {
          break;
        }
        await this.playDialogue('ship_intro');
        await this.playDialogue('ship_storm');
        this.worldScene?.shake(420, 0.012);
        this.session.setFlag('stormStarted', true);
        break;
      }
      case 'stormSailor': {
        if (this.session.getFlag('cargoSolved') === true) {
          await this.playLines([{ speaker: 'Sailor', text: 'The cargo holds. Now the sea itself accuses you.' }]);
        } else {
          await this.playDialogue('ship_cleat_hint');
        }
        break;
      }
      case 'toggleCargoCleat': {
        const objectId = source.objectId;
        if (!objectId) break;
        const object = MAPS[this.session.requireSave().map].objects.find((entry) => entry.id === objectId);
        if (!object?.puzzleId || typeof object.puzzleIndex !== 'number') break;
        const state = this.session.getPuzzleState(object.puzzleId);
        state[object.puzzleIndex] = state[object.puzzleIndex] === 1 ? 0 : 1;
        this.session.setPuzzleState(object.puzzleId, state);
        if (
          !this.session.getFlag('cargoSolved') &&
          JSON.stringify(state) === JSON.stringify(PUZZLES.cargo_cleats.targetState)
        ) {
          this.session.setFlag('cargoSolved', true);
          this.ui.showToast('Cargo secured.', 'success');
        }
        break;
      }
      case 'shipCaptain': {
        if (this.session.getFlag('cargoSolved') !== true) {
          await this.playDialogue('ship_storm');
          break;
        }
        if (this.session.getFlag('thrownOverboard') === true) {
          await this.playLines([{ speaker: 'Captain', text: 'The sea remembers. The deck does too.' }]);
          break;
        }
        await this.playDialogue('ship_cargo_solved');
        if (await this.playTriviaGate('ship_lots')) {
          await this.playDialogue('ship_confession');
          await this.playDialogue('ship_overboard');
          this.session.setFlag('thrownOverboard', true);
          await this.transitionToMap('FISH_INTERIOR', 'swallowed');
        }
        break;
      }
      case 'onEnterFish': {
        if (this.session.getFlag('fishIntroSeen') === true) {
          break;
        }
        await this.playDialogue('fish_intro');
        this.session.setFlag('fishIntroSeen', true);
        break;
      }
      case 'toggleFishSigil': {
        const objectId = source.objectId;
        if (!objectId) break;
        const object = MAPS[this.session.requireSave().map].objects.find((entry) => entry.id === objectId);
        if (!object?.puzzleId || typeof object.puzzleIndex !== 'number') break;
        const state = this.session.getPuzzleState(object.puzzleId);
        state[object.puzzleIndex] = state[object.puzzleIndex] === 1 ? 0 : 1;
        this.session.setPuzzleState(object.puzzleId, state);
        if (
          this.session.getFlag('fishSigilsLit') !== true &&
          JSON.stringify(state) === JSON.stringify(PUZZLES.fish_sigils.targetState)
        ) {
          this.session.setFlag('fishSigilsLit', true);
          await this.playDialogue('fish_puzzle_solved');
        }
        break;
      }
      case 'fishAltar': {
        if (this.session.getFlag('fishSigilsLit') !== true) {
          await this.playDialogue('fish_puzzle_hint');
          break;
        }
        if (this.session.getFlag('fishSolved') === true) {
          await this.playDialogue('fish_prayer');
          break;
        }
        if (await this.playTriviaGate('fish_prayer')) {
          await this.playDialogue('fish_prayer');
          this.session.setFlag('fishSolved', true);
          this.session.setFlag('fishReleased', true);
          await this.playDialogue('fish_release');
          await this.transitionToMap('COAST_ROAD', 'shoreline');
        }
        break;
      }
      case 'onEnterRoad': {
        if (this.session.getFlag('roadIntroSeen') === true) {
          break;
        }
        await this.playDialogue('road_intro');
        this.session.setFlag('roadIntroSeen', true);
        break;
      }
      case 'traveler': {
        const step = Number(this.session.getFlag('roadQuestStep') ?? 0);
        if (this.session.getFlag('roadPassGranted') === true) {
          await this.playDialogue('traveler_restored');
          break;
        }
        if (step <= 0) {
          await this.playDialogue('traveler_need_water');
          this.session.setFlag('roadQuestStep', 1);
          break;
        }
        if (this.session.hasItem('water_flask')) {
          await this.playDialogue('traveler_restored');
          this.session.removeItem('water_flask');
          this.session.setFlag('roadPassGranted', true);
          this.ui.showToast('The road to Nineveh is clear.', 'success');
          break;
        }
        await this.playDialogue('traveler_waiting');
        break;
      }
      case 'spring': {
        if (this.session.getFlag('roadQuestStep') !== 1 || this.session.hasItem('water_flask')) {
          await this.playLines([{ speaker: 'Narrator', text: 'The spring still runs cool between the stones.' }]);
          break;
        }
        await this.playDialogue('spring_found');
        this.session.addItem('water_flask');
        this.session.setFlag('roadQuestStep', 2);
        this.ui.showToast('Filled Water Flask.', 'success');
        break;
      }
      case 'gateGuard': {
        if (this.session.getFlag('enteredNineveh') === true) {
          await this.playLines([{ speaker: 'Guard', text: 'You already carry your warning inside the gate. Go on.' }]);
          break;
        }
        await this.playDialogue('gate_guard_intro');
        if (await this.playTriviaGate('nineveh_gate')) {
          this.session.setFlag('enteredNineveh', true);
          await this.playDialogue('gate_guard_pass');
        }
        break;
      }
      case 'onEnterNineveh': {
        if (this.session.getFlag('ninevehIntroSeen') === true) {
          break;
        }
        await this.playDialogue('nineveh_intro');
        this.session.setFlag('ninevehIntroSeen', true);
        break;
      }
      case 'herald': {
        if (this.session.getFlag('heardHerald') === true) {
          await this.playLines([{ speaker: 'Herald', text: 'I have already shouted the warning through the square. Speak to the official.' }]);
          break;
        }
        await this.playDialogue('herald_warning');
        this.session.setFlag('heardHerald', true);
        break;
      }
      case 'official': {
        if (this.session.getFlag('deliveredMessage') === true) {
          await this.playLines([{ speaker: 'Official', text: 'The word has reached the throne. The city waits in sackcloth now.' }]);
          break;
        }
        if (this.session.getFlag('heardHerald') !== true) {
          await this.playLines([{ speaker: 'Official', text: 'Start in the square. Let the herald hear the warning first.' }]);
          break;
        }
        await this.playDialogue('official_audience');
        this.session.setFlag('officialAudienceGranted', true);
        this.ui.showToast('The palace door is open.', 'success');
        break;
      }
      case 'palaceDoor': {
        if (this.session.getFlag('officialAudienceGranted') !== true) {
          await this.playLines([{ speaker: 'Guard', text: 'The palace is not for stray voices. Win the official’s leave first.' }]);
          break;
        }
        await this.transitionToMap('NINEVEH_PALACE', 'from_center');
        break;
      }
      case 'leavePalace': {
        await this.transitionToMap('NINEVEH_CENTER', 'palace_return');
        break;
      }
      case 'king': {
        if (this.session.getFlag('ninevehRepented') === true) {
          await this.playDialogue('king_response');
          break;
        }
        if (this.session.getFlag('officialAudienceGranted') !== true) {
          await this.playLines([{ speaker: 'Guard', text: 'The king does not hear every street-voice. Speak to the official first.' }]);
          break;
        }
        await this.playDialogue('king_response');
        if (await this.playTriviaGate('king_response')) {
          this.session.setFlag('kingTriviaPassed', true);
          this.session.setFlag('deliveredMessage', true);
          this.session.setFlag('ninevehRepented', true);
          await this.playDialogue('city_repents');
        }
        break;
      }
      case 'onEnterEastCity': {
        if (this.session.getFlag('eastCityIntroSeen') === true) {
          break;
        }
        await this.playDialogue('east_city_intro');
        this.session.setFlag('eastCityIntroSeen', true);
        break;
      }
      case 'shelterCloth': {
        await this.collectShelterPiece('gotShelterCloth');
        break;
      }
      case 'shelterReeds': {
        await this.collectShelterPiece('gotShelterReeds');
        break;
      }
      case 'shelterStones': {
        await this.collectShelterPiece('gotShelterStones');
        break;
      }
      case 'shelterFrame': {
        const step = Number(this.session.getFlag('shelterStep') ?? 0);
        if (step < 3) {
          await this.playLines([{ speaker: 'Jonah', text: 'The frame needs cloth, reeds, and stones before it can cast any shade.' }]);
          break;
        }
        if (this.session.getFlag('plantGrown') !== true) {
          await this.playDialogue('plant_grows');
          this.session.setFlag('plantGrown', true);
          break;
        }
        if (this.session.getFlag('wormEvent') !== true) {
          await this.playDialogue('east_city_quiz_intro');
          if (await this.playTriviaGate('east_city_reflection')) {
            await this.playDialogue('worm_strikes');
            this.session.setFlag('wormEvent', true);
            this.worldScene?.shake(360, 0.009);
            await this.playDialogue('final_question');
            this.session.setFlag('endingSeen', true);
            this.session.saveNow();
            await this.worldScene?.fadeOut(900);
            this.returnToTitle();
          }
          break;
        }
        await this.playDialogue('final_question');
        break;
      }
      default:
        throw new Error(`Unhandled script: ${scriptId}`);
    }

    this.session.saveNow();
  }

  private async collectShelterPiece(flag: string): Promise<void> {
    if (this.session.getFlag(flag) === true) {
      this.ui.showToast('Already gathered.', 'info');
      return;
    }
    this.session.setFlag(flag, true);
    this.session.incrementFlag('shelterStep', 1);
    const step = Number(this.session.getFlag('shelterStep') ?? 0);
    await this.playDialogue(step >= 3 ? 'shelter_built' : 'shelter_piece');
  }

  private cycleDifficulty(difficulty: Difficulty): Difficulty {
    switch (difficulty) {
      case 'easy':
        return 'normal';
      case 'normal':
        return 'hard';
      case 'hard':
        return 'easy';
    }
  }

  private cycleTextSpeed(textSpeed: SettingsState['textSpeed']): SettingsState['textSpeed'] {
    switch (textSpeed) {
      case 'slow':
        return 'normal';
      case 'normal':
        return 'fast';
      case 'fast':
        return 'slow';
    }
  }

  private pretty(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private shuffle<T>(items: T[]): void {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
  }
}
