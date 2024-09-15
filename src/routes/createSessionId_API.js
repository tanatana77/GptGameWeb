// 機能名
const KINO_NM = "createSessionId_API";

// ストアドプロシージャ
const SP_INSERT_M_SESSION = "INSERT_M_SESSION";

/**
 * セッションIDを新規発行
 */
async function getSessionId(req, res) {
    // セッションIDを取得
    const { v4: uuidv4 } = require('uuid');
    const sessionId = uuidv4();
    let statusCd = 200;

    // セッション値登録
    try {
        await insSession(sessionId);
    }
    catch {
        // サーバエラー
        statusCd = 500;
    }

    // セッション値返却
    res.json({sessionId, statusCd});
}

/**
 * データ追加: セッションマスタ
 * @param sessionId 登録するセッションID
 */
async function insSession(sessionId) {
    return new Promise(async (resolve, reject) => {
        try {
            const dbClient = require("../lib/database/connect.js");
            dbClient.mysqlClient.setProcedure(SP_INSERT_M_SESSION);
            dbClient.mysqlClient.setParam(sessionId);
            resolve(await dbClient.mysqlClient.executeQuery());
        } catch (err) {
            // エラーログ出力
            const errorLog = require("../lib/log/errorLog.js");
            errorLog.write(KINO_NM, err, sessionId);
            reject(err);
        }
    });
}

module.exports = {
    exec: getSessionId
};