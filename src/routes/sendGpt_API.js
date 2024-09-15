// 機能名
const KINO_NM = "sendGpt_API";

// ストアドプロシージャ
const SP_SELECT_T_RESPONSE = "SELECT_T_RESPONSE";
const SP_INSERT_T_RESPONSE = "INSERT_T_RESPONSE";

// その他
const C_ERR_MAX_NUM = 2; // gptエラー再挑戦最大数

/**
 * ChatGptにメッセージを送信し結果を返却
 */
async function sendGptAPI(req, res) {
    // ユーザ入力値取得
    const sendMessage = req.body.inputValue;
    const sessionId = req.body.sessionId;
    const DEFAULT_EMOTION = {joy: 0, love: 0, sad: 0, anger: 0};
    let statusCd = 200;

    try {
        // 過去分の応答結果抽出
        const arrPeriodResponse = await selResonse(sessionId);

        // chatGPTに問い合わせ
        let result;
        let cnt = 0;
        while (cnt < C_ERR_MAX_NUM) {
            // gpt応答結果取得
            let responseTxt = await sendGpt(sendMessage, arrPeriodResponse[0], sessionId);
            responseTxt = responseTxt.choices[0].message.content;

            // 応答結果から感情値とメッセージを切り分ける
            result = getSplitResponseText(responseTxt);
            if (result === null) {
                // 取得結果にエラーがある場合はその値をDBに登録し、gptに再問合せ
                if (cnt == 0) {
                    // 初回のみユーザー送信メッセージ登録
                    await insResponse(sessionId, "user", sendMessage, DEFAULT_EMOTION, true);
                }
                await insResponse(sessionId, "system", responseTxt, DEFAULT_EMOTION, true);
                cnt++;
            }
            else {
                // 今回の対話記録を保存
                await insResponse(sessionId, "user", sendMessage, DEFAULT_EMOTION);
                await insResponse(sessionId, "assistant", result.message, result.emotion);
                                    
                // 値返却
                res.json({result, statusCd});
                return;
            }
        }

        // 正常な応答結果を得られずに終了
        statusCd = 500;
        res.json({statusCd});
    } catch {
        // サーバエラー
        statusCd = 500;
        res.json({statusCd});
        return;
    }
}

/**
 * 過去の応答結果全件取得
 * @param sessionId 対象のセッションID
 */
