/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcryptjs from 'bcryptjs';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { LoginResponse } from './interfaces/login-response';
import { JwtPayload } from './interfaces/payload-jwt';
import { CreateUserDto, LoginDto, RegisterUserDto, UpdateAuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { password, ...userData } = createUserDto;

      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10), //*encriptando pass
        ...userData,
      });

      await newUser.save();
      const { password: _, ...user } = newUser.toJSON();

      // 3. Generar el JWT
      return user;
    } catch (error) {
      console.log({ error });
      if (error.code === 11000) {
        throw new BadRequestException(`${createUserDto.email} already exist`);
      }
      throw new InternalServerErrorException('Something terrible happened');
    }
  }

  async register(registerUserDto: RegisterUserDto): Promise<LoginResponse> {
    const user = await this.create(registerUserDto);

    return {
      user: user,
      token: await this.getJwtToken({ id: user._id }),
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    console.log({ loginDto });
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Not valid credentials -  email');
    }

    if (!bcryptjs.compare(password, user.password)) {
      throw new UnauthorizedException('Not valid credentials -  password');
    }

    const { password: _, ...rest } = user.toJSON();

    return {
      user: rest,
      token: await this.getJwtToken({ id: user.id }),
    };
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  async getJwtToken(payload: JwtPayload) {
    const token = await this.jwtService.signAsync(payload);
    return token;
  }
}
