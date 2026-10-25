# Website học tiếng Anh

Hệ thống học tiếng Anh gồm Laravel API, learner Next.js và admin Next.js của
Nhóm 8. Trạng thái chức năng và phần còn thiếu được duy trì tại
[`docs/CURRENT_STATUS.md`](docs/CURRENT_STATUS.md).

## Công nghệ

- Laravel 13, PHP 8.3+
- MySQL 8 (chạy bằng Laragon trên Windows)
- Next.js cho learner (`frontend/`) và admin (`admin-frontend/`)
- PHPUnit, Laravel Pint và Vitest

## Cài đặt cho thành viên nhóm

Yêu cầu: Laragon (có PHP 8.3+, MySQL 8 và Mailpit), Composer, Node.js 20+ và Git.

### 1. Clone repository

```bash
git clone https://github.com/InfinityZero3000/php-learning-english-web.git
cd php-learning-english-web
```

Nếu đã clone trước đó:

```bash
git switch main
git pull --ff-only origin main
```

### 2. Tạo database và `.env`

Mở Laragon, bấm **Start All**, rồi tạo database `english_learning` với collation
`utf8mb4_unicode_ci` (nút **Database** của Laragon mở HeidiSQL). Sau đó tạo
`.env` từ file mẫu. Không gửi file này cho người khác và không commit lên Git.

```bash
cp .env.example .env
```

`.env.example` đã khớp với Laragon:

| Biến | Giá trị mặc định | Mục đích |
|---|---|---|
| `APP_URL` | `http://localhost:8080` | URL backend |
| `FRONTEND_URL` / `ADMIN_FRONTEND_URL` | `http://localhost:3000` / `http://localhost:3001` | Hai frontend |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `3306` | MySQL của Laragon |
| `DB_DATABASE` | `english_learning` | Database local |
| `DB_USERNAME` / `DB_PASSWORD` | `root` / để trống | Tài khoản MySQL mặc định của Laragon |
| `CACHE_STORE` / `QUEUE_CONNECTION` | `file` / `sync` | Không cần Redis hay queue worker khi chạy local |
| `MAIL_PORT` | `1025` | Mailpit của Laragon, xem thư tại <http://localhost:8025> |
| `FEATURE_AI` / `GEMINI_API_KEY` | `true` / để trống | AI Flashcards; dán key Gemini của bạn thì mới gọi được AI |

Các giá trị này chỉ dành cho development. Production dùng secrets riêng theo
[Production Environment Variables](docs/PRODUCTION_ENV.md).

### 3. Cài backend và tạo dữ liệu

```bash
composer install
php artisan key:generate
php artisan migrate --seed
php artisan test
```

Lệnh `key:generate` tự ghi `APP_KEY` vào `.env`. Mỗi thành viên dùng key local
riêng; không copy key production vào máy cá nhân.

### 4. Chạy hệ thống

Mở 3 terminal, mỗi terminal chạy một phần:

```bash
php artisan serve --port=8080
```

```bash
cd frontend && npm install && npm run dev
```

```bash
cd admin-frontend && npm install && npm run dev
```

| Phần | Địa chỉ |
|---|---|
| Backend API | <http://localhost:8080> |
| Learner (học viên, giáo viên) | <http://localhost:3000> |
| Admin | <http://localhost:3001> |
| Mailpit | <http://localhost:8025> |

Các điểm kiểm tra:

- `GET /`: chuyển sang learner frontend đã cấu hình.
- `GET /health`: readiness check cho ứng dụng, MySQL (và Redis nếu có dùng).
- `GET /admin`: chuyển sang admin Next.js; admin dùng xác thực session.
- `GET /api/status`: `{"status":"ok","version":"v1"}`.

## Lệnh kiểm tra

```bash
./vendor/bin/pint --test
php artisan test
php artisan migrate:rollback
php artisan migrate
cd frontend && npm test
curl http://localhost:8080/health
```

Health endpoint phải trả HTTP 200.

## Tài khoản demo

`database/seeders` chỉ tạo role, level, topic và course mẫu — **không tạo
user nào**. Không có tài khoản đăng nhập sẵn sau `migrate --seed`. Trên máy
local có thể tạo 4 tài khoản mẫu (mật khẩu `password123`, không dùng trên
server) bằng `php artisan db:seed --class=TestUserSeeder`.

- **Learner**: tạo bằng cách gọi `POST /api/v1/auth/register`, rồi mở Mailpit
  tại <http://localhost:8025> để bấm link xác minh email; hoặc xác minh nhanh
  bằng tinker:
  ```bash
  php artisan tinker --execute="
  \$u = App\Models\User::updateOrCreate(['email' => 'user@example.com'], [
    'name' => 'Demo Learner',
    'password' => Illuminate\Support\Facades\Hash::make('user123'),
    'role_id' => App\Models\Role::where('slug', 'learner')->value('id'),
  ]);
  \$u->markEmailAsVerified();
  "
  ```
  Sau bước này, `user@example.com` / `user123` đăng nhập được qua
  `POST /api/v1/auth/login` như bình thường (khớp `learner_email`/
  `learner_password` trong `postman/local.postman_environment.json`).
