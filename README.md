# Fashion Marketplace - Web Quần Áo

Ứng dụng thương mại điện tử bán quần áo với hai phần: Backend (Spring Boot) và Frontend (React).

## 📋 Yêu cầu Hệ thống

Trước khi chạy dự án, hãy đảm bảo bạn đã cài đặt:

- **Java JDK 17+** - [Download](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/mysql/)
- **Maven** - Thường đi kèm với JDK hoặc có thể tải từ [Apache Maven](https://maven.apache.org/)

### Kiểm tra cài đặt

```bash
# Kiểm tra Java
java -version

# Kiểm tra Node.js
node -v
npm -v

# Kiểm tra MySQL
mysql --version
```

---

## 🗄️ Thiết lập Cơ sở Dữ liệu

### 1. Khởi động MySQL

Đảm bảo MySQL đang chạy trên máy của bạn.

### 2. Tạo cơ sở dữ liệu

Mở MySQL Command Line hoặc bất kỳ MySQL Client nào và chạy:

```sql
CREATE DATABASE fashion_marketplace;
```

### 3. Cấp quyền cho user root

```sql
-- Nếu bạn muốn sử dụng mật khẩu cho user root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password_của_bạn';
FLUSH PRIVILEGES;
```

---

## ⚙️ Cấu hình Backend

### 1. Vào thư mục BE

```bash
cd BE
```

### 2. Cấu hình kết nối cơ sở dữ liệu

Mở file: `src/main/resources/application.properties`

Cập nhật các thông tin sau:

```properties
# Nếu MySQL không có mật khẩu (để trống)
spring.datasource.url=jdbc:mysql://localhost:3306/fashion_marketplace?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true&characterEncoding=UTF-8
spring.datasource.username=root
spring.datasource.password=

# HOẶC nếu MySQL có mật khẩu
spring.datasource.url=jdbc:mysql://localhost:3306/fashion_marketplace?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true&characterEncoding=UTF-8
spring.datasource.username=root
spring.datasource.password=password_của_bạn
```

### 3. Chạy Backend

Từ thư mục `BE`, chạy lệnh:

```bash
# Sử dụng mvnw (Maven Wrapper)
./mvnw spring-boot:run
```

Hoặc nếu bạn có Maven được cài đặt:

```bash
mvn spring-boot:run
```

Backend sẽ chạy tại: **http://localhost:8080**

---

## 🎨 Cấu hình Frontend

### 1. Vào thư mục FE

```bash
cd FE
```

### 2. Cài đặt dependencies (nếu chưa cài)

```bash
npm install
```

### 3. Chạy Frontend

```bash
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173** (hoặc port khác nếu 5173 đang dùng)

---

## 🚀 Chạy Toàn bộ Ứng dụng

### Cách 1: Chạy trong 2 terminal riêng biệt (Khuyến nghị)

**Terminal 1 - Chạy Backend:**
```bash
cd BE
./mvnw spring-boot:run
```

**Terminal 2 - Chạy Frontend:**
```bash
cd FE
npm run dev
```

### Cách 2: Chạy cùng một lúc từ root folder

**Terminal 1:**
```bash
cd BE
./mvnw spring-boot:run
```

**Terminal 2:**
```bash
cd FE
npm run dev
```

---

## 📝 Các lệnh hữu ích

### Backend (Spring Boot)

```bash
cd BE

# Chạy ứng dụng
./mvnw spring-boot:run

# Build dự án
./mvnw clean package

# Xóa cache và rebuild
./mvnw clean install
```

### Frontend (React)

```bash
cd FE

# Chạy trong chế độ development
npm run dev

# Build cho production
npm run build

# Xem preview bản build
npm run preview

# Kiểm tra linting
npm run lint
```

---

## 🌐 Cấu hình CORS

Frontend được cấu hình để kết nối tới Backend tại `http://localhost:8080` (xem trong `src/services/http.ts`).

Nếu bạn thay đổi port của Backend, hãy cập nhật:

1. **Backend**: File `src/main/resources/application.properties`
   ```properties
   server.port=8080
   ```

2. **Frontend**: File `src/services/http.ts`
   ```typescript
   baseURL: 'http://localhost:8080'
   ```

---

## 🔧 Xử lý Sự cố

### Lỗi: "Access denied for user 'root'@'localhost'"

**Nguyên nhân**: Mật khẩu MySQL không khớp hoặc chưa cấu hình.

**Giải pháp**:
1. Kiểm tra mật khẩu MySQL của bạn
2. Cập nhật `spring.datasource.password` trong `BE/src/main/resources/application.properties`
3. Khởi động lại Backend

### Lỗi: "vite is not recognized"

**Nguyên nhân**: Dependencies chưa được cài đặt.

**Giải pháp**:
```bash
cd FE
npm install
npm run dev
```

### Lỗi: Port 8080 đang sử dụng

**Giải pháp**: Thay đổi port trong `BE/src/main/resources/application.properties`
```properties
server.port=8081
```

Sau đó cập nhật URL backend trong Frontend.

### Lỗi: Port 5173 đang sử dụng

**Giải pháp**: Vite sẽ tự động chọn port khác, hoặc chỉ định port cụ thể:
```bash
npm run dev -- --port 5174
```

---

## 📁 Cấu trúc Dự án

```
TMDT_WebQuanAo/
├── BE/                          # Backend (Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/fashion/marketplace/
│   │   │   │       ├── MarketplaceApplication.java
│   │   │   │       ├── controller/
│   │   │   │       ├── service/
│   │   │   │       ├── entity/
│   │   │   │       └── ...
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── pom.xml
│   └── mvnw
│
├── FE/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── README.md
```

---

## 🔐 Bảo mật

- JWT tokens được sử dụng cho xác thực
- CORS được cấu hình cho frontend origin
- Passwords được mã hóa (nếu có)

**Lưu ý**: Đây là môi trường phát triển. Trước khi triển khai production, hãy:
- Thay đổi JWT secret key
- Cấu hình CORS đúng cách
- Sử dụng HTTPS
- Bảo vệ thông tin nhạy cảm

---

## 📖 Tài Liệu Thêm

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

## 💬 Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra lại tất cả yêu cầu hệ thống
2. Xem phần "Xử lý Sự cố" ở trên
3. Kiểm tra các file log của ứng dụng

---