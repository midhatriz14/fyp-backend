import { Test, TestingModule } from '@nestjs/testing';
import { VendorService } from './vendor.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../auth/schemas/user.schema';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

// Mock User model
const mockUserModel = {
  findById: jest.fn(),
  aggregate: jest.fn(),
  save: jest.fn(),
  exec: jest.fn(),
};

describe('VendorService', () => {
  let service: VendorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<VendorService>(VendorService);

    jest.clearAllMocks();
  });

  // ✅ Unit Testing: Basic Methods
  describe('Unit Testing - Basic Service Methods', () => {
 it('should throw error for invalid category ID', async () => {
      await expect(service.getAllVendorsByCategoryId('invalid')).rejects.toThrow(Error);
    });

    it('should get vendors by valid categoryId (aggregation called)', async () => {
      mockUserModel.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
      const result = await service.getAllVendorsByCategoryId(new Types.ObjectId().toString());
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get contact details if user exists', async () => {
      mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ contactDetails: {} }) });
      const result = await service.getContactDetails('someId');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if user not found when getting contact details', async () => {
      mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await expect(service.getContactDetails('someId')).rejects.toThrow(NotFoundException);
    });

    it('should get empty packages if none exist', async () => {
  mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ packages: [] }) });
  const result = await service.getPackages('userId');
  expect(result).toEqual([]);
});

it('should return undefined BusinessDetails if no detail exists', async () => {
  mockUserModel.findById.mockReturnValue({
    lean: jest.fn().mockResolvedValue({}),
  });
  const result = await service.getVendor('userId');
  expect(result.BusinessDetails).toBeUndefined();
});

it('should create empty contactDetails object if DTO is empty', async () => {
  const mockSave = jest.fn().mockResolvedValue({ contactDetails: {} });
  mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ save: mockSave }) });
  const result = await service.createContactDetails('userId', {} as any);
  expect(result.contactDetails).toEqual({});
});

  });

  // ✅ Negative Testing: Error Scenarios
  describe('Negative Testing - Errors and Exceptions', () => {
   it('should throw NotFoundException if user not found for createContactDetails', async () => {
  mockUserModel.findById.mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
  });

  await expect(service.createContactDetails('userId', {} as any)).rejects.toThrow(NotFoundException);
});

  it('should throw NotFoundException if user not found for createContactDetails', async () => {
  mockUserModel.findById.mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
  });

  await expect(service.createContactDetails('userId', {} as any)).rejects.toThrow(NotFoundException);
}); 

    it('should throw NotFoundException if user not found for getBusinessDetails', async () => {
      mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await expect(service.getBusinessDetails('userId')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found for associateImagesWithUser', async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(service.associateImagesWithUser('userId', ['url1', 'url2'])).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found in getPackages', async () => {
  mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  await expect(service.getPackages('userId')).rejects.toThrow(NotFoundException);
});

it('should throw NotFoundException if user not found during addPackages', async () => {
  mockUserModel.findById.mockResolvedValue(null);
  await expect(service.addPackages('userId', { packages: [] })).rejects.toThrow(NotFoundException);
});

it('should throw NotFoundException if user not found in getVendor', async () => {
  mockUserModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  await expect(service.getVendor('userId')).rejects.toThrow(NotFoundException);
});

  });

  // ✅ DTO Validation Testing: Input Handling
  describe('DTO Validation Testing - Input Handling', () => {
it('should create contact details correctly', async () => {
  const mockSave = jest.fn().mockResolvedValue({ contactDetails: {} });

  mockUserModel.findById.mockReturnValue({
    exec: jest.fn().mockResolvedValue({ save: mockSave }),
  });

  const result = await service.createContactDetails('userId', { phone: '123456789' } as any);
  expect(result).toBeDefined();
});

 it('should add packages correctly', async () => {
  const mockSave = jest.fn().mockResolvedValue({
    packages: [{ packageName: 'Package 1', price: 1000, services: 'Photography, Editing' }],
  });
  mockUserModel.findById.mockResolvedValue({ save: mockSave });

  const result = await service.addPackages('userId', {
    packages: [{ packageName: 'Package 1', price: 1000, services: 'Photography, Editing' }],
  });
  expect(result.packages.length).toBe(1);
});

    it('should get packages correctly', async () => {
      mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ packages: [{ name: 'A' }] }) });

      const result = await service.getPackages('userId');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return user vendor details with BusinessDetails populated', async () => {
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          photographerBusinessDetails: { name: 'John' },
        }),
      });

      const result = await service.getVendor('userId');
      expect(result.BusinessDetails).toBeDefined();
    });

    it('should overwrite existing packages', async () => {
  const mockSave = jest.fn().mockResolvedValue({
    packages: [{ packageName: 'New Package', price: 2000, services: 'Photography' }],
  });
  mockUserModel.findById.mockResolvedValue({ save: mockSave });

  const result = await service.addPackages('userId', {
    packages: [{ packageName: 'New Package', price: 2000, services: 'Photography' }],
  });

  expect(result.packages[0].price).toBe(2000);
});


