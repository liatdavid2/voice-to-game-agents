import base64
import json
from pathlib import Path
from typing import Dict, List, Optional

from openai import OpenAI


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
- Return a small dictionary of image roles and prompts
- Keep it simple
- Prefer these roles when relevant:
  - player
  - collectible
  - enemy
  - background
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
) -> None:
    result = client.images.generate(
        model="gpt-image-1-mini",
        prompt=prompt,
        size=size,
    )

    image_base64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)
    output_path.write_bytes(image_bytes)


def generate_game_images(
    user_description: str,
    game_dir: Path,
    client: OpenAI,
    model_name: str,
) -> Dict[str, str]:
    images_dir = ensure_images_dir(game_dir)
    image_plan = build_image_plan(user_description, client, model_name)

    generated_paths: Dict[str, str] = {}

    for role, prompt in image_plan.items():
        filename = f"{role}.png"
        output_path = images_dir / filename

        generate_single_image(
            client=client,
            prompt=prompt,
            output_path=output_path,
        )

        generated_paths[role] = f"images/{filename}"

    return generated_paths