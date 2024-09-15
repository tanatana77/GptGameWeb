let m_storedName = "";
let m_param = [];

// 実行するストアドプロシージャーを設定
const setProcedure = (val) => {
    m_storedName = val;
    m_param = [];
};

// パラメータ設定
const setParam = (val) => {
    m_param.push(val);
};

// クエリ作成
const createQuery = () => {
    const placeholders = m_param.map(() => "?").join(",");
    const query = `CALL ${m_storedName}(${placeholders});`;
    return { query, params: m_param };
};

module.exports = {
    setProcedure,
    setParam,
    createQuery
};