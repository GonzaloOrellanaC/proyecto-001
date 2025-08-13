import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('register and login', async () => {
  const app = createApp();
  const email = 'test@example.com';
  const password = 'Password123!';

  const reg = await request(app).post('/auth/register').send({ email, password, name: 'Tester' });
  expect(reg.status).toBe(201);
  expect(reg.body.ok).toBe(true);

  const login = await request(app).post('/auth/login').send({ email, password });
  expect(login.status).toBe(200);
  expect(login.body.ok).toBe(true);
  expect(login.body.token).toBeTruthy();
});
