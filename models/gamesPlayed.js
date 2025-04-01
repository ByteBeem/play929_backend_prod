const {  DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const GamePlayed = sequelize.define('GamePlayed', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    gameId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, 
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    transactionRef: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('in_progress', 'completed', 'failed'),
        defaultValue: 'in_progress'
    },
    outcome: {
        type: DataTypes.STRING,
        allowNull: true
    },
    duration: {
        type: DataTypes.STRING, 
        allowNull: false
    },

    expectedWinAmount: {
        type: DataTypes.STRING, 
        allowNull: false
    },
    snippetID: {
        type: DataTypes.STRING, 
        allowNull: false
    },
    startedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    endedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'games_played',
    timestamps: true, 
});

module.exports = GamePlayed;
