import os
import re
import json
import argparse
import subprocess
from pathlib import Path
from typing import TypedDict, Optional, Any, Dict, List
from typing_extensions import Annotated
from operator import add

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END
from game_image_assets import generate_game_images

# ---------------------------
# ENV
# ---------------------------
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MINI_GPT = os.getenv("MINI_GPT", "gpt-4.1-mini")
PUBLISH_TO_GIT = os.getenv("PUBLISH_TO_GIT", "false").strip().lower() == "true"
GENERATE_IMAGES = os.getenv("GENERATE_IMAGES", "false").strip().lower() == "true"

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is missing")

client = OpenAI(api_key=OPENAI_API_KEY)


# ---------------------------
# OUTPUT SCHEMA
# ---------------------------
class GameFiles(BaseModel):
    title: str = Field(description="Short game title")
    index_html: str = Field(description="Complete HTML file")
    style_css: str = Field(description="Complete CSS file")
    script_js: str = Field(description="Complete JavaScript file")


# ---------------------------
# GRAPH STATE
# ---------------------------
class GameState(TypedDict, total=False):
    user_description: str
    repo_path: str
    mode: str
    game_name: Optional[str]

    title: str
    index_html: str
    style_css: str
    script_js: str
    character_images: Dict[str, str]

    games_root: str
    game_dir: str
    commit_message: str
    result: Dict[str, Any]
    error: Optional[str]

    logs: Annotated[List[str], add]


# ---------------------------
# HELPERS
# ---------------------------

def split_versioned_name(folder_name: str) -> tuple[str, Optional[int]]:
    match = re.match(r"^(.*)-(\d+)$", folder_name.strip(), re.IGNORECASE)
    if not match:
        return folder_name.strip(), None
    return match.group(1).strip(), int(match.group(2))


def get_next_version_dir(games_root: Path, base_name: str) -> Path:
    base_slug = slugify(base_name)
    max_version = 0

    for child in games_root.iterdir():
        if not child.is_dir():
            continue

        child_base, child_version = split_versioned_name(child.name)
        if slugify(child_base) == base_slug and child_version is not None:
            max_version = max(max_version, child_version)

    next_version = max_version + 1
    return games_root / f"{base_slug}-{next_version}"


def resolve_latest_game_dir(games_root: Path, game_name: str) -> Path:
    requested = game_name.strip()
    requested_slug = slugify(requested)

    exact_dir = games_root / requested
    if exact_dir.exists() and exact_dir.is_dir():
        return exact_dir

    slug_dir = games_root / requested_slug
    if slug_dir.exists() and slug_dir.is_dir():
        return slug_dir

    candidates: list[tuple[int, Path]] = []

    for child in games_root.iterdir():
        if not child.is_dir():
            continue

        child_base, child_version = split_versioned_name(child.name)

        if slugify(child_base) == requested_slug:
            version = child_version if child_version is not None else 0
            candidates.append((version, child))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    existing_dirs = sorted([p.name for p in games_root.iterdir() if p.is_dir()])
    raise FileNotFoundError(
        f"Game folder not found for '{game_name}'. Available folders: {existing_dirs}"
    )

def log(message: str) -> Dict[str, Any]:
    print(f"[INFO] {message}", flush=True)
    return {"logs": [message]}


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "new-game"


def run_git(repo_path: Path, args: list[str], allow_fail: bool = False) -> None:
    result = subprocess.run(
        ["git"] + args,
        cwd=repo_path,
        capture_output=True,
        text=True,
        shell=False
    )

    if result.stdout.strip():
        print(f"[GIT STDOUT] {result.stdout.strip()}", flush=True)
    if result.stderr.strip():
        print(f"[GIT STDERR] {result.stderr.strip()}", flush=True)

    if result.returncode != 0 and not allow_fail:
        raise RuntimeError(
            f"Git command failed: git {' '.join(args)}\n"
            f"stdout:\n{result.stdout}\n"
            f"stderr:\n{result.stderr}"
        )


def read_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")

def fix_missing_image_paths(
    text: str,
    game_dir: Path,
    character_images: Optional[Dict[str, str]],
) -> str:
    if not character_images:
        return text

    existing_images = []

    for relative_path in character_images.values():
        image_path = game_dir / relative_path
        if image_path.exists():
            existing_images.append(relative_path)

    if not existing_images:
        return text

    fallback_image = existing_images[0]

    pattern = re.compile(
        r"images/[A-Za-z0-9_./-]+\.(?:png|jpg|jpeg|webp)",
        re.IGNORECASE,
    )

    def replace_missing(match: re.Match) -> str:
        relative_path = match.group(0)
        if (game_dir / relative_path).exists():
            return relative_path
        return fallback_image

    return pattern.sub(replace_missing, text)


