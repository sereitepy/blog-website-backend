import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { BlogModule } from './blog/blog.module';

@Module({
  imports: [UsersModule, BlogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
