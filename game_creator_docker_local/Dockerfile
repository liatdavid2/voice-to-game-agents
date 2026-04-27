FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

COPY . /app
RUN mkdir -p /app/workspace/games

ENV HOST=0.0.0.0
ENV PORT=5000
ENV REPO_PATH=/app/workspace
ENV PUBLISH_TO_GIT=false
ENV GENERATE_IMAGES=false

EXPOSE 5000

CMD ["python", "voice_game_launcher.py"]
