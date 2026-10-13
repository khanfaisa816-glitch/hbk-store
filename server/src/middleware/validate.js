// Usage: router.post('/x', validate(schema), handler)
// Parses req.body (or req.query) with a zod schema. Bad input -> 400 via error middleware.
const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;