async function selResonse(sessionId) {
    return new Promise(async (resolve, reject) => {
        try {
            const dbClient = require("../lib/database/connect.js");
            dbClient.mysqlClient.setProcedure(SP_SELECT_T_RESPONSE);
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

/**
 * chatgptに送信する
 * @param sendMessage gptに送信するメッセージ本文
 * @param arrPeriodResponse 過去の応答結果配列
 * @param sessionId セッションId
 */
async function sendGpt(sendMessage, arrPeriodResponse, sessionId) {
    return new Promise(async (resolve, reject) => {
        try {
            const openai = require("../lib/api/openai.js");
            const sendContent = [];
            const latestReponse = {
                row_num: 0,
                joy: 0,
                love: 0,
                anger: 0,
                sad: 0
            }

            // 過去の応答記録の中で、最も最近のものから感情パラメータを取得する
            for (let i = 0; i < arrPeriodResponse.length; i++) {
                if (arrPeriodResponse[i].ROLE == "assistant" && latestReponse.row_num <= arrPeriodResponse[i].ROW_NUM) {
                    latestReponse.row_num = arrPeriodResponse[i].ROW_NUM;
                    latestReponse.joy = arrPeriodResponse[i].JOY || 0;
                    latestReponse.love = arrPeriodResponse[i].LOVE || 0;
                    latestReponse.anger = arrPeriodResponse[i].ANGER || 0;
                    latestReponse.sad = arrPeriodResponse[i].SAD || 0;
                }
            }

            // chatGptのbot設定
            const gptSettingVal = `
            You shall be a pseudo - emotional chatbot according to the following conditions.\
            You will act as if you have the following four emotional parameters.\
            Set Joy for joy, Love for liking, Anger for anger, and Sad for sadness.\
            Each emotional parameter shall fluctuate throughout the conversation.\
            The increase or decrease value of each parameter should be kept within 0 to 2 compared to the previous value.\
            Please output the current emotional parameters first, followed by the conversation in Japanese 100 to 250 characters.\
            Current emotional parameters are ${latestReponse.joy} for joy, ${latestReponse.love} for liking, ${latestReponse.anger} for anger, and ${latestReponse.sad} for sadness.\
            The following will be your characterization.\
            Character Name: 「冬霧サイカ」\
            Character: A rich, overbearing daughter.\
            Personality: Classy, intelligent, somewhat overbearing.\
            Hairstyle: Short, straight\
            Hair color: Silver\
            Face: Elegant and well-defined features\
            Physique: Slender\
            Uniform: immaculately dressed, with a black ribbon.\
            Club activities: Student body president\
            You are interested in any topic.\
            If you are asked something, answer honestly.\
            The output format should be as follows.\
            Joy: 0 to 10, Love: 0 to 10, Anger: 0 to 10, Sad: 0 to 10,\
            ` 
            sendContent.push({role: 'system', content: gptSettingVal});
        
            // 過去の応答記録をセット
            for (let i = 0; i < arrPeriodResponse.length; i++) {
                sendContent.push({ role: arrPeriodResponse[i].ROLE, content: arrPeriodResponse[i].MESSAGE });
            }
    
            // 今回ユーザから入力されたメッセージをセット
            sendContent.push({ role: "user", content: sendMessage });

            // 問い合わせ実行
            resolve(await openai.inquireGpt(sendContent, process.env.CHATGPT_MODEL));
        } catch (err) {
            // エラーログ出力
            const errorLog = require("../lib/log/errorLog.js");
            errorLog.write(KINO_NM, err, sessionId);
            reject(err);
        }
    }); 
}

/**
 * 応答メッセージから感情パラメータと本文を抽出する
 * @param responseText gptからの応答メッセージ
 */
function getSplitResponseText(responseText) {
    const result = {
        emotion: {
            joy: 0,
            love: 0,
            anger: 0,
            sad: 0,
        },
        message: ""
    }
    const EMOTION_NUM = 4;
    const arrResponseText = responseText.split(/[,\n]+/);

    // 要素数チェック
    if (arrResponseText.length < EMOTION_NUM + 1) {
        return null;
    }

    // 各感情パラメータ値をセット
    let setValTemp = null;
    let cnt = 0;

    setValTemp = arrResponseText[cnt].replace("Joy: ", "");
    if (!isNaN(setValTemp)) {
        result.emotion.joy = setValTemp;
    }
    else {
        return null;
    }

    cnt++;
    setValTemp = arrResponseText[cnt].replace("Love: ", "");
    if (!isNaN(setValTemp)) {
        result.emotion.love = setValTemp;
    }
    else {
        return null;
    }

    cnt++;
    setValTemp = arrResponseText[cnt].replace("Anger: ", "");
    if (!isNaN(setValTemp)) {
        result.emotion.anger = setValTemp; 
    }
    else {
        return null;
    }

    cnt++;
    setValTemp = arrResponseText[cnt].replace("Sad: ", "");
    if (!isNaN(setValTemp)) {
        result.emotion.sad = setValTemp;
    }
    else {
        return null;
    }

    cnt++;
    setValTemp = arrResponseText[cnt];
    // 改行でも分割しているため、残り要素すべてを取得するようにする
    for (++cnt; cnt < arrResponseText.length; cnt++) {
        setValTemp += arrResponseText[cnt];
    }
    if (setValTemp.length > 0) {
        result.message = setValTemp;
    }
    else {
        return null;
    }

    return result;
}

/**
 * 問い合わせた内容を保存する
 * @param sessionId セッションID
 * @param role ユーザーかgptか
 * @param message メッセージ
 * @param emotion 感情パラメータ
 * @param error エラーフラグ(default: false)
 */
async function insResponse(sessionId, role, message, emotion, error = false) {
    return new Promise(async (resolve, reject) => {
        try {
            const dbClient = require("../lib/database/connect.js");
            dbClient.mysqlClient.setProcedure(SP_INSERT_T_RESPONSE);
            dbClient.mysqlClient.setParam(sessionId);
            dbClient.mysqlClient.setParam(role);
            dbClient.mysqlClient.setParam(message);
            dbClient.mysqlClient.setParam(emotion.joy);
            dbClient.mysqlClient.setParam(emotion.love);
            dbClient.mysqlClient.setParam(emotion.sad);
            dbClient.mysqlClient.setParam(emotion.anger);
            dbClient.mysqlClient.setParam(error ? 1 : 0);
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
    exec: sendGptAPI
};