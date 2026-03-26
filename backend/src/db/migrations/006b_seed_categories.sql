insert into service_categories (slug, label, icon, vertical)
values
  ('hair', 'Hair & Salon', 'scissors', 'hair'),
  ('spa', 'Spa & Massage', 'leaf', 'spa'),
  ('nails', 'Nails & Beauty', 'sparkle', 'nails'),
  ('barbers', 'Barbers', 'clipper', 'barbers'),
  ('medspa', 'MedSpa & Aesthetics', 'star', 'medspa'),
  ('fitness', 'Fitness & Personal Training', 'barbell', 'fitness'),
  ('wellness', 'Wellness & Recovery', 'lotus', 'wellness'),
  ('other', 'Other Services', 'grid', 'other')
on conflict (slug) do update
set label = excluded.label,
    icon = excluded.icon,
    vertical = excluded.vertical;
