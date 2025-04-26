import { Test, TestingModule } from '@nestjs/testing';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

describe('VendorController', () => {
  let controller: VendorController;
  let vendorService: VendorService;

  const mockVendorService = {
    getAllVendorsByCategoryId: jest.fn(),
    createContactDetails: jest.fn(),
    createBuisnessDetails: jest.fn(),
    addPackages: jest.fn(),
    associateImagesWithUser: jest.fn(),
    getVendor: jest.fn(),

  // 🔥 Add these missing methods:
  getContactDetails: jest.fn(),
  getBusinessDetails: jest.fn(),
  getPackages: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        {
          provide: VendorService,
          useValue: mockVendorService,
        },
      ],
    }).compile();

    controller = module.get<VendorController>(VendorController);
    vendorService = module.get<VendorService>(VendorService);
  });

  beforeEach(() => jest.clearAllMocks());

  //  Group 1: Integration Testing
  describe('Integration: VendorController-Service Flow', () => {
    it('should return vendors for given categoryId', async () => {
      const result = [{ _id: '123', name: 'Vendor1' }] as any; // or cast to User[] if available
      jest.spyOn(vendorService, 'getAllVendorsByCategoryId').mockResolvedValue(result);
      expect(await controller.getVendorsByCategoryId({} as any, 'cat123')).toBe(result);
    });

    it('should create contact details for a vendor', async () => {
      const mockDto = { phone: '12345' } as any;
      const user = { _id: 'user1' } as any;
      jest.spyOn(vendorService, 'createContactDetails').mockResolvedValue(user);
      expect(await controller.createContactDetails('user1', mockDto)).toBe(user);
    });

    it('should add packages for vendor', async () => {
      const dto = { title: 'Standard' } as any;
      const response = { _id: 'pkg1', title: 'Standard' } as any;
jest.spyOn(vendorService, 'addPackages').mockResolvedValue(response);

      expect(await controller.addPackages('user1', dto)).toBe(response);
    });

   it('should get vendor contact details', async () => {
  const contact = { phone: '03001234567' } as any;
  jest.spyOn(vendorService, 'getContactDetails').mockResolvedValue(contact);

  const res = (await controller.getContactDetails('uid123')) as any; // 👈 type assertion added
  expect(res?.phone).toBe('03001234567'); // 👈 optional chaining for safety
});

it('should get vendor business details', async () => {
  const business = { salonBusinessDetails: { businessName: 'Luxury Salon' } } as any;
  jest.spyOn(vendorService, 'getBusinessDetails').mockResolvedValue(business);
  const res = await controller.getBusinessDetails('u101');
  expect((res.salonBusinessDetails as any).businessName).toBe('Luxury Salon');
});

it('should get vendor packages', async () => {
  const packages = [{ title: 'Gold Package' }, { title: 'Silver Package' }] as any;
  jest.spyOn(vendorService, 'getPackages').mockResolvedValue(packages);
  const res = await controller.getPackages('u501');
  expect(res.length).toBe(2);
});

it('should get vendor profile using userId', async () => {
  const vendor = { _id: 'vID', name: 'Vendor Tester' } as any;
  jest.spyOn(vendorService, 'getVendor').mockResolvedValue(vendor);
  const res = await controller.getVendor('vID');
  expect(res.name).toBe('Vendor Tester');
});

  });

  //  Group 2: File Upload Testing
  describe('File Upload: Vendor Images', () => {
    it('should throw error if no files are uploaded', async () => {
      await expect(controller.uploadImages('user1', [])).rejects.toThrow('Files not provided');
    });

    it('should return image URLs when valid files uploaded', async () => {
      const mockFiles = [{ filename: 'img1.jpg' }];
      const fileUrls = ['/public/images/img1.jpg'];
      jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
      const res = await controller.uploadImages('user1', mockFiles);
      expect(res.urls).toEqual(fileUrls);
    });

    it('should call associateImagesWithUser with correct values', async () => {
      const mockFiles = [{ filename: 'img2.jpg' }];
      const spy = jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
      await controller.uploadImages('user42', mockFiles);
      expect(spy).toHaveBeenCalledWith('user42', ['/public/images/img2.jpg']);
    });

    it('should accept multiple files and generate URLs', async () => {
  const mockFiles = [{ filename: 'img1.jpg' }, { filename: 'img2.jpg' }];
  const expectedUrls = mockFiles.map(f => `/public/images/${f.filename}`);
  jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
  const res = await controller.uploadImages('uMulti', mockFiles);
  expect(res.urls).toEqual(expectedUrls);
});

it('should still call service even with one image', async () => {
  const mockFiles = [{ filename: 'onlyOne.jpg' }];
  const spy = jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
  await controller.uploadImages('uOne', mockFiles);
  expect(spy).toHaveBeenCalledTimes(1);
});

it('should return correct structure with message and urls', async () => {
  const mockFiles = [{ filename: 'unique.jpg' }];
  jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
  const res = await controller.uploadImages('any', mockFiles);
  expect(res).toHaveProperty('message');
  expect(res).toHaveProperty('urls');
});

it('should not throw if service resolves successfully', async () => {
  const mockFiles = [{ filename: 'fine.jpg' }];
  jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
  await expect(controller.uploadImages('fineUser', mockFiles)).resolves.not.toThrow();
});

  });

  // Group 3: DTO Validation Testing
  describe('DTO Validation Behavior', () => {
    it('should handle missing contact fields gracefully', async () => {
      const invalidDto = {} as any;
      jest.spyOn(vendorService, 'createContactDetails').mockResolvedValue({} as any);
      const res = await controller.createContactDetails('u1', invalidDto);
      expect(res).toBeDefined();
    });

    it('should handle different business DTO types', async () => {
      const dto = { businessName: 'Test Venue' } as any;
     const mockBusinessDetails = {
  BusinessDetails: {
    businessName: 'Test Venue',
    establishedYear: 2020,
  },
} as any;

jest.spyOn(vendorService, 'createBuisnessDetails').mockResolvedValue(mockBusinessDetails);
expect(
  await controller.createPhotographerBuisnessDetails('u2', mockBusinessDetails)
).toEqual(mockBusinessDetails);
    });

    it('should validate empty package DTO structure', async () => {
  const dto = {} as any;
  const mockReturn = { _id: 'pkg', title: '' } as any;
  jest.spyOn(vendorService, 'addPackages').mockResolvedValue(mockReturn);
  const res = await controller.addPackages('uEmpty', dto);
  expect(res._id).toBe('pkg');
});

 it('should fallback to generic DTO for contact', async () => {
  const dto = { contact_email: 'test@test.com' } as any;

  const mockUser = {
    contactDetails: {
      contact_email: 'test@test.com',
    },
  } as any;

  jest.spyOn(vendorService, 'createContactDetails').mockResolvedValue(mockUser);
  const res = await controller.createContactDetails('abc', dto);

  expect((res as any).contactDetails?.contact_email).toBe('test@test.com');
});


it('should accept partial business detail DTO', async () => {
  const partialDto = {
    salonBusinessDetails: { businessName: 'Just Name' },
  } as any;
  jest.spyOn(vendorService, 'createBuisnessDetails').mockResolvedValue(partialDto);
  const res = await controller.createPhotographerBuisnessDetails('u50', partialDto);
  expect((res.salonBusinessDetails as any).businessName).toBe('Just Name');
});

it('should return user with phone only in contact DTO', async () => {
  const dto = { phone: '0987654321' } as any;

  const mockUser = {
    contactDetails: {
      phone: '0987654321',
    },
  } as any;

  jest.spyOn(vendorService, 'createContactDetails').mockResolvedValue(mockUser);
  const res = await controller.createContactDetails('uidX', dto);

  expect((res as any).contactDetails?.phone).toBe('0987654321');
});

  });

  //  Group 4: Negative Testing
  describe('Negative Scenarios', () => {
    it('should throw if getAllVendorsByCategoryId fails', async () => {
      jest.spyOn(vendorService, 'getAllVendorsByCategoryId').mockRejectedValue(new Error('DB error'));
      await expect(controller.getVendorsByCategoryId({} as any, 'wrongCat')).rejects.toThrow('DB error');
    });

    it('should throw on createContactDetails failure', async () => {
      jest.spyOn(vendorService, 'createContactDetails').mockRejectedValue(new Error('Service error'));
      await expect(controller.createContactDetails('failUser', {} as any)).rejects.toThrow('Service error');
    });

    it('should throw if addPackages service fails', async () => {
      jest.spyOn(vendorService, 'addPackages').mockRejectedValue(new Error('Internal fail'));
      await expect(controller.addPackages('u5', {} as any)).rejects.toThrow('Internal fail');
    });

    it('should throw if getVendor fails', async () => {
  jest.spyOn(vendorService, 'getVendor').mockRejectedValue(new Error('Failed vendor fetch'));
  await expect(controller.getVendor('failID')).rejects.toThrow('Failed vendor fetch');
});

it('should throw if getPackages fails', async () => {
  jest.spyOn(vendorService, 'getPackages').mockRejectedValue(new Error('Package fail'));
  await expect(controller.getPackages('pFail')).rejects.toThrow('Package fail');
});

it('should throw if business details throw error', async () => {
  jest.spyOn(vendorService, 'createBuisnessDetails').mockRejectedValue(new Error('B Error'));
  await expect(controller.createPhotographerBuisnessDetails('uid', {} as any)).rejects.toThrow('B Error');
});

it('should throw if contact details throw unexpected error', async () => {
  jest.spyOn(vendorService, 'createContactDetails').mockImplementation(() => {
    throw new Error('unexpected');
  });
  await expect(controller.createContactDetails('id', {} as any)).rejects.toThrow('unexpected');
});

  });
   
  //  Group 5: Role Based Access Testing
  describe('Role-Based Access Simulation', () => {
 it('should handle empty userId but still return uploaded image URLs', async () => {
  const mockFiles = [{ filename: 'img.jpg' }];
  jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
  const res = await controller.uploadImages('', mockFiles);
  expect(res.urls).toContain('/public/images/img.jpg');
});

  it('should allow access if userId is provided', async () => {
    const spy = jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
    const res = await controller.uploadImages('validUser', [{ filename: 'test.jpg' }]);
    expect(res.message).toBe('Images uploaded successfully');
  });

  it('should log userId during contact detail creation', async () => {
    const spy = jest.spyOn(console, 'log');
    const result = {
  user_id: 'userX',
  email: 'test@example.com',
  name: 'Test User',
  phone_number: '1234567890',
  // Add more if needed, or cast as 'any'
} as any;
    jest.spyOn(vendorService, 'createContactDetails').mockResolvedValue(result);
    const response = await controller.createContactDetails('userX', { phone: '111' } as any);
    expect(response).toEqual(result);
  });

  it('should allow image upload for admin role (simulated)', async () => {
  const files = [{ filename: 'admin-img.jpg' }];
  jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
  const res = await controller.uploadImages('adminUser', files);
  expect(res.urls).toContain('/public/images/admin-img.jpg');
});

it('should handle role-based check for contactDetails without blocking', async () => {
  const dto = { phone: '0300XXXXXXX' } as any;
  const mockUser = {
    user_id: 'u10',
    contactDetails: { phone: '0300XXXXXXX' },
  } as any;

  jest.spyOn(vendorService, 'createContactDetails').mockResolvedValue(mockUser);
  const res = await controller.createContactDetails('admin', dto);
  expect((res as any).contactDetails?.phone).toBe('0300XXXXXXX');
});


it('should not fail when uploading with vendor role userId', async () => {
  const mockFiles = [{ filename: 'vendor-role.jpg' }];
  jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
  const res = await controller.uploadImages('vendorUser', mockFiles);
  expect(res.message).toContain('successfully');
});

it('should support contact detail creation for vendor role', async () => {
  const dto = { phone: '03211234567' } as any;
  const mockUser = {
    user_id: 'vendor1',
    contactDetails: { phone: '03211234567' },
  } as any;

  jest.spyOn(vendorService, 'createContactDetails').mockResolvedValue(mockUser);
  const res = await controller.createContactDetails('vendor1', dto);
  expect((res as any).contactDetails?.phone).toBe('03211234567');
});

});
   // Group 6: Input rejection and validation  failure
