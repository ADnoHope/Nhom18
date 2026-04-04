const { sendJson, sendBadRequest, parseIdFromPath, readJsonBody } = require("../utils");
const { attachFormatsToMovies, buildSeatMap, getLastRowCode, isPremiumViewSeatLabel, getTakenSeats } = require("../utils/movie");
const { requireAuth } = require("../middlewares/auth");

async function getAllMovies(req, res, { pool, requestUrl }) {
	const status = requestUrl.searchParams.get("status");
	const baseQuery = `
		SELECT
			id,
			title,
			description,
			genre,
			director,
			cast_info AS castInfo,
			language,
			rated,
			duration_minutes AS durationMinutes,
			release_date AS releaseDate,
			status,
			poster_url AS posterUrl,
			created_at AS createdAt
		FROM movies
	`;
	const sql = status ? `${baseQuery} WHERE status = ? ORDER BY id DESC` : `${baseQuery} ORDER BY id DESC`;
	const [rows] = await pool.query(sql, status ? [status] : []);
	await attachFormatsToMovies(pool, rows);
	sendJson(res, 200, { ok: true, data: rows });
}

async function getMovieById(req, res, { pool, pathname }) {
	const movieId = parseIdFromPath(pathname, "/api/movies");
	const [rows] = await pool.query(
		`SELECT
			id,
			title,
			description,
			genre,
			director,
			cast_info AS castInfo,
			language,
			rated,
			duration_minutes AS durationMinutes,
			release_date AS releaseDate,
			status,
			poster_url AS posterUrl,
			created_at AS createdAt
		FROM movies
		WHERE id = ?
		LIMIT 1`,
		[movieId]
	);
	if (!rows.length) return sendJson(res, 404, { ok: false, message: "Không tìm thấy phim" });
	const [showtimes] = await pool.query(`SELECT s.*, f.name AS formatName, t.name AS theaterName FROM showtimes s JOIN theaters t ON t.id = s.theater_id LEFT JOIN movie_formats f ON f.id = s.format_id WHERE s.movie_id = ? ORDER BY s.start_time ASC`, [movieId]);
	await attachFormatsToMovies(pool, rows);
	sendJson(res, 200, { ok: true, data: { ...rows[0], showtimes } });
}

async function getAllFormats(req, res, { pool }) {
	const [rows] = await pool.query("SELECT * FROM movie_formats ORDER BY name ASC");
	sendJson(res, 200, { ok: true, data: rows });
}

async function getAllTheaters(req, res, { pool }) {
	const [rows] = await pool.query("SELECT * FROM theaters ORDER BY id DESC");
	sendJson(res, 200, { ok: true, data: rows });
}

async function getShowtimes(req, res, { pool, requestUrl }) {
	const movieFilter = requestUrl.searchParams.get("movieId");
	const theaterFilter = requestUrl.searchParams.get("theaterId");
	const params = [];
	let sql = `SELECT s.*, m.title AS movieTitle, t.name AS theaterName, f.name AS formatName FROM showtimes s JOIN movies m ON m.id = s.movie_id JOIN theaters t ON t.id = s.theater_id LEFT JOIN movie_formats f ON f.id = s.format_id`;
	const cond = [];
	if (movieFilter) { cond.push("s.movie_id = ?"); params.push(movieFilter); }
	if (theaterFilter) { cond.push("s.theater_id = ?"); params.push(theaterFilter); }
	if (cond.length) sql += ` WHERE ${cond.join(" AND ")}`;
	sql += " ORDER BY s.start_time ASC";
	const [rows] = await pool.query(sql, params);
	sendJson(res, 200, { ok: true, data: rows });
}

