const FLOW_KEY = "bookingFlowV1";

const movieSelect = document.getElementById("movieSelect");
const theaterSelect = document.getElementById("theaterSelect");
const showtimeSelect = document.getElementById("showtimeSelect");
const movieDetail = document.getElementById("movieDetail");
const showtimeMeta = document.getElementById("showtimeMeta");
const continueToSeatBtn = document.getElementById("continueToSeatBtn");
const checkoutNotice = document.getElementById("checkoutNotice");
const movieSearchInput = document.getElementById("movieSearchInput");
const movieStatusFilter = document.getElementById("movieStatusFilter");
const movieGenreFilter = document.getElementById("movieGenreFilter");
const movieFormatFilter = document.getElementById("movieFormatFilter");
const clearMovieFilterBtn = document.getElementById("clearMovieFilterBtn");
const movieFilterResult = document.getElementById("movieFilterResult");

let movies = [];
let theaters = [];
let showtimes = [];

function movieProp(movie, camelKey, snakeKey, fallback = "") {
  if (!movie || typeof movie !== "object") return fallback;
  const value = movie[camelKey] ?? movie[snakeKey];
  return value == null ? fallback : value;
}

function parseGenreTokens(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getMovieFormats(movie) {
  if (Array.isArray(movie?.formatNames) && movie.formatNames.length) return movie.formatNames;
  if (Array.isArray(movie?.formats) && movie.formats.length) {
    return movie.formats.map((item) => item?.name).filter(Boolean);
  }
  return [];
}

function buildFilterOptions() {
  const genreSet = new Set();
  const formatSet = new Set();

  for (const movie of movies) {
    for (const genre of parseGenreTokens(movieProp(movie, "genre", "genre"))) {
      genreSet.add(genre);
    }
    for (const formatName of getMovieFormats(movie)) {
      formatSet.add(String(formatName));
    }
  }

  movieGenreFilter.innerHTML = ['<option value="">Tất cả thể loại</option>']
    .concat([...genreSet].sort((a, b) => a.localeCompare(b, "vi")).map((genre) => `<option value="${genre}">${genre}</option>`))
    .join("");

  movieFormatFilter.innerHTML = ['<option value="">Tất cả định dạng</option>']
    .concat([...formatSet].sort((a, b) => a.localeCompare(b, "vi")).map((formatName) => `<option value="${formatName}">${formatName}</option>`))
    .join("");
}

function getFilteredMovies() {
  const searchTerm = String(movieSearchInput.value || "").trim().toLowerCase();
  const statusFilter = movieStatusFilter.value;
  const genreFilter = movieGenreFilter.value;
  const formatFilter = movieFormatFilter.value;

  return movies.filter((movie) => {
    const title = String(movieProp(movie, "title", "title")).toLowerCase();
    const description = String(movieProp(movie, "description", "description")).toLowerCase();
    const director = String(movieProp(movie, "director", "director")).toLowerCase();
    const castText = String(movieProp(movie, "castInfo", "cast_info")).toLowerCase();
    const genreRaw = String(movieProp(movie, "genre", "genre"));
    const genreTokens = parseGenreTokens(genreRaw);
    const status = String(movieProp(movie, "status", "status"));
    const formats = getMovieFormats(movie);

    if (searchTerm) {
      const searchable = `${title} ${description} ${director} ${castText} ${genreRaw}`;
      if (!searchable.includes(searchTerm)) return false;
    }

    if (statusFilter && status !== statusFilter) return false;
    if (genreFilter && !genreTokens.includes(genreFilter)) return false;
    if (formatFilter && !formats.includes(formatFilter)) return false;

    return true;
  });
}

function renderMovieOptions(filteredMovies, preferredMovieId) {
  if (!filteredMovies.length) {
    movieSelect.innerHTML = '<option value="">Không có phim phù hợp bộ lọc</option>';
    movieSelect.disabled = true;
    return;
  }

  const nextMovieId = filteredMovies.some((item) => item.id === preferredMovieId)
    ? preferredMovieId
    : filteredMovies[0].id;

  movieSelect.innerHTML = filteredMovies
    .map((item) => `<option value="${item.id}" ${nextMovieId === item.id ? "selected" : ""}>${movieProp(item, "title", "title", "Phim")}</option>`)
    .join("");
  movieSelect.disabled = false;
}

function readFlow() {
  try {
    return JSON.parse(localStorage.getItem(FLOW_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeFlow(patch) {
  const current = readFlow();
  localStorage.setItem(
    FLOW_KEY,
    JSON.stringify({
      ...current,
      ...patch,
      selectedSeats: patch.selectedSeats || current.selectedSeats || [],
      combos: patch.combos || current.combos || [],
    })
  );
}

function selectedMovieId() {
  return Number(movieSelect.value || 0);
}

function selectedTheaterId() {
  return Number(theaterSelect.value || 0);
}

function selectedShowtimeId() {
  return Number(showtimeSelect.value || 0);
}

function renderMovieDetail() {
  const movie = movies.find((item) => item.id === selectedMovieId());
  if (!movie) {
    movieDetail.textContent = "Không tìm thấy phim.";
    return;
  }

  movieDetail.innerHTML = `
    <div><strong>${movieProp(movie, "title", "title", "Phim")}</strong></div>
    <div>Đạo diễn: ${movieProp(movie, "director", "director", "Đang cập nhật")}</div>
    <div>Diễn viên: ${movieProp(movie, "castInfo", "cast_info", "Đang cập nhật")}</div>
    <div>Ngôn ngữ: ${movieProp(movie, "language", "language", "Đang cập nhật")}</div>
    <div>Rated: ${movieProp(movie, "rated", "rated", "Đang cập nhật")}</div>
    <div>Thể loại: ${movieProp(movie, "genre", "genre", "Đang cập nhật")}</div>
    <div>Thời lượng: ${movieProp(movie, "durationMinutes", "duration_minutes", "?")} phút</div>
    <div>Mô tả: ${movieProp(movie, "description", "description", "Chưa có mô tả")}</div>
  `;
}

function applyMovieFilter(preferredMovieId = selectedMovieId()) {
  const filteredMovies = getFilteredMovies();
  renderMovieOptions(filteredMovies, preferredMovieId);

  if (!filteredMovies.length) {
    movieFilterResult.textContent = "Không có phim nào khớp bộ lọc.";
    movieDetail.textContent = "Không có phim phù hợp.";
    theaterSelect.innerHTML = '<option value="">Không có rạp phù hợp</option>';
    showtimeSelect.innerHTML = '<option value="">Không có suất chiếu phù hợp</option>';
    theaterSelect.disabled = true;
    showtimeSelect.disabled = true;
    showtimeMeta.textContent = "Không có suất chiếu cho bộ lọc hiện tại.";
    continueToSeatBtn.disabled = true;
    return;
  }

  const movieCount = filteredMovies.length;
  movieFilterResult.textContent = `Đang hiển thị ${movieCount} phim phù hợp.`;
  theaterSelect.disabled = false;
  continueToSeatBtn.disabled = false;
  renderMovieDetail();
  renderTheaterOptionsForMovie();
  renderShowtimes();
}

function renderTheaterOptionsForMovie() {
  const movieId = selectedMovieId();
  const previousTheaterId = selectedTheaterId();

  const theaterIdsWithShowtime = new Set(
    showtimes.filter((item) => !movieId || item.movieId === movieId).map((item) => item.theaterId)
  );

  const theaterOptions = ['<option value="">Tất cả rạp có suất</option>'].concat(
    theaters
      .filter((item) => theaterIdsWithShowtime.has(item.id))
      .map((item) => `<option value="${item.id}">${item.name} - ${item.city || ""}</option>`)
  );

  theaterSelect.innerHTML = theaterOptions.join("");

  if (previousTheaterId && theaterIdsWithShowtime.has(previousTheaterId)) {
    theaterSelect.value = String(previousTheaterId);
  } else {
    theaterSelect.value = "";
  }
}

function renderShowtimeMeta() {
  const showtime = showtimes.find((item) => item.id === selectedShowtimeId());
  if (!showtime) {
    showtimeMeta.textContent = "Chọn suất chiếu để hiển thị thông tin chi tiết.";
    return;
  }

  showtimeMeta.innerHTML = `
    <strong>${showtime.movieTitle}</strong> | ${showtime.theaterName}<br />
    Suất chiếu: ${formatDateTime(showtime.startTime)} | Giá: ${formatCurrency(showtime.price)}
  `;
}

function renderShowtimes() {
  const filtered = showtimes.filter(
    (item) => (!selectedMovieId() || item.movieId === selectedMovieId()) && (!selectedTheaterId() || item.theaterId === selectedTheaterId())
  );

  if (filtered.length === 0) {
    showtimeSelect.innerHTML = '<option value="">Chưa có suất chiếu phù hợp</option>';
    showtimeSelect.disabled = true;
    showtimeMeta.textContent = "Không có suất chiếu cho lựa chọn hiện tại. Thử đổi phim hoặc rạp.";
    return;
  }

  showtimeSelect.innerHTML = filtered
    .map((item) => `<option value="${item.id}">${item.movieTitle} - ${item.theaterName} - ${formatDateTime(item.startTime)} - ${formatCurrency(item.price)}</option>`)
    .join("");
  showtimeSelect.disabled = false;

  const flow = readFlow();
  if (flow.showtimeId && filtered.some((item) => item.id === Number(flow.showtimeId))) {
    showtimeSelect.value = String(flow.showtimeId);
  }

  renderShowtimeMeta();
}

function persistCurrentSelection() {
  const showtime = showtimes.find((item) => item.id === selectedShowtimeId());
  if (!showtime) {
    return;
  }

  writeFlow({
    movieId: showtime.movieId,
    theaterId: showtime.theaterId,
    showtimeId: showtime.id,
    selectedSeats: [],
    combos: [],
    paymentMethod: "cash",
    createdAt: Date.now(),
  });
}

function applyInitialSelection() {
  const params = new URLSearchParams(window.location.search);
  const movieParamId = Number(params.get("id") || 0);
  const flow = readFlow();

  const movieWithShowtimeIds = new Set(showtimes.map((item) => item.movieId));
  let initialMovieId = movieParamId || Number(flow.movieId || 0);
  if (!initialMovieId || !movieWithShowtimeIds.has(initialMovieId)) {
    initialMovieId = showtimes[0]?.movieId || movies[0]?.id || 0;
  }

  applyMovieFilter(initialMovieId);

  if (flow.theaterId && Array.from(theaterSelect.options).some((option) => Number(option.value || 0) === Number(flow.theaterId))) {
    theaterSelect.value = String(flow.theaterId);
  }
}

async function initPage() {
  try {
    const [moviesPayload, theatersPayload, showtimesPayload] = await Promise.all([
      API.get("/api/movies"),
      API.get("/api/theaters"),
      API.get("/api/showtimes"),
    ]);

    movies = moviesPayload.data || [];
    theaters = theatersPayload.data || [];
    showtimes = showtimesPayload.data || [];

    buildFilterOptions();

    if (!movies.length || !showtimes.length) {
      checkoutNotice.textContent = "Hiện chưa có dữ liệu phim hoặc suất chiếu.";
      continueToSeatBtn.disabled = true;
      return;
    }

    applyInitialSelection();

    movieSelect.addEventListener("change", () => {
      renderMovieDetail();
      renderTheaterOptionsForMovie();
      renderShowtimes();
      persistCurrentSelection();
    });

    theaterSelect.addEventListener("change", () => {
      renderShowtimes();
      persistCurrentSelection();
    });

    showtimeSelect.addEventListener("change", () => {
      renderShowtimeMeta();
      persistCurrentSelection();
    });

    movieSearchInput.addEventListener("input", () => {
      applyMovieFilter();
      persistCurrentSelection();
    });

    movieStatusFilter.addEventListener("change", () => {
      applyMovieFilter();
      persistCurrentSelection();
    });

    movieGenreFilter.addEventListener("change", () => {
      applyMovieFilter();
      persistCurrentSelection();
    });

    movieFormatFilter.addEventListener("change", () => {
      applyMovieFilter();
      persistCurrentSelection();
    });

    clearMovieFilterBtn.addEventListener("click", () => {
      movieSearchInput.value = "";
      movieStatusFilter.value = "";
      movieGenreFilter.value = "";
      movieFormatFilter.value = "";
      applyMovieFilter();
      persistCurrentSelection();
    });

    continueToSeatBtn.addEventListener("click", () => {
      const showtime = showtimes.find((item) => item.id === selectedShowtimeId());
      if (!showtime) {
        checkoutNotice.textContent = "Vui lòng chọn suất chiếu trước khi tiếp tục.";
        return;
      }

      persistCurrentSelection();
      window.location.href = `movie-seat.html?showtimeId=${showtime.id}`;
    });

    persistCurrentSelection();
  } catch (error) {
    checkoutNotice.textContent = error.message;
  }
}

initPage();
