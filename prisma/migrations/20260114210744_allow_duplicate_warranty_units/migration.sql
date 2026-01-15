-- DropIndex
DROP INDEX "warranty_units_order_item_id_unit_no_key";

-- CreateIndex
CREATE INDEX "warranty_units_order_item_id_unit_no_idx" ON "warranty_units"("order_item_id", "unit_no");
