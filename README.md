# Google OAuth Auth Server (Node.js + SSL)

Этот сервер реализует авторизацию через Google OAuth 2.0 с поддержкой HTTPS (SSL) для интеграции с внешними сайтами. После успешной авторизации пользователь получает JWT-токен, который возвращается на ваш сайт.

---

## Структура проекта

```
/google auth no d/
│
├── ssl/                # SSL-сертификаты (key.pem, cert.pem)
├── .env                # Переменные окружения
├── server.js           # Основной сервер Node.js
└── README.md           # Эта инструкция
```

---

## Переменные .env

```
GOOGLE_CLIENT_ID=...           # Google OAuth Client ID
GOOGLE_CLIENT_SECRET=...       # Google OAuth Client Secret
GOOGLE_CALLBACK_URL=https://your-auth-domain.com/auth/google/callback
JWT_SECRET=your_jwt_secret     # Секрет для подписи JWT
```

- **GOOGLE_CALLBACK_URL** должен совпадать с настройками в Google Cloud Console.
- **JWT_SECRET** — любой длинный случайный секрет.

---

## Установка и запуск

1. **Установите зависимости:**
   ```bash
   npm install express express-session passport passport-google-oauth20 dotenv https jsonwebtoken
   ```
2. **Положите SSL-сертификаты** в папку `ssl/` (key.pem, cert.pem).
3. **Заполните .env** (см. выше).
4. **Запустите сервер:**
   ```bash
   node server.js
   ```
   Сервер будет доступен по HTTPS на порту 443.

---

## Как работает

1. Пользователь на внешнем сайте нажимает кнопку "Войти через Google".
2. Его редиректит на этот сервер:  
   `https://auth-сервер/auth/google?from=https://site.com`
3. После авторизации через Google пользователь возвращается на:  
   `https://site.com/api/mby/token?token=...`
4. Внешний сайт сохраняет токен (например, в cookie) и авторизует пользователя.

---

## Пример интеграции с внешним сайтом

### Кнопка входа
```html
<button id="googleLoginBtn">Войти через Google</button>
<script>
document.getElementById('googleLoginBtn').onclick = function() {
    window.location.href = "https://auth-сервер/auth/google?from=" + encodeURIComponent(window.location.origin);
};
</script>
```

### Обработка токена на сайте
```js
// Express
const jwt = require('jsonwebtoken');
app.get('/api/mby/token', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(400).send('Нет токена');
    try {
        const user = jwt.verify(token, 'your_jwt_secret');
        // Сохраняем пользователя в cookie или сессию
        res.cookie('auth_token', token, { httpOnly: true });
        res.redirect('/');
    } catch (e) {
        res.status(401).send('Неверный токен');
    }
});
```

---

## Payload токена (JWT)

```json
{
  "id": "...",
  "email": "...",
  "name": "...",
  "picture": "..."
}
```

---

## Примечания
- Сервер работает только по HTTPS (SSL обязателен).
- Не забудьте добавить GOOGLE_CALLBACK_URL в разрешённые redirect URI в Google Cloud Console.
- Для продакшена используйте надёжные секреты и настоящие сертификаты.

---
