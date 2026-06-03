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
}, 30000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
}, 15000);

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
            .send({ status: 'recording' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('recording');
    });

    test('невалидный переход из draft в completed - возвращаем 400', async () => {
        const create = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Test User' });

        const id = create.body.data.testimonialId;

        const res = await request(app)
            .patch(`/api/testimonials/${id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'completed' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Cannot transition/);
    });

    test('переход в shared устанавливает sharedAt', async () => {
        const create = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Shared At Test' });

        const id = create.body.data.testimonialId;

        for (const status of ['recording', 'processing', 'completed', 'shared']) {
            await request(app)
                .patch(`/api/testimonials/${id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status });
        }

        const res = await request(app)
            .get(`/api/testimonials/${id}`)
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

describe('POST /api/testimonials/:testimonialId/share', () => {
    let completedId;

    beforeEach(async () => {
        const create = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Share Test' });

        completedId = create.body.data.testimonialId;

        for (const status of ['recording', 'processing', 'completed']) {
            await request(app)
                .patch(`/api/testimonials/${completedId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status });
        }
    });

    test('валидные каналы - 200, каналы сохранены', async () => {
        const res = await request(app)
            .post(`/api/testimonials/${completedId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ channels: ['email', 'facebook'] });

        expect(res.status).toBe(200);
        expect(res.body.data.sharedChannels).toContain('email');
        expect(res.body.data.sharedChannels).toContain('facebook');
    });

    test('статус completed → авто-переход в shared и sharedAt выставлен', async () => {
        const res = await request(app)
            .post(`/api/testimonials/${completedId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ channels: ['sms'] });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('shared');
        expect(res.body.data.sharedAt).not.toBeNull();
    });

    test('дедупликация каналов - email не дублируется при повторном шаринге', async () => {
        await request(app)
            .post(`/api/testimonials/${completedId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ channels: ['email'] });

        const res = await request(app)
            .post(`/api/testimonials/${completedId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ channels: ['email', 'sms'] });

        expect(res.status).toBe(200);
        const emailCount = res.body.data.sharedChannels.filter(c => c === 'email').length;
        expect(emailCount).toBe(1);
        expect(res.body.data.sharedChannels).toContain('sms');
    });

    test('шаринг из статуса draft - 400', async () => {
        const draft = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Draft Share' });

        const res = await request(app)
            .post(`/api/testimonials/${draft.body.data.testimonialId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ channels: ['email'] });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Cannot share/);
    });

    test('невалидный канал - 400', async () => {
        const res = await request(app)
            .post(`/api/testimonials/${completedId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ channels: ['telegram'] });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Invalid channels/);
    });

    test('channels не передан - 400', async () => {
        const res = await request(app)
            .post(`/api/testimonials/${completedId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
    });

    test('нет токена - 401', async () => {
        const res = await request(app)
            .post(`/api/testimonials/${completedId}/share`)
            .send({ channels: ['email'] });

        expect(res.status).toBe(401);
    });
});

describe('403 - проверка владельца', () => {
    let tokenB;
    let userAId;

    beforeAll(async () => {
        await request(app).post('/api/auth/register').send({
            email: 'userb@test.com',
            password: 'MyPass1!',
            businessName: 'User B Business',
        });

        const loginRes = await request(app).post('/api/auth/login').send({
            email: 'userb@test.com',
            password: 'MyPass1!',
        });

        tokenB = loginRes.body.data.token;

        const create = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'User A Only' });

        userAId = create.body.data.testimonialId;
    });

    test('GET чужого отзыва - 403', async () => {
        const res = await request(app)
            .get(`/api/testimonials/${userAId}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(403);
    });

    test('PUT чужого отзыва - 403', async () => {
        const res = await request(app)
            .put(`/api/testimonials/${userAId}`)
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ customerName: 'Hacked' });

        expect(res.status).toBe(403);
    });

    test('PATCH status чужого отзыва - 403', async () => {
        const res = await request(app)
            .patch(`/api/testimonials/${userAId}/status`)
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ status: 'recording' });

        expect(res.status).toBe(403);
    });

    test('DELETE чужого отзыва - 403', async () => {
        const res = await request(app)
            .delete(`/api/testimonials/${userAId}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(403);
    });
});

describe('Валидация входных данных', () => {
    test('POST без sharedChannels - 201 (поле опционально)', async () => {
        const res = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'No Channels' });

        expect(res.status).toBe(201);
    });

    test('POST с невалидным каналом в sharedChannels - 400', async () => {
        const res = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Bad Channel', sharedChannels: ['telegram'] });

        expect(res.status).toBe(400);
    });

    test('POST с rating вне диапазона 1-5 - 400', async () => {
        const res = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Bad Rating', rating: 9 });

        expect(res.status).toBe(400);
    });

    test('GET с невалидным status в query - 400', async () => {
        const res = await request(app)
            .get('/api/testimonials?status=invalidStatus')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });
});

describe('Auth — валидация', () => {
    test('login без пароля - 400', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com' });

        expect(res.status).toBe(400);
    });

    test('register с дублирующимся email - 400', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@test.com', password: 'MyPass1!', businessName: 'Dup' });

        expect(res.status).toBe(400);
    });
});

describe('Settings — валидация', () => {
    test('POST с невалидным типом isEnabled - 400', async () => {
        const res = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ isEnabled: 'yes' });

        expect(res.status).toBe(400);
    });

    test('POST с невалидным каналом в sendingOptions - 400', async () => {
        const res = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ sendingOptions: ['email', 'telegram'] });

        expect(res.status).toBe(400);
    });

    test('POST с валидными настройками - 200', async () => {
        const res = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ isEnabled: true, sendingOptions: ['email', 'sms'] });

        expect(res.status).toBe(200);
        expect(res.body.data.isEnabled).toBe(true);
    });
});

describe('Edge cases — статусы, даты, маршруты', () => {
    test('PATCH status с невалидным enum-значением - 400', async () => {
        const create = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Enum Test' });

        const res = await request(app)
            .patch(`/api/testimonials/${create.body.data.testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'banana' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Invalid status value/);
    });

    test('analytics с невалидной датой - 400', async () => {
        const res = await request(app)
            .get('/api/testimonials/analytics?startDate=not-a-date')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });

    test('неизвестный маршрут - 404 в едином JSON-формате', async () => {
        const res = await request(app)
            .get('/api/nonexistent')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.status).toBe('failure');
        expect(res.body).toHaveProperty('code', 404);
    });
});