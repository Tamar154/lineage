import type { RequestHandler } from "express";

const loggerMiddleware: RequestHandler = (req, res, next) => {
  console.log(`Method: ${req.method}  |  URL: ${req.url}`);

  next();
};

export default loggerMiddleware;
