// Shared response helpers for consistent API error handling

export const sendValidationError = (res, errors) => {
  const details = typeof errors?.array === 'function' ? errors.array() : (Array.isArray(errors) ? errors : [errors]);
  const mappedDetails = details.map(err => ({
    field: err.param || err.path,
    message: err.msg || err.message,
    value: err.value,
    location: err.location
  }));
  return res.status(400).json({
    success: false,
    // Legacy compatibility fields (some tests/clients expect these)
    message: 'Validation failed',
    errors: mappedDetails,
    // Standardized error envelope
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: mappedDetails,
      timestamp: new Date().toISOString()
    }
  });
};

export const sendAPIError = (res, message, error = {}, statusCode = 500, code = 'INTERNAL_ERROR', extra = {}) => {
  // Determine if we should include stack trace (development only)
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const payload = {
    success: false,
    // Legacy compatibility field (some tests/clients expect top-level message)
    message: message || error?.message || 'Internal server error',
    error: {
      message: message || error?.message || 'Internal server error',
      code: code || error?.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && error?.stack && { stack: error.stack })
    },
    ...extra
  };
  return res.status(statusCode).json(payload);
};

export const sendSuccess = (res, data, message = null, statusCode = 200, extra = {}) => {
  const payload = {
    success: true,
    ...(message && { message }),
    ...(data && { data }),
    timestamp: new Date().toISOString(),
    ...extra
  };
  return res.status(statusCode).json(payload);
};

export const sendPaginatedResponse = (res, data, pagination, message = null) => {
  return res.json({
    success: true,
    ...(message && { message }),
    data,
    pagination,
    timestamp: new Date().toISOString()
  });
};
