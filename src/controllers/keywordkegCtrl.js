const settingModel = require("../models/setting");
const { keywordkegLog } = require("../services/logger");
const { get } = require("lodash");
const puppeteer = require("puppeteer-extra");

const login = async (req, res) => {
    let { email, password } = req.body;
    try {
        const windowsLikePathRegExp = /[a-z]:\\/i;
        let inProduction = false;

        if (! windowsLikePathRegExp.test(__dirname)) {
            inProduction = true;
        }
        let options = {};
        if (inProduction) {
            options = {
                headless : true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--media-cache-size=0',
                    '--disk-cache-size=0',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                ],
                timeout: 100000,
            };
        } else {
            options = {
                headless : false,
                timeout: 100000,
                args: [
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                ],
            };
        }
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.goto('https://app.keywordkeg.com/auth/login', {waitUntil: 'load', timeout: 100000});
        await page.focus("input#input-email").then(async () => {
            await page.keyboard.type(email, { delpay: 100 });
        });
        await page.focus("input#input-password").then(async () => {
            await page.keyboard.type(password, { delpay: 100 });
        });
        await Promise.all([
            page.waitForNavigation({waitUntil: 'load', timeout : 100000}),
            page.click('form button')
        ]).then(async (result) => {
            if (/auth\/login/.test(page.url())) {
                keywordkegLog.error(`Start session with ${email} failed.`);
                res.status(500).send("Credential is incorrect.");
            } else {
                let cookies = await page.cookies();
                await browser.close(true);
                let cookie = "";
                for(let idx in cookies) {
                    cookie += cookies[idx].name + "=" + cookies[idx].value + "; ";
                }
                console.log(cookie);
                await settingModel.findOneAndUpdate(null, {
                    keywordkegCookie: cookie
                }, {
                    upsert: true
                });
                keywordkegLog.info(`Start session with ${email} successfully.`);
                res.send("Login successfully.");
            }
        });
    } catch (err) {
        keywordkegLog.error(`Start session with ${email} failed: ${get(err, "response.data.message") || err.toString()}`);
        res.status(500).send(get(err, "response.data.message") || err.toString());
    }
}

module.exports = {
    login
};