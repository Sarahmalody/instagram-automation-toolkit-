// auto-reply-comments.js
// Reads all comments on the currently open Instagram post
// and generates a reply to each one.
// How to use:
//   1. Go to instagram.com and log in
//   2. Open a post so the comments are visible
//   3. Open Chrome DevTools (F12) and go to the Console tab
//   4. Type: allow pasting  then press Enter
//   5. Set your API key and preferred tone below
//   6. Paste this script and hit Enter
//
// Set DRY_RUN to true first to preview replies without posting them.
// Once you are happy with the output, set it to false to actually post.

const API_KEY = "YOUR_API_KEY_HERE"; // replace with your actual key
const REPLY_TONE = "friendly, warm, and encouraging";
const DRY_RUN = true;
const DELAY_BETWEEN_REPLIES_MS = 8000;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function generateReply(username, commentText) {
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
      max_tokens: 100,
      messages: [{
        role: "user",
        content: `You are managing an Instagram account called Jalebi Art Club, a cozy art community in Bangalore that meets every Saturday.

Someone commented on your post:
@${username}: "${commentText}"

Write a ${REPLY_TONE} Instagram reply to this comment.
Rules:
- Keep it under 20 words
- Be genuine, not generic
- Do not use hashtags
- Do not use emojis unless they feel very natural
- Just reply directly, no preamble

Reply:`
      }]
    })
  });

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || "Thank you so much!";
}

function scrapeComments() {
  const commentEls = [...document.querySelectorAll('ul[class*="comment"] li, div[role="button"] ~ ul li')]
    .filter(el => el.querySelector('span[dir="auto"]'));

  const comments = [];

  commentEls.forEach(el => {
    const usernameEl = el.querySelector('a[href^="/"]');
    const textEl = el.querySelector('span[dir="auto"]');

    if (usernameEl && textEl) {
      const username = usernameEl.innerText.trim();
      const text = textEl.innerText.trim();

      if (text.length > 1 && username) {
        comments.push({ username, text, el });
      }
    }
  });

  return comments;
}

async function clickReplyButton(commentEl) {
  const replyBtn = [...commentEl.querySelectorAll('button, span')]
    .find(el => el.innerText.trim().toLowerCase() === 'reply');

  if (replyBtn) {
    replyBtn.click();
    await sleep(1000);
    return true;
  }
  return false;
}

async function typeReply(text) {
  const input = document.querySelector('textarea[placeholder*="reply"], textarea[placeholder*="Reply"], textarea[aria-label*="reply"]')
    || document.querySelector('form textarea');

  if (!input) return false;

  input.focus();
  await sleep(300);

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  nativeInputValueSetter.call(input, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(500);

  return true;
}

async function submitReply() {
  const submitBtn = [...document.querySelectorAll('button')]
    .find(btn => btn.innerText.trim().toLowerCase() === 'post' || btn.getAttribute('type') === 'submit');

  if (submitBtn && !submitBtn.disabled) {
    submitBtn.click();
    await sleep(1500);
    return true;
  }
  return false;
}

async function autoReplyComments() {
  if (API_KEY === "YOUR_API_KEY_HERE") {
    console.log("please set your API key before running");
    return;
  }

  console.log("starting auto-reply, dry run is set to " + DRY_RUN);
  console.log("make sure a post is open with comments visible");
  await sleep(1500);

  for (let i = 0; i < 5; i++) {
    window.scrollBy(0, 800);
    await sleep(1500);
  }

  const comments = scrapeComments();
  console.log("found " + comments.length + " comments to reply to");

  if (comments.length === 0) {
    console.log("no comments found, make sure a post is open");
    return;
  }

  let replied = 0;
  let failed = 0;

  for (const comment of comments) {
    console.log("@" + comment.username + ": " + comment.text);

    const reply = await generateReply(comment.username, comment.text);
    console.log("generated reply: " + reply);

    if (DRY_RUN) {
      console.log("dry run, not posting");
      replied++;
      continue;
    }

    const clicked = await clickReplyButton(comment.el);
    if (!clicked) {
      console.log("could not find reply button, skipping");
      failed++;
      continue;
    }

    const typed = await typeReply(reply);
    if (!typed) {
      console.log("could not find reply input, skipping");
      failed++;
      continue;
    }

    const submitted = await submitReply();
    if (submitted) {
      console.log("reply posted");
      replied++;
    } else {
      console.log("could not submit reply");
      failed++;
    }

    await sleep(DELAY_BETWEEN_REPLIES_MS);
  }

  console.log("done, replied to " + replied + " comments, failed on " + failed);
  if (DRY_RUN) console.log("set DRY_RUN to false to actually post replies");
}

autoReplyComments();
