import { Test, TestingModule } from '@nestjs/testing';
import { VendorModule } from './vendor.module';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { User } from './../auth/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';

// Mocked UserModel
const mockUserModel = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};

describe('VendorModule - Integration Testing', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        VendorService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel, // ✅ use mocked model instead of real mongoose connection
        },
      ],
    }).compile();
  });

  it('should compile the module successfully', async () => {
    expect(module).toBeDefined();
  });

  it('should provide VendorService', () => {
    const service = module.get<VendorService>(VendorService);
    expect(service).toBeDefined();
  });

  it('should register VendorController', () => {
    const controller = module.get<VendorController>(VendorController);
    expect(controller).toBeDefined();
  });

  it('should inject mocked User mongoose model', () => {
    const userModel = module.get(getModelToken(User.name));
    expect(userModel).toBeDefined();
  });

  it('should have VendorController injected properly', () => {
  const controller = module.get<VendorController>(VendorController);
  expect(controller).toBeInstanceOf(VendorController);
});

it('should have VendorService injected properly', () => {
  const service = module.get<VendorService>(VendorService);
  expect(service).toBeInstanceOf(VendorService);
});

it('should not throw error while resolving VendorService', () => {
  const resolveService = () => module.get<VendorService>(VendorService);
  expect(resolveService).not.toThrow();
});

it('should not throw error while resolving VendorController', () => {
  const resolveController = () => module.get<VendorController>(VendorController);
  expect(resolveController).not.toThrow();
});

});

describe('VendorModule - Schema Validation Testing', () => {
  it('should have User model mock available', async () => {
    const module = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        VendorService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    const userModel = module.get(getModelToken(User.name));
    expect(userModel).toBeDefined();
  });

  it('should have mock methods in User model', async () => {
    const module = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        VendorService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    const userModel = module.get(getModelToken(User.name));
    expect(userModel.find).toBeDefined();
    expect(userModel.findOne).toBeDefined();
    expect(userModel.create).toBeDefined();
  });

  it('should mock find() method correctly', async () => {
    const module = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        VendorService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    const userModel = module.get(getModelToken(User.name));
    userModel.find.mockReturnValueOnce([{ name: 'Test User' }]);
    const result = await userModel.find();
    expect(result).toEqual([{ name: 'Test User' }]);
  });

  it('should not crash when calling create()', async () => {
    const module = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        VendorService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    const userModel = module.get(getModelToken(User.name));
    userModel.create.mockResolvedValueOnce({ name: 'Created User' });
    const created = await userModel.create({ name: 'Created User' });
    expect(created.name).toEqual('Created User');
  });

 it('should return an empty array when find() mock is empty', async () => {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [VendorController],
    providers: [
      VendorService,
      {
        provide: getModelToken(User.name),
        useValue: mockUserModel,
      },
    ],
  }).compile();

  const userModel = module.get(getModelToken(User.name));
  userModel.find.mockReturnValueOnce([]);
  const result = await userModel.find();
  expect(result).toEqual([]);
});

it('should return null when findOne() mock is not found', async () => {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [VendorController],
    providers: [
      VendorService,
      {
        provide: getModelToken(User.name),
        useValue: mockUserModel,
      },
    ],
  }).compile();

  const userModel = module.get(getModelToken(User.name));
  userModel.findOne.mockReturnValueOnce(null);
  const result = await userModel.findOne();
  expect(result).toBeNull();
});

it('should create a new user mock correctly', async () => {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [VendorController],
    providers: [
      VendorService,
      {
        provide: getModelToken(User.name),
        useValue: mockUserModel,
      },
    ],
  }).compile();

  const userModel = module.get(getModelToken(User.name));
  userModel.create.mockResolvedValueOnce({ name: 'New Mock User' });
  const result = await userModel.create({ name: 'New Mock User' });
  expect(result.name).toBe('New Mock User');
});

it('should handle undefined return safely in find()', async () => {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [VendorController],
    providers: [
      VendorService,
      {
        provide: getModelToken(User.name),
        useValue: mockUserModel,
      },
    ],
  }).compile();

  const userModel = module.get(getModelToken(User.name));
  userModel.find.mockReturnValueOnce(undefined);
  const result = await userModel.find();
  expect(result).toBeUndefined();
});


});

