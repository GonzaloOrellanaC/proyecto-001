import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import authRoutes from './routes/auth.routes.js';
import { connectMongo } from './config/db.js';
import profileRoutes from './routes/profile.routes.js';
import usersRoutes from './routes/users.routes.js';
import salesRoutes from './routes/sales.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import storesRoutes from './routes/stores.routes.js';
import productsRoutes from './routes/products.routes.js';
import devRoutes from './routes/dev.routes.js';
import myOrgsRoutes from './routes/my-orgs.routes.js';
import organizationsRoutes from './routes/organizations.routes.js';
import userStoresRoutes from './routes/user-stores.routes.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  // Ensure DB connection before handling requests (prevents race conditions in tests)
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pv';
  app.use(async (_req, _res, next) => {
    try {
      await connectMongo(uri);
      next();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Mongo connection error', e);
      next(e);
    }
  });
  app.use('/', routes);
  app.use('/auth', authRoutes);
  app.use('/', profileRoutes);
  app.use('/users', usersRoutes);
  app.use('/sales', salesRoutes);
  app.use('/inventory', inventoryRoutes);
  app.use('/roles', rolesRoutes);
  app.use('/stores', storesRoutes);
  app.use('/products', productsRoutes);
  app.use('/dev', devRoutes);
  app.use('/my/organizations', myOrgsRoutes);
  app.use('/organizations', organizationsRoutes);
  app.use('/user-stores', userStoresRoutes);
  return app;
}
