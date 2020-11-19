import express from 'express';
import exphbs from 'express-handlebars';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPromise = open({
    filename: "data.db",
    driver: sqlite3.Database
});

const app = express();
let messages = [];

app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.use(express.urlencoded({extended: false}));
app.use('/static', express.static(__dirname + '/static'));

app.get("/", async(req, res) => {
    const db = await dbPromise;
    const messages = await db.all('SELECT * FROM Messages');
    res.render('home', {
        messages
    });
});

app.get('/register', (req, res) => {
    res.render('register')
});

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/register', async(req,res) => {
    const db = await dbPromise;
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const passwordHash = await bcrypt.hash(password, 10);
    try {
        await db.run('INSERT INTO Users (username, email, password) VALUES (?, ?, ?);',
            username,
            email,
            password,
        )
    } catch (e) {
        return res.render('register', {error: e})
    }
    res.redirect('/');
})

app.post('/message', async(req, res) => {
    const db = await dbPromise;
    const {
        email,
        password
    } = req.body;
    try {
        const existingUser = await db.get("SELECT * FROM Users WHERE email=?", email);
        if (!existingUser) {
            throw 'Incorrect login';
        }
        const passwordsMatch = await bcrypt.compare(password, existingUser.password);
        if (!passwordsMatch) {
            throw 'Incorrect login';
        }
    } catch (e) {
        return res.render('login', {error : e})
    }
    res.redirect('/');
});

const setup = async () => {
    const db = await dbPromise;
    await db.migrate();

    const users = await db.all('SELECT * FROM Users');
    console.log('users', users);

    app.listen(8080, () => {
        console.log("Listening on http://localhost:8080/");
    });
}

setup();