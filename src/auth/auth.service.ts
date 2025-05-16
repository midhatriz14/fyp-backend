import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { User } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Category } from './schemas/category.schema';
import { UpdateUserProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger("fyp")
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, password, role, buisnessCategories } = registerDto;
    this.logger.log(registerDto, "Register");

    const category = await this.categoryModel.findById(buisnessCategories);
    console.log(category);
    if (!category && role !== "Organizer") {
      throw new NotFoundException('Category doesnt exists')
    }

    // Ensure businessCategories contains valid ObjectIds
    const businessCategory = new Types.ObjectId(buisnessCategories);
    console.log("businessCategory", businessCategory)

    // Check if the user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await this.userModel.create({
      ...registerDto,
      buisnessCategory: category?._id || new Types.ObjectId("682729b2b7d619074bb00135"),
      role: role,
      password: hashedPassword,
      phone_number: registerDto.mobileNumber,
      address: registerDto.address
    });

    // Generate JWT token
    const token = this.jwtService.sign({ id: user._id });
    return { token, user };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const token = this.jwtService.sign({ id: user._id });
    return { token, user };
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const resetToken = this.jwtService.sign(
      { id: user._id },
      { expiresIn: '1h' },
    );

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "0"),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      html: `Click <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">here</a> to reset your password.`,
    });

    return { message: 'Password reset email sent' };
  }

  async validateOAuthUser(profile: any, provider: string) {
    const email = profile.emails[0].value;
    let user = await this.userModel.findOne({ email });

    if (!user) {
      user = await this.userModel.create({
        email,
        provider,
        providerId: profile.id,
        name: profile.displayName,
      });
    }

    const token = this.jwtService.sign({ id: user._id });
    return { token };
  }

  async updateUser(updateDto: UpdateUserProfileDto): Promise<User> {
    console.log(updateDto);
    const updatedUser = await this.userModel.findByIdAndUpdate(updateDto.userId, {
      name: updateDto.name,
      email: updateDto.email,
      address: updateDto.address,
      phone_number: updateDto.phoneNumber
    }, { new: true });
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }
}