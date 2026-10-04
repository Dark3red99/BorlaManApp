-- Launch prices, anchored to Accra market rates (Jumeni 2026: GH₵40–50
-- on-demand / GH₵30 weekly for a 240L bin, GH₵150 for 1100L). Keep in sync
-- with constants/waste.ts until the app reads these rows directly.

insert into public.size_bands (kg, label, hint, short, on_demand_ghs, plan_ghs, sort) values
  (10, 'Small',  '1–2 bags',                 '1–2 bags',   20,  15, 1),
  (25, 'Medium', '120L bin · 3–4 bags',      '120L bin',   30,  22, 2),
  (50, 'Large',  '240L bin · 5–6 bags',      '240L bin',   40,  30, 3),
  (80, 'Bulky',  'Bulky load · up to 1100L', 'Bulky load', 140, 110, 4);

insert into public.waste_type_rates (type, label, multiplier) values
  ('household',   'Household',   1.0),
  ('recyclables', 'Recyclables', 0.8),
  ('organic',     'Organic',     0.9),
  ('ewaste',      'E-Waste',     1.5),
  ('mixed',       'Mixed',       1.2);

insert into public.pricing_settings (priority_fee_ghs, points_per_kg, co2_per_kg) values (5, 6, 0.4);
