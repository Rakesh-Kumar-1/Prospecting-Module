import { createTable as createLanguagesTable } from "./mt_languages.js";
import { createTable as createSourcesTable } from "./mt_sources.js";
import { createTable as createStagesTable } from "./mt_stages.js";
import { createTable as createStageTranslationsTable } from "./mt_stages_translation.js";

export async function createMasterTables() {
  await createLanguagesTable();
  await createSourcesTable();
  await createStagesTable();
  await createStageTranslationsTable();
}

export {
  createLanguagesTable,
  createSourcesTable,
  createStagesTable,
  createStageTranslationsTable
};
