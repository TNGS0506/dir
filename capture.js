const puppeteer = require("puppeteer-extra");
const launch = require("./launch");
const fs = require("fs");
const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const { emitCrashData } = require("./server");

async function getWsEndpoint() {
  let wsEndpoint = await launch();
  return wsEndpoint;
}

// column widths for fixed-width formatting
const colWidths = {
  f: 8, // crash multiplier
  date: 16, // date/time
  count: 8,
  baga: 6,
  ih: 6,
  avg: 8,
  temdeg: 6,
  diff: 6,
};

// helper pad function
const pad = (value, width) => String(value).padEnd(width, " ");

async function startScraper() {
  let browser, page, client;
  try {
    const startTime = Date.now();
    let timer = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);
      process.stdout.write(`\r⏳ Elapsed: ${elapsed}s`);
    }, 50);

    browser = await puppeteer.connect({
      browserWSEndpoint: await getWsEndpoint(),
      defaultViewport: null,
    });


      const id = '1331407561'            /// Id
      const password = 'dqrme8D2'        ///PASSWORD

    page = await browser.newPage();
    await page.goto("https://mongolia-melbet.com/en/games/crash");

    await page.waitForSelector(".auth-dropdown-trigger");
    await page.click(".auth-dropdown-trigger");

    await page.waitForSelector(".auth-form-extended");
    await page.click(".auth-form-extended-tabs__item");

    await page.waitForSelector(".auth-form-extended-fields__input");

    await page.type('input[name="username"]', id);

    await page.waitForSelector(".auth-form-extended-fields__input");
    
    await page.type('input[name="username-password"]', password);    
    await page.waitForSelector("button.ui-button--theme-accent");
    await page.click("button.ui-button--theme-accent");

    await page.waitForSelector(".ui-input__field");
    await page.type(
      'input[class="ui-input__field ui-input-field"]',
      "gamtulga"
    );

    await page.waitForSelector("button.user-verify-app__submit");
    await page.click("button.user-verify-app__submit");
    await page.goto("https://mongolia-melbet.org/en/games/crash");

    client = await page.target().createCDPSession();
    await client.send("Network.enable");

    clearInterval(timer);
    const totalsda = ((Date.now() - startTime) / 1000).toFixed(3);
    console.log(`\n✅ SUCCESS reached in ${totalsda} seconds.`);
    console.log("🟢 Connected to browser & page");
    console.log("🟢 The Scrape has begun");

    let multipliers = []; 
    let count = 0;
    let baga = 0;
    let ih = 0;
    let total = 0;

    let day = "";

    client.on("Network.webSocketFrameReceived", ({ response }) => {
      let payloadString = response.payloadData.toString("utf8");

      try {
        if (payloadString.includes('"target":"OnCrash"')) {
          payloadString = payloadString.replace(/[^\x20-\x7E]/g, "");
          const payload = JSON.parse(payloadString);
          const { f } = payload.arguments[0];

          const date = new Date();
          const month = date.getMonth();
          const d = date.getDate();
          const h = date.getHours();
          const m = date.getMinutes();
          const s = date.getSeconds();

          
          multipliers.push(f);

          let temdeg = "";
          if (day !== h) {
            count = 0;
            baga = 0;
            ih = 0;
            total = 0;
            avg = 0;
            day = h;
          }

          count += 1;
          if (f <= 1.99) {
            baga += 1;
            temdeg = "---";
          } else {
            ih += 1;
            temdeg = "+++";
          }

          const fNum = Number(f);
          total += fNum;
          const median = Math.floor(getMedian(multipliers) * 100) / 100;
          const diff = ih - baga;
          const dateStr = `${month}.${d}___${h}:${m}:${s}`;

          const line =
            pad(f, colWidths.f) +
            pad(dateStr, colWidths.date) +
            pad(count, colWidths.count) +
            pad(baga, colWidths.baga) +
            pad(ih, colWidths.ih) +
            pad(median, colWidths.avg) +
            pad(temdeg, colWidths.temdeg) +
            pad(diff, colWidths.diff);

          emitCrashData({
            f,
            avg: median,
            count,
            baga,
            ih,
            diff,
            temdeg,
            dateStr,
            timestamp: Date.now(),
          });

          fs.appendFile(`./09_16/${d}_${h}_data.txt`, line + "\n", (err) => {
            if (err) throw err;
          });
        }
      } catch (error) {
        console.error("❌ WebSocket processing error:", error);
      }
    });

    // Simulate interaction to keep page alive
    while (true) {
      await page.keyboard.press("Tab");
      await wait(100000);
      await page.keyboard.press("ArrowDown");
      await wait(100000);
    }
  } catch (error) {
    console.error("🔌 Connection lost or error:", error.message);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.warn("⚠️ Couldn't close browser:", e.message);
      }
    }
    console.log("🔁 Reconnecting in 10 seconds...");
    await wait(10000);
    return startScraper(); // Recursive restart
  }
}
startScraper();




function getMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}


