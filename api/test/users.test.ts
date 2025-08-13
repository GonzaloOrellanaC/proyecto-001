import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app';

let mongod: MongoMemoryServer;
let adminToken: string;
let userId: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  const app = createApp();
  // create admin and user
  await request(app).post('/auth/register').send({ email: 'a@example.com', password: 'Password123!', name: 'A', role: 'admin' });
  const adminLogin = await request(app).post('/auth/login').send({ email: 'a@example.com', password: 'Password123!' });
  adminToken = adminLogin.body.token;
  const userReg = await request(app).post('/auth/register').send({ email: 'u@example.com', password: 'Password123!', name: 'U' });
  userId = userReg.body.user._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('list users requires admin', async () => {
  const app = createApp();
  const res = await request(app).get('/users').set('Authorization', `Bearer ${adminToken}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.users)).toBe(true);
});

test('update user role', async () => {
  const app = createApp();
  const res = await request(app).patch(`/users/${userId}`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'cashier' });
  expect(res.status).toBe(200);
  expect(res.body.user.role).toBe('cashier');
});
