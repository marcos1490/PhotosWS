var express = require('express');
var router = express.Router();
var dbPhotos = require('../database/photosdb.js');
var dbUsers = require('../database/usersdb.js');
var passwordHash = require('password-hash');
var jwt = require('jsonwebtoken');
var constants = require('../constants.js');
var utils = require('../utils.js');

function invalidMethod(res) {
  utils.sendMessage(405, constants.ErrorTitle, constants.InvalidOperationMessage, res);

}

function missingParameters(res) {
   utils.sendMessage(400, constants.ErrorTitle, constants.MissingParametersMessage, res);
}

function validateJWT(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {

    jwt.verify(token, constants.superSecret, function(err, decoded) {      
      if (err) {
        utils.sendMessage(403, constants.ErrorTitle, constants.InvalidTokenMessage, res);  

      } else {
        req.decoded = decoded;    
        next();
      }
    });

  } else {
    utils.sendMessage(403, constants.ErrorTitle, constants.InvalidTokenMessage, res);
    
  }
}

router.all('/', function(req, res, next) {

  if (req.method == "POST") {
    next()
  } else {
    invalidMethod(res);
  }

});

router.all('/login', function(req, res, next) {

  if (req.method == "POST") {
    next()
  } else {
    invalidMethod(res);
  }

});

router.all('/:userid/photos', function(req, res, next) {

  if (req.method == "GET" || req.method == "POST" || req.method == "HEAD" ) {
    validateJWT(req,res,next);
  } else {
    invalidMethod(res);
  }

});


router.all('/:userid/photos/:photoid', function(req, res, next) {

  if (req.method == "GET") {
    validateJWT(req,res,next);
  } else {
    invalidMethod(res);
  }

});

router.get('/:userid/photos', function(req, res, next) {
  var owner = req.params.userid;

  if (owner == null) {
    missingParameters(res);

  } else {

    dbPhotos.getPhotos(owner, false, req, res);

  }
});

router.head('/:userid/photos', function(req, res, next) {
  var owner = req.params.userid;

  if (owner == null) {
    missingParameters(res);

  } else {

    dbPhotos.getPhotos(owner, true, req, res);

  }
});

router.get('/:userid/photos/:photoid', function(req, res, next) {
  var owner = req.params.userid;
  var photo = req.params.photoid;

  if (owner == null || photo == null) {
    missingParameters(res);

  } else {

    dbPhotos.getPhoto(owner, photo, req, res);

  }
});


router.post('/:userid/photos', function(req, res, next) {
  var photoObj = {
    description: req.body.description,
    lat: req.body.lat,
    lng: req.body.lng,
    photo: req.body.photo,
    owner: req.params.userid,
    date : req.params.date
  };
  if (photoObj.description == null ||
    photoObj.photo == null ||
    photoObj.lat == null ||
    photoObj.lng == null ) {

    missingParameters(res);

  } else {

    dbPhotos.insertPhoto(photoObj, req, res);

  }
});


router.post('/', function(req, res, next) {

  var userObj = {
    username: req.body.username,
    password: passwordHash.generate(req.body.password)
  };


  if (userObj.username == null ||
    userObj.password == null) {

    missingParameters(res);

  } else {
    dbUsers.createUser(userObj, req, res);
  }
});

router.post('/login', function(req, res, next) {

  var userObj = {
    username: req.body.username,
    password: req.body.password
  };


  if (userObj.username == null ||
    userObj.password == null) {

    missingParameters(res);

  } else {
    dbUsers.login(userObj, req, res);
  }
});

module.exports = router;