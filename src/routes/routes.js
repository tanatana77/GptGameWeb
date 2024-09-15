const router = require("express").Router();

// #region コンテンツ配信

    // リダイレクト
    router.get("/", (req, res) => {
        res.redirect('/top');
    });

    // メインビューを返却
    router.get("/top", (req, res) => {
        res.render("./main.ejs");
    });

// #endregion

// #region API

    // cookie作成API
    router.post("/api/createSessionId", async (req, res) => {
        const execClient = require("./createSessionId_API.js");
        execClient.exec(req, res);
    });

    // 最新応答結果取得API
    router.post("/api/getLatestResponse", async (req, res) => {
        const execClient = require("./getLatestResponse_API.js");
        execClient.exec(req, res);
    });

    // ChatGpt問い合わせAPI
    router.post("/api/sendGpt", async (req, res) => {
        const execClient = require("./sendGpt_API.js");
        execClient.exec(req, res);
    });

// #endregion


module.exports = router;