# 🚀 WellNest Quick Start Guide

## Complete Setup Instructions for Backend + Frontend

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Start MySQL Database

1. Open MySQL Workbench or command line
2. Ensure MySQL is running on port 3306
3. The database `wellnest_db` will be created automatically

### Step 2: Configure Backend

1. Navigate to backend folder:
   ```bash
   cd wellnest-backend
   ```

2. Open `src/main/resources/application.properties`

3. Update MySQL password:
   ```properties
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```

### Step 3: Run Backend

```bash
mvn spring-boot:run
```

✅ Backend will start on **http://localhost:8080**

### Step 4: Run Frontend

1. Navigate to frontend folder:
   ```bash
   cd ../wellnest-frontend
   ```

2. Open `index.html` with Live Server (VS Code extension)
   - Or use: `python -m http.server 5500`

✅ Frontend will run on **http://localhost:5500**

---

## 🧪 Test the Complete Flow

### 1. Create an Account

1. Go to **http://localhost:5500/signup.html**
2. Fill in the form:
   - Email: `test@gmail.com`
   - Password: `1234`
   - Role: `USER`
   - Age: `25`
   - Weight: `70`
   - Goal: `Weight Loss`
3. Click **Signup**

**What happens:**
- Backend creates user in MySQL
- Password is hashed with BCrypt
- User is automatically logged in
- JWT token is generated
- Profile is saved
- Redirects to dashboard

### 2. Login

1. Go to **http://localhost:5500/login.html**
2. Enter credentials:
   - Email: `test@gmail.com`
   - Password: `1234`
3. Click **Login**

**What happens:**
- Backend validates credentials
- JWT token is generated (valid for 24 hours)
- Token, userId, and role are saved to localStorage
- Redirects to dashboard

### 3. Use Protected Features

Now you can use features that require authentication:
- Tracker page (workout, meal, water, sleep logging)
- Health Tools (BMI calculator)
- Profile management

---

## 🔍 Verify Backend is Working

### Check Database

Open MySQL and run:
```sql
USE wellnest_db;

-- View all users
SELECT * FROM users;

-- View fitness profiles
SELECT * FROM fitness_profiles;
```

### Test API with cURL

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","email":"john@test.com","password":"1234","role":"USER"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"1234"}'
```

---

## 🐛 Troubleshooting

### Backend Not Starting

**Error:** `Connection refused to MySQL`
- **Solution:** Start MySQL service
- **Check:** MySQL is running on port 3306
- **Verify:** Username is `root` and password is correct

**Error:** `Port 8080 already in use`
- **Solution:** Change port in `application.properties`:
  ```properties
  server.port=8081
  ```
- **Update:** Change frontend API_BASE_URL to `http://localhost:8081/api`

### Frontend Not Connecting

**Error:** `CORS error` or `Failed to fetch`
- **Solution:** Ensure backend is running on port 8080
- **Check:** CORS is configured in `SecurityConfig.java`
- **Verify:** Frontend is on `localhost:5500` or `127.0.0.1:5500`

**Error:** `Network error`
- **Solution:** Check if backend server is running
- **Test:** Visit http://localhost:8080 in browser
- **Expected:** Should see error page (means server is running)

### Login/Signup Not Working

**Error:** `Email already registered`
- **Solution:** Use a different email or delete user from database

**Error:** `Invalid credentials`
- **Solution:** Check password is correct
- **Note:** Passwords are case-sensitive

---

## 📊 Project Structure

```
wellnest/
├── wellnest-backend/          # Spring Boot Backend
│   ├── src/main/java/
│   │   └── com/wellnest/backend/
│   │       ├── controller/    # REST Controllers
│   │       ├── dto/          # Data Transfer Objects
│   │       ├── model/        # JPA Entities
│   │       ├── repository/   # Database Repositories
│   │       ├── security/     # JWT & Security Config
│   │       └── service/      # Business Logic
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
└── wellnest-frontend/         # HTML/CSS/JS Frontend
    ├── index.html            # Home page
    ├── signup.html           # Registration
    ├── signup.js             # ✅ Integrated with backend
    ├── login.html            # Login page
    ├── login.js              # ✅ Integrated with backend
    ├── tracker.html          # Workout/Meal tracker
    ├── health-tools.html     # BMI calculator
    └── about.html            # About page
```

---

## 🔐 Security Features

✅ **Password Hashing** - BCrypt with salt  
✅ **JWT Authentication** - Stateless tokens  
✅ **CORS Protection** - Configured origins  
✅ **Input Validation** - Bean validation  
✅ **SQL Injection Prevention** - JPA/Hibernate  
✅ **Session Management** - Stateless (no sessions)  

---

## 📝 API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | ❌ | Create new user |
| POST | `/api/auth/login` | ❌ | Login and get JWT |
| POST | `/api/profile` | ✅ | Save fitness profile |
| GET | `/api/profile/{userId}` | ✅ | Get fitness profile |

---

## 🎯 Next Steps

1. ✅ Backend is running
2. ✅ Frontend is integrated
3. ✅ Authentication works
4. 🔄 Add more features:
   - Workout tracking API
   - Meal logging API
   - Progress analytics
   - Trainer-user connections

---

## 💡 Tips

- **JWT Token expires in 24 hours** - Login again after expiration
- **Check browser console** - For detailed error messages
- **Use Postman** - For testing API endpoints directly
- **Check backend logs** - Terminal shows all requests

---

## 📞 Support

If you encounter issues:

1. Check backend terminal for errors
2. Check browser console for frontend errors
3. Verify MySQL is running
4. Ensure ports 8080 and 5500 are available

---

## ✅ Success Checklist

- [ ] MySQL is running
- [ ] Backend starts without errors
- [ ] Can access http://localhost:8080
- [ ] Frontend opens in browser
- [ ] Can create an account
- [ ] Can login successfully
- [ ] JWT token is saved in localStorage
- [ ] Database shows user data

---

**🎉 You're all set! Start building your fitness journey with WellNest!**
