var db_config = require("./database");
var db = db_config.database;
var mysql = require('mysql');
var etag = require('etag');
var utils = require('../utils.js');
var constants = require('../constants.js');

var connection = mysql.createConnection({
	host: db.host,
	user: db.user,
	password: db.password,
	database: db.dbName
});

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function isEmptyObject(obj) {
	return !Object.keys(obj).length;
}



exports.insertPhoto = function(photoObj, req, res) {

	connection.query('INSERT INTO photos SET ?', photoObj,
		function(err, result) {
			if (err) {
				utils.sendMessage(500, constants.ErrorTitle, err, res);

			} else {
				utils.sendMessage(201, constants.SuccessTitle, result.insertId, res);

			}
		});
};


function filterQuery(query) {
	var valid = true;
	var sql = 'SELECT * FROM photos WHERE owner = ?';
	var fields = query.fields;
	if (fields != null) {
		fields = fields.split(',');
		var properties = ["id", "photo", "description", "lat", "lng", "owner", "date"];
		fields.forEach(function(entry) {
			if (properties.indexOf(entry) == -1) {
				valid = false;
				return;
			}
		});

		sql = sql.replace("*", query.fields);
	}
	var orderBy = query.orderby;
	if (orderBy != null) {
		if (orderBy == "date" || orderBy == "description") {
			sql += " ORDER BY " + orderBy;

			var dir = query.dir;
			if (dir != null) {
				if (dir == "asc" || dir == "desc") {
					sql += " " + dir;
				} else {
					valid = false;
				}
			}
		} else {
			valid = false;
		}
	}

	var limit = query.limit;
	var page = query.page;
	if (limit != null && page == null) {
		if (isNumber(limit)) {
			sql += " LIMIT " + limit;
		} else {
			valid = false;
		}

	} else if (limit == null && page != null) {
		if (isNumber(page)) {
			page = (page - 1) * 25;
			sql += " LIMIT " + page + ", 25";
		} else {
			valid = false;
		}
	} else if (limit != null && page != null) {
		valid = false;
	}

	if (valid == true) {
		return sql;
	} else {
		return null;
	}
}

exports.getPhotos = function(owner, head, req, res) {

	var photoOwner = owner;
	var sql = 'SELECT * FROM photos WHERE owner = ?';

	if (!isEmptyObject(req.query)) {

		var query = filterQuery(req.query);
		if (query == null) {
			utils.sendMessage(400, constants.ErrorTitle, constants.InvalidFilterParameters, res);
			return;
		} else {
			sql = query;
		}

	}

	connection.query(sql, [owner],
		function(err, result, fields) {
			if (err) {
				utils.sendMessage(500, constants.ErrorTitle, err, res);
			} else {

				var resultString = JSON.stringify(result, null, 3);
				if (head) {
					res.setHeader('ETag', etag(resultString));
					res.status(204).send();
				} else {
					res.setHeader('ETag', etag(resultString));
					utils.sendMessage(200, constants.SuccessTitle, result, res);
				}
			}

		});
};

exports.getPhoto = function(owner, photo, req, res) {

	var photoOwner = owner;

	connection.query('SELECT * FROM photos WHERE owner = ? AND id = ?', [owner, photo],
		function(err, result, fields) {
			if (err) {

				utils.sendMessage(500, constants.ErrorTitle, err, res);
			} else {

				if (result.length == 0) {
					utils.sendMessage(404, constants.SuccessTitle, result, res);
				} else {
					utils.sendMessage(200, constants.SuccessTitle, result, res);
				}
			}
		});
};