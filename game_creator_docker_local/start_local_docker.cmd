@echo off
if not exist .env copy .env.example .env
if not exist workspace\games mkdir workspace\games

docker compose up --build
