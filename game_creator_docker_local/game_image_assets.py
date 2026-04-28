import base64
import json
from pathlib import Path
from typing import Dict, List, Optional
import os
from io import BytesIO
from PIL import Image

from openai import OpenAI

IMAGE_MODEL = os.getenv("IMAGE_MODEL", "gpt-image-1-mini")
IMAGE_MAX_SIZE = int(os.getenv("IMAGE_MAX_SIZE", "256"))
IMAGE_QUALITY = int(os.getenv("IMAGE_QUALITY", "80"))
MAX_IMAGE_ROLES = int(os.getenv("MAX_IMAGE_ROLES", "2"))


def ensure_images_dir(game_dir: Path) -> Path:
    images_dir = game_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    return images_dir


def build_image_plan(user_description: str, client: OpenAI, model_name: str) -> Dict[str, str]:
    prompt = f"""
You are helping generate assets for a very small child-friendly browser game.

User description:
{user_description}

Return ONLY valid JSON.

Rules:
Rules:
- Return a very small dictionary of image roles and prompts
- Return at most 2 roles
- Keep it simple
- Prefer these roles when relevant:
  - player
  - collectible
- Avoid returning many separate character images
- For memory games, one character image is enough
- Prompts should describe cute colorful child-friendly art
- For character/object images, prefer transparent background
- For background, describe a full scene only if really needed
- Each value must be a short image-generation prompt
- Prompts should describe cute colorful child-friendly art
- For character/object images, prefer transparent background
- For background, describe a full scene

Example format:
{{
  "player": "cute purple fairy, full body, cartoon, transparent background",
  "collectible": "shiny gold star, cartoon, transparent background",
  "background": "dreamy purple sky with clouds, cartoon background for kids"
}}
"""

    response = client.chat.completions.create(
        model=model_name,
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Return JSON only."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content
    data = json.loads(content)

    if not isinstance(data, dict):
        return {}

    clean: Dict[str, str] = {}
    for key, value in data.items():
        if isinstance(key, str) and isinstance(value, str) and key.strip() and value.strip():
            clean[key.strip()] = value.strip()

    return clean


def generate_single_image(
    client: OpenAI,
    prompt: str,
    output_path: Path,
    size: str = "1024x1024",
) -> Path:
    result = client.images.generate(
        model=IMAGE_MODEL,
        prompt=prompt,
        size=size,
    )

    image_base64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)

    img = Image.open(BytesIO(image_bytes)).convert("RGBA")
    img.thumbnail((IMAGE_MAX_SIZE, IMAGE_MAX_SIZE))

    output_path = output_path.with_suffix(".webp")
    img.save(output_path, format="WEBP", quality=IMAGE_QUALITY, method=6)

    return output_path


def generate_game_images(
    user_description: str,
    game_dir: Path,
    client: OpenAI,
    model_name: str,
) -> Dict[str, str]:
    images_dir = ensure_images_dir(game_dir)
    image_plan = build_image_plan(user_description, client, model_name)

    preferred_order = ["player", "collectible", "enemy", "background"]

    filtered_plan: Dict[str, str] = {}

    for role in preferred_order:
        if role in image_plan:
            filtered_plan[role] = image_plan[role]
        if len(filtered_plan) >= MAX_IMAGE_ROLES:
            break

    if not filtered_plan:
        for role, prompt in image_plan.items():
            filtered_plan[role] = prompt
            if len(filtered_plan) >= MAX_IMAGE_ROLES:
                break

    generated_paths: Dict[str, str] = {}

    for role, prompt in filtered_plan.items():
        clean_role = role.lower().replace(" ", "_").replace("-", "_")
        filename = f"{clean_role}.png"
        output_path = images_dir / filename

        saved_path = generate_single_image(
            client=client,
            prompt=prompt,
            output_path=output_path,
        )

        generated_paths[role] = f"images/{saved_path.name}"

    return generated_paths