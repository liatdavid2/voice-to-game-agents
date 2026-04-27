import json
import os
import subprocess
import sys
from pathlib import Path

from flask import Flask, request, jsonify, render_template_string, send_from_directory, abort
from game_library import list_games

app = Flask(__name__)

REPO_PATH = os.getenv("REPO_PATH", str(Path(__file__).resolve().parent / "workspace"))
GAME_SCRIPT = Path(__file__).resolve().parent / "game_repo_langgraph.py"

HTML_PAGE = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Magic Game Creator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --bg1: #fff7fb;
      --bg2: #eef7ff;
      --card: rgba(255, 255, 255, 0.92);
      --text: #2c2140;
      --muted: #6f6480;
      --purple: #7c4dff;
      --pink: #ff6fb1;
      --green: #20b486;
      --orange: #ff8a3d;
      --border: rgba(124, 77, 255, 0.18);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, #ffd8ec 0, transparent 34%),
        radial-gradient(circle at top right, #d9efff 0, transparent 32%),
        linear-gradient(135deg, var(--bg1), var(--bg2));
    }

    .page {
      width: min(1180px, 94vw);
      margin: 0 auto;
      padding: 30px 0 50px;
    }

    .hero {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 22px;
      align-items: stretch;
      margin-bottom: 24px;
    }

    .panel {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 28px;
      box-shadow: 0 18px 60px rgba(71, 47, 128, 0.16);
      padding: 24px;
      backdrop-filter: blur(10px);
    }

    .headline {
      font-size: clamp(34px, 5vw, 58px);
      line-height: 1.02;
      margin: 0 0 12px;
      letter-spacing: -1.5px;
    }

    .headline span {
      color: var(--purple);
    }

    .subtitle {
      margin: 0 0 20px;
      color: var(--muted);
      font-size: 18px;
      line-height: 1.5;
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin: 14px 0;
    }

    button, select, textarea, input {
      font: inherit;
    }

    button, select {
      border: 0;
      border-radius: 999px;
      padding: 13px 18px;
      font-weight: 700;
    }

    select {
      background: white;
      color: var(--text);
      border: 1px solid var(--border);
    }

    button {
      cursor: pointer;
      color: white;
      transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
    }

    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(75, 44, 163, 0.16);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .record { background: var(--purple); }
    .stop { background: var(--orange); }
    .create { background: var(--green); font-size: 18px; padding: 15px 24px; }
    .secondary { background: #4b3f72; }

    textarea {
      width: 100%;
      min-height: 150px;
      resize: vertical;
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 16px;
      background: white;
      color: var(--text);
      outline: none;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5);
      line-height: 1.45;
    }

    textarea:focus {
      border-color: var(--purple);
      box-shadow: 0 0 0 4px rgba(124, 77, 255, 0.13);
    }

    .status-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100%;
      background:
        linear-gradient(160deg, rgba(124,77,255,0.92), rgba(255,111,177,0.86)),
        white;
      color: white;
      border-radius: 28px;
      padding: 26px;
      box-shadow: 0 18px 60px rgba(124, 77, 255, 0.24);
    }

    .status-title {
      font-size: 27px;
      font-weight: 800;
      margin-bottom: 12px;
    }

    .status-text {
      font-size: 16px;
      line-height: 1.5;
      opacity: 0.95;
      margin-bottom: 16px;
    }

    .progress {
      height: 12px;
      background: rgba(255,255,255,0.28);
      border-radius: 999px;
      overflow: hidden;
    }

    .progress > div {
      width: 0%;
      height: 100%;
      background: white;
      border-radius: 999px;
      transition: width 0.35s ease;
    }

    .library-header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 16px;
      margin: 26px 0 16px;
    }

    .library-header h2 {
      font-size: 30px;
      margin: 0;
    }

    .library-header p {
      margin: 6px 0 0;
      color: var(--muted);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
      gap: 18px;
    }

    .game-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 14px;
      box-shadow: 0 12px 40px rgba(71, 47, 128, 0.12);
    }

    .game-title {
      font-weight: 800;
      margin: 4px 4px 10px;
      word-break: break-word;
    }

    .preview-frame {
      width: 100%;
      height: 210px;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 18px;
      background: white;
      overflow: hidden;
      margin-bottom: 12px;
      position: relative;
    }

    .preview-frame iframe {
      width: 800px;
      height: 600px;
      border: 0;
      transform: scale(0.34);
      transform-origin: top left;
      pointer-events: none;
      background: white;
    }

    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .actions a, .open-link {
      text-decoration: none;
      color: white;
      background: var(--purple);
      border-radius: 999px;
      padding: 10px 14px;
      font-weight: 700;
      display: inline-block;
    }

    .actions a:nth-child(2) {
      background: var(--pink);
    }

    .empty {
      background: rgba(255,255,255,0.72);
      border: 1px dashed var(--border);
      border-radius: 22px;
      padding: 30px;
      color: var(--muted);
      text-align: center;
    }

    .output {
      display: none;
      white-space: pre-wrap;
      background: #171327;
      color: #f6f1ff;
      border-radius: 18px;
      padding: 14px;
      max-height: 210px;
      overflow: auto;
      margin-top: 14px;
      font-size: 13px;
    }

    .open-created {
      margin-top: 14px;
    }

    @media (max-width: 820px) {
      .hero {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="panel">
        <h1 class="headline">Create a <span>new game</span> by voice</h1>
        <p class="subtitle">
          Choose a language, record or type an idea, and the agent will create a small browser game.
          When it is ready, it appears in the library below.
        </p>

        <div class="controls">
          <select id="language" aria-label="Language">
            <option value="he-IL">עברית</option>
            <option value="en-US" selected>English</option>
          </select>
          <button class="record" onclick="startRecording()">Record</button>
          <button class="stop" onclick="stopRecording()">Stop</button>
          <button class="secondary" onclick="clearText()">Clear</button>
        </div>

        <textarea id="description" placeholder="Example: Create a rainbow game where a unicorn catches stars and avoids clouds."></textarea>

        <div class="controls">
          <button id="createBtn" class="create" onclick="submitGame()">Create Game</button>
        </div>

        <div id="openCreated" class="open-created"></div>
        <pre id="output" class="output"></pre>
      </div>

      <aside class="status-card">
        <div class="status-title" id="statusTitle">Ready</div>
        <div class="status-text" id="statusText">
          The page stays open while the game is being created. Do not refresh until it finishes.
        </div>
        <div class="progress"><div id="progressBar"></div></div>
      </aside>
    </section>

    <section>
      <div class="library-header">
        <div>
          <h2>Game Library</h2>
          <p>{{ games|length }} games saved locally</p>
        </div>
        <button class="secondary" onclick="window.location.reload()">Refresh</button>
      </div>

      {% if games %}
        <div class="grid">
          {% for game in games %}
            <article class="game-card">
              <div class="game-title">{{ game.name }}</div>
              <div class="preview-frame">
                <iframe src="/play/{{ game.folder }}/index.html" loading="lazy" title="{{ game.name }}"></iframe>
              </div>
              <div class="actions">
                <a href="/play/{{ game.folder }}/index.html" target="_blank">Play</a>
                <a href="/?edit={{ game.folder }}">Use as inspiration</a>
              </div>
            </article>
          {% endfor %}
        </div>
      {% else %}
        <div class="empty">No games yet. Create the first one above.</div>
      {% endif %}
    </section>
  </main>

  <script>
    let recognition = null;
    let isRecording = false;
    let progressTimer = null;

    function setProgress(value) {
      document.getElementById("progressBar").style.width = value + "%";
    }

    function setStatus(title, text, progress) {
      document.getElementById("statusTitle").innerText = title;
      document.getElementById("statusText").innerText = text;
      if (typeof progress === "number") {
        setProgress(progress);
      }
    }

    function getSelectedLanguage() {
      return document.getElementById("language").value;
    }

    function clearText() {
      document.getElementById("description").value = "";
      document.getElementById("openCreated").innerHTML = "";
      setStatus("Ready", "Record or type a game idea.", 0);
    }

    function startRecording() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setStatus("Speech not supported", "Use Chrome or Edge, or type the idea manually.", 0);
        return;
      }

      recognition = new SpeechRecognition();
      recognition.lang = getSelectedLanguage();
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = function() {
        isRecording = true;
        setStatus("Listening", "Say the game idea now.", 18);
      };

      recognition.onresult = function(event) {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        document.getElementById("description").value = transcript.trim();
      };

      recognition.onerror = function(event) {
        setStatus("Speech error", "Error: " + event.error, 0);
      };

      recognition.onend = function() {
        isRecording = false;
        setStatus("Recording stopped", "Review the text, then create the game.", 30);
      };

      recognition.start();
    }

    function stopRecording() {
      if (recognition && isRecording) {
        recognition.stop();
      }
    }

    function startFakeProgress() {
      let value = 35;
      setProgress(value);
      progressTimer = setInterval(function() {
        value = Math.min(value + Math.random() * 8, 92);
        setProgress(value);
      }, 900);
    }

    function stopFakeProgress(finalValue) {
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
      setProgress(finalValue);
    }

    async function submitGame() {
      const output = document.getElementById("output");
      const openCreated = document.getElementById("openCreated");
      const createBtn = document.getElementById("createBtn");
      const description = document.getElementById("description").value.trim();

      if (!description) {
        setStatus("Missing idea", "Record or type a description first.", 0);
        return;
      }

      output.style.display = "none";
      output.textContent = "";
      openCreated.innerHTML = "";
      createBtn.disabled = true;
      setStatus("Creating game", "The agent is writing the game files. This can take a bit.", 35);
      startFakeProgress();

      try {
        const response = await fetch("/run_game_action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description,
            language: getSelectedLanguage(),
            mode: "create"
          })
        });

        const data = await response.json();
        output.textContent = JSON.stringify(data, null, 2);

        if (!response.ok) {
          output.style.display = "block";
          stopFakeProgress(0);
          setStatus("Failed", "Open the server response below and check the error.", 0);
          return;
        }

        stopFakeProgress(100);
        setStatus("Game ready", "Opening link is ready. The library will refresh when you click Refresh.", 100);

        const parsed = data.parsed_result || {};
        const gameDir = parsed.game_dir || "";
        const folder = gameDir.split(/[\\/]/).filter(Boolean).pop();
        if (folder) {
          openCreated.innerHTML = '<a class="open-link" target="_blank" href="/play/' + encodeURIComponent(folder) + '/index.html">Open New Game</a>';
        }
      } catch (err) {
        output.style.display = "block";
        output.textContent = String(err);
        stopFakeProgress(0);
        setStatus("Request failed", "The browser could not reach the server.", 0);
      } finally {
        createBtn.disabled = false;
      }
    }

    setStatus("Ready", "Record or type a game idea.", 0);
  </script>
