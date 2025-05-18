import { ConfigService } from "@nestjs/config";

export const firebaseConfigProvider = {
  provide: 'FIREBASE_CONFIG',
  useFactory: (configService: ConfigService) => ({
    apiKey: configService.get<string>('apiKey'),
    authDomain: configService.get<string>('authDomain'),
    projectId: configService.get<string>('projectId'),
    storageBucket: configService.get<string>('storageBucket'),
    messagingSenderId: configService.get<string>('messagingSenderId'),
    appId: configService.get<string>('appId'),
    measurementId: configService.get<string>('measurementId'),
  }),
  inject: [ConfigService],
};