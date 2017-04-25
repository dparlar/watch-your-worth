module.exports = function(db, bcrypt) {
	var passport = require('passport');
	var LocalStrategy = require('passport-local').Strategy;

	passport.use(new LocalStrategy(
	  	function(username, password, done) {
	  		db.connect(function(err, client, release) {
		      	if (err) { 
		      		return done(err);
		      	}
		      	client.query('SELECT * FROM user WHERE user_name = ($1)', [username], function(err, result) {
		      		release();
		      		
		      		if (err) {
			      		return done(err); 
			      	}
			      	var user = result.rows[0];
			      	if (!user) {
			      		return done(null, false, {error: 'Incorrect username.'});
			      	}
			      	bcrypt.compare(password, user.password, function(err, res) {
						if (err) {
					   		// TODO:
					   		// error handle / log
					   		console.log('error in bcrypt');
					  	}
					  	if (res) {
							return done(null, user);
					  	} else {
					  		return done(null, false, {error: 'Incorrect password.'});
					  	}
					});

			      	// if (user.password !== password) {
			       //  	return done(null, false, {error: 'Incorrect password.'});
			      	// }
			      	// return done(null, user);
			    });
		    });
	  	}
	));

	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		db.connect(function(err, client, release) {
	      	if (err) { 
	      		return done(err);
	      	}
			client.query('SELECT * FROM users WHERE id = ($1)', [id], function(err, result) {
				release();
		  		if (err) {
		  			return done(err);
		      	}
		      	var user = result.rows[0];
		      	done(null, user);
	    	});
	    });
	});

	return passport;
}