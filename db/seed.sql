-- Factory Ops — seed data.
--
-- Mirrors src/data/demo.ts one for one: the same twenty components and fourteen
-- finished pieces, the same six runs across the six columns, the same 12 kg
-- shortfall of speckled stoneware clay that stops RUN-2317, the same seven
-- invoices with two overdue at eleven and forty-four days. Run the app and the
-- generated dashboard side by side and they show the same works, down to the
-- part-received purchase order whose outstanding clay is exactly what would
-- clear the block.
--
-- GENERATED from the TypeScript seed rather than hand-written, so the two can
-- never drift. Regenerate with the snippet in README.md if the fiction changes.

BEGIN;

-- The works itself: one row, because there is one gate the goods leave by. Its
-- address is what a carrier collects FROM, and until this row existed the only
-- thing the app could say about where a pallet starts was "the works".
INSERT INTO works (id, name, line1, line2, city, postcode, country) VALUES
  ('works', 'Kilnworks', 'Unit 7, Brickyard Lane', 'Levels Trading Estate', 'Bridgwater', 'TA6 4LN', 'GB');

INSERT INTO glazes (id, name, tint_from, tint_to) VALUES
  ('speckled', 'Speckled', '#b0a394', '#7c6f5f'),
  ('harbour', 'Harbour', '#5b86b3', '#2f5680'),
  ('oxide', 'Oxide', '#c06144', '#8c3a22'),
  ('matt', 'Matt white', '#d5d2cb', '#a29d93');

INSERT INTO stations (id, name, icon, operator) VALUES
  ('ST-F1', 'Forming bench 1', 'hammer', 'Mara O.'),
  ('ST-F2', 'Forming bench 2', 'hammer', 'Denis K.'),
  ('ST-K1', 'Kiln 1', 'flame', 'Ivy R.'),
  ('ST-K2', 'Kiln 2', 'flame', 'Ivy R.'),
  ('ST-T1', 'Finishing table', 'paintbrush', 'Nell A.');

INSERT INTO suppliers (id, name, contact, lead_days, on_time, last_receipt) VALUES
  ('SUP-CLY', 'Thornbury Clays', 'orders@thornburyclays.example', 7, 0.96, '2026-07-21'),
  ('SUP-GLZ', 'Kestrel Glaze Co', 'sales@kestrelglaze.example', 10, 0.88, '2026-07-14'),
  ('SUP-PKG', 'Marlow Packaging', 'hello@marlowpack.example', 4, 0.99, '2026-07-24'),
  ('SUP-KLN', 'Redwing Kiln Supplies', 'trade@redwingkilns.example', 14, 0.82, '2026-06-30');

INSERT INTO customers (id, name, city, kind) VALUES
  ('CUS-01', 'Harbour & Vine', 'Falmouth', 'restaurant'),
  ('CUS-02', 'The Salt Room', 'Whitstable', 'restaurant'),
  ('CUS-03', 'Pennyfields Homeware', 'Bristol', 'shop'),
  ('CUS-04', 'Bramble & Co', 'Bath', 'shop'),
  ('CUS-05', 'Otterbourne Kitchen', 'Winchester', 'restaurant'),
  ('CUS-06', 'The Copper Pot', 'Ludlow', 'restaurant'),
  ('CUS-07', 'Wrenfield Stores', 'York', 'shop'),
  ('CUS-08', 'Marling Deli', 'Norwich', 'deli');

