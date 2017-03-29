module.exports = function(db) {
	var passport = require('passport');
	var LocalStrategy = require('passport-local').Strategy;

	passport.use(new LocalStrategy(
	  	function(username, password, done) {
	  		db.connect(function(err, client, release) {
		      	if (err) { 
		      		return done(err);
		      	}
		      	client.query('SELECT * FROM users WHERE user_name = ($1)', [username], function(err, result) {
		      		release();
		      		
		      		if (err) {
			      		return done(err); 
			      	}
			      	var user = result.rows[0];
			      	if (!user) {
			      		return done(null, false, {error: 'Incorrect username.'});
			      	}
			      	if (user.password !== password) {
			        	return done(null, false, {error: 'Incorrect password.'});
			      	}
			      	return done(null, user);
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