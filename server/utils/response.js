function sendSuccess(res, statusCode, message, data) {
  return res.status(statusCode).json({
    status: statusCode,
    message,
    data,
  });
}

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    status: statusCode,
    message,
    data: null,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