INSERT INTO items (sku, kind, name, unit, on_hand, allocated, reorder, cost, icon, glaze_id, labour, overhead, price) VALUES
  ('CLY-STW-SPK', 'component', 'Speckled stoneware clay', 'kg', 48, 60, 40, 1.85, 'layers', NULL, NULL, NULL, NULL),
  ('CLY-STW-WHT', 'component', 'White stoneware clay', 'kg', 320, 96, 80, 1.65, 'layers', NULL, NULL, NULL, NULL),
  ('CLY-POR-FIN', 'component', 'Fine porcelain body', 'kg', 88, 42, 50, 3.4, 'layers', NULL, NULL, NULL, NULL),
  ('GLZ-SPK-01', 'component', 'Speckled oatmeal glaze', 'L', 42, 6, 12, 8.2, 'paint-bucket', NULL, NULL, NULL, NULL),
  ('GLZ-HAR-02', 'component', 'Harbour blue glaze', 'L', 18, 5, 12, 9.6, 'paint-bucket', NULL, NULL, NULL, NULL),
  ('GLZ-OXD-03', 'component', 'Oxide red glaze', 'L', 9, 4, 10, 11.4, 'paint-bucket', NULL, NULL, NULL, NULL),
  ('GLZ-CLR-04', 'component', 'Clear liner glaze', 'L', 26, 3, 10, 6.3, 'paint-bucket', NULL, NULL, NULL, NULL),
  ('GLZ-MAT-05', 'component', 'Matt white glaze', 'L', 21, 4, 8, 7.8, 'paint-bucket', NULL, NULL, NULL, NULL),
  ('GLZ-SLP-06', 'component', 'Black slip', 'L', 12, 1, 5, 5.4, 'paint-bucket', NULL, NULL, NULL, NULL),
  ('PKG-TIS-01', 'component', 'Tissue sheets', 'ea', 5200, 860, 1000, 0.02, 'scroll', NULL, NULL, NULL, NULL),
  ('PKG-BUB-02', 'component', 'Bubble wrap', 'm', 260, 40, 100, 0.14, 'scroll', NULL, NULL, NULL, NULL),
  ('BOX-STD-12', 'component', 'Twelve-piece carton', 'ea', 180, 64, 90, 0.68, 'box', NULL, NULL, NULL, NULL),
  ('BOX-SET-01', 'component', 'Service-set box', 'ea', 44, 24, 30, 1.95, 'box', NULL, NULL, NULL, NULL),
  ('PKG-TAP-03', 'component', 'Packing tape roll', 'ea', 22, 0, 8, 1.1, 'circle-dot', NULL, NULL, NULL, NULL),
  ('KLN-SHF-40', 'component', 'Kiln shelf 400 mm', 'ea', 26, 0, 6, 24, 'square', NULL, NULL, NULL, NULL),
  ('KLN-PRP-75', 'component', 'Kiln props 75 mm', 'ea', 118, 0, 30, 3.2, 'columns-2', NULL, NULL, NULL, NULL),
  ('KLN-BAT-30', 'component', 'Bat wash', 'kg', 7, 0, 4, 4.6, 'paint-bucket', NULL, NULL, NULL, NULL),
  ('MSC-STK-01', 'component', 'Backstamp decals', 'ea', 3600, 720, 800, 0.09, 'stamp', NULL, NULL, NULL, NULL),
  ('MSC-FLT-02', 'component', 'Felt pads', 'ea', 940, 120, 300, 0.03, 'circle', NULL, NULL, NULL, NULL),
  ('MSC-SAN-03', 'component', 'Sanding pads', 'ea', 64, 0, 25, 0.22, 'square', NULL, NULL, NULL, NULL),
  ('PLT-260-SPK', 'product', 'Dinner plate 260 · Speckled', 'ea', 240, 96, 60, 0, 'circle', 'speckled', 1.85, 0.95, 11.5),
  ('PLT-260-HAR', 'product', 'Dinner plate 260 · Harbour', 'ea', 168, 72, 60, 0, 'circle', 'harbour', 1.85, 0.95, 12),
  ('PLT-260-OXD', 'product', 'Dinner plate 260 · Oxide', 'ea', 96, 0, 50, 0, 'circle', 'oxide', 1.85, 0.95, 12.5),
  ('PLT-190-SPK', 'product', 'Side plate 190 · Speckled', 'ea', 310, 90, 80, 0, 'circle', 'speckled', 1.2, 0.62, 6.8),
  ('PLT-190-HAR', 'product', 'Side plate 190 · Harbour', 'ea', 205, 0, 80, 0, 'circle', 'harbour', 1.2, 0.62, 7.2),
  ('PLT-190-OXD', 'product', 'Side plate 190 · Oxide', 'ea', 74, 36, 40, 0, 'circle', 'oxide', 1.2, 0.62, 7.4),
  ('BWL-160-SPK', 'product', 'Bowl 160 · Speckled', 'ea', 190, 0, 60, 0, 'soup', 'speckled', 1.45, 0.72, 8.4),
  ('BWL-160-HAR', 'product', 'Bowl 160 · Harbour', 'ea', 140, 0, 60, 0, 'soup', 'harbour', 1.45, 0.72, 8.8),
  ('BWL-160-OXD', 'product', 'Bowl 160 · Oxide', 'ea', 24, 24, 40, 0, 'soup', 'oxide', 1.45, 0.72, 9.2),
  ('MUG-300-SPK', 'product', 'Mug 300 · Speckled', 'ea', 260, 48, 70, 0, 'coffee', 'speckled', 1.65, 0.8, 9.6),
  ('MUG-300-HAR', 'product', 'Mug 300 · Harbour', 'ea', 176, 48, 70, 0, 'coffee', 'harbour', 1.65, 0.8, 9.8),
  ('MUG-300-OXD', 'product', 'Mug 300 · Oxide', 'ea', 36, 36, 40, 0, 'coffee', 'oxide', 1.65, 0.8, 10.2),
  ('JUG-900-OXD', 'product', 'Water jug 900 · Oxide', 'ea', 18, 0, 20, 0, 'milk', 'oxide', 3.2, 1.4, 13.2),
  ('SET-SVC-04', 'product', 'Restaurant service set · four pieces', 'set', 60, 0, 12, 0, 'utensils', 'matt', 7.4, 3.1, 42);

