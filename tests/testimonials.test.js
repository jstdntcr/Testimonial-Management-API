const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

let mongoServer;
let token;
let testimonialId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: 'MyPass1!',
        businessName: 'Test Business',
    });

    const res = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
        password: 'MyPass1!',
    });

    token = res.body.data.token;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('POST /api/testimonials', () => {
    test('создаёт отзыв с валидными данными', async () => {
        const res = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'John Doe' });
        
        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data.customerName).toBe('John Doe');
        expect(res.body.data.status).toBe('draft');

        testimonialId = res.body.data.testimonialId;
    });

    test('нет customerName - возвращаем 400', async () => {
        const res = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
    });

    test('нет токена - возвращаем 401', async () => {
        const res = await request(app)
            .post('/api/testimonials')
            .send({ customerName: 'John Doe' });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/testimonials', () => {
    test('возвращает список отзывов с пагинацией', async () => {
        const res = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.pagination).toHaveProperty('total');
        expect(res.body.pagination).toHaveProperty('pages');
    });

    test('фильтр по статусу работает', async () => {
        const res = await request(app)
            .get('/api/testimonials?status=draft')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        res.body.data.forEach(t => expect(t.status).toBe('draft'));
    });

    test('нет токена - возвращаем 401', async () => {
        const res = await request(app).get('/api/testimonials');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/testimonials/:testimonialId', () => {
    test('возвращаем отзыв по id', async () => {
        const res = await request(app)
            .get(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.testimonialId).toBe(testimonialId);
    });

    test('несуществующий id - возвращаем 404', async () => {
        const res = await request(app)
            .get('/api/testimonials/non-existent-id')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

describe('PUT /api/testimonials/:testimonialId', () => {
    test('обновляет поля отзыва', async () => {
        const res = await request(app)
            .put(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Jane Doe', text: 'Great service!' });

        expect(res.status).toBe(200);
        expect(res.body.data.customerName).toBe('Jane Doe');
        expect(res.body.data.text).toBe('Great service!');
    });

    test('несуществующий id - возвращаем 404', async () => {
        const res = await request(app)
            .put('/api/testimonials/non-existent-id')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Jane Doe' });

        expect(res.status).toBe(404);
    });
});

describe('PATCH /api/testimonials/:testimonialId/status', () => {
    test('из draft в recording - успешно', async () => {
        const res = await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ testimonialStatus: 'recording' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('recording');
    });

    test('невалидный переход из draft в completed - возвращаем 400', async () => {
        // Создаём новый отзыв в статусе draft
        const create = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Test User' });

        const id = create.body.data.testimonialId;

        const res = await request(app)
            .patch(`/api/testimonials/${id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ testimonialStatus: 'completed' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Cannot transition/);
    });

    test('переход в shared устанавливает sharedAt', async () => {
        // Прогоняем через все статусы до completed
        const statuses = ['processing', 'completed', 'shared'];
        let currentId = testimonialId;

        for (const status of statuses) {
            await request(app)
                .patch(`/api/testimonials/${currentId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ testimonialStatus: status });
        }

        const res = await request(app)
            .get(`/api/testimonials/${currentId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.body.data.sharedAt).not.toBeNull();
    });
});

describe('DELETE /api/testimonials/:testimonialId', () => {
    test('мягкое удаление - isDeleted становится true', async () => {
        const create = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'To Delete' });

        const id = create.body.data.testimonialId;

        const del = await request(app)
            .delete(`/api/testimonials/${id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(del.status).toBe(200);

        // Удалённый отзыв не должен находиться через getById
        const get = await request(app)
            .get(`/api/testimonials/${id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(get.status).toBe(404);
    });

    test('несуществующий id - возвращаем 404', async () => {
        const res = await request(app)
            .delete('/api/testimonials/non-existent-id')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});