import prisma from '../../util/prisma';
import * as MinioTools from '../../util/minio';
import { completeCommission, createCommission, deleteCommission, getCommission, getCommissions, updateCommission } from '../commission';
import { makeError } from '../../util/error';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

describe('commission controller', () => {
  beforeEach(() => {
    jest.mock('../../util/prisma');
  })

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const required_arguments = { dateCommissioned: (new Date('1/1/2022')).toString(), invoice: { filepath: '/path/to/thing.pdf', filename: 'thing.pdf', size: 1, contentType: 'application/pdf', }, price: 1.00, nsfw: false, artistId: 1, characterIds: [1], }
  const mock_comm_required = { id: 1, artistId: 1, characterIds: [1], price: 1.00, nsfw: false, dateCommissioned: new Date('1/1/2022'), invoiceId: 1, title: null, description: null, dateReceived: null, thumbnailId: null, }
  const supplimental_arguments = { title: 'testcomm', description: 'testdesc', dateReceived: (new Date('1/2/2022')).toString(), thumbnailLabel: 'testthumb', nsfw: false, images: [{ name: 'testthumb', alternates: [] }] }
  const mock_comm_all = { id: 1, artistId: 1, characterIds: [1], price: 1.00, nsfw: false, dateCommissioned: new Date('1/1/2022'), invoiceId: 1, title: 'testcomm', description: 'testdesc', dateReceived: new Date('1/2/2022'), thumbnailId: 1 }

  const small_image = { filepath: './__test__/assets/white.png', filename: 'white.png', size: 351, contentType: 'image/png'};
  const large_image = { filepath: './__test__/assets/white_1024.png', filename: 'white_1024.png', size: 837, contentType: 'image/png' };

  describe('create commission', () => {
    test('valid - required input', () => {
      const p_spy = jest.spyOn(prisma.commission, 'create');
      const file_spy = jest.spyOn(MinioTools, 'store_file');

      p_spy.mockResolvedValueOnce(mock_comm_required);
      file_spy.mockResolvedValueOnce('identifier');

      expect.assertions(1)
      return expect(createCommission(required_arguments)).resolves.toEqual(mock_comm_required);
    })

    test('valid - required & supplimental input', () => {
      const p_spy = jest.spyOn(prisma.commission, 'create');
      const file_spy = jest.spyOn(MinioTools, 'store_file');
      const stream_spy = jest.spyOn(MinioTools, 'store_stream');

      p_spy.mockResolvedValueOnce(mock_comm_all);
      file_spy.mockResolvedValue('identifier');
      stream_spy.mockResolvedValue('identifier')

      expect.assertions(1)
      // @ts-ignore
      supplimental_arguments.images[0].alternates = [];
      // @ts-ignore
      supplimental_arguments.images[0].alternates.push(small_image);
      return expect(createCommission({...required_arguments, ...supplimental_arguments})).resolves.toEqual(mock_comm_all);
    })

    test('valid - required & supplimental input, computed input', () => {
      const p_spy = jest.spyOn(prisma.commission, 'create');
      const file_spy = jest.spyOn(MinioTools, 'store_file');
      const stream_spy = jest.spyOn(MinioTools, 'store_stream');

      p_spy.mockResolvedValueOnce(mock_comm_all);
      file_spy.mockResolvedValue('identifier');
      stream_spy.mockResolvedValue('identifier')

      expect.assertions(1)
      // @ts-ignore
      supplimental_arguments.images[0].alternates = [];
      // @ts-ignore
      supplimental_arguments.images[0].alternates.push(large_image);
      return expect(createCommission({...required_arguments, ...supplimental_arguments})).resolves.toEqual(mock_comm_all);
    })

    test('unknown artist or character', () => {
      const p_spy = jest.spyOn(prisma.commission, 'create');
      const file_spy = jest.spyOn(MinioTools, 'store_file');
      const stream_spy = jest.spyOn(MinioTools, 'store_stream');

      p_spy.mockRejectedValueOnce(new PrismaClientKnownRequestError('', 'P2001', ''));
      file_spy.mockResolvedValue('identifier');
      stream_spy.mockResolvedValue('identifier')

      expect.assertions(1)
      return expect(createCommission({...required_arguments})).rejects.toEqual(makeError('user', 'Could not find either artist or character to link'));
    })

    test('prisma error', () => {
      const p_spy = jest.spyOn(prisma.commission, 'create');
      const file_spy = jest.spyOn(MinioTools, 'store_file');
      const stream_spy = jest.spyOn(MinioTools, 'store_stream');

      p_spy.mockRejectedValueOnce(new Error());
      file_spy.mockResolvedValue('identifier');
      stream_spy.mockResolvedValue('identifier')

      expect.assertions(1)
      return expect(createCommission({...required_arguments})).rejects.toEqual(makeError('server'));
    })

    describe('invalid required fields', () => {
      test('invalid dateCommissioned', () => {
        expect.assertions(1)
        return expect(createCommission({...required_arguments, dateCommissioned: (new Date('value')).toString()})).rejects.toEqual(makeError('user', 'Invalid date commissioned value'));
      })

      test('invalid invoice - not PDF', () => {
        expect.assertions(1)
        const invoice = {...required_arguments.invoice};
        invoice.contentType = 'wrong';
        return expect(createCommission({...required_arguments, invoice })).rejects.toEqual(makeError('user', 'Invoice must be a PDF'));
      })

      test('invalid invoice - size is NaN', () => {
        expect.assertions(1)
        const invoice = {...required_arguments.invoice};
        invoice.size = NaN;
        return expect(createCommission({...required_arguments, invoice })).rejects.toEqual(makeError('server', 'Unable to read invoice file'));
      })

      test('invalid invoice - size is 0', () => {
        expect.assertions(1)
        const invoice = {...required_arguments.invoice};
        invoice.size = 0;
        return expect(createCommission({...required_arguments, invoice })).rejects.toEqual(makeError('server', 'Unable to read invoice file'));
      })

      test('invalid price', () => {
        expect.assertions(1)
        return expect(createCommission({...required_arguments, price: NaN})).rejects.toEqual(makeError('user', 'Price must be a valid number'));
      })

      test('invalid artistID', () => {
        expect.assertions(1)
        return expect(createCommission({...required_arguments, artistId: NaN})).rejects.toEqual(makeError('user', 'Artist ID must be a valid number'));
      })

      test('invalid characterID', () => {
        expect.assertions(1)
        return expect(createCommission({...required_arguments, characterIds: [NaN]})).rejects.toEqual(makeError('user', 'Character IDs must be valid numbers'));
      })
    })

    describe('invalid supplimental fields', () => {
      test('invalid dateReceived', () => {
        expect.assertions(1)
        return expect(createCommission({...required_arguments, ...supplimental_arguments, dateReceived: (new Date('wrong')).toString()})).rejects.toEqual(makeError('user', 'Invalid date received value'));
      })

      test('missing title', () => {
        expect.assertions(1)
        return expect(createCommission({...required_arguments, ...supplimental_arguments, title: undefined})).rejects.toEqual(makeError('user', 'Must provide title'));
      })

      test('missing description', () => {
        expect.assertions(1)
        return expect(createCommission({...required_arguments, ...supplimental_arguments, description: undefined})).rejects.toEqual(makeError('user', 'Must provide description'));
      })

      test('missing thumbnail label', () => {
        expect.assertions(1)
        return expect(createCommission({...required_arguments, ...supplimental_arguments, thumbnailLabel: undefined})).rejects.toEqual(makeError('user', 'Must provide thumbnail selection'));
      })

      test('invalid image filetype', () => {
        expect.assertions(1)
        const images = [...supplimental_arguments.images];
        // @ts-ignore
        images[0].alternates[0].contentType = 'wrong';
        return expect(createCommission({...required_arguments, ...supplimental_arguments, images})).rejects.toEqual(makeError('user', 'Unsupported filetype'));
      })

      test('image size is NaN', () => {
        expect.assertions(1)
        const images = [...supplimental_arguments.images];
        // @ts-ignore
        images[0].alternates[0].size = NaN;
        // @ts-ignore
        images[0].alternates[0].contentType = 'image/png';
        return expect(createCommission({...required_arguments, ...supplimental_arguments, images})).rejects.toEqual(makeError('user', 'Unable to read image file'));
      })

      test('image size is 0', () => {
        expect.assertions(1)
        const images = [...supplimental_arguments.images];
        // @ts-ignore
        images[0].alternates[0].size = 0;
        // @ts-ignore
        images[0].alternates[0].contentType = 'image/png';
        return expect(createCommission({...required_arguments, ...supplimental_arguments, images})).rejects.toEqual(makeError('user', 'Unable to read image file'));
      })
    })

    test('minio fail to store invoice', () => {
      const file_spy = jest.spyOn(MinioTools, 'store_file');
      file_spy.mockRejectedValueOnce(new Error());
      expect.assertions(1);
      return expect(createCommission(required_arguments)).rejects.toEqual(makeError('server', 'Could not store invoice'));
    })
  })

  describe('complete commission', () => {
    beforeEach(() => {
      small_image.contentType = 'image/png';
      small_image.size = 351
      large_image.contentType = 'image/png';
      large_image.size = 837
      // @ts-ignore
      supplimental_arguments.images[0].alternates = [];
      // @ts-ignore
      supplimental_arguments.images[0].alternates.push(small_image);
    })

    test('valid', () => {
      const p_spy = jest.spyOn(prisma.commission, 'update');
      const file_spy = jest.spyOn(MinioTools, 'store_file');
      const stream_spy = jest.spyOn(MinioTools, 'store_stream');
      expect.assertions(1);
      p_spy.mockResolvedValueOnce(mock_comm_all);
      file_spy.mockResolvedValue('identifier')
      stream_spy.mockResolvedValue('identifier')
    
      return expect(completeCommission(1, supplimental_arguments)).resolves.toEqual(mock_comm_all);
    })

    test('vaild - computed thumbnail', () => {
      const p_spy = jest.spyOn(prisma.commission, 'update');
      const file_spy = jest.spyOn(MinioTools, 'store_file');
      const stream_spy = jest.spyOn(MinioTools, 'store_stream');
      expect.assertions(1);
      p_spy.mockResolvedValueOnce(mock_comm_all);
      file_spy.mockResolvedValue('identifier')
      stream_spy.mockResolvedValue('identifier')
      // @ts-ignore
      supplimental_arguments.images[0].alternates = [];
      // @ts-ignore
      supplimental_arguments.images[0].alternates.push(large_image);

      return expect(completeCommission(1, supplimental_arguments)).resolves.toEqual(mock_comm_all);
    })

    test('invalid ID', () => {
      expect.assertions(1);
      return expect(completeCommission(NaN, supplimental_arguments)).rejects.toEqual(makeError('user', 'Invalid ID provided'));
    })

    test('no images', () => {
      expect.assertions(1);
      return expect(completeCommission(1, {...supplimental_arguments, images: []})).rejects.toEqual(makeError('user', 'Must provide images for completeCommission'));
    })

    test('no thumbnail', () => {
      expect.assertions(1);
      return expect(completeCommission(1, {...supplimental_arguments, images: []})).rejects.toEqual(makeError('user', 'Must provide images for completeCommission'));
    })

    test('could not find commission', () => {
      const p_spy = jest.spyOn(prisma.commission, 'update');
      const file_spy = jest.spyOn(MinioTools, 'store_file');
      const stream_spy = jest.spyOn(MinioTools, 'store_stream');
      expect.assertions(1);
      p_spy.mockRejectedValueOnce(new PrismaClientKnownRequestError('', 'P2001', ''));
      file_spy.mockResolvedValue('identifier')
      stream_spy.mockResolvedValue('identifier')

      return expect(completeCommission(1, supplimental_arguments)).rejects.toEqual(makeError('user', 'Could not find commission to complete'));
    })

    test('prisma error', () => {
      const p_spy = jest.spyOn(prisma.commission, 'update');
      const file_spy = jest.spyOn(MinioTools, 'store_file');
      const stream_spy = jest.spyOn(MinioTools, 'store_stream');
      expect.assertions(1);
      p_spy.mockRejectedValueOnce(new Error());
      file_spy.mockResolvedValue('identifier')
      stream_spy.mockResolvedValue('identifier')

      return expect(completeCommission(1, supplimental_arguments)).rejects.toEqual(makeError('server'));
    })
  })

  describe('delete commission', () => {
    test('valid', () => {
      // @ts-ignore
      jest.spyOn(prisma.commission, 'delete').mockResolvedValueOnce({...mock_comm_all, invoice: {id: 1, bucketId: 'test', size: 0, filename: 'test'}});
      jest.spyOn(MinioTools, 'delete_files').mockResolvedValue();
      expect.assertions(1);
      return expect(deleteCommission(1)).resolves.toBeFalsy();
    })

    test('invalid ID', () => {
      expect.assertions(1);
      return expect(deleteCommission(NaN)).rejects.toEqual(makeError('user', 'Invalid ID provided'));
    })

    test('could not find commission', () => {
      jest.spyOn(prisma.commission, 'delete').mockRejectedValueOnce(new PrismaClientKnownRequestError('', 'P2001', ''));
      expect.assertions(1);
      return expect(deleteCommission(1)).rejects.toEqual(makeError('user', 'Could not find commission to delete'));
    })

    test('prisma error', () => {
      jest.spyOn(prisma.commission, 'delete').mockRejectedValueOnce(new Error());
      expect.assertions(1);
      return expect(deleteCommission(1)).rejects.toEqual(makeError('server'));
    })

    test('minio error', () => {
      jest.spyOn(prisma.commission, 'delete').mockRejectedValueOnce(new Error());
      jest.spyOn(MinioTools, 'delete_files').mockRejectedValueOnce(new Error());
      expect.assertions(1);
      return expect(deleteCommission(1)).rejects.toEqual(makeError('server'));
    })
  })

  describe('get commission', () => {
    test('valid', () => {
      jest.spyOn(prisma.commission, 'findUnique').mockResolvedValue(mock_comm_all);
      expect.assertions(1);
      return expect(getCommission(1)).resolves.toEqual(mock_comm_all);
    })
    
    test('invalid ID', () => {
      expect.assertions(1);
      return expect(getCommission(NaN)).rejects.toEqual(makeError('user', 'Invalid ID provided'));
    })

    test('could not find commission', () => {
      jest.spyOn(prisma.commission, 'findUnique').mockRejectedValueOnce(new PrismaClientKnownRequestError('', 'P2001', ''));
      expect.assertions(1);
      return expect(getCommission(1)).rejects.toEqual(makeError('user', 'Could not find commission'));
    })

    test('prisma error', () => {
      jest.spyOn(prisma.commission, 'findUnique').mockRejectedValueOnce(new Error());
      expect.assertions(1);
      return expect(getCommission(1)).rejects.toEqual(makeError('server'));
    })
  })

  describe('get commissions', () => {
    test('valid', () => {
      jest.spyOn(prisma.commission, 'findMany').mockResolvedValue([mock_comm_all]);
      expect.assertions(1);
      return expect(getCommissions()).resolves.toEqual([mock_comm_all]);
    })

    test('prisma error', () => {
      jest.spyOn(prisma.commission, 'findMany').mockRejectedValueOnce(new Error());
      expect.assertions(1);
      return expect(getCommissions()).rejects.toEqual(makeError('server'));
    })
  })

  describe('update commission', () => {
    test('valid', () => {
      jest.spyOn(prisma.commission, 'update').mockResolvedValue(mock_comm_all);
      expect.assertions(1);
      return expect(updateCommission(1, supplimental_arguments)).resolves.toEqual(mock_comm_all);
    })
    
    test('invalid ID', () => {
      expect.assertions(1)
      return expect(updateCommission(NaN, supplimental_arguments)).rejects.toEqual(makeError('user', 'Invalid ID provided'));
    })

    test('no provided arguments', () => {
      expect.assertions(1)
      return expect(updateCommission(1, {...supplimental_arguments, title: undefined, description: undefined, nsfw: undefined, images: undefined, thumbnailLabel: undefined})).rejects.toEqual(makeError('user', 'Must provide at least one field to edit'));
    })

    test('could not find commission', () => {
      jest.spyOn(prisma.commission, 'update').mockRejectedValueOnce(new PrismaClientKnownRequestError('', 'P2001', ''));
      expect.assertions(1);
      return expect(updateCommission(1, supplimental_arguments)).rejects.toEqual(makeError('user', 'Could not find commission to update'));
    })

    test('prisma error', () => {
      jest.spyOn(prisma.commission, 'update').mockRejectedValueOnce(new Error());
      expect.assertions(1);
      return expect(updateCommission(1, supplimental_arguments)).rejects.toEqual(makeError('server'));
    })
  })
})
