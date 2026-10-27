# Loophole — The Fractured Hour

**[Play in your browser](https://yongcheng123.github.io/loophole/)** — no installation or sign-in required.

A complete, self-contained browser RPG, built with HTML, CSS and Canvas. Open `dist/index.html` in a modern browser, or serve `dist` with any static web server. No install or build is required. Fonts have local fallbacks; the game itself works offline.

## Play

- WASD / arrows: eight-direction movement
- E: interact with a nearby landmark
- M: map
- Esc: menu / back
- Phone / touch screen: automatically shows a large eight-direction pad; tap to step or hold to walk
- Touch Interact, Map, and Menu buttons sit next to the pad
- Portrait and landscape layouts keep controls outside the map and health visible in battle
- Lifting your finger, switching apps, or opening menus stops held movement
- Mouse: all menus; keyboard movement remains available on desktop

Choose any two of eight classes. Choosing one twice grants 30% stronger class skills. Recover three seals and defeat the Hourkeeper to finish the story. Explore four regions, open four caches, buy supplies, craft permanent gear, and discover seven enemies. Roads are safe, and the refuge offers unlimited free healing. Defeat preserves progression and returns you to the refuge with a small gold penalty.

Save from the game menu; rest and guardian victories autosave. Save data stays in the current browser. Export/import JSON backups to move between browsers or keep a copy. The browser cannot close an arbitrary tab, so Exit displays a safe-to-close screen.

All art is original procedural canvas pixel art. Optional sound effects are synthesized with Web Audio. No external gameplay libraries, trackers, or accounts.

## Level 5 ultimates

Character Leveling offers two ultimate abilities per class at level 5. Choose one per distinct class; choices can be changed between battles and save automatically. Each selected ultimate costs aether, takes a turn, and can be used once per battle. Duplicate-class specialists receive a 30% ultimate bonus. Older saves remain compatible and unlock their choices at level 5.

## Run locally

Open `dist/index.html` directly, or serve it over HTTP:

```sh
python3 -m http.server 4173 --directory dist
```

Then visit http://localhost:4173.

## Tests

With Node.js installed, run the engine tests from the repository root:

```sh
node --check dist/game.js
node tests/game.test.cjs
```

## Hosting

GitHub Pages publishes the `dist` directory. Changes to game files on `main` run the engine tests and deploy automatically through `.github/workflows/pages.yml`. Browser saves are specific to the site address; use Export/Import backup to transfer a save from another hosted copy.
