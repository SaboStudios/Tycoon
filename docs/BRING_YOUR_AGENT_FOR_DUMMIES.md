# Bring Your Agent to Tycoon — In Plain English

## What is this page about?

Imagine you have a **robot** that knows how to play Tycoon.  
This page is about letting **that robot play the game for you** — so you don’t have to. Your robot can play **any** game in your place: vs the computer or vs other people. You can also **switch** anytime: let the robot play for a while, then take over yourself, then hand it back to the robot — even in the middle of a live game.

---

## Why would I use this?

- You don’t want to sit and click every move yourself (or you want help for some turns).
- You have (or will create) a small program — an **“agent”** — that can decide: buy or not, trade or not, build or not.
- You want that program to **sit in your chair** and play your turns when you choose — in **any** game (vs computer or vs humans).
- You want to be able to **turn agent mode on or off during a live game** — so sometimes you play, sometimes your agent plays.

So: **your agent can play any game for you — including multiplayer (PvP) games — and you can switch between “I play” and “my agent plays” even while the game is running.**

---

## What do I actually do? (Step by step)

**Step 1 — Save your agent in My Agents**  
You go to **“My Agents”** in the app and add an agent: give it a name and the **website address** (URL) where it runs. Once saved, you can use that agent on the **game board** whenever you play — no need to enter anything in the lobby or paste an API key.

*What’s the “website address”?* It’s the **link** (URL) where your agent lives on the internet — for example `https://my-agent.example.com`. When it’s your turn, Tycoon sends the game situation to that link; your agent replies with “buy”, “skip”, “accept trade”, etc., and Tycoon does that move. So Tycoon needs to know *where* to ask.

**How do I find or get mine?**

A lot of people’s agents **don’t have a website** — they run in the terminal (e.g. `npm start` on your laptop). To use that with Tycoon, you either give it a **temporary public link** (tunnel) or **deploy** the same code somewhere so it gets a URL. So “website address” often means “the link where your agent is reachable,” whether that’s a tunnel to your terminal or a real hosted site.

**How do I actually provide that link?**

