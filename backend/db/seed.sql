INSERT INTO achievements (id, name, description, icon, xp_reward, threshold, metric) VALUES
  ('first-workout',  'Primer entreno',           'Completaste tu primera sesión',           '🏋️', 50,  1,  'sessions'),
  ('sessions-10',    '10 entrenos completados',  'Ya llevas 10 sesiones en el historial',   '💪', 100, 10, 'sessions'),
  ('streak-7',       'Semana perfecta',          '7 días seguidos entrenando',              '🔥', 150, 7,  'streak'),
  ('streak-30',      'Mes sin parar',            '30 días de racha',                        '🏆', 300, 30, 'streak'),
  ('form-80',        'Técnica sólida',           'Precisión de forma ≥ 80% en una sesión',  '⭐', 75,  80, 'form_accuracy'),
  ('meals-50',       'Nutrición comprometida',   '50 comidas registradas en el diario',     '🥗', 60,  50, 'meals_logged')
ON CONFLICT (id) DO NOTHING;
