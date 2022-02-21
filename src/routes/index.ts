import routerx from 'express-promise-router';
import userRouter from './user.routes';
import forgotPassword from './forgotPassword.routes';


const router = routerx();

router.use('/api', userRouter);
router.use('/api', forgotPassword);




export default router;
