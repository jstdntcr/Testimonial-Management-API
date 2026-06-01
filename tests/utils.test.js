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
        expect(result.errors).toContain('Некорректный email');
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
        expect(result.errors).toContain('Минимум 8 символов');
    });

    test('нет заглавной буквы - ошибка', () => {
        const result = utils.validatePassword('mypass1!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Минимум одна заглавная буква');
    });

    test('нет цифры - ошибка', () => {
        const result = utils.validatePassword('MyPassword!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Минимум одна цифра');
    });

    test('нет спецсимвола - ошибка', () => {
        const result = utils.validatePassword('MyPassword1');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Минимум один специальный символ');
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
        expect(result.errors).toContain('Название не может быть пустым');
    });

    test('один символ - ошибка', () => {
        const result = utils.validateName('J');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Минимум 2 символа');
    });

    test('кириллица - валидна', () => {
        const result = utils.validateName('Иван Иванов');
        expect(result.valid).toBe(true);
    });

    test('недопустимые символы - ошибка', () => {
        const result = utils.validateName('Name@#$');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Недопустимые символы');
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