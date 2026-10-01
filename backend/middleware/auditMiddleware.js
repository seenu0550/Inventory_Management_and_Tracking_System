const AuditLog = require('../models/AuditLog');

const TRACKED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

const auditMiddleware = (action, referenceModel) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async (data) => {
    if (TRACKED_METHODS.includes(req.method) && req.user) {
      try {
        await AuditLog.create({
          user: req.user._id,
          action: action || `${req.method} ${req.originalUrl}`,
          method: req.method,
          endpoint: req.originalUrl,
          referenceId: req.params?.id || data?._id || data?.productId || data?.shipmentId || null,
          referenceModel: referenceModel || null,
          changes: req.method !== 'GET' ? req.body : null,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: res.statusCode < 400 ? 'success' : 'failed'
        });
      } catch { /* audit logging should never break the app */ }
    }
    return originalJson(data);
  };

  next();
};

module.exports = auditMiddleware;
