-- DropIndex (IF EXISTS for fresh installations)
DROP INDEX IF EXISTS "Table_number_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Table_number_type_key" ON "Table"("number", "type");
