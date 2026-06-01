const utils = require('../lib/utils');

describe('validateEmail', () => {
    test('валидный email - возвращаем valid: true', () => {
        const result = utils.validateEmail('user@example.com');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('email без @ - возвращаем ошибку', () => {
        const result = utils.validateEmail('userexample.com');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid email format');
    });

    test('email без домена - возвращаем ошибку', () => {
        const result = utils.validateEmail('user@');
        expect(result.valid).toBe(false);
    });

    test('пустая строка - возвращаем ошибку', () => {
        const result = utils.validateEmail('');
        expect(result.valid).toBe(false);
    });
});

describe('validatePassword', () => {
    test('валидный пароль - возвращаем valid: true', () => {
        const result = utils.validatePassword('MyPass1!');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('короткий пароль - ошибка', () => {
        const result = utils.validatePassword('Ab1!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Minimum 8 characters');
    });

    test('нет заглавной буквы - ошибка', () => {
        const result = utils.validatePassword('mypass1!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('At least one uppercase letter');
    });

    test('нет цифры - ошибка', () => {
        const result = utils.validatePassword('MyPassword!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('At least one digit');
    });

    test('нет спецсимвола - ошибка', () => {
        const result = utils.validatePassword('MyPassword1');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('At least one special character');
    });

    test('несколько нарушений - возвращаем все ошибки', () => {
        const result = utils.validatePassword('abc');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
    });
});

describe('validateName', () => {
    test('валидное имя - возвращаем valid: true', () => {
        const result = utils.validateName('John Doe');
        expect(result.valid).toBe(true);
    });

    test('пустая строка - ошибка', () => {
        const result = utils.validateName('');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Name cannot be empty');
    });

    test('один символ - ошибка', () => {
        const result = utils.validateName('J');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Minimum 2 characters');
    });

    test('кириллица - валидна', () => {
        const result = utils.validateName('Иван Иванов');
        expect(result.valid).toBe(true);
    });

    test('недопустимые символы - ошибка', () => {
        const result = utils.validateName('Name@#$');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid characters');
    });
});

describe('hashPassword / comparePasswords', () => {
    test('хэш пароля совпадает при сравнении', async () => {
        const password = 'MyPass1!';
        const hash = await utils.hashPassword(password);
        const isMatch = await utils.comparePasswords(password, hash);
        expect(isMatch).toBe(true);
    });

    test('неверный пароль не совпадает с хэшем', async () => {
        const hash = await utils.hashPassword('MyPass1!');
        const isMatch = await utils.comparePasswords('WrongPass1!', hash);
        expect(isMatch).toBe(false);
    });
});