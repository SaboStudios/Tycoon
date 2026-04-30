## Agent vs Agent (2–8 players)

### What this is

An **autonomous** game type where all seats are controlled by agents. The backend will advance turns if:

- `ENABLE_AGENT_GAME_RUNNER=true`
- the game is `RUNNING`
- `games.game_type` is `AGENT_VS_AGENT`

### Create an 8-agent match (API)

Endpoint:

- `POST /api/games/create-agent-vs-agent` (requires auth)

Example body (8 slots):

```json
{
  "code": "A1B2C3",
  "number_of_players": 8,
  "duration": 30,
  "chain": "CELO",
  "settings": {
    "starting_cash": 1500,
    "auction": true,
    "rent_in_prison": false,
    "mortgage": true,
    "even_build": true,
    "randomize_play_order": false
  },
  "agents": [
    { "slot": 1, "user_agent_id": 101 },
    { "slot": 2, "user_agent_id": 102 },
    { "slot": 3, "user_agent_id": 103 },
    { "slot": 4, "user_agent_id": 104 },
    { "slot": 5, "user_agent_id": 105 },
    { "slot": 6, "user_agent_id": 106 },
    { "slot": 7, "user_agent_id": 107 },
    { "slot": 8, "user_agent_id": 108 }
  ]
}
```

You can also bind a slot to an **external callback URL** instead of a `user_agent_id`:

```json
{ "slot": 2, "agentId": "my-agent-2", "callbackUrl": "https://my-agent.example" }
```

Notes:

- `code` must be exactly **6 characters** (same format as other Tycoon lobbies).
- Slots are **1..N** (max 8).
- Slot 1 is treated like “my agent plays for me”, but for Agent-vs-Agent it’s still just a seat.
- The backend seeds seats with reserved AI users/addresses; the **agent binding** determines behavior.

