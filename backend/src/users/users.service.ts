import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcryptjs";
import { User, UserDocument, UserRole } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findByInviteToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ inviteToken: token }).exec();
  }

  createInvite(email: string, inviteToken: string): Promise<UserDocument> {
    return this.userModel.create({ email, inviteToken, isActive: false });
  }

  activateUser(
    userId: string,
    name: string,
    hashedPassword: string,
  ): Promise<UserDocument> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { name, password: hashedPassword, isActive: true, inviteToken: null },
        { new: true },
      )
      .exec();
  }

  findManyByIds(ids: string[]) {
    return this.userModel
      .find({ _id: { $in: ids } })
      .select("_id name email")
      .lean()
      .exec();
  }

  findAll() {
    return this.userModel
      .find({ isActive: true })
      .select("_id email name")
      .lean()
      .exec();
  }

  async ensureAdminExists(): Promise<void> {
    const admin = await this.userModel.findOne({ role: UserRole.ADMIN }).exec();
    if (!admin) {
      const hash = await bcrypt.hash("admin123", 10);
      await this.userModel.create({
        email: "admin@taskplatform.com",
        password: hash,
        name: "Admin",
        role: UserRole.ADMIN,
        isActive: true,
      });
      console.log(
        "Seeded default admin — email: admin@taskplatform.com  password: admin123",
      );
    }
  }
}
