import { Module } from '@nestjs/common';
import { MessagesController, ConversationsController } from './messages.controller';
import { MessagesService } from './messages.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MessagesController, ConversationsController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
