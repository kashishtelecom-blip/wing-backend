import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

 async register(registerDto: RegisterDto) {
  const { email, username, password, name } = registerDto;

  const existing = await this.userModel.findOne({
    $or: [{ email }, { username: username.toLowerCase() }],
  });
  if (existing) {
    throw new ConflictException('Email or username already taken');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new this.userModel({
    email,
    username: username.toLowerCase(),
    password: hashedPassword,
    name,
  });
  await user.save();

  const { password: _, ...result } = user.toObject();
  return result;
}
 async login(loginDto: LoginDto) {
  const { email, password } = loginDto;

  const user = await this.userModel.findOne({ email });
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const payload = {
    sub: user._id,
    email: user.email,
    username: user.username,   // ← ADD THIS
    role: user.role,
  };
  return {
    access_token: this.jwtService.sign(payload),
  };
}
}