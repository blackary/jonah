import type {
  DialogueChoiceOption,
  HudState,
  SettingsState,
  TriviaQuestion,
} from '../types';

type Tone = 'info' | 'success' | 'warning';

export interface UiHandlers {
  onNewGame(): void;
  onContinue(): void;
  onOpenSettings(): void;
  onOpenCredits(): void;
  onPauseToggle(): void;
  onInteract(): void;
  onDirectionStart(direction: 'up' | 'down' | 'left' | 'right'): void;
  onDirectionEnd(direction: 'up' | 'down' | 'left' | 'right'): void;
}

interface ModalButton {
  id: string;
  label: string;
  accent?: boolean;
  testId?: string;
}

export class DomUi {
  private readonly root: HTMLElement;

  private readonly handlers: UiHandlers;

  private readonly titleScreen: HTMLElement;

  private readonly titleActions: HTMLElement;

  private readonly titleMeta: HTMLElement;

  private readonly continueButton: HTMLButtonElement;

  private readonly hud: HTMLElement;

  private readonly hudChapter: HTMLElement;

  private readonly hudLocation: HTMLElement;

  private readonly hudObjective: HTMLElement;

  private readonly hudInventory: HTMLElement;

  private readonly chapterBanner: HTMLElement;

  private readonly dialoguePanel: HTMLElement;

  private readonly dialogueSpeaker: HTMLElement;

  private readonly dialogueText: HTMLElement;

  private readonly dialogueActions: HTMLElement;

  private readonly triviaPanel: HTMLElement;

  private readonly triviaPrompt: HTMLElement;

  private readonly triviaMeta: HTMLElement;

  private readonly triviaChoices: HTMLElement;

  private readonly modal: HTMLElement;

  private readonly modalTitle: HTMLElement;

  private readonly modalBody: HTMLElement;

  private readonly modalActions: HTMLElement;

  private readonly toast: HTMLElement;

  private readonly mobileControls: HTMLElement;

