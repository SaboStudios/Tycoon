# Environment variables – Frontend & Backend

Use this as a checklist. You already have some of these; add or update as needed.

---

## Backend (`.env` in `backend/`)

### Required for the app
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `tycoon` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | (your password) |

### Optional: Redis (skip if not using)
| Variable | Description |
|----------|-------------|
| `SKIP_REDIS` | Set `true` to skip Redis |
| `REDIS_URL` | If using Redis: `redis://127.0.0.1:6379` |

### Optional: Sentry (error tracking / APM)
| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Backend Sentry DSN; if unset, Sentry is disabled |

### Celo – backend game controller (needed for create/join/end games)
| Variable | Description | Example |
|----------|-------------|--------|
| `CELO_RPC_URL` | Celo RPC | `https://rpc.ankr.com/celo` |
| `TYCOON_CELO_CONTRACT_ADDRESS` | Tycoon contract on Celo | (your contract address) |
| `BACKEND_GAME_CONTROLLER_PRIVATE_KEY` | Wallet set as backendGameController on contract; needs CELO for gas | `0x...` |

### Internal AI agent (Claude – human vs AI games)
| Variable | Description | Example |
|----------|-------------|--------|
| `ANTHROPIC_API_KEY` | From console.anthropic.com – required for AI decisions | `sk-ant-...` |
| `USE_INTERNAL_AI_AGENT` | Set to `false` to disable; default is on | `true` |
| `INTERNAL_AGENT_MODEL` | Optional | `claude-sonnet-4-20250514` |
| `INTERNAL_AGENT_TIMEOUT_MS` | Optional (ms) | `15000` |

### ERC-8004 registration (only for one-time script; not needed at runtime)
| Variable | Description |
|----------|-------------|
| `AGENT_URI` | Defaults to `https://base-monopoly.vercel.app/tycoon-ai.json` |
| `ERC8004_REGISTRANT_PRIVATE_KEY` | Optional; script uses `BACKEND_GAME_CONTROLLER_PRIVATE_KEY` if not set |

---

## Frontend (`.env.local` in `frontend/`)

### API & app URL
| Variable | Description | Example |
|----------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (no trailing slash) | `https://your-backend.railway.app/api` or `http://localhost:3001/api` |

### Optional: Sentry (error tracking)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend Sentry DSN; if unset, Sentry is disabled |

### Celo / Tycoon contracts (from your deployment)
| Variable | Description | Example |
|----------|-------------|--------|
| `NEXT_PUBLIC_CELO` | Tycoon contract address (Celo) | `0x...` |
| `NEXT_PUBLIC_CELO_REWARD` | Reward contract address | `0x...` |
| `NEXT_PUBLIC_CELO_TYC` | TYC token address (if used) | `0x...` |
| `NEXT_PUBLIC_CELO_USDC` | USDC on Celo (if used) | `0x...` |
| `NEXT_PUBLIC_CELO_AI_REGISTRY` | Tycoon AI registry contract (if used) | `0x...` |

### ERC-8004 Agent (reputation after AI games)
Reputation feedback is **submitted by the backend** (one signature = claim only; no second wallet popup).
| Variable | Where | Description |
|----------|--------|-------------|
| `ERC8004_AGENT_ID` | **Backend** `.env` | Agent ID from registration script – backend uses this to submit feedback after each AI game |
| `ERC8004_FEEDBACK_PRIVATE_KEY` | Backend (optional but recommended) | A Celo wallet that is **not** the agent owner (contract rejects "self feedback"). Needs a little CELO for gas. If unset, backend uses the game controller key (will fail if that wallet registered the agent). |
| `ERC8004_REPUTATION_REGISTRY_ADDRESS` | Backend (optional) | Celo registry; default `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

---

## Quick checklist after you generated agent ID

**Backend `.env`** (you likely have most of these already):
- [ ] `ANTHROPIC_API_KEY` – for AI decisions in human vs AI games
- [ ] `CELO_RPC_URL`, `TYCOON_CELO_CONTRACT_ADDRESS`, `BACKEND_GAME_CONTROLLER_PRIVATE_KEY` – for Celo/games
- [ ] `ERC8004_AGENT_ID` = **the agent ID you got from the registration script** – so the backend can submit reputation feedback (user only signs once for claim)
- [ ] If you see "self feedback not allowed": set `ERC8004_FEEDBACK_PRIVATE_KEY` to a **different** Celo wallet (not the one that registered the agent), with a little CELO for gas

**Frontend `.env.local`** (add/confirm):
- [ ] `NEXT_PUBLIC_API_URL` = your backend API URL (e.g. `https://your-backend.up.railway.app/api`)
- [ ] Other `NEXT_PUBLIC_*` contract addresses as you already use them

After adding `ERC8004_AGENT_ID` to the backend, restart the backend so reputation feedback is submitted after each AI game claim (backend signs on Celo; user does not).
