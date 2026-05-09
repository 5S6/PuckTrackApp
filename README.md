# PuckTrack

> A free, lightweight NHL companion app for fans who live and breathe hockey.

PuckTrack puts live NHL stats, standings, and playoff brackets in your pocket—no login, no ads, no nonsense. Pick your team and stay connected to every goal, assist, and playoff moment that matters.

[Get Started](#getting-started) • [Open Source](LICENSE)

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **Live Game Scores** | Real-time updates for your team's games |
| **Full League Schedule** | Browse every game, every day of the season |
| **Player Stats Leaderboards** | Top scorers: goals, assists, points, save %, GAA |
| **Division Standings** | Track standings with playoff position indicators |
| **Live Playoff Bracket** | Watch the postseason unfold series-by-series |
| **32-Team Picker** | Switch between teams anytime, no commitment |
| **Dark Theme** | Designed for comfortable late-night viewing |
| **Privacy First** | No login, no tracking, no ads, no friction |

---

## 🎮 Experience

Built for hockey fans who want quick access to what matters. Whether you're checking the score between periods or tracking playoff races, everything you need is just a tap away.

### Core Navigation

```
┌──────────────────────────────────────────────────────────┐
│  Score (Live updates & play-by-play)                     │
│  Schedule (Browse full season by day)                    │
│  Team (Pick from 32 NHL franchises)                      │
│  Stats (Top players across 5 categories)                 │
│  Standings (Division races + playoff spots)              │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 What You'll Find

### Real-Time Game Updates

When your team plays:
- **Live score ticker** with period-by-period breakdown
- **Goal notifications** showing scorer, assists, and power-play strength
- **Shots on goal** tracking for both teams in real time
- **Game status** (period, time remaining, or final)

### Division & Standings

Never miss a playoff push with:
- **Division-level standings** updated throughout the season
- **Playoff seed indicators** showing current seeding
- **Games remaining** to track time crunch situations
- **Head-to-head records** between division rivals

### Player Leaderboards

Track stats across 5 categories:
- **Goals** — Most goals scored
- **Assists** — Most assists recorded  
- **Points** — Total goals + assists
- **Save %** — Goaltender efficiency
- **GAA** — Goaltender goals-against average

---

## 🚀 Tech Stack

- **React Native** + **Expo Router** — Native performance on iOS & Android
- **TypeScript** — Type-safe development end-to-end
- **Zustand** — Lightweight, fast state management
- **NHL Web API** — Official league data, real-time
- **Dark-first design system** — Crafted for immersion

All data flows directly from the [NHL Web API](https://api-web.nhle.com/v1). No caching layers, no delays—just live league information.

---

## 🛠️ Getting Started

### Prerequisites

- iOS 13.4+ or Android 9+
- [Expo Go](https://expo.dev/client) app installed on your phone

### Run Locally

```bash
# Install dependencies
npm install

# Start the dev server
npm start

# Scan the QR code with Expo Go
# (iOS: use Camera app; Android: open Expo Go and tap scan)
```

To build and run on simulators/devices:

```bash
npm run ios      # iOS simulator or connected device
npm run android  # Android emulator or connected device
npm run web      # Web preview in browser
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── IceBackground.tsx    # Team-colored gradient backdrop
│   └── TeamLogo.tsx         # Official NHL team logos
├── services/
│   └── nhlService.ts        # NHL Stats API integration
├── store/
│   └── appStore.ts          # Zustand application state
├── theme/
│   └── index.ts             # Design tokens & team colors
└── types/
    └── nhl.ts               # API response types

app/                         # Expo Router file-based routing
├── (tabs)/
│   ├── index.tsx            # Score view (today's game)
│   ├── schedule.tsx         # Full season schedule
│   ├── team.tsx             # 32-team picker
│   ├── stats.tsx            # Leaderboards
│   └── settings.tsx         # App settings
└── _layout.tsx              # Root layout & navigation
```

---

## 🔄 How It Works

1. **Select your team** when first opening the app
2. **Live polling** syncs game state every 30 seconds during live play
3. **Persistent preference** remembers your team next time
4. **Real-time stats** show scores, goals, assists as they happen
5. **Full league context** is always available (schedule, standings, stats)

---

## 🤝 Contributing

Found a bug or have an idea? We'd love your help.

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-idea`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature/your-idea`
5. Open a Pull Request

---

## 📜 License

Released under the [MIT License](LICENSE).

---

## 🙏 Credits

Built with [Expo](https://expo.dev/), powered by the [NHL Web API](https://api-web.nhle.com/v1).

---

*Not affiliated with the NHL or NHLPA. Made for hockey fans, by a hockey fan.*
