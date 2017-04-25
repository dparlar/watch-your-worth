module.exports = function(express, db, passport, bcrypt) {
	const index = express.Router();

	index.get('/', function(req, res) {
		res.render('homepage');
	});
	index.post('/', function(req, res) {
		passport.authenticate('local', function(err, user, message) {
			if (err) {
				// TODO:
				// error handle
				res.render('homepage');
			} else if (!user) {
				// TODO:
				// logging
				console.log(message.error);
		    	res.render('homepage');
		    } else {
		    	req.logIn(user, function(err) {
		    		if (err) {
		    			// TODO:
						// error handle
						res.render('homepage');
		    		} else {
		    			res.redirect('dashboard');
		    		}
		    	});
		    }
		})(req, res);
	});
	index.get('/signup', function(req, res) {
		// TODO:
		// what todo if user is already serialized/authenticated?
		res.render('signup');
	});
	index.post('/signup', function(req, res) {
		// TODO:
		// salt/encrypt password
		
		var username = req.body.username;
		var password = req.body.password;

		db.connect(function(err, client, release) {
	      	if (err) {
	      		// TODO:
	      		// error handle
	      		console.log('error connecting');
	      		console.log(JSON.stringify(err));
	      		return res.render('signup');
	      	}

	      	bcrypt.hash(password, 10, function(err, hash) {
	      		if (err) {
	      			// TODO:
	      			// error handle
		      		console.log('error hashing');
		      		console.log(JSON.stringify(err));
		      		return res.render('signup');		
	      		}

	      		client.query('INSERT into users VALUES ($1, $2, $3, $4, $5)', [username, hash, new Date().toISOString(), 0, 0], function(err, result) {
		      		release();

		      		if (err) {
		      			// TODO:
			      		// error handle / log error

			      		if (err.code == 23505) {
			      			console.log('duplicate username');
			      		} else {
			      			console.log('some other error');
			      		}
			      		return res.render('signup');
		      		}

		      		console.log('signup successful');

		      		passport.authenticate('local', function(err, user, message) {
						if (err) {
							// TODO:
							// error handle
							res.render('signup');
						} else if (!user) {
							console.log(message.error);
					    	res.render('signup');
					    } else {
					    	req.logIn(user, function(err) {
					    		if (err) {
					    			// TODO:
									// error handle
									res.render('signup');
					    		}
					    		res.redirect('dashboard');
					    	});
					    }
					})(req, res);
		      	});
	      	});
	    });
	});
	index.get('/dashboard', function(req, res) {
		// TODO:
		// allow user to change the unit of time (seconds, minutes, hours, days, weeks, etc)
		function time_passed(date) {
			var date_now = new Date();
			return date_now.getTime() - date.getTime();
		}
		function convert_date(date) {
		  	function pad(date_unit) {
		  		return (date_unit < 10) ? '0' + date_unit : date_unit; 
		  	}
		  	return [pad(date.getMonth()+1), pad(date.getDate()), date.getFullYear()].join('/') + ', ' + [pad(date.getHours()), pad(date.getMinutes())].join(':');
		}
		if (req.user) {
			if (!req.user.first_entry) {
				// TODO:
				// Alert user that they haven't made any inputs yet

				res.render('dashboard', {
					username: req.user.user_name,
					expenses: req.user.expenses,
					incomes: req.user.incomes,
					fixed_flow: 'N/A',
					flow: 'N/A',
					flow: 'N/A',
					date: 'N/A',
					minutes: 'N/A'
				});
			} else {
				// TODO:
				// Make sure to display date of the client's timezone (done in the front end)
				// Need to modify convert_date()
				var net_flow = req.user.incomes - req.user.expenses;

				var millisecond_difference = time_passed(req.user.first_entry);

				var minutes = millisecond_difference / 60000;
				// var hours = minutes / 60;
				// var days = hours / 24;

				var flow = (net_flow / minutes);
				var fixed_flow = flow.toFixed(2);

				minutes = minutes.toFixed(1);

				var date_converted = convert_date(req.user.first_entry);

				res.render('dashboard', {
					username: req.user.user_name,
					expenses: req.user.expenses,
					incomes: req.user.incomes,
					fixed_flow: fixed_flow,
					flow: flow,
					date: date_converted,
					minutes: minutes
				});
			}
		} else {
			res.redirect('/');
		}
	});
	index.post('/dashboard', function(req, res) {
		if (req.user) {
			var user_name = req.user.user_name;
			var input_type = req.body.transaction_type;
			var input_value = req.body.value;
			var former_expenses = parseFloat(req.user.expenses);
			var former_incomes = parseFloat(req.user.incomes);

			if (!input_value) {
				input_value = 0;
			} else {
				input_value = parseFloat(input_value);
			}

			db.connect(function(err, client, release) {
		      	if (err) {
		      		// TODO:
		      		// error handle
		      		console.log('error connecting');
		      		console.log(JSON.stringify(err));
		      		return res.redirect('dashboard');
		      	}

		      	if (input_type === 'Expense') {
					client.query('INSERT into expenses VALUES ($1, $2, $3)', [user_name, input_value, new Date().toISOString()], function(err, result) {
			      		if (err) {
			      			// TODO:
				      		// error handle / log error

				      		if (err.code == 23505) {
				      			console.log('duplicate username');
				      		} else {
				      			console.log('some other error');
				      		}
				      		return res.redirect('dashboard');
			      		}

			      		console.log('first push successful');

			      		var new_expenses = former_expenses + input_value;

			      		if (!req.user.first_entry) {
			      			client.query('UPDATE users SET expenses = ($1), first_entry = ($2) WHERE user_name = $3', [new_expenses, new Date().toISOString(), user_name], function(err, result) {
				      			release();

				      			if (err) {
					      			// TODO:
						      		// error handle / log error

						      		if (err.code == 23505) {
						      			console.log('duplicate username');
						      		} else {
						      			console.log('some other error');
						      		}
						      		return res.redirect('dashboard');
					      		}

					      		console.log('second push successful');
				      			res.redirect('dashboard');
				      		});
			      		} else {
			      			client.query('UPDATE users SET expenses = ($1) WHERE user_name = $2', [new_expenses, user_name], function(err, result) {
				      			release();

				      			if (err) {
					      			// TODO:
						      		// error handle / log error

						      		if (err.code == 23505) {
						      			console.log('duplicate username');
						      		} else {
						      			console.log('some other error');
						      		}
						      		return res.redirect('dashboard');
					      		}

					      		console.log('second push successful');
				      			res.redirect('dashboard');
				      		});
			      		}
			      	});
				} else if (input_type === 'Income') {
					client.query('INSERT into incomes VALUES ($1, $2, $3)', [user_name, input_value, new Date().toISOString()], function(err, result) {
			      		if (err) {
			      			// TODO:
				      		// error handle / log error

				      		if (err.code == 23505) {
				      			console.log('duplicate username');
				      		} else {
				      			console.log('some other error');
				      		}
				      		return res.redirect('dashboard');
			      		}

			      		console.log('first push successful');

			      		var new_incomes = former_incomes + input_value;

			      		if (!req.user.first_entry) {
			      			client.query('UPDATE users SET incomes = ($1), first_entry = ($2) WHERE user_name = $3', [new_incomes, new Date().toISOString(), user_name], function(err, result) {
				      			release();

				      			if (err) {
					      			// TODO:
						      		// error handle / log error

						      		if (err.code == 23505) {
						      			console.log('duplicate username');
						      		} else {
						      			console.log('some other error');
						      		}
						      		return res.redirect('dashboard');
					      		}

					      		console.log('second push successful');
				      			res.redirect('dashboard');
				      		});
			      		} else {
			      			client.query('UPDATE users SET incomes = ($1) WHERE user_name = $2', [new_incomes, user_name], function(err, result) {
				      			release();

				      			if (err) {
					      			// TODO:
						      		// error handle / log error

						      		if (err.code == 23505) {
						      			console.log('duplicate username');
						      		} else {
						      			console.log('some other error');
						      		}
						      		return res.redirect('dashboard');
					      		}

					      		console.log('second push successful');
				      			res.redirect('dashboard');
				      		});
			      		}
			      	});
				}
		    });
		} else {
			res.redirect('/');
		}
	});
	index.get('/logout', function(req, res) {
		// TODO:
		// remove session / cookie / passport logout / etc
		req.logout();
		res.redirect('/');
	});

	return index;
}