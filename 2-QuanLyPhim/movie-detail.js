const detailTitle = document.getElementById("detailTitle");
const detailMeta = document.getElementById("detailMeta");
const detailDescription = document.getElementById("detailDescription");
const detailPoster = document.getElementById("detailPoster");
const bookNowBtn = document.getElementById("bookNowBtn");
const reviewSummaryScore = document.getElementById("reviewSummaryScore");
const reviewForm = document.getElementById("reviewForm");
const reviewRating = document.getElementById("reviewRating");
const reviewComment = document.getElementById("reviewComment");
const reviewFormNotice = document.getElementById("reviewFormNotice");
const submitReviewBtn = document.getElementById("submitReviewBtn");
const reviewList = document.getElementById("reviewList");

let currentUser = null;

function getMovieIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("id") || 0);
}

function safeText(value, fallback = "Đang cập nhật") {
  return value ? String(value) : fallback;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNamesText(movie) {
  if (Array.isArray(movie?.formatNames) && movie.formatNames.length) {
    return movie.formatNames.join(", ");
  }

  if (Array.isArray(movie?.formats) && movie.formats.length) {
    return movie.formats.map((item) => item?.name).filter(Boolean).join(", ");
  }

  return "Đang cập nhật";
}

async function loadAuthUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = await API.get("/api/auth/me");
    return payload?.user || null;
  } catch {
    return null;
  }
}

function renderReviewSummary(summary) {
  const totalReviews = Number(summary?.totalReviews || 0);
  const avgRating = Number(summary?.avgRating || 0);
  reviewSummaryScore.textContent = `${avgRating.toFixed(1)}/5 (${totalReviews} đánh giá)`;
}

function renderReviews(reviews) {
  if (!Array.isArray(reviews) || !reviews.length) {
    reviewList.innerHTML = `<p class="empty-note">Chưa có bình luận nào cho phim này.</p>`;
    return;
  }

  reviewList.innerHTML = reviews.map((item) => {
    const reviewerName = escapeHtml(item.fullName || "Người dùng");
    const rating = Number(item.rating || 0);
    const comment = item.comment ? `<p class="review-comment">${escapeHtml(item.comment)}</p>` : "";
    const createdAt = item.createdAt ? formatDateTime(item.createdAt) : "";

    return `
      <article class="review-card">
        <div class="review-card-head">
          <p class="review-author">${reviewerName}</p>
          <p class="review-stars">${"★".repeat(Math.max(0, Math.min(5, rating)))}${"☆".repeat(Math.max(0, 5 - Math.min(5, rating)))}</p>
        </div>
        ${comment}
        <p class="review-time">${escapeHtml(createdAt)}</p>
      </article>
    `;
  }).join("");
}

function renderReviewFormState(user) {
  const isLoggedIn = Boolean(user);
  reviewRating.disabled = !isLoggedIn;
  reviewComment.disabled = !isLoggedIn;
  submitReviewBtn.disabled = !isLoggedIn;
  reviewFormNotice.textContent = isLoggedIn
    ? "Bạn có thể cập nhật đánh giá bất cứ lúc nào."
    : "Đăng nhập để gửi đánh giá.";
}

async function loadMovieReviews(movieId) {
  const payload = await API.get(`/api/movies/${movieId}/reviews`);
  const data = payload?.data || {};

  renderReviewSummary(data.summary);
  renderReviews(data.reviews || []);

  if (data.myReview) {
    reviewRating.value = String(data.myReview.rating || 5);
    reviewComment.value = data.myReview.comment || "";
    submitReviewBtn.textContent = "Cập nhật đánh giá";
  } else {
    submitReviewBtn.textContent = "Gửi đánh giá";
  }
}

function attachReviewForm(movieId) {
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) {
      reviewFormNotice.textContent = "Vui lòng đăng nhập trước khi đánh giá.";
      return;
    }

    try {
      submitReviewBtn.disabled = true;
      await API.post(`/api/movies/${movieId}/reviews`, {
        rating: Number(reviewRating.value),
        comment: reviewComment.value.trim(),
      });
      reviewFormNotice.textContent = "Gửi đánh giá thành công.";
      await loadMovieReviews(movieId);
    } catch (error) {
      reviewFormNotice.textContent = error.message || "Không thể gửi đánh giá";
    } finally {
      submitReviewBtn.disabled = !currentUser;
    }
  });
}

async function loadMovieDetail() {
  const movieId = getMovieIdFromQuery();
  currentUser = await loadAuthUser();
  renderReviewFormState(currentUser);
  attachReviewForm(movieId);

  if (!movieId) {
    detailTitle.textContent = "Không tìm thấy phim";
    detailDescription.textContent = "Liên kết không hợp lệ hoặc thiếu id phim.";
    return;
  }

  try {
    const payload = await API.get(`/api/movies/${movieId}`);
    const movie = payload?.data;
    if (!movie) {
      throw new Error("Không tìm thấy dữ liệu phim");
    }

    detailTitle.textContent = safeText(movie.title, "Phim");
    detailDescription.textContent = safeText(movie.description, "Chưa có mô tả phim.");

    detailMeta.innerHTML = `
      <p><strong>Đạo diễn:</strong> ${safeText(movie.director)}</p>
      <p><strong>Diễn viên:</strong> ${safeText(movie.castInfo)}</p>
      <p><strong>Thể loại:</strong> ${safeText(movie.genre)}</p>
      <p><strong>Định dạng:</strong> ${formatNamesText(movie)}</p>
      <p><strong>Thời lượng phim:</strong> ${movie.durationMinutes ? `${movie.durationMinutes} phút` : "Đang cập nhật"}</p>
      <p><strong>Khởi chiếu:</strong> ${movie.releaseDate ? formatDateTime(movie.releaseDate).split(",")[0] : "Đang cập nhật"}</p>
      <p><strong>Ngôn ngữ:</strong> ${safeText(movie.language)}</p>
      <p><strong>Rated:</strong> ${safeText(movie.rated)}</p>
    `;

    if (movie.posterUrl) {
      detailPoster.style.backgroundImage = `url(${movie.posterUrl})`;
    }

    bookNowBtn.href = `movie.html?id=${movie.id}`;
    await loadMovieReviews(movieId);
  } catch (error) {
    detailTitle.textContent = "Không tải được chi tiết phim";
    detailDescription.textContent = error.message;
    reviewFormNotice.textContent = "Không tải được dữ liệu đánh giá.";
  }
}

loadMovieDetail();