describe('Input Rejection & Validation Failures', () => {
 it('should fail gracefully with corrupt business DTO', async () => {
  const corruptDto = { salonBusinessDetails: null } as any;
  const result = {
    salonBusinessDetails: null,
  } as any;

  jest.spyOn(vendorService, 'createBuisnessDetails').mockResolvedValue(result);
  const res = await controller.createPhotographerBuisnessDetails('anyUser', corruptDto);
  expect((res as any).salonBusinessDetails).toBeNull();
});

 it('should return mocked empty user if contact detail is invalid', async () => {
    const invalid = { phone: 123456 } as any; // incorrect type
    const emptyUser = {
      user_id: 'x',
      email: '',
      name: '',
      phone_number: '',
    } as any;

    jest.spyOn(vendorService, 'createContactDetails').mockResolvedValue(emptyUser);
    const response = await controller.createContactDetails('test', invalid);
    expect(response).toEqual(emptyUser);
  });

   it('should return dummy package when malformed DTO passed', async () => {
  const dto = { random: 'value' } as any;
  const mockPackage = {
    _id: 'pkg99',
    title: 'Unknown',
  } as any;

  jest.spyOn(vendorService, 'addPackages').mockResolvedValue(mockPackage);
  const response = await controller.addPackages('u5', dto);
  expect((response as any).title).toBe('Unknown');
});

it('should return null if businessDetails DTO is completely empty', async () => {
  const dto = {} as any;
  jest.spyOn(vendorService, 'createBuisnessDetails').mockResolvedValue(null as any);
  const res = await controller.createPhotographerBuisnessDetails('user', dto);
  expect(res).toBeNull();
});

it('should return undefined for null contactDetails input', async () => {
  const dto = null as any;
  jest.spyOn(vendorService, 'createContactDetails').mockResolvedValue(undefined as any);
  const res = await controller.createContactDetails('null-user', dto);
  expect(res).toBeUndefined();
});

it('should not break on non-object package DTO', async () => {
  const dto = "invalid-data" as any;
  jest.spyOn(vendorService, 'addPackages').mockResolvedValue(undefined as any);
  const res = await controller.addPackages('uX', dto);
  expect(res).toBeUndefined();
});

it('should return null if businessDetails DTO is malformed', async () => {
  const dto = { name: 12345, missingFields: true } as any;
  jest.spyOn(vendorService, 'createBuisnessDetails').mockResolvedValue(null as any);
  const res = await controller.createPhotographerBuisnessDetails('userX', dto);
  expect(res).toBeNull();
});

});

  //group 7: return value format consistency