INSERT INTO bom_lines (product_sku, component_sku, qty_per_unit, position) VALUES
  ('PLT-260-SPK', 'CLY-STW-SPK', 0.72, 0),
  ('PLT-260-SPK', 'GLZ-SPK-01', 0.065, 1),
  ('PLT-260-SPK', 'PKG-TIS-01', 1, 2),
  ('PLT-260-SPK', 'MSC-STK-01', 1, 3),
  ('PLT-260-HAR', 'CLY-STW-WHT', 0.72, 0),
  ('PLT-260-HAR', 'GLZ-HAR-02', 0.065, 1),
  ('PLT-260-HAR', 'PKG-TIS-01', 1, 2),
  ('PLT-260-HAR', 'MSC-STK-01', 1, 3),
  ('PLT-260-OXD', 'CLY-STW-WHT', 0.72, 0),
  ('PLT-260-OXD', 'GLZ-OXD-03', 0.065, 1),
  ('PLT-260-OXD', 'PKG-TIS-01', 1, 2),
  ('PLT-260-OXD', 'MSC-STK-01', 1, 3),
  ('PLT-190-SPK', 'CLY-STW-SPK', 0.38, 0),
  ('PLT-190-SPK', 'GLZ-SPK-01', 0.04, 1),
  ('PLT-190-SPK', 'PKG-TIS-01', 1, 2),
  ('PLT-190-SPK', 'MSC-STK-01', 1, 3),
  ('PLT-190-HAR', 'CLY-STW-WHT', 0.38, 0),
  ('PLT-190-HAR', 'GLZ-HAR-02', 0.04, 1),
  ('PLT-190-HAR', 'PKG-TIS-01', 1, 2),
  ('PLT-190-HAR', 'MSC-STK-01', 1, 3),
  ('PLT-190-OXD', 'CLY-STW-WHT', 0.38, 0),
  ('PLT-190-OXD', 'GLZ-OXD-03', 0.04, 1),
  ('PLT-190-OXD', 'PKG-TIS-01', 1, 2),
  ('PLT-190-OXD', 'MSC-STK-01', 1, 3),
  ('BWL-160-SPK', 'CLY-STW-SPK', 0.44, 0),
  ('BWL-160-SPK', 'GLZ-SPK-01', 0.05, 1),
  ('BWL-160-SPK', 'PKG-TIS-01', 1, 2),
  ('BWL-160-SPK', 'MSC-STK-01', 1, 3),
  ('BWL-160-HAR', 'CLY-STW-WHT', 0.44, 0),
  ('BWL-160-HAR', 'GLZ-HAR-02', 0.05, 1),
  ('BWL-160-HAR', 'PKG-TIS-01', 1, 2),
  ('BWL-160-HAR', 'MSC-STK-01', 1, 3),
  ('BWL-160-OXD', 'CLY-STW-WHT', 0.44, 0),
  ('BWL-160-OXD', 'GLZ-OXD-03', 0.05, 1),
  ('BWL-160-OXD', 'PKG-TIS-01', 1, 2),
  ('BWL-160-OXD', 'MSC-STK-01', 1, 3),
  ('MUG-300-SPK', 'CLY-STW-SPK', 0.35, 0),
  ('MUG-300-SPK', 'GLZ-SPK-01', 0.045, 1),
  ('MUG-300-SPK', 'GLZ-CLR-04', 0.02, 2),
  ('MUG-300-SPK', 'PKG-TIS-01', 1, 3),
  ('MUG-300-SPK', 'MSC-STK-01', 1, 4),
  ('MUG-300-HAR', 'CLY-STW-WHT', 0.35, 0),
  ('MUG-300-HAR', 'GLZ-HAR-02', 0.045, 1),
  ('MUG-300-HAR', 'GLZ-CLR-04', 0.02, 2),
  ('MUG-300-HAR', 'PKG-TIS-01', 1, 3),
  ('MUG-300-HAR', 'MSC-STK-01', 1, 4),
  ('MUG-300-OXD', 'CLY-STW-WHT', 0.35, 0),
  ('MUG-300-OXD', 'GLZ-OXD-03', 0.045, 1),
  ('MUG-300-OXD', 'GLZ-CLR-04', 0.02, 2),
  ('MUG-300-OXD', 'PKG-TIS-01', 1, 3),
  ('MUG-300-OXD', 'MSC-STK-01', 1, 4),
  ('JUG-900-OXD', 'CLY-STW-WHT', 0.86, 0),
  ('JUG-900-OXD', 'GLZ-OXD-03', 0.09, 1),
  ('JUG-900-OXD', 'GLZ-CLR-04', 0.03, 2),
  ('JUG-900-OXD', 'PKG-TIS-01', 1, 3),
  ('JUG-900-OXD', 'MSC-STK-01', 1, 4),
  ('JUG-900-OXD', 'MSC-FLT-02', 3, 5),
  ('SET-SVC-04', 'CLY-POR-FIN', 2.1, 0),
  ('SET-SVC-04', 'GLZ-MAT-05', 0.18, 1),
  ('SET-SVC-04', 'GLZ-SLP-06', 0.02, 2),
  ('SET-SVC-04', 'BOX-SET-01', 1, 3),
  ('SET-SVC-04', 'PKG-TIS-01', 4, 4),
  ('SET-SVC-04', 'MSC-STK-01', 4, 5);

