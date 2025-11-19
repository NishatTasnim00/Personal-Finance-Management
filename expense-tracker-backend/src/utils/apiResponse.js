export const apiResponse = (res, statusCode, status, result = null, message = null) => {
  const payload = {
    status,
    statusCode,
    result,
  };

  if (message) payload.message = message;

  return res.status(statusCode).json(payload);
};

/**
 * Convenience wrappers (optional but nice to have)
 */
export const successResponse = (res, result, statusCode = 200, message = null) =>
  apiResponse(res, statusCode, 'success', result, message);

export const errorResponse = (res, message, statusCode = 400) =>
  apiResponse(res, statusCode, 'error', null, message);