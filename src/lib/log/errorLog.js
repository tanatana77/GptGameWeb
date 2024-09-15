/**
 * エラーログ書き込み
 * @param kinoNm 機能名
 * @param content 記述内容
 * @param sessionId 登録するセッションID(default: "")
 */
function write(kinoNm, content, sessionId = "") {
    const fs = require('fs');
    const path = require('path');

    // 現在日時
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // ログフォルダーパス
    const logFolderPath = path.join("./logs", `${year}${month}${day}`);

    // ログファイル名
    const logFileNm = "Errorlog.txt";

    // 記述内容
    const logMessage = `発生日時: ${year}/${month}/${day} ${hours}:${minutes}:${seconds}
機能名: ${kinoNm}
セッションID: ${sessionId}
内容: ${content}
====================================================================================================\n`;

    // フォルダが存在しなければ作成する
    if (!fs.existsSync(logFolderPath)) {
        fs.mkdirSync(logFolderPath, { recursive: true });
    }

    // ファイル書き込み
    const filePath = path.join(logFolderPath, logFileNm);
    fs.appendFileSync(filePath, logMessage, 'utf8');
}

module.exports = {
    write
};