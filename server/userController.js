const User = require('./userModel');
const querystring = require('querystring');
const request = require('request');
const bcrypt = require('bcryptjs');

const userController = {};
const clientId = '186c9aa8e26e59d2affb';
const clientSecret = 'a64d1475d185bfc362ea10f2c7576ea4ff0a5047';

userController.getAllUsers = (next) => {
  User.find({}, next);
};

/**
* createUser - create a new User model and then save the user to the database.
*
* @param req - http.IncomingRequest
* @param res - http.ServerResponse
*/

userController.test = (req, res, next) => {
  User.find({}, (err, results) => {
    console.log(results); 
    res.end();
  });
}


userController.createUser = (req, res, next) => {
  const newUser = new User(req.body);
  console.log('req body is ', req.body);
  User.findOne({username: newUser.username}, (err, result) => {
  	if (err) return res.render('./../client/signup', {error: err});
    if (!result) {
    	newUser.save((err, newItem) => {
    	if (err) return console.log(err);
    	res.locals._id = newItem._id;
      console.log('user added');
      next();
      });
    } else {
      console.log('user already exists');
    	return res.redirect('/signup');
    }
  });
};

userController.verifyOAuth = (req, res, next) => {
  const obj = {
    grant_type: 'authorization_code', 
    code: req.query.code, 
    redirect_uri: 'http://localhost:3000/callback', 
    client_id: clientId, 
    client_secret: clientSecret
  };
  
  const endUrl = querystring.stringify(obj);
  const finalUrl = 'https://github.com/login/oauth/access_token?' + endUrl;
  const options = {
    url: finalUrl, 
    headers: {"User-Agent": 'teamAwesome'}
  }
  request.post(options, (error, response, body) => {
    var parsedResult = querystring.parse(body);
    console.log('parsed results is', parsedResult);
    const moreOptions = {
    url: 'https://api.github.com/user?access_token=' + parsedResult.access_token, 
    headers: {"User-Agent": 'teamAwesome'}
    };
    request.get(moreOptions, (error, response, body) => {
      const bodyObj = JSON.parse(body);
      var test = bodyObj.login;
      User.findOne({username: test}, (err, result) => {
        if (err) return res.render('./../client/signup', {error: err});
        if (result) {
          res.locals._id = result._id;
          next();
        }
        if (!result) {
          const pwd = bcrypt.hashSync('awesomepassword', 10);
          const contents = {username: bodyObj.login, password: pwd};
          const newUser = new User(contents);
          newUser.save((err, newresult) => {
            res.locals._id = newresult._id;
            next();
          });
        }  
    });
  });
});
}


userController.verifyUser = (req, res, next) => {
  const newUser = new User(req.body);
  // if (!newUser.username || !newUser.password) return res.redirect('/signup');
  User.findOne({username: newUser.username}, (err, result) => {
  	if (err) return res.render('./../client/signup', {error: err});
    if (result) {
      // User Found, check Password
      if (newUser.comparePassword(result.password)) {
        res.locals._id = result._id;
        next();
      } else {
        return res.redirect('/signup');
      }
    } else {
    	return res.redirect('/signup');
    }
  });
};


module.exports = userController;
