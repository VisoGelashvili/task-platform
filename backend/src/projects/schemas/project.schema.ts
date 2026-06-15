import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description: string;

  // The user who created the project
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  // Everyone who can see and work in this project (owner is always included)
  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  members: Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
