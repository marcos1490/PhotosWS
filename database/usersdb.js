var db_config = require("./database");
var db = db_config.database;
var mysql = require('mysql');
var passwordHash = require('password-hash');
var jwt = require('jsonwebtoken');
var constants = require('../constants.js');
var utils = require('../utils.js');

var connection = mysql.createConnection({
	host: db.host,
	user: db.user,
	password: db.password,
	database: db.dbName
});


exports.createUser = function(user, req, res) {

	connection.query('INSERT INTO users SET ?', user,
		function(err, result) {
			if (err) {
				utils.sendMessage(500, constants.ErrorTitle, err, res);

			} else {
				utils.sendMessage(201, constants.SuccessTitle, result.insertId, res);
			}

		});
}

exports.login = function(user, req, res) {

	connection.query('SELECT * FROM users WHERE username = ?', user.username,
		function(err, result, fields) {
			if (err) {
				utils.sendMessage(500, constants.ErrorTitle, err, res);

			} else {
				if (result.length == 0) {
					utils.sendMessage(403, constants.ErrorTitle, constants.InvalidLoginMessage, res);
				} else {
					storedUser = result[0];

					var valid = passwordHash.verify(user.password, storedUser.password);
					if (valid) {
						var token = jwt.sign(
							user,
							constants.superSecret, {
								expiresIn: constants.TokenExpirationTime
							});
						utils.sendMessage(200, constants.SuccessTitle, token, res);

					} else {
						utils.sendMessage(403, constants.ErrorTitle, constants.InvalidLoginMessage, res);
					}
				}

			}

		});

}