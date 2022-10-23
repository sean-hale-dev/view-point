import { EntityType, Prisma, SocialType } from '@prisma/client'
import { makeError } from '../util/error';
import prisma from '../util/prisma'
import logger from '../util/winston';

interface EntityRawFields {
  name: string;
  type: string;
  socials?: Record<string, string>[];
};

const validateEntityName = (name: string) => {
  if (name.length < 1) throw makeError('user', 'Entity name cannot be empty');

  return name;
}

const validateEntityType = (type: string) => {
  if (!(type in EntityType)) {
    throw makeError('user', 'Invalid entity type');
  }

  return type as EntityType;
}

const validateEntitySocials = (socials: Record<string, string>[]) => {
  return socials.map(social => {
    const { name, type, value } = social;
    if (!value || !type ) throw makeError('user', 'Invalid social. Must provide type, value');

    if (!(type in SocialType)) throw makeError('user', 'Invalid social. Non-valid type provided');
    if (type === SocialType.CUSTOM && !name) throw makeError('user', 'Invalid social. Custom socials must specify name');
    if (type !== SocialType.CUSTOM && name) throw makeError('user', 'Invalid social. Non-custom social fields should not specify name');
    return social as unknown as Prisma.SocialCreateInput;
  })
}

const validateEntityFields = (inputs: EntityRawFields) => {
  const name = validateEntityName(inputs.name);
  const type = validateEntityType(inputs.type);
  const socials = inputs.socials ? validateEntitySocials(inputs.socials) : [];

  return { name, type, socials }
}

const validateID = (id: number) => {
  if (isNaN(id)) throw makeError('user', 'Invalid ID provided');
  return id;
}
 
const createEntity = async (inputs: EntityRawFields) => {
  logger.debug(`createEntity - Creating: ${JSON.stringify(inputs)}`)
  const { name, type, socials } = validateEntityFields(inputs);

  try {
    const entity = await prisma.entity.create({ data: { name, type, socials: { create: socials } } });

    logger.info(`createEntity - Entity ${entity.id} created`);
    return entity;
  } catch (e) {
    logger.error(`createEntity - ${e}`);
    throw makeError('server')
  }
}

const updateEntity = async (inputID: number, inputs: {name?: string, type?: string, socials?: { add?: Record<string, string>[], remove?: number[] }}) => {
  logger.debug(`updateEntity - Entity: ${inputID}, Updating: ${JSON.stringify(inputs)}`)

  const id = validateID(inputID);
  let entityUpdate: Prisma.EntityUpdateInput = {
    name: typeof inputs.name !== 'undefined' ? validateEntityName(inputs.name) : undefined,
    type: typeof inputs.type !== 'undefined' ? validateEntityType(inputs.type) : undefined,
  };

  if (inputs.socials) {
    entityUpdate.socials = {};

    if (inputs.socials.add) {
      const add_socials = validateEntitySocials(inputs.socials.add);
      entityUpdate.socials.createMany = { data: add_socials };
    }

    if (inputs.socials.remove) {
      const del_socials = inputs.socials.remove.map(id => ({ id: validateID(id) }));
      entityUpdate.socials.delete = del_socials;
    }
  }

  try {
    const entity = await prisma.entity.update({
      where: { id },
      data: entityUpdate,
    });

    logger.info(`updateEntity - Entity ${id} updated`);
    return entity;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2001') throw makeError('user', 'Either could not find entity or associated social to delete')
    }

    logger.error(`updateEntity - ${e}`);
    throw makeError('server');
  }
}

const deleteEntity = async (inputID: number) => {
  logger.debug(`deleteEntity - Entity: ${inputID}`);

  const id = validateID(inputID);
  try {
    const entity = await prisma.entity.delete({ where: {id} });

    logger.info(`deleteEntity - Entity ${id} deleted`);
    return entity;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2001') throw makeError('user', 'Could not find entity')
      if (e.code === 'P2003') throw makeError('user', 'Entity has commissions associated with it')
    }

    logger.error(`deleteEntity - ${e}`);
    throw makeError('server');
  }
}

const getEntity = async (inputID: number) => {
  logger.debug(`getEntity - Entity: ${inputID}`);

  const id = validateID(inputID);
  try {
    const entity = await prisma.entity.findUnique({ where: {id}, include: {socials: true, commissionsDrawn: { include: { thumbnail: { include: { files: true }}}}, commissionsIn: { include: { artist: true, thumbnail: { include: { files: true }}}}} });
    if (!entity) throw makeError('user', 'Could not find entity');
    return entity;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2001') throw makeError('user', 'Could not find entity')
    }

    logger.error(`getEntity - ${e}`);
    throw makeError('server');
  }
}

const getEntities = async () => {
  logger.debug(`getEntities`);

  try {
    const entities = await prisma.entity.findMany();
    return entities;
  } catch (e) {
    logger.error(`getEntities - ${e}`)
    throw makeError('server');
  }
}

export {
  createEntity,
  deleteEntity,
  getEntity,
  getEntities,
  updateEntity
}
