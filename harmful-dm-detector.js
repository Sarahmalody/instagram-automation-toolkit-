// harmful-dm-detector.js
// Scans your Instagram DMs and flags hurtful, abusive, or spammy messages.
// How to use:
//   1. Go to instagram.com and log in
//   2. Open your DMs by clicking the messages icon
//   3. Open Chrome DevTools (F12) and go to the Console tab
//   4. Type: allow pasting  then press Enter
//   5. Set your API key below
//   6. Paste this script and hit Enter

const API_KEY = "YOUR_API_KEY_HERE"; // replace with your actual key
const SCAN_LIMIT = 20; // number of conversations to scan

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function analyzeMessages(senderUsername, messages) {
  const messageText = messages.join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are a content moderation assistant analyzing Instagram DMs for harmful content.

Sender: @${senderUsername}
Messages:
${messageText}

Analyze these messages and respond ONLY with a JSON object:
{
  "risk": "low|medium|high",
  "categories": ["hate_speech"|"cyberbullying"|"threats"|"spam"|"scam"|"sexual"|"none"],
  "summary": "one sentence explanation",
  "worstMessage": "the most concerning message or empty string if none"
}

Be accurate. Not every message is harmful, most are normal. Only flag genuine concerns.`
      }]
    })
  });

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim() || "{}";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { risk: "unknown", categories: [], summary: "could not analyze", worstMessage: "" };
  }
}

function scrapeConversationList() {
  const convEls = [...document.querySelectorAll('div[role="listbox"] > div, div[role="list"] > div')]
    .filter(el => el.querySelector('a[href*="/direct/"]') || el.querySelector('span'));

  return convEls.slice(0, SCAN_LIMIT).map(el => {
    const usernameEl = el.querySelector('span:not([aria-hidden])');
    const previewEl = el.querySelectorAll('span')[1];
    const linkEl = el.querySelector('a');

    return {
      username: usernameEl?.innerText?.trim() || "unknown",
      preview: previewEl?.innerText?.trim() || "",
      href: linkEl?.href || "",
      el
    };
  }).filter(c => c.username !== "unknown" && c.href);
}

function scrapeOpenConversation() {
  const msgEls = [...document.querySelectorAll('div[role="row"] span[dir="auto"], div[class*="message"] span')]
    .filter(el => el.innerText.trim().length > 2);

  return [...new Set(msgEls.map(el => el.innerText.trim()))];
}

async function detectHarmfulDMs() {
  if (API_KEY === "YOUR_API_KEY_HERE") {
    console.log("please set your API key before running");
    return;
  }

  console.log("starting harmful DM scan, make sure you are on the DMs page");
  await sleep(1500);

  const conversations = scrapeConversationList();

  if (conversations.length === 0) {
    console.log("no conversations found, make sure you are on instagram.com/direct/inbox/");
    return;
  }

  console.log("found " + conversations.length + " conversations to scan");

  const report = {
    high: [],
    medium: [],
    low: []
  };

  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];
    console.log("[" + (i + 1) + "/" + conversations.length + "] scanning @" + conv.username);

    conv.el.click();
    await sleep(2000);

    const messages = scrapeOpenConversation();

    if (messages.length === 0) {
      console.log("no messages found in this conversation, skipping");
      continue;
    }

    const quickCheck = conv.preview.toLowerCase();
    const obviouslySafe = quickCheck.length < 3 ||
      ["thanks", "thank you", "hi", "hello", "ok", "okay", "sure", "yes", "no"].includes(quickCheck);

    let result;
    if (obviouslySafe) {
      result = { risk: "low", categories: ["none"], summary: "appears safe", worstMessage: "" };
    } else {
      result = await analyzeMessages(conv.username, messages.slice(-20));
      await sleep(500);
    }

    const entry = {
      username: conv.username,
      risk: result.risk,
      categories: result.categories,
      summary: result.summary,
      worstMessage: result.worstMessage,
      profileUrl: "https://www.instagram.com/" + conv.username + "/"
    };

    if (result.risk === "high") report.high.push(entry);
    else if (result.risk === "medium") report.medium.push(entry);
    else report.low.push(entry);

    await sleep(1000);
  }

  console.log("");
  console.log("scan complete, here are the results");
  console.log("");

  if (report.high.length > 0) {
    console.log("high risk (" + report.high.length + "):");
    report.high.forEach(r => {
      console.log("  @" + r.username);
      console.log("  " + r.summary);
      console.log("  categories: " + r.categories.join(", "));
      if (r.worstMessage) console.log('  "' + r.worstMessage + '"');
      console.log("  " + r.profileUrl);
      console.log("");
    });
  }

  if (report.medium.length > 0) {
    console.log("medium risk (" + report.medium.length + "):");
    report.medium.forEach(r => {
      console.log("  @" + r.username);
      console.log("  " + r.summary);
      console.log("  categories: " + r.categories.join(", "));
      console.log("  " + r.profileUrl);
      console.log("");
    });
  }

  console.log("low risk: " + report.low.length + " conversations appear safe");
  console.log("");
  console.log("total scanned: " + conversations.length + ", high: " + report.high.length + ", medium: " + report.medium.length + ", low: " + report.low.length);

  return report;
}

detectHarmfulDMs();