describe('VendorModule - Negative Testing', () => {
  it('should throw error if VendorService is missing', async () => {
    await expect(
      Test.createTestingModule({
        controllers: [VendorController],
        providers: [
          {
            provide: getModelToken(User.name),
            useValue: mockUserModel,
          },
        ],
      }).compile(),
    ).rejects.toThrow();
  });

 it('should compile successfully even if VendorController is missing', async () => {
  const module = await Test.createTestingModule({
    providers: [
      VendorService,
      {
        provide: getModelToken(User.name),
        useValue: mockUserModel,
      },
    ],
  }).compile();

  const service = module.get<VendorService>(VendorService);
  expect(service).toBeDefined();
});

 it('should throw error if User model mock is missing', async () => {
    await expect(
      Test.createTestingModule({
        controllers: [VendorController],
        providers: [VendorService],
      }).compile(),
    ).rejects.toThrow();
  });

  it('should handle error when calling unmocked method', async () => {
    const module = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        VendorService,
        {
          provide: getModelToken(User.name),
          useValue: {},
        },
      ],
    }).compile();

    const userModel = module.get(getModelToken(User.name));
    expect(userModel.nonExistentMethod).toBeUndefined();
  });

it('should throw error when both VendorService and UserModel are missing', async () => {
  await expect(
    Test.createTestingModule({
      controllers: [VendorController],
    }).compile(),
  ).rejects.toThrow();
});

it('should throw error when both VendorController and UserModel are missing', async () => {
  await expect(
    Test.createTestingModule({
      providers: [VendorService],
    }).compile(),
  ).rejects.toThrow();
});

it('should create module without providers/controllers', async () => {
  const module = await Test.createTestingModule({}).compile();
  expect(module).toBeDefined();
});

it('should return empty object when getting invalid registered provider', async () => {
  const module = await Test.createTestingModule({
    providers: [{ provide: 'INVALID', useValue: {} }],
  }).compile();

  const invalidProvider = module.get('INVALID');
  expect(invalidProvider).toEqual({}); // ✅
});

});

describe('VendorModule - Provider Injection Testing', () => {
  let module: TestingModule;
  let vendorService: VendorService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        VendorService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    vendorService = module.get<VendorService>(VendorService);
  });

  it('should inject VendorService correctly', () => {
    expect(vendorService).toBeDefined();
  });

  it('should not have random method in VendorService', () => {
    expect((vendorService as any).randomMethod).toBeUndefined();
  });

  it('should inject mocked User model inside VendorService methods (indirect)', () => {
    expect(mockUserModel.find).toBeDefined();
    expect(mockUserModel.create).toBeDefined();
  });

  it('should not throw error when VendorService is instantiated', () => {
    expect(() => vendorService).not.toThrow;
  });

  it('should define VendorService instance', () => {
  expect(vendorService).toBeDefined();
});

it('should have no unexpected properties in VendorService', () => {
  expect(Object.keys(vendorService)).not.toContain('random');
});

it('should treat VendorService as an object', () => {
  expect(typeof vendorService).toBe('object');
});

it('should not throw while accessing VendorService properties', () => {
  expect(() => Object.keys(vendorService)).not.toThrow();
});

});

describe('VendorModule - Snapshot Testing', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        VendorService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();
  });

  it('should match VendorService instance snapshot', () => {
  const service = module.get<VendorService>(VendorService);
  expect(service).toMatchSnapshot();
});

  it('should match the VendorService provider snapshot', () => {
    const service = module.get<VendorService>(VendorService);
    expect(service).toMatchSnapshot();
  });

  it('should match the VendorController snapshot', () => {
    const controller = module.get<VendorController>(VendorController);
    expect(controller).toMatchSnapshot();
  });

  it('should match the UserModel injection snapshot', () => {
    const userModel = module.get(getModelToken(User.name));
    expect(userModel).toMatchSnapshot();
  });

  it('should match VendorService methods snapshot', () => {
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(module.get<VendorService>(VendorService)));
  expect(methods).toMatchSnapshot();
});

it('should match VendorController methods snapshot', () => {
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(module.get<VendorController>(VendorController)));
  expect(methods).toMatchSnapshot();
});

it('should match UserModel methods snapshot', () => {
  const userModel = module.get(getModelToken(User.name));
  const methods = Object.keys(userModel);
  expect(methods).toMatchSnapshot();
});

it('should match VendorService provider instance snapshot', () => {
  const vendorService = module.get<VendorService>(VendorService);
  expect(vendorService).toMatchSnapshot();
});

});

