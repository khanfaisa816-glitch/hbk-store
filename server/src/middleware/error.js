const { ZodError } = require('zod');

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Input did not pass validation
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return res.status(400).json({
      error: details[0] ? details[0].message : 'Validation failed',
      details,
    });
  }

  // Upload errors from multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image must be smaller than 2 MB' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: 'Upload failed: ' + err.message });
  }

  // Bad JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }

  // Database rule broken (duplicate value, linked data...)
  if (err.code && String(err.code).startsWith('SQLITE_CONSTRAINT')) {
    const msg = String(err.message);
    if (msg.includes('UNIQUE')) return res.status(409).json({ error: 'This value already exists' });
    if (msg.includes('FOREIGN KEY')) return res.status(409).json({ error: 'This item is linked to other data' });
    return res.status(400).json({ error: 'Invalid data' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong on the server' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { notFound, errorHandler };