- **Option A — Tunnel (quick, for testing)**  
  1. Start your agent in the terminal (e.g. in `tycoon-celo-agent` run `npm start` — it listens on port 4077).  
  2. In another terminal, run a tunnel so the internet can reach that port. With [ngrok](https://ngrok.com): sign up (free), install it, then run `ngrok http 4077` (or whatever port your agent uses).  
  3. ngrok prints a URL like `https://abc123.ngrok-free.app`. Copy that **whole link** (with `https://`).  
  4. In Tycoon, go to “My Agents,” add an agent, and paste that link into the “website address” field.  
  Your agent now has a “website” as long as both your agent and the ngrok window are running. When you close either, the link stops working (you’d get a new ngrok URL next time).

- **Option B — Deploy (stable URL, no need to keep your laptop on)**  
  1. Put your agent code in a repo (e.g. GitHub).  
  2. Use a free hosting service (e.g. [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io)). Create a “Web Service,” connect the repo, set the start command (e.g. `npm start`) and the port your agent uses (e.g. 4077).  
  3. After deploy, the service gives you a URL like `https://my-agent.onrender.com`. Copy that.  
  4. In Tycoon, go to “My Agents,” add an agent, and paste that URL into the “website address” field.  
  That link keeps working as long as the hosted service is running; you don’t need your laptop on.

- **I’m running the Tycoon agent (or my own) on my computer**  
  The address is the place your agent is listening. For the built-in example agent in this repo (`tycoon-celo-agent`), when you run it locally it’s usually `http://localhost:4077`. Use that in “website address” only if Tycoon’s server runs on the **same** machine (e.g. both on your laptop). If Tycoon runs elsewhere (e.g. on a friend’s PC or a hosted server), that server must be able to reach your agent — so you need a **public** link (see “tunnel” below).

- **I put my agent on a server or a hosting site**  
  The website address is the URL of that server. Examples: `https://my-agent.onrender.com`, `https://my-bot.railway.app`, or your own domain like `https://agent.mydomain.com`. You copy that full link (including `https://`) into the “website address” field.

- **I’m testing on my computer but Tycoon runs on the internet**  
  Run a **tunnel** (e.g. [ngrok](https://ngrok.com)) so your local agent gets a public link. Example: you run your agent on port 4077, then run `ngrok http 4077`; ngrok gives you a link like `https://abc123.ngrok.io`. Use **that** link as the website address. (When you stop the tunnel, that link stops working.)

- **Someone else gave me an agent to use**  
  They should give you the link (e.g. `https://their-agent.example.com`). Paste that into the “website address” field. Don’t add `/decision` at the end — Tycoon adds that when it calls your agent.

**Step 2 — Start or join any game**  
You create a new game or join one — vs the computer or vs other people. Your seat is **your side**.

**Step 3 — On the game board, use your saved agent (or API key)**  
Once you’re in a game, use the **“My agent”** area (sidebar on desktop, top bar on mobile):

- **From My Agents** — Pick one of your saved agents from the dropdown and click **“Use”**. That agent will play your turns. (Add agents in **My Agents** if the list is empty.)
- **Or use your API key** — If you don’t have a saved agent with a URL, you can paste your own API key (e.g. Claude/Anthropic) and click **“Use key”**. Your key is **remembered until you close this tab** (refresh is fine); we don’t store it on our servers.

You can turn this on or off **at any time during the game**. Your seat is played by your agent until you turn it off.

**Step 4 — Switch anytime during the game**  
- **Agent on** — Your agent plays your turns. You can watch or leave.  
- **Agent off** — You play your turns yourself again.  
You can switch back and forth **during the same live game** whenever you like.

---

## What you see on the page (in simple terms)

- **“My Agents”**  
  A place where you add and manage your agents: name + the address where your agent “lives” on the internet.

- **When you’re in a game (game board)**  
  You’ll see a **“My agent”** section (sidebar on desktop, top bar on mobile). There you can:
  - Turn **“My agent plays for me”** on by choosing a hosted agent (from “My Agents”) or by **pasting your API key** under “Or use your API key” and clicking “Use key.”
  - Turn it **off** when you want to play yourself again.
  You can switch at any time during the same live game.

- **Where to add your API key**  
  Only on the **game board** — in the “My agent” area, under “Or use your API key.” (The “My Agents” page is for adding **hosted** agents by URL; it does not have an API key field.)

- **Multiplayer (PvP) games**  
  Yes — your agent can play for you in **multiplayer** games too. On the 3D multiplayer board (desktop and mobile), the same “My agent” control is available: turn on a hosted agent or paste your API key, and your agent will play your turns against other human players.

---

## What you need to host your agent

If you want to use an agent from **My Agents** (instead of only pasting an API key), that agent has to be **reachable on the internet** at a URL. Here’s what that means in practice.

1. **A place that can receive web requests**  
   Your agent code must run on something that can accept HTTP requests: your own server, a cloud host, or your laptop with a **tunnel** (see below).

2. **One endpoint: `POST /decision`**  
   Tycoon calls your URL + `/decision` (e.g. `https://my-agent.onrender.com/decision`). Your agent must:
   - Accept **POST** requests at **/decision**
   - Read a JSON body with the game situation (`decisionType`, `context`, etc.)
   - Respond with JSON that includes at least **`action`** (e.g. `"buy"`, `"skip"`, `"accept"`, `"decline"`) and echo back **`requestId`**

   The example agent in this repo (`tycoon-celo-agent`) already does this. You can use it as-is or copy and change the logic.

3. **A public URL**  
   Tycoon’s servers need to reach that endpoint. You can get a URL in two ways:
   - **Tunnel (quick test)** — Run your agent on your computer and a tunnel (e.g. [ngrok](https://ngrok.com)) that gives you a temporary public link. No deployment; the link works only while the tunnel and your agent are running.
   - **Deploy (stable)** — Deploy your agent to a host (e.g. [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io)) so it has a permanent URL and stays on without your laptop.

You don’t add `/decision` in “My Agents” — you enter only the **base** URL (e.g. `https://my-agent.onrender.com`). Tycoon adds `/decision` when it calls your agent.

For step-by-step “how do I get that link?”, see the options earlier in this doc (**Option A — Tunnel** and **Option B — Deploy**).

---

## A few words we use

- **Agent** — The program (your “robot”) that decides what move to make. You give Tycoon its **website address** (the link where it runs) so the game can ask it what to do.
- **Website address (for your agent)** — The link (URL) where your agent is running on the internet. Tycoon uses it to send “here’s the game, what do you do?” and get back your agent’s move. Example: `https://my-bot.example.com`. You get this from whoever hosts your agent, or from the place you deployed it.
- **“My agent plays for me” / Agent mode** — Your agent is playing your turns. When you turn it off, you play yourself again.
- **Your side / your seat** — The side that is you. When agent mode is on, that side is played by your agent; when it’s off, you play it.
- **Switch during a live game** — You can turn “my agent plays for me” on or off **while the game is already running**, without leaving or starting a new game.

---

## What we need to implement (for devs)

To make “my agent plays for me” and “switch during a live game” work, the codebase needs the following.

### Backend

1. **Let the registry use “your” seat (slot 1)**  
   The agent registry today only allows slots 2–8 (AI seats). We need to allow **slot 1** for a game when it means “the human player’s agent for this game.” So: when registering, allow `slot: 1` if `gameId` is set; store e.g. `game_123_slot_1` and use it when the game asks for a decision for the human’s turn.

2. **API: “Use my agent for this game”**  
   `POST /games/:id/use-my-agent` (auth required). Body: `{ user_agent_id }`. Load the user’s agent from `user_agents` (must belong to `req.user.id`), get its callback URL via `UserAgent.getCallbackUrl(agent)`. Register that URL in the agent registry for **this game + slot 1**. Return success. If the user is not in the game, reject.

3. **API: “Stop using my agent for this game”**  
   `POST /games/:id/stop-using-my-agent` (auth required). Unregister slot 1 for this `gameId` so the user plays manually again.

4. **API: “Is my agent playing for me in this game?”**  
   `GET /games/:id/agent-bindings` (or include in game payload). Return whether this game has an agent registered for slot 1 (and optionally which one), so the frontend can show “Your agent is playing” and know when to auto-request decisions on the user’s turn.

5. **Decision API already exists**  
   `POST /api/agent-registry/decision` with `{ gameId, slot, decisionType, context }` already calls the registered agent (or internal/built-in). Once slot 1 is registered for the game, the frontend can call this with `slot: 1` on the user’s turn and then execute the returned action.

### Frontend

6. **Know when “my agent” is on for this game**  
   Call the new “agent-bindings” (or game) API and/or keep local state when the user turns “my agent plays for me” on/off. The board needs to know: “for this game, is the current user’s seat (slot 1) backed by their agent?”

7. **On “my” turn, if agent is on: get decision and execute**  
   When it’s the **current user’s** turn (e.g. `currentPlayer` is `me`) and “my agent plays for me” is on, don’t wait for the user to click. Instead: call `POST /api/agent-registry/decision` with `gameId`, `slot: 1`, and the right `decisionType` and `context` (same shape as for AI: property, trade, building, strategy). Then call the existing game APIs (roll, buy, decline-buy, accept-trade, build, end-turn, etc.) based on the returned `action`. Reuse the same “get decision → apply action” pattern that the AI boards use (e.g. `useAIAutoActions`, `ai-board`, board-3d).

8. **UI: “My agent plays for me” toggle and agent picker**  
   - When creating or joining a game: optional “Use my agent” with a dropdown of the user’s agents (from `GET /api/agents`). If selected, after the game is ready call `POST /games/:id/use-my-agent` with the chosen `user_agent_id`.  
   - During the game (e.g. in settings or on the board): a control to turn “My agent plays for me” **on** (choose which agent) or **off**. On = call `use-my-agent`; off = call `stop-using-my-agent`.  
   So the user can switch at any time during a live game.

9. **Handle “my turn” flows for all decision types**  
   The same decision types used for AI (property, trade, building, strategy, and any “tip” if needed) must be requested for slot 1 when it’s the user’s turn and agent is on: after roll (property buy/skip), on trade received (accept/decline/counter), after move (build/wait), and end-of-turn (strategy). Wire these in the same places the board already uses for AI (e.g. board-3d, board-3d-mobile, ai-board) but trigger when `currentPlayer === me` and “my agent” is on.

### Summary

- **Backend:** Allow slot 1 in the agent registry per game; add `use-my-agent`, `stop-using-my-agent`, and `agent-bindings` (or equivalent); keep using existing `/agent-registry/decision`.  
- **Frontend:** Know “my agent on for this game”; when it’s my turn and agent is on, call decision API with slot 1 and run the returned action; add toggle + agent picker when creating/joining and during the game so the user can switch anytime.

---

## In one line

**Your agent can play any game for you (vs computer or vs people), and you can switch between “I play” and “my agent plays” at any time, even in the middle of a live game.**
