# PHANTOM — a little life inside your phone

**🔗 Live demo:** [lucid-cm.github.io/phantom](https://lucid-cm.github.io/phantom/)

Vanilla HTML/CSS/JS. No dependencies, no network requests, no accounts. Works offline.

## Run in Termux
```sh
pkg update -y && pkg upgrade -y
pkg install -y nodejs unzip
cd ~ && unzip phantom.zip && cd phantom
npm test            # optional: 8 logic tests
npm run dev         # open http://localhost:5173 in Chrome on the same phone
# Ctrl+C to stop
```
Use `HOST=0.0.0.0 npm run dev` only to open it from another device on your Wi-Fi.
Opening `index.html` directly will not work (ES modules need http).

## Deploy (optional, static)
Any static host (Cloudflare Pages, GitHub Pages, Vercel). No build step; publish the folder root.

## How it works
- **Tap**: react (+2 xp, 4 s cooldown, 24 xp/day). **Double-tap**: special move. **Hold 0.5 s** or press *interact*: menu (pet, play, sleep/wake, unlocked expressions).
- **Moods** (calm, happy, curious, sleepy, sleeping, excited) come from timers set by real events: interactions, charging, connectivity, idle time, local night hours, low battery. Idle 45 s = sleepy, 2 min = sleeping (half those times from 23:00 to 06:00).
- **XP** has per-action cooldowns and daily caps, so rapid tapping earns nothing extra. Levels 1–10 (`level = floor(sqrt(xp/40)) + 1`). Unlocks: Honey eye L2, Squish L3, Ember eye L5, Spin L7, Moonlit eye L9.
- **Saved** in `localStorage` (key `phantom.v1`): xp, level, unlocks, look, settings, last interaction.
- **Settings**: sound (off by default, synthesized blips), reduced motion (follows your OS setting by default), ambient dust, reset with confirmation.

## Device awareness: honest limits
| Reading | Source | Notes |
|---|---|---|
| Battery % / charging | Battery Status API | Chrome on Android only. Shown as "not available" elsewhere. |
| Connectivity | `online`/`offline` events | Reports the device's link, not real internet reach. |
| Local time | Device clock | |
| Screen on/off, notifications, sensors | **Not implemented** | Needs a native Android wrapper. |

`src/device.js` is the only file that reads the device. A native provider would implement the same `{read(), on(fn)}` shape in a new file and be swapped in `src/app.js`.

## MVP now → production later
| MVP now | Production later |
|---|---|
| Tap/XP limits stored client-side (a user can edit localStorage) | Fine for a toy; server-side only if it ever becomes competitive |
| No service worker; offline because Termux serves it locally | Add a service worker + manifest for installable PWA hosting |
| Random blink/eye wander is cosmetic timing only | Same |

## Status
Verified in the build sandbox: logic tests pass, JS syntax checks pass. **Not verified**: rendering, animation feel, touch behavior, and the Battery API on your phone. Send screenshots (top, a reaction, progress sheet, settings) for the review round.

## v1.1 additions
- **Springs:** drag PHANTOM and it follows with lag; release and it springs home, squashing with speed. Flick it and it bounces off the edges. The halo trails behind. (Skipped when reduced motion is on.)
- **Pokes:** tapping the eye makes it blink and flinch; tapping the body makes it squish.
- **Stare contest:** hold a finger on the eye for 5 seconds.
- **Motes:** a mote drifts in every ~20 s; tap it before it fades.
- **Slingshot:** pull it 80+ px and let go.
- **Daily tasks:** 3 of 4 tasks, picked by date. Finish all three for +10 xp and a streak day.
- **Crying:** after 12+ hours away, a broken streak, or battery ≤10% (when the browser reports it). Three taps (or one pet) comfort it.
Not in v1.1: peekaboo, goodnight-tuck ritual, shake-to-dizzy.

## v1.2
- **Make it cry on demand:** hold the creature (or tap *interact*) and choose **scold**, or fling it into the walls 3 times in 4 seconds. Comfort it with 3 taps or one pet.

## Ship to GitHub (from Termux)
```sh
pkg install -y git gh
git config --global user.name "YOUR NAME"
git config --global user.email "you@example.com"
cd ~/phantom && git init -b main && git add . && git commit -m "PHANTOM v1.2"
gh auth login                                   # GitHub.com > HTTPS > login with a browser/token
gh repo create phantom --public --source=. --push
```
Free hosting: repo Settings > Pages > Deploy from branch `main` / root. Add a LICENSE before going public.

## v1.3 — installable PWA
Adds `manifest.webmanifest`, icons, and `sw.js` (network-first, offline fallback). On the hosted https link, Chrome menu > **Install app**. On localhost, the service worker also caches the shell so it opens without the dev server after one visit (verify on your device).

## v1.4 — share card
Progress sheet > **share card** renders a 1080×1350 PNG (creature in its current mood and eye colour, name, level, streak, link) and opens the Android share sheet, or downloads it if sharing files isn't supported. Set the creature's name in Settings. Change the footer link in `src/share.js` (`LINK`).

## v1.5 — rhythm memory
PHANTOM logs the hour of your first open each day (local only, rolling 14 days, cleared by reset). After 3 days it knows your usual hour: arrive within ±1 h for +6 xp and a warm greeting (once a day); arrive late, early, or after skipped days and it comments. It only reacts while the app is open; it cannot notify you. The progress sheet shows what it has learned.

## v1.6 — faces and movements
New faces: dizzy spiral, heart eye (petting), angry brow (poking the eye 3x), shock (hard wall hit), derp tongue, plus a mouth that appears for expressions. New tricks unlock by level (dance L3, flip L4, derp L5, glitch L8) and cycle on double-tap. Tapping 6x fast makes it dizzy. Shaking the phone makes it dizzy where the browser exposes motion sensors (Chrome on Android, over https/localhost); otherwise nothing happens.
