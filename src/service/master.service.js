import db from '../config/connection.js';

const DEFAULT_LANGUAGE_ID = 'EN';

const normalizeLanguageId = (languageId) => {
  if (!languageId || typeof languageId !== 'string') {
    return DEFAULT_LANGUAGE_ID;
  }

  return languageId.trim().toUpperCase() || DEFAULT_LANGUAGE_ID;
};

export const getStages = async (languageId) => {
  const lang = normalizeLanguageId(languageId);

  const [rows] = await db.execute(
    `SELECT
       sm.stage_code,
       sm.stage_key,
       COALESCE(t.stage_in_lang, en.stage_in_lang) AS label,
       sm.sort_order AS sequence,
       CASE
         WHEN sm.stage_key = 'PENDING' THEN 0
         WHEN sm.stage_key = 'CONTACTED' THEN 20
         WHEN sm.stage_key = 'INTERESTED' THEN 40
         WHEN sm.stage_key = 'QUALIFIED' THEN 60
         WHEN sm.stage_key = 'CONVERTED' THEN 100
         WHEN sm.stage_key = 'DROPPED' THEN -100
         WHEN sm.stage_key = 'HOLD' THEN -101
         WHEN sm.stage_key = 'DEFERRED' THEN -102
         ELSE 0
       END AS progress,
       CASE
         WHEN sm.stage_key IN ('CONVERTED', 'DROPPED') THEN 1
         ELSE 0
       END AS is_terminal
     FROM mt_stages sm
     INNER JOIN mt_stages_translation en
       ON en.stage_code = sm.stage_code
      AND en.lang_id = ?
     LEFT JOIN mt_stages_translation t
       ON t.stage_code = sm.stage_code
      AND t.lang_id = ?
     WHERE sm.is_active = 1
     ORDER BY sm.sort_order, sm.stage_code`,
    [DEFAULT_LANGUAGE_ID, lang]
  );

  return rows;
};

export const getSources = async () => {
  const [rows] = await db.execute(
    `SELECT
       source_id,
       source_key,
       icon,
       sort_order
     FROM mt_sources
     WHERE is_active = 1
     ORDER BY sort_order, source_id`
  );

  return rows;
};

export const getLanguages = async () => {
  const [rows] = await db.execute(
    `SELECT
       language_id,
       language_name,
       native_name,
       direction
     FROM mt_languages
     WHERE is_active = 1
     ORDER BY sort_order`
  );

  return rows;
};