  constructor(root: HTMLElement, handlers: UiHandlers) {
    this.root = root;
    this.handlers = handlers;

    this.root.innerHTML = `
      <div class="ui-frame">
        <section class="title-screen hidden" data-testid="title-screen">
          <div class="title-card">
            <p class="title-kicker">Narrative exploration RPG</p>
            <h1>Jonah: The Reluctant Prophet</h1>
            <p class="title-copy">
              Walk through Jonah 1–4 in a compact retro pilgrimage of resistance, mercy,
              puzzles, and Scripture trivia.
            </p>
            <div class="title-actions">
              <button class="ui-button accent" data-action="new-game" data-testid="title-new">New Game</button>
              <button class="ui-button" data-action="continue" data-testid="title-continue">Continue</button>
              <button class="ui-button" data-action="settings" data-testid="title-settings">Settings</button>
              <button class="ui-button" data-action="credits" data-testid="title-credits">Credits</button>
            </div>
            <p class="desktop-legend" data-testid="desktop-legend">
              Desktop: move with WASD or arrows, use Space / Enter / Z to confirm, and Esc for pause.
            </p>
            <p class="title-meta" data-testid="title-meta"></p>
          </div>
        </section>

        <section class="hud hidden" data-testid="hud">
          <div class="hud-strip">
            <div>
              <p class="hud-label">Chapter</p>
              <p class="hud-value" data-testid="hud-chapter"></p>
            </div>
            <div>
              <p class="hud-label">Location</p>
              <p class="hud-value" data-testid="hud-location"></p>
            </div>
            <button class="ui-button small" data-action="pause" data-testid="hud-pause">Pause</button>
          </div>
          <div class="objective-card">
            <p class="hud-label">Objective</p>
            <p class="objective-text" data-testid="hud-objective"></p>
            <p class="inventory-text" data-testid="hud-inventory"></p>
            <p class="desktop-inline-hint">Desktop controls: WASD / arrows to move, Space / Enter / Z to act.</p>
          </div>
        </section>

        <section class="chapter-banner hidden" data-testid="chapter-banner"></section>

        <section class="dialogue-panel hidden" data-testid="dialogue-panel">
          <p class="dialogue-speaker" data-testid="dialogue-speaker"></p>
          <p class="dialogue-text" data-testid="dialogue-text"></p>
          <div class="dialogue-actions" data-testid="dialogue-actions"></div>
        </section>

        <section class="trivia-panel hidden" data-testid="trivia-panel">
          <p class="trivia-kicker">Scripture Gate</p>
          <h2 class="trivia-prompt" data-testid="trivia-prompt"></h2>
          <p class="trivia-meta" data-testid="trivia-meta"></p>
          <div class="trivia-choices" data-testid="trivia-choices"></div>
        </section>

        <section class="modal hidden" data-testid="modal">
          <div class="modal-card">
            <h2 class="modal-title" data-testid="modal-title"></h2>
            <div class="modal-body" data-testid="modal-body"></div>
            <div class="modal-actions" data-testid="modal-actions"></div>
          </div>
        </section>

        <section class="toast hidden" data-testid="toast"></section>

        <section class="mobile-controls" data-testid="mobile-controls">
          <div class="mobile-dpad">
            <button class="mobile-button up" data-direction="up" aria-label="Move up">▲</button>
            <div class="mobile-row">
              <button class="mobile-button" data-direction="left" aria-label="Move left">◀</button>
              <button class="mobile-button" data-direction="down" aria-label="Move down">▼</button>
              <button class="mobile-button" data-direction="right" aria-label="Move right">▶</button>
            </div>
          </div>
          <div class="mobile-actions">
            <button class="mobile-button action" data-action="interact" data-testid="mobile-interact">Talk</button>
            <button class="mobile-button action" data-action="pause" data-testid="mobile-pause">Menu</button>
          </div>
        </section>
      </div>
    `;

    this.titleScreen = this.require('.title-screen');
    this.titleActions = this.require('.title-actions');
    this.titleMeta = this.require('.title-meta');
    this.continueButton = this.require<HTMLButtonElement>('[data-action="continue"]');
    this.hud = this.require('.hud');
    this.hudChapter = this.require('[data-testid="hud-chapter"]');
    this.hudLocation = this.require('[data-testid="hud-location"]');
    this.hudObjective = this.require('[data-testid="hud-objective"]');
    this.hudInventory = this.require('[data-testid="hud-inventory"]');
    this.chapterBanner = this.require('.chapter-banner');
    this.dialoguePanel = this.require('.dialogue-panel');
    this.dialogueSpeaker = this.require('[data-testid="dialogue-speaker"]');
    this.dialogueText = this.require('[data-testid="dialogue-text"]');
    this.dialogueActions = this.require('[data-testid="dialogue-actions"]');
    this.triviaPanel = this.require('.trivia-panel');
    this.triviaPrompt = this.require('[data-testid="trivia-prompt"]');
    this.triviaMeta = this.require('[data-testid="trivia-meta"]');
    this.triviaChoices = this.require('[data-testid="trivia-choices"]');
    this.modal = this.require('.modal');
    this.modalTitle = this.require('[data-testid="modal-title"]');
    this.modalBody = this.require('[data-testid="modal-body"]');
    this.modalActions = this.require('[data-testid="modal-actions"]');
    this.toast = this.require('.toast');
    this.mobileControls = this.require('.mobile-controls');

    this.bindStaticActions();
    this.bindMobileControls();
    this.bindKeyboardGrid(this.titleActions);
    this.bindKeyboardGrid(this.dialogueActions);
    this.bindKeyboardGrid(this.triviaChoices);
    this.bindKeyboardGrid(this.modalActions);
  }

