import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as basicAuth from 'basic-auth';

@Injectable()
export class SwaggerAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = basicAuth(req);

    const swaggerUser = process.env.SWAGGER_USER || 'admin';
    const swaggerPass = process.env.SWAGGER_PASSWORD || 'admin123';

    if (!user || user.name !== swaggerUser || user.pass !== swaggerPass) {
      res.set('WWW-Authenticate', 'Basic realm="example"');
      return res.status(401).send('Authentication required');
    }
    next();
  }
}