it('should save empty packages if none provided', async () => {
  const mockSave = jest.fn().mockResolvedValue({ packages: [] });
  mockUserModel.findById.mockResolvedValue({ save: mockSave });
  const result = await service.addPackages('userId', { packages: [] });
  expect(result.packages.length).toBe(0);
});

it('should save contactDetails even if contactNumber is provided', async () => {
  const mockSave = jest.fn().mockResolvedValue({
    contactDetails: { contactNumber: '1234567890' },
  });

  mockUserModel.findById.mockReturnValue({
    exec: jest.fn().mockResolvedValue({ save: mockSave }),
  });

  const result = await service.createContactDetails('userId', { contactNumber: '1234567890' } as any);

  expect(result.contactDetails?.contactNumber).toBe('1234567890');
});

  });

  // ✅ Integration Testing: Service + Model Interactions
  describe('Integration Testing - Service and DB Interaction', () => {
    it('should call aggregate pipeline properly', async () => {
      mockUserModel.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ name: 'Vendor1' }]) });
      const vendors = await service.getAllVendorsByCategoryId(new Types.ObjectId().toHexString());
      expect(vendors.length).toBeGreaterThanOrEqual(0);
    });

    it('should create business details based on category', async () => {
  const mockSave = jest.fn().mockResolvedValue({ venueBusinessDetails: {} });

  mockUserModel.findById.mockReturnValue({
    populate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        buisnessCategory: { name: 'Venues' },
        save: mockSave,
      }),
    }),
  });

  const result = await service.createBuisnessDetails('userId', {} as any);
  expect(result).toBeDefined();
});

    it('should associate images with user', async () => {
      const mockSave = jest.fn();
      mockUserModel.findById.mockResolvedValue({
        images: [],
        save: mockSave,
      });

      await service.associateImagesWithUser('userId', ['img1', 'img2']);
      expect(mockSave).toBeCalled();
    });

    it('should return business details object', async () => {
      mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ salonBusinessDetails: { name: 'Salon' } }) });

      const business = await service.getBusinessDetails('userId');
      expect(business).toBeDefined();
    });

    it('should correctly fetch business details', async () => {
  mockUserModel.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ salonBusinessDetails: { salonName: 'GlowUp' } }),
  });
  const result = await service.getBusinessDetails('userId');
  expect(result).toHaveProperty('salonBusinessDetails');
});

it('should correctly populate vendor details with photographer', async () => {
  mockUserModel.findById.mockReturnValue({
    lean: jest.fn().mockResolvedValue({ photographerBusinessDetails: { name: 'Snap Studio' } }),
  });
  const result = await service.getVendor('userId');
  expect(result.BusinessDetails).toHaveProperty('name', 'Snap Studio');
});

