const { randomUUID } = require('crypto');

module.exports = function requestId() {
  return (req, res, next) => {
    const id = typeof randomUUID === 'function'
      ? randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    req.id = id;
    res.locals.reqid = id;
    next();
  };
};
