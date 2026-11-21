const sanitizeHtml = require('sanitize-html');

function cleanInput(data, key) {
  if (key === 'password') return data;
  if (typeof data === 'string') return sanitizeHtml(data);
  if (Array.isArray(data)) return data.map((item) => cleanInput(item));
  if (data && typeof data === 'object') {
    for (const k in data) {
      data[k] = cleanInput(data[k], k);
    }
  }
  return data;
}

const sanitize = (req, res, next) => {
  if (req.body) cleanInput(req.body);
  next();
};

module.exports = sanitize;