def call_model_for_new_game(
    user_description: str,
    character_images: Optional[Dict[str, str]] = None
) -> GameFiles:
    
    image_text = ""
    if character_images:
        lines = [f"- {role}: {path}" for role, path in character_images.items()]
        image_text = "Available local images:\n" + "\n".join(lines)
    system_prompt = """
You create very small child-friendly browser games.

Return ONLY valid JSON with exactly these keys:
- title
- index_html
- style_css
- script_js

Rules:
- Single screen
- Very simple
- Child-friendly
- Plain HTML, CSS, JavaScript only
- No npm
- No frameworks
- No external CDN
- Must run by opening index.html directly
- Include score
- Include start or restart button
- Include clear win or lose message
- Keep code readable
- Use English in code and comments
- Never invent image paths.
- Never reference images/princess1.png, images/princess2.png, or any other image file unless it appears in Available local images.
- If local images are provided, use only those exact relative paths.
- If there are not enough local images, use CSS shapes, colors, text, or emoji instead of fake image files.
- Display character/object images at small in-game sizes, usually 80px to 140px wide.
- Use at most one or two local images in the game.
- If the game is a memory game, reuse the same image across multiple pairs.
- Differentiate pairs using background colors, borders, symbols, badges, numbers, or simple labels.
- If there are not enough local images, do not invent new files. Use CSS colors and symbols instead.
- For memory games, each pair may share the same image path but must have a distinct color and symbol combination.

"""

    user_prompt = f"""
User description:
{user_description}

{image_text}

Create a complete playable game using only:
- index.html
- style.css
- script.js

If local images are provided, use these exact relative paths in the game.
Return JSON only.
If only one or two local images are available, reuse them and create variety using colors, symbols, numbers, and borders.
"""

    response = client.chat.completions.create(
        model=MINI_GPT,
        temperature=0.4,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    data = json.loads(response.choices[0].message.content)
    return GameFiles(**data)


def call_model_for_edit(
    user_description: str,
    game_title: str,
    index_html: str,
    style_css: str,
    script_js: str,
    character_images: Optional[Dict[str, str]] = None,
) -> GameFiles:
    image_text = ""
    if character_images:
        lines = [f"- {role}: {path}" for role, path in character_images.items()]
        image_text = "Available local images:\n" + "\n".join(lines)
    system_prompt = """
You edit an existing very small child-friendly browser game.

Return ONLY valid JSON with exactly these keys:
- title
- index_html
- style_css
- script_js

Rules:
- Keep the game simple
- Plain HTML, CSS, JavaScript only
- No npm
- No frameworks
- No external CDN
- Must run by opening index.html directly
- Keep code readable
- Use English in code and comments
- Apply the user's requested changes to the existing files
- Return the full updated files
- Never invent image paths.
- Never reference images/princess1.png, images/princess2.png, or any other image file unless it appears in Available local images.
- If local images are provided, use only those exact relative paths.
- If there are not enough local images, use CSS shapes, colors, text, or emoji instead of fake image files.
- Display character/object images at small in-game sizes, usually 80px to 140px wide.
- Use at most one or two local images in the game.
- If the game is a memory game, reuse the same image across multiple pairs.
- Differentiate pairs using background colors, borders, symbols, badges, numbers, or simple labels.
- If there are not enough local images, do not invent new files. Use CSS colors and symbols instead.
- For memory games, each pair may share the same image path but must have a distinct color and symbol combination.
"""

    user_prompt = f"""
User request:
{user_description}

{image_text}

Existing title:
{game_title}

Existing index.html:
{index_html}

Existing style.css:
{style_css}

Existing script.js:
{script_js}

If local images are provided, use these exact relative paths in the updated game.
Return JSON only.
If only one or two local images are available, reuse them and create variety using colors, symbols, numbers, and borders.
"""

    response = client.chat.completions.create(
        model=MINI_GPT,
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    data = json.loads(response.choices[0].message.content)
    return GameFiles(**data)


# ---------------------------
# NODES
# ---------------------------
def generate_images(state: GameState) -> GameState:
    if not GENERATE_IMAGES:
        return {
            "character_images": {},
            "logs": ["Image generation disabled"],
        }

    if state.get("mode", "create") == "edit":
        game_dir = Path(state["game_dir"]).resolve()
    else:
        game_dir = get_next_version_dir(
            Path(state["games_root"]).resolve(),
            state.get("title", state["user_description"])
        )
        game_dir.mkdir(parents=True, exist_ok=True)

    print(f"[INFO] Generating image assets in {game_dir / 'images'}", flush=True)

    character_images = generate_game_images(
        user_description=state["user_description"],
        game_dir=game_dir,
        client=client,
        model_name=MINI_GPT,
    )

    logs = [f"Generated image assets: {list(character_images.keys())}"]

    updates: GameState = {
        "character_images": character_images,
        "logs": logs,
    }

    if state.get("mode", "create") != "edit":
        updates["game_dir"] = str(game_dir)

    return updates

def prepare_paths(state: GameState) -> GameState:
    repo_path = Path(state["repo_path"]).resolve()

    if not repo_path.exists():
        raise FileNotFoundError(f"Repo path does not exist: {repo_path}")

    if PUBLISH_TO_GIT and not (repo_path / ".git").exists():
        raise ValueError(f"Path is not a git repo: {repo_path}")

    games_root = repo_path / "games"
    games_root.mkdir(parents=True, exist_ok=True)

    updates: GameState = {
        "games_root": str(games_root),
        "logs": [
            f"Repository ready: {repo_path}",
            f"Games folder ready: {games_root}",
        ],
    }

    print(f"[INFO] Repository ready: {repo_path}", flush=True)
    print(f"[INFO] Games folder ready: {games_root}", flush=True)

    if state.get("mode", "create") == "edit":
        if not state.get("game_name"):
            raise ValueError("game_name is required in edit mode")

        game_dir = resolve_latest_game_dir(games_root, state["game_name"])

        print(f"[INFO] Edit mode for latest matching game: {game_dir.name}", flush=True)

        updates["game_dir"] = str(game_dir)
        updates["logs"] = updates.get("logs", []) + [
            f"Edit mode for latest matching game: {game_dir.name}"
        ]
    else:
        print("[INFO] Create mode selected", flush=True)
        updates["logs"] = updates.get("logs", []) + ["Create mode selected"]

    return updates

def generate_files(state: GameState) -> GameState:
    mode = state.get("mode", "create")

    if mode == "edit":
        game_dir = Path(state["game_dir"]).resolve()
        index_html = read_text(game_dir / "index.html")
        style_css = read_text(game_dir / "style.css")
        script_js = read_text(game_dir / "script.js")

        if not any([index_html, style_css, script_js]):
            raise ValueError("Existing game files are missing")

        print(f"[INFO] Loading existing game from {game_dir}", flush=True)
        files = call_model_for_edit(
        user_description=state["user_description"],
        game_title=game_dir.name,
        index_html=index_html,
        style_css=style_css,
        script_js=script_js,
        character_images=state.get("character_images"),
    )

        return {
            "title": files.title,
            "index_html": files.index_html,
            "style_css": files.style_css,
            "script_js": files.script_js,
            "commit_message": f"Edit game: {files.title}",
            "logs": [
                f"Loaded existing files from {game_dir.name}",
                f"Model updated game: {files.title}",
            ],
        }

    print("[INFO] Generating new game with model", flush=True)
    files = call_model_for_new_game(
    state["user_description"],
    character_images=state.get("character_images"),
    )

    return {
        "title": files.title,
        "index_html": files.index_html,
        "style_css": files.style_css,
        "script_js": files.script_js,
        "commit_message": f"Add game: {files.title}",
        "logs": [f"Model generated new game: {files.title}"],
    }


def save_files(state: GameState) -> GameState:
    repo_path = Path(state["repo_path"]).resolve()

    if state.get("game_dir"):
        game_dir = Path(state["game_dir"]).resolve()
        game_dir.mkdir(parents=True, exist_ok=True)
    elif state.get("mode", "create") == "edit":
        game_dir = Path(state["game_dir"]).resolve()
    else:
        game_dir = get_next_version_dir(
            Path(state["games_root"]).resolve(),
            state["title"]
        )
        game_dir.mkdir(parents=True, exist_ok=True)

    character_images = state.get("character_images") or {}

    index_html = fix_missing_image_paths(
        state["index_html"],
        game_dir,
        character_images,
    )

    style_css = fix_missing_image_paths(
        state["style_css"],
        game_dir,
        character_images,
    )

    script_js = fix_missing_image_paths(
        state["script_js"],
        game_dir,
        character_images,
    )

    (game_dir / "index.html").write_text(index_html, encoding="utf-8")
    (game_dir / "style.css").write_text(style_css, encoding="utf-8")
    (game_dir / "script.js").write_text(script_js, encoding="utf-8")

    relative_dir = str(game_dir.relative_to(repo_path))
    print(f"[INFO] Saved files to {relative_dir}", flush=True)

    return {
        "game_dir": str(game_dir),
        "logs": [f"Saved files to {relative_dir}"],
    }

def publish_to_git(state: GameState) -> GameState:
    repo_path = Path(state["repo_path"]).resolve()
    game_dir = Path(state["game_dir"]).resolve()
    relative_dir = str(game_dir.relative_to(repo_path))

    if not PUBLISH_TO_GIT:
        print("[INFO] Git publish disabled. Local files saved only.", flush=True)
        return {
            "result": {
                "title": state["title"],
                "mode": state.get("mode", "create"),
                "game_dir": str(game_dir),
                "folder": game_dir.name,
                "play_path": f"/play/{game_dir.name}/index.html",
                "files": [
                    str(game_dir / "index.html"),
                    str(game_dir / "style.css"),
                    str(game_dir / "script.js"),
                ],
                "commit_message": state["commit_message"],
                "model_used": MINI_GPT,
                "logs": state.get("logs", []) + ["Local save completed"],
            },
            "logs": ["Local save completed"],
        }

    print(f"[INFO] git add {relative_dir}", flush=True)
    run_git(repo_path, ["add", relative_dir])

    print(f"[INFO] git commit -m \"{state['commit_message']}\"", flush=True)
    run_git(repo_path, ["commit", "-m", state["commit_message"]], allow_fail=True)

    print("[INFO] git push", flush=True)
    run_git(repo_path, ["push"], allow_fail=False)

    return {
        "result": {
            "title": state["title"],
            "mode": state.get("mode", "create"),
            "game_dir": str(game_dir),
            "folder": game_dir.name,
            "play_path": f"/play/{game_dir.name}/index.html",
            "files": [
                str(game_dir / "index.html"),
                str(game_dir / "style.css"),
                str(game_dir / "script.js"),
            ],
            "commit_message": state["commit_message"],
            "model_used": MINI_GPT,
            "logs": state.get("logs", []) + ["Git push completed"],
        },
        "logs": ["Git publish completed"],
    }


# ---------------------------
# GRAPH
# ---------------------------
def build_graph():
    graph = StateGraph(GameState)

    graph.add_node("prepare_paths", prepare_paths)
    graph.add_node("generate_images", generate_images)
    graph.add_node("generate_files", generate_files)
    graph.add_node("save_files", save_files)
    graph.add_node("publish_to_git", publish_to_git)
    print('------------generate_images----------------------------')
    
    
    graph.add_edge(START, "prepare_paths")
    graph.add_edge("prepare_paths", "generate_images")
    graph.add_edge("generate_images", "generate_files")
    graph.add_edge("generate_files", "save_files")
    graph.add_edge("save_files", "publish_to_git")
    graph.add_edge("publish_to_git", END)

    return graph.compile()


# ---------------------------
# MAIN
# ---------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo_path", required=True, help="Path to local git repo")
    parser.add_argument("--description", required=True, help="Free-text game request")
    parser.add_argument(
        "--mode",
        choices=["create", "edit"],
        default="create",
        help="Create a new game or edit an existing one",
    )
    parser.add_argument(
        "--game_name",
        default=None,
        help="Existing game folder name for edit mode",
    )
    args = parser.parse_args()

    app = build_graph()

    initial_state: GameState = {
        "repo_path": args.repo_path,
        "user_description": args.description,
        "mode": args.mode,
        "game_name": args.game_name,
        "logs": [],
    }

    try:
        print("[INFO] Starting workflow", flush=True)
        result = app.invoke(initial_state)
        print("[INFO] Workflow finished", flush=True)
        print(json.dumps(result["result"], indent=2, ensure_ascii=False))
    except Exception as exc:
        error_payload = {
            "error": str(exc),
            "logs": initial_state.get("logs", []),
        }
        print(json.dumps(error_payload, indent=2, ensure_ascii=False))
        raise


if __name__ == "__main__":
    main()