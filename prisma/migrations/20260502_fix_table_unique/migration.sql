-- DropIndex
DROP INDEX "Table_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "Table_number_type_key" ON "Table"("number", "type");
