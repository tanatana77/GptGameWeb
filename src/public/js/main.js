// #region 定数定義

    const COOKIE_NM_SESSION_ID = "SessionId"                            // Cookie名称: セッションID
    const SHOW_TEXT_INTERVAL = 30;                                      // 表示文字間隔スピード(ミリ)
    const COOKIE_SAVE_DATE = 30;                                        // Cookie保存期間(日)
    const CMN_PATH_CHARA_IMG = "/public/images/CharaImg/%1%.png";       // キャラ画像共通パス
    const SPEAKER_NM_NARRATION = "ナレーション";                         // 話者名: ナレーション
    const SPEAKER_NM_CHARA = "冬霧サイカ"                                // 話者名: サイカ（キャラ）
    const CNN_TIME_OUT = 15000; // タイムアウト時間(15秒)
    const CON_FAILED_MESSAGE = "通信に失敗しました。\nもう一度試してみるか、時間を置いてください。";    // 通信失敗時表示メッセージ
    const INITIAL_MESSAG = "このWebアプリは「冬霧サイカ」というAIを使った対話型チャットボットです。\n彼女は疑似感情を持ち、あなたとの会話に応じて9種類の表情に変わります。\n下の「送信する」ボタンまたはEnterキーを押して、このテキストボックスにメッセージを入力してください。";
    const INPUT_MESSAGE = "1文字以上入力してください";
    const API_CREATE_SESSION_ID = "/api/createSessionId";
    const API_GET_LATEST_REPONSE = "/api/getLatestResponse";
    const API_SEND_GPT = "/api/sendGpt";
    const BTN_TEXT_REQUEST = "通信中";     // ボタンテキスト: 通信中
    const BTN_TEXT_RESPONSE = "返信する";  // ボタンテキスト: クリア待ち受け
    const BTN_TEXT_SEND = "送信する!"      // ボタンテキスト: 送信時
    const SHORI_MODE = {
        SEND: 0,        // 送信中
        BTN_WAIT: 1,    // 返信ボタン押下待ち受け
        REPONSE: 2      // 返信ボタン押下
    }

// #endregion

// #region 変数定義

    let m_sessionId = "";
    let m_textarea;
    let m_sendBtn;
    let m_charaImg;
    let m_clearTextareaFlg = false;

// #endregion

