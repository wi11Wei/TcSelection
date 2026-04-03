const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SpringTray = sequelize.define('SpringTray', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  cabinet_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'cabinet',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  tray_index: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  interval_type: {
    type: DataTypes.ENUM('25mm', '35mm', '45mm'),
    allowNull: false
  }
}, {
  tableName: 'spring_tray',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['cabinet_id', 'tray_index']
    }
  ]
});

module.exports = SpringTray;