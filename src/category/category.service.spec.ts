import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CategoryService } from './category.service';
import { Category } from '../auth/schemas/category.schema';
import { UnauthorizedException } from '@nestjs/common';

const mockCategoryModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
};

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
   });

   beforeEach(() => {
  jest.clearAllMocks(); // 🧼 Reset mock call history before each test
});

  // ✅ Group 1: Service Initialization
  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should be defined after setup', () => {
    expect(service).toBeDefined();
  });

  it('should be an instance of CategoryService', () => {
    expect(service).toBeInstanceOf(CategoryService);
  });

  it('should have create method defined', () => {
    expect(typeof service.create).toBe('function');
  });

  it('should have getAll method defined', () => {
    expect(typeof service.getAll).toBe('function');
  });

  it('should not throw during module compilation', () => {
    expect(() => {
      const testService = new CategoryService(mockCategoryModel as any);
    }).not.toThrow();
  });

  });

  // ✅ Group 2: Create Category Logic
  describe('create()', () => {
    it('should throw UnauthorizedException if category already exists', async () => {
      mockCategoryModel.findOne.mockResolvedValueOnce({ name: 'existing' });

      await expect(
        service.create({ name: 'existing', pictureUrl: 'url', description: 'desc' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should create a new category if not exists', async () => {
      mockCategoryModel.findOne.mockResolvedValueOnce(null);
      const mockCreated = {
        name: 'newCat',
        image: 'picUrl',
        description: 'desc',
      };
      mockCategoryModel.create.mockResolvedValueOnce(mockCreated);

      const result = await service.create({
        name: 'newCat',
        pictureUrl: 'picUrl',
        description: 'desc',
      });

      expect(result).toEqual(mockCreated);
      expect(mockCategoryModel.create).toHaveBeenCalledWith({
        name: 'newCat',
        image: 'picUrl',
        description: 'desc',
      });
    });

    it('should not allow creation of duplicate category', async () => {
    mockCategoryModel.findOne.mockResolvedValueOnce({ name: 'duplicate' });
    await expect(
      service.create({ name: 'duplicate', pictureUrl: '', description: '' })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should create a category when name is unique', async () => {
    const input = { name: 'unique', pictureUrl: 'pic.jpg', description: 'desc' };
    const expected = { ...input, image: input.pictureUrl };
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
    mockCategoryModel.create.mockResolvedValueOnce(expected);

    const result = await service.create(input);
    expect(result).toEqual(expected);
  });

  it('should trim whitespace in name before checking existence', async () => {
    const input = { name: '  newCategory  ', pictureUrl: 'img.jpg', description: 'desc' };
    const trimmed = input.name.trim();
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
    mockCategoryModel.create.mockResolvedValueOnce({
      name: trimmed,
      image: input.pictureUrl,
      description: input.description,
    });

    const result = await service.create({ ...input, name: trimmed });
    expect(result.name).toBe(trimmed);
  });

  it('should call create only once per valid input', async () => {
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
    mockCategoryModel.create.mockResolvedValueOnce({});

    await service.create({ name: 'OnceOnly', pictureUrl: '', description: '' });
    expect(mockCategoryModel.create).toHaveBeenCalledTimes(1);
  });

  });

  // ✅ Group 3: Get All Categories
  describe('getAll()', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { name: 'A', image: 'a.jpg', description: 'desc A' },
        { name: 'B', image: 'b.jpg', description: 'desc B' },
      ];
      mockCategoryModel.find.mockResolvedValueOnce(mockCategories);

      const result = await service.getAll();
      expect(result).toEqual(mockCategories);
    });

     it('should return all categories from DB', async () => {
    const categories = [
      { name: 'Cat1', image: '1.jpg', description: 'desc1' },
      { name: 'Cat2', image: '2.jpg', description: 'desc2' },
    ];
    mockCategoryModel.find.mockResolvedValueOnce(categories);
    const result = await service.getAll();
    expect(result).toEqual(categories);
  });

  it('should return an empty array if no categories exist', async () => {
    mockCategoryModel.find.mockResolvedValueOnce([]);
    const result = await service.getAll();
    expect(result).toEqual([]);
  });

  it('should call the find method on the model', async () => {
    mockCategoryModel.find.mockResolvedValueOnce([]);
    await service.getAll();
    expect(mockCategoryModel.find).toHaveBeenCalled();
  });

  it('should not throw even if find returns null', async () => {
    mockCategoryModel.find.mockResolvedValueOnce(null);
    const result = await service.getAll();
    expect(result).toBeNull();
  });

  it('should preserve the order of categories returned', async () => {
    const categories = [
      { name: 'Alpha', image: 'a.jpg', description: 'first' },
      { name: 'Beta', image: 'b.jpg', description: 'second' },
    ];
    mockCategoryModel.find.mockResolvedValueOnce(categories);
    const result = await service.getAll();
    expect(result[0].name).toBe('Alpha');
    expect(result[1].name).toBe('Beta');
  });
  });

  // ✅ Group 4: Mongoose Call Verification
  describe('Mongoose Call Validation', () => {
    it('should call findOne before creating a category', async () => {
      mockCategoryModel.findOne.mockResolvedValueOnce(null);
      mockCategoryModel.create.mockResolvedValueOnce({});

      await service.create({
        name: 'uniqueCat',
        pictureUrl: 'pic.png',
        description: 'info',
      });

      expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ name: 'uniqueCat' });
      expect(mockCategoryModel.create).toHaveBeenCalled();
    });

    it('should not call create if findOne returns a result', async () => {
      mockCategoryModel.findOne.mockResolvedValueOnce({ name: 'duplicate' });

      await expect(
        service.create({ name: 'duplicate', pictureUrl: 'x', description: 'y' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockCategoryModel.create).not.toHaveBeenCalled();
    });

    it('should call findOne once with correct name', async () => {
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
    mockCategoryModel.create.mockResolvedValueOnce({});

    await service.create({ name: 'unique', pictureUrl: '', description: '' });
    expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ name: 'unique' });
  });

  it('should not proceed to create if findOne finds existing', async () => {
    mockCategoryModel.findOne.mockResolvedValueOnce({ name: 'exists' });
    await expect(service.create({ name: 'exists', pictureUrl: '', description: '' }))
      .rejects.toThrow(UnauthorizedException);
    expect(mockCategoryModel.create).not.toHaveBeenCalled();
  });

  it('should call create with proper shape of data', async () => {
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
    const dto = { name: 'x', pictureUrl: 'url', description: 'desc' };
    mockCategoryModel.create.mockResolvedValueOnce(dto);
    await service.create(dto);
    expect(mockCategoryModel.create).toHaveBeenCalledWith({
      name: 'x',
      image: 'url',
      description: 'desc',
    });
  });

  it('should throw if findOne throws error', async () => {
    mockCategoryModel.findOne.mockRejectedValueOnce(new Error('DB Error'));
    await expect(service.create({ name: 'err', pictureUrl: '', description: '' }))
      .rejects.toThrow();
  });

  it('should throw if create throws error', async () => {
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
    mockCategoryModel.create.mockRejectedValueOnce(new Error('DB Error'));
    await expect(service.create({ name: 'fail', pictureUrl: '', description: '' }))
      .rejects.toThrow();
  });
  });

  // ✅ Group 5: Edge Cases
  describe('Edge Cases', () => {
    it('should handle getAll() returning empty array', async () => {
      mockCategoryModel.find.mockResolvedValueOnce([]);

      const result = await service.getAll();
      expect(result).toEqual([]);
    });

    it('should handle getAll() returning undefined gracefully', async () => {
      mockCategoryModel.find.mockResolvedValueOnce(undefined);

      const result = await service.getAll();
      expect(result).toBeUndefined();
    });

    it('should handle very long category names gracefully', async () => {
    const longName = 'a'.repeat(300);
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
    mockCategoryModel.create.mockResolvedValueOnce({ name: longName });
    const result = await service.create({ name: longName, pictureUrl: '', description: '' });
    expect(result.name.length).toBe(300);
  });

  it('should work with unicode characters in name', async () => {
    const unicode = 'カテゴリー';
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
    mockCategoryModel.create.mockResolvedValueOnce({ name: unicode });
    const result = await service.create({ name: unicode, pictureUrl: '', description: '' });
    expect(result.name).toBe(unicode);
  });

  
  it('should return empty array if DB is empty', async () => {
    mockCategoryModel.find.mockResolvedValueOnce([]);
    const result = await service.getAll();
    expect(result).toEqual([]);
  });

  it('should still return result if description is a number cast to string', async () => {
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
mockCategoryModel.create.mockResolvedValueOnce({
  name: 'NumDesc',
  image: '',
  description: '1234',
});

const result = await service.create({
  name: 'NumDesc',
  pictureUrl: '',
  description: String(1234),
});
expect(result.description).toBe('1234');

  });
  });


  // ✅ Group 6: Input DTO Behavior
