const { SpringTray, Cabinet } = require('../models');

// 获取弹簧柜托盘配置
exports.getSpringTraysByCabinetId = async (req, res) => {
  try {
    const springTrays = await SpringTray.findAll({
      where: { cabinet_id: req.params.cabinetId },
      order: [['tray_index', 'ASC']]
    });

    res.status(200).json(springTrays);
  } catch (error) {
    res.status(500).json({ message: '获取弹簧柜托盘配置失败', error: error.message });
  }
};

// 更新弹簧柜托盘配置
exports.updateSpringTray = async (req, res) => {
  try {
    const { interval_type } = req.body;
    const springTray = await SpringTray.findByPk(req.params.id);

    if (!springTray) {
      return res.status(404).json({ message: '弹簧柜托盘配置不存在' });
    }

    // 验证间隔类型
    if (!interval_type || !['25mm', '35mm', '45mm'].includes(interval_type)) {
      return res.status(400).json({ message: '间隔类型无效' });
    }

    // 更新托盘配置
    await springTray.update({ interval_type });

    res.status(200).json({
      message: '弹簧柜托盘配置更新成功',
      springTray
    });
  } catch (error) {
    res.status(500).json({ message: '更新弹簧柜托盘配置失败', error: error.message });
  }
};

// 批量更新弹簧柜托盘配置
exports.batchUpdateSpringTrays = async (req, res) => {
  try {
    const { trays } = req.body;
    const cabinetId = req.params.cabinetId;

    // 验证柜子是否存在且为弹簧柜
    const cabinet = await Cabinet.findByPk(cabinetId);
    if (!cabinet) {
      return res.status(404).json({ message: '柜子不存在' });
    }
    if (cabinet.type !== 'spring') {
      return res.status(400).json({ message: '该柜子不是弹簧柜' });
    }

    // 验证托盘配置
    if (!Array.isArray(trays) || trays.length === 0) {
      return res.status(400).json({ message: '托盘配置无效' });
    }

    // 批量更新托盘配置
    const updatedTrays = [];
    for (const tray of trays) {
      const { id, interval_type } = tray;
      
      // 验证间隔类型
      if (!interval_type || !['25mm', '35mm', '45mm'].includes(interval_type)) {
        return res.status(400).json({ message: `托盘 ${id} 的间隔类型无效` });
      }

      // 更新托盘配置
      const springTray = await SpringTray.findByPk(id);
      if (!springTray) {
        return res.status(404).json({ message: `托盘 ${id} 不存在` });
      }
      if (springTray.cabinet_id !== parseInt(cabinetId)) {
        return res.status(400).json({ message: `托盘 ${id} 不属于该柜子` });
      }

      await springTray.update({ interval_type });
      updatedTrays.push(springTray);
    }

    res.status(200).json({
      message: '弹簧柜托盘配置批量更新成功',
      springTrays: updatedTrays
    });
  } catch (error) {
    res.status(500).json({ message: '批量更新弹簧柜托盘配置失败', error: error.message });
  }
};