const formatSuccess = (res, statusCode, message, data = null) => {
  const payload = { ok: true, message };
  if (data) payload.data = data;
  return res.status(statusCode).json(payload);
};

const formatError = (res, statusCode, message) => {
  return res.status(statusCode).json({ ok: false, error: message });
};

module.exports = { formatSuccess, formatError };
