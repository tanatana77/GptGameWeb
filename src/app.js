const PORT = process.env.PORT;
const express = require("express");
const app = express();
const path = require("path");
const favicon = require("serve-favicon");

// ejs設定
app.set("view engine", "ejs");
app.disable("x-powered-by");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的コンテンツ配信
app.use("/public", express.static(path.join(__dirname, "/public")));
app.use(favicon(path.join(__dirname, "public", "./favicon.ico")));

// 動的コンテンツ配信
app.use("/", require("./routes/routes.js"));

// サーバ起動
app.listen(PORT, async () => {
    console.log(`サーバ起動 ${PORT}`);
});