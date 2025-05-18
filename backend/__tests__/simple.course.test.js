// backend/__tests__/simple.course.test.js
const request = require('supertest');
const app = require('../server');
const db = require('../config/db');

describe('Simple Course Tests (assuming seeded data)', () => {
  let authToken;
  let courseIdFromSeed; // Предположим, мы знаем ID одного из курсов из seed

  beforeAll(async () => {
    // Логинимся, чтобы получить токен для защищенных запросов
    const loginRes = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'user@example.com', password: 'password' }); // Данные из seed.js
    authToken = loginRes.body.accessToken;

    // Получим список курсов, чтобы взять ID первого для дальнейших тестов
    // Это делает тест немного зависимым, но упрощает его
    const coursesRes = await request(app).get('/v1/courses');
    if (coursesRes.body && coursesRes.body.length > 0) {
        courseIdFromSeed = coursesRes.body[0].id; // Берем ID первого курса из списка
    } else {
        console.warn("Warning: No courses found from GET /v1/courses. Some course tests might fail or be skipped.");
    }
  });

  it('GET /v1/courses - should get a list of courses', async () => {
    const res = await request(app).get('/v1/courses');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('title');
    }
  });

  it('GET /v1/courses/tags - should get a list of tags', async () => {
    const res = await request(app).get('/v1/courses/tags');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Например, если в seed.js есть курс с тегом 'Python' и он опубликован
    if (res.body.length > 0) {
        // Проверяем, что возвращается массив строк
        expect(typeof res.body[0]).toBe('string');
    }
  });

  it('GET /v1/courses/:courseId - should get a single course if ID is valid and user is authenticated', async () => {
    if (!courseIdFromSeed) {
      console.log("Skipping test for GET /v1/courses/:courseId due to missing courseIdFromSeed");
      return; // Пропускаем тест, если ID курса не получен
    }
    expect(authToken).toBeDefined();

    const res = await request(app)
      .get(`/v1/courses/${courseIdFromSeed}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', courseIdFromSeed);
  });

  it('GET /v1/courses/:courseId - should return 404 for a non-existent course ID', async () => {
    expect(authToken).toBeDefined();
    const nonExistentCourseId = '00000000-0000-0000-0000-000000000000'; // Несуществующий UUID
    const res = await request(app)
      .get(`/v1/courses/${nonExistentCourseId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toEqual(404);
  });

  // Пример POST /courses/:courseId/enroll (требует, чтобы пользователь не был автором и курс был опубликован)
  it('POST /v1/courses/:courseId/enroll - should enroll a user in a course', async () => {
    if (!courseIdFromSeed) {
        console.log("Skipping enroll test due to missing courseIdFromSeed");
        return;
    }
    expect(authToken).toBeDefined();

    // Важно: этот тест может не пройти, если user@example.com является автором courseIdFromSeed
    // или если он уже записан на курс. Для простоты предполагаем, что это не так.
    // Или нужно выбрать курс, на который пользователь точно не записан и не является автором.
    // Для более надежного теста нужно было бы создавать новый курс и нового пользователя.

    const res = await request(app)
      .post(`/v1/courses/${courseIdFromSeed}/enroll`)
      .set('Authorization', `Bearer ${authToken}`);

    // Ожидаем 201 (создана новая запись) или 200 (уже был записан, ваш контроллер так обрабатывает)
    expect([200, 201]).toContain(res.statusCode);
    if (res.statusCode === 201) {
        expect(res.body).toHaveProperty('user_id');
        expect(res.body).toHaveProperty('course_id', courseIdFromSeed);
    } else if (res.statusCode === 200) {
        expect(res.body.message).toEqual('Вы уже были записаны на этот курс.');
    }
  });
});