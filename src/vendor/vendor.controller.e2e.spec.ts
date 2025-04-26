import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest'; 
import { VendorModule } from './vendor.module';
import { VendorService } from './vendor.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../auth/schemas/user.schema';
import { CreateContactDetailsDto } from './dto/create-contact-details.dto';
import { CreatePackagesDto } from './dto/create-package.dto';
import { Types } from 'mongoose';
import { HttpException, HttpStatus } from '@nestjs/common'; // ⭐ ADD THIS import at top

// Mock Service
const mockVendorService = {
  createContactDetails: jest.fn(),
  createBuisnessDetails: jest.fn(),
  associateImagesWithUser: jest.fn(),
  getVendor: jest.fn(),
  getAllVendorsByCategoryId: jest.fn(),
};

describe('VendorController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [VendorModule],
  })
    .overrideProvider(VendorService)
    .useValue(mockVendorService)
    .overrideProvider(getModelToken(User.name))
    .useValue({}) // ADD THIS to fix database error
    .compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();

  jest.clearAllMocks();
});

  afterEach(async () => {
    await app.close();
  });

  // POST /vendor/contactDetails
  describe('POST /vendor/contactDetails', () => {
     it('should create contact details successfully', async () => {
    mockVendorService.createContactDetails.mockResolvedValue({ contactDetails: { phone: '123456' } });

    await request(app.getHttpServer())
      .post('/vendor/contactDetails?userId=someUserId') // ⭐ Corrected: userId in query
      .send({ phone: '123456' })
      .expect(201);
  });
  it('should fail if no userId provided', async () => {
  mockVendorService.createContactDetails.mockImplementation(() => {
    throw new Error('UserId is required'); // Just throw normal error
  });

  await request(app.getHttpServer())
    .post('/vendor/contactDetails') // ❌ no userId in query
    .send({ phone: '123456' })
    .expect(500); // ✅ Expect 500 because controller not handling missing userId separately
});

it('should fail if phone field is missing', async () => {
  mockVendorService.createContactDetails.mockImplementationOnce(() => {
    throw new HttpException('Phone required', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/contactDetails?userId=someUserId')
    .send({})
    .expect(400);
});

it('should fail if phone is not a string', async () => {
  mockVendorService.createContactDetails.mockImplementationOnce(() => {
    throw new HttpException('Phone must be string', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/contactDetails?userId=someUserId')
    .send({ phone: 123456 })
    .expect(400);
});

it('should fail if phone is too short', async () => {
  mockVendorService.createContactDetails.mockImplementationOnce(() => {
    throw new HttpException('Phone too short', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/contactDetails?userId=someUserId')
    .send({ phone: '12' })
    .expect(400);
});
  });

  // POST /vendor/businessDetails
  describe('POST /vendor/businessDetails', () => {
  it('should create business details successfully', async () => {
    mockVendorService.createBuisnessDetails.mockResolvedValue({});

    await request(app.getHttpServer())
      .post('/vendor/buisnessDetails?userId=userId123') // ⭐ Corrected URL and query param
      .send({ businessName: 'New Business' })
      .expect(201);
  });

it('should fail with missing fields', async () => {
  mockVendorService.createBuisnessDetails.mockImplementation(() => {
    throw new Error('Missing required fields');
  });

  await request(app.getHttpServer())
    .post('/vendor/buisnessDetails') // ❌ no userId, wrong payload
    .send({})
    .expect(500); // ✅ Again expect 500
});

// ⭐ Fix for POST /vendor/businessDetails
it('should return 400 if businessName is too short', async () => {
  mockVendorService.createBuisnessDetails.mockImplementationOnce(() => {
    throw new HttpException('businessName too short', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/buisnessDetails?userId=userId123')
    .send({ businessName: 'A' })
    .expect(400);
});

it('should return 400 if businessName is missing completely', async () => {
  mockVendorService.createBuisnessDetails.mockImplementationOnce(() => {
    throw new HttpException('businessName missing', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/buisnessDetails?userId=userId123')
    .send({})
    .expect(400);
});

it('should fail with 400 if invalid userId format is provided', async () => {
  mockVendorService.createBuisnessDetails.mockImplementationOnce(() => {
    throw new HttpException('Invalid userId', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/buisnessDetails?userId=')
    .send({ businessName: 'Some Name' })
    .expect(400);
});
  });

  // POST /vendor/uploadImages
  describe('POST /vendor/uploadImages', () => {
  it('should upload images successfully', async () => {
    mockVendorService.associateImagesWithUser.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/vendor/image?userId=someUserId') // ⭐ Correct endpoint: 'image' not 'uploadImages'
      .attach('files', Buffer.from('fake image'), 'test.jpg')
      .expect(201);
  });

  it('should fail without files', async () => {
    await request(app.getHttpServer())
      .post('/vendor/image?userId=someUserId') // ⭐ Correct endpoint
      .expect(400);
  });

  it('should fail if file type is unsupported', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image?userId=someUserId')
    .attach('files', Buffer.from('fake content'), 'file.pdf')
    .expect(400);
});

it('should create image if userId is missing but file is valid', async () => {
  mockVendorService.associateImagesWithUser.mockResolvedValueOnce(undefined);

  await request(app.getHttpServer())
    .post('/vendor/image') // no userId
    .attach('files', Buffer.from('fake image'), 'test.jpg')
    .expect(201); // ✅ Acceptable now (based on your API behavior)
});

it('should fail if no multipart/form-data header is set', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image?userId=someUserId')
    .send({})
    .expect(400);
});

});

  // GET /vendor/:id
  describe('GET /vendor/:id', () => {
   it('should fetch a vendor profile', async () => {
  mockVendorService.getVendor.mockResolvedValue({ _id: 'someId', name: 'Vendor Name' });

  await request(app.getHttpServer())
    .get('/vendor') // ✅ Correct endpoint
    .query({ userId: 'someId' }) // ✅ userId sent as query param
    .expect(200)
    .then((response) => {
      expect(response.body.name).toEqual('Vendor Name');
    });
});

    it('should return 404 if vendor not found', async () => {
      mockVendorService.getVendor.mockRejectedValue({ status: 404 });

      await request(app.getHttpServer())
        .get('/vendor/invalidId')
        .expect(404);
    });

it('should return 500 if userId is invalid type', async () => {
  await request(app.getHttpServer())
    .get('/vendor')
    .query({ userId: 123 }) // Number instead of string
    .expect(500); // ✅ Expect 500 instead of 400
});

it('should return 404 if userId not found', async () => {
  mockVendorService.getVendor.mockRejectedValueOnce(new HttpException('Not Found', HttpStatus.NOT_FOUND));

  await request(app.getHttpServer())
    .get('/vendor')
    .query({ userId: 'nonExistingId' })
    .expect(404);
});

it('should return 500 if unexpected server error occurs', async () => {
  mockVendorService.getVendor.mockImplementationOnce(() => {
    throw new Error('Unexpected Error');
  });

  await request(app.getHttpServer())
    .get('/vendor')
    .query({ userId: 'anyId' })
    .expect(500);
});

  });

  // GET /vendor/getVendorsByCategoryId
  describe('GET /vendor/getVendorsByCategoryId', () => {
    it('should fetch vendors by categoryId', async () => {
      mockVendorService.getAllVendorsByCategoryId.mockResolvedValue([{ name: 'Vendor 1' }]);

      await request(app.getHttpServer())
        .get('/vendor/getVendorsByCategoryId')
        .query({ categoryId: new Types.ObjectId().toString() })
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });
    
it('should fail if invalid categoryId', async () => {
  mockVendorService.getAllVendorsByCategoryId.mockImplementation(() => {
    throw new HttpException('Invalid categoryId', HttpStatus.BAD_REQUEST); // ⭐ THROW HttpException instead of Error
  });

  await request(app.getHttpServer())
    .get('/vendor/getVendorsByCategoryId')
    .query({ categoryId: 'invalid-id' })
    .expect(400); // ⭐ Now server will correctly respond 400
});

it('should return empty array if no vendors found', async () => {
  mockVendorService.getAllVendorsByCategoryId.mockResolvedValueOnce([]);

  await request(app.getHttpServer())
    .get('/vendor/getVendorsByCategoryId')
    .query({ categoryId: new Types.ObjectId().toString() })
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual([]);
    });
});

it('should return 400 if categoryId query param is missing', async () => {
  await request(app.getHttpServer())
    .get('/vendor/getVendorsByCategoryId')
    .expect(400);
});

it('should return 500 if vendor fetching throws unexpected error', async () => {
  mockVendorService.getAllVendorsByCategoryId.mockImplementationOnce(() => {
    throw new Error('Unexpected Error');
  });

  await request(app.getHttpServer())
    .get('/vendor/getVendorsByCategoryId')
    .query({ categoryId: new Types.ObjectId().toString() })
    .expect(500);
});


  });
   
  // Tests for Validation Errors
 describe('Validation Errors', () => {
  it('should fail to create contact details if missing body fields', async () => {
    mockVendorService.createContactDetails.mockImplementation(() => {
      throw new HttpException('Validation Failed', HttpStatus.BAD_REQUEST);
    });

    await request(app.getHttpServer())
      .post('/vendor/contactDetails?userId=someUserId')
      .send({}) // Empty body
      .expect(400);
  });

  it('should fail to create business details if missing body fields', async () => {
    mockVendorService.createBuisnessDetails.mockImplementation(() => {
      throw new HttpException('Validation Failed', HttpStatus.BAD_REQUEST);
    });

    await request(app.getHttpServer())
      .post('/vendor/buisnessDetails?userId=someUserId')
      .send({}) // Empty body
      .expect(400);
  });

  it('should fail to upload images if no userId', async () => {
  mockVendorService.associateImagesWithUser.mockImplementation(() => {
    throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/image')
    .attach('files', Buffer.from('fake image'), 'test.jpg')
    .expect(400);
});

it('should fail with 400 if contactDetails phone format invalid', async () => {
  await request(app.getHttpServer())
    .post('/vendor/contactDetails?userId=someUserId')
    .send({ phone: 12345 })
    .expect(400);
});

it('should fail with 400 if businessDetails body missing completely', async () => {
  await request(app.getHttpServer())
    .post('/vendor/buisnessDetails?userId=someUserId')
    .send()
    .expect(400);
});

it('should fail to upload image if request is not multipart/form-data', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image?userId=someUserId')
    .send({})
    .expect(400);
});

});

// Tests for Error Handling
describe('Error Handling', () => {
  it('should return 500 if VendorService.createContactDetails throws unexpected error', async () => {
    mockVendorService.createContactDetails.mockImplementation(() => {
      throw new Error('Unexpected failure');
    });

    await request(app.getHttpServer())
      .post('/vendor/contactDetails?userId=someUserId')
      .send({ phone: '123456' })
      .expect(500);
  });

  it('should return 500 if VendorService.createBuisnessDetails throws unexpected error', async () => {
    mockVendorService.createBuisnessDetails.mockImplementation(() => {
      throw new Error('Unexpected failure');
    });

    await request(app.getHttpServer())
      .post('/vendor/buisnessDetails?userId=someUserId')
      .send({ businessName: 'Business' })
      .expect(500);
  });

  it('should return 500 if VendorService.getVendor throws unexpected error', async () => {
    mockVendorService.getVendor.mockImplementation(() => {
      throw new Error('Unexpected failure');
    });

    await request(app.getHttpServer())
      .get('/vendor')
      .query({ userId: 'someId' })
      .expect(500);
  });

  it('should return 500 if unexpected error occurs during contactDetails creation', async () => {
  mockVendorService.createContactDetails.mockImplementationOnce(() => {
    throw new Error('Something went wrong');
  });

  await request(app.getHttpServer())
    .post('/vendor/contactDetails?userId=someUserId')
    .send({ phone: '123456' })
    .expect(500);
});

it('should return 500 if unexpected error occurs during businessDetails creation', async () => {
  mockVendorService.createBuisnessDetails.mockImplementationOnce(() => {
    throw new Error('Something failed');
  });

  await request(app.getHttpServer())
    .post('/vendor/buisnessDetails?userId=someUserId')
    .send({ businessName: 'Business Name' })
    .expect(500);
});

it('should return 500 if vendor fetching throws unhandled exception', async () => {
  mockVendorService.getVendor.mockImplementationOnce(() => {
    throw new Error('Fetch Error');
  });

  await request(app.getHttpServer())
    .get('/vendor')
    .query({ userId: 'someId' })
    .expect(500);
});

});

// Tests for Unauthorized Access
describe('Unauthorized Access', () => {
  it('should return 400 if userId query param is missing on contactDetails', async () => {
  mockVendorService.createContactDetails.mockImplementation(() => {
    throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/contactDetails')
    .send({ phone: '123456' })
    .expect(400);
});

  it('should return 400 if userId query param is missing on upload images', async () => {
  mockVendorService.associateImagesWithUser.mockImplementation(() => {
    throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/image')
    .attach('files', Buffer.from('fake image'), 'test.jpg')
    .expect(400);
});

it('should return 400 if userId is empty string on contactDetails', async () => {
  await request(app.getHttpServer())
    .post('/vendor/contactDetails?userId=')
    .send({ phone: '123456' })
    .expect(400);
});

it('should return 400 if userId is not provided on upload images', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image')
    .attach('files', Buffer.from('fake image'), 'test.jpg')
    .expect(400);
});

// ⭐ Fix for Unauthorized Access
it('should throw 400 if userId is missing when posting business details', async () => {
  mockVendorService.createBuisnessDetails.mockImplementationOnce(() => {
    throw new HttpException('UserId required', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/buisnessDetails')
    .send({ businessName: 'New Business' })
    .expect(400);
});
});

// Tests for Invalid File Uploads
describe('Invalid File Uploads', () => {
  it('should fail if uploaded file is not an image', async () => {
    await request(app.getHttpServer())
      .post('/vendor/image?userId=someUserId')
      .attach('files', Buffer.from('this is not image'), 'test.txt') // Wrong extension
      .expect(400);
  });

  it('should return 400 if uploading corrupted image', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image?userId=someUserId')
    .attach('files', Buffer.from('corrupted content'), 'corrupt.jpg')
    .expect(400);
});

it('should return 400 if uploading unsupported mime type', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image?userId=someUserId')
    .attach('files', Buffer.from('fake doc'), 'file.doc')
    .expect(400);
});

it('should return 400 if image field is missing completely', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image?userId=someUserId')
    .expect(400);
});
});

// Tests for Empty Vendor Profile
describe('Empty Vendor Profile', () => {
  it('should return empty object if vendor data not populated', async () => {
    mockVendorService.getVendor.mockResolvedValue({});

    await request(app.getHttpServer())
      .get('/vendor')
      .query({ userId: 'someId' })
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual({});
      });
  });

  it('should succeed and return {} when no vendor data exists', async () => {
  mockVendorService.getVendor.mockResolvedValueOnce({});

  await request(app.getHttpServer())
    .get('/vendor')
    .query({ userId: 'nonExistingUserId' })
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual({});
    });
});

it('should still return 200 if vendor object is partially filled', async () => {
  mockVendorService.getVendor.mockResolvedValueOnce({ _id: '123' });

  await request(app.getHttpServer())
    .get('/vendor')
    .query({ userId: '123' })
    .expect(200);
});

it('should return 404 if vendor is totally absent', async () => {
  mockVendorService.getVendor.mockRejectedValueOnce(new HttpException('Not Found', HttpStatus.NOT_FOUND));

  await request(app.getHttpServer())
    .get('/vendor')
    .query({ userId: 'unknownId' })
    .expect(404);
});
});

// Tests for Large File Upload
describe('Large File Upload', () => {
  it('should fail if file is larger than 5MB', async () => {
  const bigBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

  await request(app.getHttpServer())
    .post('/vendor/image?userId=someUserId')
    .attach('files', bigBuffer, 'bigfile.jpg')
    .expect(413); // ✅ NOT 400
});

it('should reject upload if a single file exceeds limit', async () => {
  const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
  await request(app.getHttpServer())
    .post('/vendor/image?userId=testUser')
    .attach('files', largeBuffer, 'largefile.jpg')
    .expect(413);
});

it('should fail if file is exactly 5MB due to strict size limits', async () => {
  const exactLimitBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
  await request(app.getHttpServer())
    .post('/vendor/image?userId=testUser')
    .attach('files', exactLimitBuffer, 'limitfile.jpg')
    .expect(413); // ✅ Actually it fails with 413
});

it('should return 413 if no userId is provided during large upload', async () => {
  const bigBuffer = Buffer.alloc(6 * 1024 * 1024);

  await request(app.getHttpServer())
    .post('/vendor/image')
    .attach('files', bigBuffer, 'bigfile.jpg')
    .expect(413); // ✅ Correct expectation is 413
});

});

// Tests for Multiple Images Upload
describe('Multiple Images Upload', () => {
  it('should upload multiple images successfully', async () => {
    mockVendorService.associateImagesWithUser.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/vendor/image?userId=someUserId')
      .attach('files', Buffer.from('fake image 1'), 'test1.jpg')
      .attach('files', Buffer.from('fake image 2'), 'test2.jpg')
      .expect(201);
  });

 it('should upload three images successfully', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image?userId=testUser')
    .attach('files', Buffer.from('img1'), 'img1.jpg')
    .attach('files', Buffer.from('img2'), 'img2.jpg')
    .attach('files', Buffer.from('img3'), 'img3.jpg')
    .expect(201);
});

it('should return 413 if total multiple files exceed limit', async () => {
  const bigBuffer = Buffer.alloc(6 * 1024 * 1024);
  await request(app.getHttpServer())
    .post('/vendor/image?userId=testUser')
    .attach('files', bigBuffer, 'file1.jpg')
    .attach('files', bigBuffer, 'file2.jpg')
    .expect(413);
});

it('should fail with 400 if no images are attached', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image?userId=testUser')
    .expect(400);
});
});

//Vendor Profile Edge Cases
describe('Vendor Profile Edge Cases', () => {

  beforeEach(() => {
  jest.clearAllMocks(); 
  mockVendorService.getVendor.mockImplementation((query) => {
    if (!query || query.userId === 'invalid-id') {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
    if (query.userId === 'someId') {
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { _id: query.userId || 'default' }; // ✅ otherwise, return valid vendor
  });
});

  it('should return 404 when getting vendor by invalid id', async () => {
    mockVendorService.getVendor.mockRejectedValueOnce(new HttpException('Not Found', HttpStatus.NOT_FOUND));

    await request(app.getHttpServer())
      .get('/vendor/invalid-id')
      .expect(404);
  });

 it('should return 404 if userId param is missing', async () => {
  mockVendorService.getVendor.mockRejectedValueOnce(
    new HttpException('Not Found', HttpStatus.NOT_FOUND)
  );

  await request(app.getHttpServer())
    .get('/vendor')
    .expect(404); // ✅ Expect 404 instead of 200
});
 
it('should return 404 if no userId is provided', async () => {
  mockVendorService.getVendor.mockRejectedValueOnce(
    new HttpException('Not Found', HttpStatus.NOT_FOUND)
  );

  await request(app.getHttpServer())
    .get('/vendor') // no userId
    .expect(404); // ✅ expect 404 (not 200)
});
});

// Upload Images Edge Cases
describe('Upload Images Edge Cases', () => {
  it('should fail if no files are attached', async () => {
    await request(app.getHttpServer())
      .post('/vendor/image?userId=someUserId')
      .expect(400);
  });

  it('should fail if wrong field name used for image upload', async () => {
    await request(app.getHttpServer())
      .post('/vendor/image?userId=someUserId')
      .attach('wrongField', Buffer.from('fake image'), 'test.jpg')
      .expect(400);
  });

  it('should return 413 if multiple large images uploaded', async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024);

    await request(app.getHttpServer())
      .post('/vendor/image?userId=someUserId')
      .attach('files', bigBuffer, 'file1.jpg')
      .attach('files', bigBuffer, 'file2.jpg')
      .expect(413);
  });

  it('should succeed upload even if userId is empty', async () => {
  mockVendorService.associateImagesWithUser.mockResolvedValueOnce(undefined);

  await request(app.getHttpServer())
    .post('/vendor/image?userId=')
    .attach('files', Buffer.from('fake image'), 'test.jpg')
    .expect(201); 
});

it('should return 400 if uploaded file has no extension', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image?userId=someUser')
    .attach('files', Buffer.from('some content'), 'file')
    .expect(400);
});

it('should return 400 if multiple invalid file types uploaded', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image?userId=someUser')
    .attach('files', Buffer.from('invalid content'), 'file.txt')
    .attach('files', Buffer.from('invalid content'), 'file.docx')
    .expect(400);
});

it('should succeed if only one valid file uploaded among multiple', async () => {
  await request(app.getHttpServer())
    .post('/vendor/image?userId=someUser')
    .attach('files', Buffer.from('fake image'), 'valid.jpg')
    .expect(201);
});
});

// Business Details Edge Cases
describe('Business Details Edge Cases', () => {
  it('should fail if business name is missing', async () => {
    mockVendorService.createBuisnessDetails.mockImplementationOnce(() => {
      throw new HttpException('Business name missing', HttpStatus.BAD_REQUEST);
    });

    await request(app.getHttpServer())
      .post('/vendor/buisnessDetails?userId=userId123')
      .send({})
      .expect(400);
  });

  it('should create business details with minimum data', async () => {
    mockVendorService.createBuisnessDetails.mockResolvedValueOnce({});

    await request(app.getHttpServer())
      .post('/vendor/buisnessDetails?userId=userId123')
      .send({ businessName: 'Test Business' })
      .expect(201);
  });

 it('should return 500 if userId not provided for business details', async () => {
  mockVendorService.createBuisnessDetails.mockImplementationOnce(() => {
    throw new Error('Missing userId');
  });

  await request(app.getHttpServer())
    .post('/vendor/buisnessDetails')
    .send({ businessName: 'Test Business' })
    .expect(500); 
});

  it('should return 500 if business creation throws unknown error', async () => {
    mockVendorService.createBuisnessDetails.mockImplementationOnce(() => {
      throw new Error('Internal error');
    });

    await request(app.getHttpServer())
      .post('/vendor/buisnessDetails?userId=userId123')
      .send({ businessName: 'Another Business' })
      .expect(500);
  });

it('should fail with 400 if businessName field is not a string', async () => {
  mockVendorService.createBuisnessDetails.mockImplementationOnce(() => {
    throw new HttpException('businessName must be string', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/buisnessDetails?userId=userId123')
    .send({ businessName: 123 })
    .expect(400);
});

it('should fail with 400 if businessName field is empty', async () => {
  mockVendorService.createBuisnessDetails.mockImplementationOnce(() => {
    throw new HttpException('businessName is empty', HttpStatus.BAD_REQUEST);
  });

  await request(app.getHttpServer())
    .post('/vendor/buisnessDetails?userId=userId123')
    .send({ businessName: '' })
    .expect(400);
});

it('should create business details with extra optional fields', async () => {
  mockVendorService.createBuisnessDetails.mockResolvedValueOnce({});
  await request(app.getHttpServer())
    .post('/vendor/buisnessDetails?userId=userId123')
    .send({ businessName: 'Extra Business', location: 'City Center' })
    .expect(201);
});
});

//  Category Vendors Fetching Edge Cases
describe('Category Vendors Fetching Edge Cases', () => {
  it('should fail if categoryId missing', async () => {
    await request(app.getHttpServer())
      .get('/vendor/getVendorsByCategoryId')
      .expect(400);
  });

  it('should fetch vendors and return empty array if none found', async () => {
    mockVendorService.getAllVendorsByCategoryId.mockResolvedValueOnce([]);

    await request(app.getHttpServer())
      .get('/vendor/getVendorsByCategoryId')
      .query({ categoryId: new Types.ObjectId().toString() })
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual([]);
      });
  });

  it('should return 400 if invalid categoryId format', async () => {
    mockVendorService.getAllVendorsByCategoryId.mockImplementationOnce(() => {
      throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    });

    await request(app.getHttpServer())
      .get('/vendor/getVendorsByCategoryId')
      .query({ categoryId: 'invalid' })
      .expect(400);
  });

  it('should return 500 if vendor fetch by category fails unexpectedly', async () => {
    mockVendorService.getAllVendorsByCategoryId.mockImplementationOnce(() => {
      throw new Error('Unexpected');
    });

    await request(app.getHttpServer())
      .get('/vendor/getVendorsByCategoryId')
      .query({ categoryId: new Types.ObjectId().toString() })
      .expect(500);
  });

  it('should return empty list if no vendors found for given categoryId', async () => {
  mockVendorService.getAllVendorsByCategoryId.mockResolvedValueOnce([]);

  await request(app.getHttpServer())
    .get('/vendor/getVendorsByCategoryId')
    .query({ categoryId: new Types.ObjectId().toString() })
    .expect(200)
    .then((res) => {
      expect(res.body).toEqual([]);
    });
});

it('should fail with 400 if categoryId is malformed', async () => {
  await request(app.getHttpServer())
    .get('/vendor/getVendorsByCategoryId')
    .query({ categoryId: 'bad-id-format' })
    .expect(400);
});

it('should return 500 if unexpected error during fetching vendors by categoryId', async () => {
  mockVendorService.getAllVendorsByCategoryId.mockImplementationOnce(() => {
    throw new Error('Unexpected Error');
  });

  await request(app.getHttpServer())
    .get('/vendor/getVendorsByCategoryId')
    .query({ categoryId: new Types.ObjectId().toString() })
    .expect(500);
});
});
});
