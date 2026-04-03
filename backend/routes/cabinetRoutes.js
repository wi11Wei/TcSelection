const express = require('express');
const router = express.Router();
const cabinetController = require('../controllers/CabinetController');
const springTrayController = require('../controllers/SpringTrayController');
const drawerTrayController = require('../controllers/DrawerTrayController');

// 柜子相关路由
router.put('/:id', cabinetController.updateCabinet);
router.delete('/:id', cabinetController.deleteCabinet);

// 弹簧柜托盘相关路由
router.get('/:cabinetId/spring-trays', springTrayController.getSpringTraysByCabinetId);
router.put('/:cabinetId/spring-trays/batch', springTrayController.batchUpdateSpringTrays);
router.put('/spring-trays/:id', springTrayController.updateSpringTray);

// 抽屉柜托盘相关路由
router.get('/:cabinetId/drawer-trays', drawerTrayController.getDrawerTraysByCabinetId);
router.post('/:cabinetId/drawer-trays', drawerTrayController.addDrawerTray);
router.put('/drawer-trays/:id', drawerTrayController.updateDrawerTray);
router.delete('/drawer-trays/:id', drawerTrayController.deleteDrawerTray);

// 导出路由
module.exports = router;