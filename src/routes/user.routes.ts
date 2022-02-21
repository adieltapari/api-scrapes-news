import { Router } from 'express';
import passport from 'passport';
import uploadImages from '../middlewares/awsStorageImage';
import tokenDecoded from '../middlewares/tokenDecoded';
const router = Router();

import {
  login,
  signIn,
  update,
  userId,
  listUsers,
  deleteUser,
  updateImage,
  listUsersRole,
  resetPassword,
} from '../controllers/user.controller';

router.post('/user/create', signIn);
router.post('/user/login', login);
router.put('/user/update', passport.authenticate('jwt', { session: false }), update);
router.put('/user/updateImage', passport.authenticate('jwt', { session: false }), uploadImages, updateImage);
router.get('/user/findUser', passport.authenticate('jwt', { session: false }), userId);
router.get('/user/listUsers', passport.authenticate('jwt', { session: false }), listUsers);
router.get('/user/listUsersRole', listUsersRole);
router.post('/user/resetPassword', tokenDecoded, resetPassword);
// this route not using now because its not finish
router.delete('/user/delete', passport.authenticate('jwt', { session: false }), deleteUser);

export default router;