INSERT INTO runs (code, sku, qty, good, scrap, stage, station_id, started_minutes, lot, signed_forming, signed_firing, signed_finishing, for_order, made_in_session) VALUES
  ('RUN-2312', 'SET-SVC-04', 60, 60, 3, 'complete', 'ST-T1', 195, 'LOT-2607-09', 'Denis K.', 'Ivy R.', 'Nell A.', NULL, false),
  ('RUN-2313', 'PLT-260-HAR', 240, 186, 6, 'finishing', 'ST-T1', 168, 'LOT-2607-10', 'Denis K.', 'Ivy R.', NULL, NULL, false),
  ('RUN-2314', 'BWL-160-OXD', 180, 92, 5, 'firing', 'ST-K1', 132, 'LOT-2607-11', 'Mara O.', NULL, NULL, 'SO-5108', false),
  ('RUN-2315', 'MUG-300-SPK', 300, 118, 4, 'forming', 'ST-F1', 96, 'LOT-2607-12', NULL, NULL, NULL, NULL, false),
  ('RUN-2316', 'PLT-190-SPK', 360, 0, 0, 'released', 'ST-F2', 24, NULL, NULL, NULL, NULL, NULL, false),
  ('RUN-2317', 'PLT-260-SPK', 200, 0, 0, 'queued', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false);

