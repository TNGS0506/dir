const puppeteer = require("puppeteer-extra");
const launch = require("./launch");
const fs = require("fs");
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

//get WsEndpoint
async function getWsEndpoint() {
    let wsEndpoint = await launch();
    return wsEndpoint;
}

(async () => {
    const browser = await puppeteer.connect({
        browserWSEndpoint: await getWsEndpoint(),
        defaultViewport: null,
    });

    let page = await browser.newPage();
    await page.goto("https://melbet.org/en/games/crash");

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
        ({ requestId, timestamp, response }) => {
            let payloadString = response.payloadData.toString("utf8");

            try {
                if (payloadString.includes('"target":"OnCrash"')) {
                    payloadString = payloadString.replace(/[^\x20-\x7E]/g, "");
                    const payload = JSON.parse(payloadString);
                    count += 1;

                    const date = new Date();
                    const d = date.getDate();
                    const h = date.getHours();
                    const m = date.getMinutes();
                    const s = date.getSeconds();

                    let temdeg = "";

                    const { l, f, ts } = payload.arguments[0];

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

                    console.log(
                        f,
                        d,
                        ":",
                        h,
                        ":",
                        m,
                        ":",
                        s,
                        " Нийт:",
                        count,
                        "X:",
                        baga,
                        " ",
                        "W:",
                        ih,
                        " AVG:",
                        truncated,
                        " ",
                        temdeg
                    );
                    const csvData = `${f} ${d}:${h}:${m}:${s} Нийт:${count} X:${baga} W:${ih} ${truncated} ${temdeg}\n`;

                    fs.appendFile(
                        `./datas/${d}_${h}_data.csv`,
                        csvData,
                        (err) => {
                            if (err) throw err;
                        }
                    );
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
