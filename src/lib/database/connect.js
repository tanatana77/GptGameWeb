// プール作成関数
const createPool = () => {
    const { promisify } = require("util");
    const mysql = require("mysql");
    
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: 3306,
        user: process.env.DB_USER_NM,
        password: process.env.DB_PASS,
        database: process.env.DB_NM,
        connectionLimit: 1,
        queueLimit: 1,
    });

    return {
        // poolから接続を取得
        getConnection: promisify(pool.getConnection).bind(pool),
        // クエリの実行
        executeQuery: async ({ query, params }) => { return await promisify(pool.query).bind(pool)(query, params);},
        // 接続を解放
        releaseConnection: (connection) => connection.release(),
    };
};

const query = require("./query.js");

// プールを作成
const pool = createPool();

// MySQLクライアントオブジェクト
const mysqlClient = {
    setProcedure: query.setProcedure,
    setParam: query.setParam,
    executeQuery: async () => { return await pool.executeQuery(query.createQuery()); },
    pool
};

module.exports = {
    mysqlClient
};