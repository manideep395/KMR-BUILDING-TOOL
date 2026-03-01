# KMR Innovators AI Construction Platform 🏗️✨

An AI-powered, full-stack Next-Generation Construction Intelligence & Optimization Platform designed to completely revolutionize the way construction projects are managed, quoted, and executed. 

This platform leverages the latest advancements in Large Language Models (Gemini/Groq) combined with a high-performance backend and an "Anti-Gravity Industrial Futurism" React frontend design.

## 🚀 Key Features

### 1. 🏗️ Automated Intelligent Estimation Engine
- Generates near-instantaneous, hyper-granular breakdowns of material quantities (Cement bags, Steel MT, Sand, Bricks).
- Dynamically calculates phase-by-phase Labor requirements based on project area and floors.
- Automatically adjusts pricing to a 3-point estimate model (Optimistic, Most Likely, Pessimistic) based on the user's city and the current market economy.

### 2. ⚠️ Predictive AI Risk Assessment
- Analyzes budget, timeline, labor availability, and compliance factors to assign real-time "Risk Scores."
- Generates actionable Early Warning alerts (Red, Orange, Yellow) before project delays occur.
- Suggests immediate mitigation strategies (e.g., "Shift labor from non-critical masonry to critical foundation work").

### 3. 🔍 Smart Vendor & AI Local Builder Search
- **AI Scoring System:** Evaluates contractor profiles against project specifics, delivering an objective 'Overall Score' combining Safety, Experience, Cost-Adherence, and Quality.
- **Find Nearby Builders:** Uses dynamic LLM capabilities to locate the most highly-rated, relevant local construction agencies based on your exact locality, without needing external map APIs!

### 4. ⚡ Critical Path & Resource Optimization
- **Gantt / CPA:** Instantly identifies the Critical Path of your building schedule, showing the exact sequencing of tasks.
- **Optimization Algorithms:** "Minimize Cost," "Minimize Time," or "Balanced" optimizations dynamically compress schedules, shift worker allocations, and calculate total cost/day savings mathematically. 

### 5. 🤖 Dedicated AI "Co-Pilots"
- **Blueprint AI:** A specialized chat interface ready to answer civil engineering queries and interpret structural design concepts in context.
- **AI Negotiator:** Input a quoted vendor price and your budget, and the AI will generate a professional, assertive counter-offer script based on industry-standard profit margins.

### 6. 🌿 Carbon Footprint & ESG Tracking
- Calculates total estimated CO2 emissions (in kg) based on cement and steel volume logic.
- Analyzes the footprint against regional averages, and outputs the exact number of trees required to offset the impact.
- Provides actionable "Green Building" alternatives (e.g., Fly Ash Bricks) dynamically.

### 7. 📈 Comprehensive ROI & Reporting
- Automatically builds projected Cashflow, 5-year/10-year IRR, and Breakeven Point calculations for commercial investors.
- A one-click PDF Report generator packages all the intricate charts, scores, warnings, and schedules into an executive summary ready for investors or banks.

### 8. 🌐 "Anti-Gravity" Glassmorphism UI
- Visually stunning "Industrial Futurism" design featuring a dark-steel scheme punctuated by glowing Amber and Cyan elements.
- Fluid micro-interactions (staggered slip-ins, pulse glows) and 3D architectural canvas art.
- Integrated Light-Mode & Dark-Mode toggle for high-contrast visibility on real-world construction sites.
- Multi-lingual switch instantly toggling conversational elements to Hindi.


## 🛠️ Technology Stack

**Frontend:**
- React (Vite)
- Zustand (Global State Management)
- Recharts (Data Visualization)
- Lucide React (Icons)
- React Router DOM
- Custom Vanilla CSS (Design System)

**Backend:**
- Python 3.13
- FastAPI (High-performance API routing)
- Uvicorn (ASGI server)
- Pydantic (Data validation and schemas)
- Google Generative AI & Groq (LLM integrations)

## ⚙️ Getting Started

### Prerequisites
- Node.js & npm (for the frontend)
- Python 3.9+ (for the backend)
- API Keys: 
  - `GEMINI_API_KEY`
  - `GROQ_API_KEY` (Fallback)

### 1. Clone the repository
```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Backend Setup
Navigate to the backend directory, create a virtual environment, and install dependencies.
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder and add your keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

Start the FastAPI server:
```bash
uvicorn main:app --reload
```
The backend API will run on `http://localhost:8000`.

### 3. Frontend Setup
Navigate to the frontend directory and install dependencies.
```bash
cd ../frontend
npm install
```
The frontend will run on 'http://localhost:3000'.
Start the Vite development server:

npm run dev

## 🤝 Contribution
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📜 License
This project is proprietary software belonging to **KMR Innovators**. All rights reserved.