- **Admin / Super Admin**: mọi route `/api/v1/admin/catalog/*`, `/admin/users`,
  `/admin/operations/*` và `/admin/imports/*` nằm sau middleware `google.admin`
  — bắt buộc đăng nhập Google thật với email nằm trong `ADMIN_GOOGLE_EMAILS`/
  `SUPER_ADMIN_GOOGLE_EMAILS` (xem
  [Production Environment Variables](docs/PRODUCTION_ENV.md)). Không có cách
  giả lập hợp lệ bằng email/password hay Postman/curl thuần; phải cấu hình
  Google OAuth app thật + hai biến whitelist trên rồi đăng nhập qua trình
  duyệt tại admin frontend. Vì vậy các request admin trong Postman collection
  (folder `0b`, `5`, `6` và phần admin của `8`) chỉ chạy được thủ công sau khi
  đã có session Google-admin thật, không chạy được qua `newman run` một lượt.

## Postman

Bộ Postman collection + environment tại `postman/` là nguồn xác minh API
dùng chung cho toàn bộ `/api/v1` — issue tài liệu API (#26)
chỉ liên kết tới đây, không tạo bản sao khác.

```bash
php artisan migrate:fresh --seed
# Tạo tài khoản learner demo theo mục "Tài khoản demo" ở trên trước khi chạy
# bất kỳ folder nào cần đăng nhập.
# Import postman/php-learning-english-web.postman_collection.json
# và postman/local.postman_environment.json vào Postman, hoặc chạy CLI:
npx newman run postman/php-learning-english-web.postman_collection.json \
  -e postman/local.postman_environment.json --folder "0a - Login as Learner" \
  --folder "2 - Catalog" --folder "3 - Learning"
```

Ứng dụng xác thực bằng session + CSRF cookie (không dùng bearer token), nên
collection cần chạy đúng thứ tự đăng nhập/đăng xuất — xem mô tả trong
collection (`postman/php-learning-english-web.postman_collection.json`) để
biết chi tiết từng folder.

## Cấu trúc phát triển

- `app/Models`: model và quan hệ Eloquent nền.
- `database/migrations`: schema cho nội dung học, quiz và tiến độ.
- `database/seeders`: role, level và topic mẫu; không tạo user.
- `frontend/`: giao diện learner Next.js.
- `admin-frontend/`: giao diện admin và super admin Next.js.
- `routes`: điểm vào web và API.
- `docs/PROJECT_PLAN.md`: phân chia nhiệm vụ và phụ thuộc.
- `docs/CURRENT_STATUS.md`: trạng thái triển khai và backlog hiện hành.
- `docs/USER_GUIDE.md`: hướng dẫn learner, teacher, admin và super admin.
- `docs/architecture.md`: ranh giới hệ thống và luồng dữ liệu.
- `docs/DEVELOPMENT_WORKFLOW.md`: branch, push, Pull Request, PHPUnit và CI/CD Fly.io.
- `postman/`: Postman collection + environment dùng chung cho kiểm thử API thủ công.

Controller, Form Request, Policy, Resource và Service chỉ được tạo khi module nghiệp vụ tương ứng bắt đầu.

## Xử lý lỗi thường gặp

- **Port 8080 bị chiếm:** chạy `php artisan serve --port=8090`, rồi đổi `APP_URL` và chạy hai frontend với `LARAVEL_API_ORIGIN=http://localhost:8090`.
- **Thiếu application key:** chạy `php artisan key:generate`.
- **Không kết nối MySQL:** kiểm tra Laragon đã **Start All**, database `english_learning` đã tạo và `DB_HOST=127.0.0.1`.
- **Thay đổi env chưa có hiệu lực:** chạy `php artisan config:clear`.
- **Test file Excel báo thiếu `ZipArchive`:** bật extension `zip` trong PHP của Laragon (Menu → PHP → Extensions).
- **Muốn làm sạch database dev:** chạy `php artisan migrate:fresh --seed` (lệnh này xóa dữ liệu hiện có).

## Trạng thái triển khai

Auth/profile, catalog, quiz, progress, FSRS, learning session, teacher,
admin/super-admin và hai giao diện Next.js đã có implementation và test.
OpenAPI đã đồng bộ với runtime (parity hai chiều được `ApiContractParityTest`
khoá). Các việc còn lại trước release là mở `apply` sang đủ 6 entity import
(hiện chỉ `categories`), xác minh LexiLingo với provider thật, smoke test theo
vai trò trên staging và diễn tập backup/rollback; xem
[`docs/CURRENT_STATUS.md`](docs/CURRENT_STATUS.md).

Quy trình cộng tác và tự động deploy được mô tả tại [Development Workflow](docs/DEVELOPMENT_WORKFLOW.md).
