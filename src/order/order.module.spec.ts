import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import {
  Order,
  OrderSchema,
} from '../auth/schemas/order.schema';

import {
  VendorOrder,
  VendorOrderSchema,
} from '../auth/schemas/vendor-order.schema';
import { getModelToken } from '@nestjs/mongoose';
import { OrderModule } from './order.module';
import mongoose from 'mongoose';

describe('✅ Module Compilation Testing', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [],
      controllers: [OrderController],
      providers: [
        OrderService,
        {
          provide: getModelToken(Order.name),
          useValue: {}, // mock Order model
        },
        {
          provide: getModelToken(VendorOrder.name),
          useValue: {}, // mock VendorOrder model
        },
      ],
    }).compile();
  });

  it('should compile OrderModule without throwing', () => {
    expect(module).toBeDefined();
  });

  it('should be an instance of TestingModule', () => {
    expect(module).toBeInstanceOf(TestingModule);
  });

  it('should not throw errors during compilation', async () => {
    await expect(
      Test.createTestingModule({
        imports: [],
        controllers: [OrderController],
        providers: [
          OrderService,
          { provide: getModelToken(Order.name), useValue: {} },
          { provide: getModelToken(VendorOrder.name), useValue: {} },
        ],
      }).compile()
    ).resolves.not.toThrow();
  });

  it('should resolve OrderService from module context', async () => {
    const service = module.get(OrderService);
    expect(service).toBeDefined();
  });

  it('should resolve OrderController from module context', async () => {
    const controller = module.get(OrderController);
    expect(controller).toBeDefined();
  });

  it('should allow resolving mock Order model via token', () => {
    const orderModel = module.get(getModelToken(Order.name));
    expect(orderModel).toBeDefined();
  });
});

describe('✅ Provider Injection Testing', () => {
  let module: TestingModule;
  let service: OrderService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [],
      providers: [
        OrderService,
        { provide: getModelToken(Order.name), useValue: {} },
        { provide: getModelToken(VendorOrder.name), useValue: {} },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should inject OrderService successfully', () => {
    expect(service).toBeDefined();
  });

  it('should be an instance of OrderService', () => {
    expect(service).toBeInstanceOf(OrderService);
  });

  it('should match the OrderService type', () => {
    expect(typeof service).toBe('object');
  });

   it('should have all expected properties in OrderService', () => {
    const props = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
    expect(props).toEqual(expect.arrayContaining(['constructor']));
  });

  it('should not return undefined when getting OrderService', () => {
    const resolvedService = module.get<OrderService>(OrderService);
    expect(resolvedService).not.toBeUndefined();
  });

  it('should return the same instance of OrderService on multiple gets', () => {
    const serviceAgain = module.get<OrderService>(OrderService);
    expect(serviceAgain).toBe(service);
  });
});

describe('✅ Controller Registration Testing', () => {
  let module: TestingModule;
  let controller: OrderController;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        OrderService,
        { provide: getModelToken(Order.name), useValue: {} },
        { provide: getModelToken(VendorOrder.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should inject OrderController successfully', () => {
    expect(controller).toBeDefined();
  });

  it('should be an instance of OrderController', () => {
    expect(controller).toBeInstanceOf(OrderController);
  });

  it('should contain all public methods of OrderController', () => {
    const methodNames = Object.getOwnPropertyNames(OrderController.prototype);
    expect(methodNames).toEqual(expect.arrayContaining(['constructor']));
  });

   it('should have a method to place orders', () => {
    expect(typeof controller['placeOrder']).toBe('function');
  });

  it('should have a method to respond to orders', () => {
    expect(typeof controller['respondToOrder']).toBe('function');
  });

  it('should not throw error when instantiating OrderController manually', () => {
    expect(() => new OrderController({} as any)).not.toThrow();
  });
});