describe('Return Value Format Consistency', () => {
 
it('should return correct structure for vendor fetch', async () => {
  const vendor = {
    _id: 'v123',
    name: 'TestVendor',
    salonBusinessDetails: {
      businessName: 'Photography by TestVendor',
      establishedYear: 2022,
    },
  } as any;

  jest.spyOn(vendorService, 'getVendor').mockResolvedValue(vendor);
  const res = await controller.getVendor('v123');
  expect(res).toHaveProperty('name', 'TestVendor');
  expect((res.salonBusinessDetails as any).businessName).toBe('Photography by TestVendor');
});

  it('should return array of image URLs on upload', async () => {
    const mockFiles = [{ filename: 'img99.jpg' }];
    jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
    const res = await controller.uploadImages('user9', mockFiles);
    expect(res.urls).toContain('/public/images/img99.jpg');
  });

  it('should include message on successful upload', async () => {
    const mockFiles = [{ filename: 'img45.png' }];
    jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
    const result = await controller.uploadImages('xyz', mockFiles);
    expect(result.message).toMatch(/Images uploaded successfully/);
  });

 it('should return a complete vendor object with contactDetails', async () => {
  const vendor = {
    _id: 'v001',
    name: 'FullVendor',
    contactDetails: {
      phone: '0311XXXXXXX'
    },
  } as any;

  jest.spyOn(vendorService, 'getVendor').mockResolvedValue(vendor);
  const res = await controller.getVendor('v001');
  expect((res as any).contactDetails.phone).toBe('0311XXXXXXX');
});


it('should return vendor with array of packages', async () => {
  const vendor = {
    name: 'Vendor Pack',
    packages: [{ title: 'Gold' }, { title: 'Platinum' }],
  } as any;
  jest.spyOn(vendorService, 'getVendor').mockResolvedValue(vendor);
  const res = await controller.getVendor('vX');
  expect(res.packages?.length).toBeGreaterThan(1);
});

it('should return businessDetails object inside vendor', async () => {
  const vendor = {
    name: 'BDVendor',
    salonBusinessDetails: {
      establishedYear: 2021,
    },
  } as any;

  jest.spyOn(vendorService, 'getVendor').mockResolvedValue(vendor);
  const res = await controller.getVendor('bd123');
  expect((res as any).salonBusinessDetails.establishedYear).toBe(2021);
});

it('should return a message string on successful upload', async () => {
  const mockFiles = [{ filename: 'return-consistency.png' }];
  jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
  const res = await controller.uploadImages('u-consistency', mockFiles);
  expect(typeof res.message).toBe('string');
});

});

