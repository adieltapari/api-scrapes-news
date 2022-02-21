import { model, Schema, Document } from 'mongoose';
import { ROLE_GUEST } from '../config/roles';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  role: string;
  phone: Number;
  email: string;
  state: boolean;
  updateDate: Date;
  lastName: string;
  firstName: string;
  password: string;
  creationDate: Date;
  image: Array<String>;
  comparePassword: (password: any) => Promise<boolean>;
}

const userSchema = new Schema({
  image: { type: String },
  password: { type: String },
  state: { type: Boolean, default: true },
  name: { type: String, lowercase: true },
  phone: { type: Number, required: false },
  updateDate: { type: Date, default: Date.now },
  creationDate: { type: Date, default: Date.now },
  role: { type: String, required: true, default: ROLE_GUEST },
  lastName: { type: String, lowercase: true, required: true, trim: true },
  firstName: { type: String, lowercase: true, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  committe: { type: String, required: true, default: 'Casa de la Reforma'},
});

userSchema.pre<IUser>('save', async function (next) {
  const user = this;

  if (user.password !== undefined && user.password !== '') {
    // This conditional make hash password user
    if (!user.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);

    const hash = await bcrypt.hash(user.password, salt);

    user.password = hash;
  }

  user.name = `${user.firstName} ${user.lastName}`;

  next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

export default model<IUser>('User', userSchema);