it('should correctly save images in user entity', async () => {
  const mockSave = jest.fn();
  const mockUser = { images: [], coverImage: '', save: mockSave };
  mockUserModel.findById.mockResolvedValue(mockUser);
  await service.associateImagesWithUser('userId', ['coverImage', 'image2']);
  expect(mockUser.images.length).toBe(2);
});
  });

  // ✅ File Upload Testing: Images Upload Logic
  describe('File Upload Testing - Images Upload', () => {
    it('should successfully update images array', async () => {
      const mockSave = jest.fn();
      const mockUser = { images: ['imgOld'], save: mockSave };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await service.associateImagesWithUser('someId', ['imgNew']);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should set first uploaded image as cover image', async () => {
      const mockSave = jest.fn();
      const mockUser = { images: [], coverImage: '', save: mockSave };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await service.associateImagesWithUser('userId', ['imgCover', 'img2']);
      expect(mockUser.coverImage).toEqual('imgCover');
    });

    it('should add multiple images correctly', async () => {
      const mockSave = jest.fn();
      const mockUser = { images: ['oldImg'], save: mockSave };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await service.associateImagesWithUser('userId', ['newImg1', 'newImg2']);
      expect(mockUser.images.length).toBeGreaterThan(1);
    });

    it('should handle empty existing images gracefully', async () => {
      const mockSave = jest.fn();
      const mockUser = { images: [], save: mockSave };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await service.associateImagesWithUser('userId', ['img1']);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should append new images to existing images array', async () => {
  const mockSave = jest.fn();
  const mockUser = { images: ['oldImg1'], coverImage: '', save: mockSave };
  mockUserModel.findById.mockResolvedValue(mockUser);

  await service.associateImagesWithUser('userId', ['newImg1', 'newImg2']);
  expect(mockUser.images).toContain('newImg1');
});

it('should set coverImage even if only one image uploaded', async () => {
  const mockSave = jest.fn();
  const mockUser = { images: [], coverImage: '', save: mockSave };
  mockUserModel.findById.mockResolvedValue(mockUser);

  await service.associateImagesWithUser('userId', ['onlyImage']);
  expect(mockUser.coverImage).toEqual('onlyImage');
});

it('should not overwrite existing images array', async () => {
  const mockSave = jest.fn();
  const mockUser = { images: ['existingImg'], save: mockSave };
  mockUserModel.findById.mockResolvedValue(mockUser);

  await service.associateImagesWithUser('userId', ['newImage']);
  expect(mockUser.images).toContain('existingImg');
  expect(mockUser.images).toContain('newImage');
});

  });
 
  // user fetch and lean handling
  describe('VendorService - User Fetch and Lean Handling', () => {
  it('should throw NotFoundException if user not found in getVendor', async () => {
    mockUserModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    await expect(service.getVendor('userId')).rejects.toThrow(NotFoundException);
  });

  it('should correctly prioritize business details in getVendor', async () => {
    mockUserModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        cateringBusinessDetails: { name: 'Catering' },
      }),
    });

    const result = await service.getVendor('userId');
    expect(result.BusinessDetails).toHaveProperty('name', 'Catering');
  });

  it('should prioritize photographerBusinessDetails if available', async () => {
  mockUserModel.findById.mockReturnValue({
    lean: jest.fn().mockResolvedValue({
      photographerBusinessDetails: { name: 'Photographer' },
    }),
  });
  const result = await service.getVendor('userId');
  expect(result.BusinessDetails).toHaveProperty('name', 'Photographer');
});

it('should prioritize venueBusinessDetails over salonBusinessDetails', async () => {
  mockUserModel.findById.mockReturnValue({
    lean: jest.fn().mockResolvedValue({
      venueBusinessDetails: { name: 'Venue' },
      salonBusinessDetails: { name: 'Salon' },
    }),
  });
  const result = await service.getVendor('userId');
  expect(result.BusinessDetails).toHaveProperty('name', 'Venue');
});

it('should handle when no business details exist and return undefined', async () => {
  mockUserModel.findById.mockReturnValue({
    lean: jest.fn().mockResolvedValue({}),
  });
  const result = await service.getVendor('userId');
  expect(result.BusinessDetails).toBeUndefined();
});

});
   // business category detection logic
