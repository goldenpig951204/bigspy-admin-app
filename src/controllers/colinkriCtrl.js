const settingModel = require("../models/setting");
const dvAxios = require("devergroup-request").default;
const captcha = require("2captcha");
const axios = new dvAxios({
    axiosOpt: {
        timeout: 30000
    }
});
const parseHTML = require("jquery-html-parser");
const { colinkriLog } = require("../services/logger");
const { get } = require("lodash");

const login = async (req, res) => {
    let { email, password } = req.body;
    try {
        let response = await axios.instance.get("https://www.colinkri.com/amember/login");
        let $ = parseHTML(response.data);
        let login_attempt_id = $("[name='login_attempt_id']").val();
        let amember_redirect_url = $("[name='amember_redirect_url']").val();
        let siteKey = "6LcewbwUAAAAAPoM6VrEtPisdEctvKF1FVRHd9Iv";
        let solver = new captcha.Solver("1cca50f7c9ce7bacaa1cb447e3ec2bbd");
        let { data } = await solver.recaptcha(siteKey, "https://www.colinkri.com/amember/login");
        let body = `g-recaptcha-response=${data}&amember_login=${email}&amember_pass=${password}&login_attempt_id=${login_attempt_id}&amember_redirect_url=${amember_redirect_url}`;
        response = await axios.instance.post(
            "https://www.colinkri.com/amember/login",
            body,
            {
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
                    "content-type": "application/x-www-form-urlencoded",
                    "content-length": Buffer.byteLength(body),
                }
            }
        );
        if (response.data && response.data.ok) {
            let cookie = axios.cookieJar.getCookieStringSync("https://www.colinkri.com/amember/crawler");
            await settingModel.findOneAndUpdate(null, {
                colinkriCookie: cookie
            }, {
                upsert: true
            });
            colinkriLog.info(`Start session with ${email} successfully.`);
            res.send("Login successfully.");
        } else {
            res.status(500).send("Credential is incorrect.");
        }
    } catch (err) {
        conlinkriLog.error(`Start session with ${email} failed: ${get(err, "response.data.message") || err.toString()}`);
        res.status(500).send(get(err, "response.data.message") || err.toString());
    }
}

module.exports = {
    login
};