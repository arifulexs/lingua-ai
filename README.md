# 🦜 LinguaAI — Advanced English Tutor

> **AI-Powered Language Learning Platform**  
> Master English with interactive lessons, AI-driven feedback, and gamified learning.

![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)
![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)

🌐 **[Live Demo](https://lingua-cnrgxa1p8-arifulexs-projects.vercel.app/)** | 🚀 **[Deploy on Vercel](#deployment)**

---

## 📖 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [How to Use](#how-to-use)
- [Deployment](#deployment)
- [Gemini API Integration](#gemini-api-integration)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## ✨ Features

### 🏠 **Dashboard**
- **Real-time Stats**: XP tracking, day streak, badges, saved words
- **Daily Goal**: Progress toward your daily learning target (50 XP)
- **Word of the Day**: Learn a new word every day with pronunciation and examples
- **Idiom of the Day**: Master English idioms with context and usage
- **Achievement System**: Unlock 17+ badges as you progress
- **Level System**: Advance levels by earning XP (100 XP per level)

### 📖 **Word Explorer**
- Search and lookup any English word
- Get comprehensive word breakdown:
  - Definition & pronunciation (IPA)
  - Part of speech
  - 3 synonyms & 2 antonyms
  - Example sentences
  - Quiz yourself on the word
- Text-to-speech pronunciation practice
- Save words to your vocabulary bank

### 📝 **Grammar Drills**
- **8 Exercise Types**:
  - Fill in the Blank
  - Find the Error
  - Tense Correction
  - Word Order
  - Article Usage (a/an/the)
  - Preposition Choice
  - Conditional Sentences
  - Passive Voice
- **3 Difficulty Levels**: Beginner, Intermediate, Advanced
- Drill streak counter with heart rewards (3 correct = 1 ❤️)
- Detailed explanations for each answer
- Instant XP rewards

### 💬 **Roleplay Scenarios**
- **14+ Real-life Scenarios**:
  - Ordering Coffee, Job Interview, Small Talk
  - Doctor Visit, Hotel Check-in, Restaurant Ordering
  - Airport Check-in, Bank Visit, Phone Calls
  - University Meetings, Product Returns, Taxi Rides
  - Professional Networking, Salary Negotiations
  - Customer Service Issues
- AI conversational partner responds naturally
- Suggested phrases to help during roleplay
- Performance scoring (Fluency, Vocabulary, Grammar, Naturalness)
- XP rewards for successful conversations

### ✍️ **Writing Lab**
- AI-powered writing analysis
- Two input methods:
  - Type or paste text directly
  - Upload handwriting images (JPG, PNG, WEBP, max 2MB)
- Comprehensive feedback including:
  - Writing score (0-100)
  - Corrected version of your text
  - Specific improvement tips (3 suggestions)
  - Strengths highlighting
  - OCR text detection for handwritten images
- XP rewards based on score

### 💡 **Idiom Trainer**
- Learn English idioms by category:
  - General Idioms
  - Business & Work
  - Emotions & Feelings
  - Time & Speed
  - Success & Failure
  - Money & Finance
  - Nature & Weather
- 3 difficulty levels
- Each idiom includes:
  - Meaning & usage context
  - Example sentences
  - Historical origin/context
  - Quiz to test understanding
- Track idioms learned

### ⚡ **Speed Challenge**
- **60-second grammar sprint**
- **3 Difficulty Modes**: Easy, Medium, Hard
- Multiple-choice format
- Real-time scoring and streak tracking
- XP rewards: +5 XP per correct answer
- Best score tracking
- Unlock Speed Demon & Lightning badges

### 📚 **Vocabulary Bank**
- Save and organize learned words
- Quick flashcard-style review
- Quiz yourself on saved words
- Word definitions and examples
- Add/remove words easily
- Clear entire vocabulary bank

### 💖 **Heart System**
- **5 Hearts** = Learning attempts
- Lose 1 heart per wrong answer
- **Auto-Refill**: 1 heart every 60 seconds
- **Heart Recovery Drills**: Get drills correct to earn hearts back
- **Drill Streak Rewards**: 3 consecutive correct drills = 1 heart
- Quick recovery modal when out of hearts

### 🎮 **Gamification**
- **XP System**: Earn points for activities
- **Level Progression**: 100 XP per level
- **Daily Goals**: 50 XP target (resets daily)
- **17+ Badges** to unlock:
  - First Word, Collector, Bookworm
  - On Fire, Electric, Scholar, Champion
  - Grammarian, Conversationalist, Actor
  - Perfect Writer, Speed Demon, Lightning
  - Idiom Master, Heart Hero
- **Streak System**: Keep your daily streak alive
- **Confetti Animations**: Celebrate achievements

### 🌙 **UI Features**
- **Light/Dark Mode**: Toggle theme preference
- **English Variants**: US or UK English
- **Slang Mode**: Include casual language in responses
- **Responsive Design**: Works on desktop, tablet, mobile
- **Smooth Animations**: Polished user experience
- **Loading Indicators**: Clear feedback during API calls

---

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- **For deployment**: Gemini API key

### Local Setup

1. **Clone the Repository**
```bash
git clone https://github.com/arifulexs/lingua-ai.git
cd lingua-ai
```

2. **Open in Browser**
   - Simple method: Double-click `index.html`
   - Better: Use a local server
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (http-server)
   npx http-server
   
   # PHP
   php -S localhost:8000
   ```
   Then visit: `http://localhost:8000`

3. **Note**: Features requiring Gemini API (Word Explorer, Grammar Drills, Roleplay, Writing Lab, Idioms, Speed Challenge) will show demo content until deployed to Vercel with API key.

---

## 📁 Project Structure

```
lingua-ai/
├── index.html                 # Main HTML structure & layout
├── app.js                     # Core application logic (71KB)
│   ├── Config & Constants     # API endpoints, XP values
│   ├── State Management       # User progress tracking
│   ├── UI Updates             # DOM manipulation
│   ├── API Bridge             # Gemini API integration
│   ├── Word Explorer          # Vocabulary features
│   ├── Grammar Drills         # Exercise generation
│   ├── Roleplay               # Conversational AI
│   ├── Writing Lab            # Text analysis
│   ├── Idiom Trainer          # Idiom learning
│   ├── Speed Challenge        # Timed exercises
│   ├── Vocab Bank             # Saved words management
│   ├── TTS & Sound Effects    # Audio features
│   └── Utility Functions      # Helpers
├── style.css                  # Main styles (34KB)
├── style-additions.css        # Additional styles (15KB)
├── vercel.json                # Vercel deployment config
├── api/
│   └── gemini-proxy.js        # Gemini API endpoint (create this)
├── package.json               # Node dependencies (create this)
└── README.md                  # This file
```

### Key File Sizes
- `app.js`: 71.5 KB (Core logic)
- `index.html`: 23.8 KB (UI structure)
- `style.css`: 34.0 KB (Main styling)
- `style-additions.css`: 15.2 KB (Extra styles)

---

## 💡 How to Use

### 1️⃣ **Dashboard - Start Here**
- View your current XP, level, streak, and badges
- Check daily learning goal progress
- Learn today's word and idiom
- See all achievements

**Tips:**
- Focus on reaching 50 XP daily goal
- Maintain your streak for consistency
- Click badge names to see unlock conditions

### 2️⃣ **Word Explorer**
1. Click "Word Explorer" in sidebar
2. Type any English word in the search box
3. Click "Explore" or press Enter
4. Get comprehensive word breakdown
5. Use "Hear It" button to listen to pronunciation
6. Take the quiz to test your knowledge
7. Click "Save to Vocab" to add to your bank

**Pro Tips:**
- Check your vocab bank regularly for review
- Learn synonyms and antonyms for richer vocabulary
- Use pronunciation practice daily

### 3️⃣ **Grammar Drills**
1. Select exercise type from dropdown (8 types)
2. Choose difficulty level (Beginner → Advanced)
3. Click "New Question"
4. Read the question carefully
5. Select your answer
6. Read the explanation
7. Click "Next Question"

**Pro Tips:**
- Start with "Fill in the Blank" if new
- Progress to advanced exercises gradually
- Get 3 correct in a row to earn a heart back
- Pay attention to explanations to improve

### 4️⃣ **Roleplay Scenarios**
1. Click "Roleplay" in sidebar
2. Choose a scenario from 14+ options
3. Click "Start Scenario"
4. Type your response naturally
5. AI partner responds in conversation
6. Use "suggestion pills" for phrase ideas
7. Click flag icon to end and get scored

**Pro Tips:**
- Try different scenarios for variety
- Use suggestions to improve phrasing
- Aim for natural, conversational responses
- Higher scores = more XP rewards

### 5️⃣ **Writing Lab**
1. Either upload a handwriting image OR type text
2. Click "Analyze My Writing"
3. Get instant feedback:
   - Writing score
   - Corrected version
   - 3 improvement tips
   - Strengths highlighted
4. Use feedback to improve writing

**Pro Tips:**
- For images: Clear, well-lit handwriting works best
- Get 80+ score for maximum XP
- Practice regularly to improve scores

### 6️⃣ **Idiom Trainer**
1. Select idiom category and difficulty
2. Click "New Idiom"
3. Read the meaning and example
4. Check the origin/context
5. Answer the quiz question
6. Click "Next Idiom" for more

**Pro Tips:**
- Learn idioms in categories you need
- Focus on business idioms if learning for work
- Review examples carefully

### 7️⃣ **Speed Challenge**
1. Choose difficulty: Easy 🟢 Medium 🟡 Hard 🔴
2. Click "Start Sprint!"
3. Answer grammar questions as fast as possible
4. You have 60 seconds
5. Rack up your best streak
6. Get instant results with XP earned

**Pro Tips:**
- Start with "Easy" mode
- Try to beat your best score
- 20 correct = "Lightning" badge unlocked
- Higher difficulty = same points but more challenge

### 8️⃣ **Vocabulary Bank**
1. Click "My Vocab" in sidebar
2. See all your saved words
3. Use "Quiz Me" to test knowledge
4. "Clear All" to start fresh

**Pro Tips:**
- Regularly review saved words
- Quiz yourself weekly
- Use for spaced repetition learning

### 9️⃣ **Daily Goals & Streaks**
- 🎯 **Daily Goal**: Earn 50 XP per day
- 🔥 **Streak**: Keep logging in daily
- 💖 **Hearts**: Recover with correct drills
- 🏅 **Badges**: Unlock by hitting milestones

---

## 🌐 Deployment

### **Option 1: Deploy to Vercel (Recommended)**

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial LinguaAI commit"
git push origin main
```

#### Step 2: Create Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

#### Step 3: Set Up API Route
Create `api/gemini-proxy.js`:

```javascript
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { prompt, systemInstruction } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          systemInstruction: {
            parts: { text: systemInstruction }
          }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    res.status(200).json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### Step 4: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select `lingua-ai`
5. Click "Deploy"

#### Step 5: Add Environment Variable
1. Go to project Settings → Environment Variables
2. Add:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your API key from Step 2
3. Save and redeploy

#### Step 6: Update Vercel Config

Update `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    { "src": "api/**/*.js", "use": "@vercel/node" },
    { "src": "index.html", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

---

### **Option 2: Deploy to Netlify**

1. Push to GitHub (same as above)
2. Go to [netlify.com](https://netlify.com)
3. Click "Import an existing project"
4. Select your GitHub repo
5. Set environment variable: `GEMINI_API_KEY`
6. Click "Deploy"

---

### **Option 3: Deploy to GitHub Pages (Limited)**

For static hosting (no API):
1. Go to repository Settings → Pages
2. Select "Deploy from branch"
3. Choose "main" branch
4. Click Save

**Note**: API features won't work without backend.

---

## 🔌 Gemini API Integration

### What It Powers
- 🔤 Word definitions & examples
- 📝 Grammar drill generation
- 💬 Roleplay AI conversations
- ✍️ Writing analysis & feedback
- ���� Idiom learning
- ⚡ Speed challenge questions

### Free Tier Limits
- **60 requests/minute**
- **10,000 requests/day**
- Perfect for personal use

### Paid Plans
- Upgrade at [Google Cloud Console](https://console.cloud.google.com)
- Pay-as-you-go pricing
- Higher rate limits

### Troubleshooting API Issues

| Issue | Solution |
|-------|----------|
| "API not connected" | Check GEMINI_API_KEY in Vercel env vars |
| "Rate limit exceeded" | App auto-retries with exponential backoff |
| "Empty response" | Check API key is valid in Google AI Studio |
| CORS errors | Ensure api route is at `/api/gemini-proxy.js` |

---

## 🎨 Customization

### Change Colors
Edit `style.css`:
```css
:root {
  --primary: #1CB0F6;      /* Blue buttons */
  --green: #58CC02;        /* Success color */
  --orange: #FF9600;       /* Warning color */
  --red: #FF4B4B;          /* Error color */
  /* ... more colors ... */
}
```

### Adjust XP Values
Edit `app.js`:
```javascript
config: {
  DAILY_GOAL_XP: 50,        // Daily target
  XP_PER_LEVEL: 100,        // XP needed per level
  SPEED_XP_PER_Q: 5,        // Points per speed question
  // ... more config ...
}
```

### Add New Roleplay Scenarios
Edit `index.html`, find scenario-cards section:
```html
<button class="scenario-card" data-scenario="your scenario description">
  <span class="scenario-emoji">🎯</span>
  <span>Scenario Name</span>
</button>
```

### Modify Heart Regen Time
Edit `app.js`:
```javascript
HEART_REGEN_MS: 60 * 1000,  // 1 minute (change to your preference)
```

---

## 🐛 Troubleshooting

### Common Issues

**1. API features not working?**
- Check if deployed to Vercel with API route
- Verify GEMINI_API_KEY environment variable is set
- Restart Vercel deployment

**2. Words not saving to vocabulary?**
- Check browser's localStorage is enabled
- Try clearing browser cache
- Check browser developer console for errors

**3. Audio/TTS not playing?**
- Enable browser permissions for audio
- Check if using HTTPS (required for TTS)
- Try different browser

**4. Progress not saving?**
- Check localStorage quota (usually 5-10MB)
- Clear cache and reload
- Sign out and back in if using sync

**5. Images not uploading?**
- Max file size: 2MB
- Supported formats: JPG, PNG, WEBP
- Check internet connection
- Try different image format

### Debug Mode
Open browser console (F12) to see:
- API responses
- State changes
- Error messages
- Performance metrics

---

## 🤝 Contributing

We welcome contributions! Here's how:

### Report Bugs
1. Go to [Issues](https://github.com/arifulexs/lingua-ai/issues)
2. Click "New Issue"
3. Describe the bug with steps to reproduce
4. Include screenshots if helpful

### Suggest Features
- Open an issue with "Feature: " prefix
- Describe the use case
- Explain expected behavior

### Submit Code
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Development Guidelines
- Use clear variable names
- Add comments for complex logic
- Test features before submitting
- Keep styles in `style.css`
- Follow existing code structure

---

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| **Load Time** | ~2 seconds |
| **File Size** | 47 KB gzipped |
| **API Response** | ~1-2 seconds |
| **Storage Used** | ~500 KB (localStorage) |
| **Browser Support** | All modern browsers |

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- **Google Gemini API** for powerful AI models
- **Vercel** for seamless deployment
- **Font Awesome** for beautiful icons
- **Google Fonts** for typography

---

## 📞 Support & Contact

- 💬 **Issues**: [GitHub Issues](https://github.com/arifulexs/lingua-ai/issues)
- 📧 **Email**: Contact via GitHub profile
- 🌐 **Live Demo**: [https://lingua-ai-ten-eta.vercel.app](https://lingua-ai-ten-eta.vercel.app)

---

## 🎯 Roadmap

### Upcoming Features
- [ ] User authentication & cloud sync
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Speech recognition for pronunciation
- [ ] Leaderboards & challenges
- [ ] Content in other languages
- [ ] Adaptive difficulty system
- [ ] Teacher dashboard

---

## 📈 Learning Path

**Beginner (Week 1-2)**
- Complete Word Explorer tutorials
- Learn 10+ new words
- Try all Grammar Drill types
- Start one Roleplay scenario

**Intermediate (Week 3-4)**
- Save 50+ words to vocab
- Complete daily challenges
- Try Speed Challenge
- Maintain 7+ day streak

**Advanced (Week 5+)**
- Master idiom categories
- Score 80+ on writing
- Complete all roleplay scenarios
- Unlock all badges

---

**Happy Learning! 🚀 Keep your streak alive and master English with LinguaAI!**
