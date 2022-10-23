import prisma from '../../util/prisma';
import { makeError } from '../../util/error';
import { createEntity, deleteEntity, getEntities, getEntity, updateEntity } from '../entity';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';


describe('entity controller', () => {
  beforeEach(() => {
    jest.mock('../../util/prisma');
  })

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create entity', () => {
    test('valid create - no socials', () => {
      const spy = jest.spyOn(prisma.entity, 'create');
      spy.mockResolvedValueOnce({ id: 1, type: 'ARTIST', name: 'testArtist' });

      expect.assertions(1)
      return expect(createEntity({ name: 'testArtist', type: 'ARTIST' })).resolves.toEqual({id: 1, type: 'ARTIST', name: 'testArtist'});
    })

    test('valid create - with socials', () => {
      const spy = jest.spyOn(prisma.entity, 'create');
      spy.mockResolvedValueOnce({ id: 1, type: 'ARTIST', name: 'testArtist', });

      expect.assertions(1)
      return expect(
        createEntity({
          name: 'testArtist',
          type: 'ARTIST',
          socials: [
            { type: 'TELEGRAM',    value: 'telegramArtist' },
            { type: 'TWITTER',     value: 'twitterArtist' },
            { type: 'WEBSITE',     value: 'https://websiteArtist.com' },
            { type: 'FURAFFINITY', value: 'furaffinityArtist' },
            { type: 'CUSTOM',      value: 'customArtistValue', name: 'customField' },
          ]
        })
      ).resolves.toEqual({id: 1, type: 'ARTIST', name: 'testArtist'});
    })

    test('invalid entity type', () => {
      expect.assertions(1)
      return expect(createEntity({ name: 'testArtist', type: 'wrong type' })).rejects.toEqual(makeError('user', 'Invalid entity type'));
    })

    test('invalid social type', () => {
      expect.assertions(1)
      return expect(createEntity({ name: 'testCharacter', type: 'CHARACTER', socials: [{type: "wrong type", value: "something"}] }))
        .rejects.toEqual(makeError('user', 'Invalid social. Non-valid type provided'));
    })

    test('invalid social form', () => {
      expect.assertions(1)
      return expect(createEntity({ name: 'testCharacter', type: 'CHARACTER', socials: [{type: "wrong type"}] }))
        .rejects.toEqual(makeError('user', 'Invalid social. Must provide type, value'));
    })

    test('non-custom social provided name', () => {
      expect.assertions(1)
      return expect(createEntity({ name: 'testCharacter', type: 'CHARACTER', socials: [{type: 'TELEGRAM', name: "bad", value: "something"}] }))
        .rejects.toEqual(makeError('user', 'Invalid social. Non-custom social fields should not specify name'));
    })

    test('custom social missing name', () => {
      expect.assertions(1)
      return expect(createEntity({ name: 'testCharacter', type: 'CHARACTER', socials: [{type: "CUSTOM", value: "something"}] }))
        .rejects.toEqual(makeError('user', 'Invalid social. Custom socials must specify name'));
    })

    test('prisma error', () => {
      const spy = jest.spyOn(prisma.entity, 'create');
      spy.mockRejectedValueOnce(new Error());
      expect.assertions(1)
      return expect(createEntity({ name: 'testCharacter', type: 'CHARACTER', socials: [{type: "CUSTOM", name: 'test', value: "something"}] }))
        .rejects.toEqual(makeError('server'));
    })
  })

  describe('get entity', () => {
    test('valid fetch', () => {
      const spy = jest.spyOn(prisma.entity, 'findUnique');

      const mock_entity = {
        id: 1,
        name: "testArtist",
        type: 'ARTIST',
        socials: [ { id: 1, type: "TELEGRAM", value: 'telegramArtist', name: null, entityId: 1 } ]
      }
      // @ts-ignore
      spy.mockResolvedValueOnce(mock_entity);

      expect.assertions(1)
      return expect(getEntity(1)).resolves.toEqual(mock_entity);
    })

    test('non-existant entity', () => {
      const spy = jest.spyOn(prisma.entity, 'findUnique');
      spy.mockRejectedValueOnce(new PrismaClientKnownRequestError('', 'P2001', ''));

      expect.assertions(1);
      return expect(getEntity(1)).rejects.toEqual(makeError('user', 'Could not find entity'));
    })

    test('prisma error', () => {
      const spy = jest.spyOn(prisma.entity, 'findUnique');
      spy.mockRejectedValueOnce(new Error());

      expect.assertions(1);
      return expect(getEntity(1)).rejects.toEqual(makeError('server'));
    })

    test('invalid ID', () => {
      expect.assertions(1);
      return expect(getEntity(NaN)).rejects.toEqual(makeError('user', 'Invalid ID provided'))
    })
  })

  describe('get entities', () => {
    test('valid fetch', () => {
      const spy = jest.spyOn(prisma.entity, 'findMany');
      spy.mockResolvedValueOnce([1,2].map(i => ({id: i, name: 'testEnt', type: 'ARTIST'})));

      expect.assertions(1);
      return expect(getEntities()).resolves.toEqual([1,2].map(i => ({id: i, name: 'testEnt', type: 'ARTIST'})));
    })

    test('prisma error', () => {
      const spy = jest.spyOn(prisma.entity, 'findMany');
      spy.mockRejectedValueOnce(new Error());

      expect.assertions(1)
      return expect(getEntities()).rejects.toEqual(makeError('server'));
    })
  })

  describe('delete entity', () => {
    test('valid deletion', () => {
      const spy = jest.spyOn(prisma.entity, 'delete');
      spy.mockResolvedValueOnce({id: 1, name: 'testEnt', type: 'ARTIST'});
      expect.assertions(1)
      return expect(deleteEntity(1)).resolves.toEqual({id: 1, name: 'testEnt', type: 'ARTIST'});
    })

    test('invalid ID', () => {
      expect.assertions(1)
      return expect(deleteEntity(NaN)).rejects.toEqual(makeError('user', 'Invalid ID provided'));
    })

    test('non-existant entity', () => {
      const spy = jest.spyOn(prisma.entity, 'delete');
      spy.mockRejectedValueOnce(new PrismaClientKnownRequestError('', 'P2001', ''));
      expect.assertions(1);
      return expect(deleteEntity(1)).rejects.toEqual(makeError('user', 'Could not find entity'));
    })

    test('entity has associated commissions', () => {
      const spy = jest.spyOn(prisma.entity, 'delete');
      spy.mockRejectedValueOnce(new PrismaClientKnownRequestError('', 'P2003', ''));
      expect.assertions(1);
      return expect(deleteEntity(1)).rejects.toEqual(makeError('user', 'Entity has commissions associated with it'));
    })

    test('prisma error', () => {
      const spy = jest.spyOn(prisma.entity, 'delete');
      spy.mockRejectedValueOnce(new Error());
      expect.assertions(1);
      return expect(deleteEntity(1)).rejects.toEqual(makeError('server'));
    })
  })

  describe('update entity', () => {
    test('valid update', () => {
      const spy = jest.spyOn(prisma.entity, 'update');
      spy.mockResolvedValueOnce({id: 1, name: 'newName', type: 'CHARACTER'});
      expect.assertions(1);
      const updateArgs = {
        name: 'newName',
        type: 'CHARACTER',
        socials: {
          add: [{type: 'TELEGRAM', value: 'entTelegram'}],
          remove: [1,2,3]
        }
      }
      return expect(updateEntity(1, updateArgs)).resolves.toEqual({id: 1, name: 'newName', type: 'CHARACTER'});
    })

    test('invalid name', () => {
      expect.assertions(1)
      return expect(updateEntity(1, {name: ''})).rejects.toEqual(makeError('user', 'Entity name cannot be empty'));
    })

    test('invalid type', () => {
      expect.assertions(1)
      return expect(updateEntity(1, {type: ''})).rejects.toEqual(makeError('user', 'Invalid entity type'));
    })

    test('invalid social type', () => {
      expect.assertions(1)
      return expect(updateEntity(1, {socials: { add: [{type: "wrong type", value: "wrong"}] }})).rejects.toEqual(makeError('user', 'Invalid social. Non-valid type provided'));
    })

    test('invalid social form', () => {
      expect.assertions(1)
      return expect(updateEntity(1, {socials: { add: [{type: "wrong type"}] }})).rejects.toEqual(makeError('user', 'Invalid social. Must provide type, value'));
    })

    test('non-custom social with name', () => {
      expect.assertions(1)
      return expect(updateEntity(1, {socials: { add: [{type: "TELEGRAM", value: 'entTelegram', name: 'bad'}] }})).rejects.toEqual(makeError('user', 'Invalid social. Non-custom social fields should not specify name'));
    })

    test('custom social without name', () => {
      expect.assertions(1)
      return expect(updateEntity(1, {socials: { add: [{type: "CUSTOM", value: 'entVal'}] }})).rejects.toEqual(makeError('user', 'Invalid social. Custom socials must specify name'));
    })

    test('invalid social ID', () => {
      expect.assertions(1)
      return expect(updateEntity(1, {socials: { remove: [NaN] }})).rejects.toEqual(makeError('user', 'Invalid ID provided'));
    })

    test('invalid entity ID', () => {
      expect.assertions(1)
      return expect(updateEntity(NaN, {socials: { remove: [NaN] }})).rejects.toEqual(makeError('user', 'Invalid ID provided'));
    })

    test('prisma error', () => {
      const spy = jest.spyOn(prisma.entity, 'update');
      spy.mockRejectedValueOnce(new Error());
      expect.assertions(1);
      return expect(updateEntity(1, {name: "something"})).rejects.toEqual(makeError('server'));
    })
  })
})
