require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

const app = express();

// SSL сертификаты
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'))
};

// Сессии
app.use(session({
    secret: process.env.JWT_SECRET || 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
    // Сохраняем профиль пользователя
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Старт Google OAuth
app.get('/auth/google', (req, res, next) => {
    // from — адрес сайта, куда возвращать пользователя
    const from = req.query.from;
    if (from) {
        req.session.from = from;
    }
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })(req, res, next);
});

// Callback от Google
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    const from = req.session.from || req.query.from || 'https://example.com';
    req.session.from = null;
    // Формируем JWT
    const payload = {
        id: req.user.id,
        email: req.user.emails && req.user.emails[0] ? req.user.emails[0].value : '',
        name: req.user.displayName,
        picture: req.user.photos && req.user.photos[0] ? req.user.photos[0].value : ''
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
    // Редиректим обратно на сайт
    res.redirect(`${from}/api/mby/token?token=${token}`);
});

// Проверка
app.get('/', (req, res) => {
    res.send('Google Auth Server работает!');
});

https.createServer(sslOptions, app).listen(443, () => {
    console.log('Google Auth Server (SSL) запущен на порту 443');
}); 