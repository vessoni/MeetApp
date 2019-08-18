import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/Multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

import authMiddleware from './app/middlewares/auth';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import SubscriptionController from './app/controllers/SubscriptionController';
import OrganizeController from './app/controllers/OrganizeController';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/session', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);

routes.get('/organize', OrganizeController.index);
routes.post('/meetup', MeetupController.store);
routes.put('/meetup/:id', MeetupController.update);
routes.get('/meetup', MeetupController.index);
routes.delete('/meetup/:id', MeetupController.delete);

routes.post('/subscription', SubscriptionController.store);
routes.get('/subscription', SubscriptionController.index);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
