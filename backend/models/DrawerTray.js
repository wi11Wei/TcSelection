const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DrawerTray = sequelize.define('DrawerTray', {
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
  channels: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[1, 2, 3, 4]]
    }
  }
}, {
  tableName: 'drawer_tray',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['cabinet_id', 'tray_index']
    }
  ]
});

module.exports = DrawerTray;