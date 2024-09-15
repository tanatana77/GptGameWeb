// 機能名
const KINO_NM = "getLatestResponse_API";

// ストアドプロシージャ
const SP_SELECT_T_RESPONSE_LATEST = "SELECT_T_RESPONSE_LATEST";

/**
 * 最新の応答結果取得
 */
async function getLatestResponse(req, res) {
    // セッションIDを取得
    const sessionId = req.body.sessionId;
    let result = {
        emotion : {
            joy: null,
            love: null,
            anger: null,
            sad: null
        },
        message: ""
    }
    let statusCd = 200;

    // 最新の応答結果抽出
    try {
        const response = await selLatestResonse(sessionId);
        const data = response[0];
        if (data.length > 0) {
            result = {
                emotion: {
                    joy: data[0].JOY,
                    love: data[0].LOVE,
                    anger: data[0].ANGER,
                    sad: data[0].SAD
                },
                message: data[0].MESSAGE
            }
        }
    }
    catch {
        // サーバエラー
        statusCd = 500;
        res.json({statusCd});
        return;
    }

    // 最新の応答結果返却
    res.json({result, statusCd});
}

/**
 * データ抽出: 最新の応答結果
 * @param sessionId 対象のセッションID
 */
async function selLatestResonse(sessionId) {
    return new Promise(async (resolve, reject) => {
        try {
            const dbClient = require("../lib/database/connect.js");
            dbClient.mysqlClient.setProcedure(SP_SELECT_T_RESPONSE_LATEST);
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
    exec: getLatestResponse
};