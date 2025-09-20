const os = require("os");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");


let executablePath = "";
if(os.platform() === "win32") executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
if(os.platform() === "linux") executablePath = "/usr/bin/chromium"

module.exports = async () => {
  try {
    const options = {
        executablePath: executablePath,
      headless: false,
      devtools: false,
      ignoreHTTPSErrors: true,
      args: [
        "--start-maximized",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--ignore-certificate-errors",
      ],
      ignoreDefaultArgs: ["--enable-automation"],
      slowMo: 10,
    };
    await puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch(options);
    const browserWSEndpoint = await browser.wsEndpoint();
    console.log("browserWSEndpoint----- :> ", browserWSEndpoint);
    await browser.disconnect();
    return browserWSEndpoint;
  } catch (err) {
    console.error(err);
    process.exit(1);
    return false;
  }
};
