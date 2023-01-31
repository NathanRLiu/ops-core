import { Request, Response, NextFunction } from 'express';
import PageController from '../../../controllers/page-controller';

export default function () {
  return {
    async GET (request: Request, response: Response, next: NextFunction) {
      try {
        const console = await PageController.getPages(request.params.consoleName);
        response.status(200).send(console);
      } catch (error) {
        next(error);
      }
    },
    
    async POST (request: Request, response: Response, next: NextFunction) {
      try {
        const console = await PageController.postPage(request.params.consoleName, request.body);
        response.status(200).send(console);
      } catch (error) {
        next(error);
      }
    }
  };
}