const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

process.env.JWT_SECRET = 'test_secret';

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('authMiddleware', () => {
    test('нет заголовка Authorization - возвращаем 401', () => {
        const req = { headers: {} };
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'No token provided' }));
        expect(next).not.toHaveBeenCalled();
    });

    test('заголовок без Bearer - возвращаем 401', () => {
        const req = { headers: { authorization: 'Token abc123' } };
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('невалидный токен - возвращаем 401', () => {
        const req = { headers: { authorization: 'Bearer invalid.token.here' } };
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid or expired token' }));
        expect(next).not.toHaveBeenCalled();
    });

    test('валидный токен - вызываем next() и заполняем req.user', () => {
        const payload = { userId: 1, email: 'test@test.com' };
        const token = jwt.sign(payload, process.env.JWT_SECRET);

        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toMatchObject(payload);
    });

    test('истёкший токен - возвращаем 401', () => {
        const payload = { userId: 1, email: 'test@test.com' };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '0s' });

        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});