INSERT INTO firings (code, station_id, programme, status, current_temp, target_temp, loaded_minutes, started_minutes, due_minutes, elapsed_minutes, shelves, capacity, kwh) VALUES
  ('FIR-4470', 'ST-K1', 'Bisque · 1000 °C', 'unloaded', 62, 1000, 1330, 1350, 400, NULL, 7, 7, 132),
  ('FIR-4471', 'ST-K1', 'Glaze · 1240 °C', 'firing', 1148, 1240, 440, 455, 850, 160, 6, 7, NULL),
  ('FIR-4472', 'ST-K2', 'Bisque · 1000 °C', 'cooling', 640, 1000, 340, 360, 690, 255, 7, 7, 148),
  ('FIR-4473', 'ST-K2', 'Glaze · 1240 °C', 'loading', 24, 1240, 605, NULL, 1120, NULL, 3, 7, NULL);

INSERT INTO firing_contents (firing_code, run_code, sku, qty) VALUES
  ('FIR-4470', 'RUN-2312', 'SET-SVC-04', 63),
  ('FIR-4471', 'RUN-2314', 'BWL-160-OXD', 97),
  ('FIR-4472', 'RUN-2313', 'PLT-260-HAR', 192),
  ('FIR-4473', 'RUN-2315', 'MUG-300-SPK', 122);

INSERT INTO defects (at_minutes, run_code, sku, station_id, reason, qty, logged_by) VALUES
  (468, 'RUN-2312', 'SET-SVC-04', 'ST-T1', 'chip', 1, 'Nell A.'),
  (485, 'RUN-2312', 'SET-SVC-04', 'ST-K1', 'crack', 2, 'Ivy R.'),
  (500, 'RUN-2313', 'PLT-260-HAR', 'ST-F2', 'warp', 2, 'Denis K.'),
  (532, 'RUN-2313', 'PLT-260-HAR', 'ST-K2', 'crawl', 3, 'Ivy R.'),
  (554, 'RUN-2313', 'PLT-260-HAR', 'ST-T1', 'chip', 1, 'Nell A.'),
  (566, 'RUN-2314', 'BWL-160-OXD', 'ST-F1', 'warp', 3, 'Mara O.'),
  (580, 'RUN-2314', 'BWL-160-OXD', 'ST-K1', 'pinhole', 2, 'Ivy R.'),
  (598, 'RUN-2315', 'MUG-300-SPK', 'ST-F1', 'handling', 1, 'Mara O.'),
  (606, 'RUN-2315', 'MUG-300-SPK', 'ST-F1', 'warp', 3, 'Mara O.');

