const settingModel = require("../models/setting");
const dvAxios = require("devergroup-request").default;
const axios = new dvAxios({
    axiosOpt: {
        timeout: 30000
    }
});
const parseHTML = require("jquery-html-parser");
const { bigspyLog } = require("../services/logger");
const { get } = require("lodash");

const login = async (req, res) => {
    let { email, password, fingerprint } = req.body;
    try {
        let response = await axios.instance.get("https://bigspy.com/user/login");
        let $ = parseHTML(response.data);
        let _csrf = $("[name='_csrf']").val();
        let returnUrl = $("[name='LoginForm[returnUrl]']").val();
        let sig = $("[name='LoginForm[sig]']").val();
        let body = `_csrf=${_csrf}&LoginForm[username]=${email}&LoginForm[password]=${password}&LoginForm[rememberMe]=1&LoginForm[returnUrl]=${returnUrl}&LoginForm[fingerprint]=${fingerprint}&LoginForm[sig]=${sig}`;
        response = await axios.instance.post(
            "https://bigspy.com/user/login",
            body,
            {
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
                    "content-type": "application/x-www-form-urlencoded",
                    "content-length": Buffer.byteLength(body),
                }
            }
        );
        if (response.request.path == "/user/login") {
            res.status(500).send("Credential is incorrect.");
        } else {
            let cookie = axios.cookieJar.getCookieStringSync("https://bigspy.com");
            await settingModel.findOneAndUpdate(null, {
                bigspyCookie: cookie
            }, {
                upsert: true
            });
            bigspyLog.info(`Start session with ${email} successfully.`)
            res.send("Login successfully.");
        }
        res.end(response.data);
   
    } catch (err) {
        console.log(err);
        buzzsumoLog.error(`Start session with ${email} failed: ${get(err, "response.data.message") || err.toString()}`);
        res.status(500).send(get(err, "response.data.message") || err.toString());
    }
}

module.exports = {
    login
};