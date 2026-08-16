import jwt from 'jsonwebtoken';

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice('Bearer '.length), process.env.JWT_SECRET);
      req.userId = payload.sub;
    } catch {
      // invalid/expired token on an optional route: proceed as anonymous
    }
  }
  next();
}
