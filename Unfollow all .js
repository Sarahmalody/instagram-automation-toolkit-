// unfollow-all.js
// Opens the Following modal on your profile before running this.
// How to use:
//   1. Go to your Instagram profile
//   2. Click on "X following" to open the following list
//   3. Open Chrome DevTools (F12) and go to the Console tab
//   4. Type: allow pasting  then press Enter
//   5. Paste this script and hit Enter

async function unfollowAll() {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  let count = 0;
  let noButtonStreak = 0;

  while (true) {
    const followingButtons = [...document.querySelectorAll("button")]
      .filter(btn => btn.innerText.trim() === "Following");

    console.log("found " + followingButtons.length + " buttons this round");

    if (followingButtons.length === 0) {
      noButtonStreak++;
      if (noButtonStreak >= 5) {
        console.log("looks like we are done, unfollowed " + count + " accounts this session");
        console.log("if the count is still not 0 on your profile, wait 15-30 mins and run again");
        break;
      }
    } else {
      noButtonStreak = 0;

      for (const btn of followingButtons) {
        btn.click();
        await sleep(1000);

        const confirmButton = [...document.querySelectorAll("button")]
          .find(b => b.innerText.trim() === "Unfollow");

        if (confirmButton) {
          confirmButton.click();
          count++;
          const delay = Math.floor(Math.random() * 4000) + 5000;
          console.log("unfollowed " + count + ", waiting " + (delay / 1000).toFixed(1) + "s");
          await sleep(delay);
        } else {
          console.log("confirm dialog didnt show up, skipping this one");
          document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
          );
          await sleep(1000);
        }
      }
    }

    const scrollableElements = [...document.querySelectorAll('div[role="dialog"] div')]
      .filter(d => d.scrollHeight > d.clientHeight);
    scrollableElements.forEach(el => (el.scrollTop += 800));
    await sleep(4000);
  }
}

unfollowAll();
