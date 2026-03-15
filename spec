Below is a complete, build-ready specification for the web game. It is written so a developer could implement the project from scratch without needing additional design decisions.

⸻

Jonah RPG — Full Technical & Design Specification

1. Project Overview

Title: Jonah: The Reluctant Prophet
Genre: Narrative exploration RPG with puzzles and Bible trivia
Platform: Web (desktop + mobile browser)
Engine: Phaser 3
Build system: Vite
Persistence: Browser LocalStorage
Estimated playtime: 30–60 minutes
Target audience: Church / homeschool audience with biblical familiarity
Theological framing: Reformed / biblical theology emphasis

The game retells the story of the Book of Jonah (chapters 1–4) through exploration, puzzle solving, and Bible trivia. Gameplay follows a linear progression with minimal branching.

The final scene ends with God’s unanswered question from Jonah 4:11.

⸻

2. Design Goals

2.1 Faithful Narrative

The story follows the biblical account closely.

The game should reinforce these themes:
	•	God’s sovereignty
	•	Human resistance to God
	•	God’s mercy toward the undeserving
	•	The tension of Jonah’s anger at divine compassion

2.2 Accessible Gameplay

Players should not need RPG experience. Mechanics remain simple.

Gameplay types:
	•	exploration
	•	conversation
	•	puzzles
	•	trivia

No combat system.

2.3 Small Technical Scope

Game length and mechanics are intentionally limited to ensure completion.

Constraints:
	•	6–8 maps
	•	<10 puzzles
	•	~36 trivia questions
	•	simple inventory

⸻

3. Visual Style

3.1 Graphics

Tile size: 32×32

Visual inspiration: DOS / EGA era RPG

Palette constraint: ~16 colors

Sprite complexity:
	•	2 frame walk cycles
	•	minimal animation

3.2 Required Sprites

Player
	•	Jonah (4 directions)

NPCs
	•	Messenger
	•	Dockmaster
	•	Merchant
	•	Sailor
	•	Ship Captain
	•	Traveler
	•	Caravan Guard
	•	Herald
	•	Nineveh Official
	•	Nineveh King

Environment tilesets
	•	port/dock
	•	ship deck
	•	organic fish interior
	•	desert road
	•	Nineveh city
	•	outside city hillside

UI
	•	dialogue box
	•	trivia box
	•	title screen

⸻

4. Controls

Desktop:

Action	Key
Move	Arrow keys / WASD
Interact	Enter / Space / Z
Cancel/Menu	Esc / X
Pause	Esc

Mobile:

On-screen buttons
	•	D-pad
	•	interact button
	•	pause button

Movement is tile-step based (grid movement).

⸻

5. Core Systems

5.1 Player Movement

Movement rules:
	•	Player occupies a grid tile.
	•	Input moves one tile at a time.
	•	Movement blocked by collision layer.
	•	Player facing direction updates even when blocked.

Movement speed target: ~150 ms per tile.

⸻

5.2 Interaction System

Interaction checks the tile in front of the player.

Possible interaction types:

Type	Behavior
NPC	start dialogue
object	run script
trigger tile	run event
exit tile	change map


⸻

5.3 Dialogue System

Dialogue format is JSON based.

Supported features:
	•	multi-page dialogue
	•	branching choices
	•	setting flags
	•	giving items
	•	triggering trivia
	•	triggering cutscenes

Example:

{
  "id": "messenger_call",
  "lines": [
    {
      "speaker": "Messenger",
      "text": "The word of the LORD came to Jonah."
    },
    {
      "speaker": "Messenger",
      "text": "Arise, go to Nineveh, that great city."
    },
    {
      "choice": {
        "prompt": "What will Jonah do?",
        "options": [
          { "text": "Go to Nineveh", "goto": "redirect_scene" },
          { "text": "Flee toward Tarshish", "goto": "dock_intro" }
        ]
      }
    }
  ]
}


⸻

5.4 Inventory System

Inventory holds key items only.

Items:

ID	Name
fare_token	Ship fare
water_flask	Traveler quest item

Inventory capacity: unlimited but expected <10.

Items appear in simple menu if inventory screen implemented.

⸻

5.5 Puzzle System

Two puzzle categories exist.

Fetch / Sequence puzzles

Progress tracked via quest flags.

Example flow:

quest_fare_step = 0
talk to merchant → step 1
deliver crate → step 2
return receipt → step 3
receive fare token

Switch puzzles

Defined by toggle states.

Example:

switches: A B C
initial: 0 0 0
target: 1 0 1

When solved → trigger event.

⸻

6. Trivia System

6.1 Question Pool

Questions stored in JSON.

Each question includes:

id
prompt
choices
answerIndex
difficulty
tags
hint
verseReference

Example:

{
"id": "q001",
"prompt": "Where was Jonah sent to preach?",
"choices": ["Jericho","Nineveh","Bethlehem","Tyre"],
"answerIndex": 1,
"difficulty": "easy",
"tags": ["jonah1"],
"hint": "It was a great city known for wickedness.",
"verseReference": "Jonah 1:2"
}


⸻

6.2 Difficulty Modes

