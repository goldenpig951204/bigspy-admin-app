const settingModel = require("../models/setting");
const dvAxios = require("devergroup-request").default;
const axios = new dvAxios({
    axiosOpt: {
        timeout: 30000
    }
});
const parseHTML = require("jquery-html-parser");
const { buzzsumoLog } = require("../services/logger");
const { get } = require("lodash");

const login = async (req, res) => {
    let { email, password } = req.body;
    try {
        let response = await axios.instance.get("https://app.buzzsumo.com/login");
        let $ = parseHTML(response.data);
        let token = $("meta[name='csrf-token']").attr("content");
        let cookie = axios.cookieJar.getCookieStringSync("https://app.buzzsumo.com");
        let body = JSON.stringify({ email, password });
        response = await axios.instance.post(
            "https://app.buzzsumo.com/login",
            body,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
                    "Content-Type": "application/json; charset=UTF-8",
                    "Content-Length": Buffer.from(body, 'utf-8'),
                    "Host": "app.buzzsumo.com",
                    "Cookie": cookie,
                    "X-Csrf-Token": token,
                    "X-Request-Width": "XMLHttpRequest"

                }
            }
        );
        if (response.data && response.data.redirectTo !== undefined) {
            let cookie = axios.cookieJar.getCookieStringSync(response.data.redirectTo);
            await settingModel.findOneAndUpdate(null, {
                buzzsumoCookie: cookie
            }, {
                upsert: true
            });
            buzzsumoLog.info(`Start session with ${email} successfully.`);
            res.send("Login successfully.");
        } else {
            res.status(500).send("Credential is incorrect.");
        }
    } catch (err) {
        console.log(err);
        buzzsumoLog.error(`Start session with ${email} failed: ${get(err, "response.data.message") || err.toString()}`);
        res.status(500).send(get(err, "response.data.message") || err.toString());
    }
}

module.exports = {
    login
};