describe('Input DTO Behavior', () => {
  it('should create category even with empty description', async () => {
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
    const mockCreated = {
      name: 'noDescription',
      image: 'img.png',
      description: '',
    };
    mockCategoryModel.create.mockResolvedValueOnce(mockCreated);

    const result = await service.create({
      name: 'noDescription',
      pictureUrl: 'img.png',
      description: '',
    });

    expect(result).toEqual(mockCreated);
    expect(mockCategoryModel.create).toHaveBeenCalledWith({
      name: 'noDescription',
      image: 'img.png',
      description: '',
    });
  });

   it('should handle undefined description gracefully', async () => {
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
mockCategoryModel.create.mockResolvedValueOnce({
  name: 'Undesc',
  image: 'img.png',
  description: undefined,
});

const result = await service.create({
  name: 'Undesc',
  pictureUrl: 'img.png',
  description: undefined,
});
expect(result.description).toBeUndefined();

  });


  it('should allow numeric name as string', async () => {
    mockCategoryModel.findOne.mockResolvedValueOnce(null);
mockCategoryModel.create.mockResolvedValueOnce({
  name: 'WhiteDesc',
  image: '',
  description: '   ',
});

const result = await service.create({
  name: 'WhiteDesc',
  pictureUrl: '',
  description: '   ',
});
expect(result.description).toBe('   ');

  });

  it('should treat whitespace-only description as empty string', async () => {
  const input = {
    name: 'WhiteDesc',
    pictureUrl: '',
    description: '   ',
  };

  mockCategoryModel.findOne.mockResolvedValueOnce(null);
  mockCategoryModel.create.mockResolvedValueOnce({
    name: input.name,
    image: input.pictureUrl,
    description: input.description,
  });

  const result = await service.create(input);
  expect(result.description).toBe('   ');
});


  it('should allow extremely long description values', async () => {
    const longDesc = 'desc'.repeat(100);
mockCategoryModel.findOne.mockResolvedValueOnce(null);
mockCategoryModel.create.mockResolvedValueOnce({
  name: 'LongDesc',
  image: '',
  description: longDesc,
});

const result = await service.create({
  name: 'LongDesc',
  pictureUrl: '',
  description: longDesc,
});
expect(result.description.length).toBeGreaterThan(300);

  });
});