INSERT INTO movements (sku, moved_on, kind, ref, qty, lot) VALUES
  ('CLY-STW-SPK', '2026-07-21', 'receipt', 'PO-8813', 180, NULL),
  ('CLY-STW-SPK', '2026-07-22', 'issue', 'RUN-2310', -86.4, NULL),
  ('CLY-STW-SPK', '2026-07-24', 'issue', 'RUN-2311', -64.8, NULL),
  ('CLY-STW-SPK', '2026-07-28', 'issue', 'RUN-2315', -42.7, NULL),
  ('CLY-STW-WHT', '2026-07-21', 'receipt', 'PO-8813', 200, NULL),
  ('CLY-STW-WHT', '2026-07-27', 'issue', 'RUN-2313', -138.24, NULL),
  ('CLY-STW-WHT', '2026-07-28', 'issue', 'RUN-2314', -42.68, NULL),
  ('CLY-POR-FIN', '2026-07-27', 'issue', 'RUN-2312', -132.3, NULL),
  ('GLZ-SPK-01', '2026-07-14', 'receipt', 'PO-8811', 40, NULL),
  ('GLZ-SPK-01', '2026-07-28', 'issue', 'RUN-2315', -5.49, NULL),
  ('GLZ-HAR-02', '2026-07-14', 'receipt', 'PO-8811', 20, NULL),
  ('GLZ-HAR-02', '2026-07-27', 'issue', 'RUN-2313', -12.48, NULL),
  ('GLZ-OXD-03', '2026-07-28', 'issue', 'RUN-2314', -4.85, NULL),
  ('GLZ-MAT-05', '2026-07-27', 'issue', 'RUN-2312', -11.34, NULL),
  ('BOX-STD-12', '2026-07-18', 'receipt', 'PO-8810', 200, NULL),
  ('BOX-STD-12', '2026-07-26', 'issue', 'SO-5101', -17, NULL),
  ('BOX-STD-12', '2026-07-28', 'issue', 'SO-5106', -15, NULL),
  ('BOX-SET-01', '2026-07-27', 'issue', 'RUN-2312', -63, NULL),
  ('PKG-TIS-01', '2026-07-18', 'receipt', 'PO-8810', 5000, NULL),
  ('PKG-TIS-01', '2026-07-27', 'issue', 'RUN-2313', -192, NULL),
  ('PKG-TIS-01', '2026-07-28', 'issue', 'RUN-2315', -122, NULL),
  ('MSC-STK-01', '2026-07-27', 'issue', 'RUN-2313', -192, NULL),
  ('MSC-STK-01', '2026-07-28', 'issue', 'RUN-2315', -122, NULL),
  ('PLT-260-SPK', '2026-07-22', 'production', 'RUN-2310', 236, 'LOT-2607-06'),
  ('PLT-260-SPK', '2026-07-26', 'shipment', 'SO-5101', -120, NULL),
  ('PLT-260-HAR', '2026-07-27', 'production', 'RUN-2313', 186, 'LOT-2607-10'),
  ('PLT-190-SPK', '2026-07-24', 'production', 'RUN-2311', 348, 'LOT-2607-07'),
  ('PLT-190-SPK', '2026-07-28', 'shipment', 'SO-5106', -120, NULL),
  ('BWL-160-SPK', '2026-07-28', 'shipment', 'SO-5106', -60, NULL),
  ('MUG-300-SPK', '2026-07-20', 'production', 'RUN-2309', 180, 'LOT-2607-05'),
  ('MUG-300-SPK', '2026-07-25', 'shipment', 'SO-5105', -108, NULL),
  ('MUG-300-SPK', '2026-07-28', 'production', 'RUN-2315', 118, 'LOT-2607-12'),
  ('SET-SVC-04', '2026-07-27', 'production', 'RUN-2312', 60, 'LOT-2607-09'),
  ('SET-SVC-04', '2026-07-27', 'shipment', 'SO-5102', -24, NULL),
  ('BWL-160-OXD', '2026-07-21', 'adjustment', 'CNT-216', -4, NULL);

INSERT INTO purchase_orders (code, supplier_id, status, raised_on, due_on) VALUES
  ('PO-8810', 'SUP-PKG', 'received', '2026-07-14', '2026-07-18'),
  ('PO-8811', 'SUP-GLZ', 'received', '2026-07-04', '2026-07-14'),
  ('PO-8812', 'SUP-KLN', 'sent', '2026-07-16', '2026-07-30'),
  ('PO-8813', 'SUP-CLY', 'part_received', '2026-07-17', '2026-07-24'),
  ('PO-8814', 'SUP-GLZ', 'draft', '2026-07-27', '2026-08-10');

