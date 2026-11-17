# Website học tiếng Anh (Englisk-Studi)

Hệ thống học tiếng Anh gồm **Laravel 13 API** (PHP 8.3+, MySQL 8), **Learner Next.js** (`frontend/`) và **Admin Next.js** (`admin-frontend/`).

## Yêu cầu môi trường

- Laragon (PHP 8.3+ có bật extension `zip`, MySQL 8, Mailpit), Composer, Node.js 20+, pnpm.

## Cài đặt & chạy local

1. Mở Laragon → **Start All** → tạo database `english_learning` (`utf8mb4_unicode_ci`).
2. Cấu hình và cài đặt backend:

```bash
git clone https://github.com/Huhhuu/engrisk-learning-website.git
cd engrisk-learning-website
cp .env.example .env          # điền GEMINI_API_KEY nếu dùng AI Flashcards
composer install
php artisan key:generate
php artisan migrate --seed
php artisan db:seed --class=TestUserSeeder
```

3. Chạy 3 terminal song song:

```bash
php artisan serve --port=8080
```

```bash
cd frontend && pnpm install && pnpm dev
```

```bash
cd admin-frontend && npm install && npm run dev
```

| Thành phần | Địa chỉ |
|---|---|
| Backend API | <http://localhost:8080> (health: `/health`) |
| Learner & Teacher UI | <http://localhost:3000> |
| Admin UI | <http://localhost:3001> |
| Mailpit (mail local) | <http://localhost:8025> |

## Tài khoản demo (local)

| Vai trò | Đăng nhập | Ghi chú |
|---|---|---|
| Learner | `learner@example.com` / `password123` | Đăng nhập tại `:3000/login` |
| Teacher | `teacher@example.com` / `password123` | Đăng nhập tại `:3000/login` → mục **Giáo viên** |
| Admin / Super Admin | Nút **Đăng nhập nhanh Super Admin (Local Dev)** | Chỉ chạy khi `APP_ENV=local` tại `:3001/login`; production bắt buộc Google OAuth khớp `ADMIN_GOOGLE_EMAILS` / `SUPER_ADMIN_GOOGLE_EMAILS` |

## Kiểm tra

```bash
./vendor/bin/pint --test
php artisan test
cd frontend && pnpm test
cd admin-frontend && npm test
```

## Triển khai & tài liệu

- **Production:** deploy `frontend/` và `admin-frontend/` lên Vercel (cài biến `LARAVEL_API_ORIGIN`), deploy backend Laravel + MySQL trên host PHP riêng — chi tiết xem [Production Environment Variables](docs/PRODUCTION_ENV.md).
- **Tài liệu khác:** [Hướng dẫn sử dụng](docs/USER_GUIDE.md) · [Trạng thái hiện hành](docs/CURRENT_STATUS.md) · [Kiến trúc](docs/architecture.md) · [Quy trình Git & CI](docs/DEVELOPMENT_WORKFLOW.md) · [Postman collection](postman/).
