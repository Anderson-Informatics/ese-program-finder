# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Program sync API

Set `NUXT_PROGRAM_SYNC_API_KEY` in the server's environment to a strong, private key. This key is separate from the admin password and must not be placed in browser code or `runtimeConfig.public`. Both endpoints require an `x-api-key` header:

- `GET /api/programs/export` returns a JSON array of every raw document in the `programs` collection, including all fields and `_id`.
- `POST /api/summaries/bulk` accepts 1–1000 summary records per request. Each record needs numeric `SchoolID`, string `Program` and `GradeBand`, and numeric `ProgramCount`, `Capacity`, `Remaining`, and `Enrolled`. Existing summaries are matched by `SchoolID`, `Program`, and `GradeBand`; only the four counts and a server-generated `LastUpdated` are set. Unmatched records are **not** inserted. The response contains `matchedCount`, `modifiedCount`, and `upsertedCount`.

For example, from a trusted Python environment:

```python
import os
import requests

base_url = "http://localhost:3000"
headers = {"x-api-key": os.environ["NUXT_PROGRAM_SYNC_API_KEY"]}

response = requests.get(f"{base_url}/api/programs/export", headers=headers, timeout=60)
response.raise_for_status()
programs = response.json()

records = program_count.to_dict("records")
for offset in range(0, len(records), 1000):
    response = requests.post(
        f"{base_url}/api/summaries/bulk",
        headers=headers,
        json=records[offset : offset + 1000],
        timeout=60,
    )
    response.raise_for_status()
    print(response.json())
```

Use HTTPS in deployment. `LastUpdated` is set by the API in UTC, rather than taken from client input.
