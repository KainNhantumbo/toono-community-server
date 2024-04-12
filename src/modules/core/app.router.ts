import { Router } from 'express';

const router = Router();

router.route('*').all((req, res) => {
  res.status(404).json({
    code: 404,
    status: 'Rota não encontrada.',
    message: 'Rota não encontrada, verifique a url e tente novamente.'
  });
});

export { router as error_route };