async function getSeatsForShowtime(req, res, { pool, pathname }) {
	const showtimeId = Number(pathname.match(/^\/api\/showtimes\/(\d+)\/seats$/)[1]);
	const [rows] = await pool.query(`SELECT s.*, f.name AS formatName FROM showtimes s LEFT JOIN movie_formats f ON f.id = s.format_id WHERE s.id = ? LIMIT 1`, [showtimeId]);
	if (!rows.length) return sendJson(res, 404, { ok: false, message: "Không tìm thấy suất chiếu" });
	const formatName = rows[0].formatName || "2D";
	const allSeats = buildSeatMap(formatName, rows[0].total_seats);
	const lastRow = getLastRowCode(formatName, rows[0].total_seats);
	const taken = await getTakenSeats(pool, showtimeId);
	sendJson(res, 200, { ok: true, data: { showtimeId, seats: allSeats.map(label => ({ label, taken: taken.has(label), seatType: label.startsWith(lastRow) ? "couple" : isPremiumViewSeatLabel(label) ? "premium" : "standard" })) } });
}

async function getMovieReviews(req, res, { pool, pathname, authUser }) {
	const movieIdMatch = pathname.match(/^\/api\/movies\/(\d+)\/reviews$/);
	const movieId = Number(movieIdMatch?.[1] || 0);
	if (!movieId) return sendBadRequest(res, "Id phim không hợp lệ");

	const [[movie]] = await pool.query("SELECT id FROM movies WHERE id = ? LIMIT 1", [movieId]);
	if (!movie) return sendJson(res, 404, { ok: false, message: "Không tìm thấy phim" });

	const [rows] = await pool.query(
		`SELECT r.id, r.user_id AS userId, u.full_name AS fullName, r.rating, r.comment, r.created_at AS createdAt
		 FROM reviews r
		 JOIN users u ON u.id = r.user_id
		 WHERE r.movie_id = ?
		 ORDER BY r.created_at DESC`,
		[movieId]
	);

	const [[stats]] = await pool.query(
		"SELECT COUNT(*) AS totalReviews, ROUND(AVG(rating), 1) AS avgRating FROM reviews WHERE movie_id = ?",
		[movieId]
	);

	const myReview = authUser
		? rows.find((item) => Number(item.userId) === Number(authUser.id)) || null
		: null;

	sendJson(res, 200, {
		ok: true,
		data: {
			reviews: rows,
			summary: {
				totalReviews: Number(stats?.totalReviews || 0),
				avgRating: Number(stats?.avgRating || 0),
			},
			myReview,
		},
	});
}

async function createOrUpdateMovieReview(req, res, context) {
	const user = context.authUser || await requireAuth(req, res, context);
	if (!user) return;

	const movieIdMatch = context.pathname.match(/^\/api\/movies\/(\d+)\/reviews$/);
	const movieId = Number(movieIdMatch?.[1] || 0);
	if (!movieId) return sendBadRequest(res, "Id phim không hợp lệ");

	const [[movie]] = await context.pool.query("SELECT id FROM movies WHERE id = ? LIMIT 1", [movieId]);
	if (!movie) return sendJson(res, 404, { ok: false, message: "Không tìm thấy phim" });

	const body = await readJsonBody(req);
	const rating = Number(body.rating);
	const commentText = body.comment == null ? "" : String(body.comment).trim();
	if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
		return sendBadRequest(res, "Điểm đánh giá phải từ 1 đến 5");
	}
	if (commentText.length > 1000) {
		return sendBadRequest(res, "Bình luận tối đa 1000 ký tự");
	}

	const [[existing]] = await context.pool.query(
		"SELECT id FROM reviews WHERE movie_id = ? AND user_id = ? LIMIT 1",
		[movieId, user.id]
	);

	if (existing) {
		await context.pool.query(
			"UPDATE reviews SET rating = ?, comment = ? WHERE id = ?",
			[rating, commentText || null, existing.id]
		);
		sendJson(res, 200, { ok: true, message: "Đã cập nhật đánh giá" });
		return;
	}

	await context.pool.query(
		"INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES (?, ?, ?, ?)",
		[user.id, movieId, rating, commentText || null]
	);

	sendJson(res, 201, { ok: true, message: "Gửi đánh giá thành công" });
}

module.exports = {
	getAllMovies,
	getMovieById,
	getAllFormats,
	getAllTheaters,
	getShowtimes,
	getSeatsForShowtime,
	getMovieReviews,
	createOrUpdateMovieReview,
};
