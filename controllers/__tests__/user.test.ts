import { createUser, validateCredentials } from '../user';
import prisma from '../../util/prisma';
import { makeError } from '../../util/error';


describe('user controller', () => {
  beforeEach(() => {
    jest.mock('../../util/prisma');
  })

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mock_user = {
    username: 'testuser',
    password: 'testpass',
  };

  const mock_user_hashed = {
    username: 'testuser',
    password: '$2b$08$S5YDuYLmC3uuM5zpkpxtsuklUm9X9EynvEoR7osWcXppZ0Hjclfrm',
  }

  test('successfully creates user', async () => {
    const prismaSpy = jest.spyOn(prisma.user, 'create');
    prismaSpy.mockResolvedValueOnce({...mock_user, id: 1});
    await createUser(mock_user.username, mock_user.password);

    expect(prismaSpy).toHaveBeenCalledTimes(1);
    const args = prismaSpy.mock.lastCall![0].data;
    expect(args.username).toBe(mock_user.username);
    expect(args.password).not.toBe(mock_user.password);
  });

  test('prisma fails on create user', () => {
    const prismaSpy = jest.spyOn(prisma.user, 'create');
    prismaSpy.mockRejectedValueOnce(new Error());
    expect.assertions(1);

    return expect(createUser(mock_user.username, mock_user.password)).rejects.toEqual(makeError('server'))
  });

  test('successfully validates password', async () => {
    const prismaSpy = jest.spyOn(prisma.user, 'findUnique');
    prismaSpy.mockResolvedValueOnce({ id: 1, username: mock_user.username, password: mock_user_hashed.password})

    const result = await validateCredentials(mock_user.username, mock_user.password);
    expect(result).toBeTruthy();
  })

  test('validation could not find user', () => {
    const prismaSpy = jest.spyOn(prisma.user, 'findUnique');
    prismaSpy.mockRejectedValueOnce(new Error());
    expect.assertions(1);

    return expect(validateCredentials(mock_user.username, mock_user.password)).rejects.toEqual(makeError('server'))
  })
})