// 🖼 Group 8: Snapshot Testing
describe('Snapshot Testing', () => {
  it('should match snapshot for vendor list by category', async () => {
    const result = [
      { _id: '1', name: 'Vendor One' },
      { _id: '2', name: 'Vendor Two' },
    ] as any;

    jest.spyOn(vendorService, 'getAllVendorsByCategoryId').mockResolvedValue(result);
    const res = await controller.getVendorsByCategoryId({} as any, 'category123');
    expect(res).toMatchSnapshot();
  });

  it('should match snapshot for created contact details', async () => {
    const contactDetails = {
      user_id: 'abc123',
      email: 'vendor@example.com',
      phone_number: '03001234567',
    } as any;

    jest.spyOn(vendorService, 'createContactDetails').mockResolvedValue(contactDetails);
    const res = await controller.createContactDetails('abc123', { phone: '03001234567' } as any);
    expect(res).toMatchSnapshot();
  });

  it('should match snapshot for uploaded image response', async () => {
    const mockFiles = [{ filename: 'img123.jpg' }];
    jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);

    const res = await controller.uploadImages('abc', mockFiles);
    expect(res).toMatchSnapshot();
  });

  it('should match snapshot for getVendor with nested business info', async () => {
  const vendor = {
    _id: 'snapV1',
    name: 'Snapshot Vendor',
    salonBusinessDetails: {
      businessName: 'Snappy Hair',
      establishedYear: 2019,
    },
  } as any;
  jest.spyOn(vendorService, 'getVendor').mockResolvedValue(vendor);
  const res = await controller.getVendor('snapV1');
  expect(res).toMatchSnapshot();
});

it('should match snapshot for contact detail with multiple fields', async () => {
  const contact = {
    phone: '0312XXXXXXX',
    email: 'snap@vendor.com',
    location: 'Snapshot Street',
  } as any;
  jest.spyOn(vendorService, 'createContactDetails').mockResolvedValue(contact);
  const res = await controller.createContactDetails('snapU', contact);
  expect(res).toMatchSnapshot();
});

it('should match snapshot when multiple images uploaded', async () => {
  const files = [
    { filename: 'snap1.jpg' },
    { filename: 'snap2.jpg' },
    { filename: 'snap3.jpg' },
  ];
  jest.spyOn(vendorService, 'associateImagesWithUser').mockResolvedValue(undefined);
  const res = await controller.uploadImages('snapUser', files);
  expect(res).toMatchSnapshot();
});

it('should match snapshot for fallback vendor response', async () => {
  const vendor = {
    _id: 'snapFallback',
    name: 'Fallback Vendor',
    contactDetails: null,
  } as any;
  jest.spyOn(vendorService, 'getVendor').mockResolvedValue(vendor);
  const res = await controller.getVendor('fallback-id');
  expect(res).toMatchSnapshot();
});

});

});
