const mongoose = require('mongoose');
const { ZodError } = require('zod');

/**
 * Zod validation middleware factory
 * Validates req.body, req.query, or req.params against a Zod schema
 */
const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues || error.errors || [];
      const formattedErrors = issues.map((err) => ({
        field: err.path.slice(1).join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Input validation failed.',
        errors: formattedErrors,
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate that specified route parameters are valid MongoDB ObjectIds
 * Prevents Mongoose CastErrors and DB injection fuzzing
 */
const validateObjectId = (...paramNames) => (req, res, next) => {
  for (const name of paramNames) {
    const val = req.params[name];
    if (val && !mongoose.Types.ObjectId.isValid(val)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: '${val}' is not a valid 24-character resource identifier.`,
      });
    }
  }
  next();
};

module.exports = {
  validate,
  validateObjectId,
};
