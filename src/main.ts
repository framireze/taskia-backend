import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  /*const httpsOptions = {
    key: fs.readFileSync('/home/ec2-user/certs/xertify.key'),
    cert: fs.readFileSync(
      '/home/ec2-user/certs/xertify.crt',
    ),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  */

  const app = await NestFactory.create(AppModule); //in local

  // Habilitar CORS
  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
  });
  
  app.setGlobalPrefix(process.env.ENDPOINT_BASE || '');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      },
      //exceptionFactory: (errors) => new BadRequestException(errors),
    })
  )
  await app.listen(parseInt(process.env.PORT || '3000'));
  console.log(`Application is running on: ${process.env.PORT}`);
}
bootstrap();