  showTitle(canContinue: boolean, settings: SettingsState): void {
    this.titleScreen.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.continueButton.disabled = !canContinue;
    this.titleMeta.textContent = `Difficulty: ${this.pretty(settings.difficulty)} · Text: ${this.pretty(
      settings.textSpeed,
    )} · Music: ${settings.musicEnabled ? 'On' : 'Off'} · SFX: ${
      settings.sfxEnabled ? 'On' : 'Off'
    }`;
    this.focusFirstAction(this.titleActions);
  }

  hideTitle(): void {
    this.titleScreen.classList.add('hidden');
  }

  updateHud(hudState: HudState): void {
    this.hud.classList.remove('hidden');
    this.hudChapter.textContent = hudState.chapter;
    this.hudLocation.textContent = hudState.location;
    this.hudObjective.textContent = hudState.objective;
    this.hudInventory.textContent = hudState.inventory.length
      ? `Inventory: ${hudState.inventory.join(' · ')}`
      : 'Inventory: empty hands';
  }

  hideHud(): void {
    this.hud.classList.add('hidden');
  }

  showChapterBanner(chapter: string, location: string): void {
    this.chapterBanner.textContent = `${chapter} • ${location}`;
    this.chapterBanner.classList.remove('hidden');
    window.setTimeout(() => {
      this.chapterBanner.classList.add('hidden');
    }, 2400);
  }

