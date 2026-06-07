// risky-followers.js
// Scans your followers list and flags potentially fake or suspicious accounts.
// How to use:
//   1. Go to your Instagram profile
//   2. Click on "X followers" to open the followers list
//   3. Open Chrome DevTools (F12) and go to the Console tab
//   4. Type: allow pasting  then press Enter
//   5. Paste this script and hit Enter

const CLAUDE_API_KEY = "YOUR_API_KEY_HERE"; // replace this with your actual key

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function heuristicCheck(account) {
  let score = 0;
  const reasons = [];

  if (/\d{4,}/.test(account.username)) {
    score += 2;
    reasons.push("username has a lot of numbers");
  }

  if ((account.username.match(/_/g) || []).length > 2) {
    score += 1;
    reasons.push("username has too many underscores");
  }

  if (account.noProfilePic) {
    score += 2;
    reasons.push("no profile picture");
  }

  if (account.posts === 0) {
    score += 3;
    reasons.push("zero posts");
  }

  if (account.following > 1000 && account.followers < 50) {
    score += 3;
    reasons.push("follows a lot but barely has any followers");
  }

  if (!account.bio || account.bio.trim() === "") {
    score += 1;
    reasons.push("empty bio");
  }

  return { score, reasons };
}

async function analyzeWithAI(accounts) {
  const accountList = accounts
    .map(a => `Username: ${a.username}, Bio: "${a.bio || "(empty)"}"`)
    .join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are analyzing Instagram accounts for spam or bot signals.
For each account below, respond ONLY with a JSON array like:
[{"username": "...", "aiRisk": "low|medium|high", "aiReason": "..."}]

Accounts:
${accountList}`
      }]
    })
  });

  const data = await response.json();
  const text = data.content.map(c => c.text || "").join("");

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    console.log("could not parse AI response, skipping AI analysis");
    return [];
  }
}

function scrapeVisibleFollowers() {
  const rows = [...document.querySelectorAll('div[role="dialog"] li, div[role="dialog"] div[style*="height"]')]
    .filter(el => el.querySelector('a[href^="/"]'));

  return rows.map(row => {
    const usernameEl = row.querySelector('a[href^="/"] span') || row.querySelector('a[href^="/"]');
    const username = usernameEl?.innerText?.trim() || "unknown";
    const img = row.querySelector('img');
    const noProfilePic = !img || img.src.includes("placeholder") || img.alt === "";

    return {
      username,
      noProfilePic,
      bio: "",
      posts: null,
      followers: null,
      following: null
    };
  }).filter(a => a.username !== "unknown");
}

async function detectRiskyFollowers() {
  console.log("starting risky follower scan, make sure the followers modal is open");
  await sleep(1000);

  let lastCount = 0;
  for (let i = 0; i < 10; i++) {
    const scrollTargets = [...document.querySelectorAll('div[role="dialog"] div')]
      .filter(d => d.scrollHeight > d.clientHeight);
    scrollTargets.forEach(el => (el.scrollTop += 1000));
    await sleep(2000);

    const current = scrapeVisibleFollowers().length;
    console.log("loaded " + current + " followers so far");
    if (current === lastCount) break;
    lastCount = current;
  }

  const accounts = scrapeVisibleFollowers();
  console.log("analyzing " + accounts.length + " followers");

  const results = [];

  for (const account of accounts) {
    const { score, reasons } = heuristicCheck(account);
    results.push({ ...account, score, reasons });
  }

  if (CLAUDE_API_KEY !== "YOUR_API_KEY_HERE") {
    console.log("running AI analysis on flagged accounts");
    const batchSize = 10;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      const aiResults = await analyzeWithAI(batch);

      aiResults.forEach(ai => {
        const match = results.find(r => r.username === ai.username);
        if (match) {
          match.aiRisk = ai.aiRisk;
          match.aiReason = ai.aiReason;
          if (ai.aiRisk === "high") match.score += 3;
          if (ai.aiRisk === "medium") match.score += 1;
        }
      });

      await sleep(1000);
    }
  }

  results.sort((a, b) => b.score - a.score);
  const risky = results.filter(r => r.score >= 3);

  console.log("found " + risky.length + " potentially risky followers");
  console.log("");

  risky.forEach(r => {
    console.log("@" + r.username + " — risk score: " + r.score);
    r.reasons.forEach(reason => console.log("  - " + reason));
    if (r.aiRisk) console.log("  AI verdict: " + r.aiRisk + " — " + r.aiReason);
    console.log("");
  });

  console.log("done, review the accounts above and remove as needed");
  return risky;
}

detectRiskyFollowers();
