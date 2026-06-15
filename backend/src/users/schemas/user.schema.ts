import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop()
  password: string;

  @Prop()
  name: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  // false until the invited user completes registration
  @Prop({ default: false })
  isActive: boolean;

  // random token emailed to the invitee; cleared after they register
  @Prop()
  inviteToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