Three difficulty settings.

Easy

Direct questions.

Normal

Inference required.

Hard

Theological interpretation required.

⸻

6.3 Attempt Rules

Each question allows 3 attempts.

After 3 incorrect answers:
	1.	Display hint
	2.	Reset attempts
	3.	Question repeats

⸻

6.4 Tag-Based Selection

Trivia gates define required tags.

Example gate:

tags: ["jonah1"]
questionsRequired: 1
difficulty: easy+

The system selects randomly from eligible questions.

⸻

7. World & Map Structure

Maps created in Tiled.

Format: .tmj

Collision layer: Collisions

Object layers:

Layer	Purpose
NPCs	NPC spawn points
Objects	interactables
Triggers	cutscene triggers
Exits	map transitions
Spawns	player spawn points


⸻

8. Map List

TITLE_SCREEN

Options:
	•	New Game
	•	Continue
	•	Settings
	•	Credits

⸻

JOPPA_DOCKS

Objectives:
	•	meet messenger
	•	obtain fare token
	•	board ship

Key NPCs:
	•	Messenger
	•	Dockmaster
	•	Merchant
	•	Sailor
	•	Captain

Puzzle: fare token quest.

Trivia gate: where Jonah was sent.

⸻

SHIP_DECK

Objectives:
	•	storm begins
	•	cargo puzzle
	•	casting lots trivia
	•	Jonah thrown overboard

Puzzle: cargo cleat switch puzzle.

⸻

FISH_INTERIOR

Objectives:
	•	solve sigil puzzle
	•	answer 2 trivia questions
	•	exit fish

Puzzle: luminescent tile puzzle.

⸻

COAST_ROAD

Objectives:
	•	help traveler
	•	obtain directions
	•	reach Nineveh

Puzzle: fetch water for traveler.

⸻

NINEVEH_GATE

Objectives:
	•	trivia gate
	•	enter city

NPC:
	•	guard

⸻

NINEVEH_CENTER

Objectives:
	•	deliver warning message
	•	talk to Herald
	•	talk to Official
	•	talk to King

Event: repentance cutscene.

⸻

EAST_OF_CITY

Objectives:
	•	shelter puzzle
	•	plant grows
	•	worm destroys plant
	•	wind blows
	•	final dialogue

Game ends.

⸻

9. Game State

Saved in LocalStorage.

Key:

jonah_rpg_save_v1

Example state:

{
"version":1,
"map":"JOPPA_DOCKS",
"spawn":"dock_start",
"player":{"x":10,"y":5,"facing":"S"},
"inventory":["fare_token"],
"flags":{
"heardCall":true,
"boardedShip":false,
"stormStarted":false,
"cargoSolved":false,
"thrownOverboard":false,
"fishSolved":false,
"fishReleased":false,
"enteredNineveh":false,
"deliveredMessage":false,
"ninevehRepented":false,
"endingSeen":false
},
"trivia":{
"answered":{},
"attemptsLeft":{}
}
}

Autosave triggers:
	•	map change
	•	puzzle solved
	•	trivia success
	•	cutscene completion

⸻

10. Folder Structure

/assets
  /sprites
  /tilesets
  /ui
  /audio

/maps
  joppa.tmj
  ship.tmj
  fish.tmj
  road.tmj
  nineveh_gate.tmj
  nineveh_center.tmj
  east_city.tmj

/data
  dialogue/
  puzzles/
  trivia/

/src
  main.ts
  scenes/
  systems/
  ui/


⸻

11. Phaser Scene Architecture

Scenes:

BootScene
Loads minimal assets.

PreloadScene
Loads all assets.

TitleScene
Title UI.

GameScene
Handles map rendering and player movement.

UIScene
Dialogue, menus, trivia overlays.

⸻

12. Event Flag System

Flags control progression.

Example flags:

heardCall
fareTokenObtained
boardedShip
stormStarted
cargoSolved
thrownOverboard
fishSolved
fishReleased
roadPassGranted
enteredNineveh
deliveredMessage
ninevehRepented
plantGrown
wormEvent
endingSeen


⸻

13. Ending

Final dialogue sequence:

Jonah complains about the plant.

God responds:

“Should I not pity Nineveh, that great city, in which there are more than 120,000 persons who do not know their right hand from their left…?”

Dialogue box remains briefly.

Screen fades.

Return to title.

No epilogue.

⸻

14. Acceptance Criteria

The game is complete when:
	•	Player can progress from title screen to ending.
	•	Save system works across reloads.
	•	All puzzles and trivia gates function.
	•	All maps load and transition correctly.
	•	Game playable on desktop and mobile.

⸻

15. Estimated Development Effort

Approximate effort for experienced developer:

Task	Time
Core engine	1–2 days
Dialogue system	1 day
Trivia system	1 day
Puzzle framework	1 day
Map integration	1 day
Content implementation	2 days
Polish / testing	1–2 days

Total: ~8–10 days development

⸻

If you’d like, I can also generate:

• the full 36-question trivia JSON
• starter Phaser project skeleton
• Tiled map templates
• pixel art prompt sheet for generating all sprites

which would make the project even faster to build.
