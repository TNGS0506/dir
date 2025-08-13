const puppeteer = require("puppeteer-extra");
const launch = require("./launch");
const fs = require("fs");
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

// Get WsEndpoint
async function getWsEndpoint() {
    let wsEndpoint = await launch();
    return wsEndpoint;
}

// column widths for fixed-width formatting
const colWidths = {
    f: 8,        // crash multiplier
    date: 16,    // date/time
    count: 8,
    baga: 6,
    ih: 6,
    avg: 8,
    temdeg: 6,
    diff: 6
};

// helper pad function
const pad = (value, width) => String(value).padEnd(width, " ");

(async () => {
    const browser = await puppeteer.connect({
        browserWSEndpoint: await getWsEndpoint(),
        defaultViewport: null,
    });

    let page = await browser.newPage();
    await page.goto("https://mongolia-melbet.org/en/games/crash");

    const client = await page.target().createCDPSession();
    await client.send("Network.enable");

    let count = 0;
    let baga = 0;
    let ih = 0;
    let total = 0;
    let avg = 0;
    let day = "";

    client.on(
        "Network.webSocketFrameReceived",
        ({ response }) => {
            let payloadString = response.payloadData.toString("utf8");

            try {
                if (payloadString.includes('"target":"OnCrash"')) {
                    payloadString = payloadString.replace(/[^\x20-\x7E]/g, "");
                    const payload = JSON.parse(payloadString);

                    const date = new Date();
                    const d = date.getDate();
                    const h = date.getHours();
                    const m = date.getMinutes();
                    const s = date.getSeconds();

                    let temdeg = "";
                    const { f } = payload.arguments[0];

                    if (day != h) {
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
                    avg = total / count;
                    let truncated = Math.floor(avg * 100) / 100;
                    let diff = ih - baga;

                    const dateStr = `${d}___${h}:${m}:${s}`;

                    // formatted line
                    const line =
                        pad(f, colWidths.f) +
                        pad(dateStr, colWidths.date) +
                        pad(count, colWidths.count) +
                        pad(baga, colWidths.baga) +
                        pad(ih, colWidths.ih) +
                        pad(truncated, colWidths.avg) +
                        pad(temdeg, colWidths.temdeg) +
                        pad(diff, colWidths.diff);

                    // print aligned output
                    console.log(line);

                    // save aligned output to file
                    fs.appendFile(`./datas/${d}_${h}_data.txt`, line + "\n", (err) => {
                        if (err) throw err;
                    });
                }
            } catch (error) {
                console.error("Error processing WebSocket frame:", error);
            }
        }
    );

    while (true) {
        await page.keyboard.press("Tab");
        await wait(100000);
        await page.keyboard.press("ArrowDown");
        await wait(100000);
    }
})();