  showToast(message: string, tone: Tone = 'info'): void {
    this.toast.textContent = message;
    this.toast.className = `toast ${tone}`;
    this.toast.classList.remove('hidden');
    window.setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 2000);
  }

  async showDialogueLine(speaker: string | undefined, text: string): Promise<void> {
    this.dialogueSpeaker.textContent = speaker ?? 'Narrator';
    this.dialogueText.textContent = text;
    this.dialoguePanel.classList.remove('hidden');
    this.dialogueActions.replaceChildren(
      this.createButton('Next', 'dialogue-next', true, () => undefined),
    );
    this.focusFirstAction(this.dialogueActions);

    await this.waitForClick(this.dialogueActions.querySelector('button') as HTMLButtonElement);
    this.dialoguePanel.classList.add('hidden');
    this.dialogueActions.replaceChildren();
  }

  async showDialogueChoice(prompt: string, options: DialogueChoiceOption[]): Promise<string> {
    this.dialogueSpeaker.textContent = 'Choice';
    this.dialogueText.textContent = prompt;
    this.dialoguePanel.classList.remove('hidden');
    this.dialogueActions.replaceChildren();

    return new Promise((resolve) => {
      options.forEach((option, index) => {
        const button = this.createButton(
          option.text,
          `choice-${index}`,
          index === 0,
          () => {
            this.dialoguePanel.classList.add('hidden');
            this.dialogueActions.replaceChildren();
            resolve(option.value);
          },
        );
        this.dialogueActions.append(button);
      });
      this.focusFirstAction(this.dialogueActions);
    });
  }

  async showTriviaQuestion(
    question: TriviaQuestion,
    attemptsLeft: number,
    hintActive: boolean,
  ): Promise<number> {
    this.triviaPanel.classList.remove('hidden');
    this.triviaPrompt.textContent = question.prompt;
    this.triviaMeta.textContent = hintActive
      ? `Hint: ${question.hint}`
      : `Attempts left: ${attemptsLeft}`;
    this.triviaChoices.replaceChildren();

    return new Promise((resolve) => {
      question.choices.forEach((choice, index) => {
        const button = this.createButton(choice, `trivia-choice-${index}`, index === 0, () => {
          this.triviaPanel.classList.add('hidden');
          this.triviaChoices.replaceChildren();
          resolve(index);
        });
        button.classList.add('wide');
        this.triviaChoices.append(button);
      });
      this.focusFirstAction(this.triviaChoices);
    });
  }

  async showModalCard(
    title: string,
    body: string,
    buttons: ModalButton[],
  ): Promise<string> {
    this.modalTitle.textContent = title;
    this.modalBody.innerHTML = body;
    this.modalActions.replaceChildren();
    this.modal.classList.remove('hidden');

    return new Promise((resolve) => {
      buttons.forEach((buttonDef, index) => {
        const button = this.createButton(
          buttonDef.label,
          buttonDef.testId ?? `modal-${buttonDef.id}`,
          index === 0 || Boolean(buttonDef.accent),
          () => {
            this.modal.classList.add('hidden');
            this.modalActions.replaceChildren();
            resolve(buttonDef.id);
          },
        );
        this.modalActions.append(button);
      });
      this.focusFirstAction(this.modalActions);
    });
  }

  private bindStaticActions(): void {
    this.require('[data-action="new-game"]').addEventListener('click', () => this.handlers.onNewGame());
    this.require('[data-action="continue"]').addEventListener('click', () => this.handlers.onContinue());
    this.require('[data-action="settings"]').addEventListener('click', () => this.handlers.onOpenSettings());
    this.require('[data-action="credits"]').addEventListener('click', () => this.handlers.onOpenCredits());
    this.require('[data-testid="hud-pause"]').addEventListener('click', () => this.handlers.onPauseToggle());
    this.require('[data-action="interact"]').addEventListener('click', () => this.handlers.onInteract());
    this.require('[data-testid="mobile-pause"]').addEventListener('click', () => this.handlers.onPauseToggle());
  }

  private bindMobileControls(): void {
    const directionButtons = this.mobileControls.querySelectorAll<HTMLButtonElement>('[data-direction]');
    directionButtons.forEach((button) => {
      const direction = button.dataset.direction as 'up' | 'down' | 'left' | 'right';
      const release = () => this.handlers.onDirectionEnd(direction);

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        this.handlers.onDirectionStart(direction);
      });
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
    });
  }

  private bindKeyboardGrid(container: HTMLElement): void {
    container.addEventListener('keydown', (event) => {
      const buttons = Array.from(
        container.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
      );
      if (buttons.length === 0) {
        return;
      }

      const activeElement = document.activeElement;
      const currentIndex = Math.max(
        0,
        buttons.findIndex((button) => button === activeElement),
      );

      const focusAt = (index: number): void => {
        const wrapped = (index + buttons.length) % buttons.length;
        buttons[wrapped].focus();
      };

      if (/^Digit[1-9]$/.test(event.code) || /^Numpad[1-9]$/.test(event.code)) {
        const requestedIndex = Number(event.code.at(-1)) - 1;
        const button = buttons[requestedIndex];
        if (button) {
          event.preventDefault();
          button.click();
        }
        return;
      }

      switch (event.code) {
        case 'ArrowUp':
        case 'ArrowLeft':
        case 'KeyW':
        case 'KeyA':
          event.preventDefault();
          focusAt(currentIndex - 1);
          break;
        case 'ArrowDown':
        case 'ArrowRight':
        case 'KeyS':
        case 'KeyD':
          event.preventDefault();
          focusAt(currentIndex + 1);
          break;
        case 'Home':
          event.preventDefault();
          focusAt(0);
          break;
        case 'End':
          event.preventDefault();
          focusAt(buttons.length - 1);
          break;
        case 'KeyZ':
          event.preventDefault();
          buttons[currentIndex].click();
          break;
      }
    });
  }

  private focusFirstAction(container: HTMLElement): void {
    window.requestAnimationFrame(() => {
      container.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    });
  }

  private createButton(
    label: string,
    testId: string,
    accent: boolean,
    onClick: () => void,
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = accent ? 'ui-button accent' : 'ui-button';
    button.dataset.testid = testId;
    button.textContent = label;
    button.addEventListener('click', onClick, { once: true });
    return button;
  }

  private waitForClick(button: HTMLButtonElement): Promise<void> {
    return new Promise((resolve) => {
      button.addEventListener(
        'click',
        () => {
          resolve();
        },
        { once: true },
      );
    });
  }

  private pretty(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private require<T extends HTMLElement = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) {
      throw new Error(`Missing UI element for selector ${selector}`);
    }

    return element;
  }
}
