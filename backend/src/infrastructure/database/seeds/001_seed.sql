INSERT INTO users (id, name, email, balance) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Alice García',   'alice@example.com',  100000.00),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Bob Martínez',   'bob@example.com',     50000.00),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Carlos López',   'carlos@example.com',  25000.00),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Diana Sánchez',  'diana@example.com',   75000.00)
ON CONFLICT (email) DO NOTHING;