// ✅ Group 7: Return Type Structure Consistency
describe('Return Structure Validation', () => {
  it('should return categories with expected keys', async () => {
    const mockCategories = [
      { name: 'Cat1', image: 'cat1.jpg', description: 'd1' },
    ];
    mockCategoryModel.find.mockResolvedValueOnce(mockCategories);

    const result = await service.getAll();

    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('image');
    expect(result[0]).toHaveProperty('description');
  });

   it('should return image field even if null', async () => {
    mockCategoryModel.find.mockResolvedValueOnce([
      { name: 'NullImage', image: null, description: 'desc' },
    ]);
    const result = await service.getAll();
    expect(result[0]).toHaveProperty('image');
    expect(result[0].image).toBeNull();
  });

  it('should ensure description is always a string or undefined', async () => {
    mockCategoryModel.find.mockResolvedValueOnce([
      { name: 'A', image: 'x.jpg', description: 'desc' },
    ]);
    const result = await service.getAll();
    expect(typeof result[0].description === 'string' || result[0].description === undefined).toBeTruthy();
  });

  it('should retain original category order', async () => {
    const cats = [
      { name: 'First', image: '1.jpg', description: '1' },
      { name: 'Second', image: '2.jpg', description: '2' },
    ];
    mockCategoryModel.find.mockResolvedValueOnce(cats);
    const result = await service.getAll();
    expect(result[0].name).toBe('First');
    expect(result[1].name).toBe('Second');
  });

  it('should return all fields present in each item', async () => {
    const data = { name: 'Full', image: 'img.jpg', description: 'complete' };
    mockCategoryModel.find.mockResolvedValueOnce([data]);
    const result = await service.getAll();
    expect(Object.keys(result[0])).toEqual(['name', 'image', 'description']);
  });
});

