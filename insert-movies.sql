-- Insert 5 sample movies into the database

INSERT INTO movies (title, description, genre, director, cast_info, language, rated, duration_minutes, release_date, status, poster_url, created_at) VALUES
('Dune: Phần 2', 'Hành động dã tman khoa học viễn tưởng về hành tinh Arrakis', 'Sci-Fi', 'Denis Villeneuve', 'Timothée Chalamet, Zendaya, Oscar Isaac', 'Tiếng Anh - Phụ đề Tiếng Việt', 'T13', 166, '2026-03-15', 'now_showing', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=60', NOW()),

('Godzilla x Kong: Sự Trỗi Dậy', 'Phim hành động khoa học viễn tưởng về hai quái vật huyền thoại', 'Action', 'Adam Wingard', 'Rebecca Hall, Brian Tyree Henry, Dan Stevens', 'Tiếng Anh - Phụ đề Tiếng Việt', 'T13', 145, '2026-04-01', 'coming_soon', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=60', NOW()),

('Inside Out 2', 'Hoạt hình gia đình về cảm xúc và tuổi vị thành niên', 'Animation', 'Kelsey Mann', 'Amy Poehler, Phyllis Smith, Lewis Black', 'Lồng tiếng Việt', 'K', 96, '2026-03-20', 'now_showing', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=60', NOW()),

('Deadpool & Wolverine', 'Phim hành động một không hai với anh chàng mồm miệng', 'Action', 'Shawn Levy', 'Ryan Reynolds, Hugh Jackman, Emma Corrin', 'Tiếng Anh - Phụ đề Tiếng Việt', 'T16', 128, '2026-05-15', 'coming_soon', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=60', NOW()),

('Cô Dâu Tuyết Phía Bắc', 'Tình cảm lãng mạn đặt trong bối cảnh tuyết trắng', 'Romance', 'Trần Hữu Tấu', 'Cát Phượng, Lâm Vỹ Dạ, Trí Dũng', 'Tiếng Việt', 'T16', 115, '2026-04-10', 'now_showing', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=60', NOW());
