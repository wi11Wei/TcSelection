const express = require('express');
const router = express.Router();
const solutionController = require('../controllers/SolutionController');
const cabinetController = require('../controllers/CabinetController');
const springTrayController = require('../controllers/SpringTrayController');
const drawerTrayController = require('../controllers/DrawerTrayController');

// 方案相关路由
router.get('/', solutionController.getAllSolutions);
router.get('/:id', solutionController.getSolutionById);
router.post('/', solutionController.createSolution);
router.put('/:id', solutionController.updateSolution);
router.delete('/:id', solutionController.deleteSolution);

// 柜子相关路由
router.get('/:solutionId/cabinets', cabinetController.getCabinetsBySolutionId);
router.post('/:solutionId/cabinets', cabinetController.addCabinet);

// 导出路由
module.exports = router;