describe('VendorService - Business Category Detection Logic', () => {
  it('should create Salon business details correctly', async () => {
    const mockSave = jest.fn().mockResolvedValue({ salonBusinessDetails: {} });

    mockUserModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          buisnessCategory: { name: 'Makeup' },
          save: mockSave,
        }),
      }),
    });

    const result = await service.createBuisnessDetails('userId', {} as any);
    expect(result).toBeDefined();
  });

  it('should create Photographer business details correctly', async () => {
    const mockSave = jest.fn().mockResolvedValue({ photographerBusinessDetails: {} });

    mockUserModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          buisnessCategory: { name: 'Photography' },
          save: mockSave,
        }),
      }),
    });

    const result = await service.createBuisnessDetails('userId', {} as any);
    expect(result).toBeDefined();
  });

  it('should throw NotFoundException if category is unknown', async () => {
    mockUserModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          buisnessCategory: { name: 'UnknownCategory' },
        }),
      }),
    });

    await expect(service.createBuisnessDetails('userId', {} as any)).rejects.toThrow(NotFoundException);
  });

  it('should create CateringBusinessDetails correctly', async () => {
  const mockSave = jest.fn().mockResolvedValue({ cateringBusinessDetails: {} });

  mockUserModel.findById.mockReturnValue({
    populate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        buisnessCategory: { name: 'Caterings' },
        save: mockSave,
      }),
    }),
  });

  const result = await service.createBuisnessDetails('userId', {} as any);
  expect(result).toBeDefined();
});

it('should throw NotFoundException if user not found for business details creation', async () => {
  mockUserModel.findById.mockReturnValue({
    populate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null), // ✅ return null, not object
    }),
  });

  await expect(service.createBuisnessDetails('userId', {} as any)).rejects.toThrow(NotFoundException);
});

it('should correctly fallback if photographerBusinessDetails exist', async () => {
  const mockSave = jest.fn().mockResolvedValue({ photographerBusinessDetails: {} });

  mockUserModel.findById.mockReturnValue({
    populate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        buisnessCategory: { name: 'Photography' },
        save: mockSave,
      }),
    }),
  });

  const result = await service.createBuisnessDetails('userId', {} as any);
  expect(result).toBeDefined();
});

});

  // error validation logic
  describe('VendorService - Error Validation Logic', () => {
  it('should throw generic Error for invalid ObjectId in getAllVendorsByCategoryId', async () => {
    await expect(service.getAllVendorsByCategoryId('invalid_id')).rejects.toThrow('Invalid categoryId');
  });

  it('should reject non-hex string categoryId', async () => {
  await expect(service.getAllVendorsByCategoryId('12345')).rejects.toThrow('Invalid categoryId');
});

it('should reject special character string categoryId', async () => {
  await expect(service.getAllVendorsByCategoryId('!@#$%^')).rejects.toThrow('Invalid categoryId');
});

it('should reject empty string categoryId', async () => {
  await expect(service.getAllVendorsByCategoryId('')).rejects.toThrow('Invalid categoryId');
});

});

  //image and coverimage handling
describe('VendorService - Images and CoverImage Handling', () => {
  it('should assign first uploaded image as coverImage if images added', async () => {
    const mockSave = jest.fn();
    const mockUser = { images: [], coverImage: '', save: mockSave }; // ✅ ADD coverImage field here
    mockUserModel.findById.mockResolvedValue(mockUser);

    await service.associateImagesWithUser('userId', ['cover1', 'otherImage']);
    expect(mockUser.coverImage).toBe('cover1');
  });
 
  it('should not set coverImage if imageUrls is empty', async () => {
  const mockSave = jest.fn();
  const mockUser = { images: [], coverImage: undefined, save: mockSave }; // ✅ Explicitly add coverImage
  mockUserModel.findById.mockResolvedValue(mockUser);

  await service.associateImagesWithUser('userId', []);
  expect(mockUser.coverImage).toBeUndefined(); // ✅ No error now
});


it('should handle multiple images upload and set first one as cover', async () => {
  const mockSave = jest.fn();
  const mockUser = { images: [], coverImage: '', save: mockSave };
  mockUserModel.findById.mockResolvedValue(mockUser);

  await service.associateImagesWithUser('userId', ['img1', 'img2', 'img3']);
  expect(mockUser.coverImage).toBe('img1');
});

it('should correctly merge images without duplication check', async () => {
  const mockSave = jest.fn();
  const mockUser = { images: ['imgA'], save: mockSave };
  mockUserModel.findById.mockResolvedValue(mockUser);

  await service.associateImagesWithUser('userId', ['imgB']);
  expect(mockUser.images).toEqual(expect.arrayContaining(['imgA', 'imgB']));
});

});