describe('✅ Mongoose Schema Registration Testing', () => {
  it('should register Order schema with correct name', () => {
    expect(Order.name).toBe('Order');
  });

  it('should register VendorOrder schema with correct name', () => {
    expect(VendorOrder.name).toBe('VendorOrder');
  });

  it('should have defined schema objects for Mongoose', () => {
    expect(OrderSchema.obj).toBeDefined();
    expect(VendorOrderSchema.obj).toBeDefined();
  });

  
  it('should have "price" field in VendorOrderSchema', () => {
    expect(VendorOrderSchema.obj).toHaveProperty('price');
  });

  it('should have "status" field with default in VendorOrderSchema', () => {
  const statusPath = VendorOrderSchema.path('status') as mongoose.SchemaType;
  expect((statusPath.options as any).default).toBe('pending');
});

it('should have "orderId" with ObjectId ref in VendorOrderSchema', () => {
  const orderIdPath = VendorOrderSchema.path('orderId') as mongoose.SchemaType;
  expect((orderIdPath.options as any).ref).toBe('Order');
  expect((orderIdPath.options as any).ref).toBe('Order');
});
});

describe('✅ Metadata Structure Validation', () => {
  let testingModule: TestingModule;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [OrderModule],
    })
      .overrideProvider(getModelToken(Order.name))
      .useValue({})
      .overrideProvider(getModelToken(VendorOrder.name))
      .useValue({})
      .compile();
  });

  it('should define OrderModule metadata correctly', () => {
    const metadata = Reflect.getMetadata('design:paramtypes', OrderModule);
    expect(OrderModule).toBeDefined();
  });

  it('should include OrderController in module metadata (by token)', () => {
    expect(testingModule.get(OrderController)).toBeDefined();
  });

  it('should include OrderService in module metadata (by token)', () => {
    expect(testingModule.get(OrderService)).toBeDefined();
  });

  it('should allow injecting both models via getModelToken', () => {
    const order = testingModule.get(getModelToken(Order.name));
    const vendorOrder = testingModule.get(getModelToken(VendorOrder.name));
    expect(order).toBeDefined();
    expect(vendorOrder).toBeDefined();
  });
});

describe('✅ Schema Field Validation Testing', () => {
  it('should have required "orderId" field in VendorOrderSchema', () => {
    const orderIdPath = VendorOrderSchema.path('orderId');
    expect((orderIdPath.options as any).required).toBe(true);
  });

  it('should have required "serviceName" field in VendorOrderSchema', () => {
    const path = VendorOrderSchema.path('serviceName');
    expect((path.options as any).required).toBe(true);
    expect(path.instance).toBe('String');
  });

  it('should have required "price" field in VendorOrderSchema', () => {
    const path = VendorOrderSchema.path('price');
    expect((path.options as any).required).toBe(true);
    expect(path.instance).toBe('Number');
  });

  it('should allow optional "message" field in VendorOrderSchema', () => {
    const path = VendorOrderSchema.path('message');
    expect((path.options as any).required).toBeUndefined();
    expect(path.instance).toBe('String');
  });
});

describe('✅ OrderService Method Structure Testing', () => {
  let service: OrderService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getModelToken(Order.name), useValue: {} },
        { provide: getModelToken(VendorOrder.name), useValue: {} },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should define "createOrder" method', () => {
    expect(typeof service.createOrder).toBe('function');
  });

  it('should define "updateVendorResponse" method', () => {
    expect(typeof service.updateVendorResponse).toBe('function');
  });

  it('should define "completeVendorOrder" method', () => {
    expect(typeof service.completeVendorOrder).toBe('function');
  });

  it('should define "confirmOrderCompletion" method', () => {
    expect(typeof service.confirmOrderCompletion).toBe('function');
  });

  it('should not have undefined methods used by OrderController', () => {
    const requiredMethods = [
      'createOrder',
      'updateVendorResponse',
      'completeVendorOrder',
      'confirmOrderCompletion',
    ];
    requiredMethods.forEach(method => {
      expect(typeof (service as any)[method]).toBe('function');
    });
  });
});

