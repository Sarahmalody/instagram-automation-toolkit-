# instagram-automation-toolkit

We've all been there. You accidentally followed half the internet, your followers list is full of bots and creeps you never noticed, comments are piling up with no time to reply, and your DMs are a mess. This toolkit handles all of that straight from your browser console, no installs, no third-party apps, no shady extensions.

Just open DevTools, paste the script, and let it run.

---

## What's inside

| Script | What it does |
|---|---|
| `unfollow-all.js` | Unfollows every account on your following list |
| `risky-followers.js` | Scans your followers and flags bots, fakes, and suspicious accounts |
| `follow-from-target.js` | Sends follow requests to all followers of any target account |
| `auto-reply-comments.js` | Reads comments on a post and generates a reply to each one |
| `harmful-dm-detector.js` | Goes through your DMs and flags hurtful, abusive, or spammy messages |

---

## How to run any script

1. Go to [instagram.com](https://instagram.com) and log in
2. Navigate to the right page (each script has instructions at the top)
3. Press `F12` to open Chrome DevTools
4. Click the **Console** tab
5. Type `allow pasting` and press Enter
6. Paste the script and press Enter

That's it.

---

## A note on Instagram's rate limits

Instagram limits how many actions your account can perform in a short period. If a script slows down or stops before finishing, that's Instagram throttling you, not a bug. Just wait 15-30 minutes and run it again. The scripts already use random delays between actions to mimic human behaviour and reduce the chance of getting flagged.

For accounts with a large following list, you may need to run `unfollow-all.js` across a few sessions.

---

## Scripts that use AI

`risky-followers.js`, `auto-reply-comments.js`, and `harmful-dm-detector.js` use an AI API for smarter analysis. To use them, grab an API key and replace `YOUR_API_KEY_HERE` at the top of the script with your actual key.

---

## Disclaimer

These scripts interact with Instagram's frontend UI and are intended for personal use only. Use them responsibly and at your own risk. The authors are not responsible for any account restrictions or bans that may result from misuse.
