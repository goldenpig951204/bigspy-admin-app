const settingModel = require("../models/setting");
const dvAxios = require("devergroup-request").default;
const axios = new dvAxios({
    axiosOpt: {
        timeout: 30000
    }
});
const parseHTML = require("jquery-html-parser");
const { articleforgeLog } = require("../services/logger");
const { get } = require("lodash");

const login = async (req, res) => {
    let { email, password } = req.body;
    try {
        let response = await axios.instance.get("https://af.articleforge.com/users/sign_in");
        let $ = parseHTML(response.data);
        let token = $("meta[name='csrf-token']").attr("content");
        let body = `utf8=✓&authenticity_token=${token}&user[email]=${email}&user[password]=${password}&user[remember_me]=1`;
        response = await axios.instance.post(
            "https://af.articleforge.com/users/sign_in",
            body,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": Buffer.from(body, 'utf-8'),
                    "Host": "af.articleforge.com",
                    "Referer": "https://af.articleforge.com/users/sign_in"
                }
            }
        );
        $ = parseHTML(response.data);
        if ($("title").text() == "Home - Article Forge") {
            let cookie = axios.cookieJar.getCookieStringSync("https://af.articleforge.com");
            await settingModel.findOneAndUpdate(null, {
                articleforgeCookie: cookie
            }, {
                upsert: true
            });
            articleforgeLog.info(`Start session with ${email} successfully.`);
            res.send("Login successfully.");
        } else {
            res.status(500).send("Credential is incorrect.");
        }
    } catch (err) {
        articleforgeLog.error(`Start session with ${email} failed: ${get(err, "response.data.message") || err.toString()}`);
        res.status(500).send(get(err, "response.data.message") || err.toString());
    }
}

module.exports = {
    login
};