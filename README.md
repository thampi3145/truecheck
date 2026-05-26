# TrueCheck — AI Product Authenticity Checker

Detects fake/counterfeit products on Amazon India, Flipkart, Myntra & Ajio.

## Tech Stack (100% Free, No Licence Cost)

| Part | Tool | Cost |
|------|------|------|
| Mobile App | React Native + Expo | Free |
| Backend API | Node.js + Express | Free |
| AI Analysis | Google Gemini 1.5 Flash | Free (15 req/min) |
| Scraping | Playwright + Cheerio | Free / Open Source |
| Backend Hosting | Render.com | Free |
| App Distribution | Expo Go (testing) / EAS (stores) | Free |

---

## Step 1 — Get Your Free Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key — you'll need it in Step 3

---

## Step 2 — Set Up the Backend

```bash
# Clone or unzip this project, then:
cd truecheck/backend

# Install dependencies
npm install

# Install Playwright browser (Chromium for scraping)
npx playwright install chromium

# Copy the env file
cp .env.example .env
```

Now open `.env` and paste your Gemini API key:
```
GEMINI_API_KEY=your_actual_key_here
```

Start the backend:
```bash
npm run dev
```

Test it works:
```
GET http://localhost:3001/health
```
You should see: `{"status":"ok","geminiConfigured":true,...}`

---

## Step 3 — Set Up the Mobile App

```bash
cd truecheck   # (root folder, not backend)

# Install dependencies
npm install

# Install Expo CLI
npm install -g expo-cli
```

Open `utils/theme.ts` and update the API URL:
```ts
export const API_BASE = 'http://YOUR_COMPUTER_IP:3001';
// Example: 'http://192.168.1.10:3001'
// Find your IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
```

Start the app:
```bash
npm start
# or
expo start
```

Scan the QR code with:
- **Android**: Expo Go app (install from Play Store)
- **iPhone**: Camera app → scan QR

---

## Step 4 — Deploy Backend to Render.com (Free Hosting)

1. Push your project to GitHub
2. Go to https://render.com → **New Web Service**
3. Connect your GitHub repo
4. Set **Root Directory** to `backend`
5. Set **Build Command**: `npm install && npx playwright install chromium`
6. Set **Start Command**: `npm start`
7. Add **Environment Variable**: `GEMINI_API_KEY` = your key
8. Choose **Free** plan → Click **Deploy**

Once deployed, copy your Render URL (e.g. `https://truecheck-api.onrender.com`)

Update `utils/theme.ts`:
```ts
export const API_BASE = 'https://truecheck-api.onrender.com';
```

---

## Step 5 — Build the App for Distribution

### For testing (no app store needed):
```bash
npm start
# Share QR code — anyone with Expo Go can use it
```

### For Android APK (free):
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```
This gives you a `.apk` file you can share directly or upload to Play Store.

### For iOS (requires Apple Developer account = $99/year):
```bash
eas build --platform ios
```

---

## Features

- Paste any product URL → AI analysis in ~15 seconds
- Upload screenshot → AI reads and analyzes it
- Authenticity score 0–100 with 6 trust signals
- Seller credibility, fake review detection, price anomaly
- Warranty & return policy check
- AI chat assistant for follow-up questions
- Full scan history saved on device
- Works on Android + iPhone + any phone with Expo Go

---

## Project Structure

```
truecheck/
├── App.tsx                    # Navigation setup
├── screens/
│   ├── ScanScreen.tsx         # URL input + image upload
│   ├── ResultScreen.tsx       # Analysis results
│   ├── HistoryScreen.tsx      # Past scans
│   └── ChatScreen.tsx         # AI conversation
├── components/
│   ├── ScoreRing.tsx          # Animated score circle
│   ├── SignalCard.tsx         # Trust signal row
│   ├── LoadingOverlay.tsx     # Analysis loading screen
│   └── HistoryItem.tsx        # History list row
├── hooks/
│   └── useAnalysis.ts         # Analysis state management
├── utils/
│   ├── api.ts                 # API calls + types
│   └── theme.ts               # Colors, spacing, config
└── backend/
    ├── server.js              # Express server entry
    ├── routes/index.js        # API endpoints
    ├── services/
    │   ├── scraper.js         # Playwright scraper
    │   └── gemini.js          # Gemini AI service
    └── utils/
        ├── cache.js           # Response caching
        └── logger.js          # Logging
```

---

## Troubleshooting

**"GEMINI_API_KEY not set"** → Add your key to `backend/.env`

**"Product page took too long"** → Platform may be blocking. Try again or use screenshot upload instead.

**App can't connect to backend** → Make sure both are on same WiFi. Use your computer's local IP, not `localhost`.

**Playwright install fails on Render** → The build command `npx playwright install chromium` handles this automatically.
