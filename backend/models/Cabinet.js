const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cabinet = sequelize.define('Cabinet', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  solution_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'solution',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('spring', 'drawer'),
    allowNull: false
  },
  is_main: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'cabinet',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['solution_id', 'order_index']
    }
  ]
});

module.exports = Cabinet;