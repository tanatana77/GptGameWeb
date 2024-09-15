USE `GptGameWeb`;

-- -----------------------------------------------------
-- INSERT_M_SESSION
-- -----------------------------------------------------

DROP PROCEDURE IF EXISTS `INSERT_M_SESSION`;

DELIMITER //

CREATE PROCEDURE `INSERT_M_SESSION`(
    IN I_SESSION_ID CHAR(36)
)
BEGIN
    INSERT INTO M_SESSION 
        (SESSION_ID, INS_DATETIME)
    VALUES 
        (I_SESSION_ID, CURRENT_TIMESTAMP());
END //

-- -----------------------------------------------------
-- INSERT_T_RESPONSE
-- -----------------------------------------------------

DROP PROCEDURE IF EXISTS `INSERT_T_RESPONSE`;

CREATE PROCEDURE `INSERT_T_RESPONSE`(
    IN I_SESSION_ID CHAR(36),
    IN I_ROLE VARCHAR(20),       -- NVARCHAR -> VARCHAR
    IN I_MESSAGE VARCHAR(255),   -- NVARCHAR -> VARCHAR
    IN I_JOY INT,
    IN I_LOVE INT,
    IN I_SAD INT,
    IN I_ANGER INT,
    IN I_ERROR INT
)
BEGIN
    INSERT INTO T_RESPONSE 
        (SESSION_ID, ROLE, MESSAGE, JOY, LOVE, SAD, ANGER, INS_DATETIME, ERROR_FLG)
    VALUES 
        (I_SESSION_ID, I_ROLE, I_MESSAGE, I_JOY, I_LOVE, I_SAD, I_ANGER, CURRENT_TIMESTAMP(), I_ERROR);
END //

-- -----------------------------------------------------
-- SELECT_T_RESPONSE
-- -----------------------------------------------------

DROP PROCEDURE IF EXISTS `SELECT_T_RESPONSE`;

CREATE PROCEDURE `SELECT_T_RESPONSE`(
    IN I_SESSION_ID CHAR(36)
)
BEGIN
    SELECT ROW_NUMBER() OVER (ORDER BY RESPONSE_ID) AS ROW_NUM,
           ROLE,
           MESSAGE,
           JOY,
           LOVE,
           SAD,
           ANGER
    FROM T_RESPONSE 
    WHERE SESSION_ID = I_SESSION_ID
      AND ERROR_FLG = 0
    ORDER BY INS_DATETIME;
END //

-- -----------------------------------------------------
-- SELECT_T_RESPONSE_LATEST
-- -----------------------------------------------------

DROP PROCEDURE IF EXISTS `SELECT_T_RESPONSE_LATEST`;

CREATE PROCEDURE `SELECT_T_RESPONSE_LATEST`(
    IN I_SESSION_ID CHAR(36)
)
BEGIN
    SELECT MESSAGE,
           JOY,
           LOVE,
           SAD,
           ANGER
    FROM T_RESPONSE 
    WHERE SESSION_ID = I_SESSION_ID
      AND ERROR_FLG = 0
      AND ROLE = 'assistant'
    ORDER BY RESPONSE_ID DESC
    LIMIT 1;
END //