</body>
</html>
"""


@app.route("/", methods=["GET"])
def index():
    Path(REPO_PATH).mkdir(parents=True, exist_ok=True)
    games = list_games(REPO_PATH)
    return render_template_string(HTML_PAGE, games=games)


@app.route("/library", methods=["GET"])
def library():
    Path(REPO_PATH).mkdir(parents=True, exist_ok=True)
    games = list_games(REPO_PATH)
    return render_template_string(HTML_PAGE, games=games)


@app.route("/play/<game_name>/<path:filename>", methods=["GET"])
def play_game_file(game_name, filename):
    games_root = Path(REPO_PATH) / "games"
    game_dir = games_root / game_name

    if not game_dir.exists() or not game_dir.is_dir():
        abort(404)

    return send_from_directory(game_dir, filename)


@app.route("/run_game_action", methods=["POST"])
def run_game_action():
    payload = request.get_json(force=True)
    description = (payload.get("description") or "").strip()
    language = (payload.get("language") or "").strip()
    mode = (payload.get("mode") or "create").strip().lower()
    game_name = (payload.get("game_name") or "").strip()

    if not description:
        return jsonify({"error": "Missing description"}), 400

    if mode not in {"create", "edit"}:
        return jsonify({"error": "Invalid mode"}), 400

    if mode == "edit" and not game_name:
        return jsonify({"error": "Missing game_name for edit mode"}), 400

    if not GAME_SCRIPT.exists():
        return jsonify({"error": f"Missing script: {GAME_SCRIPT}"}), 500

    Path(REPO_PATH).mkdir(parents=True, exist_ok=True)

    cmd = [
        sys.executable,
        str(GAME_SCRIPT),
        "--repo_path",
        REPO_PATH,
        "--mode",
        mode,
        "--description",
        description,
    ]

    if mode == "edit":
        cmd.extend(["--game_name", game_name])

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        shell=False
    )

    response = {
        "language": language,
        "mode": mode,
        "game_name": game_name,
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }

    if result.returncode != 0:
        return jsonify(response), 500

    parsed = None
    try:
        parsed = json.loads(result.stdout.strip().splitlines()[-1])
    except Exception:
        parsed = None

    response["parsed_result"] = parsed
    return jsonify(response)


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host=host, port=port, debug=debug)