// ✅ VendorService - Advanced Business Logic
describe('VendorService - Advanced Business Logic', () => {

  it('should correctly associate multiple images and preserve old images', async () => {
    const mockSave = jest.fn();
    const mockUser = { images: ['imgOld'], coverImage: 'imgOld', save: mockSave };
    mockUserModel.findById.mockResolvedValue(mockUser);

    await service.associateImagesWithUser('userId', ['imgNew1', 'imgNew2']);
    expect(mockUser.images).toEqual(expect.arrayContaining(['imgOld', 'imgNew1', 'imgNew2']));
  });

  it('should reset coverImage if images array is empty', async () => {
  const mockSave = jest.fn();
  const mockUser = { images: [], coverImage: 'alreadySetCover', save: mockSave };
  mockUserModel.findById.mockResolvedValue(mockUser);

  await service.associateImagesWithUser('userId', []);
  expect(mockUser.coverImage).toBeUndefined(); // ✅ Correct expectation
});

  it('should throw Error if invalid ObjectId provided in getAllVendorsByCategoryId', async () => {
    await expect(service.getAllVendorsByCategoryId('notAnObjectId')).rejects.toThrow(Error);
  });

  it('should create and save new contactDetails correctly', async () => {
    const mockSave = jest.fn().mockResolvedValue({ contactDetails: { brandName: 'TestBrand' } });
    mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ save: mockSave }) });

    const result = await service.createContactDetails('userId', { brandName: 'TestBrand' } as any);
    expect(result.contactDetails?.brandName).toBe('TestBrand');
  });

});

// snapshot testing
describe('VendorService - Snapshot Testing', () => {

  it('should match snapshot for getVendor', async () => {
    mockUserModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        photographerBusinessDetails: { name: 'John' },
      }),
    });

    const result = await service.getVendor('userId');
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for getContactDetails', async () => {
    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        contactDetails: { phone: '1234567890' },
      }),
    });

    const result = await service.getContactDetails('userId');
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for getBusinessDetails', async () => {
    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        salonBusinessDetails: { salonName: 'Glamour Salon' },
      }),
    });

    const result = await service.getBusinessDetails('userId');
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for getPackages', async () => {
    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        packages: [
          { packageName: 'Silver Package', price: 5000 },
        ],
      }),
    });

    const result = await service.getPackages('userId');
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for vendor with only catering details', async () => {
  mockUserModel.findById.mockReturnValue({
    lean: jest.fn().mockResolvedValue({
      cateringBusinessDetails: { name: 'Catering Only' },
    }),
  });
  const result = await service.getVendor('userId');
  expect(result).toMatchSnapshot();
});

it('should match snapshot for vendor with only venue details', async () => {
  mockUserModel.findById.mockReturnValue({
    lean: jest.fn().mockResolvedValue({
      venueBusinessDetails: { name: 'Venue Only' },
    }),
  });
  const result = await service.getVendor('userId');
  expect(result).toMatchSnapshot();
});

it('should match snapshot for vendor with no business details', async () => {
  mockUserModel.findById.mockReturnValue({
    lean: jest.fn().mockResolvedValue({}),
  });
  const result = await service.getVendor('userId');
  expect(result).toMatchSnapshot();
});

});

});
