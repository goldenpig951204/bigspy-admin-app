const settingModel = require("../models/setting");
const dvAxios = require("devergroup-request").default;
const axios = new dvAxios({
    axiosOpt: {
        timeout: 30000
    }
});
const { paraphraserLog } = require("../services/logger");
const { get } = require("lodash");

const login = async (req, res) => {
    let { email, password } = req.body;
    try {
        let body = `email=${email}&password=${password}&proid=0`;
        response = await axios.instance.post(
            "https://www.paraphraser.io/login",
            body,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Content-Length": Buffer.byteLength(body),
                    "Host": "www.paraphraser.io",
                    "Origin": "https://www.paraphraser.io",
                    "Referer": "https://www.paraphraser.io",
                    "X-Requested-With": "XMLHttpRequest"
                }
            }
        );
        if (response.data && response.data.id !== undefined) {
            let cookie = axios.cookieJar.getCookieStringSync("https://www.paraphraser.io");
            await settingModel.findOneAndUpdate(null, {
                paraphraserCookie: cookie
            }, {
                upsert: true
            });
            paraphraserLog.info(`Start session with ${email} successfully.`);
            res.send('Login successfully.');
        } else {
            res.status(500).send("Credential is incorrect.");
        }
    } catch (err) {
        console.log(err);
        paraphraserLog.error(`Start session with ${email} failed: ${get(err, "response.data.message") || err.toString()}`);
        res.status(500).send(get(err, "response.data.message") || err.toString());
    }
}

module.exports = {
    login
};