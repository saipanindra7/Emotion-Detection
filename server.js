const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pool = require('./public/db');
const session = require('express-session');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.json());

const { Vonage } = require('@vonage/server-sdk');


// Intialize Vonage




// Send SMS function
app.post('/send-sms', async (req, res) => {
    const {  message } = req.body;
    console.log(req.body);

    try {
        const vonage = new Vonage({
            apiKey: "2f13bab5",
            apiSecret: "maIVwT10caMeoKaQ"
        });
        const to = "919390960620";
        const from = "Face";
        const text = message;
        async function sendSMS() {
            await vonage.sms.send({to, from, text})
                .then(resp => { console.log('Message sent successfully'); console.log(resp); })
                .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
        }
        sendSMS();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Signup route

app.post('/signup', async (req, res) => {
    console.log(req.body);
    const { name, email, password, phone_number, emergency_number } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, phone_number, emergency_number) VALUES (?, ?, ?, ?, ?)', 
            [name, email, hashedPassword, phone_number, emergency_number]
        );
        res.redirect('/login.html');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering user');
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log(req.body);
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).send('User not found');
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            req.session.userid = user.id;
            res.redirect('/face_capture.html');
        } else {
            res.status(400).send('Invalid password');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logging in');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
