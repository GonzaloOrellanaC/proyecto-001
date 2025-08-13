import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { OrganizationModel } from '../src/models/Organization';
import { StoreModel } from '../src/models/Store';
import { ProductModel } from '../src/models/Product';

let mongod: MongoMemoryServer;
let token: string;
let orgId: string;
let storeId: string;
let productId: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  const app = createApp();
  // user
  const email = 's@example.com';
  const password = 'Password123!';
  await request(app).post('/auth/register').send({ email, password, name: 'S', role: 'admin' });
  const login = await request(app).post('/auth/login').send({ email, password });
  token = login.body.token;
  // org/store/product
  const org = await OrganizationModel.create({ name: 'Org' });
  orgId = String(org._id);
  const store = await StoreModel.create({ orgId: org._id, name: 'Main' });
  storeId = String(store._id);
  const product = await ProductModel.create({ orgId: org._id, sku: 'SKU1', name: 'Item', price: 10 });
  productId = String(product._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('set stock, create sale, stock decreases', async () => {
  const app = createApp();
  // set stock to 5
  const setRes = await request(app)
    .put(`/inventory/${orgId}/${storeId}/${productId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ qty: 5 });
  expect(setRes.status).toBe(200);

  // create sale qty 2
  const saleRes = await request(app)
    .post('/sales')
    .set('Authorization', `Bearer ${token}`)
    .send({ orgId, storeId, items: [{ productId, qty: 2 }] });
  expect(saleRes.status).toBe(201);
  expect(saleRes.body.sale.total).toBe(20);

  // stock should be 3
  const getRes = await request(app)
    .get(`/inventory/${orgId}/${storeId}/${productId}`)
    .set('Authorization', `Bearer ${token}`);
  expect(getRes.status).toBe(200);
  expect(getRes.body.qty).toBe(3);
});
