import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app';

let mongod: MongoMemoryServer;
let token: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  const app = createApp();
  const email = 'p@example.com';
  const password = 'Password123!';
  await request(app).post('/auth/register').send({ email, password, name: 'P' });
  const login = await request(app).post('/auth/login').send({ email, password });
  token = login.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('me and update me', async () => {
  const app = createApp();
  const me = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
  expect(me.status).toBe(200);
  const patch = await request(app).patch('/me').set('Authorization', `Bearer ${token}`).send({ phone: '123' });
  expect(patch.status).toBe(200);
  expect(patch.body.user.phone).toBe('123');
});
