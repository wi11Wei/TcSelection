const { sequelize } = require('../config/database');

// 导入所有模型
const Solution = require('./Solution');
const Cabinet = require('./Cabinet');
const SpringTray = require('./SpringTray');
const DrawerTray = require('./DrawerTray');

// 定义模型之间的关系
Solution.hasMany(Cabinet, {
  foreignKey: 'solution_id',
  onDelete: 'CASCADE',
  as: 'cabinets'
});

Cabinet.belongsTo(Solution, {
  foreignKey: 'solution_id',
  as: 'solution'
});

Cabinet.hasMany(SpringTray, {
  foreignKey: 'cabinet_id',
  onDelete: 'CASCADE',
  as: 'spring_trays'
});

SpringTray.belongsTo(Cabinet, {
  foreignKey: 'cabinet_id',
  as: 'cabinet'
});

Cabinet.hasMany(DrawerTray, {
  foreignKey: 'cabinet_id',
  onDelete: 'CASCADE',
  as: 'drawer_trays'
});

DrawerTray.belongsTo(Cabinet, {
  foreignKey: 'cabinet_id',
  as: 'cabinet'
});

// 自动迁移数据库模型
const migrateDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('数据库迁移成功');
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
};

module.exports = {
  Solution,
  Cabinet,
  SpringTray,
  DrawerTray,
  migrateDatabase
};