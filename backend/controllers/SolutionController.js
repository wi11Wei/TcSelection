const { Solution, Cabinet, SpringTray, DrawerTray } = require('../models');

// 获取所有方案
exports.getAllSolutions = async (req, res) => {
  try {
    const solutions = await Solution.findAll({
      attributes: ['id', 'name', 'created_at', 'description']
    });
    res.status(200).json(solutions);
  } catch (error) {
    res.status(500).json({ message: '获取方案列表失败', error: error.message });
  }
};

// 获取单个方案详情
exports.getSolutionById = async (req, res) => {
  try {
    const solution = await Solution.findByPk(req.params.id, {
      include: [
        {
          model: Cabinet,
          as: 'cabinets',
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
        }
      ]
    });

    if (!solution) {
      return res.status(404).json({ message: '方案不存在' });
    }

    res.status(200).json(solution);
  } catch (error) {
    res.status(500).json({ message: '获取方案详情失败', error: error.message });
  }
};

// 创建新方案
exports.createSolution = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: '方案名称不能为空' });
    }

    const solution = await Solution.create({
      name,
      description
    });

    res.status(201).json({
      message: '方案创建成功',
      solution
    });
  } catch (error) {
    res.status(500).json({ message: '创建方案失败', error: error.message });
  }
};

// 更新方案
exports.updateSolution = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: '方案名称不能为空' });
    }

    const solution = await Solution.findByPk(req.params.id);
    
    if (!solution) {
      return res.status(404).json({ message: '方案不存在' });
    }

    await solution.update({
      name,
      description
    });

    res.status(200).json({
      message: '方案更新成功',
      solution
    });
  } catch (error) {
    res.status(500).json({ message: '更新方案失败', error: error.message });
  }
};

// 删除方案
exports.deleteSolution = async (req, res) => {
  try {
    const solution = await Solution.findByPk(req.params.id);
    
    if (!solution) {
      return res.status(404).json({ message: '方案不存在' });
    }

    await solution.destroy();

    res.status(200).json({ message: '方案删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除方案失败', error: error.message });
  }
};