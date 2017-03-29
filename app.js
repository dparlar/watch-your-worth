var express = require('express');
var session = require('express-session')
var bodyParser = require('body-parser');
var exphbs  = require('express-handlebars');
var favicon = require('serve-favicon');
var dotenv = require('dotenv');
dotenv.load();
var app = express();

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
var db = require('./db');
var passport = require('./auth')(db);
app.use(passport.initialize());
app.use(passport.session());

var index = require('./routes/index')(express, db, passport);
app.use('/', index);

app.listen('8000');