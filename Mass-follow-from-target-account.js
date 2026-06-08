// follow-from-target.js
// Follows all followers of a target account.
// How to use:
//   1. Go to the target account's profile on Instagram
//   2. Click on their "X followers" to open their followers list
//   3. Open Chrome DevTools (F12) and go to the Console tab
//   4. Type: allow pasting  then press Enter
//   5. Set the TARGET_USERNAME below to the account you are pulling from
//   6. Paste this script and hit Enter

const TARGET_USERNAME = "target_account_here"; // replace with the account username
const DELAY_MIN_MS = 5000;
const DELAY_MAX_MS = 9000;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomDelay() {
  return Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS)) + DELAY_MIN_MS;
}

async function followFromTarget() {
  console.log("starting follow-from-target for @" + TARGET_USERNAME);
  console.log("make sure their followers modal is open");
  await sleep(1500);

  let count = 0;
  let skipped = 0;
  let noNewButtons = 0;

  while (true) {
    const buttons = [...document.querySelectorAll("button")]
      .filter(btn => btn.innerText.trim() === "Follow");

    console.log("found " + buttons.length + " follow buttons this round");

    if (buttons.length === 0) {
      noNewButtons++;
      if (noNewButtons >= 5) {
        console.log("looks like we are done, sent " + count + " follow requests, skipped " + skipped);
        break;
      }
    } else {
      noNewButtons = 0;

      for (const btn of buttons) {
        const inDialog = btn.closest('div[role="dialog"]');
        if (!inDialog) {
          skipped++;
          continue;
        }

        btn.click();
        count++;

        const delay = randomDelay();
        console.log("follow request sent " + count + ", waiting " + (delay / 1000).toFixed(1) + "s");
        await sleep(delay);
      }
    }

    const scrollTargets = [...document.querySelectorAll('div[role="dialog"] div')]
      .filter(d => d.scrollHeight > d.clientHeight);
    scrollTargets.forEach(el => (el.scrollTop += 800));
    await sleep(3500);
  }
}

followFromTarget();
