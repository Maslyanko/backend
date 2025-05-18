// backend/__tests__/simple.auth.test.js
const request = require('supertest');
const app = require('../server'); // Путь к вашему Express app
const db = require('../config/db');

describe('Simple Auth Tests (assuming seeded data)', () => {
  const existingUserCredentials = {
    email: 'user@example.com', // Из вашего seed.js
    password: 'password',      // Из вашего seed.js
  };

  const newUserCredentials = {
    email: `new_test_user_${Date.now()}@example.com`,
    password: 'newPassword123',
    fullName: 'New Test User',
  };

  let authToken; // Для хранения токена

  it('POST /v1/auth/login - should login an existing user', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send(existingUserCredentials);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toEqual(existingUserCredentials.email);
    authToken = res.body.accessToken; // Сохраняем токен для других тестов
  });

  it('POST /v1/auth/login - should fail with wrong password', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({
        email: existingUserCredentials.email,
        password: 'wrongpassword',
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body.code).toEqual('INVALID_CREDENTIALS');
  });

  it('POST /v1/auth/register - should register a new user', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send(newUserCredentials);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toEqual(newUserCredentials.email);
  });

  it('GET /v1/users/me - should get current user profile with valid token', async () => {
    // Сначала логинимся, чтобы получить актуальный токен (если предыдущий тест на register его не дал)
    if (!authToken) {
        const loginRes = await request(app).post('/v1/auth/login').send(existingUserCredentials);
        authToken = loginRes.body.accessToken;
    }

    expect(authToken).toBeDefined(); // Убедимся, что токен есть

    const res = await request(app)
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toEqual(existingUserCredentials.email); // Проверяем email залогиненного пользователя
  });

  it('GET /v1/users/me - should fail without token', async () => {
    const res = await request(app)
      .get('/v1/users/me');
    expect(res.statusCode).toEqual(401);
  });
});