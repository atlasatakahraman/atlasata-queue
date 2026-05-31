import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: path.join(__dirname, "../.env.local") });

async function testRiot() {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    console.error("No API Key");
    return;
  }

  const region = "tr1";
  const puuid = "HQ5Zry2Xv7XZHXFbPzqBUvfHomt0pn6UUokz5pwRWwbEaXnKfoftnnF12mmXyQJRrjfSTDBTWptGaQ";

  console.log("Testing Riot API Summoner-v4 for puuid", puuid);

  const summonerUrl = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  const summonerRes = await fetch(summonerUrl, {
    headers: { "X-Riot-Token": apiKey }
  });

  if (!summonerRes.ok) {
    console.error("Summoner fetch failed:", summonerRes.status, await summonerRes.text());
    return;
  }

  const summoner = await summonerRes.json();
  console.log("Summoner data keys:", Object.keys(summoner));
  console.log("Summoner data:", summoner);
  console.log("Summoner ID:", summoner.id);
}

testRiot();
