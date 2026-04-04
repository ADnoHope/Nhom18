const { getPool } = require('./src/db');

const newMovies = [
  {
    title: 'Dune: Phần 2',
    description: 'Hành động dã man khoa học viễn tưởng về hành tinh Arrakis',
    genre: 'Sci-Fi',
    director: 'Denis Villeneuve',
    cast_info: 'Timothée Chalamet, Zendaya, Oscar Isaac',
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    rated: 'T13',
    duration_minutes: 166,
    release_date: '2026-03-15',
    status: 'now_showing',
    poster_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=60'
  },
  {
    title: 'Godzilla x Kong: Sự Trỗi Dậy',
    description: 'Phim hành động khoa học viễn tưởng về hai quái vật huyền thoại',
    genre: 'Action',
    director: 'Adam Wingard',
    cast_info: 'Rebecca Hall, Brian Tyree Henry, Dan Stevens',
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    rated: 'T13',
    duration_minutes: 145,
    release_date: '2026-04-01',
    status: 'coming_soon',
    poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=60'
  },
  {
    title: 'Inside Out 2',
    description: 'Hoạt hình gia đình về cảm xúc và tuổi vị thành niên',
    genre: 'Animation',
    director: 'Kelsey Mann',
    cast_info: 'Amy Poehler, Phyllis Smith, Lewis Black',
    language: 'Lồng tiếng Việt',
    rated: 'K',
    duration_minutes: 96,
    release_date: '2026-03-20',
    status: 'now_showing',
    poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=60'
  },
  {
    title: 'Deadpool & Wolverine',
    description: 'Phim hành động một không hai với anh chàng mồm miệng',
    genre: 'Action',
    director: 'Shawn Levy',
    cast_info: 'Ryan Reynolds, Hugh Jackman, Emma Corrin',
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    rated: 'T16',
    duration_minutes: 128,
    release_date: '2026-05-15',
    status: 'coming_soon',
    poster_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=60'
  },
  {
    title: 'Cô Dâu Tuyết Phía Bắc',
    description: 'Tình cảm lãng mạn đặt trong bối cảnh tuyết trắng',
    genre: 'Romance',
    director: 'Trần Hữu Tấu',
    cast_info: 'Cát Phượng, Lâm Vỹ Dạ, Trí Dũng',
    language: 'Tiếng Việt',
    rated: 'T16',
    duration_minutes: 115,
    release_date: '2026-04-10',
    status: 'now_showing',
    poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=60'
  }
];

async function insertMovies() {
  try {
    const pool = getPool();
    
    for (const movie of newMovies) {
      const query = `
        INSERT INTO movies 
        (title, description, genre, director, cast_info, language, rated, duration_minutes, release_date, status, poster_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await pool.query(query, [
        movie.title,
        movie.description,
        movie.genre,
        movie.director,
        movie.cast_info,
        movie.language,
        movie.rated,
        movie.duration_minutes,
        movie.release_date,
        movie.status,
        movie.poster_url
      ]);
      
      console.log(`✓ Inserted: ${movie.title}`);
    }
    
    console.log(`\n✓ Successfully inserted ${newMovies.length} movies!`);
    process.exit(0);
  } catch (error) {
    console.error('Error inserting movies:', error.message);
    process.exit(1);
  }
}

insertMovies();
