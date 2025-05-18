/* eslint-disable prefer-const */
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LRCredential } from './entities/t_credentials.entity';
import { Profile } from './enum/profile.enum';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { StaffStatus } from './enum/status-staff.enum';
import { User } from './entities/t_users.entity';
import { ApiAuthGoogle } from './interfaces/api-auth-google.interface';
import { LogindDto } from './dto/login.dto';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as admin from 'firebase-admin';
import { TokenGoogle } from './interfaces/token-firebase.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private jwtService: JwtService,

    @InjectRepository(LRCredential)
    private lr_credentialRepository: Repository<LRCredential>,

    @InjectRepository(User)
    private lr_userRepository: Repository<User>,
  ) {

  }

  async register(data: CreateUserDto): Promise<any> {
    try {
      let dataResponse;
      let dataUser;

      console.log('Registrando Persona');
      const exitsUser = await this.lr_userRepository.findOne({ where: { email: data.email } });
      if (exitsUser) throw new ConflictException({ success: false, message: `User already exists with email ${data.email}` })
      dataUser = this.lr_userRepository.create({
        user_id: uuidv4(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        documentID: data.documentID,
        document_type: data.documentTypeID,
        status: StaffStatus.ACTIVE,
        iconImage: data.iconImage,
        country_id: data.country_id,
        country: data.country
      })
      console.log('dataUser', dataUser);
      await this.lr_userRepository.save(dataUser)
      dataResponse = {
        user_id: dataUser.user_id
      }


      if (data.password) {
        console.log('data pass', data.profile, data.password, dataResponse.staff_id, dataResponse.user_id);
        await this.createPasswordHashed(data.profile, data.password, dataResponse.staff_id, dataResponse.user_id)
      }

      return { success: true, message: 'OK', data: dataResponse };
    } catch (error) {
      console.log('error', error);
      this.handleException(error);
    }
  }

  async createPasswordHashed(profile: Profile, password: string, staff_id?: string, user_id?: string) {
    try {
      let credential: LRCredential;
      const pass_encrypted = bcrypt.hashSync(password, 10);
      //for Profile.Person
      const existPass = await this.lr_credentialRepository.findOne({ where: { user_id: user_id } })
      if (existPass) throw new ConflictException({ success: false, message: `You already password with user_id: ${user_id}` })
      credential = this.lr_credentialRepository.create({
        user_id: user_id,
        password: pass_encrypted
      })

      await this.lr_credentialRepository.save(credential);

      return { success: true, message: `Credential create successfully` }
    } catch (error) {
      this.handleException(error);
    }
  }

  async login(params: LogindDto) {
    try {
      const { email, password, profile } = params;
      let user: User | null;
      let userCredential: LRCredential | null;
      let payload: JwtPayload;

      //Person final
      user = await this.lr_userRepository.findOne({ where: { email: email } });
      if (!user) throw new NotFoundException({ success: false, message: `Not found any user with email ${email}` });
      if (user.status != StaffStatus.ACTIVE) throw new UnauthorizedException({ success: false, message: `Your account is deactivated. Contact support for more information.` });
      userCredential = await this.lr_credentialRepository.findOne({ where: { user_id: user.user_id } })
      payload = { user_id: user.user_id, email: user.email, firstName: user.firstName, lastName: user.lastName, iconImage: user.iconImage }

      const isPasswordMatching = await bcrypt.compare(password, userCredential?.password);

      if (!isPasswordMatching) throw new UnauthorizedException({ success: false, message: `Wrong password.` });
      console.log('isPasswordMatching', isPasswordMatching, payload);
      const token = this.jwtService.sign(payload);

      return { success: true, message: 'Usuario autenticado', token: token }
    } catch (error) {
      this.handleException(error)
    }
  }

  async loginGoogle(token: string, profile: Profile): Promise<ApiAuthGoogle> {
    try {
      console.log('Token', token);
      let newToken;
      const decodedToken = await admin.auth().verifyIdToken(token) as TokenGoogle;

      // Buscar usuario existente según el perfil
      let existingUser;

      existingUser = await this.lr_userRepository.findOne({ where: { email: decodedToken.email } });


      if (existingUser) {
        if (existingUser.status != StaffStatus.ACTIVE) {
          throw new UnauthorizedException('Your account is deactivated. Contact support for more information.');
        }
        // Generar token según el perfil

        newToken = this.jwtService.sign({
          user_id: existingUser.user_id,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          iconImage: existingUser.iconImage
        });
        return { success: true, message: 'Usuario autenticado', data: newToken };
      }

      // Si no existe, registrar nuevo usuario usando el servicio register
      const firstName = decodedToken.name.split(' ')[0];
      const lastName = decodedToken.name.split(' ')[1];

      const registerData: CreateUserDto = {
        profile: profile,
        firstName: firstName,
        lastName: lastName,
        email: decodedToken.email,
        phone: '',
        iconImage: decodedToken?.picture || '',
        country_id: -1,
        country: '',
        documentTypeID: 0,
        documentID: '',
        password: '' // No se necesita contraseña para login con Google
      };

      const registerResult = await this.register(registerData);

      newToken = this.jwtService.sign({
        user_id: registerResult.data.user_id,
        email: decodedToken.email,
        firstName: firstName,
        lastName: lastName,
        iconImage: decodedToken?.picture
      });
      return { success: true, message: 'Usuario autenticado', data: newToken };

    } catch (error) {
      console.error('Error al validar el token:', error);
      throw new Error('Token de autenticación inválido.');
    }
  }

  async verifyToken(token: string) {  //Servicio debe ser migrado a futuro en una apigateway para ser descentralizado.
    try {
      const decoded = this.jwtService.verify(token);
      return { success: true, message: 'OK' }
    } catch (error) {
      this.handleException(error);
    }
  }

  private handleException(error: Error) {
    this.logger.error(error.message, error.stack);

    if (error instanceof NotFoundException) {
      throw error;
    } else if (error.name === 'QueryFailedError') {
      throw new BadRequestException({ success: false, message: error.message });
    } else if (error instanceof ConflictException) {
      throw new ConflictException({ success: false, message: error.message })
    } else if (error instanceof UnauthorizedException) {
      throw new ConflictException({ success: false, message: error.message })
    } else if (error instanceof JsonWebTokenError) {
      throw new UnauthorizedException({ success: false, message: error.message })
    } else {
      throw new InternalServerErrorException({
        success: false,
        message: 'An error occurred',
      });
    }
  }
}