INSERT INTO purchase_order_lines (po_code, sku, qty, received, cost) VALUES
  ('PO-8810', 'BOX-STD-12', 200, 200, 0.68),
  ('PO-8810', 'PKG-TIS-01', 5000, 5000, 0.02),
  ('PO-8811', 'GLZ-SPK-01', 40, 40, 8.2),
  ('PO-8811', 'GLZ-HAR-02', 20, 20, 9.6),
  ('PO-8812', 'KLN-SHF-40', 8, 0, 24),
  ('PO-8812', 'KLN-PRP-75', 40, 0, 3.2),
  ('PO-8813', 'CLY-STW-SPK', 300, 180, 1.85),
  ('PO-8813', 'CLY-STW-WHT', 200, 200, 1.65),
  ('PO-8814', 'GLZ-OXD-03', 30, 0, 11.4);

-- SO-5108's address columns are all NULL because the deli collects, which the
-- schema's own check is what keeps distinguishable from a half-typed address.
-- SO-5109 goes to Harbour & Vine's second site while SO-5102 went to the
-- restaurant — the pair that says why the address is on the order.
INSERT INTO sales_orders (code, customer_id, status, placed_on, required_by,
                          deliver_to_name, deliver_to_line1, deliver_to_line2,
                          deliver_to_city, deliver_to_postcode, deliver_to_country) VALUES
  ('SO-5101', 'CUS-03', 'invoiced', '2026-05-28', '2026-06-11', 'Pennyfields Homeware', 'Unit 6, Colston Yard', NULL, 'Bristol', 'BS1 5DL', 'GB'),
  ('SO-5102', 'CUS-01', 'invoiced', '2026-06-05', '2026-06-19', 'Harbour & Vine', 'The Old Sail Loft', '3 Bar Road', 'Falmouth', 'TR11 4BN', 'GB'),
  ('SO-5103', 'CUS-05', 'invoiced', '2026-05-18', '2026-05-30', 'Otterbourne Kitchen', 'The Granary', 'Water Lane', 'Winchester', 'SO23 9EX', 'GB'),
  ('SO-5104', 'CUS-02', 'invoiced', '2026-06-22', '2026-07-06', 'The Salt Room', '18 Sea Street', NULL, 'Whitstable', 'CT5 1AP', 'GB'),
  ('SO-5105', 'CUS-04', 'invoiced', '2026-07-02', '2026-07-16', 'Bramble & Co', '4 Northgate Buildings', NULL, 'Bath', 'BA1 5AS', 'GB'),
  ('SO-5106', 'CUS-07', 'invoiced', '2026-07-10', '2026-07-24', 'Wrenfield Stores', 'Wrenfield Yard', 'Fossgate', 'York', 'YO1 9TA', 'GB'),
  ('SO-5107', 'CUS-06', 'invoiced', '2026-07-14', '2026-07-27', 'The Copper Pot', '11 Corve Street', NULL, 'Ludlow', 'SY8 1DA', 'GB'),
  ('SO-5108', 'CUS-08', 'picking', '2026-07-17', '2026-07-30', NULL, NULL, NULL, NULL, NULL, NULL),
  ('SO-5109', 'CUS-01', 'confirmed', '2026-07-21', '2026-07-31', 'Harbour & Vine — Truro', 'Unit 2, Tregoose Yard', NULL, 'Truro', 'TR1 2XN', 'GB'),
  -- The postcode here is HALF A POSTCODE, and it is seeded wrong on purpose:
  -- Pennyfields moved their stock to the warehouse at Avonmouth and the office
  -- copied the outward half off the old shop's letterhead. A works meets this
  -- every week, it is one field's worth of wrong, and anything that checks a
  -- postcode against a country will refuse it. See `src/data/demo.ts` for the
  -- whole argument about why the seed carries a defect at all.
  ('SO-5110', 'CUS-03', 'confirmed', '2026-07-22', '2026-08-04', 'Pennyfields Homeware — Avonmouth', 'Gate 3, Kingsweston Yard', NULL, 'Bristol', 'BS11', 'GB');