// #region 関数定義

    // #region イベント

    /**
     * 初期化処理
     */
    function initializePage() {
        // 要素取得
        m_textarea = document.getElementById("textarea");
        m_sendBtn = document.getElementById("sendBtn");
        m_charaImg = document.getElementById("charaImg");

        // 項目設定: 送信中
        setItems(SHORI_MODE.SEND);

        // CookieからセッションID取得
        m_sessionId = getCookie('sessionId');

        // セッション値取得チェック
        if (m_sessionId === null) {
            // セッションID新規登録
            const requestOptions = {
                method: 'POST',
            };
            httpConn(API_CREATE_SESSION_ID, requestOptions, data => {
                // Cookieを保存
                setCookie(COOKIE_NM_SESSION_ID, data.sessionId, COOKIE_SAVE_DATE);

                // セッションIDセット
                m_sessionId = data.sessionId;

                // 初期表示
                showText(INITIAL_MESSAG, SPEAKER_NM_NARRATION);
            });
        } 
        else {
            // 最新の応答結果を取得
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionId: m_sessionId })
            };
            httpConn(API_GET_LATEST_REPONSE, requestOptions, data => {
                if (data.result.message === "") {
                    // 応答結果が存在しない場合は初期表示
                    showText(INITIAL_MESSAG, SPEAKER_NM_NARRATION);
                    return;
                }

                // キャラアニメーション
                moveChara(data.result.emotion);

                // 文字表示
                showText(data.result.message, SPEAKER_NM_CHARA);
            });
        }

        // イベント設定
        m_sendBtn.addEventListener("click", btnOnClick);
        document.addEventListener('keydown', keyDown);
    }

    /**
     * 送信ボタン押下
     */
    function btnOnClick() {
        // クリアフラグチェック（応答結果表示直後）
        if (m_clearTextareaFlg) {
            // メッセージボックスを利用可能にし、処理終了
            setItems(SHORI_MODE.REPONSE);
            return;
        }

        // 入力チェック
        if (m_textarea.value == "") {
            alert(INPUT_MESSAGE);
            m_textarea.focus();
            return;
        }

        // 項目設定: 送信中
        setItems(SHORI_MODE.SEND);

        // ChatGptに問い合わせ
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId: m_sessionId, inputValue: m_textarea.value })
        };
        httpConn(API_SEND_GPT, requestOptions, data => {
            // キャラアニメーション
            moveChara(data.result.emotion);

            // 文字表示
            showText(data.result.message, SPEAKER_NM_CHARA);
        });
    }

    /**
     * キー押下
     */
    function keyDown(event) {
        // Enter押下かつShiftキーが押下されていない(改行許可)
        if (event.key === 'Enter' && !event.shiftKey) {
            if (m_sendBtn.disabled === false) {
                // テキストボックスが入力可能な状態は返信するボタン押下待ち
                event.preventDefault(); // 改行を防止
                btnOnClick();
            }
        }
    }

    // #endregion

    // #region 画面変化
    
    /**
     * キャラ画像を動かす
     * @param emotion 感情値
     */
    function moveChara (emotion) {
        // 各種感情パラメータ値を数値変換
        emotion = {
            joy: Number(emotion.joy),
            love: Number(emotion.love),
            sad: Number(emotion.sad),
            anger: Number(emotion.anger)
        }

        // 感情パラメータ値によって表情を変更する
        let charaImgId = "";

        // プラス感情とマイナス感情の値の合計値を取得
        const sumPlusEmotionVal = emotion.joy + emotion.love;
        const sumMinusEmotionVal = emotion.sad + emotion.anger;
        const relativeEmotionVal = sumPlusEmotionVal - sumMinusEmotionVal

        // キャラ画像切り替え
        if (relativeEmotionVal > 0) {
            if (emotion.joy > emotion.love) {
                if (emotion.joy > 5) {
                    charaImgId = "oowarai";
                } 
                else {
                    charaImgId = "smile";
                }
            } else {
                if (emotion.love > 5) {
                    charaImgId = "happy";
                } 
                else {
                    charaImgId = "niyaniya";
                }
            }
        }
        else if (relativeEmotionVal < 0) {
            if (emotion.sad > emotion.anger) {
                if (emotion.sad > 5) {
                    charaImgId = "kowai";
                } 
                else {
                    charaImgId = "iiwake";
                }
            } else {
                if (emotion.anger > 5) {
                    charaImgId = "situbou";
                } 
                else {
                    charaImgId = "puku";
                }
            }
        }
        else {
            charaImgId = "default";
        }
        const charaImgPath = CMN_PATH_CHARA_IMG.replace("%1%", charaImgId);
        m_charaImg.setAttribute('src', charaImgPath);
    }

    /**
     * 項目設定（入力制限やボタン可否など）
     * @param mode 処理モード
     */
    function setItems(mode) {
        switch (mode) {
            // 送信中
            case SHORI_MODE.SEND:
                m_textarea.readOnly = true;
                m_sendBtn.style.cursor = "not-allowed";
                m_sendBtn.disabled = true;
                m_sendBtn.textContent = BTN_TEXT_REQUEST;
                break;

            // メッセージ表示後、ボタン押下待ち受け
            case SHORI_MODE.BTN_WAIT:
                m_sendBtn.disabled = false;
                m_sendBtn.style.cursor = "default";
                m_clearTextareaFlg = true;
                m_sendBtn.textContent = BTN_TEXT_RESPONSE;
                break;

            // 返信ボタン押下
            case SHORI_MODE.REPONSE:
                m_textarea.value = "";
                m_textarea.readOnly = false;
                m_clearTextareaFlg = false;
                m_sendBtn.textContent = BTN_TEXT_SEND;
                m_textarea.focus();
                break;
          }
    }

    /**
     * 文字表示
     * @param text 表示する文字
     * @param speakerNm 話者
     */
    function showText(text, speakerNm) {
        let index = 0;

        // 値クリア
        m_textarea.value = "";

        // 話者名表示
        m_textarea.value = `【${speakerNm}】\n`;

        const timerId = setInterval(function () {
            if (index < text.length) {
                m_textarea.value += text[index];
                index++;
            }
            else {
                 // すべての文字を表示したらタイマーを停止
                clearInterval(timerId);

                // 項目設定: ボタン押下待ち受け
                setItems(SHORI_MODE.BTN_WAIT);
            }
        }, SHOW_TEXT_INTERVAL);
    }

    // #endregion

    // #region その他

    /**
     * 通信処理
     * @param api 送信するAPI
     * @param requestOptions リクエスト設定値
     * @param afterFunc 実行後処理
     */
    function httpConn(api, requestOptions, afterFunc) {
        // タイムアウトを設定
        const controller = new AbortController();
        const signal = controller.signal;
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, CNN_TIME_OUT);

        fetch(api, { ...requestOptions, signal })
            .then(response => response.json())
            .then(data => {
                // レスポンスチェック
                if (data.statusCd != "200") {
                    showText(CON_FAILED_MESSAGE, SPEAKER_NM_NARRATION);
                    return;
                }

                // 後処理実行
                afterFunc(data);
            })
            .catch(error => showText(CON_FAILED_MESSAGE, SPEAKER_NM_NARRATION))
            .finally(() => clearTimeout(timeoutId));
    }

    /**
     * Cookieからセッション値を取得
     */
    function getCookie() {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${COOKIE_NM_SESSION_ID}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    /**
     * Cookieにセッション値を保存
     * @param name Cookie名称
     * @param value 設定値
     * @param days 有効期限(日)
     */
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = `; expires=${date.toUTCString()}`;
        }
        document.cookie = `${name}=${value || ""}${expires}; path=/`;
    }
    
    // #endregion

// #endregion

// 初期化関数実行
window.addEventListener('load', initializePage);