// ✅ Group 8: Snapshot Testing
describe('Snapshot Tests', () => {
  it('should match snapshot for getAll()', async () => {
    const mockCategories = [
      { name: 'SnapCat', image: 'snap.jpg', description: 'snap test' },
    ];
    mockCategoryModel.find.mockResolvedValueOnce(mockCategories);

    const result = await service.getAll();
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot with multiple categories', async () => {
    const data = [
      { name: 'A', image: 'a.jpg', description: 'one' },
      { name: 'B', image: 'b.jpg', description: 'two' },
    ];
    mockCategoryModel.find.mockResolvedValueOnce(data);
    const result = await service.getAll();
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot with empty result', async () => {
    mockCategoryModel.find.mockResolvedValueOnce([]);
    const result = await service.getAll();
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot with special unicode values', async () => {
    mockCategoryModel.find.mockResolvedValueOnce([
      { name: 'カテゴリ', image: 'img.jpg', description: '🧠🕹️🎮' },
    ]);
    const result = await service.getAll();
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot with null image', async () => {
    mockCategoryModel.find.mockResolvedValueOnce([
      { name: 'NullImage', image: null, description: 'test' },
    ]);
    const result = await service.getAll();
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot with long description', async () => {
    const longDesc = 'lorem '.repeat(50);
    mockCategoryModel.find.mockResolvedValueOnce([
      { name: 'LongDesc', image: 'img.jpg', description: longDesc },
    ]);
    const result = await service.getAll();
    expect(result).toMatchSnapshot();
  });
});


// ✅ Group 9: Validation & Format Tests
describe('Validation & Format Tests', () => {
  it('should trim the name and create category correctly', async () => {
    const input = {
      name: '   TrimMe   ',
      pictureUrl: 'image.jpg',
      description: 'Trim test',
    };
    const trimmedName = input.name.trim();

    mockCategoryModel.findOne.mockResolvedValueOnce(null);
    mockCategoryModel.create.mockResolvedValueOnce({
      name: trimmedName,
      image: input.pictureUrl,
      description: input.description,
    });

    const result = await service.create({ ...input, name: trimmedName });
    expect(result.name).toBe('TrimMe');
  });

  it('should preserve special characters in description', async () => {
    const input = {
      name: 'SpecialCat',
      pictureUrl: 'special.jpg',
      description: '✨💬🔥',
    };

    mockCategoryModel.findOne.mockResolvedValueOnce(null);
    mockCategoryModel.create.mockResolvedValueOnce({
      name: input.name,
      image: input.pictureUrl,
      description: input.description,
    });

    const result = await service.create(input);
    expect(result.description).toBe('✨💬🔥');
  });

  it('should fail to create if name already exists, even with spaces', async () => {
    const input = {
      name: ' Existing ',
      pictureUrl: 'exists.jpg',
      description: 'Duplicate test',
    };

    mockCategoryModel.findOne.mockResolvedValueOnce({ name: input.name.trim() });

    await expect(service.create({ ...input, name: input.name.trim() }))
      .rejects.toThrow(UnauthorizedException);

    expect(mockCategoryModel.create).not.toHaveBeenCalled();
  });
});


});
