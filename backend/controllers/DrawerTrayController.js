const { DrawerTray, Cabinet } = require('../models');

// 获取抽屉柜托盘配置
exports.getDrawerTraysByCabinetId = async (req, res) => {
  try {
    const drawerTrays = await DrawerTray.findAll({
      where: { cabinet_id: req.params.cabinetId },
      order: [['tray_index', 'ASC']]
    });

    res.status(200).json(drawerTrays);
  } catch (error) {
    res.status(500).json({ message: '获取抽屉柜托盘配置失败', error: error.message });
  }
};

// 添加抽屉柜托盘配置
exports.addDrawerTray = async (req, res) => {
  try {
    const { channels } = req.body;
    const cabinetId = req.params.cabinetId;

    // 验证参数
    if (!channels || !['1', '2', '3', '4'].includes(channels.toString())) {
      return res.status(400).json({ message: '通道数无效，必须为1、2、3或4' });
    }

    // 验证柜子是否存在且为抽屉柜
    const cabinet = await Cabinet.findByPk(cabinetId);
    if (!cabinet) {
      return res.status(404).json({ message: '柜子不存在' });
    }
    if (cabinet.type !== 'drawer') {
      return res.status(400).json({ message: '该柜子不是抽屉柜' });
    }

    // 检查托盘数量限制
    const trayCount = await DrawerTray.count({ where: { cabinet_id: cabinetId } });
    const maxTrays = cabinet.is_main ? 10 : 15;
    if (trayCount >= maxTrays) {
      return res.status(400).json({ message: `抽屉柜托盘数量不能超过${maxTrays}个` });
    }

    // 检查总通道数限制（仅针对副柜）
    if (!cabinet.is_main) {
      const existingTrays = await DrawerTray.findAll({ where: { cabinet_id: cabinetId } });
      const currentTotalChannels = existingTrays.reduce((sum, tray) => sum + tray.channels, 0);
      const newTotalChannels = currentTotalChannels + parseInt(channels);
      
      if (newTotalChannels > 60) {
        return res.status(400).json({ message: '副柜总通道数不能超过60' });
      }
    }

    // 确定tray_index
    const maxTrayIndex = await DrawerTray.max('tray_index', { where: { cabinet_id: cabinetId } });
    const trayIndex = maxTrayIndex ? maxTrayIndex + 1 : 1;

    // 创建托盘配置
    const drawerTray = await DrawerTray.create({
      cabinet_id: cabinetId,
      tray_index: trayIndex,
      channels: parseInt(channels)
    });

    res.status(201).json({
      message: '抽屉柜托盘添加成功',
      drawerTray
    });
  } catch (error) {
    res.status(500).json({ message: '添加抽屉柜托盘失败', error: error.message });
  }
};

// 更新抽屉柜托盘配置
exports.updateDrawerTray = async (req, res) => {
  try {
    const { channels } = req.body;
    const drawerTray = await DrawerTray.findByPk(req.params.id);

    if (!drawerTray) {
      return res.status(404).json({ message: '抽屉柜托盘配置不存在' });
    }

    // 验证通道数
    if (!channels || !['1', '2', '3', '4'].includes(channels.toString())) {
      return res.status(400).json({ message: '通道数无效，必须为1、2、3或4' });
    }

    // 检查总通道数限制（仅针对副柜）
    const cabinet = await Cabinet.findByPk(drawerTray.cabinet_id);
    if (!cabinet.is_main) {
      const existingTrays = await DrawerTray.findAll({ 
        where: { 
          cabinet_id: drawerTray.cabinet_id,
          id: { [DrawerTray.sequelize.Op.ne]: drawerTray.id }
        } 
      });
      const currentTotalChannels = existingTrays.reduce((sum, tray) => sum + tray.channels, 0);
      const newTotalChannels = currentTotalChannels + parseInt(channels);
      
      if (newTotalChannels > 60) {
        return res.status(400).json({ message: '副柜总通道数不能超过60' });
      }
    }

    // 更新托盘配置
    await drawerTray.update({ channels: parseInt(channels) });

    res.status(200).json({
      message: '抽屉柜托盘配置更新成功',
      drawerTray
    });
  } catch (error) {
    res.status(500).json({ message: '更新抽屉柜托盘配置失败', error: error.message });
  }
};

// 删除抽屉柜托盘配置
exports.deleteDrawerTray = async (req, res) => {
  try {
    const drawerTray = await DrawerTray.findByPk(req.params.id);

    if (!drawerTray) {
      return res.status(404).json({ message: '抽屉柜托盘配置不存在' });
    }

    await drawerTray.destroy();

    res.status(200).json({ message: '抽屉柜托盘配置删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除抽屉柜托盘配置失败', error: error.message });
  }
};