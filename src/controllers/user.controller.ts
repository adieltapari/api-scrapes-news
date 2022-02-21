import { Request, Response } from 'express';
import User, { IUser } from '../models/user';
import deleteImage from '../services/delete-files-aws';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';

function createToken(user: IUser) {
  return jwt.sign({ id: user.id, email: user.email }, config.jwrSecret, {
    expiresIn: 86400,
  });
}

export const signIn = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please, Send your email and password',
      });
    }
    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ status: 400, message: 'The user already exist' });
    }

    const newUser = new User(req.body);
    await newUser.save();
    
    const token = createToken(newUser)
    newUser.password = '';
    
    return res.status(201).json({ 
      user: newUser,
      token
    });
  } catch (e) {
    console.log(e.message);

    return res.status(500).json({
      status: 500,
      message: 'Internal error on service in create user',
      errorMessage: e.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 400,
      message: 'Please, Send your email and password',
    });
  }

  let user = await User.findOne({ email }).select({
    _id: 1,
    name: 1,
    role: 1,
    email: 1,
    image: 1,
    state: 1,
    password: 1,
    lastName: 1,
    firstName: 1,
  });

  if (!user) {
    return res.status(400).json({ status: 400, message: 'The user does not exist' });
  }

  const isMath = await user.comparePassword(password);
  
  user.password = '';
  
  if (isMath) {
    return res.status(200).json({
      user,
      status: 200,
      token: createToken(user),
    });
  }

  return res.status(400).json({
    message: 'Please, verify your password',
  });
};

export const update = async (req: Request, res: Response) => {
  const { password, _id } = req.body;

  try {
    let data: any = {};

    const pass = password;

    if (pass !== undefined && pass !== '') {
      const password = await bcrypt.hash(pass, 10);
      data.password = password;
    }

    Object.entries(req.body).forEach(([key, value]) => {
      if (key !== 'password') {
        
        data[key] = value;
      }
    });
    data.updateDate = Date.now();
    data.name = `${req.body.firstName} ${req.body.lastName}`;

    const register = await User.findByIdAndUpdate({ _id }, data);
    res.status(200).json(register);
  } catch (e) {
    console.log(e);
    res.status(500).send({
      message: 'Internal error on service in update user',
      errorMessage: e.message,
    });
  }
};

export const updateImage = async (req: Request, res: Response) => {
  const { _id } = req.query
  // @ts-ignore
  const { imageUrl } = req;

  try {
    const register = await User.findByIdAndUpdate({ _id }, { image: imageUrl }).select({
      _id: 1,
      name: 1,
      role: 1,
      email: 1,
      image: 1,
      state: 1,
      lastName: 1,
      firstName: 1,
    });

    res.status(200).json(register);
  } catch (e) {
    console.log(e);
    res.status(500).send({
      message: 'Internal error on service in update user',
      errorMessage: e.message,
    });
  }
};

export const userId = async (req: Request, res: Response) => {
  const { _id } = req.query;

  try {
    const user = await User.findOne({ _id }).select({
      _id: 1,
      name: 1,
      role: 1,
      email: 1,
      image: 1,
      state: 1,
      lastName: 1,
      firstName: 1,
    });

    if (!user) {
      res.status(404).send({
        message: 'User not found',
      });
    } else {
      res.status(200).json(user);
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: 'Internal error on services listUsersRole',
    });
  }
};

export const listUsersRole = async (req: any, res: any) => {
  const { role } = req.query;

  try {
    const users: IUser[] = await User.find({ role })
      .select({
        _id: 1,
        name: 1,
        role: 1,
        email: 1,
        image: 1,
        state: 1,
        lastName: 1,
        firstName: 1,
      })
      .populate('image')
      .sort({
        name: 1,
      });

    if (!users) {
      res.status(404).send({
        message: 'Not found users',
      });
    } else {
      res.status(200).json(users);
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: 'Internal error on services listUsersRole',
    });
  }
};

export const listUsers = async (req: any, res: any) => {
  try {
    const users: IUser[] = await User.find().sort({
      name: 1,
    });

    res.status(200).json(users);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: 'Internal error on services list users',
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { _id, image } = req.body;

  try {
    const register = await User.findByIdAndDelete({
      _id,
    });

    deleteImage(image, config.awsConfig.USER_BUCKET_FOLDER);

    res.status(200).json(register);
  } catch (e) {
    res.status(500).send({
      message: 'An error occurred in remove affiliate',
    });
  }
};

export const resetPassword = async (req: any, res: any, next: any) => {
  let password;

  try {
    if (req.body.password) {
      password = await bcrypt.hash(req.body.password, 10);
    } else {
      return res.status(500).json({
        message: 'Something went wrong',
      });
    }

    const user = await User.findOneAndUpdate({ _id: req.user.id }, { password }).select({
      _id: 1,
      name: 1,
      role: 1,
      email: 1,
      image: 1,
      state: 1,
      lastName: 1,
      firstName: 1,
    });

    return res.status(200).json({
      user,
      message: 'Password change successfull',
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: 'Something went wrong',
    });
  }
};
