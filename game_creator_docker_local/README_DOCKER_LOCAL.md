# Local Docker Demo

This version runs the game creator locally in Docker.

It uses one page with:

- Game library
- Language selector
- Browser speech recognition
- Game creation status
- Local game storage under `workspace/games`

## 1. Create `.env`

```cmd
copy .env.example .env
```

Edit `.env` and set:

```env
OPENAI_API_KEY=your_key_here
MINI_GPT=gpt-4.1-mini
```

## 2. Start locally

```cmd
start_local_docker.cmd
```

Or run directly:

```cmd
docker compose up --build
```

Open:

```text
http://localhost:5000
```

## 3. Where games are saved

Games are saved locally here:

```text
workspace/games/<game-name>/index.html
workspace/games/<game-name>/style.css
workspace/games/<game-name>/script.js
```

This is intentional. It makes the local demo simple and cheap.

## 4. Current local settings

```env
PUBLISH_TO_GIT=false
GENERATE_IMAGES=false
```

This means:

- No Git push is required
- No image generation cost by default
- The game is created from HTML, CSS, and JavaScript

## 5. Later AWS path

After local Docker works, the minimal cloud path is:

1. Upload generated static games from `workspace/games` to S3.
2. Serve the game library from S3 and CloudFront.
3. Run only the creator backend as a small container when needed.

Recommended next step:

- Add an S3 sync script for `workspace/games`.
- Add one backend route that uploads a completed game folder to S3.
