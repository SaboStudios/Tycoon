# Guide: Create, Deploy & Add Your Agent to Tycoon

This guide walks you through: **creating** an agent (using the built-in example), **deploying** it so it has a public URL, and **adding it to a game** so it plays for you in Tycoon.

---

## Part 1 — Create your agent

The Tycoon repo includes a ready-to-use agent in the `tycoon-celo-agent` folder. You can use it as-is or change its logic later.

### 1.1 Open the agent project

From the Tycoon repo root:

```bash
cd tycoon-celo-agent
```

### 1.2 Install dependencies

```bash
npm install
```

### 1.3 Run it locally (to test)

```bash
npm start
```

You should see something like: **Tycoon Celo Agent listening on port 4077**.

The agent exposes one endpoint: **`POST /decision`**. Tycoon sends the game situation there and your agent replies with an action (`buy`, `skip`, `accept`, `decline`, `build`, `wait`, etc.).

- **Default behavior:** Built-in rule-based logic (no API keys). You can later replace `src/decisionLogic.js` with your own or an LLM.
- **Port:** 4077 by default. Override with `PORT=3001 npm start` if needed.

Keep this terminal open while testing. For production you’ll deploy this same app so it has a public URL.

---

## Part 2 — Get a public URL (so Tycoon can call your agent)

Tycoon’s server needs to reach your agent over the internet. You have two options.

### Option A — Quick test: use a tunnel (ngrok)

Good for trying things on your machine without deploying.

1. **Sign up and install ngrok**  
   [ngrok.com](https://ngrok.com) → sign up (free) → install (e.g. `npm install -g ngrok` or download from the site).

2. **Start your agent** (if not already running):
   ```bash
   cd tycoon-celo-agent
   npm start
   ```

3. **In a second terminal, start the tunnel:**
   ```bash
   ngrok http 4077
   ```

4. **Copy the HTTPS URL** ngrok shows (e.g. `https://abc123.ngrok-free.app`).  
   This is your agent’s “website address”. Use it in Part 3.

When you stop ngrok or the agent, this URL stops working. Next time you run ngrok you may get a new URL.

---

### Option B — Deploy for a stable URL (Render example)

Use this when you want a permanent URL and don’t want to keep your laptop on.

1. **Push the agent code to GitHub**  
   Either fork the Tycoon repo or copy the `tycoon-celo-agent` folder into your own repo and push.

2. **Create a Web Service on Render**  
   - Go to [render.com](https://render.com) and sign up / log in.  
   - **New → Web Service**.  
   - Connect your GitHub repo (the one that contains `tycoon-celo-agent`).  
   - **Root directory:** set to `tycoon-celo-agent` (or the path where `package.json` and `src/` live).  
   - **Build command:** `npm install`  
   - **Start command:** `npm start`  
   - **Instance type:** Free is enough to start.

3. **Set the port Render will use**  
   Render gives a `PORT` env var. The agent already uses `process.env.PORT || 4077`, so it will work. No extra config needed.

4. **Deploy**  
   Click **Create Web Service**. After the first deploy, Render will show a URL like:

   `https://tycoon-celo-agent-xxxx.onrender.com`

   That is your agent’s **website address**. Use it in Part 3.

**Other hosts (Railway, Fly.io, etc.):** Same idea: create a web service, point it at your agent repo, set build to `npm install` and start to `npm start`, and use the URL they give you.

---

## Part 3 — Add your agent in Tycoon (“My Agents”)

1. **Open Tycoon** in the browser and **log in** (wallet or guest auth that supports “My Agents”).

2. **Go to “My Agents”**  
   (e.g. from the main nav or `/agents`.)

3. **Create an agent**  
   - Click **Add agent** (or equivalent).  
   - **Name:** e.g. `My Tycoon Bot`.  
   - **Website address (callback URL):**  
     - If you used **ngrok:** paste the HTTPS URL (e.g. `https://abc123.ngrok-free.app`).  
     - If you **deployed:** paste your service URL (e.g. `https://tycoon-celo-agent-xxxx.onrender.com`).  
   - Do **not** add `/decision` at the end — Tycoon adds that when it calls your agent.  
   - Save.

4. **Check the list**  
   Your agent should appear in “My Agents” with the name and URL you set.

---

## Part 4 — Add your agent to a game (“My agent plays for me”)

1. **Start or join a game**  
   Create a new game (vs AI or vs friends) or join an existing one. You must be in the game as a player.

2. **Turn on “My agent plays for me”**  
   - On **desktop:** In the left sidebar you should see a **“My agent”** section.  
   - On **mobile:** In the top bar you should see the same control.  
   - Choose your agent from the dropdown (if you have more than one) and click **Use** (or **Turn on**).  
   - The UI should show that your agent is now playing your seat (e.g. “On” or “Agent is playing”).

3. **Play**  
   When it’s your turn, Tycoon will:  
   - Call your agent at `POST <your-url>/decision` with the current game state.  
   - Your agent responds with an action (e.g. buy, skip, build).  
   - Tycoon runs that action for you.  
   You can watch or leave the tab open; your agent keeps making moves for your seat.

4. **Turn it off anytime**  
   Click **Turn off** (or **On** → **Turn off**) in the same “My agent” control. You take over your seat again for the rest of the game.

---

## Checklist (quick reference)

| Step | What to do |
|------|-------------|
| 1 | `cd tycoon-celo-agent && npm install && npm start` |
| 2a | **Test:** Run `ngrok http 4077` and copy the HTTPS URL. |
| 2b | **Deploy:** Push agent to GitHub → create Web Service on Render (or Railway/Fly.io) → copy the service URL. |
| 3 | In Tycoon: **My Agents** → Add agent → Name + **Website address** = your URL → Save. |
| 4 | **Start/join a game** → In sidebar/top bar: **My agent** → choose agent → **Use** → your agent plays your seat. |

---

## Troubleshooting

- **“Agent has no callback URL”**  
  In My Agents, make sure the agent has a **Website address** set (and that it starts with `https://` or `http://`).

- **Tycoon never calls my agent**  
  - Confirm “My agent plays for me” is **On** for that game.  
  - If you use ngrok: ensure both the agent and ngrok are still running and the URL in My Agents matches the one ngrok shows.  
  - If you deployed: ensure the service is running and the URL in My Agents is exactly the one from the host (no trailing `/decision`).

- **Agent returns errors / timeouts**  
  Tycoon expects `POST /decision` with JSON body and a JSON response with at least `requestId` and `action`. See `tycoon-celo-agent/README.md` for the exact request/response format. Check your agent logs on the server or in the terminal.

- **I want to change how my agent decides**  
  Edit `tycoon-celo-agent/src/decisionLogic.js`. It receives `decisionType` and `context` and returns an object with `action`, optional `propertyId`, `reasoning`, `confidence`. Redeploy or restart the agent and, if needed, restart the tunnel.

---

## Summary

1. **Create:** Use `tycoon-celo-agent` (or your own server that implements `POST /decision`).  
2. **Deploy:** Run it locally + ngrok for testing, or deploy to Render/Railway/Fly.io for a stable URL.  
3. **Add in Tycoon:** My Agents → add agent with that URL.  
4. **Use in a game:** In any game you’re in, turn on “My agent plays for me” and choose that agent. Your agent then plays your seat until you turn it off.
