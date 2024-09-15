const openaiAPI = require("openai");
const openai = new openaiAPI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * chatgptに問い合わせ
 * @param setMessages 設定されたメッセージ
 * @param setModel 使用するgptのモデル
 */
const inquireGpt = async (setMessages, setModel) => {
    const results = await openai.chat.completions.create({
        messages: setMessages,
        model: setModel,
    });

    return results;
};

module.exports = {
    inquireGpt
};