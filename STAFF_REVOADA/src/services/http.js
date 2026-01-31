function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function handleError(res, error) {
  const status = error.status || 500;
  sendJson(res, status, {
    error: true,
    message: error.message || "Erro interno"
  });
}

module.exports = { sendJson, handleError };