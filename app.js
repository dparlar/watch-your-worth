const express = require('express');
const session = require('express-session')
const bodyParser = require('body-parser');
const exphbs  = require('express-handlebars');
const favicon = require('serve-favicon');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.load();
const app = express();

// Configure session
app.use(session({secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false}));

// Serve static files
app.use(express.static('public'));

// Configure body-parser
app.use(bodyParser.urlencoded({ extended: false }));

// Configure express-handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Configure serve-favicon
app.use(favicon(__dirname + '/public/images/clock.ico'));

// Configure passport
const db = require('./db');
const passport = require('./auth')(db, bcrypt);
app.use(passport.initialize());
app.use(passport.session());

const index = require('./routes/index')(express, db, passport, bcrypt);
app.use('/', index);

app.listen('8000');