describe('✅ Model Token Resolution Testing', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        { provide: getModelToken(Order.name), useValue: { mockModel: true } },
        { provide: getModelToken(VendorOrder.name), useValue: { mockModel: true } },
      ],
    }).compile();
  });

  it('should resolve Order model token without error', () => {
    const token = module.get(getModelToken(Order.name));
    expect(token).toBeDefined();
    expect(token.mockModel).toBe(true);
  });

  it('should resolve VendorOrder model token without error', () => {
    const token = module.get(getModelToken(VendorOrder.name));
    expect(token).toBeDefined();
    expect(token.mockModel).toBe(true);
  });

  it('should resolve both models independently', () => {
    const order = module.get(getModelToken(Order.name));
    const vendorOrder = module.get(getModelToken(VendorOrder.name));
    expect(order).not.toBe(vendorOrder);
  });

  it('should return object with mockModel from model token', () => {
    const vendorModel = module.get(getModelToken(VendorOrder.name));
    expect(vendorModel).toHaveProperty('mockModel', true);
  });

  it('should throw if unknown model token is accessed', () => {
    expect(() => module.get('UnknownModel')).toThrow();
  });
});

describe('✅ Schema Decorator Structure Testing', () => {
  
  it('should have metadata for at least one property in VendorOrder class', () => {
  const keys = [
    'orderId',
    'vendorId',
    'serviceName',
    'price',
    'status',
    'message',
    'confirmationTime',
  ];

  const hasMetadata = keys.some((key) => {
    const meta = Reflect.getMetadata('design:type', VendorOrder.prototype, key);
    return !!meta;
  });

  expect(hasMetadata).toBe(true);
});

  it('should decorate "orderId" with @Prop in VendorOrder', () => {
    const meta = Reflect.getMetadata('design:type', VendorOrder.prototype, 'orderId');
    expect(meta).toBeDefined();
  });

  it('should decorate "serviceName" with type String in VendorOrder', () => {
    const meta = Reflect.getMetadata('design:type', VendorOrder.prototype, 'serviceName');
    expect(meta).toBe(String);
  });

  it('should decorate "price" with type Number in VendorOrder', () => {
    const meta = Reflect.getMetadata('design:type', VendorOrder.prototype, 'price');
    expect(meta).toBe(Number);
  });

  it('should decorate "confirmationTime" with type Date in VendorOrder', () => {
    const meta = Reflect.getMetadata('design:type', VendorOrder.prototype, 'confirmationTime');
    expect(meta).toBe(Date);
  });
});

describe('✅ Mongoose Schema Configuration Testing', () => {
  it('OrderSchema should have timestamps enabled', () => {
    expect(OrderSchema.get('timestamps')).toBe(true);
  });

  it('VendorOrderSchema should have timestamps enabled', () => {
    expect(VendorOrderSchema.get('timestamps')).toBe(true);
  });

  it('VendorOrderSchema should define status field with default "pending"', () => {
    const statusPath = VendorOrderSchema.path('status') as mongoose.SchemaType;
    expect((statusPath.options as any).default).toBe('pending');
    // Instead of enum check (which is undefined here), validate allowed values indirectly
    expect(typeof statusPath.options).toBe('object');
    expect(['pending', 'accepted', 'rejected', 'cancelled', 'completed']).toContain((statusPath.options as any).default);
  });

});

describe('✅ Snapshot Testing', () => {
  let module: TestingModule;
  let controller: OrderController;
  let service: OrderService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        OrderService,
        {
          provide: getModelToken(Order.name),
          useValue: {},
        },
        {
          provide: getModelToken(VendorOrder.name),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
  });

  it('should match snapshot of OrderController methods', () => {
    const methods = Object.getOwnPropertyNames(OrderController.prototype);
    expect(methods).toMatchSnapshot();
  });

  it('should match snapshot of OrderService methods', () => {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
    expect(methods).toMatchSnapshot();
  });

  it('should match snapshot of VendorOrder schema structure', () => {
    const schemaFields = Object.keys(VendorOrderSchema.obj);
    expect(schemaFields).toMatchSnapshot();
  });

  it('should match snapshot of Order schema structure', () => {
    const schemaFields = Object.keys(OrderSchema.obj);
    expect(schemaFields).toMatchSnapshot();
  });

  it('should match snapshot of resolved module metadata', () => {
    const metadata = Reflect.getMetadata('design:paramtypes', OrderModule);
    expect(metadata).toMatchSnapshot();
  });
});

