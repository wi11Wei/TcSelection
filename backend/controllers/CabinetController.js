const { Cabinet, Solution, SpringTray, DrawerTray } = require('../models');

// 获取方案下的所有柜子
exports.getCabinetsBySolutionId = async (req, res) => {
  try {
    const cabinets = await Cabinet.findAll({
      where: { solution_id: req.params.solutionId },
      include: [
        {
          model: SpringTray,
          as: 'spring_trays'
        },
        {
          model: DrawerTray,
          as: 'drawer_trays'
        }
      ],
      order: [['order_index', 'ASC']]
    });

    res.status(200).json(cabinets);
  } catch (error) {
    res.status(500).json({ message: '获取柜子列表失败', error: error.message });
  }
};

// 添加新柜子
exports.addCabinet = async (req, res) => {
  try {
    const { type, is_main } = req.body;
    const solutionId = req.params.solutionId;

    // 验证参数
    if (!type || !['spring', 'drawer'].includes(type)) {
      return res.status(400).json({ message: '柜子类型无效' });
    }

    // 检查方案是否存在
    const solution = await Solution.findByPk(solutionId);
    if (!solution) {
      return res.status(404).json({ message: '方案不存在' });
    }

    // 检查柜子数量限制
    const cabinetCount = await Cabinet.count({ where: { solution_id: solutionId } });
    if (cabinetCount >= 6) {
      return res.status(400).json({ message: '柜子数量不能超过6个' });
    }

    // 检查是否已有主柜
    if (is_main) {
      const mainCabinet = await Cabinet.findOne({ where: { solution_id: solutionId, is_main: true } });
      if (mainCabinet) {
        return res.status(400).json({ message: '已有主柜，不能再添加主柜' });
      }
    }

    // 确定order_index
    let orderIndex = 0;
    if (!is_main) {
      const maxOrderIndex = await Cabinet.max('order_index', { where: { solution_id: solutionId } });
      orderIndex = maxOrderIndex ? maxOrderIndex + 1 : 1;
    }

    // 创建柜子
    const cabinet = await Cabinet.create({
      solution_id: solutionId,
      type,
      is_main: is_main || false,
      order_index: orderIndex
    });

    // 如果是弹簧柜，自动创建8个托盘
    if (type === 'spring') {
      const springTrays = [];
      for (let i = 1; i <= 8; i++) {
        springTrays.push({
          cabinet_id: cabinet.id,
          tray_index: i,
          interval_type: '35mm' // 默认35mm间隔
        });
      }
      await SpringTray.bulkCreate(springTrays);
    }

    // 重新查询柜子信息，包含托盘
    const cabinetWithTrays = await Cabinet.findByPk(cabinet.id, {
      include: [
        {
          model: SpringTray,
          as: 'spring_trays'
        },
        {
          model: DrawerTray,
          as: 'drawer_trays'
        }
      ]
    });

    res.status(201).json({
      message: '柜子添加成功',
      cabinet: cabinetWithTrays
    });
  } catch (error) {
    res.status(500).json({ message: '添加柜子失败', error: error.message });
  }
};

// 更新柜子信息
exports.updateCabinet = async (req, res) => {
  try {
    const { type } = req.body;
    const cabinet = await Cabinet.findByPk(req.params.id);

    if (!cabinet) {
      return res.status(404).json({ message: '柜子不存在' });
    }

    // 柜子类型不能修改
    if (type && type !== cabinet.type) {
      return res.status(400).json({ message: '柜子类型不能修改' });
    }

    // 更新柜子信息
    await cabinet.update(req.body);

    // 重新查询柜子信息，包含托盘
    const updatedCabinet = await Cabinet.findByPk(cabinet.id, {
      include: [
        {
          model: SpringTray,
          as: 'spring_trays'
        },
        {
          model: DrawerTray,
          as: 'drawer_trays'
        }
      ]
    });

    res.status(200).json({
      message: '柜子更新成功',
      cabinet: updatedCabinet
    });
  } catch (error) {
    res.status(500).json({ message: '更新柜子失败', error: error.message });
  }
};

// 删除柜子
exports.deleteCabinet = async (req, res) => {
  try {
    const cabinet = await Cabinet.findByPk(req.params.id);

    if (!cabinet) {
      return res.status(404).json({ message: '柜子不存在' });
    }

    // 不能删除主柜
    if (cabinet.is_main) {
      return res.status(400).json({ message: '不能删除主柜' });
    }

    await cabinet.destroy();

    res.status(200).json({ message: '柜子删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除柜子失败', error: error.message });
  }
};