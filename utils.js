exports.sendMessage = function(statusCode, statusMessage, userMessage, res) {
	res.status(statusCode).send({
		status: statusMessage,
		message: userMessage
	});
}