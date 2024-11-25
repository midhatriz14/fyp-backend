import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { User } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger("fyp")
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, password, role, buisnessCategories } = registerDto;
    this.logger.log(registerDto, "Register");
  
    // Ensure businessCategories contains valid ObjectIds
    const categoriesArray = buisnessCategories?.map((id) => {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ObjectId: ${id}`);
      }
      return new Types.ObjectId(id); // Convert to ObjectId if valid
    });

    this.logger.log(categoriesArray, "Transformed Business Categories");

  
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
      buisnessCategories: categoriesArray,
      role: role,
      password: hashedPassword,
    });
  
    this.logger.log(user, "User");
  
    // Generate JWT token
    const token = this.jwtService.sign({ id: user._id });
    return { token };
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
}