INSERT INTO sales_order_lines (so_code, sku, qty, alloc, price, run_code) VALUES
  ('SO-5101', 'PLT-260-SPK', 120, 120, 11.5, NULL),
  ('SO-5101', 'BWL-160-SPK', 80, 80, 8.4, NULL),
  ('SO-5102', 'SET-SVC-04', 24, 24, 42, NULL),
  ('SO-5102', 'MUG-300-HAR', 60, 60, 9.8, NULL),
  ('SO-5103', 'PLT-190-HAR', 200, 200, 7.2, NULL),
  ('SO-5104', 'BWL-160-HAR', 90, 90, 8.8, NULL),
  ('SO-5104', 'PLT-260-HAR', 60, 60, 12, NULL),
  ('SO-5105', 'MUG-300-SPK', 108, 108, 9.6, NULL),
  ('SO-5106', 'PLT-190-SPK', 120, 120, 6.8, NULL),
  ('SO-5106', 'BWL-160-SPK', 60, 60, 8.4, NULL),
  ('SO-5107', 'PLT-260-OXD', 48, 48, 12.5, NULL),
  ('SO-5107', 'MUG-300-HAR', 72, 72, 9.8, NULL),
  ('SO-5108', 'BWL-160-OXD', 60, 24, 9.2, NULL),
  ('SO-5108', 'MUG-300-SPK', 48, 48, 9.6, NULL),
  ('SO-5108', 'PLT-190-SPK', 90, 90, 6.8, NULL),
  ('SO-5109', 'MUG-300-OXD', 48, 36, 10.2, NULL),
  ('SO-5109', 'PLT-260-SPK', 96, 96, 11.5, NULL),
  ('SO-5109', 'PLT-190-OXD', 36, 36, 7.4, NULL),
  ('SO-5110', 'PLT-260-HAR', 72, 72, 12, NULL),
  ('SO-5110', 'MUG-300-HAR', 48, 48, 9.8, NULL);

INSERT INTO invoices (number, so_code, customer_id, issued_on, due_on) VALUES
  ('INV-9035', 'SO-5101', 'CUS-03', '2026-06-11', '2026-06-25'),
  ('INV-9036', 'SO-5102', 'CUS-01', '2026-06-19', '2026-07-03'),
  ('INV-9037', 'SO-5103', 'CUS-05', '2026-05-31', '2026-06-14'),
  ('INV-9038', 'SO-5104', 'CUS-02', '2026-07-03', '2026-07-17'),
  ('INV-9039', 'SO-5105', 'CUS-04', '2026-07-16', '2026-07-30'),
  ('INV-9040', 'SO-5106', 'CUS-07', '2026-07-24', '2026-08-07'),
  ('INV-9041', 'SO-5107', 'CUS-06', '2026-07-27', '2026-08-10');

INSERT INTO payments (invoice_no, paid_on, method, amount) VALUES
  ('INV-9035', '2026-06-24', 'transfer', 2462.4),
  ('INV-9036', '2026-07-01', 'transfer', 1915.2),
  ('INV-9038', '2026-07-20', 'transfer', 700),
  ('INV-9039', '2026-07-24', 'card', 500);

INSERT INTO count_sheets (code, zone, walked_by, opened_on, status) VALUES
  ('CNT-217', 'Glaze store', 'Priya S.', '2026-07-28', 'open'),
  ('CNT-216', 'Packing bay', 'Tomas B.', '2026-07-21', 'posted');

INSERT INTO count_lines (sheet_code, sku, counted) VALUES
  ('CNT-217', 'GLZ-SPK-01', NULL),
  ('CNT-217', 'GLZ-HAR-02', 17),
  ('CNT-217', 'GLZ-OXD-03', NULL),
  ('CNT-217', 'GLZ-CLR-04', 26),
  ('CNT-216', 'BOX-STD-12', 180),
  ('CNT-216', 'PKG-TIS-01', 5200),
  ('CNT-216', 'BOX-SET-01', 44),
  ('CNT-216', 'PKG-TAP-03', 22);

COMMIT;
